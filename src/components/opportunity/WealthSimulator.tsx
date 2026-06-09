'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Opportunity, UserIsland } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'

interface Props {
  opportunity: Opportunity | null
  portfolio: UserIsland | null
  onBack: () => void
  onAllocate: (amount: number) => void
}

const PRESETS = [100, 500, 1000, 5000]

function project(amount: number, apy: number) {
  const monthly  = (amount * apy) / 100 / 12
  const annual   = monthly * 12
  const twoYear  = amount + annual * 2
  return { monthly, annual, twoYear }
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

export function WealthSimulator({ opportunity, portfolio, onBack, onAllocate }: Props) {
  const [amount, setAmount] = useState(500)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const effectiveAmount = useCustom ? (parseFloat(custom) || 0) : amount
  const color = opportunity ? (DISTRICT_COLORS[opportunity.district] ?? '#34D186') : '#34D186'

  const current = useMemo(() => ({
    monthly: portfolio?.positions.reduce((s, p) => s + p.income, 0) ?? 0,
    healthScore: portfolio?.healthScore ?? 0,
  }), [portfolio])

  const projected = useMemo(() => {
    if (!opportunity) return null
    return project(effectiveAmount, opportunity.apy)
  }, [effectiveAmount, opportunity])

  const healthDelta = effectiveAmount > 0 ? Math.min(Math.round(effectiveAmount / 100), 15) : 0
  const newHealth = Math.min(current.healthScore + healthDelta, 100)

  if (!opportunity) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 flex items-end justify-center pb-6 px-6 bg-black/55 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 48 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#080f1a]/95 backdrop-blur-xl overflow-hidden"
        >
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}80, ${color}20)` }} />

          <div className="px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={onBack}
                  className="text-[10px] font-mono text-white/35 hover:text-white/60 transition-colors uppercase tracking-widest mb-2 flex items-center gap-1"
                >
                  ← Opportunity
                </button>
                <h2 className="text-lg font-light text-white">
                  Wealth Simulator
                  <span className="text-white/35 ml-2 text-sm">· {opportunity.name}</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">APY</p>
                <p className="text-xl font-light" style={{ color }}>{opportunity.apy}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left — input */}
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">
                    How much to allocate?
                  </p>

                  {/* Preset buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {PRESETS.map(p => (
                      <button
                        key={p}
                        onClick={() => { setAmount(p); setUseCustom(false) }}
                        className="py-2 rounded-xl text-xs font-mono transition-all"
                        style={{
                          border: `1px solid ${!useCustom && amount === p ? color + '60' : 'rgba(255,255,255,0.08)'}`,
                          background: !useCustom && amount === p ? color + '15' : 'rgba(255,255,255,0.03)',
                          color: !useCustom && amount === p ? color : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        ${p >= 1000 ? `${p / 1000}k` : p}
                      </button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all"
                    style={{ borderColor: useCustom ? color + '50' : 'rgba(255,255,255,0.08)' }}
                  >
                    <span className="text-white/35 text-sm font-mono">$</span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={custom}
                      onChange={e => { setCustom(e.target.value); setUseCustom(true) }}
                      onFocus={() => setUseCustom(true)}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Slider */}
                <div>
                  <input
                    type="range"
                    min={10}
                    max={10000}
                    step={10}
                    value={useCustom ? (parseFloat(custom) || 10) : amount}
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      setAmount(v)
                      setCustom(String(v))
                      setUseCustom(false)
                    }}
                    className="w-full accent-current h-1 rounded-full cursor-pointer"
                    style={{ accentColor: color }}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-white/25 mt-1">
                    <span>$10</span>
                    <span>$10,000</span>
                  </div>
                </div>

                {/* Portfolio health change */}
                {portfolio && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 space-y-3">
                    <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Portfolio Impact</p>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/50">Health Score</span>
                        <span className="font-mono text-white/60">
                          {current.healthScore}
                          <span className="text-white/25 mx-1">→</span>
                          <span style={{ color }}>{newHealth}</span>
                          {healthDelta > 0 && <span className="ml-1 text-[10px]" style={{ color }}>+{healthDelta}</span>}
                        </span>
                      </div>
                      <Bar value={newHealth} max={100} color={color} />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/50">Monthly income</span>
                        <span className="font-mono text-white/60">
                          ${current.monthly}
                          <span className="text-white/25 mx-1">→</span>
                          <span style={{ color }}>${(current.monthly + (projected?.monthly ?? 0)).toFixed(0)}</span>
                        </span>
                      </div>
                      <Bar value={current.monthly + (projected?.monthly ?? 0)} max={500} color={color} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right — projections */}
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Projected Returns</p>

                {/* Big number */}
                <motion.div
                  key={effectiveAmount}
                  initial={{ opacity: 0.5, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border px-6 py-5 text-center"
                  style={{ borderColor: color + '30', background: color + '08' }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color }}>Monthly Income</p>
                  <p className="text-4xl font-light text-white">
                    ${projected ? projected.monthly.toFixed(2) : '0.00'}
                  </p>
                  <p className="text-white/30 text-xs mt-1 font-mono">per month</p>
                </motion.div>

                {/* Timeline cards */}
                {[
                  { label: '3 Months',  value: projected ? projected.monthly * 3  : 0 },
                  { label: '12 Months', value: projected ? projected.annual        : 0 },
                  { label: '24 Months', value: projected ? projected.annual * 2    : 0 },
                ].map(({ label, value }) => (
                  <motion.div
                    key={label + effectiveAmount}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <span className="text-xs text-white/45 font-mono">{label}</span>
                    <span className="text-sm font-mono text-white">${value.toFixed(0)} income</span>
                  </motion.div>
                ))}

                {/* Value growth */}
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-white/45 font-mono">Total after 2yr</span>
                  <span className="text-sm font-mono" style={{ color }}>
                    ${projected ? projected.twoYear.toFixed(0) : effectiveAmount}
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onAllocate(effectiveAmount)}
                  disabled={effectiveAmount <= 0}
                  className="w-full py-3 rounded-xl text-sm font-mono uppercase tracking-widest transition-all disabled:opacity-30"
                  style={{ backgroundColor: color, color: '#000' }}
                >
                  Allocate ${effectiveAmount.toLocaleString()} →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
