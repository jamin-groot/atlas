'use client'

import { useBalance, useReadContracts } from 'wagmi'
import { useMemo } from 'react'
import { formatEther } from 'viem'
import { mantleSepolia } from '@/lib/wagmi/config'
import { VAULT_ABI, VAULT_ADDRESSES, VAULT_DISTRICTS } from '@/lib/vaults'
import { UserIsland, Position, DistrictType } from '@/types/atlas'
import type { LivePrices } from './useLivePrices'

const VAULT_IDS = ['usdy', 'musd', 'meth'] as const

/**
 * Reads real on-chain state from all 3 vaults + wallet balance.
 * Uses live MNT price and APYs passed in from useLivePrices.
 */
export function useWalletPortfolio(
  address: `0x${string}` | undefined,
  prices?: Pick<LivePrices, 'mntUsd' | 'apys'>
): UserIsland | null {
  const MNT_USD = prices?.mntUsd ?? 0.35
  const { data: balance } = useBalance({
    address,
    chainId: mantleSepolia.id,
    query: { refetchInterval: 5000 },
  })

  // Read getPositionValue(address) from all 3 vaults — poll every 5s
  const { data: positionData } = useReadContracts({
    contracts: VAULT_IDS.map(id => ({
      address: VAULT_ADDRESSES[id],
      abi: VAULT_ABI,
      functionName: 'getPositionValue' as const,
      args: [address!] as const,
      chainId: mantleSepolia.id,
    })),
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  // Read live APY from all 3 vaults — poll every 30s (changes slowly)
  const { data: apyData } = useReadContracts({
    contracts: VAULT_IDS.map(id => ({
      address: VAULT_ADDRESSES[id],
      abi: VAULT_ABI,
      functionName: 'getAPY' as const,
      args: [] as const,
      chainId: mantleSepolia.id,
    })),
    query: { enabled: true, refetchInterval: 30000 },
  })

  return useMemo(() => {
    if (!address || !balance) return null

    const walletMnt = parseFloat(formatEther(balance.value))
    const walletUsd = walletMnt * MNT_USD

    // Build real positions from vault reads
    const positions: Position[] = []
    let totalInvested = 0

    VAULT_IDS.forEach((id, i) => {
      const result = positionData?.[i]
      if (result?.status !== 'success') return

      const [sharesRaw, currentValueWei, , yieldEarnedWei] = result.result as [bigint, bigint, bigint, bigint]
      const currentValueMnt = parseFloat(formatEther(currentValueWei))
      const currentValueUsd = currentValueMnt * MNT_USD
      const yieldUsd = parseFloat(formatEther(yieldEarnedWei)) * MNT_USD

      if (currentValueMnt <= 0) return

      // Use live APY from mainnet if available, else fall back to vault contract
      const liveApy = prices?.apys?.[id as keyof typeof prices.apys]
      let apyPercent: number
      if (liveApy && liveApy > 0) {
        apyPercent = liveApy
      } else {
        const apyResult = apyData?.[i]
        const apyBps = apyResult?.status === 'success' ? Number(apyResult.result as bigint) : 0
        apyPercent = apyBps / 100
      }

      // Monthly income = currentValue * APY / 12
      const monthlyIncome = (currentValueUsd * apyPercent) / 100 / 12

      positions.push({
        opportunityId: id,
        amount: currentValueMnt,
        entryDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        currentValue: currentValueUsd,
        income: parseFloat(monthlyIncome.toFixed(2)),
        yieldEarned: parseFloat(yieldUsd.toFixed(4)),
        shares: sharesRaw,
      })

      totalInvested += currentValueUsd
    })

    // Total capital = wallet balance + all vault positions
    const totalValue = parseFloat((walletUsd + totalInvested).toFixed(2))

    // Build allocation breakdown by district
    const districtMap: Record<string, { usd: number }> = {}

    if (walletUsd > 0) {
      districtMap['unallocated'] = { usd: walletUsd }
    }

    positions.forEach(p => {
      const district = VAULT_DISTRICTS[p.opportunityId]
      if (!districtMap[district]) districtMap[district] = { usd: 0 }
      districtMap[district].usd += p.currentValue
    })

    const allocation = Object.entries(districtMap).map(([district, { usd }]) => ({
      district: district as DistrictType,
      percentage: totalValue > 0 ? Math.round((usd / totalValue) * 100) : 0,
      value: parseFloat(usd.toFixed(2)),
    }))

    // Health score: 0 positions = 20, improves with diversification
    // Max 100 when capital spread across income + staking + growth
    const diversificationBonus = Math.min(positions.length * 20, 60)
    const incomeRatio = totalValue > 0 ? totalInvested / totalValue : 0
    const incomeBonus = Math.round(incomeRatio * 20)
    const healthScore = Math.min(20 + diversificationBonus + incomeBonus, 100)

    return {
      totalValue,
      healthScore,
      allocation,
      positions,
    }
  }, [address, balance, positionData, apyData])
}
