import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

const DNAObject = ({ isDarkMode }) => {
    const groupRef = useRef();

    // Create DNA structure
    const dnaPairs = 15;
    const radius = 1.5;
    const heightSpacing = 0.6;
    const twist = 0.4;

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5;
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, -4, 0]}>
            {Array.from({ length: dnaPairs }).map((_, i) => {
                const y = i * heightSpacing;
                const angle = i * twist;
                const x1 = Math.cos(angle) * radius;
                const z1 = Math.sin(angle) * radius;
                const x2 = Math.cos(angle + Math.PI) * radius;
                const z2 = Math.sin(angle + Math.PI) * radius;

                return (
                    <group key={i}>
                        {/* Strands */}
                        <mesh position={[x1, y, z1]}>
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshStandardMaterial
                                color={isDarkMode ? '#818cf8' : '#34d399'}
                                emissive={isDarkMode ? '#6366f1' : '#10b981'}
                                emissiveIntensity={0.5}
                                roughness={0.2}
                                metalness={0.8}
                            />
                        </mesh>
                        <mesh position={[x2, y, z2]}>
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshStandardMaterial
                                color={isDarkMode ? '#c084fc' : '#fbbf24'}
                                emissive={isDarkMode ? '#a855f7' : '#f59e0b'}
                                emissiveIntensity={0.5}
                                roughness={0.2}
                                metalness={0.8}
                            />
                        </mesh>

                        {/* Connector */}
                        <mesh position={[0, y, 0]} rotation={[0, -angle, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, radius * 2, 8]} />
                            <meshStandardMaterial color={isDarkMode ? '#475569' : '#cbd5e1'} transparent opacity={0.6} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

export default function DNA3D({ isDarkMode }) {
    return (
        <div className="w-full h-[300px] pointer-events-none absolute top-[-50px] right-0 opacity-70">
            <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
                <ambientLight intensity={isDarkMode ? 0.3 : 1} />
                <pointLight position={[10, 10, 10]} intensity={isDarkMode ? 1.5 : 2.5} color={isDarkMode ? '#818cf8' : '#34d399'} />
                <pointLight position={[-10, -10, -10]} intensity={isDarkMode ? 1 : 1.5} color={isDarkMode ? '#c084fc' : '#fbbf24'} />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                    <DNAObject isDarkMode={isDarkMode} />
                </Float>
            </Canvas>
        </div>
    );
}
