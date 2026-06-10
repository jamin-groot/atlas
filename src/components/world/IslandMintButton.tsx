'use client'

import { useState } from 'react'
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

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050d1a] border border-white/10 rounded-2xl p-6 mx-4 space-y-4 max-w-xs w-full"
            >
              <div className="text-center space-y-1">
                <span className="text-3xl">🏝</span>
                <p className="text-white font-light text-lg">{tier.name} Island</p>
                <p className="text-white/40 text-xs font-mono">This will be minted on Mantle Sepolia</p>
              </div>

              <div className="space-y-2 rounded-xl bg-white/5 p-3">
                {[
                  ['Tier', `${tier.tier} — ${tier.name}`],
                  ['TVL Snapshot', `$${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
                  ['Buildings', `${unlockedCount} unlocked`],
                  ['Health Score', `${portfolio.healthScore}/100`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/35">{label}</span>
                    <span className="text-white/70">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-mono text-white/40 border border-white/10 hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleMint}
                  disabled={isPending || isConfirming}
                  className="flex-1 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-40"
                  style={{ background: tier.color + '33', border: `1px solid ${tier.color}55`, color: tier.color }}
                >
                  {isPending ? 'Sign…' : isConfirming ? 'Minting…' : 'Confirm Mint'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
