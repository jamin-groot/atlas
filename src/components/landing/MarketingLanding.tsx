'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { CinematicEntry } from './CinematicEntry'

interface Props {
  onEnter: () => void
}


const ATLAS_LOGO = (w = 88, h = 32) => (
  <svg width={w} height={h} viewBox="0 0 136 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.1231 15.9405C21.1231 17.4054 19.9356 18.5929 18.4707 18.5929C17.0059 18.5929 15.8184 17.4054 15.8184 15.9405V6.77784C15.8184 5.31299 17.0059 4.12549 18.4707 4.12549C19.9356 4.12549 21.1231 5.31299 21.1231 6.77784V15.9405Z" fill="white"/>
    <path d="M13.173 25.001C14.8103 25.9463 15.8189 27.7083 15.8189 29.5988L15.8189 43.2222C15.8189 44.687 17.0064 45.8745 18.4713 45.8745C19.9361 45.8745 21.1236 44.687 21.1236 43.2222V28.7076C21.1236 27.3639 21.8405 26.1223 23.0042 25.4504L35.6734 18.1358C36.942 17.4034 37.3766 15.7812 36.6442 14.5126C35.9118 13.244 34.2896 12.8094 33.021 13.5418L20.3342 20.8666C19.1855 21.5298 17.7701 21.5298 16.6214 20.8666L3.97898 13.5675C2.71038 12.835 1.08822 13.2697 0.355792 14.5383C-0.376637 15.8069 0.0580175 17.4291 1.32662 18.1615L13.173 25.001Z" fill="white"/>
    <path d="M35.6039 31.8248C36.8725 32.5573 37.3072 34.1794 36.5748 35.448C35.8423 36.7166 34.2202 37.1513 32.9516 36.4189L25.0004 31.8283C23.7318 31.0958 23.2972 29.4737 24.0296 28.2051C24.762 26.9365 26.3842 26.5018 27.6528 27.2342L35.6039 31.8248Z" fill="white"/>
    <path d="M9.45405 27.1482C10.7227 26.4158 12.3448 26.8505 13.0772 28.1191C13.8097 29.3877 13.375 31.0098 12.1064 31.7423L4.00633 36.4189C2.73772 37.1513 1.11556 36.7166 0.383135 35.448C-0.349292 34.1794 0.0853614 32.5573 1.35396 31.8248L9.45405 27.1482Z" fill="white"/>
    <path d="M44.96 40L56.48 12H59.68L71.12 40H66.16L57.2 17.32H58.88L49.84 40H44.96ZM50.64 34.6V30.6H65.48V34.6H50.64ZM75.8444 40V12.8H80.2444V40H75.8444ZM71.2444 24.8V20.8H84.8444V24.8H71.2444ZM88.0416 40V11.2H92.4416V40H88.0416ZM105.378 40.4C103.645 40.4 102.072 39.96 100.658 39.08C99.2718 38.2 98.1651 37.0133 97.3384 35.52C96.5384 34 96.1384 32.3067 96.1384 30.44C96.1384 28.5467 96.5384 26.8533 97.3384 25.36C98.1651 23.84 99.2718 22.64 100.658 21.76C102.072 20.8533 103.645 20.4 105.378 20.4C106.845 20.4 108.138 20.72 109.258 21.36C110.405 21.9733 111.312 22.8267 111.978 23.92C112.645 25.0133 112.978 26.2533 112.978 27.64V33.16C112.978 34.5467 112.645 35.7867 111.978 36.88C111.338 37.9733 110.445 38.84 109.298 39.48C108.152 40.0933 106.845 40.4 105.378 40.4ZM106.098 36.24C107.725 36.24 109.032 35.6933 110.018 34.6C111.032 33.5067 111.538 32.1067 111.538 30.4C111.538 29.2533 111.312 28.24 110.858 27.36C110.405 26.48 109.765 25.8 108.938 25.32C108.138 24.8133 107.192 24.56 106.098 24.56C105.032 24.56 104.085 24.8133 103.258 25.32C102.458 25.8 101.818 26.48 101.338 27.36C100.885 28.24 100.658 29.2533 100.658 30.4C100.658 31.5467 100.885 32.56 101.338 33.44C101.818 34.32 102.458 35.0133 103.258 35.52C104.085 36 105.032 36.24 106.098 36.24ZM111.258 40V34.84L112.018 30.16L111.258 25.52V20.8H115.658V40H111.258ZM126.822 40.4C125.755 40.4 124.728 40.2667 123.742 40C122.755 39.7067 121.848 39.3067 121.022 38.8C120.195 38.2667 119.475 37.6267 118.862 36.88L121.662 34.08C122.328 34.8533 123.088 35.44 123.942 35.84C124.822 36.2133 125.808 36.4 126.902 36.4C127.888 36.4 128.635 36.2533 129.142 35.96C129.648 35.6667 129.902 35.24 129.902 34.68C129.902 34.0933 129.662 33.64 129.182 33.32C128.702 33 128.075 32.7333 127.302 32.52C126.555 32.28 125.755 32.04 124.902 31.8C124.075 31.56 123.275 31.24 122.502 30.84C121.755 30.4133 121.142 29.84 120.662 29.12C120.182 28.4 119.942 27.4667 119.942 26.32C119.942 25.0933 120.222 24.04 120.782 23.16C121.368 22.28 122.182 21.6 123.222 21.12C124.288 20.64 125.555 20.4 127.022 20.4C128.568 20.4 129.928 20.68 131.102 21.24C132.302 21.7733 133.302 22.5867 134.102 23.68L131.302 26.48C130.742 25.7867 130.102 25.2667 129.382 24.92C128.662 24.5733 127.835 24.4 126.902 24.4C126.022 24.4 125.342 24.5333 124.862 24.8C124.382 25.0667 124.142 25.4533 124.142 25.96C124.142 26.4933 124.382 26.9067 124.862 27.2C125.342 27.4933 125.955 27.7467 126.702 27.96C127.475 28.1733 128.275 28.4133 129.102 28.68C129.955 28.92 130.755 29.2667 131.502 29.72C132.275 30.1467 132.902 30.7333 133.382 31.48C133.862 32.2 134.102 33.1467 134.102 34.32C134.102 36.1867 133.448 37.6667 132.142 38.76C130.835 39.8533 129.062 40.4 126.822 40.4Z" fill="white"/>
  </svg>
)

export function MarketingLanding({ onEnter }: Props) {
  const [entering, setEntering] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (entering) return <CinematicEntry onComplete={onEnter} />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: 'none', background: 'transparent' }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 transition-all duration-500"
        style={{ background: scrolled ? 'rgba(3,7,18,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        {ATLAS_LOGO(80, 29)}
        <div className="hidden md:flex items-center gap-8">
          {['Product','Ecosystem','About'].map(l => (
            <span key={l} className="text-sm text-white/35 hover:text-white/70 transition-colors cursor-pointer">{l}</span>
          ))}
        </div>
        <button onClick={() => setEntering(true)}
          className="px-5 py-2 rounded-full text-xs font-mono tracking-[0.15em] uppercase border transition-all duration-300 hover:bg-white hover:text-black"
          style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', background: 'transparent' }}>
          Enter Atlas →
        </button>
      </nav>

      {/* ── HERO — 3D world fully visible behind ── */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: 'transparent' }}>
        {/* Centre vignette — just enough to make text legible */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_70%_at_50%_45%,rgba(3,7,18,0.52)_0%,transparent_100%)] pointer-events-none" />
        {/* Solid fade-to-dark at the bottom so sections below look clean */}
        <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 0%, #030712 100%)' }} />

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center gap-7 max-w-4xl pointer-events-auto">

          {/* Announcement badge — Giga style */}
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/12 bg-white/5 backdrop-blur-sm hover:border-white/20 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]" />
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">Now live on Mantle Sepolia</span>
            <span className="text-white/25 text-xs">›</span>
          </button>

          {/* Headline */}
          <h1 className="text-[48px] sm:text-[72px] lg:text-[96px] font-light leading-[1.02] tracking-[-0.025em] text-white">
            Wealth Has Never<br />Had A Map.
          </h1>

          {/* Sub */}
          <p className="text-white/40 text-base sm:text-lg leading-relaxed max-w-lg font-light px-2 sm:px-0">
            Explore opportunities, discover income, and navigate the future of capital through an intelligent world built for modern investors.
          </p>

          {/* CTA — Giga white button style */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-1 w-full sm:w-auto">
            <button onClick={() => setEntering(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-light bg-white text-black hover:bg-white/90 transition-all duration-200 tracking-wide">
              Enter Atlas
            </button>
            <a href="#districts" className="text-sm text-white/35 hover:text-white/60 transition-colors font-light tracking-wide">
              Explore the world ↓
            </a>
          </div>
        </motion.div>

      </section>

      {/* ── PRODUCT THUMBNAIL ── */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 bg-[#030712] px-4 sm:px-8 pt-0 pb-20"
      >
        {/* fade from hero section into thumbnail */}
        <div className="absolute inset-x-0 -top-32 h-32 pointer-events-none bg-gradient-to-b from-transparent to-[#030712]" />

        <div className="max-w-5xl mx-auto">
          {/* Browser chrome frame */}
          <div className="rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(52,209,134,0.08),0_40px_100px_rgba(0,0,0,0.6)] border border-white/8"
            style={{ background: '#0a1020' }}>

            {/* Title bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/6" style={{ background: '#060d1a' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1 rounded-md text-[10px] font-mono text-white/20 border border-white/6"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D186]" />
                  atlas-web3.vercel.app
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]" />
                <span className="text-[9px] font-mono text-white/18 uppercase tracking-wider">Mantle Sepolia</span>
              </div>
            </div>

            {/* App content mockup */}
            <div className="relative overflow-hidden" style={{ height: '480px', background: '#030712' }}>

              {/* Starfield dots */}
              {[...Array(40)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-white"
                  style={{
                    width: i % 5 === 0 ? '2px' : '1px',
                    height: i % 5 === 0 ? '2px' : '1px',
                    left: `${(i * 37 + 11) % 100}%`,
                    top: `${(i * 53 + 7) % 100}%`,
                    opacity: 0.08 + (i % 4) * 0.05,
                  }} />
              ))}

              {/* World glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[400px] rounded-full blur-[80px] opacity-30"
                  style={{ background: 'radial-gradient(circle, rgba(52,209,134,0.15) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)' }} />
              </div>

              {/* Island world — center */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ left: '-160px' }}>
                <IslandWorldPreview />
              </div>

              {/* Side panel */}
              <div className="absolute top-0 right-0 bottom-0 w-[280px] border-l border-white/6 flex flex-col"
                style={{ background: 'rgba(5,10,22,0.96)', backdropFilter: 'blur(20px)' }}>

                {/* Panel header */}
                <div className="px-5 py-4 border-b border-white/6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Your Island</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#34D186]" />
                      <span className="text-[9px] font-mono text-[#34D186]/70">68</span>
                    </div>
                  </div>
                  <p className="text-base font-light text-white">$24,680</p>
                  <p className="text-[10px] text-[#34D186] font-mono mt-0.5">+$122 / yr · 5.1% avg</p>
                </div>

                {/* Allocation bars */}
                <div className="px-5 py-4 flex-1">
                  <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-4">Portfolio Allocation</p>
                  {[
                    { label: 'Income', pct: 38, color: '#3B82F6', apy: '5.1%' },
                    { label: 'Staking', pct: 24, color: '#34D186', apy: '3.8%' },
                    { label: 'Growth', pct: 22, color: '#F59E0B', apy: '14%' },
                    { label: 'Emerging', pct: 16, color: '#EF4444', apy: '22%' },
                  ].map(d => (
                    <div key={d.label} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[10px] font-mono text-white/45">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono" style={{ color: d.color }}>{d.apy}</span>
                          <span className="text-[9px] font-mono text-white/30">{d.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/5">
                        <div className="h-1 rounded-full" style={{ width: `${d.pct}%`, background: d.color, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom stats */}
                <div className="px-5 py-4 border-t border-white/6 grid grid-cols-2 gap-4">
                  {[['72', 'Health Score'], ['4', 'Districts']].map(([v, l]) => (
                    <div key={l}>
                      <p className="text-sm font-light text-white">{v}</p>
                      <p className="text-[8px] font-mono text-white/25 uppercase tracking-wide mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* District labels floating in world */}
              {[
                { label: 'Income', apy: '5.1%', color: '#3B82F6', left: '12%', top: '22%' },
                { label: 'Staking', apy: '3.8%', color: '#34D186', left: '38%', top: '12%' },
                { label: 'Growth', apy: '14%', color: '#F59E0B', left: '18%', top: '62%' },
              ].map(d => (
                <div key={d.label} className="absolute flex flex-col items-center gap-1 pointer-events-none"
                  style={{ left: d.left, top: d.top }}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono"
                    style={{ borderColor: `${d.color}35`, background: 'rgba(5,10,22,0.85)', color: d.color }}>
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.apy} APY
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                  <span className="text-[8px] font-mono tracking-wider" style={{ color: `${d.color}60` }}>{d.label.toUpperCase()}</span>
                </div>
              ))}

            </div>
          </div>

          {/* Logo parade below thumbnail */}
          <div className="mt-16 flex flex-col items-center gap-5">
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.25em]">Built on & integrated with</p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 opacity-30">
              {['Mantle','Ondo Finance','mETH Protocol','Agni Finance','Lendle'].map(n => (
                <span key={n} className="text-sm font-light text-white/70 whitespace-nowrap">{n}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── BELOW FOLD — solid dark bg so 3D world is hidden ── */}
      <div className="relative bg-[#030712]">

      {/* ── SECTION 2 — Traditional Finance ── */}
      <GigaSection
        label="The Problem"
        labelColor="#ffffff50"
        headline={<>Traditional Finance<br />Shows You What<br /><span className="text-white/35">You Own.</span></>}
        features={[
          { icon: '◎', title: 'Wallet balances.', desc: 'A number. No context. No direction.' },
          { icon: '◎', title: 'Charts and tables.', desc: 'Ownership data. Not opportunity data.' },
          { icon: '◎', title: 'No map forward.', desc: 'Where your capital should go — unknown.' },
        ]}
      >
        {/* Showcase card */}
        <div className="rounded-2xl overflow-hidden border border-white/8" style={{ background: 'rgba(10,15,28,0.9)' }}>
          <div className="p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <p className="text-white/30 text-sm font-light leading-relaxed">
                Modern investing platforms are built around assets — wallet balances, charts, tables, portfolios. But ownership is only half the story.
              </p>
              <p className="text-white text-2xl font-light leading-tight">
                Where should your capital go next?
              </p>
              <p className="text-white/40 text-sm font-light leading-relaxed">
                Thousands of opportunities exist across the financial landscape. Most people never discover them.
              </p>
              <p className="text-[#34D186] text-base font-light">Atlas changes that.</p>
            </div>
            <div className="flex-shrink-0 grid grid-cols-3 sm:grid-cols-3 gap-3 w-full md:w-auto">
              {[['95%','Capital idle'],['~0%','Avg yield'],['$1.8B','Mantle TVL']].map(([v,l]) => (
                <div key={l} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                  <p className="text-xl font-light text-white">{v}</p>
                  <p className="text-[9px] font-mono text-white/28 uppercase tracking-wider mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 3 — Reimagined ── */}
      <GigaSection
        label="The Atlas Way"
        labelColor="#34D186"
        headline={<>We Reimagined<br />Investing As<br /><span className="text-white/35">Exploration.</span></>}
        features={[
          { icon: '◆', title: 'Discover', desc: 'Financial opportunities become destinations you can see and explore.' },
          { icon: '◆', title: 'Navigate', desc: 'Follow routes from your current position to better yield.' },
          { icon: '◆', title: 'Allocate', desc: 'Execute real on-chain positions in a single conversation.' },
        ]}
        featureColor="#34D186"
      >
        <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#050d1a]">
          <div className="p-10">
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-8">Atlas turns complexity into clarity</p>
            <div className="grid grid-cols-4 gap-4">
              {[['01','Discover opportunities.'],['02','Understand outcomes.'],['03','Follow routes.'],['04','Allocate with confidence.']].map(([n,l]) => (
                <div key={n} className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
                  <p className="text-[9px] font-mono text-[#34D186]/60 mb-3">{n}</p>
                  <p className="text-sm font-light text-white leading-snug">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 4 — Districts ── */}
      <GigaSection
        id="districts"
        label="The World"
        labelColor="#3B82F6"
        headline={<>Explore The World<br />Of Capital.</>}
        features={[
          { icon: '⬡', title: 'Six districts', desc: 'Income, Staking, Growth, Treasury, Safety, Emerging.' },
          { icon: '⬡', title: 'Live APYs', desc: 'Real-time yield data from DeFiLlama across 10+ protocols.' },
          { icon: '⬡', title: 'Wallet-optional', desc: 'Explore every district freely. No signup required.' },
        ]}
        featureColor="#3B82F6"
      >
        <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#050d1a]">
          <div className="p-8">
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-6">A navigable world built around six opportunity districts</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Income', color: '#3B82F6', apy: '5.1%', sub: 'USDY · mUSD — T-bill backed yield', tag: 'Lowest Risk' },
                { name: 'Staking', color: '#34D186', apy: '3.8%', sub: 'mETH — Mantle liquid staking', tag: 'ETH-correlated' },
                { name: 'Growth', color: '#F59E0B', apy: '14%', sub: 'MNT-LP · Lendle — DEX & markets', tag: 'Medium Risk' },
                { name: 'Treasury', color: '#8B5CF6', apy: 'Index', sub: 'Diversified yield index', tag: 'Auto-balanced' },
                { name: 'Safety', color: '#6B7280', apy: '2.8%', sub: 'MNT Staking — validator rewards', tag: 'Safest' },
                { name: 'Emerging', color: '#EF4444', apy: '22%', sub: 'INIT · Cleopatra — frontier', tag: 'High Yield' },
              ].map(d => (
                <div key={d.name} className="rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02] cursor-default"
                  style={{ borderColor: `${d.color}20`, background: `${d.color}06` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}60` }} />
                      <span className="text-xs font-mono text-white/40 uppercase tracking-wide">{d.name}</span>
                    </div>
                    <span className="text-base font-light" style={{ color: d.color }}>{d.apy}</span>
                  </div>
                  <p className="text-[10px] text-white/35 leading-relaxed mb-3">{d.sub}</p>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                    style={{ color: d.color, background: `${d.color}12`, border: `1px solid ${d.color}25` }}>{d.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 5 — Navigator ── */}
      <GigaSection
        label="Atlas Navigator"
        labelColor="#3B82F6"
        headline={<>Meet Atlas<br />Navigator.<br /><span className="text-white/35">Your AI Wealth Agent.</span></>}
        features={[
          { icon: '◎', title: 'Discover & compare', desc: 'Scans live Mantle opportunities via DeFiLlama in real time.' },
          { icon: '◎', title: 'Remember & enforce', desc: 'Learns your goals and enforces your rules automatically.' },
          { icon: '◎', title: 'Suggest & execute', desc: 'One message confirmation. Real on-chain allocation.' },
        ]}
        featureColor="#3B82F6"
      >
        <div className="rounded-2xl overflow-hidden border border-[#3B82F6]/15 bg-[#0b1220]">
          {/* Header */}
          <div className="border-b border-white/6 px-8 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a2a6c] to-[#0a1230] border border-[#3B82F6]/30 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-[#3B82F6]/60 uppercase tracking-wider">Atlas Navigator</p>
              <p className="text-[9px] text-white/20 mt-0.5">AI Wealth Agent · Mantle Sepolia</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34D186]" />
              <span className="text-[9px] font-mono text-white/20">Live</span>
            </div>
          </div>
          {/* Chat */}
          <div className="p-8 space-y-4">
            <ChatBubble side="right" text="Scout the chain — what's the best opportunity right now?" />
            <ChatBubble side="left" text="USDY via Ondo Finance. 5.1% APY · $42M TVL. T-bill backed, dollar-stable. Your idle $2,400 would return $122/year." color="#3B82F6" />
            <ChatBubble side="right" text="Allocate $1,000 to USDY" />
            <ChatBubble side="left" text="Executing allocation to USDY vault on Mantle. Decision recorded on-chain permanently." color="#34D186" tag="On-chain ◆" />
          </div>
          {/* Capabilities */}
          <div className="border-t border-white/5 px-8 py-5 flex flex-wrap gap-2">
            {['Discovers','Compares','Simulates','Remembers your goals','Enforces your rules','Executes on-chain'].map(c => (
              <span key={c} className="text-[9px] font-mono px-3 py-1.5 rounded-full border border-white/8 text-white/28">{c}</span>
            ))}
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 6 — Wealth Routes ── */}
      <GigaSection
        label="Wealth Routes"
        labelColor="#F59E0B"
        headline={<>Most platforms<br />provide products.<br /><span className="text-[#F59E0B]">Atlas provides paths.</span></>}
        features={[
          { icon: '→', title: 'From your position', desc: 'Every route starts with where your capital is right now.' },
          { icon: '→', title: 'Risk-adjusted', desc: 'Analyzes income, diversification, liquidity, and opportunity cost.' },
          { icon: '→', title: 'To your destination', desc: 'A clear path with projected outcomes before you commit.' },
        ]}
        featureColor="#F59E0B"
      >
        <div className="rounded-2xl overflow-hidden border border-[#F59E0B]/12 bg-[#0a0d0a]">
          <div className="p-10">
            <p className="text-[10px] font-mono text-[#F59E0B]/40 uppercase tracking-wider mb-8">Example route · Income District</p>
            <div className="flex flex-col md:flex-row items-start gap-4">
              {[
                { step: 'Current Position', detail: 'Your Island · $2,400 idle · Health 42', color: 'rgba(255,255,255,0.3)' },
                { step: 'Recommended Route', detail: 'Income District → USDY Vault', color: '#F59E0B' },
                { step: 'Projected Destination', detail: 'Ondo Finance · Mantle native', color: '#3B82F6' },
                { step: 'Expected Outcome', detail: '+$122/year · Health 42 → 68', color: '#34D186' },
              ].map(({ step, detail, color }, i) => (
                <div key={i} className="flex md:flex-col items-start md:items-center gap-3 md:gap-2 flex-1">
                  <div className="flex md:flex-col items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: color, background: i > 0 ? color : 'transparent', boxShadow: i > 0 ? `0 0 10px ${color}50` : 'none' }} />
                    {i < 3 && <div className="hidden md:block w-px h-6 bg-white/10" />}
                    {i < 3 && <div className="md:hidden h-px w-8 bg-white/10" />}
                  </div>
                  <div className="md:text-center">
                    <p className="text-sm font-light" style={{ color }}>{step}</p>
                    <p className="text-[10px] font-mono text-white/25 mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/35 text-sm font-light mt-10 text-center italic">Your capital always knows where it is going.</p>
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 7 — Capital Should Learn ── */}
      <GigaSection
        label="Intelligent Memory"
        labelColor="#8B5CF6"
        headline={<>Capital<br />Should Learn.</>}
        features={[
          { icon: '◎', title: 'Remembers everything', desc: 'Goals, preferences, allocation behavior, risk tolerance, income targets.' },
          { icon: '◎', title: 'Gets smarter', desc: 'Every route becomes more personalized. Every recommendation more precise.' },
          { icon: '◎', title: 'Compounds insight', desc: 'Every outcome improves future decisions automatically.' },
        ]}
        featureColor="#8B5CF6"
      >
        <div className="rounded-2xl overflow-hidden border border-[#8B5CF6]/12 bg-[#0a0814]">
          <div className="p-10 grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-6">Traditional platforms</p>
              <p className="text-2xl font-light text-white/25 mb-3">Forget everything.</p>
              <div className="space-y-2">
                {['No memory of your goals','No awareness of your style','No context between sessions'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                    <span className="text-sm text-white/30 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#8B5CF6]/50 uppercase tracking-wider mb-6">Atlas</p>
              <p className="text-2xl font-light text-white mb-3">Remembers.</p>
              <div className="space-y-2">
                {['Your goals and income targets','Your risk tolerance and preferences','Your allocation behavior over time'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/60" />
                    <span className="text-sm text-white/55 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 8 — Transparency ── */}
      <GigaSection
        label="Radical Transparency"
        labelColor="#34D186"
        headline={<>Built For<br />Transparency.</>}
        features={[
          { icon: '◆', title: 'Explainable AI', desc: 'Intelligence should be explainable. Every decision has a reason.' },
          { icon: '◆', title: 'On-chain proof', desc: 'Every AI recommendation logged permanently on Mantle via ERC-8004.' },
          { icon: '◆', title: 'No black boxes', desc: 'No blind decisions. No hidden assumptions. Full audit trail.' },
        ]}
        featureColor="#34D186"
      >
        <div className="rounded-2xl overflow-hidden border border-[#34D186]/12 bg-[#040d08]">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-mono text-[#34D186]/45 uppercase tracking-wider">On-chain Decision Log · Mantle Explorer</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]" />
                <span className="text-[9px] font-mono text-white/20">Live · 255+ decisions recorded</span>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {[
                { type: 'opportunity_recommendation', op: 'USDY allocation', amt: '$1,000', ago: '2m ago', c: '#34D186' },
                { type: 'route_suggestion', op: 'mETH → Income rebalance', amt: 'Rebalance', ago: '18m ago', c: '#3B82F6' },
                { type: 'portfolio_analysis', op: 'Portfolio health check', amt: 'Score: 72', ago: '1h ago', c: '#8B5CF6' },
                { type: 'opportunity_recommendation', op: 'mUSD allocation', amt: '$500', ago: '3h ago', c: '#34D186' },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#030712]/20 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.c }} />
                    <div>
                      <p className="text-xs text-white/60 font-light">{d.op}</p>
                      <p className="text-[9px] font-mono text-white/22 uppercase tracking-wide mt-0.5">{d.type.replace(/_/g,' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono" style={{ color: d.c }}>{d.amt}</p>
                    <p className="text-[9px] text-white/20 mt-0.5">{d.ago}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 pt-4 border-t border-white/5">
              {[['ERC-8004','Agent identity standard'],['255+','Decisions on-chain'],['Public','Fully auditable']].map(([v,l]) => (
                <div key={l}>
                  <p className="text-sm font-light" style={{ color: '#34D186' }}>{v}</p>
                  <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GigaSection>

      {/* ── SECTION 9 — Future Vision ── */}
      <section className="px-4 sm:px-8 py-20 sm:py-28 max-w-6xl mx-auto">
        <FadeIn>
          <p className="text-[10px] font-mono text-white/22 uppercase tracking-[0.25em] mb-6">The future</p>
          <h2 className="text-[40px] sm:text-[56px] lg:text-[68px] font-light leading-[1.04] tracking-[-0.02em] text-white mb-8 max-w-2xl">
            The Future Of Wealth Is Navigable.
          </h2>
          <div className="max-w-lg space-y-4">
            <p className="text-white/40 text-base font-light leading-relaxed">The next generation of investing won&apos;t be built around managing assets.</p>
            <p className="text-white/40 text-base font-light leading-relaxed">It will be built around discovering opportunities.</p>
            <p className="text-white/50 text-base font-light leading-relaxed">Atlas is creating a world where capital can be explored, understood, and intelligently directed.</p>
          </div>
          <div className="mt-10 flex items-center gap-3">
            <div className="w-8 h-px bg-white/15" />
            <p className="text-white/45 text-base font-light">Because wealth should be navigated. Not guessed.</p>
          </div>
        </FadeIn>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative px-4 sm:px-6 py-24 sm:py-36 text-center overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] rounded-full blur-[120px] opacity-10"
            style={{ background: 'radial-gradient(circle, #34D186 0%, #3B82F6 50%, transparent 80%)' }} />
        </div>

        <FadeIn className="relative max-w-3xl mx-auto">
          <h2 className="text-[42px] sm:text-[64px] lg:text-[88px] font-light leading-[1.02] tracking-[-0.025em] text-white mb-5">
            The Future Of Wealth<br />
            <span className="text-white/35">Has A Map.</span>
          </h2>
          <div className="space-y-1 mb-12">
            {['Explore opportunities.','Discover new destinations.','Navigate with confidence.'].map(l => (
              <p key={l} className="text-white/35 text-base font-light">{l}</p>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <button onClick={() => setEntering(true)}
              className="px-12 py-4 rounded-full text-base font-light bg-white text-black hover:bg-white/90 transition-all duration-200 tracking-wide">
              Enter Atlas
            </button>
            <p className="text-[9px] font-mono text-white/18 uppercase tracking-[0.3em]">No wallet required to explore</p>
          </div>
        </FadeIn>
      </section>

      </div>{/* end below-fold wrapper */}

      {/* ── FOOTER ── */}
      <footer className="bg-[#030712] border-t border-white/6 px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {ATLAS_LOGO(64, 23)}
            <span className="text-[9px] font-mono text-white/18 uppercase tracking-wider">Navigate Wealth Intelligently.</span>
          </div>
          <p className="text-[9px] font-mono text-white/15 uppercase tracking-wider">Mantle Sepolia · ERC-8004 · © 2025 Atlas</p>
        </div>
      </footer>

    </motion.div>
  )
}

/* ── Sub-components ── */

interface GigaSectionProps {
  id?: string
  label: string
  labelColor: string
  headline: React.ReactNode
  features: { icon: string; title: string; desc: string }[]
  featureColor?: string
  children: React.ReactNode
}

function GigaSection({ id, label, labelColor, headline, features, featureColor = '#ffffff60', children }: GigaSectionProps) {
  return (
    <section id={id} className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
      {/* Label + headline left / features right */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-start gap-8 sm:gap-10 mb-10">
          {/* Left */}
          <div className="md:w-[45%] flex-shrink-0">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: labelColor }} />
              <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: labelColor }}>{label}</p>
            </div>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[54px] font-light leading-[1.06] tracking-[-0.02em] text-white">
              {headline}
            </h2>
          </div>

          {/* Right — 3 feature bullets (Giga style) */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5 md:pt-16">
            {features.map(({ icon, title, desc }) => (
              <div key={title}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-sm"
                  style={{ background: `${featureColor}12`, border: `1px solid ${featureColor}20`, color: featureColor }}>
                  {icon}
                </div>
                <p className="text-sm font-light text-white mb-1.5">{title}</p>
                <p className="text-xs text-white/35 leading-relaxed font-light">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Full-width showcase card */}
      <FadeIn delay={0.1}>{children}</FadeIn>
    </section>
  )
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

// Pre-computed static island data — no runtime trig to avoid SSR/client float divergence
const ISLANDS = [
  {
    x: 0, y: 0, r: 90, ry: 34, color: '#34D186',
    pillars: [
      { px: 0, pz: 15, h: 38, c: '#3B82F6' },
      { px: 33, pz: -7, h: 24, c: '#34D186' },
      { px: -33, pz: -7, h: 18, c: '#F59E0B' },
    ],
  },
  {
    x: -190, y: 40, r: 64, ry: 24, color: '#3B82F6',
    pillars: [
      { px: 0, pz: 11, h: 28, c: '#3B82F6' },
      { px: 23, pz: -5, h: 16, c: '#34D186' },
    ],
  },
  {
    x: 180, y: -30, r: 56, ry: 21, color: '#8B5CF6',
    pillars: [
      { px: 0, pz: 9, h: 20, c: '#8B5CF6' },
      { px: 20, pz: -4, h: 14, c: '#F59E0B' },
    ],
  },
  {
    x: -90, y: -120, r: 44, ry: 17, color: '#F59E0B',
    pillars: [{ px: 0, pz: 7, h: 16, c: '#F59E0B' }],
  },
  {
    x: 110, y: 130, r: 40, ry: 15, color: '#EF4444',
    pillars: [{ px: 0, pz: 6, h: 12, c: '#EF4444' }],
  },
] as const

function IslandWorldPreview() {
  return (
    <svg width="560" height="480" viewBox="-280 -240 560 480" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="iblur1"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="iblur2"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {ISLANDS.map((isl, idx) => (
        <g key={idx} transform={`translate(${isl.x}, ${isl.y})`}>
          {/* Glow pool */}
          <ellipse cx="0" cy={isl.ry + 6} rx={isl.r * 1.3} ry={isl.ry * 0.7} fill={isl.color} opacity="0.06" filter="url(#iblur1)" />
          {/* Island base layers */}
          <ellipse cx="0" cy={isl.ry} rx={isl.r} ry={isl.ry} fill="#0a1628" />
          <ellipse cx="0" cy={isl.ry - 10} rx={isl.r * 0.85} ry={isl.ry * 0.85} fill="#0d1e38" />
          <ellipse cx="0" cy={isl.ry - 20} rx={isl.r * 0.7} ry={isl.ry * 0.7} fill="#112040" />
          {/* Top face */}
          <ellipse cx="0" cy={0} rx={isl.r * 0.7} ry={isl.ry * 0.7}
            fill={isl.color} fillOpacity="0.06" stroke={isl.color} strokeOpacity="0.15" strokeWidth="1" />
          {/* Pillars */}
          {isl.pillars.map((p, pi) => (
            <g key={pi} transform={`translate(${p.px}, ${p.pz - p.h / 2})`}>
              <rect x="-4" y={-p.h / 2} width="8" height={p.h} rx="2" fill={p.c} fillOpacity="0.85" />
              <ellipse cx="0" cy={-p.h / 2} rx="6" ry="3" fill={p.c} fillOpacity="0.5" filter="url(#iblur2)" />
            </g>
          ))}
          {/* Crystal */}
          <polygon points={`0,${-isl.r * 0.45} ${isl.r * 0.13},${-isl.r * 0.15} 0,${isl.r * 0.05} ${-isl.r * 0.13},${-isl.r * 0.15}`}
            fill={isl.color} fillOpacity="0.9" />
          <ellipse cx="0" cy={-isl.r * 0.2} rx={isl.r * 0.22} ry={isl.r * 0.22} fill={isl.color} fillOpacity="0.08" filter="url(#iblur2)" />
          {/* Orbit ring */}
          <ellipse cx="0" cy={-isl.r * 0.1} rx={isl.r * 0.78} ry={isl.r * 0.25}
            fill="none" stroke={isl.color} strokeOpacity="0.25" strokeWidth="1" />
        </g>
      ))}
    </svg>
  )
}

function ChatBubble({ side, text, color, tag }: { side: 'left'|'right'; text: string; color?: string; tag?: string }) {
  return (
    <div className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed"
        style={side === 'left'
          ? { background: color ? `${color}0e` : 'rgba(255,255,255,0.04)', border: `1px solid ${color ? color+'20' : 'rgba(255,255,255,0.07)'}`, color: 'rgba(255,255,255,0.65)' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
        {text}
        {tag && <span className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>{tag}</span>}
      </div>
    </div>
  )
}
