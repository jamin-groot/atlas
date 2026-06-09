import Anthropic from '@anthropic-ai/sdk'
import { createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mantleSepolia } from '@/lib/wagmi/config'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_ATLAS_REGISTRY_ADDRESS as `0x${string}`
const AGENT_ID = BigInt(process.env.NEXT_PUBLIC_ATLAS_AGENT_ID ?? '1')
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`

const REGISTRY_ABI = parseAbi([
  'function recordDecision(uint256 agentId, string decisionType, string payload) returns (uint256)',
])

const SYSTEM_PROMPT = `You are Atlas Navigator — the AI guide inside Atlas, a spatial wealth exploration platform for Web3.

Atlas is not a dashboard. It is a navigable 3D world where capital has destinations.

Your role:
- Guide users through wealth opportunities on the Mantle blockchain
- Surface insights about their portfolio and unexplored opportunities
- Suggest routes from their current position to better allocation
- Be concise, direct, and contextual — never more than 2 sentences
- Sound like a knowledgeable co-pilot, not a chatbot
- Reference specific assets: mETH (staking), USDY (treasury yield), mUSD (stable yield)
- Always ground suggestions in the user's actual portfolio state when provided

Tone: calm, confident, spatial. Use navigational language — destinations, routes, districts, opportunities.
Never use generic AI phrases. Never be verbose. One insight at a time.`

export async function POST(req: Request) {
  const { context } = await req.json()
  const userMessage = buildPrompt(context)

  // Collect full response for on-chain recording
  let fullResponse = ''

  const stream = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 150,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullResponse += event.delta.text
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()

      // Record decision on Mantle — fire and forget, don't block the stream
      recordOnChain(context, fullResponse).catch(() => {})
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

async function recordOnChain(context: Record<string, unknown>, response: string) {
  if (!REGISTRY_ADDRESS || !PRIVATE_KEY) return

  try {
    const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, '')}`)
    const walletClient = createWalletClient({
      account,
      chain: mantleSepolia,
      transport: http(),
    })

    const decisionType = context.activeOp
      ? 'opportunity_recommendation'
      : context.activeDistrict
      ? 'route_suggestion'
      : 'portfolio_analysis'

    const payload = JSON.stringify({
      event: context.event,
      phase: context.phase,
      district: context.activeDistrict ?? null,
      opportunity: context.activeOp ?? null,
      response,
      timestamp: new Date().toISOString(),
    })

    await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'recordDecision',
      args: [AGENT_ID, decisionType, payload],
    })
  } catch {
    // Silent — on-chain recording should never block the UI
  }
}

function buildPrompt(context: {
  phase: string
  activeDistrict?: string | null
  activeOp?: string | null
  portfolio?: { totalValue: number; healthScore: number; monthlyIncome: number } | null
  event: string
}): string {
  const parts: string[] = [`Event: ${context.event}`]
  if (context.portfolio) {
    parts.push(`Portfolio: $${context.portfolio.totalValue.toLocaleString()} total, health ${context.portfolio.healthScore}/100, $${context.portfolio.monthlyIncome}/month income`)
  }
  if (context.activeDistrict) parts.push(`Current district: ${context.activeDistrict}`)
  if (context.activeOp) parts.push(`Viewing opportunity: ${context.activeOp}`)
  parts.push(`Phase: ${context.phase}`)
  parts.push('Respond with one short navigator message (max 2 sentences).')
  return parts.join('\n')
}
