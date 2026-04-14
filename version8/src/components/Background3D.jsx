import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sparkles, Float } from '@react-three/drei';

function AnimatedSphere({ isDarkMode }) {
  const sphereRef = useRef();

  useFrame((state, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x += delta * 0.1;
      sphereRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={sphereRef} scale={1.8}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={isDarkMode ? "#4f46e5" : "#10b981"} // Indigo in Dark, Emerald in Light
          attach="material"
          distort={0.4} // Level of distortion
          speed={1.5} // Speed of distortion
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
          transparent={true}
          opacity={isDarkMode ? 0.15 : 0.08}
        />
      </mesh>
    </Float>
  );
}

function SmallNodes({ isDarkMode }) {
  const groupRef = useRef();

  const nodes = useMemo(() => {
    return Array.from({ length: 5 }).map(() => ({
      // eslint-disable-next-line react-hooks/purity
      position: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8]
    }));
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.05;
      groupRef.current.rotation.x -= delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={3}>
          <mesh position={node.position}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color={isDarkMode ? (i % 2 === 0 ? "#8b5cf6" : "#3b82f6") : (i % 2 === 0 ? "#059669" : "#34d399")}
              wireframe={true}
              transparent
              opacity={isDarkMode ? 0.4 : 0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Background3D({ isDarkMode }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.8 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={isDarkMode ? 0.5 : 1.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color={isDarkMode ? "#818cf8" : "#34d399"} />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} color={isDarkMode ? "#c084fc" : "#10b981"} />

        <AnimatedSphere isDarkMode={isDarkMode} />
        <SmallNodes isDarkMode={isDarkMode} />

        <Sparkles
          count={isDarkMode ? 150 : 80}
          scale={12}
          size={isDarkMode ? 2.5 : 3.5}
          speed={0.4}
          opacity={isDarkMode ? 0.4 : 0.3}
          color={isDarkMode ? "#e0e7ff" : "#064e3b"}
        />
      </Canvas>
    </div>
  );
}
