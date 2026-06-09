'use client'

import { useState, useCallback } from 'react'
import { Notification, NotificationType } from '@/components/notifications/NotificationCenter'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const push = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    action?: { label: string; onClick: () => void }
  ) => {
    const n: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      body,
      timestamp: new Date(),
      read: false,
      action,
    }
    setNotifications(prev => [n, ...prev].slice(0, 20))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clear = useCallback(() => setNotifications([]), [])

  return { notifications, push, markRead, markAllRead, clear }
}
