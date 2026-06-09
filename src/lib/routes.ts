import { AtlasRoute, UserIsland } from '@/types/atlas'

/**
 * Generate real routes based on the user's actual portfolio state.
 * Routes suggest where unallocated MNT should go to maximise income.
 */
export function generateRoutes(portfolio: UserIsland, liveAPY: Record<string, number>): AtlasRoute[] {
  const unallocated = portfolio.allocation.find(a => a.district === 'growth')?.value ?? 0
  const totalValue  = portfolio.totalValue
  const currentMonthly = portfolio.positions.reduce((s, p) => s + p.income, 0)

  if (totalValue <= 0 || unallocated <= 0) return []

  const suggestAmount = parseFloat((unallocated * 0.5).toFixed(2)) // suggest 50% of unallocated

  const routes: AtlasRoute[] = []

  // Route 1 — USDY income
  const usdyAPY = liveAPY['usdy'] ?? 5.1
  const usdyMonthly = (suggestAmount * usdyAPY) / 100 / 12
  routes.push({
    id: 'route-income-usdy',
    from: { label: 'Your Island' },
    to: { district: 'income', opportunityId: 'usdy', label: 'USDY · Income District' },
    steps: [
      { label: 'Current State', description: `$${totalValue.toFixed(0)} total · $${unallocated.toFixed(0)} unallocated`, amount: totalValue },
      { label: 'Move',          description: `Allocate $${suggestAmount.toFixed(0)} to USDY at ${usdyAPY}% APY`, amount: suggestAmount },
      { label: 'New Position',  description: `Earn $${(currentMonthly + usdyMonthly).toFixed(0)}/mo passively`, amount: totalValue },
    ],
    projectedMonthlyIncome: parseFloat((currentMonthly + usdyMonthly).toFixed(2)),
    projectedAnnualIncome:  parseFloat(((currentMonthly + usdyMonthly) * 12).toFixed(2)),
    healthDelta: Math.min(Math.round(suggestAmount / totalValue * 30), 20),
    riskDelta:  -5,
  })

  // Route 2 — mETH staking
  const methAPY = liveAPY['meth'] ?? 3.8
  const methMonthly = (suggestAmount * methAPY) / 100 / 12
  routes.push({
    id: 'route-staking-meth',
    from: { label: 'Your Island' },
    to: { district: 'staking', opportunityId: 'meth', label: 'mETH · Staking District' },
    steps: [
      { label: 'Current State', description: `$${totalValue.toFixed(0)} total · $${unallocated.toFixed(0)} unallocated`, amount: totalValue },
      { label: 'Move',          description: `Stake $${suggestAmount.toFixed(0)} into mETH at ${methAPY}% APY`, amount: suggestAmount },
      { label: 'New Position',  description: `Earn $${(currentMonthly + methMonthly).toFixed(0)}/mo from staking`, amount: totalValue },
    ],
    projectedMonthlyIncome: parseFloat((currentMonthly + methMonthly).toFixed(2)),
    projectedAnnualIncome:  parseFloat(((currentMonthly + methMonthly) * 12).toFixed(2)),
    healthDelta: Math.min(Math.round(suggestAmount / totalValue * 20), 15),
    riskDelta:  -3,
  })

  return routes
}
