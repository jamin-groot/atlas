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

Atlas is a navigable 3D world where capital has destinations. Districts represent asset classes. Routes are suggested paths from where a user is to where they could be.

Your role is to give ONE short, contextual insight (max 2 sentences). You must also decide whether to surface a route to the user.

## Route decision rules
You decide whether a route is appropriate based on the user's goal and portfolio state:

- SUGGEST a route when:
  - The user has unallocated capital (health score below 70 or explicit unallocated funds mentioned)
  - Goal progress is below 80%
  - The user just set a goal and hasn't acted yet
  - The user just made an allocation and there's still more runway toward the goal

- DO NOT suggest a route when:
  - Goal progress is 80%+ (they're close or there — congratulate and tell them to hold)
  - The user is just exploring (no goal set, no portfolio connected)
  - The portfolio is well-diversified and healthy (health score 85+)
  - The user is currently viewing a specific opportunity (let them focus)
  - They just dismissed a route

## Response format
End your message with exactly one of these tags on its own line — nothing after it:
[ACTION:suggest]   — if a route should be shown
[ACTION:explore]   — if the user should just keep exploring, no route yet
[ACTION:none]      — if no button is needed (e.g. mid-flow, viewing opportunity)

## Tone
Calm, confident, spatial. Use navigational language — destinations, routes, districts, opportunities.
Never use generic AI phrases. Never be verbose. Reference real assets when relevant: mETH, USDY, mUSD.`

export async function POST(req: Request) {
  const { context } = await req.json()
  const userMessage = buildPrompt(context)

  let fullResponse = ''
  let routeAction: 'suggest' | 'explore' | null = null

  const stream = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 180,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  })

  // Collect full text first so we can strip the [ACTION:*] tag before streaming
  const chunks: string[] = []
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      chunks.push(event.delta.text)
    }
  }
  fullResponse = chunks.join('')

  // Parse and strip the action tag
  const actionMatch = fullResponse.match(/\[ACTION:(suggest|explore|none)\]/i)
  if (actionMatch) {
    const tag = actionMatch[1].toLowerCase()
    if (tag === 'suggest') routeAction = 'suggest'
    else if (tag === 'explore') routeAction = 'explore'
    fullResponse = fullResponse.replace(/\n?\[ACTION:(suggest|explore|none)\]/i, '').trim()
  }

  // Stream the cleaned text to the client
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    start(controller) {
      // Stream in small chunks to simulate typing effect
      const words = fullResponse.split(' ')
      let i = 0
      const interval = setInterval(() => {
        if (i >= words.length) {
          clearInterval(interval)
          controller.close()
          recordOnChain(context, fullResponse, routeAction).catch(() => {})
          return
        }
        const chunk = (i === 0 ? '' : ' ') + words[i]
        controller.enqueue(encoder.encode(chunk))
        i++
      }, 35)
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Route-Action': routeAction ?? 'none',
    },
  })
}

async function recordOnChain(context: Record<string, unknown>, response: string, action: string | null) {
  if (!REGISTRY_ADDRESS || !PRIVATE_KEY) return

  try {
    const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, '')}`)
    const walletClient = createWalletClient({
      account,
      chain: mantleSepolia,
      transport: http(),
    })

    const decisionType = action === 'suggest'
      ? 'route_suggestion'
      : context.activeOp
      ? 'opportunity_recommendation'
      : 'portfolio_analysis'

    const payload = JSON.stringify({
      event: context.event,
      phase: context.phase,
      district: context.activeDistrict ?? null,
      opportunity: context.activeOp ?? null,
      goal: context.goal ?? null,
      goalProgress: context.goalProgress ?? null,
      routeAction: action,
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
  goal?: { type: string; label: string } | null
  goalProgress?: number | null
  event: string
}): string {
  const parts: string[] = [`Trigger: ${context.event}`]

  if (context.portfolio) {
    parts.push(`Portfolio: $${context.portfolio.totalValue.toLocaleString()} total · health ${context.portfolio.healthScore}/100 · $${context.portfolio.monthlyIncome.toFixed(0)}/mo income`)
  } else {
    parts.push('Portfolio: not connected')
  }

  if (context.goal) {
    parts.push(`User goal: ${context.goal.label} (type: ${context.goal.type})`)
    if (typeof context.goalProgress === 'number') {
      parts.push(`Goal progress: ${context.goalProgress}% complete`)
    }
  } else {
    parts.push('User goal: not set')
  }

  if (context.activeDistrict) parts.push(`Active district: ${context.activeDistrict}`)
  if (context.activeOp) parts.push(`Viewing opportunity: ${context.activeOp}`)
  parts.push(`App phase: ${context.phase}`)

  return parts.join('\n')
}
