import React, { useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Check, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

const ArrowBtn = ({ onClick, dir, isDarkMode }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        type="button"
        className={`shrink-0 w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${isDarkMode
            ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'
            }`}
    >
        {dir === 'left' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
    </motion.button>
);

const STEPS = [
    { id: 1, title: 'Clinical Scenario', desc: 'What are we predicting?' },
    { id: 2, title: 'Data Exploration', desc: 'Load & inspect the cohort' },
    { id: 3, title: 'Data Preparation', desc: 'Handle gaps, scale, balance' },
    { id: 4, title: 'Model Training', desc: 'Pick an algorithm & train' },
    { id: 5, title: 'Results & Metrics', desc: 'How well does it perform?' },
    { id: 6, title: 'Explainability', desc: 'What drove each decision?' },
    { id: 7, title: 'Ethics & Fairness', desc: 'Is it safe for everyone?' },
];

const Stepper = ({ currentStep = 1, isDarkMode, maxUnlockedStep = 1, onStepClick, domain }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const scrollRef = useRef(null);

    const scrollLeft = () => scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
    const scrollRight = () => scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const el = container.querySelector(`[data-step="${currentStep}"]`);
        if (!el) return;
        const target = el.offsetLeft - (container.clientWidth / 2) + (el.offsetWidth / 2);
        container.scrollTo({ left: target, behavior: 'smooth' });
    }, [currentStep]);

    const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

    return (
        <div id="stepper-bar" className="w-full mb-8">
            {/* Top progress bar */}
            <div className={`h-[3px] rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-200/80'}`}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${primaryStr}, ${primaryStr}CC)` }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* Steps row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-3">
                <ArrowBtn onClick={scrollLeft} dir="left" isDarkMode={isDarkMode} />

                <div ref={scrollRef} className="flex items-center gap-0 overflow-x-auto no-scrollbar scroll-smooth flex-1">
                    {STEPS.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const isUnlocked = step.id <= maxUnlockedStep;
                        const isLocked = !isUnlocked;
                        const isClickable = isUnlocked && !isActive && onStepClick;

                        // Is the connector BEFORE this step completed?
                        const prevCompleted = idx > 0 && step.id <= currentStep;

                        return (
                            <React.Fragment key={step.id}>
                                {/* ── Connector Line ── */}
                                {idx > 0 && (
                                    <div className={`w-8 sm:w-10 h-[2px] shrink-0 rounded-full relative overflow-hidden ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}>
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-full"
                                            style={{ backgroundColor: prevCompleted ? '#10b981' : 'transparent' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: prevCompleted ? '100%' : '0%' }}
                                            transition={{ duration: 0.5, delay: idx * 0.05, ease: 'easeOut' }}
                                        />
                                    </div>
                                )}

                                {/* ── Step Node ── */}
                                <motion.div
                                    whileHover={isClickable ? { scale: 1.06 } : {}}
                                    whileTap={isClickable ? { scale: 0.96 } : {}}
                                    data-step={step.id}
                                    onClick={() => isClickable && onStepClick(step.id)}
                                    title={isLocked ? `Complete Step ${step.id - 1} to unlock` : step.desc}
                                    className={`
                                        relative flex items-center gap-2.5 py-2 px-1.5 shrink-0 select-none transition-all duration-200 rounded-lg
                                        ${isClickable ? 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40' : isLocked ? 'cursor-not-allowed' : 'cursor-default'}
                                    `}
                                >
                                    {/* Icon bubble */}
                                    <div className="relative">
                                        {/* Active glow ring */}
                                        {isActive && (
                                            <motion.div
                                                className="absolute -inset-1.5 rounded-lg opacity-30"
                                                style={{ backgroundColor: primaryStr }}
                                                animate={{ opacity: [0.15, 0.3, 0.15] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            />
                                        )}
                                        <div
                                            className={`relative w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                isActive ? 'shadow-md' : ''
                                            }`}
                                            style={
                                                isActive
                                                    ? { background: primaryStr, color: 'white', boxShadow: `0 2px 12px ${primaryStr}50` }
                                                    : isCompleted && isUnlocked
                                                        ? { background: isDarkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}` }
                                                        : { background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }
                                            }
                                        >
                                            {isLocked
                                                ? <Lock className={`w-3 h-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                                : isCompleted
                                                    ? <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                                                    : isActive
                                                        ? <span className="text-[11px] font-bold text-white">{step.id}</span>
                                                        : <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{step.id}</span>
                                            }
                                        </div>
                                    </div>

                                    {/* Text */}
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors ${isActive
                                            ? isDarkMode ? 'text-white' : 'text-slate-900'
                                            : isCompleted && isUnlocked
                                                ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                : isLocked
                                                    ? isDarkMode ? 'text-slate-600' : 'text-slate-400'
                                                    : isDarkMode ? 'text-slate-300' : 'text-slate-600'
                                            }`}>
                                            {step.title}
                                        </span>
                                        {isActive && (
                                            <span className="text-[9px] font-bold tracking-widest whitespace-nowrap uppercase" style={{ color: primaryStr }}>
                                                In Progress
                                            </span>
                                        )}
                                        {isCompleted && isUnlocked && (
                                            <span className={`text-[9px] font-semibold tracking-wider ${isDarkMode ? 'text-emerald-500/70' : 'text-emerald-500/60'}`}>
                                                COMPLETE ✓
                                            </span>
                                        )}
                                        {isLocked && (
                                            <span className={`text-[9px] font-semibold tracking-wider ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                LOCKED
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            </React.Fragment>
                        );
                    })}
                </div>

                <ArrowBtn onClick={scrollRight} dir="right" isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

export default Stepper;
