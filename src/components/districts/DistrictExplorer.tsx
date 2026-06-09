'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { District, Opportunity } from '@/types/atlas'

interface Props {
  district: District | null
  selectedOp: Opportunity | null
  onSelectOp: (op: Opportunity) => void
  onEnterOp: (op: Opportunity) => void
  onBack: () => void
}

const RISK_LABEL = { low: 'Low', medium: 'Medium', high: 'High' }
const RISK_COLOR = { low: '#34D186', medium: '#F59E0B', high: '#EF4444' }

export function DistrictExplorer({ district, selectedOp, onSelectOp, onEnterOp, onBack }: Props) {
  return (
    <AnimatePresence>
      {district && (
        <motion.div
          key={district.id}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-80 flex flex-col gap-3"
        >
          {/* District header */}
          <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl px-6 py-5">
            <button
              onClick={onBack}
              className="text-[10px] font-mono text-white/35 hover:text-white/60 transition-colors uppercase tracking-widest mb-4 flex items-center gap-1"
            >
              ← World
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: district.color,
                  boxShadow: `0 0 10px ${district.color}`,
                }}
              />
              <h2 className="text-lg font-light text-white">{district.name}</h2>
            </div>
            <p className="text-white/45 text-xs leading-relaxed">{district.description}</p>

            {/* Stats row */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-white/8">
              <div>
                <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Opportunities</p>
                <p className="text-sm font-light text-white mt-0.5">
                  {district.opportunities.filter(o => !o.comingSoon).length}
                  {district.opportunities.some(o => o.comingSoon) && (
                    <span className="text-white/30 text-xs ml-1">
                      +{district.opportunities.filter(o => o.comingSoon).length} soon
                    </span>
                  )}
                </p>
              </div>
              {district.opportunities.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Best APY</p>
                  <p className="text-sm font-light mt-0.5" style={{ color: district.color }}>
                    {Math.max(...district.opportunities.map(o => o.apy))}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Opportunity cards */}
          {district.opportunities.length > 0 ? (
            <div className="space-y-2">
              {district.opportunities.map((op, i) => {
                const isSelected = selectedOp?.id === op.id
                return (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => onSelectOp(op)}
                    className="rounded-xl border bg-black/60 backdrop-blur-xl px-5 py-4 cursor-pointer transition-all"
                    style={{
                      borderColor: isSelected ? district.color + '60' : 'rgba(255,255,255,0.08)',
                      background: isSelected ? district.color + '0d' : 'rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-white text-sm font-medium">{op.name}</p>
                          {op.comingSoon ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-white/20 text-white/40">
                              SOON
                            </span>
                          ) : op.mantleNative && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                              style={{ color: district.color, borderColor: district.color + '40' }}>
                              MANTLE
                            </span>
                          )}
                        </div>
                        <p className="text-white/35 text-xs">{op.protocol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-mono font-medium" style={{ color: district.color }}>
                          {op.apy}%
                        </p>
                        <p className="text-white/30 text-[10px]">APY</p>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: RISK_COLOR[op.risk] }}
                        />
                        <span className="text-[10px] font-mono text-white/40">
                          {RISK_LABEL[op.risk]} risk
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/35">
                        Min ${op.minCapital}
                      </span>
                    </div>

                    {/* Enter button — shown when selected */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-white/8">
                            <p className="text-white/50 text-xs leading-relaxed mb-3">
                              {op.description}
                            </p>
                            {op.comingSoon ? (
                              <div className="w-full py-2 rounded-lg text-xs font-mono tracking-widest uppercase text-center text-white/25 border border-white/10">
                                Coming Soon
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); onEnterOp(op) }}
                                className="w-full py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all"
                                style={{
                                  backgroundColor: district.color + '20',
                                  color: district.color,
                                  border: `1px solid ${district.color}40`,
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor = district.color + '35'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor = district.color + '20'
                                }}
                              >
                                Enter Opportunity →
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 bg-black/40 backdrop-blur-xl px-5 py-6 text-center">
              <p className="text-white/25 text-xs font-mono uppercase tracking-wider">Coming soon</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
