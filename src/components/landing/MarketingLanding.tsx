'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { CinematicEntry } from './CinematicEntry'
import { AtlasLogo } from '@/components/AtlasLogo'

interface Props {
  onEnter: () => void
  onDemo?: () => void
}


const ATLAS_LOGO = (w = 88) => <AtlasLogo width={w} />

export function MarketingLanding({ onEnter, onDemo }: Props) {
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
        {ATLAS_LOGO(80)}
        <div className="hidden md:flex items-center gap-8">
          {['Product','Ecosystem','About'].map(l => (
            <span key={l} className="text-sm text-white/35 hover:text-white/70 transition-colors cursor-pointer">{l}</span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {onDemo && (
            <button onClick={onDemo}
              className="px-4 py-2 rounded-full text-xs font-mono tracking-[0.15em] uppercase border transition-all duration-300 hover:border-white/40 hover:text-white/90"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)', background: 'transparent' }}>
              Try Demo
            </button>
          )}
          <button onClick={() => setEntering(true)}
            className="px-5 py-2 rounded-full text-xs font-mono tracking-[0.15em] uppercase border transition-all duration-300 hover:bg-white hover:text-black"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', background: 'transparent' }}>
            Enter Atlas →
          </button>
        </div>
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
            {onDemo && (
              <button onClick={onDemo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-light border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all duration-200 tracking-wide">
                Try Demo →
              </button>
            )}
            <a href="#districts" className="text-sm text-white/35 hover:text-white/60 transition-colors font-light tracking-wide">
              Explore the world ↓
            </a>
          </div>
        </motion.div>

        {/* Logo parade */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }}
          className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-5 px-6">
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.25em]">Built on & integrated with</p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 opacity-30">
            {['Mantle','Ondo Finance','mETH Protocol','Agni Finance','Lendle'].map(n => (
              <span key={n} className="text-sm font-light text-white/70 whitespace-nowrap">{n}</span>
            ))}
          </div>
        </motion.div>
      </section>

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
            {ATLAS_LOGO(64)}
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
