import { UserIsland } from '@/types/atlas'

export const MOCK_PORTFOLIO: UserIsland = {
  totalValue: 25_000,   // Tier 3 — Colony (bridge arches + beacon tower unlocked)
  healthScore: 85,      // unlocks Fortress Walls milestone
  allocation: [
    { district: 'staking',  percentage: 45, value: 11_250 },
    { district: 'income',   percentage: 35, value: 8_750  },
    { district: 'growth',   percentage: 20, value: 5_000  },
  ],
  positions: [
    { opportunityId: 'meth', amount: 10,   entryDate: '2025-01-01', currentValue: 11_250, income: 40, yieldEarned: 350, shares: BigInt(0) },
    { opportunityId: 'usdy', amount: 8750, entryDate: '2025-01-01', currentValue: 8_750,  income: 25, yieldEarned: 200, shares: BigInt(0) },
  ],
}

export const DISTRICT_COLORS: Record<string, string> = {
  income:   '#34D186',
  staking:  '#3B82F6',
  growth:   '#A855F7',
  treasury: '#F59E0B',
  emerging: '#F97316',
  safety:   '#06B6D4',
}
