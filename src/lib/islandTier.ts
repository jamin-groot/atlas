// Island tier system — maps portfolio TVL to a visual growth stage
// Each tier unlocks new 3D elements on the user's island

export interface IslandTier {
  tier: number           // 0–5
  name: string           // display name
  label: string          // short tag
  minTvl: number         // USD threshold
  nextTvl: number | null // next threshold (null = max)
  scale: number          // base island scale multiplier
  layers: number         // how many base platform layers (1–4)
  rings: number          // orbit rings (1–3)
  hasBeacon: boolean     // tall beacon tower
  hasBridge: boolean     // bridge arches
  hasCity: boolean       // city skyline spires
  color: string          // tier accent color
  glow: number           // glow intensity multiplier
  description: string    // shown in UI
}

export const ISLAND_TIERS: IslandTier[] = [
  {
    tier: 0, name: 'Seedling', label: 'SEED',
    minTvl: 0, nextTvl: 1_000,
    scale: 0.65, layers: 1, rings: 1,
    hasBeacon: false, hasBridge: false, hasCity: false,
    color: '#4B5563', glow: 0.6,
    description: 'Your island is just beginning to form.',
  },
  {
    tier: 1, name: 'Settlement', label: 'SETTLE',
    minTvl: 1_000, nextTvl: 5_000,
    scale: 0.82, layers: 2, rings: 1,
    hasBeacon: false, hasBridge: false, hasCity: false,
    color: '#3B82F6', glow: 0.75,
    description: 'A small settlement takes root.',
  },
  {
    tier: 2, name: 'Outpost', label: 'OUTPOST',
    minTvl: 5_000, nextTvl: 20_000,
    scale: 1.0, layers: 2, rings: 2,
    hasBeacon: true, hasBridge: false, hasCity: false,
    color: '#8B5CF6', glow: 0.9,
    description: 'A beacon tower rises from your island.',
  },
  {
    tier: 3, name: 'Colony', label: 'COLONY',
    minTvl: 20_000, nextTvl: 100_000,
    scale: 1.22, layers: 3, rings: 2,
    hasBeacon: true, hasBridge: true, hasCity: false,
    color: '#F59E0B', glow: 1.1,
    description: 'Bridges connect your growing districts.',
  },
  {
    tier: 4, name: 'City', label: 'CITY',
    minTvl: 100_000, nextTvl: 500_000,
    scale: 1.45, layers: 3, rings: 3,
    hasBeacon: true, hasBridge: true, hasCity: true,
    color: '#34D186', glow: 1.3,
    description: 'A thriving city floats in the Atlas world.',
  },
  {
    tier: 5, name: 'Metropolis', label: 'METRO',
    minTvl: 500_000, nextTvl: null,
    scale: 1.75, layers: 4, rings: 3,
    hasBeacon: true, hasBridge: true, hasCity: true,
    color: '#F97316', glow: 1.6,
    description: 'A legendary metropolis — eligible for tokenization.',
  },
]

export function getIslandTier(tvlUsd: number): IslandTier {
  for (let i = ISLAND_TIERS.length - 1; i >= 0; i--) {
    if (tvlUsd >= ISLAND_TIERS[i].minTvl) return ISLAND_TIERS[i]
  }
  return ISLAND_TIERS[0]
}

export function getTierProgress(tvlUsd: number): number {
  const tier = getIslandTier(tvlUsd)
  if (!tier.nextTvl) return 1
  const range = tier.nextTvl - tier.minTvl
  const progress = tvlUsd - tier.minTvl
  return Math.min(progress / range, 1)
}

export function getNextTierLabel(tvlUsd: number): string | null {
  const tier = getIslandTier(tvlUsd)
  if (!tier.nextTvl) return null
  const next = ISLAND_TIERS[tier.tier + 1]
  const needed = tier.nextTvl - tvlUsd
  return `$${needed.toLocaleString()} to ${next.name}`
}
