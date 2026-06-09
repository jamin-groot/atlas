'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { Opportunity } from '@/types/atlas'

interface Props {
  opportunity: Opportunity
  position: [number, number, number]
  color: string
  onClick: (op: Opportunity) => void
  selected: boolean
}

export function OpportunityNode({ opportunity, position, color, onClick, selected }: Props) {
  const coreRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const active = selected || hovered

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.8
    }
  })

  const c = new THREE.Color(color)

  return (
    <Float speed={2} floatIntensity={0.4} rotationIntensity={0.05}>
      <group
        position={position}
        onClick={() => onClick(opportunity)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Connector line to ground */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>

        {/* Base pad */}
        <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.25 : 0.1} />
        </mesh>

        {/* Core gem */}
        <mesh ref={coreRef} scale={active ? 1.15 : 1}>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={active ? 1.0 : 0.5}
            roughness={0.05}
            metalness={0.8}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Outer glow shell */}
        <mesh scale={active ? 1.5 : 1.25}>
          <dodecahedronGeometry args={[0.28, 0]} />
          <meshBasicMaterial color={c} transparent opacity={active ? 0.12 : 0.05} />
        </mesh>

        {/* Billboard label */}
        <Billboard position={[0, 0.55, 0]}>
          <Text fontSize={0.16} color={color} anchorX="center" anchorY="middle">
            {opportunity.name}
          </Text>
          <Text fontSize={0.11} color="white" anchorX="center" anchorY="middle" position={[0, -0.2, 0]}>
            {opportunity.apy}% APY
          </Text>
        </Billboard>
      </group>
    </Float>
  )
}
