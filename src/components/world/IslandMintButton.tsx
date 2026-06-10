'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { UserIsland } from '@/types/atlas'
import { getIslandTier } from '@/lib/islandTier'
import { getUnlockedMilestones, computeIslandStats } from '@/lib/islandMilestones'
import { mantleSepolia } from '@/lib/wagmi/config'

const ISLAND_NFT_ADDRESS = (process.env.NEXT_PUBLIC_ATLAS_ISLAND_NFT_ADDRESS ?? '0x44F82F2B6c475d3922F7FA08fe045e9200EBfCe4') as `0x${string}`

const ISLAND_NFT_ABI = [
  {
    name: 'mintIsland',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tvlUsdCents',     type: 'uint256' },
      { name: 'tier',            type: 'uint8'   },
      { name: 'tierName',        type: 'string'  },
      { name: 'milestonesCount', type: 'uint8'   },
      { name: 'healthScore',     type: 'uint8'   },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'hasMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'userIslandToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

interface Props {
  portfolio: UserIsland
  address: `0x${string}` | undefined
}

export function IslandMintButton({ portfolio, address }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null)

  const tier = getIslandTier(portfolio.totalValue)
  const stats = computeIslandStats(portfolio)
  const unlockedCount = getUnlockedMilestones(portfolio).length

  // Check if already minted
  const { data: alreadyMinted } = useReadContract({
    address: ISLAND_NFT_ADDRESS,
    abi: ISLAND_NFT_ABI,
    functionName: 'hasMinted',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: existingTokenId } = useReadContract({
    address: ISLAND_NFT_ADDRESS,
    abi: ISLAND_NFT_ABI,
    functionName: 'userIslandToken',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!alreadyMinted },
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    onReplaced: () => {},
  })

  // Eligibility: tier >= 2 AND tvl >= $5,000
  const eligible = tier.tier >= 2 && portfolio.totalValue >= 5_000

  const handleMint = () => {
    writeContract({
      address: ISLAND_NFT_ADDRESS,
      abi: ISLAND_NFT_ABI,
      functionName: 'mintIsland',
      args: [
        BigInt(Math.round(portfolio.totalValue * 100)),
        tier.tier,
        tier.name,
        unlockedCount,
        portfolio.healthScore,
      ],
      chainId: mantleSepolia.id,
      gas: BigInt(300_000),
    })
    setShowConfirm(false)
  }

  // Already minted state
  if (alreadyMinted || isSuccess) {
    const tokenId = mintedTokenId ?? existingTokenId
    return (
      <div className="rounded-xl border p-4 text-center space-y-2"
        style={{ borderColor: '#34D186' + '33', background: '#34D186' + '0d' }}>
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Island Tokenized</p>
        <p className="text-2xl">🏝</p>
        <p className="text-sm font-light text-white">{tier.name} Island</p>
        {tokenId !== undefined && tokenId > 0n && (
          <a
            href={`https://explorer.sepolia.mantle.xyz/token/${ISLAND_NFT_ADDRESS}/instance/${tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[10px] font-mono underline"
            style={{ color: '#34D186' }}
          >
            Token #{tokenId.toString()} on Mantle →
          </a>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mint CTA */}
      <div className="rounded-xl border p-4 space-y-3"
        style={{
          borderColor: eligible ? tier.color + '44' : 'rgba(255,255,255,0.08)',
          background: eligible ? tier.color + '0d' : 'transparent',
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-0.5">Island NFT</p>
            <p className="text-sm font-light text-white">
              {eligible ? 'Ready to tokenize' : 'Not yet eligible'}
            </p>
          </div>
          <span className="text-2xl">{eligible ? '🏝' : '🔒'}</span>
        </div>

        {!eligible && (
          <div className="space-y-1.5">
            {tier.tier < 2 && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/35">
                <span className="text-white/20">○</span>
                Reach Outpost tier ($5,000 TVL)
              </div>
            )}
            {portfolio.totalValue < 5_000 && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/35">
                <span className="text-white/20">○</span>
                ${(5_000 - portfolio.totalValue).toLocaleString(undefined, { maximumFractionDigits: 0 })} more TVL needed
              </div>
            )}
          </div>
        )}

        {eligible && (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-[0.12em] transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${tier.color}22, ${tier.color}44)`,
              border: `1px solid ${tier.color}55`,
              color: tier.color,
            }}
          >
            Mint Island NFT →
          </button>
        )}
      </div>

      {/* Confirm modal — portalled to body so it covers the full screen */}
      <AnimatePresence>
        {showConfirm && typeof document !== 'undefined' && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mx-4 w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ background: 'rgba(10,18,35,0.97)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Header */}
              <div className="px-7 pt-7 pb-5">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-white/35 hover:text-white/60 transition-colors mb-5"
                >
                  ← BACK
                </button>

                {/* Label with dot */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_6px_#00C2FF]" />
                  <span className="text-[11px] font-mono tracking-[0.18em] uppercase" style={{ color: '#00C2FF' }}>
                    {tier.name} Island NFT · Tier {tier.tier}
                  </span>
                </div>

                <p className="text-white text-[22px] font-light leading-snug">
                  Ready to tokenize your island?
                </p>
              </div>

              {/* TVL card */}
              <div className="mx-7 mb-5 rounded-2xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-mono text-white/35 uppercase tracking-[0.15em] mb-1">TVL SNAPSHOT (USD)</p>
                <p className="text-white text-[38px] font-light leading-none tracking-tight">
                  ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-white/25 text-[11px] font-mono mt-1.5">
                  Stored permanently on Mantle Sepolia
                </p>
              </div>

              {/* Stats row */}
              <div className="mx-7 mb-6 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'BUILDINGS', value: `${unlockedCount} unlocked` },
                  { label: 'HEALTH SCORE', value: `${portfolio.healthScore} / 100` },
                  { label: 'TIER', value: `${tier.tier} — ${tier.name}` },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  >
                    <span className="text-[10px] font-mono text-white/35 uppercase tracking-[0.12em]">{label}</span>
                    <span className="text-[13px] font-light text-white/80">{value}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-7 pb-7">
                <button
                  onClick={handleMint}
                  disabled={isPending || isConfirming}
                  className="w-full py-4 rounded-2xl text-[13px] font-mono uppercase tracking-[0.18em] transition-all duration-200 disabled:opacity-40 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #00C2FF, #007FFE)', color: '#fff' }}
                >
                  {isPending ? 'Sign in wallet…' : isConfirming ? 'Minting on Mantle…' : 'Mint Island NFT →'}
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  )
}
