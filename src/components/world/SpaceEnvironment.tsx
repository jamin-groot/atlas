'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function TwinklingStars({ count = 10000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const baseOpacities = useRef<Float32Array>(null)

  const { positions, sizes, opacities, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const op = new Float32Array(count)
    const sp = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 60 + Math.random() * 80
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      sz[i] = 0.3 + Math.random() * 1.8
      op[i] = 0.3 + Math.random() * 0.7
      sp[i] = 0.3 + Math.random() * 2.5
    }
    return { positions: pos, sizes: sz, opacities: op, speeds: sp }
  }, [count])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const geo = ref.current.geometry
    const opAttr = geo.getAttribute('opacity') as THREE.BufferAttribute
    if (!baseOpacities.current) {
      baseOpacities.current = new Float32Array(opacities)
    }
    const t = clock.getElapsedTime()
    for (let i = 0; i < count; i++) {
      opAttr.array[i] = baseOpacities.current[i] * (0.5 + 0.5 * Math.sin(t * speeds[i] + i * 1.7))
    }
    opAttr.needsUpdate = true
  })

  const vertexShader = `
    attribute float size;
    attribute float opacity;
    varying float vOpacity;
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `
  const fragmentShader = `
    varying float vOpacity;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float glow = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(0.85, 0.9, 1.0, vOpacity * glow * glow);
    }
  `

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function NebulaSkybox() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.003
    }
  })

  const vertexShader = `
    varying vec3 vWorldPos;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vWorldPos = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    varying vec3 vWorldPos;
    varying vec2 vUv;

    // Pseudo-random hash
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Value noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Fractal brownian motion
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 dir = normalize(vWorldPos);

      // Spherical coordinates
      float theta = atan(dir.z, dir.x);
      float phi = asin(dir.y);

      // Milky Way band — concentrated along a tilted great circle
      float bandAngle = phi - 0.15 * sin(theta * 2.0 + 0.5);
      float band = exp(-bandAngle * bandAngle * 8.0);

      // Nebula detail within the band
      vec2 uv = vec2(theta * 2.0, phi * 4.0);
      float detail = fbm(uv * 3.0);
      float detail2 = fbm(uv * 6.0 + 10.0);

      // Core brightness
      float core = exp(-bandAngle * bandAngle * 30.0) * (0.6 + 0.4 * detail);

      // Cloud wisps
      float wisps = band * detail * 0.8;
      float darkLanes = smoothstep(0.35, 0.55, detail2) * band * 0.4;

      // Color mixing
      vec3 deepBlue = vec3(0.04, 0.08, 0.18);
      vec3 midBlue = vec3(0.08, 0.15, 0.35);
      vec3 brightBlue = vec3(0.15, 0.25, 0.55);
      vec3 coreWhite = vec3(0.3, 0.35, 0.5);
      vec3 purple = vec3(0.12, 0.06, 0.2);

      vec3 col = deepBlue;
      col = mix(col, midBlue, wisps);
      col = mix(col, brightBlue, core * 0.6);
      col = mix(col, coreWhite, core * core * 0.3);
      col = mix(col, purple, detail2 * band * 0.2);
      col -= darkLanes * vec3(0.03, 0.04, 0.06);

      // Scattered bright spots (dense star clusters)
      float clusters = pow(detail * detail2, 3.0) * band * 2.0;
      col += vec3(0.2, 0.25, 0.4) * clusters;

      // Overall opacity — keep most of the sphere very dark
      float alpha = max(band * 0.15 + core * 0.12 + wisps * 0.08, 0.0);

      gl_FragColor = vec4(col, alpha);
    }
  `

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[150, 64, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function SpaceEnvironment() {
  return (
    <>
      <TwinklingStars count={10000} />
      <NebulaSkybox />
    </>
  )
}
