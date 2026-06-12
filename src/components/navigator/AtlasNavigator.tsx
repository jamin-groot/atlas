'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

export interface NavigatorContext {
  phase: string
  activeDistrict?: string | null
  activeOp?: string | null
  portfolio?: { totalValue: number; healthScore: number; monthlyIncome: number } | null
  event: string
  goal?: { type: string; label: string } | null
  goalProgress?: number | null
}

interface Props {
  context: NavigatorContext | null
  visible: boolean
  onExplore?: () => void
  onSuggestRoute?: () => void
}

export function AtlasNavigator({ context, visible, onExplore, onSuggestRoute }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [show, setShow] = useState(false)
  const [routeAction, setRouteAction] = useState<'suggest' | 'explore' | null>(null)
  const abortRef   = useRef<AbortController | null>(null)
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contextKey = context ? JSON.stringify(context) : null

  useEffect(() => {
    if (!visible || !context) return

    abortRef.current?.abort()
    if (dismissRef.current) clearTimeout(dismissRef.current)

    const abort = new AbortController()
    abortRef.current = abort

    setDisplayed('')
    setStreaming(true)
    setShow(true)
    setRouteAction(null)

    ;(async () => {
      try {
        const res = await fetch('/api/navigator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) return

        // Read X-Route-Action header before streaming body
        const action = res.headers.get('X-Route-Action') as 'suggest' | 'explore' | null
        if (action) setRouteAction(action)

        const reader  = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setDisplayed(prev => prev + decoder.decode(value, { stream: true }))
        }
      } catch {
        // aborted
      } finally {
        setStreaming(false)
        dismissRef.current = setTimeout(() => setShow(false), 12000)
      }
    })()

    return () => {
      abort.abort()
      if (dismissRef.current) clearTimeout(dismissRef.current)
    }
  }, [contextKey, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {visible && show && displayed && (
        <motion.div
          initial={{ opacity: 0, x: -16, scale: 0.97 }}
          animate={{ opacity: 1, x: 0,   scale: 1 }}
          exit={{   opacity: 0, x: -12,  scale: 0.97 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-72"
        >
          <div className="relative rounded-2xl border border-white/10 bg-[#0b1220]/90 backdrop-blur-xl overflow-hidden">

            {/* Top gradient edge */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />

            <div className="p-4 flex items-start gap-4">
              {/* Avatar orb */}
              <div className="flex-shrink-0 relative w-12 h-12">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-[#3B82F6]/40 animate-pulse" />
                {/* Inner ring */}
                <div className="absolute inset-1 rounded-full border border-[#3B82F6]/20" />
                {/* Orb bg */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a2a6c] via-[#0d1a4a] to-[#0a1230]" />
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    {/* Helm/navigator icon */}
                    <circle cx="12" cy="12" r="3" stroke="#3B82F6" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="7" stroke="#3B82F6" strokeWidth="1" strokeDasharray="2 2" />
                    <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7.05 7.05L5.64 5.64M18.36 18.36l-1.41-1.41M7.05 16.95l-1.41 1.41M18.36 5.64l-1.41 1.41" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </div>
                {/* Streaming glow */}
                {streaming && (
                  <div className="absolute inset-0 rounded-full bg-[#3B82F6]/15 animate-ping" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-[#3B82F6]/80 uppercase tracking-[0.2em] mb-1.5">
                  Atlas Navigator
                </p>
                <p className="text-sm text-white/85 leading-relaxed">
                  {displayed}
                  {streaming && (
                    <span className="inline-block w-[2px] h-3.5 bg-[#3B82F6] ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            </div>

            {/* Action button — only shown when Navigator decides it's warranted */}
            {!streaming && routeAction && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-4 pb-4"
              >
                <button
                  onClick={() => {
                    setShow(false)
                    if (routeAction === 'suggest' && onSuggestRoute) onSuggestRoute()
                    else if (routeAction === 'explore' && onExplore) onExplore()
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all group"
                  style={{
                    borderColor: routeAction === 'suggest' ? 'rgba(52,209,134,0.3)' : 'rgba(255,255,255,0.1)',
                    background: routeAction === 'suggest' ? 'rgba(52,209,134,0.06)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <span className="text-xs font-mono uppercase tracking-wider transition-colors"
                    style={{ color: routeAction === 'suggest' ? '#34D186' : 'rgba(255,255,255,0.7)' }}>
                    {routeAction === 'suggest' ? 'View Route →' : 'Explore Districts →'}
                  </span>
                </button>
              </motion.div>
            )}

            {/* Bottom gradient edge */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
