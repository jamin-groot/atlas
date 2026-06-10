'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { UserIsland } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'
import { VAULT_ABI, VAULT_ADDRESSES, VAULT_DISTRICTS, MNT_USD } from '@/lib/vaults'
import { mantleSepolia } from '@/lib/wagmi/config'
import { getIslandTier, getTierProgress, getNextTierLabel } from '@/lib/islandTier'
import { getUnlockedMilestones, getLockedMilestones, MILESTONES } from '@/lib/islandMilestones'
import { IslandMintButton } from './IslandMintButton'

interface Props {
  portfolio: UserIsland
  visible: boolean
  walletAddress?: `0x${string}`
  onClose: () => void
}

const DISTRICT_LABELS: Record<string, string> = {
  income: 'Income', staking: 'Staking', growth: 'Growth',
  treasury: 'Treasury', emerging: 'Emerging', safety: 'Safety',
}

const OP_LABELS: Record<string, string> = {
  usdy: 'USDY', musd: 'mUSD', meth: 'mETH',
}

const OP_PROTOCOLS: Record<string, string> = {
  usdy: 'Ondo Finance', musd: 'Mantle', meth: 'Mantle LSP',
}

type Tab = 'overview' | 'positions' | 'buildings'

function WithdrawButton({ opportunityId, shares }: { opportunityId: string; shares: bigint }) {
  const vaultAddress = VAULT_ADDRESSES[opportunityId]
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  if (isSuccess) return (
    <span className="text-[10px] font-mono text-[#34D186]">Withdrawn ✓</span>
  )

  return (
    <button
      disabled={isPending || isConfirming}
      onClick={() => writeContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [shares],
        chainId: mantleSepolia.id,
        gas: BigInt(200_000),
      })}
      className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40"
      style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.7)' }}
    >
      {isPending ? 'Signing…' : isConfirming ? 'Confirming…' : 'Withdraw'}
    </button>
  )
}

export function UserIslandPanel({ portfolio, visible, onClose, walletAddress }: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  const healthColor =
    portfolio.healthScore >= 80 ? '#34D186'
    : portfolio.healthScore >= 60 ? '#F59E0B'
    : '#EF4444'

  const monthlyIncome = portfolio.positions.reduce((s, p) => s + p.income, 0)
  const totalYieldEarned = portfolio.positions.reduce((s, p) => s + (p.yieldEarned ?? 0), 0)

  const tier = getIslandTier(portfolio.totalValue)
  const tierProgress = getTierProgress(portfolio.totalValue)
  const nextTierLabel = getNextTierLabel(portfolio.totalValue)
  const unlockedMilestones = getUnlockedMilestones(portfolio)
  const lockedMilestones = getLockedMilestones(portfolio)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-80"
        >
          <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-6 space-y-4">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Your Island</p>
                <h2 className="text-2xl font-light text-white">
                  ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  {(portfolio.totalValue / MNT_USD).toFixed(2)} MNT total capital
                </p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs font-mono transition-colors">✕</button>
            </div>

            {/* ── Island Tier badge ── */}
            <div className="rounded-xl p-3 border" style={{ borderColor: tier.color + '33', background: tier.color + '0d' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ borderColor: tier.color + '66', color: tier.color, background: tier.color + '18' }}>
                    {tier.label}
                  </span>
                  <span className="text-sm font-light text-white">{tier.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: tier.color }}>
                  Tier {tier.tier}/5
                </span>
              </div>
              {/* Progress bar to next tier */}
              <div className="h-1 bg-white/8 rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress * 100}%` }}
                  transition={{ delay: 0.4, duration: 1.0, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})` }}
                />
              </div>
              <p className="text-[10px] font-mono text-white/35">
                {nextTierLabel ? `${nextTierLabel}` : '🏆 Maximum tier reached — eligible to tokenize'}
              </p>
            </div>

            {/* Health */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Portfolio Health</span>
                <span className="text-sm font-mono" style={{ color: healthColor }}>{portfolio.healthScore}/100</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${portfolio.healthScore}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: healthColor }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
              {(['overview', 'positions', 'buildings'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: tab === t ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {t === 'buildings'
                    ? `🏛 ${unlockedMilestones.length}/${MILESTONES.length}`
                    : t === 'positions' && portfolio.positions.length > 0
                      ? `${t} (${portfolio.positions.length})`
                      : t}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── OVERVIEW TAB ── */}
              {tab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                  {/* Income + yield */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                      <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">Monthly Income</p>
                      <p className="text-base font-light text-white">${monthlyIncome.toFixed(2)}/mo</p>
                      <p className="text-[10px] font-mono text-[#34D186]">+${(monthlyIncome * 12).toFixed(2)}/yr</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                      <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">Yield Earned</p>
                      <p className="text-base font-light text-white">${totalYieldEarned.toFixed(4)}</p>
                      <p className="text-[10px] font-mono text-white/30">all time</p>
                    </div>
                  </div>

                  {/* Allocation */}
                  <div>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">Allocation</p>
                    {portfolio.allocation.length === 0 ? (
                      <p className="text-xs text-white/20 font-mono italic">Capital untracked — connect and allocate.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {portfolio.allocation.map(alloc => {
                          const color = DISTRICT_COLORS[alloc.district] ?? '#fff'
                          return (
                            <div key={alloc.district}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/70">{DISTRICT_LABELS[alloc.district]}</span>
                                <span className="text-xs font-mono text-white/50">
                                  {alloc.percentage}% · ${alloc.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${alloc.percentage}%` }}
                                  transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Atlas insight */}
                  <div className="rounded-xl border border-[#34D186]/20 bg-[#34D186]/5 px-4 py-3">
                    <p className="text-[10px] font-mono text-[#34D186] uppercase tracking-widest mb-1">Atlas Navigator</p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {(() => {
                        const unallocated = portfolio.allocation.find(a => a.district === 'growth')?.value ?? 0
                        const hasPositions = portfolio.positions.length > 0
                        if (!hasPositions && unallocated > 0) {
                          const income = ((unallocated * 0.5 * 5.1) / 100 / 12).toFixed(2)
                          return `Your capital is sitting idle. Allocating 50% to the Income District could add $${income}/month passively.`
                        }
                        if (hasPositions && portfolio.healthScore < 60) {
                          return `Good start. Diversify further across districts to improve your health score above 60.`
                        }
                        if (portfolio.healthScore >= 60) {
                          return `Your island is well diversified. Keep exploring new opportunities to grow your income.`
                        }
                        return `Connect your wallet to explore opportunities tailored to your capital.`
                      })()}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── POSITIONS TAB ── */}
              {tab === 'positions' && (
                <motion.div key="positions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {portfolio.positions.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mx-auto">
                        <span className="text-white/25 text-lg">⬡</span>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs font-mono">No active positions yet.</p>
                        <p className="text-white/20 text-[10px] font-mono mt-1">Explore a district and allocate capital<br/>to start earning real yield.</p>
                      </div>
                    </div>
                  ) : (
                    portfolio.positions.map(pos => {
                      const district = VAULT_DISTRICTS[pos.opportunityId] ?? 'income'
                      const color = DISTRICT_COLORS[district] ?? '#34D186'
                      return (
                        <div
                          key={pos.opportunityId}
                          className="rounded-xl border bg-white/[0.03] px-4 py-3.5 space-y-3"
                          style={{ borderColor: color + '25' }}
                        >
                          {/* Position header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-light text-white">{OP_LABELS[pos.opportunityId] ?? pos.opportunityId}</p>
                              <p className="text-[10px] font-mono text-white/35">{OP_PROTOCOLS[pos.opportunityId]}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono" style={{ color }}>
                                ${pos.currentValue.toFixed(2)}
                              </p>
                              <p className="text-[10px] font-mono text-white/35">
                                {pos.amount.toFixed(4)} MNT
                              </p>
                            </div>
                          </div>

                          {/* Yield earned */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-white/5 px-2.5 py-2">
                              <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Yield Earned</p>
                              <p className="font-mono" style={{ color }}>
                                +${(pos.yieldEarned ?? 0).toFixed(4)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white/5 px-2.5 py-2">
                              <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Monthly</p>
                              <p className="font-mono text-white/70">+${pos.income.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Withdraw */}
                          <div className="flex items-center justify-between">
                            <a
                              href={`https://explorer.sepolia.mantle.xyz/address/${VAULT_ADDRESSES[pos.opportunityId]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-white/20 hover:text-white/50 transition-colors"
                            >
                              View contract ↗
                            </a>
                            {pos.shares && pos.shares > BigInt(0) && (
                              <WithdrawButton opportunityId={pos.opportunityId} shares={pos.shares} />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </motion.div>
              )}

              {/* ── BUILDINGS TAB ── */}
              {tab === 'buildings' && (
                <motion.div key="buildings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">
                    Yield milestones unlock buildings on your island
                  </p>

                  {/* Unlocked */}
                  {unlockedMilestones.map(m => (
                    <div key={m.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 border"
                      style={{ borderColor: m.color + '33', background: m.color + '0d' }}>
                      <span className="text-sm mt-0.5">✦</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-light text-white">{m.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                            style={{ background: m.color + '28', color: m.color }}>BUILT</span>
                        </div>
                        <p className="text-[10px] font-mono text-white/35 leading-snug">{m.flavor}</p>
                      </div>
                    </div>
                  ))}

                  {/* Locked */}
                  {lockedMilestones.map(m => (
                    <div key={m.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 border border-white/6 bg-white/[0.02] opacity-50">
                      <span className="text-sm mt-0.5 text-white/20">○</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-light text-white/40">{m.name}</span>
                          <span className="text-[9px] font-mono text-white/20 px-1.5 py-0.5 rounded-full border border-white/10">LOCKED</span>
                        </div>
                        <p className="text-[10px] font-mono text-white/25 leading-snug">{m.description}</p>
                      </div>
                    </div>
                  ))}

                  {unlockedMilestones.length === MILESTONES.length && (
                    <div className="text-center py-4">
                      <p className="text-xs font-mono" style={{ color: '#F97316' }}>
                        🏆 All buildings unlocked — island ready to tokenize
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* ── Island NFT Mint ── */}
            <div className="pt-2 border-t border-white/6 relative">
              <IslandMintButton portfolio={portfolio} address={walletAddress} />
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
