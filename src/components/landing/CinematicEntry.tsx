'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'

interface Props {
  onComplete: () => void
}

const MESSAGES = [
  'Mapping Opportunities…',
  'Building Atlas World…',
  'Preparing Your Journey…',
]

// Animated coordinate counter
function CoordCounter({ from, to, suffix, delay }: { from: number; to: number; suffix: string; delay: number }) {
  const [val, setVal] = useState(from)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const dur = 2200
      const tick = () => {
        const elapsed = performance.now() - start
        const p = Math.min(elapsed / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(from + (to - from) * eased)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay * 1000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="font-mono text-[10px] text-[#34D186]/50 tabular-nums">
      {val.toFixed(4)}{suffix}
    </span>
  )
}

// Particle dot
function Particle({ delay, duration, x, y, tx, ty }: {
  delay: number; duration: number; x: string; y: string; tx: string; ty: string
}) {
  return (
    <motion.div
      className="absolute w-0.5 h-0.5 rounded-full bg-[#34D186]"
      style={{ left: x, top: y, opacity: 0 }}
      animate={{
        opacity: [0, 0.7, 0.4, 0],
        x: [0, tx],
        y: [0, ty],
        scale: [0, 1.5, 1, 0],
      }}
      transition={{ delay, duration, ease: 'easeOut', repeat: Infinity, repeatDelay: duration * 0.4 }}
    />
  )
}

// SVG logo icon only (the crystal mark) — animated stroke draw
function LogoMark({ phase }: { phase: 'drawing' | 'filled' | 'hidden' }) {
  const strokeDash = 300
  const pathProps = (delay: number, filledColor: string) => ({
    stroke: '#34D186' as const,
    strokeWidth: 0.8,
    fill: phase === 'filled' ? filledColor : 'none',
    strokeDasharray: strokeDash,
    animate: {
      strokeDashoffset: phase === 'drawing' ? [strokeDash, 0] : [0, 0],
      fillOpacity: phase === 'filled' ? 1 : 0,
      strokeOpacity: phase === 'filled' ? 0 : 1,
    },
    initial: { strokeDashoffset: strokeDash, fillOpacity: 0, strokeOpacity: 1 },
    transition: { duration: 0.55, delay },
  })

  return (
    <svg width="39" height="52" viewBox="0 0 37 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top bar — blue */}
      <motion.path d="M20.9276 16.0242C20.9276 17.4756 19.7511 18.6521 18.2998 18.6521C16.8484 18.6521 15.6719 17.4756 15.6719 16.0242V6.94608C15.6719 5.49474 16.8484 4.3182 18.2998 4.3182C19.7511 4.3182 20.9276 5.49474 20.9276 6.94608V16.0242Z" {...pathProps(0.1, '#007FFE')} />
      {/* Main body — white */}
      <motion.path d="M13.0515 25.0006C14.6736 25.9371 15.6729 27.6828 15.6729 29.5559L15.6729 43.0535C15.6729 44.5049 16.8495 45.6814 18.3008 45.6814C19.7522 45.6814 20.9287 44.5049 20.9287 43.0535V28.6729C20.9287 27.3416 21.639 26.1114 22.7919 25.4458L35.3442 18.1987C36.6011 17.473 37.0317 15.8658 36.3061 14.6089C35.5804 13.352 33.9732 12.9214 32.7163 13.6471L20.1465 20.9042C19.0084 21.5613 17.6061 21.5613 16.468 20.9042L3.94227 13.6725C2.68537 12.9468 1.07818 13.3775 0.352509 14.6344C-0.373161 15.8913 0.0574821 17.4985 1.31438 18.2241L13.0515 25.0006Z" {...pathProps(0.25, 'white')} />
      {/* Right arm — blue */}
      <motion.path d="M35.2751 31.7616C36.532 32.4873 36.9626 34.0945 36.237 35.3514C35.5113 36.6083 33.9041 37.0389 32.6472 36.3133L24.7695 31.765C23.5126 31.0393 23.0819 29.4322 23.8076 28.1753C24.5333 26.9184 26.1404 26.4877 27.3973 27.2134L35.2751 31.7616Z" {...pathProps(0.4, '#007FFE')} />
      {/* Left arm — blue */}
      <motion.path d="M9.36901 27.1282C10.6259 26.4025 12.2331 26.8332 12.9588 28.0901C13.6844 29.347 13.2538 30.9541 11.9969 31.6798L3.97156 36.3133C2.71466 37.0389 1.10748 36.6083 0.381805 35.3514C-0.343864 34.0945 0.0867791 32.4873 1.34367 31.7616L9.36901 27.1282Z" {...pathProps(0.4, '#007FFE')} />
    </svg>
  )
}

// Typewriter text
function Typewriter({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(iv); onDone?.() }
    }, 38)
    return () => clearInterval(iv)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="font-mono text-sm text-white/60 tracking-[0.15em]">
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}
        className="inline-block w-0.5 h-3.5 bg-[#34D186] ml-0.5 align-middle" />
    </span>
  )
}

// Particles config
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  tx: `${(Math.random() - 0.5) * 120}px`,
  ty: `${(Math.random() - 0.5) * 120}px`,
  delay: Math.random() * 2,
  duration: 2 + Math.random() * 2,
}))

export function CinematicEntry({ onComplete }: Props) {
  // Phases: init → scanning → drawing → filling → messaging → done
  const [phase, setPhase] = useState<'init' | 'scanning' | 'drawing' | 'filling' | 'messaging' | 'exiting'>('init')
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Phase timeline
    const t1 = setTimeout(() => setPhase('scanning'), 200)
    const t2 = setTimeout(() => setPhase('drawing'), 900)
    const t3 = setTimeout(() => setPhase('filling'), 1700)
    const t4 = setTimeout(() => setPhase('messaging'), 2100)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  // Progress bar
  useEffect(() => {
    if (phase !== 'messaging') return
    const start = Date.now()
    const dur = 2800
    const iv = setInterval(() => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setProgress(p)
      if (p >= 1) clearInterval(iv)
    }, 16)
    return () => clearInterval(iv)
  }, [phase])

  // Message cycling
  useEffect(() => {
    if (phase !== 'messaging') return
    const t1 = setTimeout(() => setMsgIndex(1), 900)
    const t2 = setTimeout(() => setMsgIndex(2), 1800)
    const t3 = setTimeout(() => {
      setExiting(true)
      setTimeout(onComplete, 700)
    }, 2900)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center"
      style={{ background: '#030712' }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      {/* Particle field */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map(p => (
          <Particle key={p.id} {...p} />
        ))}
      </div>

      {/* Subtle hex grid overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'scanning' || phase === 'drawing' ? 0.04 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V17L28 1l28 16v33L28 66zm0-6l22-13V23L28 7 6 23v24l22 13z' fill='none' stroke='%2334D186' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 100px',
        }}
      />

      {/* Scan line */}
      <AnimatePresence>
        {phase === 'scanning' && (
          <motion.div
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, #34D186, transparent)', boxShadow: '0 0 20px #34D186' }}
            initial={{ top: '-2%', opacity: 0 }}
            animate={{ top: ['0%', '100%'], opacity: [0, 0.8, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      {/* Corner coordinate readouts */}
      <motion.div
        className="absolute top-6 left-8 flex flex-col gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'init' ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <CoordCounter from={0} to={22.3086} suffix="° N" delay={0.4} />
        <CoordCounter from={0} to={114.1694} suffix="° E" delay={0.6} />
      </motion.div>

      <motion.div
        className="absolute top-6 right-8 flex flex-col items-end gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'init' ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="font-mono text-[10px] text-white/20 tracking-wider">ATLAS WORLD</span>
        <span className="font-mono text-[10px] text-[#34D186]/40 tracking-wider">MANTLE SEPOLIA</span>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'init' ? 0.3 : 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <span className="font-mono text-[9px] text-white/30 tracking-widest">v0.1.0 · TESTNET</span>
      </motion.div>

      {/* Data stream — right side */}
      <motion.div
        className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'scanning' || phase === 'drawing' ? 0.25 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {['0x5a32…ee47', '0x19D9…8807', '0x04ff…47fe', 'block #8423117', 'chain_id: 5003'].map((line, i) => (
          <motion.span
            key={line}
            className="font-mono text-[9px] text-[#34D186] block text-right"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 0.6, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            {line}
          </motion.span>
        ))}
      </motion.div>

      {/* Center — logo + messages */}
      <div className="relative flex flex-col items-center gap-8 w-full text-center">

        {/* Logo mark with draw animation */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'init' ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(52,209,134,0.15) 0%, transparent 70%)' }}
              animate={{ scale: phase === 'filling' || phase === 'messaging' ? [1, 1.3, 1] : 1, opacity: phase === 'filling' ? 1 : 0.5 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <LogoMark phase={
              phase === 'drawing' ? 'drawing'
              : phase === 'filling' || phase === 'messaging' || phase === 'exiting' ? 'filled'
              : 'hidden'
            } />
          </div>

          {/* Wordmark — fades in after fill */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: phase === 'filling' || phase === 'messaging' || phase === 'exiting' ? 1 : 0, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg width="92" height="33" viewBox="0 0 135 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.708 40L55.228 12H58.428L69.868 40H64.908L55.948 17.32H57.628L48.588 40H43.708ZM49.388 34.6V30.6H64.228V34.6H49.388ZM74.5924 40V12.8H78.9924V40H74.5924ZM69.9924 24.8V20.8H83.5924V24.8H69.9924ZM86.7896 40V11.2H91.1896V40H86.7896ZM104.126 40.4C102.393 40.4 100.82 39.96 99.4065 39.08C98.0198 38.2 96.9132 37.0133 96.0865 35.52C95.2865 34 94.8865 32.3067 94.8865 30.44C94.8865 28.5467 95.2865 26.8533 96.0865 25.36C96.9132 23.84 98.0198 22.64 99.4065 21.76C100.82 20.8533 102.393 20.4 104.126 20.4C105.593 20.4 106.886 20.72 108.006 21.36C109.153 21.9733 110.06 22.8267 110.726 23.92C111.393 25.0133 111.726 26.2533 111.726 27.64V33.16C111.726 34.5467 111.393 35.7867 110.726 36.88C110.086 37.9733 109.193 38.84 108.046 39.48C106.9 40.0933 105.593 40.4 104.126 40.4ZM104.846 36.24C106.473 36.24 107.78 35.6933 108.766 34.6C109.78 33.5067 110.286 32.1067 110.286 30.4C110.286 29.2533 110.06 28.24 109.606 27.36C109.153 26.48 108.513 25.8 107.686 25.32C106.886 24.8133 105.94 24.56 104.846 24.56C103.78 24.56 102.833 24.8133 102.006 25.32C101.206 25.8 100.566 26.48 100.086 27.36C99.6332 28.24 99.4065 29.2533 99.4065 30.4C99.4065 31.5467 99.6332 32.56 100.086 33.44C100.566 34.32 101.206 35.0133 102.006 35.52C102.833 36 103.78 36.24 104.846 36.24ZM110.006 40V34.84L110.766 30.16L110.006 25.52V20.8H114.406V40H110.006ZM125.57 40.4C124.503 40.4 123.476 40.2667 122.49 40C121.503 39.7067 120.596 39.3067 119.77 38.8C118.943 38.2667 118.223 37.6267 117.61 36.88L120.41 34.08C121.076 34.8533 121.836 35.44 122.69 35.84C123.57 36.2133 124.556 36.4 125.65 36.4C126.636 36.4 127.383 36.2533 127.89 35.96C128.396 35.6667 128.65 35.24 128.65 34.68C128.65 34.0933 128.41 33.64 127.93 33.32C127.45 33 126.823 32.7333 126.05 32.52C125.303 32.28 124.503 32.04 123.65 31.8C122.823 31.56 122.023 31.24 121.25 30.84C120.503 30.4133 119.89 29.84 119.41 29.12C118.93 28.4 118.69 27.4667 118.69 26.32C118.69 25.0933 118.97 24.04 119.53 23.16C120.116 22.28 120.93 21.6 121.97 21.12C123.036 20.64 124.303 20.4 125.77 20.4C127.316 20.4 128.676 20.68 129.85 21.24C131.05 21.7733 132.05 22.5867 132.85 23.68L130.05 26.48C129.49 25.7867 128.85 25.2667 128.13 24.92C127.41 24.5733 126.583 24.4 125.65 24.4C124.77 24.4 124.09 24.5333 123.61 24.8C123.13 25.0667 122.89 25.4533 122.89 25.96C122.89 26.4933 123.13 26.9067 123.61 27.2C124.09 27.4933 124.703 27.7467 125.45 27.96C126.223 28.1733 127.023 28.4133 127.85 28.68C128.703 28.92 129.503 29.2667 130.25 29.72C131.023 30.1467 131.65 30.7333 132.13 31.48C132.61 32.2 132.85 33.1467 132.85 34.32C132.85 36.1867 132.196 37.6667 130.89 38.76C129.583 39.8533 127.81 40.4 125.57 40.4Z" fill="white"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Messages + progress */}
        <AnimatePresence>
          {phase === 'messaging' && (
            <motion.div
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="h-5 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                  <motion.div key={msgIndex}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Typewriter text={MESSAGES[msgIndex]} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress bar */}
              <div className="relative w-40 h-px bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #34D186, #3B82F6)', width: `${progress * 100}%` }}
                />
                <motion.div
                  className="absolute top-0 h-full w-8 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(52,209,134,0.6), transparent)',
                    left: `${Math.max(0, progress * 100 - 10)}%`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
