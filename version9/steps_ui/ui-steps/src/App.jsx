import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import './index.css';

import AmbientBackground from './components/AmbientBackground';
import Step1ClinicalContext from './steps/Step1ClinicalContext';
import Step2DataExploration from './steps/Step2DataExploration';
import Step3DataPreparation from './steps/Step3DataPreparation';
import Step4ModelSelection from './steps/Step4ModelSelection';
import Step5Results from './steps/Step5Results';
import Step6Explainability from './steps/Step6Explainability';
import Step7EthicsBias from './steps/Step7EthicsBias';

const STEP_COMPONENTS = {
  1: Step1ClinicalContext,
  2: Step2DataExploration,
  3: Step3DataPreparation,
  4: Step4ModelSelection,
  5: Step5Results,
  6: Step6Explainability,
  7: Step7EthicsBias,
};

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(2px)' },
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const prev = () => setCurrentStep(prev => Math.max(1, prev - 1));
  const next = () => setCurrentStep(prev => Math.min(7, prev + 1));
  
  // Custom scrolling handled nicely
  const goTo = (s) => {
    setCurrentStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handle = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' && currentStep < 7) { next(); window.scrollTo({top:0}); }
      else if (e.key === 'ArrowLeft' && currentStep > 1) { prev(); window.scrollTo({top:0}); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });

  const Component = STEP_COMPONENTS[currentStep];

  return (
    <>
      <AmbientBackground isDark={isDark} />
      
      {/* Theme Toggle (Top Right) */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 50 }}>
        <button 
          onClick={() => setIsDark(!isDark)}
          style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <main className="app-layout">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dynamic Navigation Island */}
      <div className="bottom-nav-container">
        <div className="bottom-nav">
          <button className="btn-icon" onClick={prev} disabled={currentStep === 1}>
            <ChevronLeft size={24} />
          </button>
          
          <div style={{ display: 'flex', gap: 10, padding: '0 12px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <div 
                key={num} 
                className={`nav-dot ${currentStep === num ? 'active' : ''}`}
                onClick={() => goTo(num)} 
              />
            ))}
          </div>

          <button className="btn-icon" onClick={next} disabled={currentStep === 7}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </>
  );
}
