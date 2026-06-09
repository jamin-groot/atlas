import { supabase } from '@/lib/supabase/client'
import { NextRequest } from 'next/server'

// GET /api/snapshots?wallet=0x...
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return Response.json({ error: 'wallet required' }, { status: 400 })

  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .order('ts', { ascending: true })
    .limit(100)

  if (error) return Response.json({ snapshots: [] })
  return Response.json({ snapshots: data })
}

// POST /api/snapshots
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { wallet, totalValue, healthScore, monthlyIncome, yieldEarned, event } = body

  const { error } = await supabase.from('portfolio_snapshots').insert({
    wallet: wallet.toLowerCase(),
    ts: new Date().toISOString(),
    total_value: totalValue,
    health_score: healthScore,
    monthly_income: monthlyIncome,
    yield_earned: yieldEarned,
    event: event ?? null,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
