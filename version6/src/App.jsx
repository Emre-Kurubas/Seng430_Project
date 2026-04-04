import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';
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
import WelcomePage from './components/WelcomePage';
import InteractiveDotBackground from './components/InteractiveDotBackground';
import { specialties } from './data/specialties';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

// ─── Page transition variants (subtle, no blur) ────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
const pageTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

// ─── localStorage helpers ──────────────────────────────────────
const LS_KEY = 'healthai_progress';
const LS_WELCOME_KEY = 'healthai_welcomed';
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

  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem(LS_WELCOME_KEY); } catch { return true; }
  });
  const [selectedDomain, setSelectedDomain] = useState(
    saved?.domainId ? (specialties.find(s => s.id === saved.domainId) || specialties[0]) : specialties[0]
  );
  // Default to light mode for cleaner academic look
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(saved?.maxUnlockedStep ?? 1);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [patientCount, setPatientCount] = useState(0);
  const [dataset, setDataset] = useState(null);
  const [datasetSchema, setDatasetSchema] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [trainedModelResult, setTrainedModelResult] = useState(null);
  
  // Model Comparison State (lifted here so it persists when returning from Step 5 to Step 4)
  const [comparisonList, setComparisonList] = useState([]);

  // ─── Custom Middle-Click Panning ──────────────────────────────────
  useEffect(() => {
    let isPanning = false;
    let startY = 0;
    let currentScrollY = 0;

    const handlePointerDown = (e) => {
      // 1 is the middle mouse button
      if (e.button === 1) {
        e.preventDefault(); 
        isPanning = true;
        startY = e.clientY;
        currentScrollY = window.scrollY;
        document.body.classList.add('is-panning');
      }
    };

    const handlePointerMove = (e) => {
      if (isPanning) {
        e.preventDefault();
        const deltaY = e.clientY - startY;
        window.scrollTo(0, currentScrollY + deltaY * 1.5);
      }
    };

    const handlePointerUp = (e) => {
      if (e.button === 1 && isPanning) {
        isPanning = false;
        document.body.classList.remove('is-panning');
      }
    };

    window.addEventListener('mousedown', handlePointerDown, { passive: false });
    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, []);

  const handleGetStarted = () => {
    try { localStorage.setItem(LS_WELCOME_KEY, '1'); } catch { /* empty */ }
    setShowWelcome(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBackToWelcome = () => {
    try { localStorage.removeItem(LS_WELCOME_KEY); } catch { /* empty */ }
    setShowWelcome(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const toggleTheme = () => setIsDarkMode(d => !d);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save progress to localStorage (excluding isDarkMode so they always start light, or keep it if they prefer)
  // Let's actually not save isDarkMode to localStorage so it resets to Light on reload
  useEffect(() => {
    saveProgress({ domainId: selectedDomain?.id, currentStep, maxUnlockedStep });
  }, [selectedDomain, currentStep, maxUnlockedStep]);

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
      setResetPending(true);
      setTimeout(() => setResetPending(false), 3000);
    } else {
      setResetPending(false);
      setSelectedDomain(specialties[0]);
      setCurrentStep(1);
      setMaxUnlockedStep(1);
      setPatientCount(0);
      setIsDarkMode(false);
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

  const sharedProps = { 
    isDarkMode, 
    onNext: handleNextStep, 
    onPrev: handlePrevStep,
    onGoToStep: handleGoToStep,
    dataset, setDataset,
    datasetSchema, setDatasetSchema,
    targetColumn, setTargetColumn,
    trainedModelResult, setTrainedModelResult,
    comparisonList, setComparisonList
  };

  // ── Render welcome page first ──────────────────────────────
  if (showWelcome) {
    return <WelcomePage isDarkMode={isDarkMode} onGetStarted={handleGetStarted} toggleTheme={toggleTheme} />;
  }

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>

      {/* ── INTERACTIVE DOT BACKGROUND ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <InteractiveDotBackground isDarkMode={isDarkMode} />
        
        {/* Soft, diffuse radial glows in the corners to create depth */}
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at top right, ${isDarkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)'}, transparent 55%)` }} />
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at bottom left, ${isDarkMode ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 92, 246, 0.04)'}, transparent 55%)` }} />
        
        {/* Soft gradient fade masking the bottom */}
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, transparent 30%, ${isDarkMode ? '#0f172a' : '#f8fafc'} 100%)` }} />
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
          onHome={handleBackToWelcome}
        />

        <div className="flex-grow flex w-full">
          <AnimatePresence mode="wait">
            {!isLoaded ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen flex flex-col items-center justify-center gap-5 w-full">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-indigo-200 border-t-indigo-500 animate-spin" />
                </div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading…</p>
              </motion.div>
            ) : (
              <div className="flex flex-col lg:flex-row w-full">
                {/* ── LEFT SIDEBAR (Collapsible) ── */}
                <aside
                  className={`shrink-0 flex flex-col lg:sticky lg:top-[62px] lg:h-[calc(100vh-62px)] lg:overflow-y-auto no-scrollbar border-b lg:border-b-0 lg:border-r pt-2 lg:pt-3 pb-6 transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200'} ${
                    sidebarCollapsed
                      ? 'w-full lg:w-[52px] px-2'
                      : 'w-full lg:w-[260px] 2xl:w-[280px] px-4 lg:px-6'
                  }`}
                >
                  {/* Collapse / Expand Toggle (desktop only) */}
                  <div className="hidden lg:flex justify-end mb-1">
                    <button
                      onClick={() => setSidebarCollapsed(c => !c)}
                      className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                      title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                      {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Collapsed state: just show active domain icon */}
                  {sidebarCollapsed ? (
                    <div className="hidden lg:flex flex-col items-center gap-3 pt-2">
                      <button
                        onClick={() => setSidebarCollapsed(false)}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                        title="Expand sidebar"
                      >
                        <Stethoscope className="w-4 h-4" style={{ color: selectedDomain?.theme?.primary || '#6366f1' }} />
                      </button>
                      <span className={`text-[9px] font-bold uppercase tracking-widest text-center leading-tight ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                        {selectedDomain?.name}
                      </span>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
                      <DomainSelector activeDomain={selectedDomain} onDomainChange={handleDomainChange} isDarkMode={isDarkMode} />
                    </motion.div>
                  )}

                  {/* Mobile: always show full selector regardless of collapse state */}
                  {sidebarCollapsed && (
                    <div className="lg:hidden">
                      <DomainSelector activeDomain={selectedDomain} onDomainChange={handleDomainChange} isDarkMode={isDarkMode} />
                    </div>
                  )}
                </aside>

                {/* ── RIGHT MAIN CONTENT ── */}
                <main className="flex-1 min-w-0 flex flex-col px-4 sm:px-6 lg:px-8 pb-4 lg:pb-6 pt-0">
                  {/* Stepper (Horizontal at the top) */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.05 }} className={`sticky top-[56px] sm:top-[62px] z-40 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 mb-6 transition-colors duration-300 border-b shadow-sm ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-[#f8fafc]/95 border-slate-200'}`}>
                    <Stepper isDarkMode={isDarkMode} currentStep={currentStep} maxUnlockedStep={maxUnlockedStep} onStepClick={handleGoToStep} domain={selectedDomain} />
                  </motion.div>

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
                        <ModelSelection {...sharedProps} domain={selectedDomain} />
                      </motion.div>
                    )}
                    {currentStep === 5 && (
                      <motion.div key="s5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                        <ResultsEvaluation {...sharedProps} domain={selectedDomain} />
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
                </main>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <UserGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} isDarkMode={isDarkMode} />
      <OnboardingTour isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;
