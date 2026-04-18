import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sparkles, MeshDistortMaterial, Trail } from "@react-three/drei";
import * as THREE from "three";

/**
 * Lightweight, looping 3D "hype reel" background:
 * - Drifting camera, animated stars
 * - Spinning trophy-like distorted icosahedron core
 * - Orbiting sport balls (basketball, football, tennis, volleyball)
 * - Trail-emitting comet
 * - Sparkles for atmosphere
 *
 * Pure procedural geometry — no external 3D models required.
 */

const SportBall: React.FC<{
  radius: number;
  speed: number;
  offset: number;
  yWobble: number;
  size: number;
  color: string;
  accent: string;
  pattern: "panels" | "stitched" | "fuzz" | "stripes";
}> = ({ radius, speed, offset, yWobble, size, color, accent, pattern }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 1.3) * yWobble;
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.015;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 48, 48]} />
      <meshStandardMaterial
        color={color}
        roughness={pattern === "fuzz" ? 0.95 : 0.45}
        metalness={pattern === "panels" ? 0.25 : 0.1}
        emissive={accent}
        emissiveIntensity={0.25}
      />
    </mesh>
  );
};

const TrophyCore = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.3;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.4) * 0.2;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.1, 4]} />
        <MeshDistortMaterial
          color="#3b82f6"
          emissive="#1e40af"
          emissiveIntensity={0.6}
          metalness={0.7}
          roughness={0.15}
          distort={0.35}
          speed={1.5}
        />
      </mesh>
    </Float>
  );
};

const Comet = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.7;
    ref.current.position.x = Math.cos(t) * 4.2;
    ref.current.position.y = Math.sin(t * 0.8) * 1.5 + 0.5;
    ref.current.position.z = Math.sin(t) * 2.5 - 1;
  });
  return (
    <Trail width={1.4} length={6} color={"#fbbf24"} attenuation={(t) => t * t}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#fde68a" />
      </mesh>
    </Trail>
  );
};

const DriftingCamera = () => {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.15) * 0.6;
    camera.position.y = Math.cos(t * 0.18) * 0.3;
    camera.lookAt(0, 0, 0);
  });
  return null;
};

const Scene = () => {
  const balls = useMemo(
    () => [
      // football green
      { radius: 2.6, speed: 0.45, offset: 0, yWobble: 0.4, size: 0.32, color: "#22c55e", accent: "#15803d", pattern: "panels" as const },
      // basketball orange
      { radius: 3.1, speed: -0.35, offset: 1.8, yWobble: 0.6, size: 0.36, color: "#f97316", accent: "#c2410c", pattern: "stripes" as const },
      // tennis yellow
      { radius: 2.3, speed: 0.55, offset: 3.4, yWobble: 0.3, size: 0.22, color: "#eab308", accent: "#a16207", pattern: "fuzz" as const },
      // volleyball purple-white
      { radius: 3.4, speed: -0.28, offset: 5.1, yWobble: 0.5, size: 0.34, color: "#a855f7", accent: "#6b21a8", pattern: "panels" as const },
      // cricket red
      { radius: 2.0, speed: 0.6, offset: 2.4, yWobble: 0.2, size: 0.2, color: "#ef4444", accent: "#991b1b", pattern: "stitched" as const },
    ],
    []
  );

  return (
    <>
      <DriftingCamera />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} color="#93c5fd" />
      <pointLight position={[-4, -2, 3]} intensity={0.6} color="#f97316" />
      <pointLight position={[3, 3, -3]} intensity={0.5} color="#a855f7" />

      <Stars radius={60} depth={40} count={2200} factor={4} saturation={0} fade speed={0.6} />
      <Sparkles count={80} scale={[10, 6, 6]} size={2} speed={0.4} color="#60a5fa" opacity={0.7} />

      <TrophyCore />
      <Comet />

      {balls.map((b, i) => (
        <SportBall key={i} {...b} />
      ))}
    </>
  );
};

const HypeScene3D: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HypeScene3D;
