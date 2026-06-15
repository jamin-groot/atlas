'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { AtlasNavigator, NavigatorContext } from '@/components/navigator/AtlasNavigator'
import { NavigatorChat } from '@/components/navigator/NavigatorChat'
import { UserIslandPanel } from '@/components/world/UserIslandPanel'
import { DistrictExplorer } from '@/components/districts/DistrictExplorer'
import { OpportunityView } from '@/components/opportunity/OpportunityView'
import { WealthSimulator } from '@/components/opportunity/WealthSimulator'
import { AtlasRoutePanel } from '@/components/route/AtlasRoutePanel'
import { TrustLayer } from '@/components/trust/TrustLayer'
import { AllocationFlow } from '@/components/allocation/AllocationFlow'
import { PortfolioEvolution } from '@/components/portfolio/PortfolioEvolution'
import { AchievementToast } from '@/components/achievements/AchievementToast'
import { useAchievements } from '@/hooks/useAchievements'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useNotifications } from '@/hooks/useNotifications'
import { AtlasRoute, UserGoal } from '@/types/atlas'
import { generateRoutes, goalProgress } from '@/lib/routes'
import { GoalSetModal } from '@/components/goal/GoalSetModal'
import { useVaultAPY } from '@/hooks/useVaultAPY'
import { District, Opportunity, UserIsland } from '@/types/atlas'
import { useWalletPortfolio } from '@/hooks/useWalletPortfolio'
import { useLivePrices, subscribeToApyAlerts } from '@/hooks/useLivePrices'
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory'
import { MOCK_PORTFOLIO } from '@/lib/mockPortfolio'
import { DISTRICTS } from '@/lib/districts'
import { MarketingLanding } from '@/components/landing/MarketingLanding'
import { AudioToggle } from '@/components/world/AudioToggle'
import { useAmbientAudio } from '@/hooks/useAmbientAudio'
import { useAgentAlerts } from '@/hooks/useAgentAlerts'
import * as THREE from 'three'

const AtlasWorldScene = dynamic(
  () => import('@/components/world/AtlasWorldScene').then(m => m.AtlasWorldScene),
  { ssr: false }
)

type Phase = 'landing' | 'exploring' | 'district' | 'connecting' | 'island'

const SCAN_STEPS = [
  'Scanning wallet…',
  'Reading on-chain positions…',
  'Calculating portfolio health…',
  'Building your island…',
]

export default function AtlasPage() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [showLogoReturn, setShowLogoReturn] = useState(false)
  const { enabled: audioEnabled, toggle: toggleAudio } = useAmbientAudio()
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null)
  const [selectedOp, setSelectedOp] = useState<Opportunity | null>(null)
  const [portfolio, setPortfolio] = useState<UserIsland | null>(null)
  const [islandPanelOpen, setIslandPanelOpen] = useState(false)
  const [activeOp, setActiveOp] = useState<Opportunity | null>(null)
  const [showTrust, setShowTrust] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [showAllocation, setShowAllocation] = useState(false)
  const [allocationAmount, setAllocationAmount] = useState(500)
  const [showEvolution, setShowEvolution] = useState(false)
  const [allocationHistory, setAllocationHistory] = useState<{ opportunity: Opportunity; amount: number; date: string }[]>([])
  const [activeRoute, setActiveRoute] = useState<AtlasRoute | null>(null)
  const [showRoutes, setShowRoutes] = useState(false)
  const [navigatorCtx, setNavigatorCtx] = useState<NavigatorContext | null>(null)
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)

  const setNav = useCallback((event: string) => {
    setNavigatorCtx(prev => ({
      phase,
      activeDistrict: activeDistrict?.name ?? null,
      activeOp: activeOp?.name ?? null,
      portfolio: portfolio
        ? {
            totalValue: portfolio.totalValue,
            healthScore: portfolio.healthScore,
            monthlyIncome: portfolio.positions.reduce((s, p) => s + p.income, 0),
          }
        : null,
      goal: userGoal ? { type: userGoal.type, label: userGoal.label } : null,
      goalProgress: portfolio && userGoal ? goalProgress(portfolio, userGoal) : null,
      event,
    }))
  }, [phase, activeDistrict, activeOp, portfolio, userGoal])  // eslint-disable-line react-hooks/exhaustive-deps
  const [scanStep, setScanStep] = useState(0)
  const [showScan, setShowScan] = useState(false)

  // Real wallet connection
  const { notifications, push: pushNotif, markRead, markAllRead, clear: clearNotifs } = useNotifications()
  const { connect, connectors, error: connectError } = useConnect()
  const { address, isConnected, chainId } = useAccount()
  const { unread: agentAlertUnread } = useAgentAlerts(address)
  const isWrongNetwork = isConnected && chainId !== 5003 // 5003 = Mantle Sepolia
  const livePrices = useLivePrices()
  const walletPortfolio = useWalletPortfolio(address, livePrices)
  // Always keep a ref to the latest walletPortfolio so scan closure doesn't go stale
  const walletPortfolioRef = useRef<UserIsland | null>(null)
  useEffect(() => { walletPortfolioRef.current = walletPortfolio }, [walletPortfolio])
  const liveAPY = useVaultAPY()
  const { snapshots, saveSnapshot } = usePortfolioHistory(address)
  const { checkAndMint, newAchievement, clearNew } = useAchievements(address)

  // Fire notification when achievement is earned
  useEffect(() => {
    if (newAchievement) {
      pushNotif('achievement', `Achievement: ${newAchievement.name}`, newAchievement.desc ?? 'Unlocked on Mantle.')
    }
  }, [newAchievement]) // eslint-disable-line react-hooks/exhaustive-deps

  // Feature 2 — Proactive APY alerts
  useEffect(() => {
    const ASSET_LABEL: Record<string, string> = { meth: 'mETH', usdy: 'USDY', musd: 'mUSD' }
    const ASSET_DISTRICT: Record<string, string> = { meth: 'staking', usdy: 'income', musd: 'income' }

    const unsub = subscribeToApyAlerts(alerts => {
      alerts.forEach(alert => {
        const label = ASSET_LABEL[alert.asset] ?? alert.asset.toUpperCase()
        const dir   = alert.delta > 0 ? '↑' : '↓'
        const districtId = ASSET_DISTRICT[alert.asset]
        const district   = DISTRICTS.find(d => d.id === districtId) ?? null

        pushNotif(
          'alert',
          `${label} APY ${dir} ${Math.abs(alert.delta).toFixed(2)}%`,
          `Yield moved ${alert.prev.toFixed(1)}% → ${alert.curr.toFixed(1)}%. ${alert.delta < 0 ? 'Consider rebalancing.' : 'Now beating alternatives.'}`,
          district
            ? { label: `View ${district.name}`, onClick: () => handleDistrictClick(district) }
            : undefined,
        )
      })
    })
    return unsub
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { disconnect } = useDisconnect()

  // When wallet connects, run the scan sequence
  // Only auto-scan if the user has already left the landing page
  useEffect(() => {
    if (isConnected && address && !portfolio && phase !== 'landing') {
      runScanSequence()
    }
  }, [isConnected, address, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep portfolio in sync with live on-chain data (polls every 5s via hook)
  // Always overwrite with real data — even if mock was set during scan
  useEffect(() => {
    if (walletPortfolio) {
      setPortfolio(walletPortfolio)
    }
  }, [walletPortfolio]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset all state when wallet disconnects
  useEffect(() => {
    if (!isConnected && portfolio) {
      setPortfolio(null)
      setPhase('landing')
      setActiveDistrict(null)
      setSelectedOp(null)
      setActiveOp(null)
      setIslandPanelOpen(false)
      setShowAllocation(false)
      setShowSimulator(false)
      setShowEvolution(false)
      setShowRoutes(false)
      setActiveRoute(null)
      setAllocationHistory([])
      setUserGoal(null)
      setShowGoalModal(false)
    }
  }, [isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Back button — show logo briefly, then return to landing
  useEffect(() => {
    const handlePopState = () => {
      setShowLogoReturn(true)
      setTimeout(() => {
        setPhase('landing')
        setActiveDistrict(null)
        setSelectedOp(null)
        setActiveOp(null)
        setTimeout(() => setShowLogoReturn(false), 600)
      }, 900)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleExplore = useCallback(() => {
    history.pushState({ phase: 'exploring' }, '')
    setPhase('exploring')
    // Welcome message — wonder first, no wallet pressure
    setNav('Welcome to Atlas. Wealth has never had a map. Explore where your capital can go.')
  }, [])

  const handleConnectWallet = useCallback(() => {
    const connector = connectors.find(c => c.id === 'injected') ?? connectors[0]
    if (connector) {
      connect({ connector })
    } else {
      window.open('https://metamask.io/download/', '_blank')
    }
  }, [connect, connectors])

  const runScanSequence = useCallback(() => {
    setShowScan(true)
    setScanStep(0)
    SCAN_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setScanStep(i)
        if (i === SCAN_STEPS.length - 1) {
          setTimeout(() => {
            // Use ref to get the latest real data — avoids stale closure bug
            const realPortfolio = walletPortfolioRef.current
            setShowScan(false)
            setPhase('island')
            if (realPortfolio) {
              setPortfolio(realPortfolio)
              setNav('Your island is ready. Tell me what you\'re trying to achieve and I\'ll build routes toward your goal.')
              setShowGoalModal(true)
            } else {
              // Real data still loading — continuous sync effect will update portfolio once ready
              setNav('Your island is ready. Syncing on-chain data…')
            }
          }, 900)
        }
      }, i * 900)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDistrictClick = useCallback((district: District) => {
    setActiveDistrict(district)
    setSelectedOp(null)
    setPhase('district')
    const msg = district.opportunities.length > 0
      ? `${district.opportunities.length} opportunity${district.opportunities.length > 1 ? 's' : ''} discovered in ${district.name}.`
      : `${district.name} is forming. Check back soon.`
    setNav(msg)
  }, [])

  const handleOpportunityClick = useCallback((op: Opportunity) => {
    setSelectedOp(prev => prev?.id === op.id ? null : op)
    setNav(`${op.name} — ${op.apy}% APY. ${op.risk} risk. Mantle native.`)
  }, [])

  const handleEnterOp = useCallback((op: Opportunity) => {
    setActiveOp(op)
    setNav(`Entering ${op.name}. Camera diving deeper.`)
  }, [])

  const handleFollowRoute = useCallback((route: AtlasRoute) => {
    const district = DISTRICTS.find(d => d.id === route.to.district) ?? null
    const op = district?.opportunities.find(o => o.id === route.to.opportunityId) ?? null

    setShowRoutes(false)

    if (district) {
      setActiveDistrict(district)
      setSelectedOp(op)
      setPhase('district')
    }

    if (op) {
      // Small delay so camera starts flying first, then opportunity opens
      setTimeout(() => {
        setActiveOp(op)
        setNav(`Route locked in. ${op.name} — ${op.apy}% APY. Ready to allocate.`)
      }, 600)
    } else {
      setNav(`Flying to ${district?.name ?? route.to.label}. Explore the opportunities inside.`)
    }
  }, [])

  const handleBack = useCallback(() => {
    setActiveDistrict(null)
    setSelectedOp(null)
    setPhase(portfolio ? 'island' : 'exploring')
    setNav('Returning to the world. Keep exploring.')
  }, [portfolio])

  const cameraTarget = useMemo(() => {
    if (activeDistrict) return new THREE.Vector3(...activeDistrict.position)
    return new THREE.Vector3(0, 0, 0)
  }, [activeDistrict])

  const cameraDistance = phase === 'district' ? 6 : 18
  const autoRotate = phase === 'landing'

  return (
    <div className="relative w-full h-full bg-[#030712]">

      {/* 3D World */}
      <div className="absolute inset-0">
        <AtlasWorldScene
          onDistrictClick={handleDistrictClick}
          onIslandClick={() => setIslandPanelOpen(true)}
          onOpportunityClick={handleOpportunityClick}
          highlightedDistrict={activeDistrict?.id ?? null}
          selectedOpportunity={selectedOp}
          autoRotate={autoRotate}
          cameraTarget={cameraTarget}
          cameraDistance={cameraDistance}
          portfolio={portfolio}
          activeDistrict={activeDistrict}
          allocationCount={allocationHistory.length}
          activeRoute={showRoutes ? activeRoute : null}
          liveAPY={liveAPY}
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#030712_100%)]" />

      {/* Top bar — hidden during landing (marketing page has its own nav) */}
      <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-10 ${phase === 'landing' ? 'pointer-events-none opacity-0' : ''}`}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: phase !== 'landing' ? 1 : 0, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <svg width="80" height="29" viewBox="0 0 136 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.1231 15.9405C21.1231 17.4054 19.9356 18.5929 18.4707 18.5929C17.0059 18.5929 15.8184 17.4054 15.8184 15.9405V6.77784C15.8184 5.31299 17.0059 4.12549 18.4707 4.12549C19.9356 4.12549 21.1231 5.31299 21.1231 6.77784V15.9405Z" fill="white"/>
            <path d="M13.173 25.001C14.8103 25.9463 15.8189 27.7083 15.8189 29.5988L15.8189 43.2222C15.8189 44.687 17.0064 45.8745 18.4713 45.8745C19.9361 45.8745 21.1236 44.687 21.1236 43.2222V28.7076C21.1236 27.3639 21.8405 26.1223 23.0042 25.4504L35.6734 18.1358C36.942 17.4034 37.3766 15.7812 36.6442 14.5126C35.9118 13.244 34.2896 12.8094 33.021 13.5418L20.3342 20.8666C19.1855 21.5298 17.7701 21.5298 16.6214 20.8666L3.97898 13.5675C2.71038 12.835 1.08822 13.2697 0.355792 14.5383C-0.376637 15.8069 0.0580175 17.4291 1.32662 18.1615L13.173 25.001Z" fill="white"/>
            <path d="M35.6039 31.8248C36.8725 32.5573 37.3072 34.1794 36.5748 35.448C35.8423 36.7166 34.2202 37.1513 32.9516 36.4189L25.0004 31.8283C23.7318 31.0958 23.2972 29.4737 24.0296 28.2051C24.762 26.9365 26.3842 26.5018 27.6528 27.2342L35.6039 31.8248Z" fill="white"/>
            <path d="M9.45405 27.1482C10.7227 26.4158 12.3448 26.8505 13.0772 28.1191C13.8097 29.3877 13.375 31.0098 12.1064 31.7423L4.00633 36.4189C2.73772 37.1513 1.11556 36.7166 0.383135 35.448C-0.349292 34.1794 0.0853614 32.5573 1.35396 31.8248L9.45405 27.1482Z" fill="white"/>
            <path d="M44.96 40L56.48 12H59.68L71.12 40H66.16L57.2 17.32H58.88L49.84 40H44.96ZM50.64 34.6V30.6H65.48V34.6H50.64ZM75.8444 40V12.8H80.2444V40H75.8444ZM71.2444 24.8V20.8H84.8444V24.8H71.2444ZM88.0416 40V11.2H92.4416V40H88.0416ZM105.378 40.4C103.645 40.4 102.072 39.96 100.658 39.08C99.2718 38.2 98.1651 37.0133 97.3384 35.52C96.5384 34 96.1384 32.3067 96.1384 30.44C96.1384 28.5467 96.5384 26.8533 97.3384 25.36C98.1651 23.84 99.2718 22.64 100.658 21.76C102.072 20.8533 103.645 20.4 105.378 20.4C106.845 20.4 108.138 20.72 109.258 21.36C110.405 21.9733 111.312 22.8267 111.978 23.92C112.645 25.0133 112.978 26.2533 112.978 27.64V33.16C112.978 34.5467 112.645 35.7867 111.978 36.88C111.338 37.9733 110.445 38.84 109.298 39.48C108.152 40.0933 106.845 40.4 105.378 40.4ZM106.098 36.24C107.725 36.24 109.032 35.6933 110.018 34.6C111.032 33.5067 111.538 32.1067 111.538 30.4C111.538 29.2533 111.312 28.24 110.858 27.36C110.405 26.48 109.765 25.8 108.938 25.32C108.138 24.8133 107.192 24.56 106.098 24.56C105.032 24.56 104.085 24.8133 103.258 25.32C102.458 25.8 101.818 26.48 101.338 27.36C100.885 28.24 100.658 29.2533 100.658 30.4C100.658 31.5467 100.885 32.56 101.338 33.44C101.818 34.32 102.458 35.0133 103.258 35.52C104.085 36 105.032 36.24 106.098 36.24ZM111.258 40V34.84L112.018 30.16L111.258 25.52V20.8H115.658V40H111.258ZM126.822 40.4C125.755 40.4 124.728 40.2667 123.742 40C122.755 39.7067 121.848 39.3067 121.022 38.8C120.195 38.2667 119.475 37.6267 118.862 36.88L121.662 34.08C122.328 34.8533 123.088 35.44 123.942 35.84C124.822 36.2133 125.808 36.4 126.902 36.4C127.888 36.4 128.635 36.2533 129.142 35.96C129.648 35.6667 129.902 35.24 129.902 34.68C129.902 34.0933 129.662 33.64 129.182 33.32C128.702 33 128.075 32.7333 127.302 32.52C126.555 32.28 125.755 32.04 124.902 31.8C124.075 31.56 123.275 31.24 122.502 30.84C121.755 30.4133 121.142 29.84 120.662 29.12C120.182 28.4 119.942 27.4667 119.942 26.32C119.942 25.0933 120.222 24.04 120.782 23.16C121.368 22.28 122.182 21.6 123.222 21.12C124.288 20.64 125.555 20.4 127.022 20.4C128.568 20.4 129.928 20.68 131.102 21.24C132.302 21.7733 133.302 22.5867 134.102 23.68L131.302 26.48C130.742 25.7867 130.102 25.2667 129.382 24.92C128.662 24.5733 127.835 24.4 126.902 24.4C126.022 24.4 125.342 24.5333 124.862 24.8C124.382 25.0667 124.142 25.4533 124.142 25.96C124.142 26.4933 124.382 26.9067 124.862 27.2C125.342 27.4933 125.955 27.7467 126.702 27.96C127.475 28.1733 128.275 28.4133 129.102 28.68C129.955 28.92 130.755 29.2667 131.502 29.72C132.275 30.1467 132.902 30.7333 133.382 31.48C133.862 32.2 134.102 33.1467 134.102 34.32C134.102 36.1867 133.448 37.6667 132.142 38.76C130.835 39.8533 129.062 40.4 126.822 40.4Z" fill="white"/>
          </svg>
        </motion.div>

        {/* Centered Navigator trigger + audio toggle */}
        {phase !== 'landing' && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <NavigatorChat
              portfolio={portfolio}
              visible
              wallet={address}
              agentAlertCount={agentAlertUnread}
              onAllocate={({ opportunityId, amount }) => {
                const allOps = DISTRICTS.flatMap(d => d.opportunities)
                const op = allOps.find(o => o.id === opportunityId)
                  ?? allOps.find(o => opportunityId.includes(o.id) || o.id.includes(opportunityId))
                  ?? allOps.find(o => o.id === 'usdy')
                if (op) {
                  setActiveOp(op)
                  setShowAllocation(false)
                  setTimeout(() => {
                    setAllocationAmount(amount)
                    setShowAllocation(true)
                  }, 0)
                }
              }}
            />
            <AudioToggle enabled={audioEnabled} onToggle={toggleAudio} />
          </div>
        )}

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          {/* Island phase — wallet connected, waiting for real data */}
          {isConnected && phase === 'island' && !portfolio && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#34D186]/70 border border-[#34D186]/20 rounded-full px-3 py-1.5 animate-pulse">
                ⬡ Syncing on-chain data…
              </span>
            </div>
          )}
          {/* Island phase — portfolio loaded */}
          {portfolio && (
            <div className="flex items-center gap-2">
              <NotificationCenter
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onClear={clearNotifs}
              />
              <button
                onClick={() => setShowEvolution(true)}
                className="text-xs font-mono text-white/40 border border-white/8 rounded-full px-3 py-1.5 hover:text-white/70 hover:border-white/20 transition-all"
              >
                Evolution
              </button>
              {/* Goal progress tracker */}
              {userGoal && portfolio ? (() => {
                const gp = goalProgress(portfolio, userGoal)
                return (
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="flex items-center gap-2.5 border rounded-full px-3 py-1.5 transition-all hover:border-[#34D186]/40 group"
                    style={{ borderColor: 'rgba(52,209,134,0.2)', background: 'rgba(52,209,134,0.04)' }}
                  >
                    {/* Mini arc progress */}
                    <div className="relative w-4 h-4 flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90">
                        <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(52,209,134,0.15)" strokeWidth="2" />
                        <circle cx="8" cy="8" r="6" fill="none" stroke="#34D186" strokeWidth="2"
                          strokeDasharray={`${(gp / 100) * 37.7} 37.7`}
                          strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-mono text-[#34D186]">{gp}%</span>
                    <span className="text-[10px] font-mono text-white/35 max-w-[100px] truncate">{userGoal.label}</span>
                  </button>
                )
              })() : (
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="text-xs font-mono text-white/40 border border-white/8 rounded-full px-3 py-1.5 hover:text-white/70 hover:border-white/20 transition-all"
                >
                  Set goal
                </button>
              )}
              <button
                onClick={() => {
                  if (!userGoal) { setShowGoalModal(true); return }
                  if (portfolio) {
                    const routes = generateRoutes(portfolio, liveAPY, userGoal)
                    if (routes[0]) setActiveRoute(routes[0])
                  }
                  setShowRoutes(true)
                }}
                className="text-xs font-mono text-white/40 border border-white/8 rounded-full px-3 py-1.5 hover:text-white/70 hover:border-white/20 transition-all"
              >
                Routes
              </button>
              {isWrongNetwork && (
                <span className="text-[10px] font-mono text-amber-400 border border-amber-400/30 rounded-full px-3 py-1.5 animate-pulse">
                  ⚠ Switch to Mantle Sepolia
                </span>
              )}
              <button
                onClick={() => setIslandPanelOpen(true)}
                className="flex items-center gap-2 text-xs font-mono text-white/70 border border-white/15 rounded-full px-4 py-1.5 hover:border-white/30 hover:text-white transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#34D186] shadow-[0_0_6px_#34D186]" />
                {address ? `${address.slice(0,6)}…${address.slice(-4)}` : ''} · $
                {portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Health {portfolio.healthScore}
              </button>
              <button
                onClick={() => disconnect()}
                className="text-[10px] font-mono text-white/25 border border-white/6 rounded-full px-3 py-1.5 hover:text-red-400/70 hover:border-red-400/20 transition-all uppercase tracking-wider"
              >
                Disconnect
              </button>
            </div>
          )}
          {/* Not connected — subtle hint, no pressure */}
          {!isConnected && phase !== 'island' && phase !== 'landing' && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleConnectWallet}
                className="text-[10px] font-mono text-white/30 border border-white/8 rounded-full px-4 py-1.5 hover:text-white/60 hover:border-white/20 transition-all uppercase tracking-wider"
              >
                Connect for personalized view
              </button>
              {connectError && (
                <p className="text-[10px] font-mono text-red-400/70">{connectError.message}</p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Landing — full marketing website */}
      <AnimatePresence>
        {phase === 'landing' && (
          <MarketingLanding onEnter={handleExplore} />
        )}
      </AnimatePresence>

      {/* Wallet scan */}
      <AnimatePresence>
        {showScan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#030712]/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-white/10 bg-[#030712]/80 backdrop-blur-xl px-10 py-8 flex flex-col items-center gap-5 w-72"
            >
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#34D186]/30 animate-ping" />
                <div className="w-8 h-8 rounded-full bg-[#34D186]/20 border border-[#34D186]/60 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#34D186]" />
                </div>
              </div>
              <div className="text-center space-y-1">
                {SCAN_STEPS.map((step, i) => (
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: i <= scanStep ? 1 : 0.2, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-xs font-mono"
                    style={{ color: i === scanStep ? '#34D186' : i < scanStep ? '#ffffff60' : '#ffffff20' }}
                  >
                    {i < scanStep ? '✓ ' : i === scanStep ? '› ' : '  '}{step}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explore hint */}
      <AnimatePresence>
        {(phase === 'exploring' || phase === 'island') && !islandPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute bottom-8 left-0 right-0 flex justify-center z-10 pointer-events-none"
          >
            <div className="flex items-center gap-5 px-6 py-3 rounded-full border border-white/10 bg-[#030712]/40 backdrop-blur-md">
              {/* Drag to rotate */}
              <div className="flex items-center gap-2.5">
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="opacity-50">
                  <rect x="4" y="1" width="8" height="13" rx="4" stroke="white" strokeWidth="1.5"/>
                  <line x1="8" y1="5" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M1 9l3 3M15 9l-3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
                </svg>
                <span className="text-white/50 text-xs font-mono">Drag to rotate</span>
              </div>

              <div className="w-px h-4 bg-white/10" />

              {/* Scroll to zoom */}
              <div className="flex items-center gap-2.5">
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="opacity-50">
                  <rect x="4" y="1" width="8" height="13" rx="4" stroke="white" strokeWidth="1.5"/>
                  <line x1="8" y1="4" x2="8" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 7l2-2.5L10 7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 10l2 2.5L10 10" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                </svg>
                <span className="text-white/50 text-xs font-mono">Scroll to zoom</span>
              </div>

              <div className="w-px h-4 bg-white/10" />

              {/* Click to explore */}
              <div className="flex items-center gap-2.5">
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="opacity-50">
                  <path d="M6 1v8L4 7.5 3 9l3.5 4.5H10l1-5.5L9.5 8V1H6z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                <span className="text-white/50 text-xs font-mono">Click a district to explore</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* District Explorer — Screen 3 */}
      <DistrictExplorer
        district={phase === 'district' ? activeDistrict : null}
        selectedOp={selectedOp}
        onSelectOp={handleOpportunityClick}
        onEnterOp={handleEnterOp}
        onBack={handleBack}
      />

      {/* Atlas Route — Screen 6 */}
      {(() => {
        const routes = portfolio ? generateRoutes(portfolio, liveAPY, userGoal) : []
        const gp = portfolio && userGoal ? goalProgress(portfolio, userGoal) : undefined
        return (
          <AtlasRoutePanel
            activeRoute={activeRoute}
            routes={routes}
            onSelectRoute={r => { setActiveRoute(r); setShowRoutes(true) }}
            onAccept={handleFollowRoute}
            onDismiss={() => setShowRoutes(false)}
            visible={showRoutes && !activeOp && !showSimulator}
            goal={userGoal}
            goalProgress={gp}
          />
        )
      })()}

      {/* Portfolio Evolution — Screen 9 */}
      {(() => {
        const routes = portfolio ? generateRoutes(portfolio, liveAPY, userGoal) : []
        const nextRoute = routes[1] ?? routes[0] ?? null
        return (
          <PortfolioEvolution
            portfolio={portfolio}
            allocations={allocationHistory}
            snapshots={snapshots}
            nextRoute={nextRoute}
            visible={showEvolution}
            onClose={() => setShowEvolution(false)}
            onNextRoute={() => {
              setShowEvolution(false)
              if (nextRoute) { setActiveRoute(nextRoute); setShowRoutes(true) }
              setNav('New route loaded. Follow it to keep growing.')
            }}
          />
        )
      })()}

      {/* Allocation Flow — Screen 8 */}
      <AllocationFlow
        opportunity={activeOp}
        amount={allocationAmount}
        portfolio={portfolio}
        visible={showAllocation}
        onBack={() => setShowAllocation(false)}
        onSuccess={(op, amt) => {
          setShowAllocation(false)
          setActiveOp(null)
          const mo = ((amt * op.apy) / 100 / 12).toFixed(0)
          const newHistory = [...allocationHistory, {
            opportunity: op,
            amount: amt,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }]
          setAllocationHistory(newHistory)

          // Achievement triggers
          if (newHistory.length === 1) checkAndMint('first_steps')
          const totalMonthly = newHistory.reduce((s, a) => s + (a.amount * a.opportunity.apy) / 100 / 12, 0)
          if (totalMonthly >= 50) checkAndMint('income_seeker')
          pushNotif('allocation', 'Allocation confirmed', `$${amt.toLocaleString()} allocated to ${op.name}. +$${mo}/month added to your island.`)
          setNav(`Allocation complete. +$${mo}/month added to your island.`)

          // Save real snapshot to Supabase
          if (walletPortfolio) saveSnapshot(walletPortfolio, `deposit:${op.id}:$${amt}`)

          setTimeout(() => setShowEvolution(true), 1200)
        }}
      />

      {/* Trust Layer — Screen 7 */}
      <TrustLayer
        opportunity={activeOp}
        visible={showTrust}
        onClose={() => setShowTrust(false)}
      />

      {/* Wealth Simulator — Screen 5 */}
      {showSimulator && (
        <WealthSimulator
          opportunity={activeOp}
          portfolio={portfolio}
          onBack={() => setShowSimulator(false)}
          onAllocate={(amount) => {
            setAllocationAmount(amount)
            setShowSimulator(false)
            setShowAllocation(true)
          }}
        />
      )}

      {/* Opportunity View — Screen 4 */}
      {!showSimulator && (
        <OpportunityView
          opportunity={activeOp}
          portfolio={portfolio}
          onBack={() => { setActiveOp(null); setShowTrust(false); setShowSimulator(false) }}
          onSimulate={() => { setShowSimulator(true); setNav('Adjust the amount to see how outcomes change in real time.') }}
          onAllocate={() => {
            if (!isConnected) {
              // Prompt wallet connection contextually — not before
              setNav('Connect your wallet to allocate. Atlas will scan your portfolio and personalize the world.')
              handleConnectWallet()
              return
            }
            setShowAllocation(true)
          }}
          onTrust={() => setShowTrust(true)}
        />
      )}

      {/* User Island panel — Screen 2 */}
      {portfolio && (
        <UserIslandPanel
          portfolio={portfolio}
          visible={islandPanelOpen}
          onClose={() => setIslandPanelOpen(false)}
        />
      )}

      {/* Achievement toast */}
      <AchievementToast achievement={newAchievement} onClose={clearNew} />

      {/* Logo return splash — shown briefly when back button is pressed */}
      <AnimatePresence>
        {showLogoReturn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5 }}
            >
              <svg width="120" height="44" viewBox="0 0 136 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.1231 15.9405C21.1231 17.4054 19.9356 18.5929 18.4707 18.5929C17.0059 18.5929 15.8184 17.4054 15.8184 15.9405V6.77784C15.8184 5.31299 17.0059 4.12549 18.4707 4.12549C19.9356 4.12549 21.1231 5.31299 21.1231 6.77784V15.9405Z" fill="white"/>
                <path d="M13.173 25.001C14.8103 25.9463 15.8189 27.7083 15.8189 29.5988L15.8189 43.2222C15.8189 44.687 17.0064 45.8745 18.4713 45.8745C19.9361 45.8745 21.1236 44.687 21.1236 43.2222V28.7076C21.1236 27.3639 21.8405 26.1223 23.0042 25.4504L35.6734 18.1358C36.942 17.4034 37.3766 15.7812 36.6442 14.5126C35.9118 13.244 34.2896 12.8094 33.021 13.5418L20.3342 20.8666C19.1855 21.5298 17.7701 21.5298 16.6214 20.8666L3.97898 13.5675C2.71038 12.835 1.08822 13.2697 0.355792 14.5383C-0.376637 15.8069 0.0580175 17.4291 1.32662 18.1615L13.173 25.001Z" fill="white"/>
                <path d="M35.6039 31.8248C36.8725 32.5573 37.3072 34.1794 36.5748 35.448C35.8423 36.7166 34.2202 37.1513 32.9516 36.4189L25.0004 31.8283C23.7318 31.0958 23.2972 29.4737 24.0296 28.2051C24.762 26.9365 26.3842 26.5018 27.6528 27.2342L35.6039 31.8248Z" fill="white"/>
                <path d="M9.45405 27.1482C10.7227 26.4158 12.3448 26.8505 13.0772 28.1191C13.8097 29.3877 13.375 31.0098 12.1064 31.7423L4.00633 36.4189C2.73772 37.1513 1.11556 36.7166 0.383135 35.448C-0.349292 34.1794 0.0853614 32.5573 1.35396 31.8248L9.45405 27.1482Z" fill="white"/>
                <path d="M44.96 40L56.48 12H59.68L71.12 40H66.16L57.2 17.32H58.88L49.84 40H44.96ZM50.64 34.6V30.6H65.48V34.6H50.64ZM75.8444 40V12.8H80.2444V40H75.8444ZM71.2444 24.8V20.8H84.8444V24.8H71.2444ZM88.0416 40V11.2H92.4416V40H88.0416ZM105.378 40.4C103.645 40.4 102.072 39.96 100.658 39.08C99.2718 38.2 98.1651 37.0133 97.3384 35.52C96.5384 34 96.1384 32.3067 96.1384 30.44C96.1384 28.5467 96.5384 26.8533 97.3384 25.36C98.1651 23.84 99.2718 22.64 100.658 21.76C102.072 20.8533 103.645 20.4 105.378 20.4C106.845 20.4 108.138 20.72 109.258 21.36C110.405 21.9733 111.312 22.8267 111.978 23.92C112.645 25.0133 112.978 26.2533 112.978 27.64V33.16C112.978 34.5467 112.645 35.7867 111.978 36.88C111.338 37.9733 110.445 38.84 109.298 39.48C108.152 40.0933 106.845 40.4 105.378 40.4ZM106.098 36.24C107.725 36.24 109.032 35.6933 110.018 34.6C111.032 33.5067 111.538 32.1067 111.538 30.4C111.538 29.2533 111.312 28.24 110.858 27.36C110.405 26.48 109.765 25.8 108.938 25.32C108.138 24.8133 107.192 24.56 106.098 24.56C105.032 24.56 104.085 24.8133 103.258 25.32C102.458 25.8 101.818 26.48 101.338 27.36C100.885 28.24 100.658 29.2533 100.658 30.4C100.658 31.5467 100.885 32.56 101.338 33.44C101.818 34.32 102.458 35.0133 103.258 35.52C104.085 36 105.032 36.24 106.098 36.24ZM111.258 40V34.84L112.018 30.16L111.258 25.52V20.8H115.658V40H111.258ZM126.822 40.4C125.755 40.4 124.728 40.2667 123.742 40C122.755 39.7067 121.848 39.3067 121.022 38.8C120.195 38.2667 119.475 37.6267 118.862 36.88L121.662 34.08C122.328 34.8533 123.088 35.44 123.942 35.84C124.822 36.2133 125.808 36.4 126.902 36.4C127.888 36.4 128.635 36.2533 129.142 35.96C129.648 35.6667 129.902 35.24 129.902 34.68C129.902 34.0933 129.662 33.64 129.182 33.32C128.702 33 128.075 32.7333 127.302 32.52C126.555 32.28 125.755 32.04 124.902 31.8C124.075 31.56 123.275 31.24 122.502 30.84C121.755 30.4133 121.142 29.84 120.662 29.12C120.182 28.4 119.942 27.4667 119.942 26.32C119.942 25.0933 120.222 24.04 120.782 23.16C121.368 22.28 122.182 21.6 123.222 21.12C124.288 20.64 125.555 20.4 127.022 20.4C128.568 20.4 129.928 20.68 131.102 21.24C132.302 21.7733 133.302 22.5867 134.102 23.68L131.302 26.48C130.742 25.7867 130.102 25.2667 129.382 24.92C128.662 24.5733 127.835 24.4 126.902 24.4C126.022 24.4 125.342 24.5333 124.862 24.8C124.382 25.0667 124.142 25.4533 124.142 25.96C124.142 26.4933 124.382 26.9067 124.862 27.2C125.342 27.4933 125.955 27.7467 126.702 27.96C127.475 28.1733 128.275 28.4133 129.102 28.68C129.955 28.92 130.755 29.2667 131.502 29.72C132.275 30.1467 132.902 30.7333 133.382 31.48C133.862 32.2 134.102 33.1467 134.102 34.32C134.102 36.1867 133.448 37.6667 132.142 38.76C130.835 39.8533 129.062 40.4 126.822 40.4Z" fill="white"/>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Modal — shown once after island loads */}
      <GoalSetModal
        visible={showGoalModal}
        monthlyIncome={portfolio?.positions.reduce((s, p) => s + p.income, 0) ?? 0}
        portfolioValue={portfolio?.totalValue ?? 0}
        onSet={goal => {
          setUserGoal(goal)
          setShowGoalModal(false)
          if (portfolio) {
            const routes = generateRoutes(portfolio, liveAPY, goal)
            if (routes[0]) {
              setActiveRoute(routes[0])
              setShowRoutes(true)
              const mo = routes[0].projectedMonthlyIncome.toFixed(0)
              setNav(`Goal set: ${goal.label}. I built ${routes.length} route${routes.length > 1 ? 's' : ''} toward it. First stop adds $${mo}/month.`)
              pushNotif('route', 'Routes ready', `${routes.length} route${routes.length > 1 ? 's' : ''} built toward your goal. First stop adds $${mo}/month.`, { label: 'View routes', onClick: () => setShowRoutes(true) })
            } else {
              setNav(`Goal set: ${goal.label}. Explore the districts to start building toward it.`)
            }
          }
        }}
      />

      {/* Atlas Navigator */}
      <div className="absolute bottom-8 left-6 z-10">
        <AtlasNavigator
          context={navigatorCtx}
          visible={phase !== 'landing' && !showScan}
          onExplore={() => setShowRoutes(true)}
          onSuggestRoute={() => {
            if (portfolio) {
              const routes = generateRoutes(portfolio, liveAPY, userGoal)
              if (routes[0]) setActiveRoute(routes[0])
            }
            setShowRoutes(true)
          }}
        />
      </div>

    </div>
  )
}
