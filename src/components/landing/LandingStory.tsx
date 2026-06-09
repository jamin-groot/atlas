'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onEnter: () => void
}

const ENTER_MESSAGES = [
  'Mapping Opportunities…',
  'Building Atlas World…',
  'Preparing Your Journey…',
]

export function LandingStory({ onEnter }: Props) {
  const [ready, setReady] = useState(false)
  const [entering, setEntering] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)

  // Fade in hero after mount
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Loading sequence after Enter Atlas click
  useEffect(() => {
    if (!entering) return

    let i = 0
    const advance = () => {
      if (i < ENTER_MESSAGES.length - 1) {
        setMsgVisible(false)
        setTimeout(() => {
          i++
          setMsgIndex(i)
          setMsgVisible(true)
          setTimeout(advance, 700)
        }, 300)
      } else {
        // Last message shown — wait then enter
        setTimeout(() => {
          onEnter()
        }, 800)
      }
    }

    setMsgIndex(0)
    setMsgVisible(true)
    setTimeout(advance, 700)
  }, [entering]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnter = () => {
    setEntering(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
    >
      {/* Deep center vignette behind text */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_50%_50%,rgba(3,7,18,0.72)_0%,transparent_100%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!entering ? (
          /* ── HERO ── */
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 20 }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.4 } }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center gap-8 px-6 max-w-xl w-full text-center"
          >
            {/* Atlas logo SVG */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.9 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg width="120" height="44" viewBox="0 0 136 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                <path d="M21.1231 15.9405C21.1231 17.4054 19.9356 18.5929 18.4707 18.5929C17.0059 18.5929 15.8184 17.4054 15.8184 15.9405V6.77784C15.8184 5.31299 17.0059 4.12549 18.4707 4.12549C19.9356 4.12549 21.1231 5.31299 21.1231 6.77784V15.9405Z" fill="white"/>
                <path d="M13.173 25.001C14.8103 25.9463 15.8189 27.7083 15.8189 29.5988L15.8189 43.2222C15.8189 44.687 17.0064 45.8745 18.4713 45.8745C19.9361 45.8745 21.1236 44.687 21.1236 43.2222V28.7076C21.1236 27.3639 21.8405 26.1223 23.0042 25.4504L35.6734 18.1358C36.942 17.4034 37.3766 15.7812 36.6442 14.5126C35.9118 13.244 34.2896 12.8094 33.021 13.5418L20.3342 20.8666C19.1855 21.5298 17.7701 21.5298 16.6214 20.8666L3.97898 13.5675C2.71038 12.835 1.08822 13.2697 0.355792 14.5383C-0.376637 15.8069 0.0580175 17.4291 1.32662 18.1615L13.173 25.001Z" fill="white"/>
                <path d="M35.6039 31.8248C36.8725 32.5573 37.3072 34.1794 36.5748 35.448C35.8423 36.7166 34.2202 37.1513 32.9516 36.4189L25.0004 31.8283C23.7318 31.0958 23.2972 29.4737 24.0296 28.2051C24.762 26.9365 26.3842 26.5018 27.6528 27.2342L35.6039 31.8248Z" fill="white"/>
                <path d="M9.45405 27.1482C10.7227 26.4158 12.3448 26.8505 13.0772 28.1191C13.8097 29.3877 13.375 31.0098 12.1064 31.7423L4.00633 36.4189C2.73772 37.1513 1.11556 36.7166 0.383135 35.448C-0.349292 34.1794 0.0853614 32.5573 1.35396 31.8248L9.45405 27.1482Z" fill="white"/>
                <path d="M44.96 40L56.48 12H59.68L71.12 40H66.16L57.2 17.32H58.88L49.84 40H44.96ZM50.64 34.6V30.6H65.48V34.6H50.64ZM75.8444 40V12.8H80.2444V40H75.8444ZM71.2444 24.8V20.8H84.8444V24.8H71.2444ZM88.0416 40V11.2H92.4416V40H88.0416ZM105.378 40.4C103.645 40.4 102.072 39.96 100.658 39.08C99.2718 38.2 98.1651 37.0133 97.3384 35.52C96.5384 34 96.1384 32.3067 96.1384 30.44C96.1384 28.5467 96.5384 26.8533 97.3384 25.36C98.1651 23.84 99.2718 22.64 100.658 21.76C102.072 20.8533 103.645 20.4 105.378 20.4C106.845 20.4 108.138 20.72 109.258 21.36C110.405 21.9733 111.312 22.8267 111.978 23.92C112.645 25.0133 112.978 26.2533 112.978 27.64V33.16C112.978 34.5467 112.645 35.7867 111.978 36.88C111.338 37.9733 110.445 38.84 109.298 39.48C108.152 40.0933 106.845 40.4 105.378 40.4ZM106.098 36.24C107.725 36.24 109.032 35.6933 110.018 34.6C111.032 33.5067 111.538 32.1067 111.538 30.4C111.538 29.2533 111.312 28.24 110.858 27.36C110.405 26.48 109.765 25.8 108.938 25.32C108.138 24.8133 107.192 24.56 106.098 24.56C105.032 24.56 104.085 24.8133 103.258 25.32C102.458 25.8 101.818 26.48 101.338 27.36C100.885 28.24 100.658 29.2533 100.658 30.4C100.658 31.5467 100.885 32.56 101.338 33.44C101.818 34.32 102.458 35.0133 103.258 35.52C104.085 36 105.032 36.24 106.098 36.24ZM111.258 40V34.84L112.018 30.16L111.258 25.52V20.8H115.658V40H111.258ZM126.822 40.4C125.755 40.4 124.728 40.2667 123.742 40C122.755 39.7067 121.848 39.3067 121.022 38.8C120.195 38.2667 119.475 37.6267 118.862 36.88L121.662 34.08C122.328 34.8533 123.088 35.44 123.942 35.84C124.822 36.2133 125.808 36.4 126.902 36.4C127.888 36.4 128.635 36.2533 129.142 35.96C129.648 35.6667 129.902 35.24 129.902 34.68C129.902 34.0933 129.662 33.64 129.182 33.32C128.702 33 128.075 32.7333 127.302 32.52C126.555 32.28 125.755 32.04 124.902 31.8C124.075 31.56 123.275 31.24 122.502 30.84C121.755 30.4133 121.142 29.84 120.662 29.12C120.182 28.4 119.942 27.4667 119.942 26.32C119.942 25.0933 120.222 24.04 120.782 23.16C121.368 22.28 122.182 21.6 123.222 21.12C124.288 20.64 125.555 20.4 127.022 20.4C128.568 20.4 129.928 20.68 131.102 21.24C132.302 21.7733 133.302 22.5867 134.102 23.68L131.302 26.48C130.742 25.7867 130.102 25.2667 129.382 24.92C128.662 24.5733 127.835 24.4 126.902 24.4C126.022 24.4 125.342 24.5333 124.862 24.8C124.382 25.0667 124.142 25.4533 124.142 25.96C124.142 26.4933 124.382 26.9067 124.862 27.2C125.342 27.4933 125.955 27.7467 126.702 27.96C127.475 28.1733 128.275 28.4133 129.102 28.68C129.955 28.92 130.755 29.2667 131.502 29.72C132.275 30.1467 132.902 30.7333 133.382 31.48C133.862 32.2 134.102 33.1467 134.102 34.32C134.102 36.1867 133.448 37.6667 132.142 38.76C130.835 39.8533 129.062 40.4 126.822 40.4Z" fill="white"/>
              </svg>
            </motion.div>

            {/* Tag */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#34D186]/70"
            >
              Wealth Navigation · Built on Mantle
            </motion.p>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 16 }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2"
            >
              <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-white leading-[1.08]">
                The first map<br />of wealth.
              </h1>
              <p className="text-white/40 text-base leading-relaxed mt-4 max-w-sm mx-auto">
                Explore where your capital can go. Navigate the Mantle ecosystem as a living world of opportunity.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 12 }}
              transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <button
                onClick={handleEnter}
                className="relative group px-12 py-4 rounded-full text-sm font-mono tracking-[0.2em] uppercase transition-all duration-300 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(52,209,134,0.15), rgba(59,130,246,0.10))',
                  border: '1px solid rgba(52,209,134,0.45)',
                  color: '#34D186',
                }}
              >
                {/* Shimmer sweep */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(52,209,134,0.12) 50%, transparent 70%)' }} />
                {/* Outer glow */}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
                  style={{ background: 'rgba(52,209,134,0.08)' }} />
                <span className="relative">Enter Atlas</span>
              </button>

              <p className="text-[10px] font-mono text-white/18 uppercase tracking-widest">
                No wallet required to explore
              </p>
            </motion.div>

            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex items-center gap-6 pt-2"
            >
              <Stat value="6" label="Districts" />
              <div className="w-px h-5 bg-white/8" />
              <Stat value="5.1%" label="Best APY" />
              <div className="w-px h-5 bg-white/8" />
              <Stat value="$1.8B" label="Mantle TVL" />
            </motion.div>
          </motion.div>
        ) : (
          /* ── ENTERING SEQUENCE ── */
          <motion.div
            key="entering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Pulsing orb */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#34D186]/20 animate-ping" style={{ animationDuration: '1.8s' }} />
              <div className="absolute inset-2 rounded-full border border-[#34D186]/30 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
              <div className="w-6 h-6 rounded-full bg-[#34D186]/30 border border-[#34D186]/60 shadow-[0_0_20px_rgba(52,209,134,0.4)]" />
            </div>

            {/* Sequential messages */}
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: msgVisible ? 1 : 0, y: msgVisible ? 0 : -8 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-sm font-mono text-white/60 tracking-[0.15em]"
              >
                {ENTER_MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>

            {/* Progress bar */}
            <motion.div className="w-32 h-px bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #34D186, #3B82F6)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom wordmark — only in hero state */}
      {!entering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center"
        >
          <p className="text-[9px] font-mono text-white/12 uppercase tracking-[0.35em]">
            The Wealth Exploration Layer
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-light text-white/55">{value}</p>
      <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
