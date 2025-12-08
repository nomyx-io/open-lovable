"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface AnimatedSphereProps {
  color?: string;
  distort?: number;
  speed?: number;
  position?: [number, number, number];
  scale?: number;
}

function AnimatedSphere({
  color = "#f97316",
  distort = 0.4,
  speed = 2,
  position = [0, 0, 0],
  scale = 1,
}: AnimatedSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function AnimatedTorus({
  color = "#ef4444",
  position = [2, 0, -1],
  scale = 0.5,
}: {
  color?: string;
  position?: [number, number, number];
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusGeometry args={[1, 0.4, 32, 100]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
}

function AnimatedIcosahedron({
  color = "#8b5cf6",
  position = [-2, 1, -1],
  scale = 0.6,
}: {
  color?: string;
  position?: [number, number, number];
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.85}
          wireframe={false}
        />
      </mesh>
    </Float>
  );
}

interface Hero3DElementProps {
  variant?: "sphere" | "composition" | "minimal";
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export function Hero3DElement({
  variant = "composition",
  className = "",
  primaryColor = "#f97316",
  secondaryColor = "#ef4444",
  accentColor = "#8b5cf6",
}: Hero3DElementProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#f97316" />
        
        <Suspense fallback={null}>
          {variant === "sphere" && (
            <AnimatedSphere color={primaryColor} scale={1.5} />
          )}
          
          {variant === "composition" && (
            <>
              <AnimatedSphere color={primaryColor} scale={1.2} position={[0, 0, 0]} />
              <AnimatedTorus color={secondaryColor} position={[2.5, 0.5, -1]} scale={0.5} />
              <AnimatedIcosahedron color={accentColor} position={[-2.5, -0.5, -1]} scale={0.5} />
            </>
          )}
          
          {variant === "minimal" && (
            <AnimatedSphere color={primaryColor} scale={1} distort={0.3} speed={1.5} />
          )}
          
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Lightweight loading placeholder
export function Hero3DFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 animate-pulse animation-delay-75" />
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-orange-500/40 to-red-500/40 animate-pulse animation-delay-150" />
      </div>
    </div>
  );
}