'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { DistrictIsland } from './DistrictIsland'
import { AtmosphereParticles } from './AtmosphereParticles'
import { CameraController } from './CameraController'
import { UserIslandMesh } from './UserIslandMesh'
import { OpportunityNode } from './OpportunityNode'
import { RoutePathMesh } from './RoutePathMesh'
import { DISTRICTS } from '@/lib/districts'
import { District, Opportunity, UserIsland, AtlasRoute } from '@/types/atlas'
import * as THREE from 'three'

interface Props {
  onDistrictClick: (district: District) => void
  onIslandClick: () => void
  onOpportunityClick: (op: Opportunity) => void
  highlightedDistrict: string | null
  selectedOpportunity: Opportunity | null
  autoRotate: boolean
  cameraTarget: THREE.Vector3
  cameraDistance: number
  portfolio: UserIsland | null
  allocationCount: number
  activeDistrict: District | null
  activeRoute: AtlasRoute | null
  liveAPY?: Record<string, number>
}

// Map district ID → vault IDs to pull live APY from
const DISTRICT_VAULTS: Record<string, string[]> = {
  income:   ['usdy', 'musd'],
  staking:  ['meth'],
  growth:   [],
  treasury: [],
  emerging: [],
  safety:   ['usdy'],
}

function getDistrictApy(districtId: string, liveAPY: Record<string, number>, opportunities: { apy: number }[]): number {
  const vaults = DISTRICT_VAULTS[districtId] ?? []
  const liveValues = vaults.map(v => liveAPY[v]).filter(Boolean) as number[]
  if (liveValues.length) return Math.max(...liveValues)
  // Fallback: max APY from district opportunities
  const opApys = opportunities.map(o => o.apy)
  return opApys.length ? Math.max(...opApys) : 0
}

function getOpportunityPositions(
  districtPos: [number, number, number],
  count: number
): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const r = 2.2
    return [
      districtPos[0] + Math.sin(angle) * r,
      districtPos[1] + 1.2,
      districtPos[2] + Math.cos(angle) * r,
    ]
  })
}

export function AtlasWorldScene({
  onDistrictClick, onIslandClick, onOpportunityClick,
  highlightedDistrict, selectedOpportunity, autoRotate,
  cameraTarget, cameraDistance, portfolio, allocationCount,
  activeDistrict, activeRoute, liveAPY = {},
}: Props) {
  return (
    <Canvas
      camera={{ fov: 48, near: 0.1, far: 200, position: [0, 10, 15] }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', background: '#020c1a' }}
    >
      <CameraController target={cameraTarget} distance={cameraDistance} autoRotate={autoRotate} />

      {/* Ambient base */}
      <ambientLight intensity={0.22} />
      {/* Key top light — bluish overhead */}
      <directionalLight position={[6, 18, 8]}  intensity={0.55} color="#90b8f0" castShadow />
      {/* Rim light from front-below — lights up side walls and terrain underside */}
      <pointLight position={[0, -0.5, 8]}  intensity={2.4} color="#0d3070" distance={28} decay={2} />
      {/* Under-glow — colors side walls */}
      <pointLight position={[0, -2, 0]}    intensity={2.0} color="#0a2468" distance={30} decay={2} />
      {/* District accent lights */}
      <pointLight position={[-5, 5, -3]}   intensity={0.7} color="#34D186" distance={14} decay={2} />
      <pointLight position={[ 5, 5, -3]}   intensity={0.7} color="#3B82F6" distance={14} decay={2} />
      <pointLight position={[ 0, 5,  5]}   intensity={0.6} color="#A855F7" distance={12} decay={2} />
      <pointLight position={[-5, 5,  4]}   intensity={0.5} color="#F59E0B" distance={12} decay={2} />
      <pointLight position={[ 5, 5,  4]}   intensity={0.5} color="#F97316" distance={12} decay={2} />
      <pointLight position={[ 0, 5, -6]}   intensity={0.5} color="#06B6D4" distance={12} decay={2} />

      <Suspense fallback={null}>
        <Stars radius={100} depth={60} count={5000} factor={4} saturation={0.1} fade speed={0.25} />
        <AtmosphereParticles />

        {/* Separate floating district islands */}
        {DISTRICTS.map(district => (
          <DistrictIsland
            key={district.id}
            district={district}
            onClick={onDistrictClick}
            highlighted={highlightedDistrict === district.id}
            liveApy={getDistrictApy(district.id, liveAPY, district.opportunities)}
          />
        ))}

        {activeDistrict && activeDistrict.opportunities.length > 0 && (() => {
          const positions = getOpportunityPositions(activeDistrict.position, activeDistrict.opportunities.length)
          return activeDistrict.opportunities.map((op, i) => (
            <OpportunityNode key={op.id} opportunity={op} position={positions[i]}
              color={activeDistrict.color} onClick={onOpportunityClick}
              selected={selectedOpportunity?.id === op.id} />
          ))
        })()}

        {portfolio && (
          <UserIslandMesh portfolio={portfolio} allocationCount={allocationCount} onClick={onIslandClick} />
        )}

        <RoutePathMesh route={activeRoute} />

        {/* Dark void floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} receiveShadow>
          <planeGeometry args={[160, 160]} />
          <meshStandardMaterial color="#010810" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Fine grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.58, 0]}>
          <planeGeometry args={[100, 100, 50, 50]} />
          <meshBasicMaterial color="#1a3a6a" transparent opacity={0.04} wireframe />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.57, 0]}>
          <planeGeometry args={[100, 100, 12, 12]} />
          <meshBasicMaterial color="#2a5a9a" transparent opacity={0.02} wireframe />
        </mesh>
      </Suspense>

      <fog attach="fog" args={['#020c1a', 22, 50]} />
    </Canvas>
  )
}
