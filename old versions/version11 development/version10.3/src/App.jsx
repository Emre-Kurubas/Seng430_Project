import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, Home, RotateCcw, Activity, LayoutDashboard, Search, Settings2, Cpu, BarChart2, Lightbulb, ShieldCheck, Rocket } from 'lucide-react';
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
import ProgressThermometer from './components/ProgressThermometer';
import { specialties } from './data/specialties';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Page transition variants (subtle blur & vertical shift) ────────────────
const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(2px)' },
};

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

export default function App() {
  const saved = loadProgress();

  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem(LS_WELCOME_KEY); } catch { return true; }
  });
  
  const [selectedDomain, setSelectedDomain] = useState(
    saved?.domainId ? (specialties.find(s => s.id === saved.domainId) || specialties[0]) : specialties[0]
  );
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(saved?.maxUnlockedStep ?? 1);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingDomain, setPendingDomain] = useState(null);
  
  // Pipeline State Data
  const [patientCount, setPatientCount] = useState(0);
  const [dataset, setDataset] = useState(null);
  const [datasetSchema, setDatasetSchema] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [trainedModelResult, setTrainedModelResult] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);

  // Reset confirm action / pending domain if clicked outside
  useEffect(() => {
    if (!confirmAction && !pendingDomain) return;
    const handleClickOutside = (e) => {
      if (e.target.closest('.confirm-btn')) return;
      setConfirmAction(null);
      setPendingDomain(null);
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [confirmAction, pendingDomain]);

  // Setup Theme on DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => setIsLoaded(true), []);

  useEffect(() => {
    saveProgress({ domainId: selectedDomain?.id, currentStep, maxUnlockedStep });
  }, [selectedDomain, currentStep, maxUnlockedStep]);

  const handleGetStarted = () => {
    try { localStorage.setItem(LS_WELCOME_KEY, '1'); } catch { /* empty */ }
    setShowWelcome(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleResetAll = () => {
    try { localStorage.removeItem(LS_KEY); } catch { /* empty */ }
    setDataset(null);
    setDatasetSchema([]);
    setTargetColumn('');
    setTrainedModelResult(null);
    setComparisonList([]);
    setPatientCount(0);
    setCurrentStep(1);
    setMaxUnlockedStep(1);
    setSelectedDomain(specialties[0]);
  };

  const handleNextStep = useCallback(() => {
    const next = Math.min(currentStep + 1, 7);
    setCurrentStep(next);
    setMaxUnlockedStep(prev => Math.max(prev, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 1);
      setMaxUnlockedStep(next);
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleGoToStep = (step) => {
    if (step <= maxUnlockedStep) {
      setCurrentStep(step);
      setMaxUnlockedStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    setDataset(null);
    setDatasetSchema([]);
    setTargetColumn('');
    setTrainedModelResult(null);
    setComparisonList([]);
    setPatientCount(0);
    setCurrentStep(1);
    setMaxUnlockedStep(1);
    setPendingDomain(null);
  };

  // Keyboard navigation
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

  const sharedProps = { 
    isDarkMode, 
    onNext: handleNextStep, 
    onPrev: handlePrevStep,
    onGoToStep: handleGoToStep,
    dataset, setDataset,
    datasetSchema, setDatasetSchema,
    targetColumn, setTargetColumn,
    trainedModelResult, setTrainedModelResult,
    comparisonList, setComparisonList,
    domain: selectedDomain
  };

  if (!isLoaded) return null;

  return (
    <AnimatePresence mode="wait">
      {showWelcome ? (
        <motion.div
           key="welcome"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
           transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <WelcomePage isDarkMode={isDarkMode} onGetStarted={handleGetStarted} toggleTheme={() => setIsDarkMode(d => !d)} />
        </motion.div>
      ) : (
        <motion.div
           key="main-app"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
           className="dashboard-wrapper"
        >          {/* Progress Thermometer — right edge */}
          <ProgressThermometer
            currentStep={currentStep}
            totalSteps={7}
            color={selectedDomain?.theme?.primary || '#007aff'}
            isDarkMode={isDarkMode}
          />
      
      {/* Note: Top Bar removed, controls moved to sidebar */}

      <div className="dashboard-container">
        {/* ─── Dashboard Sidebar ─── */}
        <aside className="dashboard-sidebar" id="tour-sidebar">
          <div className="sidebar-logo">
            <Activity size={24} color="#ccff00" />
            <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>healthML</span>
          </div>

          <nav className="sidebar-nav">
            {specialties.map(spec => {
              const isActive = selectedDomain.id === spec.id;
              const isPending = pendingDomain === spec.id;
              return (
                <button
                  key={spec.id}
                  className={`sidebar-nav-item confirm-btn ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                  onClick={() => {
                    if (isActive) return;
                    if (isPending) {
                      handleDomainChange(spec);
                    } else {
                      setPendingDomain(spec.id);
                    }
                  }}
                >
                  <div className="nav-item-content">
                    <span style={{ fontSize: '0.9rem' }}>{spec.emoji}</span>
                    <span style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isPending ? 'Sure?' : spec.name}</span>
                  </div>
                  {isPending && (
                    <div style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 16, height: 2, borderRadius: 1,
                      background: '#ff9500',
                      animation: 'pulseGlow 1s ease-in-out infinite',
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Bottom Controls */}
          <div id="tour-sidebar-controls" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Reset Button — inline expand */}
            <motion.button
              layout
              className="confirm-btn"
              onClick={() => {
                if (confirmAction === 'reset') {
                  handleResetAll();
                  setConfirmAction(null);
                } else {
                  setConfirmAction('reset');
                }
              }}
              title="Reset All Progress"
              style={{
                display: 'flex', alignItems: 'center', gap: confirmAction === 'reset' ? 6 : 0,
                padding: confirmAction === 'reset' ? '8px 14px' : '8px',
                borderRadius: 999, border: 'none', cursor: 'pointer',
                background: confirmAction === 'reset' ? '#ff3b30' : 'rgba(255,255,255,0.05)',
                color: confirmAction === 'reset' ? '#fff' : '#ff3b30',
                fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <RotateCcw size={14} strokeWidth={2} />
              <AnimatePresence>
                {confirmAction === 'reset' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden', display: 'inline-block' }}
                  >Sure?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Home Button — inline expand */}
            <motion.button
              layout
              className="confirm-btn"
              onClick={() => {
                if (confirmAction === 'home') {
                  localStorage.removeItem(LS_WELCOME_KEY);
                  setShowWelcome(true);
                  setCurrentStep(1);
                  setConfirmAction(null);
                } else {
                  setConfirmAction('home');
                }
              }}
              title="Return to Welcome Screen"
              style={{
                display: 'flex', alignItems: 'center', gap: confirmAction === 'home' ? 6 : 0,
                padding: confirmAction === 'home' ? '8px 14px' : '8px',
                borderRadius: 999, border: 'none', cursor: 'pointer',
                background: confirmAction === 'home' ? '#ff9500' : 'rgba(255,255,255,0.05)',
                color: confirmAction === 'home' ? '#fff' : '#fff',
                fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <Home size={14} strokeWidth={2} />
              <AnimatePresence>
                {confirmAction === 'home' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden', display: 'inline-block' }}
                  >Sure?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Tutorial Button — inline expand */}
            <motion.button
              layout
              className="confirm-btn"
              onClick={() => {
                if (confirmAction === 'tutorial') {
                  window.dispatchEvent(new CustomEvent('restart-step-tour', { detail: { step: currentStep } }));
                  setConfirmAction(null);
                } else {
                  setConfirmAction('tutorial');
                }
              }}
              title="Restart Tutorials"
              style={{
                display: 'flex', alignItems: 'center', gap: confirmAction === 'tutorial' ? 6 : 0,
                padding: confirmAction === 'tutorial' ? '8px 14px' : '8px',
                borderRadius: 999, border: 'none', cursor: 'pointer',
                background: confirmAction === 'tutorial' ? '#a855f7' : 'rgba(255,255,255,0.05)',
                color: confirmAction === 'tutorial' ? '#fff' : '#a855f7',
                fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <Lightbulb size={14} strokeWidth={2} />
              <AnimatePresence>
                {confirmAction === 'tutorial' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden', display: 'inline-block' }}
                  >Sure?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Theme Toggle — no confirmation needed */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
              style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              {isDarkMode ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
            </button>
          </div>
        </aside>

        {/* ─── Main Dashboard Content Area ─── */}
        <main className="app-layout">

        <AnimatePresence mode="wait">
          <motion.div
            key={`s${currentStep}-${selectedDomain.id}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            {currentStep === 1 && <ClinicalContext {...sharedProps} />}
            {currentStep === 2 && <DataExploration {...sharedProps} onPatientCountChange={setPatientCount} />}
            {currentStep === 3 && <DataPreparation {...sharedProps} patientCount={patientCount} />}
            {currentStep === 4 && <ModelSelection {...sharedProps} />}
            {currentStep === 5 && <ResultsEvaluation {...sharedProps} />}
            {currentStep === 6 && <Explainability {...sharedProps} />}
            {currentStep === 7 && <EthicsBias {...sharedProps} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── macOS Bottom Dock for Step Navigation ─── */}
      <div id="tour-bottom-dock" className="bottom-nav-container" style={{ position: 'fixed', bottom: 24, left: 'calc(50% + 130px)', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <motion.div 
          className="bottom-nav"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 18px', borderRadius: 999, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <button style={{ all: 'unset', cursor: 'pointer', opacity: currentStep === 1 ? 0.3 : 1 }} onClick={handlePrevStep} disabled={currentStep === 1}>
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          
          <div style={{ display: 'flex', gap: 6, padding: '0 12px', alignItems: 'center' }}>
            {[
              { num: 1, label: 'Context' },
              { num: 2, label: 'Explore' },
              { num: 3, label: 'Prepare' },
              { num: 4, label: 'Model' },
              { num: 5, label: 'Results' },
              { num: 6, label: 'Explain' },
              { num: 7, label: 'Ethics' },
            ].map(({ num, label }) => {
              const isActive = currentStep === num;
              const isLocked = num > maxUnlockedStep;
              return (
                <motion.div 
                  key={num}
                  className={`nav-dot ${isActive ? 'active' : ''}`}
                  onClick={() => !isLocked && handleGoToStep(num)}
                  whileHover={!isLocked ? { scale: 1.6 } : {}}
                  whileTap={!isLocked ? { scale: 0.9 } : {}}
                  title={label}
                  style={{
                    width: isActive ? 24 : 8, height: 8, borderRadius: 4,
                    opacity: isActive ? 1 : (isLocked ? 0.15 : 0.4),
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    background: isActive ? (selectedDomain?.theme?.primary || 'var(--ios-blue)') : (isLocked ? 'var(--text-tertiary)' : 'var(--text-sec)'),
                  }}
                />
              );
            })}
          </div>

          <button style={{ all: 'unset', cursor: 'pointer', opacity: currentStep >= 7 ? 0.3 : 1 }} onClick={handleNextStep} disabled={currentStep >= 7 || currentStep >= maxUnlockedStep}>
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </motion.div>
      </div>

      </div>

      <UserGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} isDarkMode={isDarkMode} />
      <OnboardingTour isDarkMode={isDarkMode} />


        </motion.div>
      )}
    </AnimatePresence>
  );
}
