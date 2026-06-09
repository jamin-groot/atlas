import Anthropic from '@anthropic-ai/sdk'
import { loadMemory, saveProfile } from '@/lib/supabase/memory'
import type { UserProfile } from '@/lib/supabase/memory'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_PROMPT = `You are a profile extractor. Read this DeFi portfolio conversation and extract structured facts about the user's preferences, goals, and any rules they want enforced.

Return ONLY valid JSON matching this shape (omit fields you have no evidence for):
{
  "riskTolerance": "conservative" | "moderate" | "aggressive",
  "goals": ["string"],
  "preferredAssets": ["usdy" | "musd" | "meth" | "mnt"],
  "avoidedAssets": ["usdy" | "musd" | "meth" | "mnt"],
  "monthlyIncomeTarget": number,
  "liquidityPreference": "string",
  "keyFacts": ["string"],
  "policies": ["string"],
  "totalAllocated": number
}

Rules:
- Only include a field if the user EXPLICITLY mentioned or implied it
- "totalAllocated" = sum of any allocation amounts confirmed in this conversation
- "keyFacts" = short, specific facts (max 5). Examples: "wants to save for a house", "checks portfolio weekly", "new to DeFi"
- "policies" = explicit rules the user wants the system to enforce. Examples: "keep $500 liquid at all times", "never put more than 30% in one asset", "only stable coins", "maximize yield, ignore risk". Rephrase as clear imperatives. Max 5.
- No null values — just omit missing fields
- Return {} if nothing useful can be extracted`

export async function POST(req: Request) {
  const { wallet, messages } = await req.json()

  if (!wallet || !messages?.length) {
    return new Response('missing wallet or messages', { status: 400 })
  }

  try {
    const existing = await loadMemory(wallet)

    // Format conversation for extraction
    const convo = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'User' : 'Navigator'}: ${m.content}`
      )
      .join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: `${EXTRACT_PROMPT}\n\nConversation:\n${convo}` }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'

    // Parse and validate
    let profile: UserProfile = {}
    try {
      const raw = JSON.parse(text)
      // Whitelist known fields
      if (raw.riskTolerance && ['conservative','moderate','aggressive'].includes(raw.riskTolerance)) {
        profile.riskTolerance = raw.riskTolerance
      }
      if (Array.isArray(raw.goals)) profile.goals = raw.goals.slice(0, 5)
      if (Array.isArray(raw.preferredAssets)) profile.preferredAssets = raw.preferredAssets
      if (Array.isArray(raw.avoidedAssets)) profile.avoidedAssets = raw.avoidedAssets
      if (typeof raw.monthlyIncomeTarget === 'number') profile.monthlyIncomeTarget = raw.monthlyIncomeTarget
      if (typeof raw.liquidityPreference === 'string') profile.liquidityPreference = raw.liquidityPreference
      if (Array.isArray(raw.keyFacts)) profile.keyFacts = raw.keyFacts.slice(0, 5)
      if (Array.isArray(raw.policies)) profile.policies = raw.policies.slice(0, 5)
      if (typeof raw.totalAllocated === 'number') profile.totalAllocated = raw.totalAllocated
    } catch {
      // Extraction failed — no-op, don't break the app
      return new Response(JSON.stringify({ ok: true, extracted: false }), { status: 200 })
    }

    if (Object.keys(profile).length > 0) {
      await saveProfile(wallet, profile, existing)
    }

    return new Response(JSON.stringify({ ok: true, extracted: true, profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[memory/extract]', err)
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }
}
