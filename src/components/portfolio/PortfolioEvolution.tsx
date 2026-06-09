'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserIsland, Opportunity } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'
import { AtlasRoute } from '@/types/atlas'
import { Snapshot } from '@/hooks/usePortfolioHistory'

interface AllocationEvent {
  opportunity: Opportunity
  amount: number
  date: string
}

interface Props {
  portfolio: UserIsland | null
  allocations: AllocationEvent[]
  snapshots: Snapshot[]
  nextRoute: AtlasRoute | null
  visible: boolean
  onClose: () => void
  onNextRoute: () => void
}

const DISTRICT_LABELS: Record<string, string> = {
  income: 'Income', staking: 'Staking', growth: 'Growth',
  treasury: 'Treasury', emerging: 'Emerging', safety: 'Safety',
}

function MiniChart({ color, values, label }: { color: string; values: number[]; label?: string }) {
  if (values.length < 2) {
    // Not enough data — show a flat line with a dot
    const w = 200; const h = 48
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
        <circle cx={w} cy={h / 2} r={3} fill={color} />
        {label && <text x={w / 2} y={h / 2 - 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">{label}</text>}
      </svg>
    )
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 200; const h = 48
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  const area = `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const last = values[values.length - 1]
        const x = w
        const y = h - ((last - min) / range) * (h - 8) - 4
        return <circle cx={x} cy={y} r="3" fill={color} />
      })()}
    </svg>
  )
}

export function PortfolioEvolution({ portfolio, allocations, snapshots, nextRoute, visible, onClose, onNextRoute }: Props) {
  const totalMonthly = portfolio?.positions.reduce((s, p) => s + p.income, 0) ?? 0
  const totalYieldEarned = portfolio?.positions.reduce((s, p) => s + (p.yieldEarned ?? 0), 0) ?? 0
  const totalValue = portfolio?.totalValue ?? 0

  // P&L: total invested = sum of allocation events
  const totalInvested = useMemo(
    () => allocations.reduce((s, a) => s + a.amount, 0),
    [allocations]
  )
  const pnlUsd = totalYieldEarned
  const pnlPct = totalInvested > 0 ? (pnlUsd / totalInvested) * 100 : 0

  // Charts from real snapshots — fallback to current value if no history
  const incomeValues = useMemo(() => {
    if (snapshots.length === 0) return [0, totalMonthly]
    return [...snapshots.map(s => s.monthlyIncome), totalMonthly]
  }, [snapshots, totalMonthly])

  const healthValues = useMemo(() => {
    if (snapshots.length === 0) return [20, portfolio?.healthScore ?? 20]
    return [...snapshots.map(s => s.healthScore), portfolio?.healthScore ?? 20]
  }, [snapshots, portfolio?.healthScore])

  const valueValues = useMemo(() => {
    if (snapshots.length === 0) return [0, totalValue]
    return [...snapshots.map(s => s.totalValue), totalValue]
  }, [snapshots, totalValue])

  const nextColor = nextRoute ? (DISTRICT_COLORS[nextRoute.to.district] ?? '#34D186') : '#34D186'

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-6 px-6"
          >
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#080f1a]/97 backdrop-blur-xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#34D186]/60 via-[#3B82F6]/40 to-transparent" />

              <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <button onClick={onClose}
                      className="text-[10px] font-mono text-white/30 hover:text-white/55 transition-colors uppercase tracking-widest mb-2">
                      ← Back to world
                    </button>
                    <h2 className="text-lg font-light text-white">Portfolio Evolution</h2>
                    <p className="text-white/35 text-xs mt-0.5">Real on-chain growth over time.</p>
                  </div>

                  {/* P&L hero */}
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Total Yield Earned</p>
                    <p className="text-2xl font-light" style={{ color: pnlUsd >= 0 ? '#34D186' : '#EF4444' }}>
                      +${pnlUsd.toFixed(4)}
                    </p>
                    {totalInvested > 0 && (
                      <p className="text-[10px] font-mono text-white/30">
                        +{pnlPct.toFixed(3)}% on ${totalInvested.toLocaleString()} invested
                      </p>
                    )}
                  </div>
                </div>

                {/* Real P&L stats row */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Capital', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'white' },
                    { label: 'Invested', value: `$${totalInvested.toFixed(2)}`, color: 'rgba(255,255,255,0.6)' },
                    { label: 'Monthly Income', value: `$${totalMonthly.toFixed(2)}`, color: '#34D186' },
                    { label: 'Health', value: `${portfolio?.healthScore ?? 0}/100`, color: portfolio?.healthScore && portfolio.healthScore >= 60 ? '#34D186' : '#F59E0B' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-center">
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="text-sm font-mono" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Left col — charts */}
                  <div className="space-y-4">

                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Monthly Income</p>
                        <p className="text-sm font-mono text-[#34D186]">${totalMonthly.toFixed(2)}/mo</p>
                      </div>
                      <MiniChart color="#34D186" values={incomeValues} label={snapshots.length === 0 ? 'No history yet' : undefined} />
                      <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-mono text-white/20">{snapshots.length > 0 ? 'First deposit' : 'Start'}</span>
                        <span className="text-[9px] font-mono text-white/20">Now</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Portfolio Health</p>
                        <p className="text-sm font-mono text-[#3B82F6]">{portfolio?.healthScore ?? 0}/100</p>
                      </div>
                      <MiniChart color="#3B82F6" values={healthValues} />
                      <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-mono text-white/20">{snapshots.length > 0 ? 'Before' : 'Start'}</span>
                        <span className="text-[9px] font-mono text-white/20">Now</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Total Value</p>
                        <p className="text-sm font-mono text-white">${totalValue.toFixed(2)}</p>
                      </div>
                      <MiniChart color="#A855F7" values={valueValues} />
                    </div>
                  </div>

                  {/* Right col */}
                  <div className="space-y-4">

                    {/* Allocation history */}
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-3">Allocation History</p>
                      {allocations.length > 0 ? (
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                          {allocations.map((ev, i) => {
                            const c = DISTRICT_COLORS[ev.opportunity.district] ?? '#fff'
                            const mo = (ev.amount * ev.opportunity.apy) / 100 / 12
                            return (
                              <motion.div key={i}
                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                                  <div>
                                    <p className="text-xs text-white">{ev.opportunity.name}</p>
                                    <p className="text-[10px] font-mono text-white/30">{ev.date}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-mono text-white/70">${ev.amount.toLocaleString()}</p>
                                  <p className="text-[10px] font-mono" style={{ color: c }}>+${mo.toFixed(2)}/mo</p>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center space-y-2">
                          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mx-auto">
                            <span className="text-white/20 text-sm">↑</span>
                          </div>
                          <p className="text-white/25 text-xs font-mono">No allocations yet.</p>
                          <p className="text-white/15 text-[10px]">Make your first deposit to<br/>start tracking capital growth.</p>
                        </div>
                      )}
                    </div>

                    {/* Active positions */}
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-3">Active Positions</p>
                      {portfolio?.positions && portfolio.positions.length > 0 ? (
                        <div className="space-y-2.5">
                          {portfolio.positions.map(p => {
                            const c = DISTRICT_COLORS[p.opportunityId === 'meth' ? 'staking' : 'income'] ?? '#34D186'
                            return (
                              <div key={p.opportunityId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                                  <span className="text-xs text-white/60 uppercase">{p.opportunityId}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-mono" style={{ color: c }}>${p.currentValue.toFixed(2)}</p>
                                  <p className="text-[10px] font-mono text-white/30">+${(p.yieldEarned ?? 0).toFixed(4)} earned</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-white/20 text-xs font-mono text-center py-3">No active positions yet.</p>
                      )}
                    </div>

                    {/* Next route */}
                    {nextRoute && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="rounded-xl border px-4 py-3.5"
                        style={{ borderColor: nextColor + '30', background: nextColor + '08' }}
                      >
                        <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: nextColor }}>
                          Atlas Navigator
                        </p>
                        <p className="text-xs text-white/65 leading-relaxed mb-3">
                          Next: {nextRoute.to.label} — projected +${nextRoute.projectedMonthlyIncome.toFixed(2)}/mo, health +{nextRoute.healthDelta}
                        </p>
                        <button onClick={onNextRoute}
                          className="w-full py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all"
                          style={{ backgroundColor: nextColor + '20', color: nextColor, border: `1px solid ${nextColor}35` }}
                        >
                          View Route →
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
