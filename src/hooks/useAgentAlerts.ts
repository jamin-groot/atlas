'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface AgentAlert {
  id: string
  wallet: string
  opportunity_id: string | null
  message: string
  apy_from: number | null
  apy_to: number | null
  action: string | null
  read: boolean
  created_at: string
}

export function useAgentAlerts(wallet: string | undefined) {
  const [alerts, setAlerts] = useState<AgentAlert[]>([])
  const [unread, setUnread] = useState(0)

  const fetchAlerts = useCallback(async () => {
    if (!wallet) { setAlerts([]); setUnread(0); return }

    const { data } = await supabase
      .from('agent_alerts')
      .select('*')
      .eq('wallet', wallet.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setAlerts(data)
      setUnread(data.filter((a: AgentAlert) => !a.read).length)
    }
  }, [wallet])

  // Poll every 2 minutes
  useEffect(() => {
    fetchAlerts()
    const iv = setInterval(fetchAlerts, 2 * 60 * 1000)
    return () => clearInterval(iv)
  }, [fetchAlerts])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('agent_alerts').update({ read: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
    setUnread(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!wallet) return
    await supabase.from('agent_alerts').update({ read: true }).eq('wallet', wallet.toLowerCase())
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    setUnread(0)
  }, [wallet])

  return { alerts, unread, markRead, markAllRead, refresh: fetchAlerts }
}
