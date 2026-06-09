import { supabase } from './client'

export interface PortfolioSnapshot {
  wallet: string
  ts: string             // ISO timestamp
  totalValue: number     // USD
  healthScore: number
  monthlyIncome: number  // USD
  yieldEarned: number    // USD cumulative
  event?: string         // e.g. 'deposit:usdy:$208'
}

export async function saveSnapshot(snap: PortfolioSnapshot): Promise<void> {
  await supabase.from('portfolio_snapshots').insert({
    wallet: snap.wallet.toLowerCase(),
    ts: snap.ts,
    total_value: snap.totalValue,
    health_score: snap.healthScore,
    monthly_income: snap.monthlyIncome,
    yield_earned: snap.yieldEarned,
    event: snap.event ?? null,
  })
}

export async function loadSnapshots(wallet: string): Promise<PortfolioSnapshot[]> {
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .order('ts', { ascending: true })
    .limit(100)

  if (error || !data) return []

  return data.map(r => ({
    wallet: r.wallet,
    ts: r.ts,
    totalValue: r.total_value,
    healthScore: r.health_score,
    monthlyIncome: r.monthly_income,
    yieldEarned: r.yield_earned,
    event: r.event,
  }))
}
