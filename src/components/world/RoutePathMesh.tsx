'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AtlasRoute } from '@/types/atlas'
import { DISTRICTS } from '@/lib/districts'

interface Props {
  route: AtlasRoute | null
}

const PACKET_COUNT = 5
const PACKET_OFFSETS = Array.from({ length: PACKET_COUNT }, (_, i) => i / PACKET_COUNT)

export function RoutePathMesh({ route }: Props) {
  const lineRef    = useRef<THREE.Line | null>(null)
  const packetRefs = useRef<(THREE.Mesh | null)[]>([])
  const [progress, setProgress] = useState(0)
  const packetProgress = useRef<number[]>(PACKET_OFFSETS.map(o => o))

  const district = route ? DISTRICTS.find(d => d.id === route.to.district) : null
  const color = district ? new THREE.Color(district.color) : new THREE.Color('#34D186')

  const { curve, points } = useMemo(() => {
    if (!district) return { curve: null, points: [] }
    const start = new THREE.Vector3(0, 0.8, 0)
    const end   = new THREE.Vector3(...district.position).add(new THREE.Vector3(0, 1.2, 0))
    const mid   = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 4.5, 0))
    const curve = new THREE.CatmullRomCurve3([start, mid, end])
    return { curve, points: curve.getPoints(120) }
  }, [district])

  useEffect(() => { setProgress(0); packetProgress.current = PACKET_OFFSETS.map(o => o) }, [route?.id])

  useFrame((_, delta) => {
    if (!route || !curve || !lineRef.current) return

    // Animate draw-in
    setProgress(prev => {
      const next = Math.min(prev + delta * 0.6, 1)
      const count = Math.floor(next * points.length)
      const visible = points.slice(0, Math.max(count, 2))
      const geo = new THREE.BufferGeometry().setFromPoints(visible)
      ;(lineRef.current as THREE.Line).geometry.dispose()
      ;(lineRef.current as THREE.Line).geometry = geo
      return next
    })

    // Animate data packets along the route
    PACKET_OFFSETS.forEach((_, i) => {
      packetProgress.current[i] = (packetProgress.current[i] + delta * 0.45) % 1
      const mesh = packetRefs.current[i]
      if (mesh && curve) {
        const t = packetProgress.current[i]
        // Only show packets that are within drawn progress
        if (t <= progress) {
          const pt = curve.getPoint(t)
          mesh.position.copy(pt)
          const mat = mesh.material as THREE.MeshStandardMaterial
          // Fade in/out at ends
          mat.opacity = t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1.0
          mat.visible = true
        } else {
          ;(mesh.material as THREE.MeshStandardMaterial).visible = false
        }
      }
    })
  })

  if (!route || !district || !curve) return null

  const startGeo = new THREE.BufferGeometry().setFromPoints(points.slice(0, 2))

  return (
    <group>
      {/* Outer glow tube */}
      {progress > 0.04 && (
        <mesh>
          <tubeGeometry args={[curve, 80, 0.06, 6, false]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
      )}

      {/* Core beam */}
      {progress > 0.04 && (
        <mesh>
          <tubeGeometry args={[curve, 80, 0.02, 5, false]} />
          <meshBasicMaterial color={color} transparent opacity={0.65} />
        </mesh>
      )}

      {/* Animated draw line */}
      <primitive object={(() => {
        const mat = new THREE.LineBasicMaterial({ color, linewidth: 1 })
        const l = new THREE.Line(startGeo, mat)
        lineRef.current = l
        return l
      })()} />

      {/* Data packet spheres */}
      {PACKET_OFFSETS.map((_, i) => (
        <mesh key={i} ref={el => { packetRefs.current[i] = el }}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial
            color={color} emissive={color}
            emissiveIntensity={2.5} transparent opacity={1}
          />
        </mesh>
      ))}

      {/* Small trailing sparks on each packet */}
      {PACKET_OFFSETS.map((_, i) => (
        <mesh key={`spark-${i}`} ref={null}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Destination ring — pulses in when route lands */}
      {progress > 0.88 && (
        <DestinationRing
          position={new THREE.Vector3(...district.position).add(new THREE.Vector3(0, 0.7, 0))}
          color={color}
        />
      )}
    </group>
  )
}

function DestinationRing({ position, color }: { position: THREE.Vector3; color: THREE.Color }) {
  const innerRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (innerRef.current) {
      const s = 1 + Math.sin(t * 2.5) * 0.08
      innerRef.current.scale.set(s, s, s)
    }
    if (outerRef.current) {
      const s = 1 + Math.sin(t * 1.8 + 1) * 0.12
      outerRef.current.scale.set(s, s, s)
      const m = outerRef.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.2 + Math.sin(t * 2) * 0.12
    }
  })

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={innerRef}>
        <ringGeometry args={[0.55, 0.68, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={outerRef}>
        <ringGeometry args={[0.8, 0.88, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
