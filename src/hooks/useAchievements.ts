'use client'

import { useCallback, useState } from 'react'

export interface Achievement {
  id: string
  name: string
  symbol: string
  desc?: string
}

export function useAchievements(wallet: string | undefined) {
  const [earned, setEarned] = useState<Achievement[]>([])
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)

  const checkAndMint = useCallback(async (achievementId: string) => {
    if (!wallet) return

    try {
      const res = await fetch('/api/achievements/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, achievementId }),
      })
      const data = await res.json()

      if (data.success && data.achievement) {
        const ach: Achievement = {
          id: data.achievement.id,
          name: data.achievement.name,
          symbol: data.achievement.symbol,
          desc: data.achievement.desc,
        }
        setEarned(prev => [...prev, ach])
        setNewAchievement(ach)
        // Auto-clear toast after 5s
        setTimeout(() => setNewAchievement(null), 5000)
      }
    } catch {
      // silent
    }
  }, [wallet])

  const loadAchievements = useCallback(async () => {
    if (!wallet) return
    try {
      const res = await fetch(`/api/achievements/mint?wallet=${wallet}`)
      const data = await res.json()
      setEarned(data.achievements?.map((a: any) => ({
        id: a.id, name: a.name, symbol: a.symbol,
      })) ?? [])
    } catch { /* silent */ }
  }, [wallet])

  return { earned, newAchievement, checkAndMint, loadAchievements, clearNew: () => setNewAchievement(null) }
}
