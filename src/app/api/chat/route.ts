import Anthropic from '@anthropic-ai/sdk'
import { loadMemory, saveMemory, buildMemoryContext } from '@/lib/supabase/memory'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Atlas Navigator — the AI brain of Atlas, a 3D wealth exploration platform on Mantle blockchain.

Your role: guide users to put their capital to work. You can both advise AND execute real on-chain allocations.

You have a live chain scanner — every conversation includes the top opportunities scouted from Mantle right now via DeFiLlama. When the user asks to "scout the chain", "find the best opportunity", or "what's available", use the live data block below (not the static list). Always cite the current APY and TVL so the user knows it's real-time.

## The Assets (live Mantle ecosystem — APYs are approximate, fetched from mainnet)
Executable now: usdy · musd · meth
Coming soon: mnt-lp · lendle-mnt · init-capital · mnt-staking

- **USDY** (Income District) — Ondo Finance T-bill yield. ~5.1% APY. Lowest risk. Dollar-stable.
- **mUSD** (Income District) — Mantle native stablecoin yield. ~4.8% APY. Low risk.
- **mETH** (Staking District) — Mantle LSP liquid staked ETH. ~3.8% APY. Low risk. ETH-correlated.
- **MNT/USDT LP** (Growth District) — Agni Finance DEX pool. ~14% APY. Medium risk. Impermanent loss possible.
- **MNT Lending** (Growth District) — Lendle money market. ~8.6% APY. Medium risk. Variable rate.
- **INIT Capital** (Emerging District) — Composable liquidity hooks. ~18% APY. High risk. Early incentives.
- **Cleopatra** (Emerging District) — veNFT-based DEX. ~22% APY. High risk. Emission-dependent.
- **MNT Staking** (Safety District) — Native validator staking. ~2.8% APY. Safest option, no smart contract risk.

## The Districts
Income (USDY, mUSD) · Staking (mETH) · Growth (MNT-LP, Lendle) · Treasury (diversified index) · Emerging (INIT, Cleopatra) · Safety (MNT Staking, USDY Safe Hold)

## Portfolio Health Score
20 base + up to 60 for diversification (20 per vault) + up to 20 for income ratio. Max 100.
Unallocated MNT = health 20. First deposit = health 40+.

## Your Personality
- Razor sharp. 1-3 sentences. No fluff.
- Spatial metaphors — "route", "destination", "district", "territory", "plot"
- Never say "Great question!" or "Certainly!" or "Of course!"
- Treat the user as a capable investor. Skip disclaimers.
- Give a concrete recommendation when asked anything vague. Never give a menu.
- When you have portfolio data, always reference their actual numbers — never speak in generalities.
- Proactive: if you see idle capital, point it out unprompted.
- When returning user profile is present: reference their history naturally. Never say "I remember" — just use the knowledge.

## Response Rules
- If idle capital exists (health ≤ 20 or large unallocated amount): lead with the opportunity cost
- If asked "what's best": pick ONE and justify it in one sentence
- If asked to compare: give a winner with a reason, not a table
- If asked anything about APY/yield: give exact numbers from the asset list above
- Never hedge with "it depends" — make a call

## Executing Allocations
You can trigger a real on-chain deposit directly. When the user confirms an allocation (says "yes", "do it", "execute", "go ahead", "plot it", "allocate it", or similar affirmative after you've suggested an amount and asset), end your message with:

[ACTION:allocate:OPPORTUNITY_ID:AMOUNT_USD]

Rules:
- OPPORTUNITY_ID must be one of: usdy, musd, meth
- AMOUNT_USD is a plain number (no $ sign, no quotes)
- Only emit when the user has explicitly confirmed with enough context to act (you know both asset and amount)
- If the user says "allocate $100 to mETH" — that IS a confirmation, emit immediately
- If the user says "yes" to your previous suggestion — emit with those exact values
- Never emit speculatively or before confirmation`

// Fetch live scouted opportunities (cached 5 min server-side)
async function fetchScoutData(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/scout`)
    if (!res.ok) return ''
    const { opportunities } = await res.json()
    if (!opportunities?.length) return ''

    const lines = ['\n\n## Live Mantle Opportunities (scouted right now from on-chain data)']
    lines.push('These are REAL current yields fetched from DeFiLlama. Use these numbers — they override the static APYs above.')
    opportunities.slice(0, 8).forEach((op: {
      protocol: string; symbol: string; apy: number; tvlUsd: number;
      risk: string; district: string; stablecoin: boolean; apyChange7d: number | null
    }) => {
      const trend = op.apyChange7d !== null
        ? (op.apyChange7d > 0 ? ` ↑${op.apyChange7d}% 7d` : ` ↓${Math.abs(op.apyChange7d)}% 7d`)
        : ''
      const tvlFmt = op.tvlUsd > 1_000_000
        ? `$${(op.tvlUsd / 1_000_000).toFixed(1)}M TVL`
        : `$${(op.tvlUsd / 1_000).toFixed(0)}K TVL`
      lines.push(`- ${op.protocol} ${op.symbol}: ${op.apy}% APY${trend} · ${tvlFmt} · ${op.risk} risk · ${op.district} District${op.stablecoin ? ' · stable' : ''}`)
    })
    lines.push('\nWhen asked "what\'s the best opportunity" or "scout the chain" — use THESE numbers, not the static list. Rank by risk-adjusted return for the user\'s profile.')
    return lines.join('\n')
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  const { messages, portfolioContext, wallet } = await req.json()

  // Load memory + scout data in parallel
  const [memory, scoutBlock] = await Promise.all([
    wallet ? loadMemory(wallet) : Promise.resolve(null),
    fetchScoutData(),
  ])

  let memoryContext = ''
  if (memory) {
    memoryContext = buildMemoryContext(memory)
  }

  // Build live portfolio block
  let portfolioBlock = ''
  if (portfolioContext) {
    const { totalValue, healthScore, monthlyIncome, allocation, positions } = portfolioContext
    const unallocated = allocation?.find((a: { district: string }) => a.district === 'growth')?.value ?? 0
    const invested = totalValue - unallocated

    portfolioBlock = `\n\n## User's Live Portfolio
- Total capital: $${Number(totalValue).toFixed(2)}
- Invested in vaults: $${Number(invested).toFixed(2)}
- Idle / unallocated: $${Number(unallocated).toFixed(2)}
- Monthly income: $${Number(monthlyIncome).toFixed(2)}/mo
- Health score: ${healthScore}/100`

    if (positions?.length) {
      portfolioBlock += `\n- Active positions: ${positions.map((p: { opportunityId: string; currentValue: number; yieldEarned: number }) =>
        `${p.opportunityId.toUpperCase()} ($${Number(p.currentValue).toFixed(2)}, +$${Number(p.yieldEarned).toFixed(4)} yield)`
      ).join(', ')}`
    } else {
      portfolioBlock += `\n- Active positions: none (all capital is idle)`
    }

    if (unallocated > 5) {
      portfolioBlock += `\n\n⚠ The user has $${Number(unallocated).toFixed(2)} sitting idle earning 0%. Surface this proactively.`
    }
  }

  const systemWithContext = [SYSTEM_PROMPT, scoutBlock, portfolioBlock, memoryContext].join('')

  let fullResponse = ''

  const stream = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 350,
    system: [{ type: 'text', text: systemWithContext, cache_control: { type: 'ephemeral' } }],
    messages,
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullResponse += event.delta.text
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()

      // ── Save raw messages ──
      if (wallet && messages.length > 0) {
        const lastUserMsg = messages[messages.length - 1]
        const updatedMessages = [
          ...(memory?.messages ?? []),
          { role: 'user' as const, content: lastUserMsg.content },
          { role: 'assistant' as const, content: fullResponse },
        ].slice(-20)

        await saveMemory({
          wallet,
          messages: updatedMessages,
          context: memory?.context ?? {},
          updatedAt: new Date().toISOString(),
        })

        // ── Fire-and-forget profile extraction every 2nd message ──
        const totalMessages = updatedMessages.length
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        if (totalMessages % 2 === 0) {
          fetch(`${baseUrl}/api/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet, messages: updatedMessages.slice(-6) }),
          }).catch(() => {/* silent */})
        }

        // ── On-chain decision logging (Hackathon criteria 1 & 3) ──
        // If Navigator recommended an allocation, record it permanently on Mantle
        const actionMatch = fullResponse.match(/\[ACTION:allocate:(\w[\w-]*):(\d+(?:\.\d+)?)\]/)
        if (actionMatch) {
          const [, opportunityId, amountStr] = actionMatch
          const lastUserContent = messages[messages.length - 1]?.content ?? ''
          fetch(`${baseUrl}/api/decisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decisionType:   'opportunity_recommendation',
              opportunityId,
              amountUsd:      parseFloat(amountStr),
              userAddress:    wallet,
              reasoning:      lastUserContent.slice(0, 200),
            }),
          }).catch(() => {/* silent — never block the chat */})
        }
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
