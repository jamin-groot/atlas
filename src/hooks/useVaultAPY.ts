'use client'

import { useReadContracts } from 'wagmi'
import { VAULT_ABI, VAULT_ADDRESSES } from '@/lib/vaults'
import { mantleSepolia } from '@/lib/wagmi/config'

const VAULT_IDS = ['usdy', 'musd', 'meth'] as const

/**
 * Returns live APY (%) for each vault from the contract.
 * Falls back to hardcoded defaults if read fails.
 */
export function useVaultAPY(): Record<string, number> {
  const { data } = useReadContracts({
    contracts: VAULT_IDS.map(id => ({
      address: VAULT_ADDRESSES[id],
      abi: VAULT_ABI,
      functionName: 'getAPY' as const,
      args: [] as const,
      chainId: mantleSepolia.id,
    })),
  })

  const defaults: Record<string, number> = { usdy: 5.1, musd: 4.8, meth: 3.8 }

  if (!data) return defaults

  const result = { ...defaults }
  VAULT_IDS.forEach((id, i) => {
    const r = data[i]
    if (r?.status === 'success') {
      result[id] = Number(r.result as bigint) / 100 // bps → percent
    }
  })
  return result
}
