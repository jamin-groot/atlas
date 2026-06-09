'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { District } from '@/types/atlas'

interface Props {
  district: District
  onClick: (district: District) => void
  highlighted: boolean
  liveApy?: number
}

// ── Floating APY ticker above the spike ──────────────────────────────────────
function ApyTicker({ apy, color, active }: { apy: number; color: THREE.Color; active: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = 2.1 + Math.sin(t * 1.2) * 0.06
  })
  const hex = '#' + color.getHexString()
  return (
    <group ref={ref} position={[0, 2.1, 0]}>
      <Billboard>
        {/* Background pill */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.72, 0.22]} />
          <meshBasicMaterial color="#050d1a" transparent opacity={0.82} />
        </mesh>
        {/* Border pill */}
        <mesh position={[0, 0, -0.009]}>
          <planeGeometry args={[0.74, 0.24]} />
          <meshBasicMaterial color={hex} transparent opacity={active ? 0.45 : 0.2} />
        </mesh>
        {/* Pulsing dot */}
        <mesh position={[-0.28, 0, 0]}>
          <circleGeometry args={[0.035, 8]} />
          <meshBasicMaterial color={hex} transparent opacity={active ? 0.9 : 0.5} />
        </mesh>
        {/* APY text */}
        <Text
          position={[0.03, 0, 0.001]}
          fontSize={0.1}
          color={hex}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
        >
          {`${apy.toFixed(1)}% APY`}
        </Text>
      </Billboard>
      {/* Thin connector line down to spike */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 1.0, 4]} />
        <meshBasicMaterial color={hex} transparent opacity={active ? 0.3 : 0.1} />
      </mesh>
    </group>
  )
}

// ── Ring glow on top surface ──────────────────────────────────────────────────
function SurfaceRing({
  radius, color, active, speed = 1.0, phase = 0,
}: { radius: number; color: THREE.Color; active: boolean; speed?: number; phase?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * speed + phase
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = active
      ? 0.38 + Math.sin(t) * 0.15
      : 0.13 + Math.sin(t * 0.6) * 0.05
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.261, 0]}>
      <ringGeometry args={[radius - 0.04, radius, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Floating opportunity node ─────────────────────────────────────────────────
function OpportunityNode({
  name, apy, color, position, active, comingSoon,
}: {
  name: string
  apy: number
  color: THREE.Color
  position: [number, number, number]
  active: boolean
  comingSoon?: boolean
}) {
  const nodeRef = useRef<THREE.Mesh>(null)
  const lineRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (nodeRef.current) {
      const mat = nodeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = comingSoon
        ? 0.15 + Math.sin(t * 1.2 + position[0]) * 0.05
        : active
          ? 0.9 + Math.sin(t * 3 + position[0]) * 0.3
          : 0.5 + Math.sin(t * 2 + position[0]) * 0.2
    }
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = comingSoon ? 0.12 : active ? 0.55 : 0.28
    }
  })

  const lineHeight = position[1] - 0.13

  return (
    <group position={position}>
      {/* Connecting stalk */}
      <mesh ref={lineRef} position={[0, -lineHeight / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, lineHeight, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Hexagon node disc */}
      <mesh ref={nodeRef}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 6]} />
        <meshStandardMaterial
          color={comingSoon ? '#1a1a2e' : color}
          emissive={color}
          emissiveIntensity={comingSoon ? 0.15 : 0.6}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={comingSoon ? 0.5 : 1}
        />
      </mesh>

      {/* Node glow halo */}
      {!comingSoon && (
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.02, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
      )}

    </group>
  )
}

// ── Node positions per opportunity count ─────────────────────────────────────
function nodePositions(count: number): [number, number, number][] {
  if (count === 0) return []
  if (count === 1) return [[0.42, 1.15, 0.15]]
  if (count === 2) return [
    [-0.45, 1.35, 0.08],
    [ 0.52, 1.05, -0.08],
  ]
  if (count === 3) return [
    [-0.45, 1.45,  0.15],
    [ 0.52, 1.18, -0.08],
    [ 0.04, 0.92,  0.32],
  ]
  // 4+
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const r = 0.45 + (i % 2) * 0.15
    const h = 0.9 + i * 0.20
    return [Math.cos(angle) * r, h, Math.sin(angle) * r] as [number, number, number]
  })
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DistrictIsland({ district, onClick, highlighted, liveApy }: Props) {
  const [hovered, setHovered] = useState(false)
  const spikeRef   = useRef<THREE.Mesh>(null)
  const undergRef  = useRef<THREE.Mesh>(null)
  const discRef    = useRef<THREE.Mesh>(null)

  const color  = useMemo(() => new THREE.Color(district.color), [district.color])
  const active = highlighted || hovered

  const positions = useMemo(
    () => nodePositions(district.opportunities.length),
    [district.opportunities.length],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (spikeRef.current) {
      const mat = spikeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = active
        ? 1.4 + Math.sin(t * 4) * 0.4
        : 0.7 + Math.sin(t * 2.5) * 0.2
    }
    if (undergRef.current) {
      const mat = undergRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = active
        ? 0.22 + Math.sin(t * 1.8) * 0.06
        : 0.07 + Math.sin(t * 1.1) * 0.02
    }
    if (discRef.current) {
      const mat = discRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = active ? 0.12 : 0.04
    }
  })

  return (
    <Float speed={0.85} rotationIntensity={0.015} floatIntensity={0.3}>
      <group
        position={district.position}
        onClick={() => onClick(district)}
        onPointerEnter={() => { setHovered(true);  document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >

        {/* ── DISC BODY ── */}
        <mesh ref={discRef} position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.32, 1.12, 0.52, 64]} />
          <meshStandardMaterial
            color="#060c1c"
            emissive={color}
            emissiveIntensity={0.04}
            roughness={0.72}
            metalness={0.4}
          />
        </mesh>

        {/* Side wall — open cylinder for subtle inner glow on walls */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.26, 1.08, 0.50, 64, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.06 : 0.02} side={THREE.BackSide} />
        </mesh>

        {/* Top edge rim glow */}
        <mesh position={[0, 0.262, 0]}>
          <cylinderGeometry args={[1.34, 1.32, 0.01, 64]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.75 : 0.45} />
        </mesh>

        {/* Equatorial neon band — sells the depth */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.335, 1.335, 0.022, 64]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.55 : 0.25} />
        </mesh>

        {/* Bottom edge rim */}
        <mesh position={[0, -0.262, 0]}>
          <cylinderGeometry args={[1.14, 1.17, 0.01, 64]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.38 : 0.18} />
        </mesh>

        {/* ── CONCENTRIC SURFACE RINGS ── */}
        <SurfaceRing radius={0.35} color={color} active={active} speed={1.2} phase={0} />
        <SurfaceRing radius={0.70} color={color} active={active} speed={0.9} phase={1.2} />
        <SurfaceRing radius={1.05} color={color} active={active} speed={0.7} phase={2.5} />

        {/* ── CENTER SPIKE ── */}
        <group position={[0, 0.26, 0]}>
          {/* Spike shaft */}
          <mesh ref={spikeRef} position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.055, 0.62, 6]} />
            <meshStandardMaterial
              color={district.color}
              emissive={color}
              emissiveIntensity={0.8}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Spike orb tip */}
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.95} />
          </mesh>
          {/* Orb halo */}
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshBasicMaterial color={color} transparent opacity={active ? 0.22 : 0.08} />
          </mesh>
        </group>

        {/* ── UNDERSIDE GLOW ── */}
        <mesh ref={undergRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]}>
          <circleGeometry args={[1.9, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} />
        </mesh>

        {/* ── OPPORTUNITY NODES ── */}
        {district.opportunities.map((op, i) => (
          <OpportunityNode
            key={op.id}
            name={op.name}
            apy={op.apy}
            color={color}
            position={positions[i] ?? [0, 1.2 + i * 0.35, 0]}
            active={active}
            comingSoon={op.comingSoon}
          />
        ))}

        {/* ── APY TICKER ── */}
        {liveApy !== undefined && (
          <ApyTicker apy={liveApy} color={color} active={active} />
        )}

        {/* ── DISTRICT LABEL ── */}
        <Billboard position={[0, -0.62, 0]}>
          <Text
            fontSize={0.17}
            color={district.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000508"
          >
            {district.name.toUpperCase()}
          </Text>
        </Billboard>

      </group>
    </Float>
  )
}
