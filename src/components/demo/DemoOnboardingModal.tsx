'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onClose: () => void
}

const FEATURES = [
  {
    icon: '🏝',
    title: 'Your island grows with your wealth',
    desc: 'As your portfolio TVL increases, your island physically expands — from a Seedling all the way to a Metropolis across 6 tiers.',
  },
  {
    icon: '🏛',
    title: 'Buildings unlock from yield milestones',
    desc: 'Every dollar of yield earned, every district added, every health milestone — unlocks a new structure on your island. 8 buildings total.',
  },
  {
    icon: '✦',
    title: 'Tokenize your island as an NFT',
    desc: 'Once you reach Outpost tier ($5K TVL), your island can be minted as an on-chain NFT on Mantle — a permanent record of your wealth journey.',
  },
]

export function DemoOnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const isLast = step === FEATURES.length - 1

  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-4 w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: 'rgba(10,18,35,0.98)', border: '1px solid rgba(255,255,255,0.09)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_6px_#00C2FF]" />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: '#00C2FF' }}>
              Demo Mode · New Features
            </span>
          </div>
          <p className="text-white text-[21px] font-light leading-snug mb-1">
            Your wealth, mapped as a world.
          </p>
          <p className="text-white/35 text-[12px] font-light leading-relaxed">
            Three new features are live. Here's what you're exploring:
          </p>
        </div>

        {/* Feature cards */}
        <div className="px-7 pt-5 pb-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-3xl mb-3 block">{FEATURES[step].icon}</span>
              <p className="text-white text-[15px] font-light mb-2">{FEATURES[step].title}</p>
              <p className="text-white/45 text-[12px] font-light leading-relaxed">{FEATURES[step].desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4 mb-5">
            {FEATURES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 5,
                  height: 5,
                  background: i === step ? '#00C2FF' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="px-7 pb-7 flex gap-3">
          {!isLast && (
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl text-[12px] font-mono text-white/35 border border-white/10 hover:border-white/25 hover:text-white/60 transition-all"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            className="flex-1 py-3.5 rounded-2xl text-[12px] font-mono uppercase tracking-[0.15em] transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #00C2FF, #007FFE)', color: '#fff' }}
          >
            {isLast ? 'Explore Atlas →' : 'Next →'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
