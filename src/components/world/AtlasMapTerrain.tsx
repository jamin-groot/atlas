'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Irregular landmass outline — organic blob containing all 6 district positions
const LANDMASS_POINTS: [number, number][] = [
  // Starting top-right, going clockwise
  [1.5, -6.2],
  [3.5, -5.8],
  [5.2, -4.8],
  [6.2, -3.2],
  [6.5, -1.2],
  [6.2,  0.8],
  [5.8,  2.4],
  [5.2,  4.2],
  [3.8,  5.4],
  [2.0,  5.8],
  [0.2,  5.4],
  [-1.5, 5.6],
  [-3.0, 5.2],
  [-5.0, 4.0],
  [-6.0, 2.2],
  [-6.5, 0.4],
  [-6.5, -1.5],
  [-6.0, -3.2],
  [-5.2, -4.8],
  [-3.5, -5.8],
  [-1.5, -6.5],
  [0.2,  -6.6],
]

// Internal district division lines (approximate sub-region borders)
const DIVISION_LINES: [number, number][][] = [
  // Vertical-ish center split
  [[0, -6.2], [-0.5, -3], [0.2, 0], [-0.3, 3], [0, 5.4]],
  // Horizontal splits
  [[-5.5, -1.2], [-2.5, -1.5], [0.2, -1.2], [3, -1.5], [5.8, -1.2]],
  [[-4.5, 2.2],  [-2, 2.0],    [0.5, 2.3],  [3.2, 2.0], [5.2, 2.4]],
]

export function AtlasMapTerrain() {
  const edgeGlowRef = useRef<THREE.Mesh>(null)

  // Build the main terrain shape (extruded polygon)
  const terrainGeo = useMemo(() => {
    const shape = new THREE.Shape()
    const pts = LANDMASS_POINTS
    shape.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], pts[i][1])
    }
    shape.closePath()

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 2,
    })
  }, [])

  // Edge glow — slightly larger outline shape, just a tube along the perimeter
  const edgePoints = useMemo(() => {
    return LANDMASS_POINTS.map(([x, y]) => new THREE.Vector3(x, 0.46, y))
      .concat([new THREE.Vector3(LANDMASS_POINTS[0][0], 0.46, LANDMASS_POINTS[0][1])])
  }, [])

  const edgeCurve = useMemo(() => new THREE.CatmullRomCurve3(edgePoints, true), [edgePoints])

  const edgeTubeGeo  = useMemo(() => new THREE.TubeGeometry(edgeCurve, 120, 0.06, 5, true), [edgeCurve])
  const edgeGlowGeo  = useMemo(() => new THREE.TubeGeometry(edgeCurve, 120, 0.18, 5, true), [edgeCurve])

  // Division lines geometry
  const divisionLines = useMemo(() => {
    return DIVISION_LINES.map(pts => {
      const verts = pts.map(([x, z]) => new THREE.Vector3(x, 0.5, z))
      return new THREE.BufferGeometry().setFromPoints(verts)
    })
  }, [])

  // Pulsing edge glow animation
  useFrame((state) => {
    if (edgeGlowRef.current) {
      const t = state.clock.elapsedTime
      const mat = edgeGlowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.08 + Math.sin(t * 1.2) * 0.04
    }
  })

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>

      {/* ── Main terrain body ── */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial
          color="#06142a"
          roughness={0.75}
          metalness={0.3}
          emissive="#0a2040"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Surface tint overlay — blue-ish holographic sheen */}
      <mesh geometry={terrainGeo}>
        <meshBasicMaterial
          color="#1a4a8a"
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* ── Bright neon edge tube ── */}
      <mesh geometry={edgeTubeGeo}>
        <meshBasicMaterial color="#34aaff" transparent opacity={0.95} />
      </mesh>

      {/* Outer glow halo around edge */}
      <mesh ref={edgeGlowRef} geometry={edgeGlowGeo}>
        <meshBasicMaterial color="#34aaff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Internal district boundary lines ── */}
      {divisionLines.map((geo, i) => (
        <primitive key={i} object={new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({ color: '#4a7aaa', transparent: true, opacity: 0.35 })
        )} />
      ))}

    </group>
  )
}
