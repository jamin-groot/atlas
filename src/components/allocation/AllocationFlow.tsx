'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { Opportunity, UserIsland } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'
import { VAULT_ABI, VAULT_ADDRESSES } from '@/lib/vaults'
import { mantleSepolia } from '@/lib/wagmi/config'

interface Props {
  opportunity: Opportunity | null
  amount: number
  portfolio: UserIsland | null
  visible: boolean
  onBack: () => void
  onSuccess: (opportunity: Opportunity, amount: number) => void
}

type Step = 'amount' | 'review' | 'confirm' | 'processing' | 'success' | 'error'

function calcMonthly(amount: number, apy: number) {
  return (amount * apy) / 100 / 12
}

// Convert USD amount → MNT (approximate, 1 MNT ≈ $0.35)
const MNT_USD = 0.35
function usdToMnt(usd: number) {
  return usd / MNT_USD
}

const QUICK_AMOUNTS = [25, 50, 100, 200]

export function AllocationFlow({ opportunity, amount: defaultAmount, portfolio, visible, onBack, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState(defaultAmount)
  const [inputVal, setInputVal] = useState(String(defaultAmount))
  const [txError, setTxError] = useState<string | null>(null)

  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const isWrongNetwork = !!address && chainId !== mantleSepolia.id

  const color = opportunity ? (DISTRICT_COLORS[opportunity.district] ?? '#34D186') : '#34D186'
  const monthly = opportunity ? calcMonthly(amount, opportunity.apy) : 0
  const currentMonthly = portfolio?.positions.reduce((s, p) => s + p.income, 0) ?? 0
  const currentHealth  = portfolio?.healthScore ?? 0
  const healthGain     = Math.min(Math.round(amount / 100), 15)

  // Max allocatable = total portfolio value in USD
  const maxUsd = portfolio?.totalValue ?? 0
  const maxMnt = usdToMnt(maxUsd)

  function handleAmountInput(val: string) {
    setInputVal(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) setAmount(n)
  }

  function handleMax() {
    const max = Math.floor(maxUsd * 100) / 100
    setInputVal(String(max))
    setAmount(max)
  }

  const vaultAddress = opportunity ? VAULT_ADDRESSES[opportunity.id] : undefined

  const { writeContract, data: txHash, isPending: isSigning, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError, data: txReceipt } =
    useWaitForTransactionReceipt({ hash: txHash })

  // Real gas cost from receipt
  const gasCostUsd = (() => {
    if (!txReceipt?.gasUsed || !txReceipt?.effectiveGasPrice) return null
    const costMnt = Number(txReceipt.gasUsed * txReceipt.effectiveGasPrice) / 1e18
    return costMnt * MNT_USD
  })()
  // Ethereum mainnet equivalent: same gas units × 20 gwei × $3500/ETH
  const ethEquivUsd = (() => {
    if (!txReceipt?.gasUsed) return null
    return (Number(txReceipt.gasUsed) * 20e9 * 3500) / 1e18
  })()
  const gasSavingsPct = gasCostUsd && ethEquivUsd && ethEquivUsd > 0
    ? Math.round((1 - gasCostUsd / ethEquivUsd) * 100)
    : 99

  // Advance steps based on tx state
  useEffect(() => {
    if (isSigning) setStep('processing')
  }, [isSigning])

  const [decisionTx, setDecisionTx] = useState<string | null>(null)

  useEffect(() => {
    if (isConfirmed) {
      setStep('success')
      // Record execution on-chain — fire-and-forget
      if (opportunity && txHash) {
        fetch('/api/decisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decisionType:   'allocation_executed',
            opportunityId:  opportunity.id,
            amountUsd:      amount,
            recommendedApy: opportunity.apy,
            userAddress:    address,
            txHash,
          }),
        })
          .then(r => r.json())
          .then(d => { if (d.hash) setDecisionTx(d.hash) })
          .catch(() => {/* silent */})
      }
    }
  }, [isConfirmed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const err = writeError || receiptError
    if (err) {
      setTxError(err.message.split('\n')[0])
      setStep('error')
    }
  }, [writeError, receiptError])

  // Reset when panel closes or opportunity changes
  useEffect(() => {
    if (!visible) {
      setStep('amount')
      setTxError(null)
    }
    setInputVal(String(defaultAmount))
    setAmount(defaultAmount)
  }, [visible, defaultAmount]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSign() {
    if (!address) {
      setTxError('Wallet not connected. Please connect your wallet first.')
      setStep('error')
      return
    }
    if (opportunity?.comingSoon) {
      setTxError('This opportunity is coming soon and not yet available for allocation.')
      setStep('error')
      return
    }
    if (!vaultAddress) {
      setTxError('No vault contract deployed for this opportunity yet. Try USDY or mETH instead.')
      setStep('error')
      return
    }
    if (isWrongNetwork) {
      switchChain({ chainId: mantleSepolia.id })
      return
    }

    setTxError(null)
    const mntAmount = usdToMnt(amount)
    try {
      writeContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'deposit',
        value: parseEther(mntAmount.toFixed(6)),
        chainId: mantleSepolia.id,
        gas: BigInt(200_000),
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setTxError(msg.split('\n')[0])
      setStep('error')
    }
  }

  function handleClose() {
    if (step === 'success' && opportunity) {
      onSuccess(opportunity, amount)
    } else {
      onBack()
    }
    setStep('amount')
    setTxError(null)
  }

  const processingLabel = isSigning
    ? 'Awaiting wallet signature…'
    : isConfirming
    ? 'Confirming on Mantle…'
    : txHash
    ? 'Broadcasting…'
    : 'Preparing…'

  if (!opportunity) return null

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/65 backdrop-blur-sm"
            onClick={step === 'review' ? onBack : undefined}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex items-center justify-center px-6"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#080f1a]/97 backdrop-blur-xl overflow-hidden">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}80, ${color}20)` }} />

              <div className="px-7 py-6">
                <AnimatePresence mode="wait">

                  {/* ── AMOUNT ── */}
                  {step === 'amount' && (
                    <motion.div key="amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <button onClick={onBack} className="text-[10px] font-mono text-white/30 hover:text-white/55 transition-colors uppercase tracking-widest mb-5">
                        ← Back
                      </button>

                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color }}>{opportunity?.name}</p>
                        <span className="text-[10px] font-mono text-white/30">· {opportunity?.apy}% APY</span>
                      </div>
                      <h2 className="text-xl font-light text-white mb-6">How much to allocate?</h2>

                      {/* Amount input */}
                      <div className="rounded-2xl border px-5 py-4 mb-4"
                        style={{ borderColor: color + '30', background: color + '08' }}>
                        <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-2">Amount (USD)</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-light text-white/50">$</span>
                          <input
                            type="number"
                            min={1}
                            max={maxUsd}
                            value={inputVal}
                            onChange={e => handleAmountInput(e.target.value)}
                            className="flex-1 bg-transparent text-3xl font-light text-white outline-none placeholder:text-white/20"
                            placeholder="0"
                            autoFocus
                          />
                          <button
                            onClick={handleMax}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all"
                            style={{ borderColor: color + '40', color }}
                          >
                            MAX
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8">
                          <span className="text-[10px] font-mono text-white/30">
                            ≈ {usdToMnt(amount).toFixed(2)} MNT
                          </span>
                          <span className="text-[10px] font-mono text-white/30">
                            Available: {maxMnt.toFixed(2)} MNT (${maxUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                          </span>
                        </div>
                      </div>

                      {/* Quick amount chips */}
                      <div className="flex gap-2 mb-6">
                        {QUICK_AMOUNTS.map(q => (
                          <button
                            key={q}
                            onClick={() => { setAmount(q); setInputVal(String(q)) }}
                            className="flex-1 py-2 rounded-xl border text-xs font-mono transition-all"
                            style={{
                              borderColor: amount === q ? color + '60' : 'rgba(255,255,255,0.08)',
                              color: amount === q ? color : 'rgba(255,255,255,0.4)',
                              background: amount === q ? color + '10' : 'transparent',
                            }}
                          >
                            ${q}
                          </button>
                        ))}
                      </div>

                      {/* Live projection */}
                      {amount > 0 && (
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 mb-5 flex justify-between text-xs">
                          <div className="text-center">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">Monthly income</p>
                            <p className="font-mono" style={{ color }}>+${monthly.toFixed(2)}</p>
                          </div>
                          <div className="text-center border-x border-white/8 px-4">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">Annual yield</p>
                            <p className="font-mono" style={{ color }}>+${(monthly * 12).toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">APY</p>
                            <p className="font-mono text-white/70">{opportunity?.apy}%</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setStep('review')}
                        disabled={!amount || amount <= 0}
                        className="w-full py-3 rounded-xl text-sm font-mono uppercase tracking-wider transition-all disabled:opacity-30"
                        style={{ backgroundColor: color, color: '#000' }}
                      >
                        Review Allocation →
                      </button>
                    </motion.div>
                  )}

                  {/* ── REVIEW ── */}
                  {step === 'review' && (
                    <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <button onClick={() => setStep('amount')} className="text-[10px] font-mono text-white/30 hover:text-white/55 transition-colors uppercase tracking-widest mb-5">
                        ← Back
                      </button>

                      <h2 className="text-xl font-light text-white mb-1">Review Allocation</h2>
                      <p className="text-white/35 text-xs mb-6">Confirm the details before signing.</p>

                      <div className="rounded-2xl border px-5 py-4 mb-5 space-y-3"
                        style={{ borderColor: color + '30', background: color + '08' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-0.5">Allocating</p>
                            <p className="text-3xl font-light text-white">${amount.toLocaleString()}</p>
                            <p className="text-[10px] font-mono text-white/30 mt-0.5">≈ {usdToMnt(amount).toFixed(2)} MNT</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end mb-1">
                              <p className="text-base font-light text-white">{opportunity.name}</p>
                              {opportunity.mantleNative && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                                  style={{ color, borderColor: color + '40' }}>MANTLE</span>
                              )}
                            </div>
                            <p className="text-white/35 text-xs">{opportunity.protocol}</p>
                          </div>
                        </div>

                        <div className="h-px bg-white/8" />

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">APY</p>
                            <p className="text-sm font-mono" style={{ color }}>{opportunity.apy}%</p>
                          </div>
                          <div className="border-x border-white/8">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Monthly</p>
                            <p className="text-sm font-mono text-white">+${monthly.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">Risk</p>
                            <p className="text-sm font-mono text-white capitalize">{opportunity.risk}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5 mb-6 space-y-2.5">
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Your island after this</p>
                        {[
                          { label: 'Monthly income', before: `$${currentMonthly.toFixed(2)}`, after: `$${(currentMonthly + monthly).toFixed(2)}`, good: true },
                          { label: 'Portfolio health', before: `${currentHealth}/100`, after: `${Math.min(currentHealth + healthGain, 100)}/100`, good: true },
                          { label: 'Total capital', before: `$${portfolio?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`, after: `$${((portfolio?.totalValue ?? 0) - amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, good: false },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between text-xs">
                            <span className="text-white/45">{row.label}</span>
                            <span className="font-mono text-white/55">
                              {row.before}
                              <span className="text-white/20 mx-1.5">→</span>
                              <span style={{ color: row.good ? color : 'rgba(255,255,255,0.7)' }}>{row.after}</span>
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setStep('amount')}
                          className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:text-white/65 hover:border-white/20 transition-all uppercase tracking-wider">
                          ← Edit
                        </button>
                        <button onClick={() => setStep('confirm')}
                          className="flex-1 py-3 rounded-xl text-sm font-mono uppercase tracking-wider transition-all"
                          style={{ backgroundColor: color, color: '#000' }}>
                          Confirm →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── CONFIRM ── */}
                  {step === 'confirm' && (
                    <motion.div key="confirm" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                      <h2 className="text-xl font-light text-white mb-1">Sign Transaction</h2>
                      <p className="text-white/35 text-xs mb-6">Your wallet will ask you to approve. Ultra-low fees on Mantle.</p>

                      <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-5 mb-5">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/8">
                          <img src="/mantle-logo.svg" alt="Mantle" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                          <div>
                            <p className="text-xs text-white font-medium">Mantle Network</p>
                            <p className="text-[10px] text-white/35 font-mono">
                              {address ? `${address.slice(0,6)}…${address.slice(-4)}` : '—'}
                            </p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Balance</p>
                            <p className="text-xs text-white font-mono">${portfolio?.totalValue.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-white/40">Function</span>
                            <span className="font-mono text-white/70">deposit()</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Protocol</span>
                            <span className="font-mono text-white/70">{opportunity.protocol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Amount</span>
                            <span className="font-mono" style={{ color }}>
                              {usdToMnt(amount).toFixed(4)} MNT (≈${amount.toLocaleString()})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Contract</span>
                            <span className="font-mono text-white/40 text-[10px]">
                              {vaultAddress ? `${vaultAddress.slice(0,8)}…${vaultAddress.slice(-6)}` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Network fee</span>
                            <span className="font-mono text-[#34D186]">~$0.01</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setStep('review')}
                          className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:text-white/65 transition-all uppercase tracking-wider">
                          Back
                        </button>
                        <button
                          onClick={handleSign}
                          disabled={isSwitching}
                          className="flex-1 py-3 rounded-xl text-sm font-mono uppercase tracking-wider disabled:opacity-60 transition-all"
                          style={{ backgroundColor: color, color: '#000' }}
                        >
                          {isSwitching
                            ? 'Switching Network…'
                            : isWrongNetwork
                            ? 'Switch to Mantle Sepolia'
                            : 'Sign & Allocate'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── PROCESSING ── */}
                  {step === 'processing' && (
                    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="py-4 flex flex-col items-center gap-6">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2"
                          style={{ borderColor: color + '40' }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute inset-1 rounded-full border-2 border-transparent"
                          style={{ borderTopColor: color }}
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1.0, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                      </div>

                      <div className="text-center space-y-2">
                        <p className="text-sm font-mono" style={{ color }}>{processingLabel}</p>
                        {txHash && (
                          <a
                            href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-white/30 hover:text-white/60 transition-colors"
                          >
                            {txHash.slice(0,10)}…{txHash.slice(-8)} ↗
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── SUCCESS ── */}
                  {step === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      className="py-2 flex flex-col items-center gap-5 text-center">

                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg width="64" height="64" className="-rotate-90">
                          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                          <motion.circle cx="32" cy="32" r="26" fill="none"
                            stroke={color} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={163} strokeDashoffset={163}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </svg>
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                          className="absolute text-xl"
                          style={{ color }}
                        >✓</motion.span>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-white mb-1">Allocation Complete</h3>
                        <p className="text-white/40 text-sm">
                          {usdToMnt(amount).toFixed(4)} MNT deposited to {opportunity.name}
                        </p>
                      </div>

                      <div className="w-full rounded-2xl border px-5 py-4 space-y-2"
                        style={{ borderColor: color + '30', background: color + '08' }}>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/45">New monthly income</span>
                          <span className="font-mono" style={{ color }}>${(currentMonthly + monthly).toFixed(0)}/mo</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/45">Portfolio health</span>
                          <span className="font-mono" style={{ color }}>{Math.min(currentHealth + healthGain, 100)}/100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/45">Annual income</span>
                          <span className="font-mono" style={{ color }}>${((currentMonthly + monthly) * 12).toFixed(0)}/yr</span>
                        </div>
                        <div className="h-px bg-white/8 my-1" />
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-white/45">Network fee</span>
                          <span className="font-mono text-white/60">
                            {gasCostUsd != null ? `$${gasCostUsd.toFixed(4)}` : '~$0.01'}
                          </span>
                        </div>
                        <div className="rounded-lg px-3 py-2 flex items-center justify-between"
                          style={{ background: color + '12', border: `1px solid ${color}25` }}>
                          <span className="text-[10px] text-white/50">vs Ethereum mainnet</span>
                          <span className="text-[10px] font-mono font-semibold" style={{ color }}>
                            {gasSavingsPct}% cheaper on Mantle ⚡
                          </span>
                        </div>
                        {txHash && (
                          <a
                            href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-[10px] font-mono text-white/30 hover:text-white/60 transition-colors pt-1"
                          >
                            View allocation on Mantle Explorer ↗
                          </a>
                        )}
                        {decisionTx && (
                          <a
                            href={`https://explorer.sepolia.mantle.xyz/tx/${decisionTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-[10px] font-mono text-[#34D186]/40 hover:text-[#34D186]/70 transition-colors pt-0.5"
                          >
                            ◆ AI decision recorded on-chain ↗
                          </a>
                        )}
                      </div>

                      <button onClick={handleClose}
                        className="w-full py-3 rounded-xl text-sm font-mono uppercase tracking-wider"
                        style={{ backgroundColor: color, color: '#000' }}>
                        Back to Atlas
                      </button>
                    </motion.div>
                  )}

                  {/* ── ERROR ── */}
                  {step === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="py-4 flex flex-col items-center gap-5 text-center">
                      <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                        <span className="text-red-400 text-xl">✕</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-light text-white mb-2">Transaction Failed</h3>
                        <p className="text-red-400/70 text-xs font-mono leading-relaxed">{txError}</p>
                      </div>
                      <div className="flex gap-3 w-full">
                        <button onClick={() => setStep('confirm')}
                          className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:text-white/65 transition-all uppercase tracking-wider">
                          Try Again
                        </button>
                        <button onClick={handleClose}
                          className="flex-1 py-3 rounded-xl border border-red-500/20 text-xs font-mono text-red-400/60 hover:text-red-400 transition-all uppercase tracking-wider">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
