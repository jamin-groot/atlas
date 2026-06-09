import { createWalletClient, createPublicClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mantleSepolia } from '@/lib/wagmi/config'

const ACHIEVEMENTS_ADDRESS = process.env.NEXT_PUBLIC_ATLAS_ACHIEVEMENTS_ADDRESS as `0x${string}`
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`

const ABI = parseAbi([
  'function mint(address recipient, string achievementId, string name, string symbol) returns (uint256)',
  'function hasAchievement(address user, string id) view returns (bool)',
  'function getUserAchievements(address user) view returns ((string id, string name, string symbol, address recipient, uint256 timestamp)[])',
])

export const ACHIEVEMENT_DEFS = [
  { id: 'first_steps',    name: 'First Steps',    symbol: '◈', trigger: 'first_allocation',  desc: 'Made your first allocation on Mantle.' },
  { id: 'income_seeker',  name: 'Income Seeker',  symbol: '◇', trigger: 'income_50',         desc: 'Reached $50/month passive income.' },
  { id: 'explorer',       name: 'World Explorer', symbol: '◉', trigger: 'visit_3_districts',  desc: 'Explored 3 or more districts.' },
  { id: 'health_master',  name: 'Health Master',  symbol: '◆', trigger: 'health_85',          desc: 'Achieved portfolio health score of 85+.' },
]

export async function POST(req: Request) {
  const { wallet, achievementId } = await req.json()
  if (!wallet || !achievementId || !ACHIEVEMENTS_ADDRESS || !PRIVATE_KEY) {
    return Response.json({ error: 'Missing params' }, { status: 400 })
  }

  const def = ACHIEVEMENT_DEFS.find(a => a.id === achievementId)
  if (!def) return Response.json({ error: 'Unknown achievement' }, { status: 400 })

  try {
    const publicClient = createPublicClient({ chain: mantleSepolia, transport: http() })

    // Check if already earned
    const already = await publicClient.readContract({
      address: ACHIEVEMENTS_ADDRESS,
      abi: ABI,
      functionName: 'hasAchievement',
      args: [wallet as `0x${string}`, achievementId],
    })
    if (already) return Response.json({ already: true })

    // Mint
    const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, '')}`)
    const walletClient = createWalletClient({ account, chain: mantleSepolia, transport: http() })

    const hash = await walletClient.writeContract({
      address: ACHIEVEMENTS_ADDRESS,
      abi: ABI,
      functionName: 'mint',
      args: [wallet as `0x${string}`, achievementId, def.name, def.symbol],
    })

    return Response.json({ success: true, hash, achievement: def })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get('wallet')
  if (!wallet || !ACHIEVEMENTS_ADDRESS) return Response.json({ achievements: [] })

  try {
    const publicClient = createPublicClient({ chain: mantleSepolia, transport: http() })
    const result = await publicClient.readContract({
      address: ACHIEVEMENTS_ADDRESS,
      abi: ABI,
      functionName: 'getUserAchievements',
      args: [wallet as `0x${string}`],
    })
    return Response.json({ achievements: result })
  } catch {
    return Response.json({ achievements: [] })
  }
}
