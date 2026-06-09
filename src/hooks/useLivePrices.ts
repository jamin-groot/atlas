'use client'

import { useState, useEffect, useRef } from 'react'

export interface LivePrices {
  mntUsd: number
  apys: { meth: number; usdy: number; musd: number }
  loading: boolean
  fetchedAt: string | null
}

export interface ApyAlert {
  asset: 'meth' | 'usdy' | 'musd'
  prev: number
  curr: number
  delta: number  // positive = up, negative = down
}

const POLL_INTERVAL      = 60_000 // 1 min
const APY_ALERT_THRESHOLD = 0.2   // trigger if APY moves ≥ 0.2%

// Module-level cache so multiple component mounts share one fetch
let _cache:    LivePrices | null = null
let _prevApys: { meth: number; usdy: number; musd: number } | null = null

let _listeners:      Array<(p: LivePrices) => void>      = []
let _alertListeners: Array<(a: ApyAlert[]) => void>      = []
let _timer: ReturnType<typeof setInterval> | null = null

async function doFetch(): Promise<LivePrices> {
  try {
    const res = await fetch('/api/prices')
    if (!res.ok) throw new Error('price fetch failed')
    const data = await res.json()
    return {
      mntUsd:    data.mntUsd,
      apys:      data.apys,
      loading:   false,
      fetchedAt: data.fetchedAt,
    }
  } catch {
    return _cache ?? {
      mntUsd:    0.35,
      apys:      { meth: 3.8, usdy: 5.1, musd: 4.8 },
      loading:   false,
      fetchedAt: null,
    }
  }
}

function detectChanges(
  prev: { meth: number; usdy: number; musd: number },
  curr: { meth: number; usdy: number; musd: number },
): ApyAlert[] {
  const keys: Array<'meth' | 'usdy' | 'musd'> = ['meth', 'usdy', 'musd']
  return keys
    .map(k => ({ asset: k, prev: prev[k], curr: curr[k], delta: curr[k] - prev[k] }))
    .filter(a => Math.abs(a.delta) >= APY_ALERT_THRESHOLD)
}

async function fetchAndBroadcast() {
  const next = await doFetch()

  // Detect APY shifts before overwriting _prevApys
  if (_prevApys) {
    const alerts = detectChanges(_prevApys, next.apys)
    if (alerts.length > 0) {
      _alertListeners.forEach(fn => fn(alerts))
    }
  }

  _prevApys = { ...next.apys }
  _cache    = next
  _listeners.forEach(fn => fn(next))
}

function subscribe(fn: (p: LivePrices) => void) {
  _listeners.push(fn)
  if (!_timer) {
    _timer = setInterval(fetchAndBroadcast, POLL_INTERVAL)
  }
  return () => {
    _listeners = _listeners.filter(l => l !== fn)
    if (_listeners.length === 0 && _timer) {
      clearInterval(_timer)
      _timer = null
    }
  }
}

/** Subscribe to APY change alerts. Returns an unsubscribe function. */
export function subscribeToApyAlerts(fn: (alerts: ApyAlert[]) => void): () => void {
  _alertListeners.push(fn)
  return () => { _alertListeners = _alertListeners.filter(l => l !== fn) }
}

export function useLivePrices(): LivePrices {
  const [prices, setPrices] = useState<LivePrices>(
    _cache ?? {
      mntUsd:    0.35,
      apys:      { meth: 3.8, usdy: 5.1, musd: 4.8 },
      loading:   true,
      fetchedAt: null,
    }
  )

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    const unsub = subscribe(p => { if (mounted.current) setPrices(p) })

    // Fetch immediately if cache is stale / missing
    if (!_cache || Date.now() - new Date(_cache.fetchedAt ?? 0).getTime() > POLL_INTERVAL) {
      fetchAndBroadcast()
    }

    return () => {
      mounted.current = false
      unsub()
    }
  }, [])

  return prices
}
