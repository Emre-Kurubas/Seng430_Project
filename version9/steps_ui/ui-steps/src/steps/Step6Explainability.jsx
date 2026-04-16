import { motion } from 'framer-motion';

const topFeatures = [
  { name: 'Ejection Fraction', value: 31, color: 'var(--ios-pink)' },
  { name: 'Serum Creatinine', value: 22, color: 'var(--ios-orange)' },
  { name: 'Age', value: 15, color: 'var(--ios-blue)' },
  { name: 'Time (Follow-up)', value: 11, color: 'var(--ios-teal)' },
  { name: 'Serum Sodium', value: 8, color: 'var(--ios-purple)' },
];

export default function Step6Explainability() {
  return (
    <div style={{ paddingTop: 20 }}>
      {/* Featured Insight */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Top Predictor
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ios-pink)', lineHeight: 1 }}>
          Ejection Fraction
        </div>
        <div style={{ fontSize: '1rem', color: 'var(--text-sec)', marginTop: 12, maxWidth: 400, margin: '12px auto 0' }}>
          Accounts for 31% of the model's decision-making process.
        </div>
      </motion.div>

      {/* Horizontal Bar Chart (Apple style) */}
      <motion.div 
        className="ios-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="section-title">Feature Importance</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
          {topFeatures.map((f, i) => (
            <div key={f.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.name}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: f.color }}>{f.value}%</span>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: 'var(--bg-card-secondary)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.value / 31) * 100}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 6, background: f.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
