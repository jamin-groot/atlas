'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AtlasRoute } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'

function buildShareUrl(route: AtlasRoute): string {
  const data = {
    from: route.from.label,
    to: route.to.label,
    monthlyGain: parseFloat(route.projectedMonthlyIncome.toFixed(2)),
    healthDelta: route.healthDelta,
    district: route.to.district,
  }
  const id = Buffer.from(JSON.stringify(data)).toString('base64url')
  return `${window.location.origin}/share/${id}`
}

interface Props {
  activeRoute: AtlasRoute | null
  routes: AtlasRoute[]
  onSelectRoute: (route: AtlasRoute) => void
  onAccept: (route: AtlasRoute) => void
  onDismiss: () => void
  visible: boolean
}

export function AtlasRoutePanel({ activeRoute, routes, onSelectRoute, onAccept, onDismiss, visible }: Props) {
  const [copied, setCopied] = useState(false)
  const color = activeRoute ? (DISTRICT_COLORS[activeRoute.to.district] ?? '#34D186') : '#34D186'

  function handleShare() {
    if (!activeRoute) return
    const url = buildShareUrl(activeRoute)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-8 right-8 z-10 w-96"
        >
          {/* Route selector tabs */}
          <div className="flex gap-2 mb-2">
            {routes.map((r: AtlasRoute) => (
              <button
                key={r.id}
                onClick={() => onSelectRoute(r)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: activeRoute?.id === r.id ? (DISTRICT_COLORS[r.to.district] + '60') : 'rgba(255,255,255,0.08)',
                  backgroundColor: activeRoute?.id === r.id ? (DISTRICT_COLORS[r.to.district] + '15') : 'rgba(0,0,0,0.5)',
                  color: activeRoute?.id === r.id ? DISTRICT_COLORS[r.to.district] : 'rgba(255,255,255,0.4)',
                }}
              >
                {r.to.label.split(' · ')[0]}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/75 backdrop-blur-xl overflow-hidden">
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}80, transparent)` }} />

            <div className="px-6 py-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-1">Atlas Route</p>
                  <h3 className="text-base font-light text-white">
                    {activeRoute?.to.label ?? 'Select a route'}
                  </h3>
                </div>
                <button onClick={onDismiss} className="text-white/25 hover:text-white/50 transition-colors text-xs font-mono">✕</button>
              </div>

              {activeRoute && (
                <>
                  {/* Route steps */}
                  <div className="space-y-1 mb-5">
                    {activeRoute.steps.map((step, i) => (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex gap-3 items-start">
                          {/* Step indicator */}
                          <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: i === 1 ? color : 'rgba(255,255,255,0.25)',
                                boxShadow: i === 1 ? `0 0 6px ${color}` : 'none',
                              }}
                            />
                            {i < activeRoute.steps.length - 1 && (
                              <div
                                className="w-px flex-1 mt-1 mb-1"
                                style={{
                                  height: 20,
                                  background: i === 0
                                    ? `linear-gradient(to bottom, rgba(255,255,255,0.15), ${color}60)`
                                    : `linear-gradient(to bottom, ${color}60, rgba(255,255,255,0.15))`,
                                }}
                              />
                            )}
                          </div>

                          <div className="pb-3">
                            <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5"
                               style={{ color: i === 1 ? color : 'rgba(255,255,255,0.35)' }}>
                              {step.label}
                            </p>
                            <p className="text-xs text-white/60 leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Outcome metrics */}
                  <div
                    className="rounded-xl px-4 py-3.5 grid grid-cols-3 gap-3 mb-5"
                    style={{ background: color + '0d', border: `1px solid ${color}25` }}
                  >
                    <div className="text-center">
                      <p className="text-[9px] font-mono text-white/35 uppercase tracking-wider mb-1">Monthly</p>
                      <p className="text-sm font-light" style={{ color }}>
                        +${activeRoute.projectedMonthlyIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center border-x border-white/8">
                      <p className="text-[9px] font-mono text-white/35 uppercase tracking-wider mb-1">Health</p>
                      <p className="text-sm font-light" style={{ color }}>
                        +{activeRoute.healthDelta}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-mono text-white/35 uppercase tracking-wider mb-1">Risk</p>
                      <p className="text-sm font-light text-[#34D186]">
                        {activeRoute.riskDelta}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={onDismiss}
                      className="py-2 px-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:text-white/65 hover:border-white/20 transition-all uppercase tracking-wider"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleShare}
                      className="py-2 px-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:text-white/65 hover:border-white/20 transition-all"
                    >
                      {copied ? '✓ Copied' : '↗ Share'}
                    </button>
                    <button
                      onClick={() => onAccept(activeRoute)}
                      className="flex-1 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
                      style={{ backgroundColor: color, color: '#000' }}
                    >
                      Follow Route →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
