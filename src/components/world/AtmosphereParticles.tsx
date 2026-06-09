'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function AtmosphereParticles() {
  const outerRef = useRef<THREE.Points>(null)
  const innerRef = useRef<THREE.Points>(null)
  const driftRef = useRef<THREE.Points>(null)

  // Outer ring — slow, far, large
  const outer = useMemo(() => {
    const count = 1200
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#34D186'),
      new THREE.Color('#3B82F6'),
      new THREE.Color('#A855F7'),
      new THREE.Color('#F59E0B'),
      new THREE.Color('#ffffff'),
    ]
    for (let i = 0; i < count; i++) {
      const r     = 16 + Math.random() * 14
      const theta = Math.random() * Math.PI * 2
      const phi   = (Math.random() - 0.5) * Math.PI * 0.6
      positions[i * 3]     = r * Math.cos(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) + (Math.random() - 0.5) * 4
      positions[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta)
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])

  // Inner cloud — denser, closer, smaller
  const inner = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#34D186'),
      new THREE.Color('#3B82F6'),
      new THREE.Color('#A855F7'),
    ]
    for (let i = 0; i < count; i++) {
      const r     = 8 + Math.random() * 7
      const theta = Math.random() * Math.PI * 2
      positions[i * 3]     = r * Math.cos(theta)
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = r * Math.sin(theta)
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])

  // Drift particles — few large slow ones floating across
  const drift = useMemo(() => {
    const count = 120
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const palette = [new THREE.Color('#34D186'), new THREE.Color('#3B82F6')]
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])

  useFrame((_, delta) => {
    if (outerRef.current) outerRef.current.rotation.y += delta * 0.008
    if (innerRef.current) innerRef.current.rotation.y -= delta * 0.018
    if (driftRef.current) {
      driftRef.current.rotation.y += delta * 0.004
      driftRef.current.rotation.x += delta * 0.002
    }
  })

  return (
    <>
      {/* Outer slow ring */}
      <points ref={outerRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outer.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[outer.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} vertexColors transparent opacity={0.5} sizeAttenuation />
      </points>

      {/* Inner faster cloud */}
      <points ref={innerRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[inner.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[inner.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} vertexColors transparent opacity={0.65} sizeAttenuation />
      </points>

      {/* Large drifting particles */}
      <points ref={driftRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[drift.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[drift.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent opacity={0.25} sizeAttenuation />
      </points>
    </>
  )
}
