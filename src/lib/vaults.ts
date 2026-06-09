// Atlas Yield Vault — Mantle Sepolia
// Contracts: deposit() payable, getPositionValue(address), getAPY()

export const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    outputs: [{ internalType: 'uint256', name: 'mntAmount', type: 'uint256' }],
  },
  {
    name: 'withdrawAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ internalType: 'uint256', name: 'mntAmount', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  },
  {
    name: 'getPositionValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    outputs: [
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'currentValue', type: 'uint256' },
      { internalType: 'uint256', name: 'depositedValue', type: 'uint256' },
      { internalType: 'uint256', name: 'yieldEarned', type: 'uint256' },
    ],
  },
  {
    name: 'getAPY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  },
] as const

// Opportunity ID → vault address (Mantle Sepolia)
// usdy-safety uses the same USDY vault as usdy
export const VAULT_ADDRESSES: Record<string, `0x${string}`> = {
  usdy:        process.env.NEXT_PUBLIC_VAULT_USDY as `0x${string}`,
  'usdy-safety': process.env.NEXT_PUBLIC_VAULT_USDY as `0x${string}`,
  musd:        process.env.NEXT_PUBLIC_VAULT_MUSD as `0x${string}`,
  meth:        process.env.NEXT_PUBLIC_VAULT_METH as `0x${string}`,
}

// Opportunity ID → district mapping
export const VAULT_DISTRICTS: Record<string, 'income' | 'staking' | 'growth'> = {
  usdy:          'income',
  'usdy-safety': 'income',
  musd:          'income',
  meth:          'staking',
}

export const MNT_USD = 0.35
