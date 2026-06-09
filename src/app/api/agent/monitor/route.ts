import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { fetchScoutedOpportunities, ScoutedOpportunity } from '@/lib/scout'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const APY_CHANGE_THRESHOLD = 0.4  // % — alert if APY shifts by this much

type ScoutOpportunity = ScoutedOpportunity

interface ApySnapshot {
  opportunity_id: string
  apy: number
  protocol: string
  symbol: string
}

interface PortfolioSnapshot {
  wallet: string
  total_value: number
  monthly_income: number
  health_score: number
}

interface ApyChange {
  op: ScoutOpportunity
  prev: number
  curr: number
  delta: number
}

// ── Fetch live opportunities ──────────────────────────────────────────────────
async function fetchLiveOpportunities(): Promise<ScoutOpportunity[]> {
  try {
    return await fetchScoutedOpportunities()
  } catch {
    return []
  }
}

// ── Load last APY snapshots from Supabase ────────────────────────────────────
async function loadSnapshots(): Promise<Record<string, ApySnapshot>> {
  const { data } = await supabase.from('apy_snapshots').select('*')
  if (!data) return {}
  return Object.fromEntries(data.map((r: ApySnapshot) => [r.opportunity_id, r]))
}

// ── Save updated APY snapshots ───────────────────────────────────────────────
async function saveSnapshots(opportunities: ScoutOpportunity[]) {
  const rows = opportunities.map(op => ({
    opportunity_id: `${op.protocol}-${op.symbol}`.toLowerCase().replace(/\s+/g, '-'),
    apy:            op.apy,
    protocol:       op.protocol,
    symbol:         op.symbol,
    updated_at:     new Date().toISOString(),
  }))
  await supabase.from('apy_snapshots').upsert(rows, { onConflict: 'opportunity_id' })
}

// ── Get wallets with recent activity ─────────────────────────────────────────
async function getActiveWallets(): Promise<PortfolioSnapshot[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // last 7 days
  const { data } = await supabase
    .from('portfolio_snapshots')
    .select('wallet, total_value, monthly_income, health_score')
    .gte('ts', since)
    .order('ts', { ascending: false })

  if (!data) return []

  // Deduplicate — latest snapshot per wallet
  const seen = new Set<string>()
  return data.filter((r: PortfolioSnapshot) => {
    if (seen.has(r.wallet)) return false
    seen.add(r.wallet)
    return true
  })
}

// ── Generate alert message via Claude ────────────────────────────────────────
async function generateAlert(
  wallet: string,
  changes: ApyChange[],
  portfolio: PortfolioSnapshot
): Promise<{ message: string; action: string } | null> {
  const changeDesc = changes
    .map(c => `${c.op.protocol} ${c.op.symbol}: ${c.prev.toFixed(2)}% → ${c.curr.toFixed(2)}% (${c.delta > 0 ? '+' : ''}${c.delta.toFixed(2)}%)`)
    .join('\n')

  const prompt = `You are Atlas Navigator — an autonomous AI wealth agent on Mantle.

You detected these APY changes in the last monitoring cycle:
${changeDesc}

User portfolio context:
- Total value: $${portfolio.total_value.toFixed(2)}
- Monthly income: $${portfolio.monthly_income.toFixed(2)}/mo
- Health score: ${portfolio.health_score}/100

Generate a SHORT proactive alert (2-3 sentences max). Be direct and specific:
- State what changed and by how much
- Give ONE concrete action recommendation
- Use spatial language (route, district, territory, replot)
- Never say "I noticed" or "I detected" — just state the facts

End with a JSON action tag on a new line:
[ACTION:${changes[0].delta < 0 ? 'rebalance' : 'allocate'}]`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 120,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const actionMatch = text.match(/\[ACTION:(\w+)\]/)
  const message = text.replace(/\[ACTION:\w+\]/g, '').trim()
  const action = actionMatch?.[1] ?? 'monitor'

  return message ? { message, action } : null
}

// ── Save alert to Supabase ───────────────────────────────────────────────────
async function saveAlert(
  wallet: string,
  change: ApyChange,
  message: string,
  action: string
) {
  await supabase.from('agent_alerts').insert({
    wallet:         wallet.toLowerCase(),
    opportunity_id: `${change.op.protocol}-${change.op.symbol}`.toLowerCase(),
    message,
    apy_from:       change.prev,
    apy_to:         change.curr,
    action,
    read:           false,
    created_at:     new Date().toISOString(),
  })
}

// ── Log autonomous decision on-chain ─────────────────────────────────────────
async function logDecision(changes: ApyChange[], affectedWallets: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  await fetch(`${baseUrl}/api/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decisionType:   'autonomous_monitoring',
      opportunityId:  changes[0]?.op?.symbol?.toLowerCase() ?? 'multi',
      amountUsd:      0,
      userAddress:    '0x0000000000000000000000000000000000000000', // agent address
      reasoning:      `Autonomous APY monitor detected ${changes.length} yield shift(s) affecting ${affectedWallets} user(s). Changes: ${changes.map(c => `${c.op.symbol} ${c.delta > 0 ? '+' : ''}${c.delta.toFixed(2)}%`).join(', ')}`,
    }),
  }).catch(() => {/* silent */})
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 1. Fetch live APYs + last snapshots in parallel
    const [opportunities, lastSnapshots] = await Promise.all([
      fetchLiveOpportunities(),
      loadSnapshots(),
    ])

    if (!opportunities.length) {
      return Response.json({ ok: true, message: 'No opportunities fetched', alerts: 0 })
    }

    // 2. Detect meaningful APY changes
    const changes: ApyChange[] = []
    for (const op of opportunities) {
      const key = `${op.protocol}-${op.symbol}`.toLowerCase().replace(/\s+/g, '-')
      const prev = lastSnapshots[key]
      if (!prev) continue  // first run — no baseline yet
      const delta = op.apy - prev.apy
      if (Math.abs(delta) >= APY_CHANGE_THRESHOLD) {
        changes.push({ op, prev: prev.apy, curr: op.apy, delta })
      }
    }

    // 3. Save updated snapshots (baseline for next run)
    await saveSnapshots(opportunities)

    if (!changes.length) {
      return Response.json({ ok: true, message: 'No significant APY changes detected', alerts: 0 })
    }

    // 4. Get active wallets to alert
    const activeWallets = await getActiveWallets()
    if (!activeWallets.length) {
      return Response.json({ ok: true, message: `${changes.length} changes detected, no active wallets`, alerts: 0 })
    }

    // 5. Generate + save alerts for each wallet (max 3 changes per alert)
    let alertCount = 0
    const topChanges = changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)

    for (const portfolio of activeWallets) {
      const result = await generateAlert(portfolio.wallet, topChanges, portfolio)
      if (!result) continue

      await saveAlert(portfolio.wallet, topChanges[0], result.message, result.action)
      alertCount++
    }

    // 6. Log autonomous decision on Mantle
    await logDecision(topChanges, activeWallets.length)

    return Response.json({
      ok: true,
      changes: changes.length,
      walletsAlerted: alertCount,
      shifts: topChanges.map(c => ({
        opportunity: `${c.op.protocol} ${c.op.symbol}`,
        from: c.prev,
        to: c.curr,
        delta: c.delta,
      })),
    })

  } catch (err) {
    console.error('[agent/monitor]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
