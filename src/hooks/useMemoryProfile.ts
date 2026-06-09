'use client'

import { useState, useEffect } from 'react'
import { loadMemory } from '@/lib/supabase/memory'
import type { UserProfile } from '@/lib/supabase/memory'

export function useMemoryProfile(wallet: string | null | undefined): UserProfile | null {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!wallet) { setProfile(null); return }
    loadMemory(wallet).then(mem => {
      setProfile(mem?.context?.profile ?? null)
    }).catch(() => setProfile(null))
  }, [wallet])

  return profile
}
