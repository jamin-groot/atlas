'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Torus } from '@react-three/drei'
import * as THREE from 'three'
import { UserIsland } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'
import { getIslandTier } from '@/lib/islandTier'
import { getUnlockedMilestones } from '@/lib/islandMilestones'

interface Props {
  portfolio: UserIsland
  allocationCount: number
  onClick: () => void
}

export function UserIslandMesh({ portfolio, allocationCount, onClick }: Props) {
  const ring1Ref  = useRef<THREE.Mesh>(null)
  const ring2Ref  = useRef<THREE.Mesh>(null)
  const ring3Ref  = useRef<THREE.Mesh>(null)
  const coreRef   = useRef<THREE.Mesh>(null)
  const beam1Ref  = useRef<THREE.Mesh>(null)
  const hovered   = useRef(false)

  const health = portfolio.healthScore
  const healthColor = health >= 80 ? '#34D186' : health >= 60 ? '#F59E0B' : health >= 40 ? '#3B82F6' : '#EF4444'
  const hColor = new THREE.Color(healthColor)

  const stage = Math.min(allocationCount, 4)

  // TVL-based island tier
  const tier = useMemo(() => getIslandTier(portfolio.totalValue), [portfolio.totalValue])
  const tierColor = useMemo(() => new THREE.Color(tier.color), [tier.color])
  const s = tier.scale  // base scale for all geometry

  // Yield-based milestone buildings
  const milestones = useMemo(() => getUnlockedMilestones(portfolio), [portfolio])
  const hasId = (id: string) => milestones.some(m => m.id === id)

  const extraCrystals = useMemo(() => {
    return portfolio.allocation
      .filter(a => a.percentage > 5)
      .slice(0, Math.max(stage, portfolio.allocation.length))
      .map((alloc, i) => {
        const angle = (i / Math.max(portfolio.allocation.length, 1)) * Math.PI * 2 + Math.PI / 4
        const r = 0.85
        const color = DISTRICT_COLORS[alloc.district] ?? '#ffffff'
        return {
          x: Math.sin(angle) * r,
          z: Math.cos(angle) * r,
          color,
          scale: 0.18 + (alloc.percentage / 100) * 0.35,
          height: 0.4 + (alloc.percentage / 100) * 0.4,
        }
      })
  }, [portfolio.allocation, stage])

  // Energy beam particles (small spheres rising upward)
  const beamParticles = useMemo(() => (
    Array.from({ length: 8 }, (_, i) => ({
      offset: (i / 8),
      speed: 0.8 + Math.random() * 0.6,
      size: 0.03 + Math.random() * 0.03,
    }))
  ), [])

  const beamRefs = useRef<(THREE.Mesh | null)[]>([])
  const beamProgress = useRef<number[]>(beamParticles.map(p => p.offset))

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.28
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.18
    if (ring3Ref.current) ring3Ref.current.rotation.x += delta * 0.12
    if (coreRef.current)  coreRef.current.rotation.y  += delta * 0.55

    // Animate energy beam particles rising upward
    beamParticles.forEach((p, i) => {
      beamProgress.current[i] = (beamProgress.current[i] + delta * p.speed * 0.25) % 1
      const mesh = beamRefs.current[i]
      if (mesh) {
        const t = beamProgress.current[i]
        mesh.position.y = 0.7 + t * 2.5
        mesh.position.x = Math.sin(t * Math.PI * 4 + i) * 0.08
        mesh.position.z = Math.cos(t * Math.PI * 4 + i) * 0.08
        const m = mesh.material as THREE.MeshBasicMaterial
        m.opacity = t < 0.15 ? t / 0.15 * 0.7 : t > 0.75 ? (1 - t) / 0.25 * 0.7 : 0.7
      }
    })
  })

  return (
    <Float speed={0.7} rotationIntensity={0.03} floatIntensity={0.28}>
      <group
        position={[0, 0.4, 0]}
        onClick={onClick}
        onPointerEnter={() => { hovered.current = true; document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { hovered.current = false; document.body.style.cursor = 'auto' }}
      >

        {/* ── Island base — layers unlock with tier ── */}
        {/* Layer 1 — always present */}
        <mesh position={[0, -0.32, 0]} castShadow receiveShadow scale={[s, 1, s]}>
          <cylinderGeometry args={[1.7, 2.0, 0.28, 6]} />
          <meshStandardMaterial color="#0a1628" roughness={0.4} metalness={0.75}
            emissive={tierColor} emissiveIntensity={0.06 + stage * 0.02} />
        </mesh>

        {/* Layer 2 — unlocked at tier 1+ */}
        {tier.layers >= 2 && (
          <mesh position={[0, -0.08, 0]} castShadow scale={[s, 1, s]}>
            <cylinderGeometry args={[1.45, 1.65, 0.28, 6]} />
            <meshStandardMaterial color="#0d1e38" roughness={0.35} metalness={0.8}
              emissive={tierColor} emissiveIntensity={0.1 + stage * 0.04} />
          </mesh>
        )}

        {/* Layer 3 — unlocked at tier 3+ */}
        {tier.layers >= 3 && (
          <mesh position={[0, 0.18, 0]} castShadow scale={[s, 1, s]}>
            <cylinderGeometry args={[1.2, 1.4, 0.28, 6]} />
            <meshStandardMaterial color="#112040" roughness={0.28} metalness={0.85}
              emissive={hColor} emissiveIntensity={0.08 + stage * 0.05} />
          </mesh>
        )}

        {/* Layer 4 — unlocked at tier 5 (Metropolis) */}
        {tier.layers >= 4 && (
          <mesh position={[0, 0.44, 0]} castShadow scale={[s * 0.8, 1, s * 0.8]}>
            <cylinderGeometry args={[0.95, 1.15, 0.28, 6]} />
            <meshStandardMaterial color="#1a2a50" roughness={0.22} metalness={0.9}
              emissive={hColor} emissiveIntensity={0.14 + stage * 0.06} />
          </mesh>
        )}

        {/* ── Tier glow rim — shows tier color on island edge ── */}
        <mesh position={[0, tier.layers >= 2 ? -0.08 : -0.32, 0]} scale={[s, 1, s]}>
          <cylinderGeometry args={[1.66 * s, 1.66 * s, 0.015, 64]} />
          <meshBasicMaterial color={tierColor} transparent opacity={0.5 + tier.tier * 0.08} />
        </mesh>

        {/* ── Allocation pillars ── */}
        {portfolio.allocation.map((alloc, i) => {
          const total = portfolio.allocation.length
          const angle = (i / total) * Math.PI * 2
          const c = new THREE.Color(DISTRICT_COLORS[alloc.district] ?? '#ffffff')
          const h = Math.max(0.08, alloc.percentage / 20)
          return (
            <group key={alloc.district} position={[Math.sin(angle) * 1.25, 0.32, Math.cos(angle) * 1.25]}>
              <mesh>
                <cylinderGeometry args={[0.12, 0.16, h, 6]} />
                <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.8} transparent opacity={0.9} />
              </mesh>
              {/* Pillar cap glow */}
              <mesh position={[0, h / 2, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color={c} transparent opacity={0.6} />
              </mesh>
            </group>
          )
        })}

        {/* ── Beacon tower — unlocked at tier 2 (Outpost) ── */}
        {tier.hasBeacon && (
          <group position={[0, tier.layers >= 2 ? 0.5 : 0.22, 0]}>
            {/* Tower shaft */}
            <mesh>
              <cylinderGeometry args={[0.045, 0.09, 1.2 + tier.tier * 0.18, 8]} />
              <meshStandardMaterial color={tier.color} emissive={tierColor}
                emissiveIntensity={0.9} roughness={0.1} metalness={0.95} />
            </mesh>
            {/* Beacon orb */}
            <mesh position={[0, 0.7 + tier.tier * 0.09, 0]}>
              <sphereGeometry args={[0.11 + tier.tier * 0.015, 12, 12]} />
              <meshBasicMaterial color={tier.color} transparent opacity={0.95} />
            </mesh>
            {/* Beacon glow */}
            <mesh position={[0, 0.7 + tier.tier * 0.09, 0]}>
              <sphereGeometry args={[0.22 + tier.tier * 0.03, 10, 10]} />
              <meshBasicMaterial color={tier.color} transparent opacity={0.12 + tier.tier * 0.04} />
            </mesh>
          </group>
        )}

        {/* ── Bridge arches — unlocked at tier 3 (Colony) ── */}
        {tier.hasBridge && [0, 1, 2].map(i => {
          const angle = (i / 3) * Math.PI * 2
          const r = 0.95 * s
          return (
            <group key={i} position={[Math.sin(angle) * r, tier.layers >= 3 ? 0.32 : 0.18, Math.cos(angle) * r]}
              rotation={[0, angle, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.28, 0.018, 6, 20, Math.PI]} />
                <meshStandardMaterial color={tier.color} emissive={tierColor}
                  emissiveIntensity={0.7} roughness={0.15} metalness={0.9} transparent opacity={0.85} />
              </mesh>
            </group>
          )
        })}

        {/* ── City spires — unlocked at tier 4 (City) ── */}
        {tier.hasCity && [0, 1, 2, 3, 4].map(i => {
          const angle = (i / 5) * Math.PI * 2 + Math.PI / 10
          const r = 0.7 * s
          const h = 0.35 + (i % 3) * 0.22
          const c = [
            DISTRICT_COLORS['income'], DISTRICT_COLORS['staking'],
            DISTRICT_COLORS['growth'], DISTRICT_COLORS['emerging'],
            tier.color
          ][i] ?? tier.color
          return (
            <group key={i} position={[Math.sin(angle) * r, tier.layers >= 3 ? 0.46 : 0.32, Math.cos(angle) * r]}>
              {/* Building body */}
              <mesh>
                <boxGeometry args={[0.1, h, 0.1]} />
                <meshStandardMaterial color="#0d1e38" emissive={c}
                  emissiveIntensity={0.6} roughness={0.2} metalness={0.85} />
              </mesh>
              {/* Roof spire */}
              <mesh position={[0, h / 2 + 0.06, 0]}>
                <coneGeometry args={[0.06, 0.14, 6]} />
                <meshBasicMaterial color={c} transparent opacity={0.9} />
              </mesh>
            </group>
          )
        })}

        {/* ── Core crystal ── */}
        {/* Base of crystal */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.08, 0.28, 0.45, 6]} />
          <meshStandardMaterial color={hColor} emissive={hColor}
            emissiveIntensity={0.5 + stage * 0.08} roughness={0.15} metalness={0.85}
            transparent opacity={0.95} />
        </mesh>

        {/* Main crystal */}
        <mesh ref={coreRef} position={[0, 1.02, 0]} scale={1 + stage * 0.07}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={hColor} emissive={hColor}
            emissiveIntensity={0.7 + stage * 0.12}
            roughness={0.08} metalness={0.75} transparent opacity={0.92}
          />
        </mesh>

        {/* Crystal glow halo */}
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.72, 16, 16]} />
          <meshBasicMaterial color={hColor} transparent opacity={0.06 + stage * 0.015} />
        </mesh>

        {/* ── Energy beam particles rising upward ── */}
        {stage >= 1 && beamParticles.map((p, i) => (
          <mesh
            key={i}
            ref={el => { beamRefs.current[i] = el }}
          >
            <sphereGeometry args={[p.size, 6, 6]} />
            <meshBasicMaterial color={hColor} transparent opacity={0.7} />
          </mesh>
        ))}

        {/* ── Satellite crystals from allocations ── */}
        {extraCrystals.map((c, i) => (
          <group key={i} position={[c.x, 0.38 + c.height / 2, c.z]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.1, c.height * 0.6, 5]} />
              <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={0.6} transparent opacity={0.8} />
            </mesh>
            <mesh position={[0, c.height * 0.35, 0]} scale={c.scale}>
              <octahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color={c.color} emissive={c.color}
                emissiveIntensity={0.9} roughness={0.08} metalness={0.8} transparent opacity={0.85} />
            </mesh>
          </group>
        ))}

        {/* ── Orbit rings — count from tier ── */}
        <Torus ref={ring1Ref} args={[1.15 * s, 0.022, 8, 80]} position={[0, 0.85, 0]} rotation={[Math.PI / 3, 0, 0]}>
          <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.0} transparent opacity={0.55} />
        </Torus>

        {tier.rings >= 2 && (
          <Torus ref={ring2Ref} args={[1.5 * s, 0.014, 8, 80]} position={[0, 0.85, 0]} rotation={[Math.PI / 4.5, Math.PI / 4, 0]}>
            <meshStandardMaterial color={hColor} emissive={hColor} emissiveIntensity={0.7} transparent opacity={0.35} />
          </Torus>
        )}

        {tier.rings >= 3 && (
          <Torus ref={ring3Ref} args={[1.85 * s, 0.01, 8, 80]} position={[0, 0.85, 0]} rotation={[Math.PI / 2.2, Math.PI / 5, 0]}>
            <meshStandardMaterial color={hColor} emissive={hColor} emissiveIntensity={0.5} transparent opacity={0.22} />
          </Torus>
        )}

        {/* ── Glow pool — grows with tier ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
          <circleGeometry args={[(2.8 + stage * 0.35) * s, 48]} />
          <meshBasicMaterial color={tierColor} transparent opacity={0.04 + tier.tier * 0.014} />
        </mesh>

        {/* Reflection shimmer */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
          <ringGeometry args={[1.0 * s, 2.6 * s, 48]} />
          <meshBasicMaterial color={hColor} transparent opacity={0.025 + stage * 0.008} />
        </mesh>

        {/* ── MILESTONE BUILDINGS ────────────────────────────────────────── */}

        {/* Fountain — first_yield: central glowing pool */}
        {hasId('first_yield') && (
          <group position={[0, tier.layers >= 2 ? 0.32 : 0.22, 0]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.22, 0.06, 16]} />
              <meshStandardMaterial color="#0d2a40" emissive="#34D186" emissiveIntensity={0.7} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color="#34D186" transparent opacity={0.9} />
            </mesh>
            {/* Water ripple ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.12, 0.22, 24]} />
              <meshBasicMaterial color="#34D186" transparent opacity={0.25} />
            </mesh>
          </group>
        )}

        {/* Trading post — ten_earned: small market stall at island edge */}
        {hasId('ten_earned') && (
          <group position={[-1.0 * s, tier.layers >= 2 ? 0.32 : 0.22, 0.2 * s]}>
            <mesh>
              <boxGeometry args={[0.22, 0.18, 0.18]} />
              <meshStandardMaterial color="#0d1e38" emissive="#3B82F6" emissiveIntensity={0.5} metalness={0.8} />
            </mesh>
            {/* Awning */}
            <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 12, 0, 0]}>
              <boxGeometry args={[0.28, 0.03, 0.22]} />
              <meshBasicMaterial color="#3B82F6" transparent opacity={0.75} />
            </mesh>
          </group>
        )}

        {/* Fortress walls — healthy: perimeter ring of low wall segments */}
        {hasId('healthy') && [0, 1, 2, 3, 4, 5].map(i => {
          const angle = (i / 6) * Math.PI * 2
          const r = 1.5 * s
          return (
            <group key={i}
              position={[Math.sin(angle) * r, tier.layers >= 2 ? 0.28 : 0.18, Math.cos(angle) * r]}
              rotation={[0, -angle, 0]}>
              <mesh>
                <boxGeometry args={[0.38, 0.14, 0.08]} />
                <meshStandardMaterial color="#1a2a50" emissive="#F59E0B"
                  emissiveIntensity={0.45} metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Battlement top */}
              {[-.1, .1].map((ox, j) => (
                <mesh key={j} position={[ox, 0.1, 0]}>
                  <boxGeometry args={[0.1, 0.1, 0.09]} />
                  <meshBasicMaterial color="#F59E0B" transparent opacity={0.6} />
                </mesh>
              ))}
            </group>
          )
        })}

        {/* Yield garden — hundred_earned: glowing plant clusters */}
        {hasId('hundred_earned') && [0, 1, 2].map(i => {
          const angle = (i / 3) * Math.PI * 2 + Math.PI / 6
          const r = 0.6 * s
          return (
            <group key={i}
              position={[Math.sin(angle) * r, tier.layers >= 2 ? 0.38 : 0.25, Math.cos(angle) * r]}>
              {[0, 1, 2].map(j => (
                <mesh key={j}
                  position={[(j - 1) * 0.07, j * 0.06, (j % 2) * 0.05]}>
                  <coneGeometry args={[0.03, 0.12 + j * 0.04, 5]} />
                  <meshBasicMaterial color="#34D186" transparent opacity={0.8} />
                </mesh>
              ))}
            </group>
          )
        })}

        {/* Observatory dome — monthly_income ($50/mo) */}
        {hasId('monthly_income') && (
          <group position={[0.85 * s, tier.layers >= 3 ? 0.46 : 0.32, -0.6 * s]}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.16, 0.1, 12]} />
              <meshStandardMaterial color="#0a1628" emissive="#06B6D4" emissiveIntensity={0.5} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.13, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#06B6D4" emissive="#06B6D4"
                emissiveIntensity={0.7} transparent opacity={0.7} metalness={0.6} />
            </mesh>
            {/* Dome glow */}
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.18, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#06B6D4" transparent opacity={0.1} />
            </mesh>
          </group>
        )}

        {/* Network hub — full_spread (3+ districts): central glowing ring tower */}
        {hasId('full_spread') && (
          <group position={[-0.7 * s, tier.layers >= 3 ? 0.46 : 0.32, 0.7 * s]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.1, 0.45, 8]} />
              <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={0.8} metalness={0.95} />
            </mesh>
            <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16, 0.018, 6, 20]} />
              <meshBasicMaterial color="#EC4899" transparent opacity={0.85} />
            </mesh>
          </group>
        )}

        {/* Atlas Temple — five_hundred_earned: grand columned structure */}
        {hasId('five_hundred_earned') && (
          <group position={[0.3 * s, tier.layers >= 3 ? 0.5 : 0.35, -1.0 * s]}>
            {/* Temple base */}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.38, 0.06, 0.28]} />
              <meshStandardMaterial color="#1a1a40" emissive="#F97316" emissiveIntensity={0.35} metalness={0.9} />
            </mesh>
            {/* Columns */}
            {[-0.12, 0.12].map((ox, i) => (
              <mesh key={i} position={[ox, 0.12, 0]}>
                <cylinderGeometry args={[0.025, 0.03, 0.3, 8]} />
                <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.6} metalness={0.85} />
              </mesh>
            ))}
            {/* Roof */}
            <mesh position={[0, 0.3, 0]}>
              <coneGeometry args={[0.2, 0.14, 4]} />
              <meshBasicMaterial color="#F97316" transparent opacity={0.85} />
            </mesh>
          </group>
        )}

      </group>
    </Float>
  )
}
