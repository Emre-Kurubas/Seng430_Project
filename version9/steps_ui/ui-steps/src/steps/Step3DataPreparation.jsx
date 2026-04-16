import { useState } from 'react';
import { motion } from 'framer-motion';

// Reusable iOS Segmented Control
function SegmentedControl({ options, selected, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-card-secondary)', padding: 4, borderRadius: 12 }}>
      {options.map(opt => (
        <div 
          key={opt} 
          onClick={() => onChange(opt)} 
          style={{ 
            flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 10,
            background: selected === opt ? 'var(--bg-card)' : 'transparent',
            boxShadow: selected === opt ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: selected === opt ? 600 : 500,
            color: selected === opt ? 'var(--text-main)' : 'var(--text-sec)',
            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s ease' 
          }}
        >
          {opt}
        </div>
      ))}
    </div>
  );
}

// Reusable iOS Switch
function IosSwitch({ checked, onChange }) {
  return (
    <div 
      onClick={() => onChange(!checked)} 
      style={{ 
        width: 50, height: 30, borderRadius: 15, background: checked ? 'var(--ios-green)' : 'var(--border)', 
        position: 'relative', cursor: 'pointer', transition: 'background 0.3s' 
      }}
    >
      <motion.div 
        style={{ 
          width: 26, height: 26, borderRadius: 13, background: 'white', 
          position: 'absolute', top: 2, left: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' 
        }} 
        animate={{ x: checked ? 20 : 0 }} 
        transition={{ type: 'spring', stiffness: 500, damping: 30 }} 
      />
    </div>
  );
}

export default function Step3DataPreparation() {
  const [missing, setMissing] = useState('Median');
  const [norm, setNorm] = useState('Z-Score');
  const [smote, setSmote] = useState(true);

  return (
    <div style={{ paddingTop: 20 }}>
      <motion.p 
        className="hero-subtitle" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        Preprocessing Options
      </motion.p>
      
      <motion.div 
        className="ios-list"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Missing Values */}
        <div className="ios-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="ios-list-title">Missing Values</div>
              <div className="ios-list-subtitle">How to handle empty fields</div>
            </div>
          </div>
          <SegmentedControl 
            options={['Median', 'Mode', 'Drop']} 
            selected={missing} 
            onChange={setMissing} 
          />
        </div>

        {/* Normalisation */}
        <div className="ios-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="ios-list-title">Normalisation</div>
              <div className="ios-list-subtitle">Scale variables evenly</div>
            </div>
          </div>
          <SegmentedControl 
            options={['Z-Score', 'Min-Max', 'None']} 
            selected={norm} 
            onChange={setNorm} 
          />
        </div>

        {/* Class Imbalance */}
        <div className="ios-list-item">
          <div>
            <div className="ios-list-title">Address Imbalance (SMOTE)</div>
            <div className="ios-list-subtitle">Generate synthetic data for rare classes</div>
          </div>
          <IosSwitch checked={smote} onChange={setSmote} />
        </div>
      </motion.div>
    </div>
  );
}
