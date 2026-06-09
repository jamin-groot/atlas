'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Opportunity, UserIsland } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'

interface Props {
  opportunity: Opportunity | null
  portfolio: UserIsland | null
  onBack: () => void
  onSimulate: () => void
  onAllocate: () => void
  onTrust: () => void
}

const RISK_COLOR = { low: '#34D186', medium: '#F59E0B', high: '#EF4444' }
const RISK_LABEL = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' }
const RISK_DESC  = {
  low:    'Principal is backed by real-world assets or protocol insurance. Minimal impermanent loss risk.',
  medium: 'Smart contract exposure. Audited protocols. Moderate market volatility.',
  high:   'Higher upside with smart contract, liquidity, and market risk.',
}

function calcMonthlyIncome(amount: number, apy: number) {
  return (amount * apy) / 100 / 12
}

export function OpportunityView({ opportunity, portfolio, onBack, onSimulate, onAllocate, onTrust }: Props) {
  if (!opportunity) return null

  const color = DISTRICT_COLORS[opportunity.district] ?? '#34D186'

  // Portfolio impact — what % of portfolio would a $500 allocation be?
  const sampleAlloc = 500
  const portfolioTotal = portfolio?.totalValue ?? 0
  const impactPct = portfolioTotal > 0 ? ((sampleAlloc / portfolioTotal) * 100).toFixed(1) : null
  const monthly = calcMonthlyIncome(sampleAlloc, opportunity.apy)
  const annual  = monthly * 12

  return (
    <AnimatePresence>
      {opportunity && (
        <>
          {/* Backdrop blur overlay over the 3D world */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel — slides up from bottom, sits center-right */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-6 px-6"
          >
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#080f1a]/95 backdrop-blur-xl overflow-hidden">

              {/* Color bar header */}
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${color}80, ${color}20)` }}
              />

              <div className="px-8 py-6">

                {/* Back + breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={onBack}
                    className="text-[10px] font-mono text-white/35 hover:text-white/65 transition-colors uppercase tracking-widest"
                  >
                    ← District
                  </button>
                  <span className="text-white/15 text-xs">/</span>
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    {opportunity.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8">

                  {/* Left col */}
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-2xl font-light text-white">{opportunity.name}</h2>
                        {opportunity.mantleNative && (
                          <span
                            className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                            style={{ color, borderColor: color + '40' }}
                          >
                            MANTLE NATIVE
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs">{opportunity.protocol} · {opportunity.asset}</p>
                    </div>

                    {/* Description */}
                    <p className="text-white/60 text-sm leading-relaxed">
                      {opportunity.description}
                    </p>

                    {/* Risk profile */}
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLOR[opportunity.risk] }} />
                        <span className="text-xs font-mono" style={{ color: RISK_COLOR[opportunity.risk] }}>
                          {RISK_LABEL[opportunity.risk]}
                        </span>
                      </div>
                      <p className="text-white/45 text-xs leading-relaxed">
                        {RISK_DESC[opportunity.risk]}
                      </p>
                    </div>

                    {/* Trust layer trigger */}
                    <button
                      onClick={onTrust}
                      className="flex items-center gap-2 text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-white/25 flex items-center justify-center text-[8px]">?</div>
                      Why should I trust this?
                    </button>
                  </div>

                  {/* Right col */}
                  <div className="space-y-4">

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-center">
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-1">APY</p>
                        <p className="text-2xl font-light" style={{ color }}>{opportunity.apy}%</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-center">
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-1">Min Capital</p>
                        <p className="text-2xl font-light text-white">${opportunity.minCapital}</p>
                      </div>
                    </div>

                    {/* Income preview — $500 sample */}
                    <div
                      className="rounded-xl border px-4 py-4"
                      style={{ borderColor: color + '30', background: color + '08' }}
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color }}>
                        Income Preview · $500
                      </p>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Monthly</p>
                          <p className="text-lg font-light text-white mt-0.5">${monthly.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Annual</p>
                          <p className="text-lg font-light text-white mt-0.5">${annual.toFixed(0)}</p>
                        </div>
                      </div>
                      {impactPct && (
                        <p className="text-white/30 text-[10px] mt-2 font-mono">
                          = {impactPct}% of your portfolio
                        </p>
                      )}
                    </div>

                    {/* Portfolio impact */}
                    {portfolio && (
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-2.5">
                          Portfolio Impact
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/50">Health score</span>
                            <span className="font-mono text-white/70">
                              {portfolio.healthScore} → <span style={{ color }}>{portfolio.healthScore + 8}</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/50">Monthly income</span>
                            <span className="font-mono text-white/70">
                              $46 → <span style={{ color }}>${(46 + monthly).toFixed(0)}</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/50">Income exposure</span>
                            <span className="font-mono text-white/70">
                              8% → <span style={{ color }}>20%</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={onSimulate}
                        className="flex-1 py-2.5 rounded-xl border border-white/15 text-xs font-mono text-white/60 hover:text-white hover:border-white/30 transition-all uppercase tracking-wider"
                      >
                        Simulate
                      </button>
                      <button
                        onClick={onAllocate}
                        className="flex-1 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: color,
                          color: '#000',
                        }}
                      >
                        Allocate →
                      </button>
                    </div>

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
