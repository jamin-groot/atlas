'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AtlasRoute, UserGoal } from '@/types/atlas'
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
  goal?: UserGoal | null
  goalProgress?: number
}

export function AtlasRoutePanel({ activeRoute, routes, onSelectRoute, onAccept, onDismiss, visible, goal, goalProgress }: Props) {
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const color = activeRoute ? (DISTRICT_COLORS[activeRoute.to.district] ?? '#34D186') : '#34D186'

  async function handleCopyLink() {
    if (!activeRoute) return
    const url = buildShareUrl(activeRoute)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setShareOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShareTwitter() {
    if (!activeRoute) return
    const url = buildShareUrl(activeRoute)
    const mo = activeRoute.projectedMonthlyIncome.toFixed(0)
    const text = `Just mapped a route on Atlas → +$${mo}/month into the ${activeRoute.to.label}.\n\nHealth +${activeRoute.healthDelta}. AI-guided, on-chain verified.\n\n`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    setShareOpen(false)
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

              {/* Goal progress bar */}
              {goal && typeof goalProgress === 'number' && goalProgress > 0 && (
                <div className="mb-5 rounded-xl px-4 py-3 border border-white/6 bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Goal progress</p>
                    <p className="text-[10px] font-mono text-[#34D186]">{goalProgress}%</p>
                  </div>
                  <p className="text-[11px] text-white/50 mb-2">{goal.label}</p>
                  <div className="h-1 rounded-full bg-white/6 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-[#34D186]"
                    />
                  </div>
                </div>
              )}

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
                    <div className="relative">
                      <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="py-2 px-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:text-white/65 hover:border-white/20 transition-all"
                      >
                        {copied ? '✓ Copied' : '↗ Share'}
                      </button>
                      <AnimatePresence>
                        {shareOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute bottom-full mb-2 left-0 bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-w-[160px]"
                          >
                            <button
                              onClick={handleShareTwitter}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/5 transition-all text-left"
                            >
                              <span className="text-[#1DA1F2]">𝕏</span> Post on X
                            </button>
                            <button
                              onClick={handleCopyLink}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/5 transition-all text-left border-t border-white/5"
                            >
                              <span className="text-white/40">🔗</span> Copy link
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
