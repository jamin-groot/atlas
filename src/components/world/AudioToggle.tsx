'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  enabled: boolean
  onToggle: () => void
}

export function AudioToggle({ enabled, onToggle }: Props) {
  return (
    <motion.button
      onClick={onToggle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      title={enabled ? 'Mute ambient audio' : 'Enable ambient audio'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
      style={{
        borderColor: enabled ? 'rgba(52,209,134,0.3)' : 'rgba(255,255,255,0.08)',
        background:  enabled ? 'rgba(52,209,134,0.06)' : 'transparent',
      }}
    >
      {/* Sound wave icon */}
      <div className="flex items-center gap-[2.5px] h-3.5">
        {[0.4, 0.7, 1.0, 0.7, 0.4].map((h, i) => (
          <motion.div
            key={i}
            className="w-px rounded-full"
            animate={enabled ? {
              scaleY: [h, h * 0.4 + Math.random() * 0.6, h],
              opacity: [0.7, 1, 0.7],
            } : { scaleY: 0.3, opacity: 0.3 }}
            transition={enabled ? {
              duration: 0.5 + i * 0.1,
              repeat: Infinity,
              repeatType: 'mirror',
              delay: i * 0.08,
              ease: 'easeInOut',
            } : { duration: 0.3 }}
            initial={{ scaleY: h }}
            style={{
              height: '14px',
              transformOrigin: 'center',
              background: enabled ? '#34D186' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.span
          key={enabled ? 'on' : 'off'}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] font-mono tracking-wider"
          style={{ color: enabled ? '#34D186' : 'rgba(255,255,255,0.3)' }}
        >
          {enabled ? 'LIVE' : 'AUDIO'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
