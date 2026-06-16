export type DistrictType = 'income' | 'staking' | 'growth' | 'treasury' | 'emerging' | 'safety' | 'unallocated'

export interface District {
  id: DistrictType
  name: string
  color: string
  position: [number, number, number]
  description: string
  opportunities: Opportunity[]
}

export interface Opportunity {
  id: string
  name: string
  district: DistrictType
  apy: number
  risk: 'low' | 'medium' | 'high'
  minCapital: number
  description: string
  protocol: string
  asset: string
  mantleNative: boolean
  comingSoon?: boolean
}

export interface UserIsland {
  totalValue: number
  healthScore: number
  allocation: {
    district: DistrictType
    percentage: number
    value: number
  }[]
  positions: Position[]
}

export interface Position {
  opportunityId: string
  amount: number        // MNT deposited
  entryDate: string
  currentValue: number  // USD current value (principal + yield)
  income: number        // projected monthly income USD
  yieldEarned: number   // USD yield earned so far
  shares: bigint        // raw shares for withdraw call
}

export interface AtlasRoute {
  id: string
  from: { district?: DistrictType; label: string }
  to: { district: DistrictType; opportunityId: string; label: string }
  steps: RouteStep[]
  projectedMonthlyIncome: number
  projectedAnnualIncome: number
  healthDelta: number
  riskDelta: number
}

export interface RouteStep {
  label: string
  description: string
  amount: number
}

export type CameraLevel = 1 | 2 | 3

export type GoalType = 'income' | 'growth' | 'protect' | 'custom'

export interface UserGoal {
  type: GoalType
  label: string
  targetMonthlyIncome?: number  // for income goal
  targetPortfolioValue?: number // for growth goal
  customText?: string           // for custom goal
}
