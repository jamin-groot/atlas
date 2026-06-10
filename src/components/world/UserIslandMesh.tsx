'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Torus } from '@react-three/drei'
import * as THREE from 'three'
import { UserIsland } from '@/types/atlas'
import { DISTRICT_COLORS } from '@/lib/mockPortfolio'

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

        {/* ── Island base — 3 layers ── */}
        <mesh position={[0, -0.32, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.7, 2.0, 0.28, 6]} />
          <meshStandardMaterial color="#0a1628" roughness={0.4} metalness={0.75}
            emissive="#112244" emissiveIntensity={0.08 + stage * 0.03} />
        </mesh>

        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[1.45, 1.65, 0.28, 6]} />
          <meshStandardMaterial color="#0d1e38" roughness={0.35} metalness={0.8}
            emissive="#1a3a6c" emissiveIntensity={0.1 + stage * 0.04} />
        </mesh>

        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[1.2, 1.4, 0.28, 6]} />
          <meshStandardMaterial color="#112040" roughness={0.28} metalness={0.85}
            emissive={hColor} emissiveIntensity={0.08 + stage * 0.05} />
        </mesh>

        {/* ── Allocation pillars ── */}
        {portfolio.allocation.map((alloc, i) => {
          const total = portfolio.allocation.length
          const angle = (i / total) * Math.PI * 2
          const c = new THREE.Color(DISTRICT_COLORS[alloc.district] ?? '#ffffff')
          const h = Math.min(0.55, Math.max(0.08, alloc.percentage / 100 * 0.6))
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

        {/* ── Orbit rings ── */}
        <Torus ref={ring1Ref} args={[1.15, 0.022, 8, 80]} position={[0, 0.85, 0]} rotation={[Math.PI / 3, 0, 0]}>
          <meshStandardMaterial color={hColor} emissive={hColor} emissiveIntensity={1.0} transparent opacity={0.55} />
        </Torus>

        {stage >= 1 && (
          <Torus ref={ring2Ref} args={[1.5, 0.014, 8, 80]} position={[0, 0.85, 0]} rotation={[Math.PI / 4.5, Math.PI / 4, 0]}>
            <meshStandardMaterial color={hColor} emissive={hColor} emissiveIntensity={0.7} transparent opacity={0.35} />
          </Torus>
        )}

        {stage >= 2 && (
          <Torus ref={ring3Ref} args={[1.85, 0.01, 8, 80]} position={[0, 0.85, 0]} rotation={[Math.PI / 2.2, Math.PI / 5, 0]}>
            <meshStandardMaterial color={hColor} emissive={hColor} emissiveIntensity={0.5} transparent opacity={0.22} />
          </Torus>
        )}

        {/* ── Glow pool ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
          <circleGeometry args={[2.8 + stage * 0.35, 48]} />
          <meshBasicMaterial color={hColor} transparent opacity={0.045 + stage * 0.012} />
        </mesh>

        {/* Reflection shimmer */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
          <ringGeometry args={[1.0, 2.6, 48]} />
          <meshBasicMaterial color={hColor} transparent opacity={0.025 + stage * 0.008} />
        </mesh>

      </group>
    </Float>
  )
}
