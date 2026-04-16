import { motion } from 'framer-motion';
import { HeartPulse, Info } from 'lucide-react';

export default function Step1ClinicalContext() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '40px' }}>
      
      {/* Beautiful central Icon */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}
      >
        <div style={{
          width: 120, height: 120, borderRadius: 32,
          background: 'linear-gradient(135deg, var(--ios-pink), #ff3b30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(255,45,85,0.3)'
        }}>
          <HeartPulse size={60} color="white" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Clean Typography Typography */}
      <motion.h1 
        className="hero-title"
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.1, ease: 'easeOut' }}
      >
        Heart Failure<br/>Readmission
      </motion.h1>
      
      <motion.p 
        className="hero-subtitle"
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.2, ease: 'easeOut' }}
        style={{ maxWidth: 500, margin: '0 auto 48px' }}
      >
        Will this patient be readmitted to the hospital within 30 days of discharge?
      </motion.p>

      {/* iOS style list card */}
      <motion.div 
        className="ios-list"
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.3, ease: 'easeOut' }}
      >
        <div className="ios-list-item">
          <div>
            <div className="ios-list-title">Why it Matters</div>
            <div className="ios-list-subtitle" style={{ maxWidth: 400, marginTop: 4, lineHeight: 1.5 }}>
              30% of heart failure patients are readmitted within 30 days. Early identification allows for vital discharge follow-up calls.
            </div>
          </div>
        </div>
        
        <div className="ios-list-item" style={{ background: 'var(--bg-card-secondary)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ color: 'var(--ios-orange)', marginTop: 2 }}><Info size={24} /></div>
            <div style={{ textAlign: 'left' }}>
              <div className="ios-list-title" style={{ color: 'var(--ios-orange)' }}>Clinical Boundary</div>
              <div className="ios-list-subtitle" style={{ marginTop: 4, lineHeight: 1.5 }}>
                This tool cannot replace clinical judgment. It acts as a supportive warning system for high-risk patterns. You make the final decision.
              </div>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
