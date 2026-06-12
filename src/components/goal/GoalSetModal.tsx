'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserGoal, GoalType } from '@/types/atlas'

interface Props {
  visible: boolean
  monthlyIncome: number
  portfolioValue: number
  onSet: (goal: UserGoal) => void
}

const PRESETS: { type: GoalType; icon: string; label: string; sub: string }[] = [
  { type: 'income',  icon: '◎', label: 'Generate income',   sub: 'Earn a target amount every month' },
  { type: 'growth',  icon: '◆', label: 'Grow my portfolio', sub: 'Reach a target portfolio value' },
  { type: 'protect', icon: '◇', label: 'Protect capital',   sub: 'Beat inflation, minimise risk' },
  { type: 'custom',  icon: '⬡', label: 'Something else',    sub: 'Tell Navigator in your own words' },
]

const INCOME_TARGETS = [100, 250, 500, 1000, 2500]
const GROWTH_TARGETS = [10000, 25000, 50000, 100000]

export function GoalSetModal({ visible, monthlyIncome, portfolioValue, onSet }: Props) {
  const [selected, setSelected] = useState<GoalType | null>(null)
  const [incomeTarget, setIncomeTarget] = useState(500)
  const [growthTarget, setGrowthTarget] = useState(50000)
  const [customText, setCustomText] = useState('')

  function handleConfirm() {
    if (!selected) return
    if (selected === 'income') {
      onSet({ type: 'income', label: `$${incomeTarget}/month passive income`, targetMonthlyIncome: incomeTarget })
    } else if (selected === 'growth') {
      onSet({ type: 'growth', label: `Grow portfolio to $${growthTarget.toLocaleString()}`, targetPortfolioValue: growthTarget })
    } else if (selected === 'protect') {
      onSet({ type: 'protect', label: 'Protect capital & beat inflation' })
    } else if (selected === 'custom' && customText.trim()) {
      onSet({ type: 'custom', label: customText.trim(), customText: customText.trim() })
    }
  }

  const canConfirm = selected && (
    selected === 'income' ||
    selected === 'growth' ||
    selected === 'protect' ||
    (selected === 'custom' && customText.trim().length > 3)
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-4 rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: '#0a1020' }}
          >
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-white/6">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-2">Atlas Navigator</p>
              <h2 className="text-xl font-light text-white leading-snug">
                What are you trying to achieve?
              </h2>
              <p className="text-sm text-white/35 font-light mt-1.5">
                Every route will be built toward your goal.
              </p>
            </div>

            {/* Goal options */}
            <div className="p-5 space-y-2">
              {PRESETS.map(p => (
                <button
                  key={p.type}
                  onClick={() => setSelected(p.type)}
                  className="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4"
                  style={{
                    borderColor: selected === p.type ? 'rgba(52,209,134,0.4)' : 'rgba(255,255,255,0.07)',
                    background: selected === p.type ? 'rgba(52,209,134,0.06)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span className="text-sm" style={{ color: selected === p.type ? '#34D186' : 'rgba(255,255,255,0.3)' }}>
                    {p.icon}
                  </span>
                  <div>
                    <p className="text-sm font-light text-white">{p.label}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{p.sub}</p>
                  </div>
                  {selected === p.type && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#34D186]" />
                  )}
                </button>
              ))}
            </div>

            {/* Sub-options */}
            <AnimatePresence>
              {selected === 'income' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-2 overflow-hidden">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-3">Monthly income target</p>
                  <div className="flex flex-wrap gap-2">
                    {INCOME_TARGETS.map(t => (
                      <button key={t} onClick={() => setIncomeTarget(t)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border"
                        style={{
                          borderColor: incomeTarget === t ? 'rgba(52,209,134,0.5)' : 'rgba(255,255,255,0.1)',
                          color: incomeTarget === t ? '#34D186' : 'rgba(255,255,255,0.4)',
                          background: incomeTarget === t ? 'rgba(52,209,134,0.08)' : 'transparent',
                        }}>
                        ${t}/mo
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/25 mt-3">
                    You currently earn ${monthlyIncome.toFixed(0)}/mo.
                    {incomeTarget > monthlyIncome
                      ? ` Gap: $${(incomeTarget - monthlyIncome).toFixed(0)}/mo to close.`
                      : " You've already reached this target."}
                  </p>
                </motion.div>
              )}

              {selected === 'growth' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-2 overflow-hidden">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-3">Portfolio target</p>
                  <div className="flex flex-wrap gap-2">
                    {GROWTH_TARGETS.map(t => (
                      <button key={t} onClick={() => setGrowthTarget(t)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border"
                        style={{
                          borderColor: growthTarget === t ? 'rgba(52,209,134,0.5)' : 'rgba(255,255,255,0.1)',
                          color: growthTarget === t ? '#34D186' : 'rgba(255,255,255,0.4)',
                          background: growthTarget === t ? 'rgba(52,209,134,0.08)' : 'transparent',
                        }}>
                        ${t.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/25 mt-3">
                    Current portfolio: ${portfolioValue.toFixed(0)}.
                    {growthTarget > portfolioValue
                      ? ` $${(growthTarget - portfolioValue).toLocaleString()} to go.`
                      : " You've already reached this target."}
                  </p>
                </motion.div>
              )}

              {selected === 'custom' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-2 overflow-hidden">
                  <input
                    type="text"
                    placeholder="e.g. retire in 10 years, fund a business..."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 font-light"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="px-5 py-5 border-t border-white/6 flex items-center justify-between">
              <p className="text-[10px] font-mono text-white/20">Atlas will build every route toward this goal</p>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="px-6 py-2.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all"
                style={{
                  background: canConfirm ? '#34D186' : 'rgba(255,255,255,0.06)',
                  color: canConfirm ? '#030712' : 'rgba(255,255,255,0.2)',
                  cursor: canConfirm ? 'pointer' : 'default',
                }}
              >
                Set goal →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
