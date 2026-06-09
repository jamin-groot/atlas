import { createPublicClient, http, parseAbi } from 'viem'
import { mantleSepolia } from '@/lib/wagmi/config'

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_ATLAS_REGISTRY_ADDRESS as `0x${string}`
export const AGENT_ID = BigInt(process.env.NEXT_PUBLIC_ATLAS_AGENT_ID ?? '1')

const REGISTRY_ABI = parseAbi([
  'function getDecisionCount(uint256 agentId) view returns (uint256)',
  'function getRecentDecisions(uint256 agentId, uint256 count) view returns ((uint256 agentId, string decisionType, string payload, bytes32 payloadHash, uint256 timestamp, address recorder)[])',
  'function getMetadata(uint256 agentId, string key) view returns (bytes)',
  'event DecisionRecorded(uint256 indexed agentId, string decisionType, bytes32 payloadHash, uint256 indexed decisionIndex)',
])

export const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport: http(),
})

export async function getDecisionCount(): Promise<number> {
  if (!REGISTRY_ADDRESS) return 0
  try {
    const count = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'getDecisionCount',
      args: [AGENT_ID],
    })
    return Number(count)
  } catch {
    return 0
  }
}

export interface OnChainDecision {
  decisionType: string
  payload: string
  payloadHash: string
  timestamp: number
  recorder: string
}

export async function getRecentDecisions(count = 5): Promise<OnChainDecision[]> {
  if (!REGISTRY_ADDRESS) return []
  try {
    const decisions = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'getRecentDecisions',
      args: [AGENT_ID, BigInt(count)],
    })
    return decisions.map((d: any) => ({
      decisionType: d.decisionType,
      payload: d.payload,
      payloadHash: d.payloadHash,
      timestamp: Number(d.timestamp),
      recorder: d.recorder,
    }))
  } catch {
    return []
  }
}

export function getExplorerUrl(hash?: string): string {
  const base = 'https://explorer.sepolia.mantle.xyz'
  if (!hash) return `${base}/address/${REGISTRY_ADDRESS}`
  return `${base}/tx/${hash}`
}

export const REGISTRY_ADDRESS_EXPORT = REGISTRY_ADDRESS
