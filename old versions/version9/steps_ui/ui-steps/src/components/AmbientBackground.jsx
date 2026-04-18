import { motion } from 'framer-motion';

export default function AmbientBackground({ isDark }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0, overflow: 'hidden', background: 'var(--bg-main)',
      pointerEvents: 'none'
    }}>
      {/* Pink / Red Glow */}
      <motion.div 
        animate={{ 
          x: ['0%', '10%', '-10%', '0%'], 
          y: ['0%', '10%', '-5%', '0%'] 
        }} 
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} 
        style={{ 
          position: 'absolute', top: '-10%', left: '-10%', 
          width: '50vw', height: '50vw', borderRadius: '50%', 
          background: 'var(--ios-pink)', filter: 'blur(120px)', 
          opacity: isDark ? 0.08 : 0.04 
        }} 
      />
      {/* Blue / Teal Glow */}
      <motion.div 
        animate={{ 
          x: ['0%', '-15%', '10%', '0%'], 
          y: ['0%', '-10%', '15%', '0%'] 
        }} 
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} 
        style={{ 
          position: 'absolute', bottom: '-20%', right: '-10%', 
          width: '60vw', height: '60vw', borderRadius: '50%', 
          background: 'var(--ios-blue)', filter: 'blur(120px)', 
          opacity: isDark ? 0.08 : 0.04 
        }} 
      />
    </div>
  );
}
