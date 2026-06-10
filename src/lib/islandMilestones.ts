// Island milestone system — buildings unlock based on yield performance
// These are separate from TVL tiers — they reward *earning*, not just depositing

import { UserIsland } from '@/types/atlas'

export interface IslandMilestone {
  id: string
  name: string
  description: string   // what the user did to earn it
  flavor: string        // what appeared on the island
  color: string
  // The condition that unlocks this milestone
  check: (stats: IslandStats) => boolean
}

export interface IslandStats {
  totalYieldEarned: number    // cumulative USD yield
  monthlyIncome: number       // current monthly income rate
  positionCount: number       // number of active positions
  districtCount: number       // number of distinct districts
  healthScore: number         // current health score
  totalValue: number          // total TVL
  topApy: number              // highest APY across positions
}

export const MILESTONES: IslandMilestone[] = [
  {
    id: 'first_yield',
    name: 'First Harvest',
    description: 'Earned first yield',
    flavor: 'A glowing fountain appears at the center of your island',
    color: '#34D186',
    check: s => s.totalYieldEarned >= 1,
  },
  {
    id: 'ten_earned',
    name: 'Market Pulse',
    description: 'Earned $10 in yield',
    flavor: 'A trading post rises near the docks',
    color: '#3B82F6',
    check: s => s.totalYieldEarned >= 10,
  },
  {
    id: 'diversified',
    name: 'Multi-District',
    description: 'Active in 2+ districts',
    flavor: 'A connecting bridge spans between zones',
    color: '#8B5CF6',
    check: s => s.districtCount >= 2,
  },
  {
    id: 'healthy',
    name: 'Iron Fortress',
    description: 'Health score above 80',
    flavor: 'Fortress walls surround your island perimeter',
    color: '#F59E0B',
    check: s => s.healthScore >= 80,
  },
  {
    id: 'hundred_earned',
    name: 'Yield Garden',
    description: 'Earned $100 in yield',
    flavor: 'A glowing yield garden blooms across the hillside',
    color: '#34D186',
    check: s => s.totalYieldEarned >= 100,
  },
  {
    id: 'monthly_income',
    name: 'Income Engine',
    description: '$50/month passive income',
    flavor: 'An observatory dome rises — watching the markets 24/7',
    color: '#06B6D4',
    check: s => s.monthlyIncome >= 50,
  },
  {
    id: 'full_spread',
    name: 'Grand Network',
    description: 'Active in 3+ districts',
    flavor: 'A grand network hub connects all your territories',
    color: '#EC4899',
    check: s => s.districtCount >= 3,
  },
  {
    id: 'five_hundred_earned',
    name: 'Atlas Temple',
    description: 'Earned $500 in yield',
    flavor: 'An ancient temple emerges — monument to your returns',
    color: '#F97316',
    check: s => s.totalYieldEarned >= 500,
  },
]

export function computeIslandStats(portfolio: UserIsland): IslandStats {
  const totalYieldEarned = portfolio.positions.reduce((s, p) => s + (p.yieldEarned ?? 0), 0)
  const monthlyIncome = portfolio.positions.reduce((s, p) => s + p.income, 0)
  const districtCount = new Set(portfolio.allocation.map(a => a.district)).size
  const positionCount = portfolio.positions.length
  return {
    totalYieldEarned,
    monthlyIncome,
    positionCount,
    districtCount,
    healthScore: portfolio.healthScore,
    totalValue: portfolio.totalValue,
    topApy: 0, // can wire in later
  }
}

export function getUnlockedMilestones(portfolio: UserIsland): IslandMilestone[] {
  const stats = computeIslandStats(portfolio)
  return MILESTONES.filter(m => m.check(stats))
}

export function getLockedMilestones(portfolio: UserIsland): IslandMilestone[] {
  const stats = computeIslandStats(portfolio)
  return MILESTONES.filter(m => !m.check(stats))
}
