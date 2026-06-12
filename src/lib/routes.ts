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
  const routes: AtlasRoute[] = []

  // ── Income goal: prioritise USDY (highest stable yield) ──────────────────
  if (!goal || goal.type === 'income' || goal.type === 'custom') {
    const usdyAPY = liveAPY['usdy'] ?? 5.1
    const usdyMonthly = (suggestAmount * usdyAPY) / 100 / 12
    const newMonthly = currentMonthly + usdyMonthly
    const targetMsg = goal?.targetMonthlyIncome
      ? ` — ${Math.min(100, Math.round((newMonthly / goal.targetMonthlyIncome) * 100))}% toward $${goal.targetMonthlyIncome}/mo goal`
      : ''
    routes.push({
      id: 'route-income-usdy',
      from: { label: 'Your Island' },
      to: { district: 'income', opportunityId: 'usdy', label: 'USDY · Income District' },
      steps: [
        { label: 'Current State', description: `$${totalValue.toFixed(0)} total · $${currentMonthly.toFixed(0)}/mo income`, amount: totalValue },
        { label: 'Move',          description: `Allocate $${suggestAmount.toFixed(0)} to USDY at ${usdyAPY}% APY`, amount: suggestAmount },
        { label: 'New Position',  description: `Earn $${newMonthly.toFixed(0)}/mo${targetMsg}`, amount: totalValue },
      ],
      projectedMonthlyIncome: parseFloat(newMonthly.toFixed(2)),
      projectedAnnualIncome:  parseFloat((newMonthly * 12).toFixed(2)),
      healthDelta: Math.min(Math.round(suggestAmount / totalValue * 30), 20),
      riskDelta:  -5,
    })
  }

  // ── Growth goal: prioritise mETH (ETH exposure + staking yield) ──────────
  if (!goal || goal.type === 'growth' || goal.type === 'custom') {
    const methAPY = liveAPY['meth'] ?? 3.8
    const methMonthly = (suggestAmount * methAPY) / 100 / 12
    const newMonthly = currentMonthly + methMonthly
    const newTotal = totalValue + suggestAmount * 0.1 // rough capital-growth estimate
    const targetMsg = goal?.targetPortfolioValue
      ? ` — ${Math.min(100, Math.round((newTotal / goal.targetPortfolioValue) * 100))}% toward $${goal.targetPortfolioValue.toLocaleString()} goal`
      : ''
    routes.push({
      id: 'route-staking-meth',
      from: { label: 'Your Island' },
      to: { district: 'staking', opportunityId: 'meth', label: 'mETH · Staking District' },
      steps: [
        { label: 'Current State', description: `$${totalValue.toFixed(0)} total · $${unallocated.toFixed(0)} unallocated`, amount: totalValue },
        { label: 'Move',          description: `Stake $${suggestAmount.toFixed(0)} into mETH at ${methAPY}% APY`, amount: suggestAmount },
        { label: 'New Position',  description: `Earn $${newMonthly.toFixed(0)}/mo${targetMsg}`, amount: totalValue },
      ],
      projectedMonthlyIncome: parseFloat(newMonthly.toFixed(2)),
      projectedAnnualIncome:  parseFloat((newMonthly * 12).toFixed(2)),
      healthDelta: Math.min(Math.round(suggestAmount / totalValue * 20), 15),
      riskDelta:  -3,
    })
  }

  // ── Protect goal: treasury first, conservative allocation ────────────────
  if (goal?.type === 'protect') {
    const musdAPY = liveAPY['musd'] ?? 4.2
    const musdMonthly = (suggestAmount * musdAPY) / 100 / 12
    const newMonthly = currentMonthly + musdMonthly
    routes.unshift({
      id: 'route-treasury-musd',
      from: { label: 'Your Island' },
      to: { district: 'treasury', opportunityId: 'musd', label: 'mUSD · Treasury District' },
      steps: [
        { label: 'Current State', description: `$${totalValue.toFixed(0)} total · ${portfolio.healthScore} health`, amount: totalValue },
        { label: 'Move',          description: `Park $${suggestAmount.toFixed(0)} in mUSD at ${musdAPY}% APY — capital-stable`, amount: suggestAmount },
        { label: 'New Position',  description: `$${newMonthly.toFixed(0)}/mo · health protected`, amount: totalValue },
      ],
      projectedMonthlyIncome: parseFloat(newMonthly.toFixed(2)),
      projectedAnnualIncome:  parseFloat((newMonthly * 12).toFixed(2)),
      healthDelta: Math.min(Math.round(suggestAmount / totalValue * 25), 18),
      riskDelta:  -8,
    })
  }

  return routes
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
