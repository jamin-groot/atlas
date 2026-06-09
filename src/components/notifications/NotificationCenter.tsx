'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type NotificationType = 'achievement' | 'route' | 'allocation' | 'navigator' | 'health' | 'alert'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  timestamp: Date
  read: boolean
  action?: { label: string; onClick: () => void }
}

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  achievement: { icon: '◈', color: '#F59E0B' },
  route:       { icon: '→', color: '#34D186' },
  allocation:  { icon: '✓', color: '#3B82F6' },
  navigator:   { icon: '◉', color: '#A855F7' },
  health:      { icon: '↑', color: '#34D186' },
  alert:       { icon: '⚡', color: '#F97316' },
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface Props {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onClear: () => void
}

export function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      {/* Bell button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:border-white/25 transition-all"
        style={{ background: open ? 'rgba(255,255,255,0.06)' : 'transparent' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5C4.79 1.5 3 3.29 3 5.5v3.25L2 10h10l-1-1.25V5.5C11 3.29 9.21 1.5 7 1.5z"
            stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5.5 10.5a1.5 1.5 0 003 0" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        </svg>

        {unread > 0 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[#34D186] flex items-center justify-center"
          >
            <span className="text-[9px] font-mono text-black font-bold px-0.5">{unread > 9 ? '9+' : unread}</span>
          </motion.div>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30" onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-10 z-40 w-80 rounded-2xl border border-white/10 bg-[#080f1a]/97 backdrop-blur-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Notifications</span>
                <div className="flex items-center gap-3">
                  {unread > 0 && (
                    <button onClick={onMarkAllRead}
                      className="text-[10px] font-mono text-[#34D186]/70 hover:text-[#34D186] transition-colors">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={onClear}
                      className="text-[10px] font-mono text-white/25 hover:text-white/50 transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-white/20 text-xs font-mono">No notifications yet.</p>
                    <p className="text-white/10 text-[10px] mt-1">Allocate, explore, earn achievements.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map(n => {
                      const cfg = TYPE_CONFIG[n.type]
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => {
                            onMarkRead(n.id)
                            if (n.action) {
                              n.action.onClick()
                              setOpen(false)
                            }
                          }}
                          className="flex gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
                        >
                          {/* Icon */}
                          <div
                            className="w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ borderColor: cfg.color + '40', background: cfg.color + '10' }}
                          >
                            <span className="text-xs" style={{ color: cfg.color }}>{cfg.icon}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-white truncate">{n.title}</p>
                              {!n.read && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#34D186] flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-white/45 leading-relaxed mt-0.5">{n.body}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] font-mono text-white/25">{timeAgo(n.timestamp)}</span>
                              {n.action && (
                                <span className="text-[10px] font-mono" style={{ color: cfg.color + '80' }}>
                                  {n.action.label} →
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
