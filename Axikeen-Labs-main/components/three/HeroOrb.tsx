'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// ── Animated glowing orb (main) ────────────────────────────────────────────

function MainOrb() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.15
    meshRef.current.rotation.y = t * 0.12
  })

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[1.6, 8]} />
        <MeshDistortMaterial
          color="#0A7C6E"
          emissive="#0A7C6E"
          emissiveIntensity={0.35}
          metalness={0.1}
          roughness={0.05}
          distort={0.45}
          speed={2.5}
          transparent
          opacity={0.92}
        />
      </mesh>
    </Float>
  )
}

// ── Small floating satellite orbs ──────────────────────────────────────────

function SatelliteOrb({
  position,
  color,
  scale,
  speed,
  floatIntensity,
}: {
  position: [number, number, number]
  color: string
  scale: number
  speed: number
  floatIntensity: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    meshRef.current.rotation.y = t * speed * 0.5
  })

  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={floatIntensity}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          metalness={0.05}
          roughness={0.1}
          distort={0.3}
          speed={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  )
}

// ── Particle field ─────────────────────────────────────────────────────────

function Particles({ count = 80 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null)

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const primaryColor = new THREE.Color('#0A7C6E')
    const accentColor  = new THREE.Color('#6C63FF')
    const midColor     = new THREE.Color('#B2DFDB')

    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 3.5
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      const c = Math.random() < 0.5
        ? primaryColor
        : Math.random() < 0.5 ? accentColor : midColor
      col[i * 3]     = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.04
    meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.1
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  )
}

// ── Mouse-reactive camera drift ────────────────────────────────────────────

function CameraRig() {
  const { camera, mouse } = useThree()

  useFrame(() => {
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ── Scene ──────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 4, 4]} intensity={1.2} color="#B2DFDB" />
      <pointLight position={[-4, -3, 2]} intensity={3} color="#6C63FF" />
      <pointLight position={[3, 2, -2]} intensity={2} color="#0A7C6E" />

      {/* Main orb */}
      <MainOrb />

      {/* Satellite orbs */}
      <SatelliteOrb position={[2.8, 1.2, -0.5]} color="#6C63FF" scale={0.28} speed={1.8} floatIntensity={1.2} />
      <SatelliteOrb position={[-2.5, -1, 0.8]}  color="#B2DFDB" scale={0.18} speed={1.2} floatIntensity={0.9} />
      <SatelliteOrb position={[1.5, -2.2, -1]}  color="#0A7C6E" scale={0.22} speed={2.2} floatIntensity={1.5} />
      <SatelliteOrb position={[-1.8, 2.0, 0.5]} color="#6C63FF" scale={0.14} speed={1.6} floatIntensity={1.0} />

      {/* Particle field */}
      <Particles count={90} />
    </>
  )
}

// ── Exported canvas component ──────────────────────────────────────────────

export default function HeroOrb({ className = '' }: { className?: string }) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene />
    </Canvas>
  )
}
