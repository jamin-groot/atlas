import { AtlasRoute, UserIsland, UserGoal } from '@/types/atlas'

export function generateRoutes(
  portfolio: UserIsland,
  liveAPY: Record<string, number>,
  goal?: UserGoal | null,
): AtlasRoute[] {
  const unallocated = portfolio.allocation.find(a => a.district === 'growth')?.value ?? 0
  const totalValue  = portfolio.totalValue
  const currentMonthly = portfolio.positions.reduce((s, p) => s + p.income, 0)

  if (totalValue <= 0 || unallocated <= 0) return []

  const suggestAmount = parseFloat((unallocated * 0.5).toFixed(2))
  const usdyAPY = liveAPY['usdy'] ?? 5.1
  const methAPY = liveAPY['meth'] ?? 3.8
  const musdAPY = liveAPY['musd'] ?? 4.2

  const usdyMonthly = (suggestAmount * usdyAPY) / 100 / 12
  const methMonthly = (suggestAmount * methAPY) / 100 / 12
  const musdMonthly = (suggestAmount * musdAPY) / 100 / 12

  const incomeTargetMsg = goal?.targetMonthlyIncome
    ? ` — ${Math.min(100, Math.round(((currentMonthly + usdyMonthly) / goal.targetMonthlyIncome) * 100))}% toward $${goal.targetMonthlyIncome}/mo goal`
    : ''
  const growthTargetMsg = goal?.targetPortfolioValue
    ? ` — ${Math.min(100, Math.round((totalValue / goal.targetPortfolioValue) * 100))}% toward $${goal.targetPortfolioValue.toLocaleString()} goal`
    : ''

  const routeUSDY: AtlasRoute = {
    id: 'route-income-usdy',
    from: { label: 'Your Island' },
    to: { district: 'income', opportunityId: 'usdy', label: 'USDY · Income District' },
    steps: [
      { label: 'Current State', description: `$${totalValue.toFixed(0)} total · $${currentMonthly.toFixed(0)}/mo income`, amount: totalValue },
      { label: 'Move',          description: `Allocate $${suggestAmount.toFixed(0)} to USDY at ${usdyAPY}% APY`, amount: suggestAmount },
      { label: 'New Position',  description: `Earn $${(currentMonthly + usdyMonthly).toFixed(0)}/mo${incomeTargetMsg}`, amount: totalValue },
    ],
    projectedMonthlyIncome: parseFloat((currentMonthly + usdyMonthly).toFixed(2)),
    projectedAnnualIncome:  parseFloat(((currentMonthly + usdyMonthly) * 12).toFixed(2)),
    healthDelta: Math.min(Math.round(suggestAmount / totalValue * 30), 20),
    riskDelta:  -5,
  }

  const routeMETH: AtlasRoute = {
    id: 'route-staking-meth',
    from: { label: 'Your Island' },
    to: { district: 'staking', opportunityId: 'meth', label: 'mETH · Staking District' },
    steps: [
      { label: 'Current State', description: `$${totalValue.toFixed(0)} total · $${unallocated.toFixed(0)} unallocated`, amount: totalValue },
      { label: 'Move',          description: `Stake $${suggestAmount.toFixed(0)} into mETH at ${methAPY}% APY`, amount: suggestAmount },
      { label: 'New Position',  description: `Earn $${(currentMonthly + methMonthly).toFixed(0)}/mo${growthTargetMsg}`, amount: totalValue },
    ],
    projectedMonthlyIncome: parseFloat((currentMonthly + methMonthly).toFixed(2)),
    projectedAnnualIncome:  parseFloat(((currentMonthly + methMonthly) * 12).toFixed(2)),
    healthDelta: Math.min(Math.round(suggestAmount / totalValue * 20), 15),
    riskDelta:  -3,
  }

  const routeMUSD: AtlasRoute = {
    id: 'route-treasury-musd',
    from: { label: 'Your Island' },
    to: { district: 'treasury', opportunityId: 'musd', label: 'mUSD · Treasury District' },
    steps: [
      { label: 'Current State', description: `$${totalValue.toFixed(0)} total · ${portfolio.healthScore} health score`, amount: totalValue },
      { label: 'Move',          description: `Park $${suggestAmount.toFixed(0)} in mUSD at ${musdAPY}% APY — capital-stable`, amount: suggestAmount },
      { label: 'New Position',  description: `$${(currentMonthly + musdMonthly).toFixed(0)}/mo · capital protected`, amount: totalValue },
    ],
    projectedMonthlyIncome: parseFloat((currentMonthly + musdMonthly).toFixed(2)),
    projectedAnnualIncome:  parseFloat(((currentMonthly + musdMonthly) * 12).toFixed(2)),
    healthDelta: Math.min(Math.round(suggestAmount / totalValue * 25), 18),
    riskDelta:  -8,
  }

  // Always return both core routes; order by goal relevance so routes[0] is the best match
  if (goal?.type === 'growth') return [routeMETH, routeUSDY]
  if (goal?.type === 'protect') return [routeMUSD, routeUSDY]
  // income, custom, or no goal — USDY first
  return [routeUSDY, routeMETH]
}

// Compute progress toward a goal (0–100)
export function goalProgress(portfolio: UserIsland, goal: UserGoal): number {
  if (goal.type === 'income' && goal.targetMonthlyIncome) {
    const monthly = portfolio.positions.reduce((s, p) => s + p.income, 0)
    return Math.min(100, Math.round((monthly / goal.targetMonthlyIncome) * 100))
  }
  if (goal.type === 'growth' && goal.targetPortfolioValue) {
    return Math.min(100, Math.round((portfolio.totalValue / goal.targetPortfolioValue) * 100))
  }
  if (goal.type === 'protect') {
    return Math.min(100, portfolio.healthScore)
  }
  return 0
}
