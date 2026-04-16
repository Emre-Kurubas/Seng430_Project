import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Target } from 'lucide-react';

const models = [
  { id: 'rf', name: 'Random Forest', type: 'Ensemble', icon: Target, color: 'var(--ios-purple)' },
  { id: 'lr', name: 'Logistic Regression', type: 'Statistical', icon: Zap, color: 'var(--ios-orange)' },
  { id: 'knn', name: 'K-Nearest Neighbors', type: 'Distance', icon: Brain, color: 'var(--ios-blue)' }
];

export default function Step4ModelSelection() {
  const [selected, setSelected] = useState('rf');

  return (
    <div style={{ paddingTop: 20 }}>
      <motion.p 
        className="hero-subtitle" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        Choose an Algorithm
      </motion.p>
      
      {/* Side scrolling cards like App Store or Wallet */}
      <div style={{
        display: 'flex', gap: 16, overflowX: 'auto', padding: '10px 0 20px', 
        scrollSnapType: 'x mandatory', margin: '0 -24px', paddingLeft: 24, paddingRight: 24
      }}>
        {models.map((m, i) => {
          const Icn = m.icon;
          const isSel = selected === m.id;
          return (
            <motion.div
              key={m.id}
              onClick={() => setSelected(m.id)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              style={{
                flexShrink: 0, width: 220, height: 260, borderRadius: 24, scrollSnapAlign: 'start',
                background: isSel ? m.color : 'var(--bg-card)',
                color: isSel ? 'white' : 'var(--text-main)',
                border: isSel ? 'none' : '1px solid var(--border)',
                boxShadow: isSel ? `0 20px 40px ${m.color}66` : 'var(--shadow-sm)',
                padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ 
                width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSel ? 'rgba(255,255,255,0.2)' : `${m.color}15`,
                color: isSel ? 'white' : m.color,
                marginBottom: 'auto'
              }}>
                <Icn size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {m.type}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1 }}>
                  {m.name}
                </div>
              </div>
            </motion.div>
          );
        })}
        {/* Spacer for scroll end */}
        <div style={{ width: 8, flexShrink: 0 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="ios-list"
          style={{ marginTop: 16 }}
        >
          <div className="ios-list-item">
            <div>
              <div className="ios-list-title">Auto-Tune Parameters</div>
              <div className="ios-list-subtitle">Let the system find the optimal settings</div>
            </div>
            <div style={{ width: 50, height: 30, borderRadius: 15, background: 'var(--ios-green)', position: 'relative' }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: 'white', position: 'absolute', top: 2, right: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
