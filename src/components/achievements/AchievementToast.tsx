'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Achievement } from '@/hooks/useAchievements'

interface Props {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementToast({ achievement, onClose }: Props) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-[#34D186]/40 bg-black/80 backdrop-blur-xl px-5 py-3.5 shadow-[0_0_30px_#34D18630]">
            {/* Achievement badge */}
            <div className="w-9 h-9 rounded-full border border-[#34D186]/50 bg-[#34D186]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#34D186] text-sm">{achievement.symbol}</span>
            </div>

            <div>
              <p className="text-[10px] font-mono text-[#34D186] uppercase tracking-widest">Achievement Unlocked</p>
              <p className="text-sm font-light text-white">{achievement.name}</p>
              {achievement.desc && (
                <p className="text-[11px] text-white/40 mt-0.5">{achievement.desc}</p>
              )}
            </div>

            <button onClick={onClose} className="ml-2 text-white/25 hover:text-white/50 transition-colors text-xs flex-shrink-0">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
