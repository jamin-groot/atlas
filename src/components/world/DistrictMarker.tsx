'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { District } from '@/types/atlas'

interface Props {
  district: District
  onClick: (district: District) => void
  highlighted: boolean
}

function PulseRing({ color, offset, speed, active }: {
  color: THREE.Color; offset: number; speed: number; active: boolean
}) {
  const ref   = useRef<THREE.Mesh>(null)
  const phase = useRef(offset)

  useFrame((_, delta) => {
    phase.current = (phase.current + delta * speed) % 1
    if (!ref.current) return
    const t = phase.current
    const s = 0.08 + t * 1.8
    ref.current.scale.set(s, 1, s)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = active ? (1 - t) * 0.65 : (1 - t) * 0.28
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.25, 0.32, 40]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function DistrictMarker({ district, onClick, highlighted }: Props) {
  const [hovered, setHovered] = useState(false)
  const beaconRef = useRef<THREE.Mesh>(null)
  const dotRef    = useRef<THREE.Mesh>(null)

  const color  = useMemo(() => new THREE.Color(district.color), [district.color])
  const active = highlighted || hovered

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = active
        ? 2.2 + Math.sin(t * 4) * 0.5
        : 1.1 + Math.sin(t * 2.5) * 0.3
    }
    if (dotRef.current) {
      const mat = dotRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = active
        ? 0.25 + Math.sin(t * 3.5) * 0.1
        : 0.1 + Math.sin(t * 1.8) * 0.05
    }
  })

  return (
    <group
      position={[district.position[0], district.position[1] + 0.3, district.position[2]]}
      onClick={() => onClick(district)}
      onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      {/* Flat disc on terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[0.38, 40]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.18 : 0.08} />
      </mesh>

      {/* Disc border ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[0.34, 0.42, 40]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.75 : 0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Pulsing rings */}
      <PulseRing color={color} offset={0}    speed={0.9} active={active} />
      <PulseRing color={color} offset={0.33} speed={0.9} active={active} />
      <PulseRing color={color} offset={0.66} speed={0.9} active={active} />

      {/* Beacon orb */}
      <mesh ref={beaconRef} position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={1.4}
          roughness={0.05} metalness={0.8} transparent opacity={0.95}
        />
      </mesh>

      {/* Beacon glow halo */}
      <mesh ref={dotRef} position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>

      {/* Vertical beam upward */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.008, 0.025, 1.5, 5]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.35 : 0.12} />
      </mesh>

      {/* District label */}
      <Billboard position={[0, -0.38, 0]}>
        <Text
          fontSize={0.2}
          color={district.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {district.name.toUpperCase()}
        </Text>
      </Billboard>
    </group>
  )
}
