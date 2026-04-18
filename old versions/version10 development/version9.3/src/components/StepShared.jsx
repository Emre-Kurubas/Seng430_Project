import React, { useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   Shared Floating Particles — used by all pipeline steps
   ═══════════════════════════════════════════════════════════════ */
export const FloatingParticles = ({ isDarkMode, primaryStr, count = 14 }) => {
    const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 14 + 8,
        delay: Math.random() * 5,
    })), [count]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        background: isDarkMode
                            ? `radial-gradient(circle, ${primaryStr}30, transparent)`
                            : `radial-gradient(circle, ${primaryStr}18, transparent)`,
                    }}
                    animate={{
                        y: [0, -25, 12, -18, 0],
                        x: [0, 12, -8, 6, 0],
                        opacity: [0.15, 0.5, 0.25, 0.6, 0.15],
                        scale: [1, 1.4, 0.9, 1.2, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Shared animation variants — stagger-in container + items
   ═══════════════════════════════════════════════════════════════ */
export const containerAnim = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

export const itemAnim = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};
