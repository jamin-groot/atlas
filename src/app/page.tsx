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
import { AtlasRoute } from '@/types/atlas'
import { generateRoutes } from '@/lib/routes'
import { useVaultAPY } from '@/hooks/useVaultAPY'
import { District, Opportunity, UserIsland } from '@/types/atlas'
import { useWalletPortfolio } from '@/hooks/useWalletPortfolio'
import { useLivePrices, subscribeToApyAlerts } from '@/hooks/useLivePrices'
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory'
import { MOCK_PORTFOLIO } from '@/lib/mockPortfolio'
import { DISTRICTS } from '@/lib/districts'
import { MarketingLanding } from '@/components/landing/MarketingLanding'
import { AtlasLogo } from '@/components/AtlasLogo'
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
      event,
    }))
  }, [phase, activeDistrict, activeOp, portfolio])  // eslint-disable-line react-hooks/exhaustive-deps
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

  // When wallet connects, run the scan sequence — but only if the user
  // has already left the landing page (i.e. they clicked "Enter Atlas").
  // We never auto-skip the landing so the Try Demo button is always visible.
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

  // Demo mode — loads mock island immediately, no wallet needed
  const handleDemoMode = useCallback(() => {
    history.pushState({ phase: 'island' }, '')
    setPhase('island')
    setPortfolio(MOCK_PORTFOLIO)
    const routes = generateRoutes(MOCK_PORTFOLIO, liveAPY)
    if (routes[0]) { setActiveRoute(routes[0]); setShowRoutes(true) }
    setNav('Demo mode — exploring Atlas with a sample portfolio. Connect your wallet to load real data.')
  }, [liveAPY])

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
              const routes = generateRoutes(realPortfolio, liveAPY)
              if (routes[0]) {
                setActiveRoute(routes[0])
                setShowRoutes(true)
                const mo = routes[0].projectedMonthlyIncome.toFixed(0)
                setNav(`Your island is ready. I found a route that could add $${mo}/month to your income.`)
                pushNotif('route', 'Route discovered', `Atlas Navigator found a route that adds $${mo}/month to your income.`, { label: 'View route', onClick: () => setShowRoutes(true) })
              } else {
                setNav('Your island is ready. Explore the districts to find opportunities.')
              }
            } else {
              // No real on-chain data — fall back to mock so the island always loads
              setPortfolio(MOCK_PORTFOLIO)
              const routes = generateRoutes(MOCK_PORTFOLIO, liveAPY)
              if (routes[0]) {
                setActiveRoute(routes[0])
                setShowRoutes(true)
              }
              setNav('Your island is ready. Explore the districts to discover yield opportunities.')
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
          <AtlasLogo width={80} />
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
                if (op) {
                  setActiveOp(op)
                  setAllocationAmount(amount)
                  setShowAllocation(true)
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
              <button
                onClick={() => {
                  if (portfolio) {
                    const routes = generateRoutes(portfolio, liveAPY)
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
          <MarketingLanding onEnter={handleExplore} onDemo={handleDemoMode} />
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
        const routes = portfolio ? generateRoutes(portfolio, liveAPY) : []
        return (
          <AtlasRoutePanel
            activeRoute={activeRoute}
            routes={routes}
            onSelectRoute={r => { setActiveRoute(r); setShowRoutes(true) }}
            onAccept={handleFollowRoute}
            onDismiss={() => setShowRoutes(false)}
            visible={showRoutes && !activeOp && !showSimulator}
          />
        )
      })()}

      {/* Portfolio Evolution — Screen 9 */}
      {(() => {
        const routes = portfolio ? generateRoutes(portfolio, liveAPY) : []
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
            setAllocationAmount(500); setShowAllocation(true)
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
          walletAddress={address}
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
              <AtlasLogo width={120} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atlas Navigator */}
      <div className="absolute bottom-8 left-6 z-10">
        <AtlasNavigator
          context={navigatorCtx}
          visible={phase !== 'landing' && !showScan}
          onExplore={() => setShowRoutes(true)}
        />
      </div>

    </div>
  )
}
