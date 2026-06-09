'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface Props {
  target: THREE.Vector3
  distance: number
  autoRotate: boolean
}

export function CameraController({ target, distance, autoRotate }: Props) {
  const controlsRef   = useRef<OrbitControlsImpl>(null)
  const targetDistRef = useRef(distance)
  const targetRef     = useRef(target.clone())
  const { camera }    = useThree()

  // Set initial camera position on mount
  useEffect(() => {
    camera.position.set(0, distance * 0.65, distance)
    camera.lookAt(target)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track latest desired values in refs (avoids stale closure in useFrame)
  useEffect(() => { targetDistRef.current = distance }, [distance])
  useEffect(() => { targetRef.current = target.clone() }, [target])

  useFrame(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return

    // ── 1. Smoothly pan the look-at target ──
    ctrl.target.lerp(targetRef.current, 0.055)

    // ── 2. Smoothly zoom: preserve camera angle, change radius ──
    const offset      = camera.position.clone().sub(ctrl.target)
    const currentDist = offset.length()
    const wantedDist  = targetDistRef.current

    if (Math.abs(currentDist - wantedDist) > 0.005) {
      const newDist = THREE.MathUtils.lerp(currentDist, wantedDist, 0.055)
      // Scale the offset vector to the new distance
      camera.position.copy(ctrl.target).addScaledVector(offset.normalize(), newDist)
    }

    ctrl.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enableDamping={false}   // we handle smoothing in useFrame ourselves
      enableZoom
      zoomSpeed={0.8}
      minDistance={4}
      maxDistance={28}
      enablePan={false}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={Math.PI / 8}
    />
  )
}
