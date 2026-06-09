'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserIsland } from '@/types/atlas'

export interface Snapshot {
  ts: string
  totalValue: number
  healthScore: number
  monthlyIncome: number
  yieldEarned: number
  event?: string
}

export function usePortfolioHistory(wallet: string | undefined) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  // Load history on wallet connect
  useEffect(() => {
    if (!wallet) { setSnapshots([]); return }
    fetch(`/api/snapshots?wallet=${wallet}`)
      .then(r => r.json())
      .then(({ snapshots: rows }) => {
        if (rows) setSnapshots(rows.map((r: Record<string, unknown>) => ({
          ts: r.ts as string,
          totalValue: r.total_value as number,
          healthScore: r.health_score as number,
          monthlyIncome: r.monthly_income as number,
          yieldEarned: r.yield_earned as number,
          event: r.event as string | undefined,
        })))
      })
      .catch(() => {})
  }, [wallet])

  // Save a snapshot (called after allocation confirms)
  const saveSnapshot = useCallback(async (
    portfolio: UserIsland,
    event?: string
  ) => {
    if (!wallet) return
    const snap: Snapshot = {
      ts: new Date().toISOString(),
      totalValue: portfolio.totalValue,
      healthScore: portfolio.healthScore,
      monthlyIncome: portfolio.positions.reduce((s, p) => s + p.income, 0),
      yieldEarned: portfolio.positions.reduce((s, p) => s + (p.yieldEarned ?? 0), 0),
      event,
    }
    setSnapshots(prev => [...prev, snap])
    await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, ...snap }),
    }).catch(() => {})
  }, [wallet])

  return { snapshots, saveSnapshot }
}
