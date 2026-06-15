'use client'

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { UserIsland } from '@/types/atlas'
import { useMemoryProfile } from '@/hooks/useMemoryProfile'
import { useAgentAlerts, AgentAlert } from '@/hooks/useAgentAlerts'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AllocateAction {
  opportunityId: string
  amount: number
}

interface Props {
  portfolio: UserIsland | null
  visible: boolean
  wallet?: string | null
  onAllocate?: (action: AllocateAction) => void
  agentAlertCount?: number
}

const SUGGESTIONS = [
  'Scout the chain — what\'s the best opportunity right now?',
  'Where should I allocate my idle MNT?',
  'Allocate $100 to the highest safe yield',
  'How do I improve my health score?',
]

// Parse action from assistant message — supports both legacy [ACTION:...] and server-side <!--ACTION:...--> formats
function parseAction(content: string): AllocateAction | null {
  const legacy = content.match(/\[ACTION:allocate:([\w-]+):(\d+(?:\.\d+)?)\]/)
  if (legacy) return { opportunityId: legacy[1], amount: parseFloat(legacy[2]) }
  const server = content.match(/<!--ACTION:([\w-]+):(\d+(?:\.\d+)?)-->/)
  if (server) return { opportunityId: server[1], amount: parseFloat(server[2]) }
  return null
}

function stripAction(content: string): string {
  return content
    .replace(/\[ACTION:allocate:[\w-]+:\d+(?:\.\d+)?\]/g, '')
    .replace(/\[ACTION:allocate[^\]]*$/g, '')
    .replace(/<!--ACTION:[\w-]+:\d+(?:\.\d+)?-->/g, '')
    .trim()
}

export interface NavigatorChatHandle {
  sendMessage: (text: string) => void
}

export const NavigatorChat = forwardRef<NavigatorChatHandle, Props>(function NavigatorChat({ portfolio, visible, wallet, onAllocate, agentAlertCount = 0 }: Props, ref) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingAction, setPendingAction] = useState<AllocateAction | null>(null)
  const lastDispatchedAction = useRef<AllocateAction | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [unread, setUnread] = useState(false)
  const { alerts, unread: alertUnread, markRead, markAllRead } = useAgentAlerts(wallet ?? undefined)
  const [isDragging, setIsDragging] = useState(false)
  const [removingPolicy, setRemovingPolicy] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const dragControls = useDragControls()
  const profile = useMemoryProfile(wallet)

  useEffect(() => {
    if (open) {
      setUnread(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const portfolioContext = portfolio ? {
      totalValue: portfolio.totalValue,
      healthScore: portfolio.healthScore,
      monthlyIncome: portfolio.positions.reduce((s, p) => s + p.income, 0),
      allocation: portfolio.allocation,
      positions: portfolio.positions.map(p => ({
        opportunityId: p.opportunityId,
        currentValue: p.currentValue,
        yieldEarned: p.yieldEarned ?? 0,
        income: p.income,
      })),
    } : null

    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Placeholder for streaming response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, portfolioContext, wallet: wallet ?? null }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }

      if (!open) setUnread(true)

      // Parse action tag from final response and strip it from display
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant') {
          const action = parseAction(last.content)
          if (action) {
            setPendingAction(action)
            updated[updated.length - 1] = { ...last, content: stripAction(last.content) }
          }
        }
        return updated
      })
    } catch {
      // aborted
    } finally {
      setStreaming(false)
    }
  }, [messages, portfolio, streaming, open])

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      setOpen(true)
      setTimeout(() => send(text), 150)
    }
  }), [send])

  if (!visible) return null

  return (
    <>
      {/* Chat panel — draggable */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-1/2 z-20 w-96 flex flex-col rounded-2xl border border-white/10 bg-[#080f1a]/95 backdrop-blur-xl overflow-hidden"
            style={{ maxHeight: '420px', x: '-50%' }}
          >
            {/* Header — drag handle */}
            <div
              onPointerDown={e => { e.preventDefault(); dragControls.start(e) }}
              className="flex items-center justify-between px-4 py-3 border-b border-white/8 select-none"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]" />
                <span className="text-xs font-mono text-white/70 uppercase tracking-widest">Atlas Navigator</span>
                <span className="text-[9px] font-mono text-white/20 ml-1">· hold to move</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/30 hover:text-white/60 transition-colors text-xs pointer-events-auto"
              >✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 ? (
                <div className="space-y-3">
                  {/* Proactive agent alerts */}
                  {alerts.filter(a => !a.read).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-mono text-[#34D186]/60 uppercase tracking-widest px-1">
                        ⬡ Autonomous alerts — {alerts.filter(a => !a.read).length} new
                      </p>
                      {alerts.filter(a => !a.read).map((alert: AgentAlert) => (
                        <div key={alert.id}
                          className="rounded-xl border border-[#34D186]/30 bg-[#34D186]/6 px-3 py-2.5 relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]" />
                                <p className="text-[9px] font-mono text-[#34D186] uppercase tracking-wider">Navigator · Autonomous</p>
                              </div>
                              <p className="text-xs text-white/70 leading-relaxed">{alert.message}</p>
                              {alert.apy_from !== null && alert.apy_to !== null && (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] font-mono text-white/30">{alert.apy_from.toFixed(2)}%</span>
                                  <span className="text-[10px] text-white/20">→</span>
                                  <span className={`text-[10px] font-mono ${alert.apy_to > alert.apy_from ? 'text-[#34D186]' : 'text-red-400'}`}>
                                    {alert.apy_to.toFixed(2)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => { markRead(alert.id); send(`Tell me more about the ${alert.opportunity_id} yield change and what I should do`) }}
                              className="text-[9px] font-mono text-[#34D186]/60 hover:text-[#34D186] border border-[#34D186]/20 rounded-lg px-2 py-1 transition-colors flex-shrink-0"
                            >
                              Act →
                            </button>
                          </div>
                        </div>
                      ))}
                      <button onClick={markAllRead} className="text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors px-1">
                        Mark all read
                      </button>
                    </div>
                  )}

                  <div className="rounded-xl bg-[#34D186]/8 border border-[#34D186]/20 px-3 py-2.5">
                    <p className="text-[10px] font-mono text-[#34D186] uppercase tracking-wider mb-1">Atlas Navigator</p>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {portfolio
                        ? `I can see your portfolio — $${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total, health ${portfolio.healthScore}/100. I can allocate capital for you directly. Just ask.`
                        : 'Connect your wallet and I\'ll analyse your positions. I can also execute allocations directly on Mantle.'}
                    </p>
                  </div>
                  {/* Active Policies */}
                  {profile?.policies && profile.policies.length > 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Active Policies</p>
                      <div className="space-y-1.5">
                        {profile.policies.map((policy, i) => (
                          <div key={i} className="flex items-start gap-2 group">
                            <span className="text-[#34D186] text-[9px] mt-0.5 flex-shrink-0">◆</span>
                            <span className="text-[11px] text-white/55 leading-snug flex-1">{policy}</span>
                            <button
                              onClick={() => {
                                setRemovingPolicy(policy)
                                send(`Remove this policy from my rules: "${policy}"`)
                              }}
                              disabled={removingPolicy === policy}
                              className="opacity-0 group-hover:opacity-100 text-[9px] font-mono text-white/25 hover:text-red-400/60 transition-all flex-shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] font-mono text-white/20 mt-2 leading-relaxed">
                        Say &ldquo;add a policy&rdquo; or type a rule — Navigator will remember it.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-[11px] font-mono text-white/45 hover:text-white/75 border border-white/8 hover:border-white/20 rounded-lg px-3 py-2 transition-all"
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-white/10 text-white/80'
                          : 'bg-[#34D186]/10 border border-[#34D186]/20 text-white/80'
                      }`}
                    >
                      {stripAction(m.content)}
                      {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                        <span className="inline-block w-1.5 h-3 bg-[#34D186] ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                ))
              )}
              {/* Execute allocation button — shown when Navigator queues an action */}
              {pendingAction && !streaming && (
                <div className="flex justify-start">
                  <button
                    onClick={() => {
                      lastDispatchedAction.current = pendingAction
                      onAllocate?.(pendingAction)
                      setPendingAction(null)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
                    style={{ backgroundColor: '#34D186', color: '#000' }}
                  >
                    Execute — ${pendingAction.amount} → {pendingAction.opportunityId.toUpperCase()} →
                  </button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/8 px-3 py-2.5 flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                placeholder="Ask the Navigator…"
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none font-mono"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                className="text-[#34D186]/60 hover:text-[#34D186] transition-colors disabled:opacity-30 text-sm"
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar trigger — exposed as a ref-able button for the parent to render */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-2 text-xs font-mono border rounded-full px-3 py-1.5 transition-all"
        style={{
          borderColor: open ? '#34D18660' : 'rgba(255,255,255,0.1)',
          color: open ? '#34D186' : 'rgba(255,255,255,0.5)',
          background: open ? '#34D18610' : 'transparent',
        }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]"
          animate={alertUnread > 0 ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.8 }}
        />
        Navigator
        {(unread || alertUnread > 0) && !open && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#34D186] flex items-center justify-center">
            <span className="text-[8px] font-mono text-black font-bold leading-none">
              {alertUnread > 0 ? alertUnread : '·'}
            </span>
          </div>
        )}
      </motion.button>
    </>
  )
})
