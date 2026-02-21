import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const ArrowBtn = ({ onClick, dir, isDarkMode }) => (
    <button
        onClick={onClick}
        type="button"
        className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isDarkMode
            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/50'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'
            }`}
    >
        {dir === 'left' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
    </button>
);

const STEPS = [
    { id: 1, title: 'Clinical Context', desc: 'Use case & goals', color: '#06b6d4' },
    { id: 2, title: 'Data Exploration', desc: 'Upload & understand', color: '#8b5cf6' },
    { id: 3, title: 'Data Preparation', desc: 'Clean & split data', color: '#f59e0b' },
    { id: 4, title: 'Model & Parameters', desc: 'Select & tune', color: '#6366f1' },
    { id: 5, title: 'Results', desc: 'Metrics & matrix', color: '#10b981' },
    { id: 6, title: 'Explainability', desc: 'Why this prediction?', color: '#f97316' },
    { id: 7, title: 'Ethics & Bias', desc: 'Fairness check', color: '#ec4899' },
];

const Stepper = ({ currentStep = 1, isDarkMode, maxUnlockedStep = 1, onStepClick }) => {
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
        <div id="stepper-bar" className={`rounded-2xl border overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#0C1428]/75 border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl' : 'bg-white/75 border-slate-200/80 shadow-lg backdrop-blur-2xl'}`}>
            {/* Top progress bar */}
            <div className={`h-[3px] ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #10b981, #6366f1, #7c3aed)' }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* Steps row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-3">
                <ArrowBtn onClick={scrollLeft} dir="left" isDarkMode={isDarkMode} />

                <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1">
                    {STEPS.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const isUnlocked = step.id <= maxUnlockedStep;
                        const isLocked = !isUnlocked;
                        const isClickable = isUnlocked && !isActive && onStepClick;

                        return (
                            <React.Fragment key={step.id}>
                                {idx > 0 && (
                                    <div className={`w-6 h-[2px] shrink-0 rounded-full transition-all duration-500 ${isCompleted && isUnlocked ? 'bg-emerald-500' : isDarkMode ? 'bg-white/8' : 'bg-slate-100'}`} />
                                )}

                                <motion.div
                                    data-step={step.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: isLocked ? 0.4 : 1, y: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    onClick={() => isClickable && onStepClick(step.id)}
                                    title={isLocked ? `Complete Step ${step.id - 1} to unlock` : step.desc}
                                    className={`
                                        relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 shrink-0 select-none
                                        ${isActive
                                            ? isDarkMode ? 'bg-slate-800/80 border-white/[0.12] shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-white border-slate-200/80 shadow-md'
                                            : isCompleted && isUnlocked
                                                ? isDarkMode ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-100'
                                                : isDarkMode ? 'bg-white/[0.03] border-white/[0.05]' : 'bg-white/50 border-slate-100'}
                                        ${isClickable ? 'cursor-pointer hover:scale-[1.03] hover:shadow-md' : isLocked ? 'cursor-not-allowed' : 'cursor-default'}
                                    `}
                                >
                                    {/* Active glow ring */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="stepper-active"
                                            className="absolute inset-0 rounded-xl pointer-events-none"
                                            style={{ boxShadow: `0 0 0 1.5px ${step.color}50, 0 0 16px ${step.color}20` }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}

                                    {/* Icon bubble */}
                                    <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
                                        style={
                                            isActive
                                                ? { background: `linear-gradient(135deg, ${step.color}dd, ${step.color}88)`, boxShadow: `0 2px 8px ${step.color}40` }
                                                : isCompleted && isUnlocked
                                                    ? { background: 'rgba(16,185,129,0.15)' }
                                                    : { background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                                        }
                                    >
                                        {isLocked
                                            ? <Lock className="w-3 h-3 text-slate-500" />
                                            : isCompleted
                                                ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                : isActive
                                                    ? <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                                                    : <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{step.id}</span>
                                        }
                                    </div>

                                    {/* Text */}
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-bold tracking-wide whitespace-nowrap transition-colors ${isActive
                                            ? isDarkMode ? 'text-white' : 'text-slate-900'
                                            : isCompleted && isUnlocked
                                                ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                : isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                            }`}>
                                            {step.title}
                                        </span>
                                        {isActive && (
                                            <motion.span
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="text-[9px] font-semibold tracking-widest whitespace-nowrap"
                                                style={{ color: step.color }}
                                            >
                                                IN PROGRESS
                                            </motion.span>
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

                    {/* Step counter badge */}
                    <div className={`ml-3 shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${isDarkMode ? 'bg-slate-800/80 text-slate-400 border border-white/[0.06]' : 'bg-slate-100 text-slate-500'}`}>
                        {currentStep}/7
                    </div>
                </div>

                <ArrowBtn onClick={scrollRight} dir="right" isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

export default Stepper;
