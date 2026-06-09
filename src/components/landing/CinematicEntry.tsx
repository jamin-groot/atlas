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

  return (
    <svg width="52" height="52" viewBox="0 0 42 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Vertical bar */}
      <motion.path
        d="M21.1231 15.9405C21.1231 17.4054 19.9356 18.5929 18.4707 18.5929C17.0059 18.5929 15.8184 17.4054 15.8184 15.9405V6.77784C15.8184 5.31299 17.0059 4.12549 18.4707 4.12549C19.9356 4.12549 21.1231 5.31299 21.1231 6.77784V15.9405Z"
        stroke="#34D186"
        strokeWidth="0.8"
        fill={phase === 'filled' ? 'white' : 'none'}
        strokeDasharray={strokeDash}
        animate={{
          strokeDashoffset: phase === 'drawing' ? [strokeDash, 0] : [0, 0],
          fillOpacity: phase === 'filled' ? 1 : 0,
          strokeOpacity: phase === 'filled' ? 0 : 1,
        }}
        initial={{ strokeDashoffset: strokeDash, fillOpacity: 0, strokeOpacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      {/* Main body */}
      <motion.path
        d="M13.173 25.001C14.8103 25.9463 15.8189 27.7083 15.8189 29.5988L15.8189 43.2222C15.8189 44.687 17.0064 45.8745 18.4713 45.8745C19.9361 45.8745 21.1236 44.687 21.1236 43.2222V28.7076C21.1236 27.3639 21.8405 26.1223 23.0042 25.4504L35.6734 18.1358C36.942 17.4034 37.3766 15.7812 36.6442 14.5126C35.9118 13.244 34.2896 12.8094 33.021 13.5418L20.3342 20.8666C19.1855 21.5298 17.7701 21.5298 16.6214 20.8666L3.97898 13.5675C2.71038 12.835 1.08822 13.2697 0.355792 14.5383C-0.376637 15.8069 0.0580175 17.4291 1.32662 18.1615L13.173 25.001Z"
        stroke="#34D186"
        strokeWidth="0.8"
        fill={phase === 'filled' ? 'white' : 'none'}
        strokeDasharray={strokeDash}
        animate={{
          strokeDashoffset: phase === 'drawing' ? [strokeDash, 0] : [0, 0],
          fillOpacity: phase === 'filled' ? 1 : 0,
          strokeOpacity: phase === 'filled' ? 0 : 1,
        }}
        initial={{ strokeDashoffset: strokeDash, fillOpacity: 0, strokeOpacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      />
      {/* Right arm */}
      <motion.path
        d="M35.6039 31.8248C36.8725 32.5573 37.3072 34.1794 36.5748 35.448C35.8423 36.7166 34.2202 37.1513 32.9516 36.4189L25.0004 31.8283C23.7318 31.0958 23.2972 29.4737 24.0296 28.2051C24.762 26.9365 26.3842 26.5018 27.6528 27.2342L35.6039 31.8248Z"
        stroke="#34D186"
        strokeWidth="0.8"
        fill={phase === 'filled' ? 'white' : 'none'}
        strokeDasharray={strokeDash}
        animate={{
          strokeDashoffset: phase === 'drawing' ? [strokeDash, 0] : [0, 0],
          fillOpacity: phase === 'filled' ? 1 : 0,
          strokeOpacity: phase === 'filled' ? 0 : 1,
        }}
        initial={{ strokeDashoffset: strokeDash, fillOpacity: 0, strokeOpacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      {/* Left arm */}
      <motion.path
        d="M9.45405 27.1482C10.7227 26.4158 12.3448 26.8505 13.0772 28.1191C13.8097 29.3877 13.375 31.0098 12.1064 31.7423L4.00633 36.4189C2.73772 37.1513 1.11556 36.7166 0.383135 35.448C-0.349292 34.1794 0.0853614 32.5573 1.35396 31.8248L9.45405 27.1482Z"
        stroke="#34D186"
        strokeWidth="0.8"
        fill={phase === 'filled' ? 'white' : 'none'}
        strokeDasharray={strokeDash}
        animate={{
          strokeDashoffset: phase === 'drawing' ? [strokeDash, 0] : [0, 0],
          fillOpacity: phase === 'filled' ? 1 : 0,
          strokeOpacity: phase === 'filled' ? 0 : 1,
        }}
        initial={{ strokeDashoffset: strokeDash, fillOpacity: 0, strokeOpacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
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
            <svg width="72" height="26" viewBox="0 0 92 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 27L7.92 8H10.08L18 27H14.88L9.12 11.88H10.08L4.32 27H0ZM3.84 23.4V20.6H14.16V23.4H3.84ZM21.4822 27V8.8H24.2822V27H21.4822ZM18.6822 17.8V15.4H26.8822V17.8H18.6822ZM29.5039 27V7.2H32.3039V27H29.5039ZM42.1543 27.4C41.0209 27.4 39.9876 27.14 39.0543 26.62C38.1343 26.1 37.4009 25.38 36.8543 24.46C36.3209 23.52 36.0543 22.44 36.0543 21.22C36.0543 19.98 36.3209 18.9 36.8543 17.98C37.4009 17.04 38.1343 16.3 39.0543 15.76C39.9876 15.22 41.0209 14.95 42.1543 14.95C43.1076 14.95 43.9476 15.17 44.6743 15.61C45.4143 16.03 45.9943 16.62 46.4143 17.38C46.8343 18.12 47.0443 18.98 47.0443 19.96V23.44C47.0443 24.42 46.8343 25.28 46.4143 26.02C46.0076 26.76 45.4276 27.34 44.6743 27.76C43.9209 28.18 43.0743 28.4 42.1543 28.4V27.4ZM42.6209 25.06C43.7009 25.06 44.5609 24.72 45.2009 24.04C45.8543 23.36 46.1809 22.48 46.1809 21.4C46.1809 20.62 46.0276 19.94 45.7209 19.36C45.4143 18.78 44.9809 18.32 44.4209 17.98C43.8743 17.64 43.2276 17.47 42.4809 17.47C41.8143 17.47 41.2209 17.64 40.7009 17.98C40.1809 18.32 39.7743 18.78 39.4809 19.36C39.1876 19.94 39.0543 20.62 39.0543 21.4C39.0543 22.18 39.1876 22.86 39.4809 23.44C39.7743 24.02 40.1809 24.48 40.7009 24.82C41.2209 25.16 41.8143 25.33 42.4809 25.33L42.6209 25.06ZM45.7876 27V23.86L46.3009 20.84L45.7876 17.86V14.8H48.5876V27H45.7876ZM55.6345 27.4C54.9412 27.4 54.2745 27.32 53.6345 27.16C52.9945 26.98 52.4145 26.72 51.8945 26.38C51.3745 26.04 50.9212 25.62 50.5345 25.12L52.3345 23.3C52.7745 23.84 53.2879 24.24 53.8745 24.52C54.4745 24.78 55.1212 24.91 55.8145 24.91C56.4545 24.91 56.9345 24.8 57.2545 24.58C57.5745 24.36 57.7345 24.06 57.7345 23.68C57.7345 23.28 57.5745 22.96 57.2545 22.72C56.9345 22.48 56.5212 22.28 56.0145 22.12C55.5212 21.96 54.9945 21.8 54.4345 21.64C53.8879 21.46 53.3612 21.24 52.8545 20.96C52.3612 20.68 51.9545 20.3 51.6345 19.82C51.3145 19.34 51.1545 18.72 51.1545 17.96C51.1545 17.14 51.3479 16.42 51.7345 15.82C52.1345 15.22 52.6879 14.75 53.3945 14.42C54.1145 14.09 54.9679 13.92 55.9545 13.92C56.9945 13.92 57.9079 14.11 58.6945 14.49C59.4945 14.86 60.1479 15.41 60.6679 16.14L58.8679 17.96C58.4945 17.49 58.0679 17.13 57.5879 16.88C57.1079 16.63 56.5612 16.5 55.9545 16.5C55.3679 16.5 54.9079 16.59 54.5745 16.77C54.2412 16.95 54.0745 17.22 54.0745 17.58C54.0745 17.96 54.2412 18.25 54.5745 18.46C54.9079 18.67 55.3212 18.85 55.8145 19.01C56.3079 19.16 56.8212 19.33 57.3679 19.52C57.9279 19.7 58.4479 19.94 58.9279 20.24C59.4212 20.53 59.8279 20.93 60.1479 21.44C60.4679 21.94 60.6279 22.6 60.6279 23.44C60.6279 24.72 60.1879 25.72 59.3079 26.44C58.4279 27.16 57.2012 27.52 55.6345 27.52V27.4Z" fill="white"/>
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
