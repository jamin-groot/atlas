import { supabase } from './client'

// ─── Structured profile extracted from conversations ─────────────────────────
export interface UserProfile {
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
  goals?: string[]               // ["generate passive income", "save for house"]
  preferredAssets?: string[]     // ["usdy", "musd"]
  avoidedAssets?: string[]       // explicitly rejected assets
  monthlyIncomeTarget?: number   // $ target they mentioned
  liquidityPreference?: string   // "keep $500 liquid at all times"
  keyFacts?: string[]            // important freeform facts
  policies?: string[]            // natural language rules: "keep $500 liquid", "max 30% per district"
  lastAllocation?: { asset: string; amount: number; date: string }
  totalAllocated?: number        // running $ total across all sessions
  sessionCount?: number
}

export interface NavigatorMemory {
  wallet: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: {
    lastDistrict?: string
    lastOpportunity?: string
    allocations?: { name: string; amount: number; date: string }[]
    preferences?: string[]
    profile?: UserProfile        // extracted structured profile
  }
  updatedAt: string
}

// ─── Build the memory block injected into the system prompt ──────────────────
export function buildMemoryContext(memory: NavigatorMemory | null): string {
  if (!memory) return ''

  const lines: string[] = []
  const { context, messages } = memory
  const profile = context?.profile

  // ── Structured profile block ──
  if (profile && Object.keys(profile).length > 0) {
    lines.push('\n\n## Returning User — Memory Profile')

    if (profile.riskTolerance) {
      lines.push(`- Risk appetite: ${profile.riskTolerance} (stated by user)`)
    }
    if (profile.goals?.length) {
      lines.push(`- Goals: ${profile.goals.join('; ')}`)
    }
    if (profile.preferredAssets?.length) {
      lines.push(`- Prefers: ${profile.preferredAssets.map(a => a.toUpperCase()).join(', ')}`)
    }
    if (profile.avoidedAssets?.length) {
      lines.push(`- Avoids: ${profile.avoidedAssets.map(a => a.toUpperCase()).join(', ')}`)
    }
    if (profile.monthlyIncomeTarget) {
      lines.push(`- Monthly income target: $${profile.monthlyIncomeTarget}/mo`)
    }
    if (profile.liquidityPreference) {
      lines.push(`- Liquidity preference: ${profile.liquidityPreference}`)
    }
    if (profile.keyFacts?.length) {
      lines.push(`- Notes: ${profile.keyFacts.join('; ')}`)
    }
    if (profile.policies?.length) {
      lines.push(`\n### Active Policies (user-defined — enforce strictly)`)
      profile.policies.forEach(p => lines.push(`- ${p}`))
      lines.push(`Never recommend anything that violates these policies. If the user asks you to break a policy, acknowledge the constraint and suggest the closest compliant alternative.`)
    }
    if (profile.lastAllocation) {
      const a = profile.lastAllocation
      lines.push(`- Last allocation: $${a.amount} to ${a.asset.toUpperCase()} on ${a.date}`)
    }
    if (profile.totalAllocated) {
      lines.push(`- Total deployed across all sessions: $${profile.totalAllocated}`)
    }
    if (profile.sessionCount && profile.sessionCount > 1) {
      lines.push(`- Sessions: ${profile.sessionCount} visits`)
    }
    lines.push(`\nUse this profile to personalise every response. Reference their history naturally — don't announce that you remember. Just speak as if you know them.`)
  }

  // ── Recent conversation context (last 4 messages) ──
  if (messages?.length) {
    const recent = messages.slice(-4)
    const convo = recent.map(m => `${m.role === 'user' ? 'User' : 'Navigator'}: ${m.content}`).join('\n')
    lines.push(`\n\nRecent conversation:\n${convo}`)
  }

  // ── Past allocations ──
  if (context?.allocations?.length) {
    const allocs = context.allocations.map(a => `${a.name} $${a.amount} (${a.date})`).join(', ')
    lines.push(`\nPast allocations: ${allocs}`)
  }

  return lines.join('')
}

// ─── Load / save ─────────────────────────────────────────────────────────────
export async function loadMemory(wallet: string): Promise<NavigatorMemory | null> {
  const { data, error } = await supabase
    .from('navigator_memory')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .single()

  if (error || !data) return null
  return data as NavigatorMemory
}

export async function saveMemory(memory: NavigatorMemory): Promise<void> {
  await supabase
    .from('navigator_memory')
    .upsert({
      wallet: memory.wallet.toLowerCase(),
      messages: memory.messages,
      context: memory.context,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet' })
}

// ─── Update just the profile field ───────────────────────────────────────────
export async function saveProfile(wallet: string, profile: UserProfile, existing: NavigatorMemory | null): Promise<void> {
  const merged: UserProfile = {
    ...(existing?.context?.profile ?? {}),
    ...profile,
    // Merge arrays instead of replace
    goals: [...new Set([...(existing?.context?.profile?.goals ?? []), ...(profile.goals ?? [])])],
    preferredAssets: [...new Set([...(existing?.context?.profile?.preferredAssets ?? []), ...(profile.preferredAssets ?? [])])],
    avoidedAssets: [...new Set([...(existing?.context?.profile?.avoidedAssets ?? []), ...(profile.avoidedAssets ?? [])])],
    keyFacts: [...new Set([...(existing?.context?.profile?.keyFacts ?? []), ...(profile.keyFacts ?? [])])].slice(-10),
    policies: [...new Set([...(existing?.context?.profile?.policies ?? []), ...(profile.policies ?? [])])].slice(-10),
    sessionCount: (existing?.context?.profile?.sessionCount ?? 0) + 1,
    totalAllocated: (existing?.context?.profile?.totalAllocated ?? 0) + (profile.totalAllocated ?? 0),
  }

  await supabase
    .from('navigator_memory')
    .upsert({
      wallet: wallet.toLowerCase(),
      messages: existing?.messages ?? [],
      context: { ...(existing?.context ?? {}), profile: merged },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet' })
}
