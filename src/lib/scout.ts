// Shared scout logic — used by /api/scout and /api/agent/monitor

const PROTOCOL_META: Record<string, {
  label: string
  risk: 'low' | 'medium' | 'high'
  district: string
}> = {
  'ondo-yield-assets':  { label: 'Ondo Finance',    risk: 'low',    district: 'Income' },
  'aave-v3':            { label: 'Aave v3',          risk: 'low',    district: 'Income' },
  'mantle-lsp':         { label: 'Mantle LSP',       risk: 'low',    district: 'Staking' },
  'circuit-protocol':   { label: 'Circuit Protocol', risk: 'low',    district: 'Staking' },
  'clearpool-lending':  { label: 'Clearpool',        risk: 'medium', district: 'Growth' },
  'agni-finance':       { label: 'Agni Finance',     risk: 'medium', district: 'Growth' },
  'lendle':             { label: 'Lendle',            risk: 'medium', district: 'Growth' },
  'init-capital':       { label: 'INIT Capital',     risk: 'high',   district: 'Emerging' },
  'cleopatra-exchange': { label: 'Cleopatra',        risk: 'high',   district: 'Emerging' },
  'fluxion-network':    { label: 'Fluxion',          risk: 'high',   district: 'Emerging' },
  'symbiosis':          { label: 'Symbiosis',        risk: 'medium', district: 'Growth' },
}

export interface ScoutedOpportunity {
  id: string
  protocol: string
  project: string
  symbol: string
  apy: number
  apyBase: number
  apyReward: number
  tvlUsd: number
  risk: 'low' | 'medium' | 'high'
  district: string
  stablecoin: boolean
  ilRisk: string | null
  apyChange7d: number | null
  score: number
}

function calcScore(apy: number, tvl: number, risk: 'low' | 'medium' | 'high'): number {
  const RISK_DISCOUNT = { low: 1.0, medium: 0.7, high: 0.45 }
  const tvlConfidence = Math.min(Math.log10(Math.max(tvl, 1000)) / 8, 1)
  return apy * RISK_DISCOUNT[risk] * (0.6 + tvlConfidence * 0.4)
}

let _cache: { data: ScoutedOpportunity[]; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function fetchScoutedOpportunities(): Promise<ScoutedOpportunity[]> {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) return _cache.data

  const res = await fetch('https://yields.llama.fi/pools', {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`DeFiLlama ${res.status}`)

  const { data } = await res.json() as { data: Record<string, unknown>[] }

  const opportunities: ScoutedOpportunity[] = data
    .filter(p =>
      p.chain === 'Mantle' &&
      typeof p.project === 'string' &&
      p.project in PROTOCOL_META &&
      typeof p.apy === 'number' &&
      p.apy > 0 &&
      !p.outlier &&
      typeof p.tvlUsd === 'number' &&
      (p.tvlUsd as number) > 10_000,
    )
    .map(p => {
      const meta  = PROTOCOL_META[p.project as string]
      const apy   = p.apy as number
      const tvl   = p.tvlUsd as number
      return {
        id:          p.pool as string,
        protocol:    meta.label,
        project:     p.project as string,
        symbol:      p.symbol as string,
        apy:         Math.round(apy * 100) / 100,
        apyBase:     Math.round((p.apyBase as number || 0) * 100) / 100,
        apyReward:   Math.round((p.apyReward as number || 0) * 100) / 100,
        tvlUsd:      Math.round(tvl),
        risk:        meta.risk,
        district:    meta.district,
        stablecoin:  !!p.stablecoin,
        ilRisk:      p.ilRisk as string | null,
        apyChange7d: typeof p.apyPct7D === 'number' ? Math.round((p.apyPct7D as number) * 100) / 100 : null,
        score:       calcScore(apy, tvl, meta.risk),
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  _cache = { data: opportunities, fetchedAt: Date.now() }
  return opportunities
}
