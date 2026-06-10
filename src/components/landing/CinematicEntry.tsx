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
  const pathProps = (delay: number, dur = 0.55) => ({
    stroke: '#34D186' as const,
    strokeWidth: 0.8,
    fill: phase === 'filled' ? 'white' : 'none',
    strokeDasharray: strokeDash,
    animate: {
      strokeDashoffset: phase === 'drawing' ? [strokeDash, 0] : [0, 0],
      fillOpacity: phase === 'filled' ? 1 : 0,
      strokeOpacity: phase === 'filled' ? 0 : 1,
    },
    initial: { strokeDashoffset: strokeDash, fillOpacity: 0, strokeOpacity: 1 },
    transition: { duration: dur, delay },
  })

  return (
    <svg width="52" height="52" viewBox="0 0 43 49" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top bar */}
      <motion.path d="M24.1371 14.7027C24.1371 16.3192 22.8266 17.6296 21.2101 17.6296C19.5936 17.6296 18.2832 16.3192 18.2832 14.7027V4.59151C18.2832 2.97502 19.5936 1.66459 21.2101 1.66459C22.8266 1.66459 24.1371 2.97502 24.1371 4.59151V14.7027Z" {...pathProps(0.05)} />
      {/* Right-top arm */}
      <motion.path d="M40.1143 32.2313C41.5143 33.0395 41.9939 34.8296 41.1857 36.2295C40.3774 37.6295 38.5873 38.1091 37.1874 37.3009L28.4132 32.235C27.0132 31.4268 26.5336 29.6367 27.3418 28.2368C28.1501 26.8368 29.9402 26.3572 31.3401 27.1655L40.1143 32.2313Z" {...pathProps(0.15)} />
      {/* Left-bottom arm */}
      <motion.path d="M11.258 27.0706C12.6579 26.2623 14.448 26.742 15.2563 28.1419C16.0645 29.5418 15.5849 31.3319 14.1849 32.1401L5.24635 37.3009C3.84642 38.1091 2.05634 37.6295 1.24809 36.2295C0.439844 34.8296 0.919492 33.0395 2.31942 32.2313L11.258 27.0706Z" {...pathProps(0.25)} />
      {/* Right-bottom arm */}
      <motion.path d="M31.5516 21.7344C30.1516 22.5427 28.3616 22.063 27.5533 20.6631C26.7451 19.2632 27.2247 17.4731 28.6246 16.6648L37.3812 11.6092C38.7811 10.801 40.5712 11.2806 41.3794 12.6806C42.1877 14.0805 41.708 15.8706 40.3081 16.6788L31.5516 21.7344Z" {...pathProps(0.35)} />
      {/* Bottom bar */}
      <motion.path d="M24.3598 44.3366C24.3598 45.9531 23.0494 47.2635 21.4329 47.2635C19.8164 47.2635 18.506 45.9531 18.506 44.3366L18.506 34.205C18.506 32.5885 19.8164 31.2781 21.4329 31.2781C23.0494 31.2781 24.3599 32.5885 24.3599 34.205L24.3598 44.3366Z" {...pathProps(0.45)} />
      {/* Left-top arm */}
      <motion.path d="M14.401 16.7654C15.8009 17.5736 16.2806 19.3637 15.4723 20.7637C14.6641 22.1636 12.874 22.6432 11.4741 21.835L2.53546 16.6743C1.13553 15.866 0.655882 14.076 1.46413 12.676C2.27238 11.2761 4.06246 10.7965 5.46238 11.6047L14.401 16.7654Z" {...pathProps(0.55)} />
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
      <div className="relative flex flex-col items-center gap-8">

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
            <svg width="92" height="33" viewBox="0 0 141 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M49.8018 40L61.3218 12H64.5218L75.9618 40H71.0018L62.0418 17.32H63.7218L54.6818 40H49.8018ZM55.4818 34.6V30.6H70.3218V34.6H55.4818ZM80.6862 40V12.8H85.0862V40H80.6862ZM76.0862 24.8V20.8H89.6862V24.8H76.0862ZM92.8834 40V11.2H97.2834V40H92.8834ZM110.22 40.4C108.487 40.4 106.914 39.96 105.5 39.08C104.114 38.2 103.007 37.0133 102.18 35.52C101.38 34 100.98 32.3067 100.98 30.44C100.98 28.5467 101.38 26.8533 102.18 25.36C103.007 23.84 104.114 22.64 105.5 21.76C106.914 20.8533 108.487 20.4 110.22 20.4C111.687 20.4 112.98 20.72 114.1 21.36C115.247 21.9733 116.154 22.8267 116.82 23.92C117.487 25.0133 117.82 26.2533 117.82 27.64V33.16C117.82 34.5467 117.487 35.7867 116.82 36.88C116.18 37.9733 115.287 38.84 114.14 39.48C112.994 40.0933 111.687 40.4 110.22 40.4ZM110.94 36.24C112.567 36.24 113.874 35.6933 114.86 34.6C115.874 33.5067 116.38 32.1067 116.38 30.4C116.38 29.2533 116.154 28.24 115.7 27.36C115.247 26.48 114.607 25.8 113.78 25.32C112.98 24.8133 112.034 24.56 110.94 24.56C109.874 24.56 108.927 24.8133 108.1 25.32C107.3 25.8 106.66 26.48 106.18 27.36C105.727 28.24 105.5 29.2533 105.5 30.4C105.5 31.5467 105.727 32.56 106.18 33.44C106.66 34.32 107.3 35.0133 108.1 35.52C108.927 36 109.874 36.24 110.94 36.24ZM116.1 40V34.84L116.86 30.16L116.1 25.52V20.8H120.5V40H116.1ZM131.663 40.4C130.597 40.4 129.57 40.2667 128.583 40C127.597 39.7067 126.69 39.3067 125.863 38.8C125.037 38.2667 124.317 37.6267 123.703 36.88L126.503 34.08C127.17 34.8533 127.93 35.44 128.783 35.84C129.663 36.2133 130.65 36.4 131.743 36.4C132.73 36.4 133.477 36.2533 133.983 35.96C134.49 35.6667 134.743 35.24 134.743 34.68C134.743 34.0933 134.503 33.64 134.023 33.32C133.543 33 132.917 32.7333 132.143 32.52C131.397 32.28 130.597 32.04 129.743 31.8C128.917 31.56 128.117 31.24 127.343 30.84C126.597 30.4133 125.983 29.84 125.503 29.12C125.023 28.4 124.783 27.4667 124.783 26.32C124.783 25.0933 125.063 24.04 125.623 23.16C126.21 22.28 127.023 21.6 128.063 21.12C129.13 20.64 130.397 20.4 131.863 20.4C133.41 20.4 134.77 20.68 135.943 21.24C137.143 21.7733 138.143 22.5867 138.943 23.68L136.143 26.48C135.583 25.7867 134.943 25.2667 134.223 24.92C133.503 24.5733 132.677 24.4 131.743 24.4C130.863 24.4 130.183 24.5333 129.703 24.8C129.223 25.0667 128.983 25.4533 128.983 25.96C128.983 26.4933 129.223 26.9067 129.703 27.2C130.183 27.4933 130.797 27.7467 131.543 27.96C132.317 28.1733 133.117 28.4133 133.943 28.68C134.797 28.92 135.597 29.2667 136.343 29.72C137.117 30.1467 137.743 30.7333 138.223 31.48C138.703 32.2 138.943 33.1467 138.943 34.32C138.943 36.1867 138.29 37.6667 136.983 38.76C135.677 39.8533 133.903 40.4 131.663 40.4Z" fill="white"/>
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
              <div className="h-5 flex items-center">
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
