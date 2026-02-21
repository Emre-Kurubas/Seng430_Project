import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, X, Sparkles,
    MousePointerClick, Layers, LayoutList,
    HelpCircle, Sun, ChevronRight
} from 'lucide-react';

// ─── localStorage key ────────────────────────────────────────────────────────
const TOUR_KEY = 'healthai_tour_seen_v1';

// ─── Tour Steps Definition ────────────────────────────────────────────────────
// targetId: the DOM element ID to highlight (null = centered modal)
const STEPS = [
    {
        id: 0,
        targetId: null,
        icon: Sparkles,
        iconColor: 'text-indigo-400',
        iconBg: 'bg-indigo-500/20',
        title: 'Welcome to HEALTH-AI! 🎉',
        body: 'This interactive tool helps healthcare professionals understand how Artificial Intelligence and Machine Learning work in clinical settings — no coding required.',
        sub: 'Let\'s take a quick 30-second tour to get you oriented.',
        position: 'center',
    },
    {
        id: 1,
        targetId: 'domain-selector-bar',
        icon: Layers,
        iconColor: 'text-violet-400',
        iconBg: 'bg-violet-500/20',
        title: '1. Choose Your Specialty',
        body: 'Start by selecting a medical specialty from the scrollable bar above — Cardiology, Nephrology, Oncology and 17 more. The entire tool adapts to your chosen domain.',
        sub: 'You can change it any time, but it will reset your progress.',
        position: 'bottom',
    },
    {
        id: 2,
        targetId: 'stepper-bar',
        icon: LayoutList,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/20',
        title: '2. Follow the 7 Steps',
        body: 'The progress bar shows your journey through 7 guided steps — from Clinical Context all the way to Ethics & Bias. Steps unlock sequentially as you complete each one.',
        sub: 'Click any unlocked step to jump back and review.',
        position: 'bottom',
    },
    {
        id: 3,
        targetId: 'help-button',
        icon: HelpCircle,
        iconColor: 'text-sky-400',
        iconBg: 'bg-sky-500/20',
        title: '3. User Guide is Always There',
        body: 'The purple "Guide" button in the header opens a comprehensive reference — covering all specialties, AI models, performance metrics and a full glossary.',
        sub: 'Think of it as your always-available textbook.',
        position: 'bottom-left',
    },
    {
        id: 4,
        targetId: 'theme-toggle',
        icon: Sun,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/20',
        title: '4. Light or Dark Mode',
        body: 'Toggle between dark and light themes to suit your environment. Your preference is saved between sessions.',
        sub: 'We recommend dark mode for extended use. 🌙',
        position: 'bottom-left',
    },
    {
        id: 5,
        targetId: null,
        icon: MousePointerClick,
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/20',
        title: "You're all set! 🚀",
        body: 'Head to Step 1 to read the clinical context, then work through each step at your own pace. The whole workflow takes about 45 minutes.',
        sub: 'This tour will not appear again. You can always re-read the User Guide.',
        position: 'center',
    },
];

// ─── Spotlight Overlay ────────────────────────────────────────────────────────
const SpotlightOverlay = ({ targetRect, isDarkMode }) => {
    if (!targetRect) {
        return (
            <motion.div
                key="overlay-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            />
        );
    }

    const pad = 10;
    const x = targetRect.left - pad;
    const y = targetRect.top - pad;
    const w = targetRect.width + pad * 2;
    const h = targetRect.height + pad * 2;

    return (
        <motion.div
            key="overlay-spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{
                background: `radial-gradient(ellipse ${w + 60}px ${h + 60}px at ${x + w / 2}px ${y + h / 2}px, transparent 40%, rgba(0,0,0,0.78) 70%)`,
            }}
        />
    );
};

// ─── Tooltip Card ─────────────────────────────────────────────────────────────
const TooltipCard = ({
    step, totalSteps, onNext, onPrev, onSkip, isDarkMode,
    targetRect, position
}) => {
    const Icon = step.icon;

    // Calculate tooltip position
    const getStyle = () => {
        if (!targetRect || position === 'center') {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '420px',
                width: 'calc(100vw - 48px)',
            };
        }

        const pad = 18;
        const vw = window.innerWidth;
        const tipW = Math.min(380, vw - 40);

        let top = targetRect.bottom + pad + 10;
        let left = targetRect.left;

        if (position === 'bottom-left') {
            left = targetRect.right - tipW;
        }

        // Clamp horizontally
        left = Math.max(16, Math.min(left, vw - tipW - 16));

        // If too close to bottom, flip above
        if (top + 260 > window.innerHeight) {
            top = targetRect.top - 260 - pad;
        }

        return {
            top: `${top}px`,
            left: `${left}px`,
            width: `${tipW}px`,
        };
    };

    const isFirst = step.id === 0;
    const isLast = step.id === totalSteps - 1;

    return (
        <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed z-[210] rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode
                ? 'bg-[#0C1428]/95 border-white/10 shadow-black/60'
                : 'bg-white/97 border-slate-200 shadow-slate-300/60'
                }`}
            style={getStyle()}
        >
            {/* Top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500" />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${step.iconBg}`}>
                            <Icon className={`w-4 h-4 ${step.iconColor}`} />
                        </div>
                        <h3 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {step.title}
                        </h3>
                    </div>
                    <button
                        onClick={onSkip}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${isDarkMode ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        title="Skip tour"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Body */}
                <p className={`text-sm leading-relaxed mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {step.body}
                </p>
                <p className={`text-xs leading-relaxed mb-4 italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {step.sub}
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    width: i === step.id ? 20 : 6,
                                    opacity: i === step.id ? 1 : i < step.id ? 0.5 : 0.25,
                                }}
                                transition={{ duration: 0.3 }}
                                className={`h-1.5 rounded-full ${i <= step.id
                                    ? 'bg-indigo-500'
                                    : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <button
                                onClick={onPrev}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isDarkMode
                                    ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <ArrowLeft className="w-3 h-3" /> Back
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${isLast
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/30'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                                }`}
                        >
                            {isLast ? (
                                <>Let\'s go! <Sparkles className="w-3 h-3" /></>
                            ) : (
                                <>Next <ArrowRight className="w-3 h-3" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Highlight Ring ───────────────────────────────────────────────────────────
const HighlightRing = ({ targetRect }) => {
    if (!targetRect) return null;
    const pad = 10;
    return (
        <motion.div
            key={`${targetRect.top}-${targetRect.left}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[205] pointer-events-none rounded-2xl"
            style={{
                top: targetRect.top - pad,
                left: targetRect.left - pad,
                width: targetRect.width + pad * 2,
                height: targetRect.height + pad * 2,
                boxShadow: '0 0 0 3px rgba(99,102,241,0.8), 0 0 0 6px rgba(99,102,241,0.25)',
                border: '2px solid rgba(99,102,241,0.6)',
            }}
        />
    );
};

// ─── Main OnboardingTour Component ────────────────────────────────────────────
const OnboardingTour = ({ isDarkMode }) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [visible, setVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);
    const [ready, setReady] = useState(false);

    // Check localStorage on mount — only show if never seen before
    useEffect(() => {
        const seen = localStorage.getItem(TOUR_KEY);
        if (!seen) {
            // Small delay so the page renders first
            const t = setTimeout(() => setVisible(true), 1400);
            return () => clearTimeout(t);
        }
    }, []);

    // Measure target element on step change
    useEffect(() => {
        if (!visible) return;
        const currentStep = STEPS[stepIdx];
        setReady(false);

        if (!currentStep.targetId) {
            setTargetRect(null);
            setReady(true);
            return;
        }

        const measure = () => {
            const el = document.getElementById(currentStep.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right,
                });
                setReady(true);
            } else {
                // Element not found, skip to center
                setTargetRect(null);
                setReady(true);
            }
        };

        const t = setTimeout(measure, 120);
        return () => clearTimeout(t);
    }, [stepIdx, visible]);

    // Recalculate on resize
    useEffect(() => {
        if (!visible) return;
        const onResize = () => {
            const currentStep = STEPS[stepIdx];
            if (currentStep.targetId) {
                const el = document.getElementById(currentStep.targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right });
                }
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [visible, stepIdx]);

    const dismiss = () => {
        localStorage.setItem(TOUR_KEY, 'true');
        setVisible(false);
    };

    const handleNext = () => {
        if (stepIdx < STEPS.length - 1) {
            setStepIdx(s => s + 1);
        } else {
            dismiss();
        }
    };

    const handlePrev = () => {
        if (stepIdx > 0) setStepIdx(s => s - 1);
    };

    const currentStep = STEPS[stepIdx];

    return (
        <AnimatePresence>
            {visible && ready && (
                <>
                    {/* Overlay */}
                    <SpotlightOverlay targetRect={targetRect} isDarkMode={isDarkMode} />

                    {/* Highlight ring around target */}
                    <AnimatePresence mode="wait">
                        <HighlightRing key={stepIdx} targetRect={targetRect} />
                    </AnimatePresence>

                    {/* Tooltip */}
                    <AnimatePresence mode="wait">
                        <TooltipCard
                            key={stepIdx}
                            step={currentStep}
                            totalSteps={STEPS.length}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onSkip={dismiss}
                            isDarkMode={isDarkMode}
                            targetRect={targetRect}
                            position={currentStep.position}
                        />
                    </AnimatePresence>

                    {/* Backdrop click to skip (only on non-targeted steps) */}
                    {!targetRect && (
                        <div
                            className="fixed inset-0 z-[208]"
                            onClick={(e) => {
                                // Only skip if clicking outside tooltip
                                e.stopPropagation();
                            }}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Helper: check & reset tour (for dev/testing) ────────────────────────────
export const resetTour = () => localStorage.removeItem(TOUR_KEY);

export default OnboardingTour;
