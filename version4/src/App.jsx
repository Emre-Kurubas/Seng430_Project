import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Header from './components/Header';
import Stepper from './components/Stepper';
import DomainSelector from './components/DomainSelector';
import ClinicalContext from './components/ClinicalContext';
import DataExploration from './components/DataExploration';
import DataPreparation from './components/DataPreparation';
import ErrorBoundary from './components/ErrorBoundary';
import { specialties } from './data/specialties';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

// L6: Lazy-load heavy step components to reduce initial bundle size
const ModelSelection = React.lazy(() => import('./components/ModelSelection'));
const ResultsEvaluation = React.lazy(() => import('./components/ResultsEvaluation'));
const Explainability = React.lazy(() => import('./components/Explainability'));
const EthicsBias = React.lazy(() => import('./components/EthicsBias'));
const UserGuideModal = React.lazy(() => import('./components/UserGuideModal'));
const OnboardingTour = React.lazy(() => import('./components/OnboardingTour'));

/** @description Loading spinner shown while lazy components are being fetched */
const LazyFallback = () => (
  <div className="flex items-center justify-center py-20" role="status" aria-label="Loading step content">
    <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
    <span className="sr-only">Loading…</span>
  </div>
);

// ─── Animated background particles (M1: memoized to avoid re-creation) ────
const Particles = React.memo(({ theme }) => {
  const primary = theme?.primary || '#6366f1';
  const secondary = theme?.secondary || '#10b981';

  // useMemo so the array is only rebuilt when theme changes
  const particles = React.useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.3) % 90}%`,
    delay: `${(i * 1.7) % 12}s`,
    duration: `${14 + (i * 2.3) % 16}s`,
    size: i % 3 === 0 ? 4 : i % 3 === 1 ? 3 : 2,
    color: i % 3 === 0 ? `${secondary}80` : i % 3 === 1 ? `${primary}66` : `${primary}59`,
  })), [primary, secondary]);

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
});

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
  // M7: lazy initializer — localStorage is only read once on mount
  const [selectedDomain, setSelectedDomain] = useState(() => {
    const saved = loadProgress();
    return saved?.domainId ? (specialties.find(s => s.id === saved.domainId) || specialties[0]) : specialties[0];
  });
  const [isDarkMode, setIsDarkMode] = useState(() => loadProgress()?.isDarkMode ?? true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => loadProgress()?.currentStep ?? 1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(() => loadProgress()?.maxUnlockedStep ?? 1);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [patientCount, setPatientCount] = useState(0);
  const [dataset, setDataset] = useState(null);
  const [datasetSchema, setDatasetSchema] = useState([]);
  const [targetColumn, setTargetColumn] = useState(null);
  const [trainedModelResult, setTrainedModelResult] = useState(null);
  const [trainedModelName, setTrainedModelName] = useState('');

  // H3: ref to the parallax blob element — avoids setState on every mousemove
  const parallaxBlobRef = useRef(null);
  // M4: ref to store the reset confirmation timeout so we can clear it
  const resetTimerRef = useRef(null);

  const toggleTheme = () => setIsDarkMode(d => !d);

  useEffect(() => {
    setIsLoaded(true);
    // Ping the backend on mount to wake up free-tier hosted services
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    // Initial ping on mount
    const ping = () => fetch(`${apiBase}/health`).catch(err => console.debug('Keep-alive ping failed:', err));
    ping();

    // Recurring ping every 10 minutes to prevent Render spin-down
    const intervalId = setInterval(ping, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    saveProgress({ domainId: selectedDomain?.id, isDarkMode, currentStep, maxUnlockedStep });
  }, [selectedDomain, isDarkMode, currentStep, maxUnlockedStep]);

  // H3: parallax via direct DOM mutation — zero React re-renders on mousemove
  useEffect(() => {
    const handle = (e) => {
      if (!parallaxBlobRef.current) return;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      parallaxBlobRef.current.style.left = `${x - 25}%`;
      parallaxBlobRef.current.style.top = `${y - 25}%`;
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
      // M4: store timeout ref so we can clear it on unmount / second click
      resetTimerRef.current = setTimeout(() => setResetPending(false), 3000);
    } else {
      // Second click — execute the reset
      clearTimeout(resetTimerRef.current);
      setResetPending(false);
      setSelectedDomain(specialties[0]);
      setCurrentStep(1);
      setMaxUnlockedStep(1);
      setPatientCount(0);
      localStorage.removeItem(LS_KEY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // M4: clean up timer on unmount
  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const handleGoToStep = (step) => {
    if (step <= maxUnlockedStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sharedProps = { 
    isDarkMode, 
    onNext: handleNextStep, 
    onPrev: handlePrevStep,
    dataset, setDataset,
    datasetSchema, setDatasetSchema,
    targetColumn, setTargetColumn,
    trainedModelResult, setTrainedModelResult,
    modelName: trainedModelName, setTrainedModelName
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-700 ${isDarkMode ? 'bg-[#060B18] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Particles theme={selectedDomain?.theme} />

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${selectedDomain?.theme?.primary || '#6366f1'}1E, transparent)` }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 80% 80%, ${selectedDomain?.theme?.secondary || '#10b981'}14, transparent)` }} />
            <div
              ref={parallaxBlobRef}
              className="absolute w-[600px] h-[600px] rounded-full transition-[left,top] duration-[2000ms] ease-out opacity-30"
              style={{ left: '25%', top: '-5%', background: `radial-gradient(circle, ${selectedDomain?.theme?.primary || '#6366f1'}26 0%, transparent 70%)`, filter: 'blur(60px)' }}
            />
            <div className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full blur-[140px] animate-pulse-slow" style={{ backgroundColor: `${selectedDomain?.theme?.primary || '#6366f1'}14` }} />
            <div className="absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s', backgroundColor: `${selectedDomain?.theme?.secondary || '#10b981'}14` }} />
            <div className="absolute top-[35%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '6s', backgroundColor: `${selectedDomain?.theme?.primary || '#8b5cf6'}0F` }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
            <div className="absolute left-0 right-0 h-[1px]" style={{ animation: 'scan-line 8s linear infinite', background: `linear-gradient(90deg, transparent, ${selectedDomain?.theme?.primary || '#6366f1'}33, transparent)` }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] animate-pulse-slow mix-blend-multiply" style={{ backgroundColor: `${selectedDomain?.theme?.primary || '#6366f1'}99` }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] animate-pulse-slow mix-blend-multiply" style={{ animationDelay: '4s', backgroundColor: `${selectedDomain?.theme?.secondary || '#10b981'}99` }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
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

        <main id="main-content" role="main" aria-label="ML Learning Pipeline" className="flex-grow flex flex-col items-center w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-6">
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
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full" role="region" aria-label="Medical specialty selector">
                  <DomainSelector activeDomain={selectedDomain} onDomainChange={handleDomainChange} isDarkMode={isDarkMode} />
                </motion.div>

                {/* Stepper */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full sticky top-[72px] sm:top-[80px] z-40" role="navigation" aria-label="Pipeline step navigation">
                  <Stepper isDarkMode={isDarkMode} currentStep={currentStep} maxUnlockedStep={maxUnlockedStep} onStepClick={handleGoToStep} domain={selectedDomain} />
                </motion.div>

                {/* Keyboard hint */}
                <div className={`hidden md:flex items-center gap-1.5 text-[10px] self-end -mt-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  <kbd className={`px-1.5 py-0.5 rounded text-[9px] border font-mono ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>←</kbd>
                  <kbd className={`px-1.5 py-0.5 rounded text-[9px] border font-mono ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>→</kbd>
                  <span>keyboard navigation</span>
                </div>

                {/* Step Content */}
                <div className="w-full" role="region" aria-label={`Step ${currentStep} content`} aria-live="polite">
                  <Suspense fallback={<LazyFallback />}>
                    <AnimatePresence mode="wait">
                      {currentStep === 1 && (
                        <motion.div key={`s1-${selectedDomain.id}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Clinical Context">
                            <ClinicalContext domain={selectedDomain} {...sharedProps} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                      {currentStep === 2 && (
                        <motion.div key="s2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Data Exploration">
                            <DataExploration {...sharedProps} domain={selectedDomain} onPatientCountChange={setPatientCount} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                      {currentStep === 3 && (
                        <motion.div key="s3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Data Preparation">
                            <DataPreparation {...sharedProps} domain={selectedDomain} patientCount={patientCount} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                      {currentStep === 4 && (
                        <motion.div key="s4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Model Selection & Training">
                            <ModelSelection {...sharedProps} domain={selectedDomain} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                      {currentStep === 5 && (
                        <motion.div key="s5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Results Evaluation">
                            <ResultsEvaluation {...sharedProps} domain={selectedDomain} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                      {currentStep === 6 && (
                        <motion.div key="s6" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Explainability">
                            <Explainability {...sharedProps} domain={selectedDomain} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                      {currentStep === 7 && (
                        <motion.div key="s7" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                          <ErrorBoundary isDarkMode={isDarkMode} label="Ethics & Bias">
                            <EthicsBias {...sharedProps} domain={selectedDomain} />
                          </ErrorBoundary>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Suspense>
                </div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* L6: only mount the heavy modal when it's open */}
      <Suspense fallback={null}>
        {isHelpOpen && <UserGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} isDarkMode={isDarkMode} />}
        <OnboardingTour isDarkMode={isDarkMode} />
      </Suspense>
    </div>
  );
}

export default App;
