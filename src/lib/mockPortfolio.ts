import { UserIsland } from '@/types/atlas'

export const MOCK_PORTFOLIO: UserIsland = {
  totalValue: 4280,
  healthScore: 72,
  allocation: [
    { district: 'growth',  percentage: 62, value: 2653 },
    { district: 'staking', percentage: 18, value: 770  },
    { district: 'income',  percentage: 8,  value: 342  },
    { district: 'safety',  percentage: 12, value: 514  },
  ],
  positions: [
    { opportunityId: 'meth', amount: 0.28, entryDate: '2025-11-14', currentValue: 770, income: 29, yieldEarned: 0, shares: BigInt(0) },
    { opportunityId: 'usdy', amount: 342,  entryDate: '2025-12-01', currentValue: 342, income: 17, yieldEarned: 0, shares: BigInt(0) },
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
