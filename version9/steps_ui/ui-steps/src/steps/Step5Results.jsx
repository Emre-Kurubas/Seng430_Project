import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, ActivityIcon } from 'lucide-react';

function ActivityRing({ progress, color, size = 100, stroke = 12, icon: Icon, delay = 0 }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} stroke={`${color}33`} strokeWidth={stroke} fill="none" />
        <motion.circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={color} 
          strokeWidth={stroke} 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, delay, type: 'spring', bounce: 0.2 }}
        />
      </svg>
      {Icon && <Icon size={size * 0.25} color={color} />}
    </div>
  );
}

export default function Step5Results() {
  const rings = [
    { label: 'Accuracy', value: 81, color: 'var(--ios-pink)', icon: Target },
    { label: 'Sensitivity', value: 73, color: 'var(--ios-green)', icon: ActivityIcon },
    { label: 'Specificity', value: 85, color: 'var(--ios-blue)', icon: Shield },
  ];

  return (
    <div style={{ paddingTop: 20 }}>
      <motion.p 
        className="hero-subtitle" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        Evaluation
      </motion.p>
      
      {/* Activity Rings Container */}
      <motion.div 
        className="ios-card flex-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ flexDirection: 'column', gap: 32, padding: 40 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          {rings.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ActivityRing progress={r.value} color={r.color} icon={r.icon} size={90} stroke={10} delay={0.2 + i * 0.1} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{r.value}%</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Combined Ring (Optional/Decorative) to simulate the Apple Watch 3-ring look 
            We can just leave them side-by-side as they scale better. */}
      </motion.div>

      {/* Confusion Matrix (Sleek Grid) */}
      <motion.div 
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="ios-card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', fontWeight: 600 }}>Correctly Caught</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--ios-green)' }}>25</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>True Positives</div>
        </div>
        <div className="ios-card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', fontWeight: 600 }}>Missed Risk</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--ios-red)' }}>3</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>False Negatives</div>
        </div>
      </motion.div>
    </div>
  );
}
