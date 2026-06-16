'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  url: string
  category: 'rwa' | 'defi' | 'mantle' | 'macro' | 'regulation'
  district?: string
  timestamp: string
  actionable: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  rwa: '#34D186',
  defi: '#A855F7',
  mantle: '#3B82F6',
  macro: '#F59E0B',
  regulation: '#06B6D4',
}

const CATEGORY_LABELS: Record<string, string> = {
  rwa: 'RWA',
  defi: 'DeFi',
  mantle: 'Mantle',
  macro: 'Macro',
  regulation: 'Regulation',
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface Props {
  onAskNavigator: (prompt: string) => void
}

export function MarketNews({ onAskNavigator }: Props) {
  const [open, setOpen] = useState(false)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/news')
      const { articles: data } = await res.json()
      setArticles(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && articles.length === 0) fetchNews()
  }, [open, articles.length, fetchNews])

  const filtered = filter ? articles.filter(a => a.category === filter) : articles

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono text-white/40 border border-white/8 rounded-full px-3 py-1.5 hover:text-white/70 hover:border-white/20 transition-all"
      >
        Market
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[440px] bg-[#0a0f1a]/60 backdrop-blur-2xl border-l border-white/10 overflow-hidden flex flex-col shadow-[-8px_0_60px_rgba(0,0,0,0.5),inset_1px_0_0_rgba(255,255,255,0.06)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                <div>
                  <h2 className="text-sm font-mono text-white/90 tracking-wide">Market Intelligence</h2>
                  <p className="text-[10px] font-mono text-white/30 mt-0.5">Crypto · RWA · Macro</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchNews}
                    className="text-[10px] font-mono text-white/30 border border-white/8 rounded-full px-2.5 py-1 hover:text-white/60 hover:border-white/20 transition-all"
                  >
                    ↻ Refresh
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Category filters */}
              <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/4">
                <button
                  onClick={() => setFilter(null)}
                  className={`text-[10px] font-mono rounded-full px-2.5 py-1 transition-all ${
                    filter === null
                      ? 'bg-white/10 text-white/80'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  All
                </button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(filter === key ? null : key)}
                    className={`text-[10px] font-mono rounded-full px-2.5 py-1 transition-all ${
                      filter === key
                        ? 'text-white/90'
                        : 'text-white/30 hover:text-white/50'
                    }`}
                    style={filter === key ? { background: `${CATEGORY_COLORS[key]}20`, color: CATEGORY_COLORS[key] } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Articles */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
                {loading && articles.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-[10px] font-mono text-white/30 animate-pulse">Scanning markets…</div>
                  </div>
                )}

                {filtered.map((article) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group py-3 border-b border-white/4 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Category + time */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ color: CATEGORY_COLORS[article.category], background: `${CATEGORY_COLORS[article.category]}15` }}
                          >
                            {CATEGORY_LABELS[article.category]}
                          </span>
                          {article.district && (
                            <span className="text-[9px] font-mono text-white/20">
                              → {article.district} district
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-white/20 ml-auto flex-shrink-0">
                            {timeAgo(article.timestamp)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[13px] font-mono text-white/85 leading-snug mb-1">
                          {article.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-[11px] font-mono text-white/40 leading-relaxed mb-2">
                          {article.summary}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-white/20">{article.source}</span>
                          {article.actionable && (
                            <button
                              onClick={() => {
                                onAskNavigator(
                                  `I just read this news: "${article.title}" — ${article.summary}. How does this affect my portfolio and what should I do?`
                                )
                                setOpen(false)
                              }}
                              className="text-[10px] font-mono text-[#34D186]/70 border border-[#34D186]/20 rounded-full px-2.5 py-0.5 hover:text-[#34D186] hover:border-[#34D186]/40 transition-all ml-auto opacity-0 group-hover:opacity-100"
                            >
                              Ask Navigator →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {!loading && filtered.length === 0 && (
                  <div className="text-center py-12 text-[11px] font-mono text-white/25">
                    No articles in this category
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
        document.body
      )}
    </>
  )
}
