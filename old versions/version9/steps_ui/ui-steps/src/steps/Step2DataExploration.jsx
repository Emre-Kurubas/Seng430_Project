import { motion } from 'framer-motion';
import { Users, Droplet, ActivityIcon } from 'lucide-react';

export default function Step2DataExploration() {
  return (
    <div style={{ paddingTop: 20 }}>
      <motion.p 
        className="hero-subtitle" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        Data Profile
      </motion.p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        {/* Total Patients Widget */}
        <motion.div 
          className="ios-card" 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          style={{ background: 'linear-gradient(135deg, var(--ios-blue), #2c9aff)', color: 'white', padding: 24, margin: 0 }}
        >
          <Users size={28} opacity={0.8} />
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>299</div>
            <div style={{ fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Patients Total</div>
          </div>
        </motion.div>

        {/* Features Widget */}
        <motion.div 
          className="ios-card" 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{ background: 'linear-gradient(135deg, var(--ios-orange), #ffb340)', color: 'white', padding: 24, margin: 0 }}
        >
          <ActivityIcon size={28} opacity={0.8} />
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>13</div>
            <div style={{ fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Clinical Features</div>
          </div>
        </motion.div>
      </div>

      {/* Target Distribution Widget */}
      <motion.div 
        className="ios-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        style={{ padding: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,45,85,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={18} color="var(--ios-pink)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Readmission Risk</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ios-teal)', lineHeight: 1 }}>68%</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sec)', marginTop: 4 }}>Low Risk (Survive)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ios-pink)', lineHeight: 1 }}>32%</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sec)', marginTop: 4 }}>High Risk (Decease)</div>
          </div>
        </div>

        {/* Apple Style Continuous Bar */}
        <div style={{ height: 16, borderRadius: 8, background: 'var(--ios-pink)', display: 'flex', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '68%' }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.5 }}
            style={{ height: '100%', background: 'var(--ios-teal)' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
