import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Stepper from './components/Stepper';
import DomainSelector from './components/DomainSelector';
import ClinicalContext from './components/ClinicalContext';
import DataExploration from './components/DataExploration';
import DataPreparation from './components/DataPreparation';
import ModelSelection from './components/ModelSelection';
import ResultsEvaluation from './components/ResultsEvaluation';
import Explainability from './components/Explainability';
import EthicsBias from './components/EthicsBias';
import UserGuideModal from './components/UserGuideModal';
import OnboardingTour from './components/OnboardingTour';
import { specialties } from './data/specialties';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

// ─── Animated background particles ────────────────────────────
const Particles = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.3) % 90}%`,
    delay: `${(i * 1.7) % 12}s`,
    duration: `${14 + (i * 2.3) % 16}s`,
    size: i % 3 === 0 ? 4 : i % 3 === 1 ? 3 : 2,
    color: i % 3 === 0 ? 'rgba(16,185,129,0.5)' : i % 3 === 1 ? 'rgba(99,102,241,0.4)' : 'rgba(124,58,237,0.35)',
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

// ─── Page transition variants ──────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, x: 30, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -30, filter: 'blur(8px)' },
};
const pageTransition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] };

// ─── localStorage helpers ──────────────────────────────────────
const LS_KEY = 'healthai_progress';
const loadProgress = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};
const saveProgress = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* empty */ }
};

function App() {
  const saved = loadProgress();

  const [selectedDomain, setSelectedDomain] = useState(
    saved?.domainId ? (specialties.find(s => s.id === saved.domainId) || specialties[0]) : specialties[0]
  );
  const [isDarkMode, setIsDarkMode] = useState(saved?.isDarkMode ?? true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(saved?.maxUnlockedStep ?? 1);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });
  const [patientCount, setPatientCount] = useState(0);

  const toggleTheme = () => setIsDarkMode(d => !d);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    saveProgress({ domainId: selectedDomain?.id, isDarkMode, currentStep, maxUnlockedStep });
  }, [selectedDomain, isDarkMode, currentStep, maxUnlockedStep]);

  // Parallax mouse tracking
  useEffect(() => {
    const handle = (e) => {
      setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const handleNextStep = useCallback(() => {
    const next = Math.min(currentStep + 1, 7);
    setCurrentStep(next);
    setMaxUnlockedStep(prev => Math.max(prev, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keyboard navigation: ← → arrows
  useEffect(() => {
    const handle = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (isHelpOpen) return;
      if (e.key === 'ArrowRight' && currentStep < maxUnlockedStep) handleNextStep();
      else if (e.key === 'ArrowLeft' && currentStep > 1) handlePrevStep();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [currentStep, maxUnlockedStep, isHelpOpen, handleNextStep, handlePrevStep]);

  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    setCurrentStep(1);
    setMaxUnlockedStep(1);
  };

  const [resetPending, setResetPending] = useState(false);

  const handleReset = () => {
    if (!resetPending) {
      // First click — arm the reset
      setResetPending(true);
      // Auto-cancel after 3 seconds if user doesn't confirm
      setTimeout(() => setResetPending(false), 3000);
    } else {
      // Second click — execute the reset
      setResetPending(false);
      setSelectedDomain(specialties[0]);
      setCurrentStep(1);
      setMaxUnlockedStep(1);
      setPatientCount(0);
      localStorage.removeItem(LS_KEY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStep = (step) => {
    if (step <= maxUnlockedStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sharedProps = { isDarkMode, onNext: handleNextStep, onPrev: handlePrevStep };

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-700 ${isDarkMode ? 'bg-[#060B18] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Particles />

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(16,185,129,0.08),transparent)]" />
            <div
              className="absolute w-[600px] h-[600px] rounded-full transition-all duration-[2000ms] ease-out opacity-30"
              style={{ left: `${mousePos.x - 25}%`, top: `${mousePos.y - 25}%`, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            <div className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/8 blur-[140px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/8 blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
            <div className="absolute top-[35%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/6 blur-[100px] animate-pulse-slow" style={{ animationDelay: '6s' }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" style={{ animation: 'scan-line 8s linear infinite' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" />
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-100/60 blur-[120px] animate-pulse-slow mix-blend-multiply" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-100/60 blur-[100px] animate-pulse-slow mix-blend-multiply" style={{ animationDelay: '4s' }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          activeDomain={selectedDomain}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onHelpOpen={() => setIsHelpOpen(true)}
          onReset={handleReset}
          resetPending={resetPending}
        />

        <main className="flex-grow flex flex-col items-center w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-6">
          <AnimatePresence mode="wait">
            {!isLoaded ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                </div>
                <p className={`text-sm font-medium tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading HEALTH-AI…</p>
              </motion.div>
            ) : (
              <>
                {/* Domain Selector */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full">
                  <DomainSelector activeDomain={selectedDomain} onDomainChange={handleDomainChange} isDarkMode={isDarkMode} />
                </motion.div>

                {/* Stepper */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full sticky top-[72px] sm:top-[80px] z-40">
                  <Stepper isDarkMode={isDarkMode} currentStep={currentStep} maxUnlockedStep={maxUnlockedStep} onStepClick={handleGoToStep} />
                </motion.div>

                {/* Keyboard hint */}
                <div className={`hidden md:flex items-center gap-1.5 text-[10px] self-end -mt-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  <kbd className={`px-1.5 py-0.5 rounded text-[9px] border font-mono ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>←</kbd>
                  <kbd className={`px-1.5 py-0.5 rounded text-[9px] border font-mono ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>→</kbd>
                  <span>keyboard navigation</span>
                </div>

                {/* Step Content */}
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div key={`s1-${selectedDomain.id}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <ClinicalContext domain={selectedDomain} {...sharedProps} />
                      </motion.div>
                    )}
                    {currentStep === 2 && (
                      <motion.div key="s2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <DataExploration {...sharedProps} domain={selectedDomain} onPatientCountChange={setPatientCount} />
                      </motion.div>
                    )}
                    {currentStep === 3 && (
                      <motion.div key="s3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <DataPreparation {...sharedProps} domain={selectedDomain} patientCount={patientCount} />
                      </motion.div>
                    )}
                    {currentStep === 4 && (
                      <motion.div key="s4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <ModelSelection {...sharedProps} />
                      </motion.div>
                    )}
                    {currentStep === 5 && (
                      <motion.div key="s5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <ResultsEvaluation {...sharedProps} />
                      </motion.div>
                    )}
                    {currentStep === 6 && (
                      <motion.div key="s6" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <Explainability {...sharedProps} domain={selectedDomain} />
                      </motion.div>
                    )}
                    {currentStep === 7 && (
                      <motion.div key="s7" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <EthicsBias {...sharedProps} domain={selectedDomain} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>

      <UserGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} isDarkMode={isDarkMode} />
      <OnboardingTour isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;
