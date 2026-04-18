import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function FloatingParticles({ isDark, count = 18 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 16 + 10,
      delay: Math.random() * 6,
    })), [count]);

  return (
    <div className="particles-bg">
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            borderRadius: '50%',
            background: isDark
              ? `radial-gradient(circle, rgba(129,140,248,0.25), transparent)`
              : `radial-gradient(circle, rgba(99,102,241,0.15), transparent)`,
          }}
          animate={{
            y: [0, -30, 15, -20, 0],
            x: [0, 15, -10, 8, 0],
            opacity: [0.1, 0.5, 0.2, 0.6, 0.1],
            scale: [1, 1.5, 0.8, 1.3, 1],
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
}
