import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldAlert } from 'lucide-react';

const checklist = [
  { id: 1, text: 'Clinical Oversight Confirmed' },
  { id: 2, text: 'Subgroup Bias Checked' },
  { id: 3, text: 'Data Privacy (GDPR) Compliant' },
  { id: 4, text: 'Performance Monitored' }
];

export default function Step7EthicsBias() {
  const [checked, setChecked] = useState([1]); // Item 1 pre-checked

  const toggle = (id) => {
    if (checked.includes(id)) setChecked(checked.filter(i => i !== id));
    else setChecked([...checked, id]);
  };

  return (
    <div style={{ paddingTop: 20 }}>
      {/* Alert Card */}
      <motion.div 
        className="ios-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--bg-card)', border: '1.5px solid rgba(255,59,48,0.3)', marginBottom: 24 }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ color: 'var(--ios-red)', marginTop: 2 }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ios-red)', marginBottom: 8 }}>Subgroup Warning</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>
              The model's sensitivity drops significantly for female patients (41.0%) compared to male patients (75.1%). 
              This must be addressed before clinical deployment.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reminders App Style Checklist */}
      <motion.div 
        className="ios-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ padding: '20px 20px 10px' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Ethics Checklist</div>
        </div>
        
        {checklist.map(item => {
          const isChecked = checked.includes(item.id);
          return (
            <div 
              key={item.id} 
              className="ios-list-item" 
              style={{ padding: '16px 20px', cursor: 'pointer', background: isChecked ? 'var(--bg-card-secondary)' : 'var(--bg-card)' }}
              onClick={() => toggle(item.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Circle Checkbox */}
                <div style={{ 
                  width: 24, height: 24, borderRadius: 12, 
                  border: isChecked ? 'none' : '2px solid var(--border)',
                  background: isChecked ? 'var(--ios-orange)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  <AnimatePresence>
                    {isChecked && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check size={14} color="white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Text */}
                <div style={{ 
                  fontSize: '1.05rem', fontWeight: 500,
                  color: isChecked ? 'var(--text-sec)' : 'var(--text-main)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                  transition: 'all 0.2s'
                }}>
                  {item.text}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
