import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.sepolia.mantle.xyz'] } },
  blockExplorers: { default: { name: 'Mantle Sepolia Explorer', url: 'https://explorer.sepolia.mantle.xyz' } },
})

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_ATLAS_REGISTRY_ADDRESS as `0x${string}`
const AGENT_ID = BigInt(process.env.NEXT_PUBLIC_ATLAS_AGENT_ID ?? '1')

const REGISTRY_ABI = [
  {
    name: 'recordDecision',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId',      type: 'uint256' },
      { name: 'decisionType', type: 'string'  },
      { name: 'payload',      type: 'string'  },
    ],
    outputs: [{ name: 'decisionIndex', type: 'uint256' }],
  },
  {
    name: 'totalDecisions',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getDecisionCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

export interface DecisionPayload {
  decisionType: 'opportunity_recommendation' | 'allocation_executed' | 'portfolio_analysis' | 'route_suggestion'
  opportunityId?: string
  amountUsd?: number
  recommendedApy?: number
  userAddress?: string
  reasoning?: string    // short summary of why this was recommended
  txHash?: string       // if execution
}

function buildPayloadJson(d: DecisionPayload): string {
  return JSON.stringify({
    agentId: AGENT_ID.toString(),
    type:    d.decisionType,
    ...(d.opportunityId  && { opportunityId:    d.opportunityId }),
    ...(d.amountUsd      && { amountUsd:        d.amountUsd }),
    ...(d.recommendedApy && { recommendedApy:   d.recommendedApy }),
    ...(d.userAddress    && { userAddress:       d.userAddress }),
    ...(d.reasoning      && { reasoning:         d.reasoning.slice(0, 200) }),
    ...(d.txHash         && { txHash:            d.txHash }),
    ts: Math.floor(Date.now() / 1000),
  })
}

export async function POST(req: Request) {
  const body: DecisionPayload = await req.json()

  if (!REGISTRY_ADDRESS || !process.env.DEPLOYER_PRIVATE_KEY) {
    return Response.json({ ok: false, error: 'missing config' }, { status: 500 })
  }

  try {
    const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY}` as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: mantleSepolia, transport: http() })
    const publicClient = createPublicClient({ chain: mantleSepolia, transport: http() })

    const payload = buildPayloadJson(body)

    const hash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi:     REGISTRY_ABI,
      functionName: 'recordDecision',
      args:    [AGENT_ID, body.decisionType, payload],
    })

    // Wait for 1 confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 })

    const explorerUrl = `https://explorer.sepolia.mantle.xyz/tx/${hash}`

    return Response.json({
      ok: true,
      hash,
      explorerUrl,
      blockNumber: receipt.blockNumber.toString(),
    })
  } catch (err) {
    console.error('[decisions]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// GET — return current decision count (for transparency dashboard)
export async function GET() {
  try {
    const publicClient = createPublicClient({ chain: mantleSepolia, transport: http() })
    const [total, agentCount] = await Promise.all([
      publicClient.readContract({ address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'totalDecisions' }),
      publicClient.readContract({ address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'getDecisionCount', args: [AGENT_ID] }),
    ])
    return Response.json({
      totalDecisions: total.toString(),
      agentDecisions: agentCount.toString(),
      agentId: AGENT_ID.toString(),
      registryAddress: REGISTRY_ADDRESS,
      explorerUrl: `https://explorer.sepolia.mantle.xyz/address/${REGISTRY_ADDRESS}`,
    })
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
