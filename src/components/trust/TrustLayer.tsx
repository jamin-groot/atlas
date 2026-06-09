'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Opportunity } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'
import { getRecentDecisions, getDecisionCount, getExplorerUrl, REGISTRY_ADDRESS_EXPORT, AGENT_ID, OnChainDecision } from '@/lib/agentIdentity'

interface Props {
  opportunity: Opportunity | null
  visible: boolean
  onClose: () => void
}

const SPECIALISTS = [
  {
    role: 'Treasury Specialist', icon: '◈', color: '#F59E0B',
    verdict: 'Verified', verdictColor: '#34D186',
    summary: 'Asset is backed by US Treasury bills held in regulated custodianship. Redemption mechanism is audited and functioning.',
    confidence: 94,
    checks: [
      { label: 'Custodian verified', pass: true },
      { label: 'Reserve attestation', pass: true },
      { label: 'Redemption tested', pass: true },
      { label: 'Regulatory compliance', pass: true },
    ],
  },
  {
    role: 'Risk Specialist', icon: '◇', color: '#3B82F6',
    verdict: 'Low Risk', verdictColor: '#34D186',
    summary: 'Smart contract audited by Certik and Trail of Bits. No critical vulnerabilities found. Upgrade mechanism is time-locked.',
    confidence: 88,
    checks: [
      { label: 'Smart contract audit', pass: true },
      { label: 'Upgrade timelock', pass: true },
      { label: 'Liquidity depth', pass: true },
      { label: 'Oracle manipulation risk', pass: false },
    ],
  },
  {
    role: 'Verification Specialist', icon: '◉', color: '#A855F7',
    verdict: 'On-chain', verdictColor: '#34D186',
    summary: 'All yield data sourced directly from on-chain state. APY calculated from 90-day trailing average of actual distributions.',
    confidence: 97,
    checks: [
      { label: 'On-chain yield source', pass: true },
      { label: 'APY methodology clear', pass: true },
      { label: 'Historical data intact', pass: true },
      { label: 'No self-reported data', pass: true },
    ],
  },
]

const DECISION_TYPE_LABEL: Record<string, string> = {
  route_suggestion: 'Route Suggestion',
  opportunity_recommendation: 'Opportunity Rec.',
  portfolio_analysis: 'Portfolio Analysis',
  genesis: 'Genesis',
}

const DECISION_TYPE_COLOR: Record<string, string> = {
  route_suggestion: '#34D186',
  opportunity_recommendation: '#3B82F6',
  portfolio_analysis: '#A855F7',
  genesis: '#F59E0B',
}

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width="44" height="44" className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <motion.circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }} />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" fontSize="9" fill="white"
        transform="rotate(90, 22, 22)" style={{ fontFamily: 'monospace' }}>{value}</text>
    </svg>
  )
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function TrustLayer({ opportunity, visible, onClose }: Props) {
  const [decisions, setDecisions] = useState<OnChainDecision[]>([])
  const [decisionCount, setDecisionCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    Promise.all([getRecentDecisions(5), getDecisionCount()])
      .then(([d, c]) => { setDecisions(d); setDecisionCount(c) })
      .finally(() => setLoading(false))
  }, [visible])

  if (!opportunity) return null

  const color = DISTRICT_COLORS[opportunity.district] ?? '#34D186'
  const overallConfidence = Math.round(SPECIALISTS.reduce((s, sp) => s + sp.confidence, 0) / SPECIALISTS.length)

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-6 px-6"
          >
            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#080f1a]/97 backdrop-blur-xl overflow-hidden">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}80, transparent)` }} />

              <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <button onClick={onClose}
                      className="text-[10px] font-mono text-white/35 hover:text-white/60 transition-colors uppercase tracking-widest mb-2">
                      ← Back
                    </button>
                    <h2 className="text-lg font-light text-white">
                      Trust Layer <span className="text-white/35 ml-2 text-sm">· {opportunity.name}</span>
                    </h2>
                    <p className="text-white/35 text-xs mt-0.5">Independent specialist review + on-chain Navigator history.</p>
                  </div>
                  <div className="text-center">
                    <ConfidenceRing value={overallConfidence} color={color} />
                    <p className="text-[9px] font-mono text-white/35 uppercase tracking-wider mt-1">Consensus</p>
                    <p className="text-[10px] font-mono" style={{ color }}>{overallConfidence}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Left — specialist cards */}
                  <div className="space-y-3">
                    {SPECIALISTS.map((sp, i) => (
                      <motion.div key={sp.role} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span style={{ color: sp.color }}>{sp.icon}</span>
                            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">{sp.role.split(' ')[0]}</span>
                            <div className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ml-1"
                              style={{ backgroundColor: sp.verdictColor + '15', border: `1px solid ${sp.verdictColor}30` }}>
                              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: sp.verdictColor }} />
                              <span className="text-[9px] font-mono" style={{ color: sp.verdictColor }}>{sp.verdict}</span>
                            </div>
                          </div>
                          <ConfidenceRing value={sp.confidence} color={sp.color} />
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {sp.checks.map(c => (
                            <div key={c.label} className="flex items-center gap-1.5">
                              <span className="text-[10px]" style={{ color: c.pass ? '#34D186' : '#EF4444' }}>{c.pass ? '✓' : '✗'}</span>
                              <span className="text-[10px] font-mono text-white/30">{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Right — on-chain Navigator history */}
                  <div className="flex flex-col gap-3">
                    {/* Agent identity card */}
                    <div className="rounded-xl border border-[#34D186]/25 bg-[#34D186]/05 px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[10px] font-mono text-[#34D186] uppercase tracking-wider">ERC-8004 Agent Identity</p>
                          <p className="text-sm font-light text-white mt-0.5">Atlas Navigator #{AGENT_ID.toString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Decisions</p>
                          <p className="text-lg font-light" style={{ color: '#34D186' }}>
                            {loading ? '…' : decisionCount}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34D186]" />
                        <p className="text-[10px] font-mono text-white/35 truncate">
                          {REGISTRY_ADDRESS_EXPORT?.slice(0, 10)}…{REGISTRY_ADDRESS_EXPORT?.slice(-6)}
                        </p>
                        <a
                          href={getExplorerUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-[10px] font-mono text-[#34D186]/70 hover:text-[#34D186] transition-colors"
                        >
                          Mantle Explorer ↗
                        </a>
                      </div>
                    </div>

                    {/* Recent decisions */}
                    <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-3">
                        Recent On-Chain Decisions
                      </p>

                      {loading ? (
                        <div className="space-y-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />
                          ))}
                        </div>
                      ) : decisions.length === 0 ? (
                        <p className="text-white/20 text-xs font-mono text-center py-4">
                          No decisions yet. Interact with the Navigator.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {decisions.map((d, i) => {
                            const typeColor = DECISION_TYPE_COLOR[d.decisionType] ?? '#fff'
                            let parsedPayload: Record<string, string> = {}
                            try { parsedPayload = JSON.parse(d.payload) } catch {}

                            return (
                              <motion.div key={i}
                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeColor }} />
                                    <span className="text-[10px] font-mono" style={{ color: typeColor }}>
                                      {DECISION_TYPE_LABEL[d.decisionType] ?? d.decisionType}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-white/25">{timeAgo(d.timestamp)}</span>
                                </div>
                                {parsedPayload.response && (
                                  <p className="text-[10px] text-white/45 leading-relaxed line-clamp-2">
                                    "{parsedPayload.response}"
                                  </p>
                                )}
                                <p className="text-[9px] font-mono text-white/20 mt-1 truncate">
                                  {d.payloadHash.slice(0, 18)}…
                                </p>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom: historical accuracy + explorer link */}
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Accuracy</p>
                        <p className="text-sm font-light text-white">96.2%</p>
                      </div>
                      <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Network</p>
                        <p className="text-sm font-light text-white">Mantle</p>
                      </div>
                      <button onClick={onClose}
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-mono text-white/40 hover:text-white/70 hover:border-white/20 transition-all">
                        Close
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
