import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, X, Sparkles, Stethoscope
} from 'lucide-react';

// ─── localStorage key ────────────────────────────────────────────────────────
const TOUR_KEY = 'healthai_tour_seen_v3';

// ─── Dr. Dandelion — Pixel Art (SVG, dark hair) ──────────────────────────────
const DrDandelion = ({ pose = 'wave', size = 64 }) => {
    // 14x16 pixel grid rendered as SVG
    const px = size / 16;

    const C = {
        hair: '#3B2314',   // dark brown hair
        skin: '#FFCD94',
        eye: '#1a1a1a',
        coat: '#FFFFFF',
        coatS: '#E0E0E0',
        steth: '#6C5CE7',
        mouth: '#E17055',
        cheek: '#FABB9E',
        pants: '#2c5ea8',
        shoe: '#222222',
        clip: '#B2BEC3',
    };

    // Build pixels as an array of {x,y,color}
    const pixels = [];
    const put = (x, y, c) => pixels.push({ x, y, c });

    // Hair (rows 0-2)
    for (let x = 5; x <= 9; x++) put(x, 0, C.hair);
    for (let x = 4; x <= 10; x++) put(x, 1, C.hair);
    put(3, 2, C.hair); put(4, 2, C.hair); put(10, 2, C.hair); put(11, 2, C.hair);

    // Face (rows 2-6)
    for (let x = 5; x <= 9; x++) put(x, 2, C.skin);
    for (let x = 4; x <= 10; x++) put(x, 3, C.skin);
    for (let x = 4; x <= 10; x++) put(x, 4, C.skin);
    for (let x = 5; x <= 9; x++) put(x, 5, C.skin);

    // Eyes (row 3)
    put(5, 3, C.eye); put(6, 3, C.eye);
    put(8, 3, C.eye); put(9, 3, C.eye);

    // Cheeks (row 4)
    put(4, 4, C.cheek); put(10, 4, C.cheek);

    // Mouth (row 5)
    put(7, 5, C.mouth); put(8, 5, C.mouth);

    // Coat (rows 6-12)
    for (let y = 6; y <= 11; y++) {
        for (let x = 4; x <= 10; x++) put(x, y, C.coat);
    }
    // Wider shoulders
    put(3, 7, C.coat); put(3, 8, C.coat);
    put(11, 7, C.coat); put(11, 8, C.coat);

    // Coat shadow/lapels
    put(4, 6, C.coatS); put(4, 7, C.coatS);
    put(10, 6, C.coatS); put(10, 7, C.coatS);
    // Center line
    put(7, 7, C.coatS); put(7, 8, C.coatS); put(7, 9, C.coatS); put(7, 10, C.coatS);

    // Stethoscope
    put(5, 7, C.steth); put(5, 8, C.steth); put(6, 8, C.steth);

    // Arms based on pose
    if (pose === 'wave') {
        // Left arm down
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        // Right arm waving up
        put(11, 7, C.skin); put(12, 6, C.skin); put(12, 5, C.skin); put(13, 4, C.skin);
    } else if (pose === 'point') {
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        put(11, 8, C.skin); put(12, 8, C.skin); put(13, 8, C.skin);
    } else if (pose === 'think') {
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        put(11, 8, C.skin); put(11, 7, C.skin); put(10, 5, C.skin);
    } else {
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        put(11, 8, C.skin); put(11, 9, C.skin); put(11, 10, C.skin);
    }

    // Pants (rows 12-13)
    for (let x = 5; x <= 6; x++) { put(x, 12, C.pants); put(x, 13, C.pants); }
    for (let x = 8; x <= 9; x++) { put(x, 12, C.pants); put(x, 13, C.pants); }

    // Shoes (row 14)
    put(4, 14, C.shoe); put(5, 14, C.shoe); put(6, 14, C.shoe);
    put(8, 14, C.shoe); put(9, 14, C.shoe); put(10, 14, C.shoe);

    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
            {pixels.map((p, i) => (
                <rect key={i} x={p.x} y={p.y} width="1" height="1" fill={p.c} />
            ))}
        </svg>
    );
};

// ─── Tour Steps ──────────────────────────────────────────────────────────────
const STEPS = [
    {
        id: 0,
        targetId: null,
        pose: 'wave',
        title: 'Good day! I\'m Dr. Dandelion 🩺',
        body: 'Welcome to healthML — your clinical AI learning environment. I\'m a physician who specializes in medical informatics, and I\'ll be guiding you through this diagnostic platform. Together, we\'ll explore how Machine Learning can support clinical decision-making — no programming knowledge required.',
        sub: 'This brief orientation takes about 20 seconds. Let me show you around the ward.',
        position: 'center',
    },
    {
        id: 1,
        targetId: 'tour-sidebar',
        pose: 'point',
        title: 'Your Clinical Departments',
        body: 'This is your department roster — Cardiology, Nephrology, Oncology, and 17 other specialties. Selecting a department loads its specific patient dataset, adapts the clinical scenario, and configures the entire ML pipeline for that domain. Think of it as choosing which ward we\'re rounding on.',
        sub: 'You can switch departments anytime, but it resets your progress — just like transferring a patient case.',
        position: 'right-of',
    },
    {
        id: 2,
        targetId: 'tour-thermometer',
        pose: 'think',
        title: 'Your Progress Thermometer',
        body: 'This thermometer on the right tracks your journey through the 7-step clinical ML protocol — from initial Context all the way to Ethics & Bias review. As you complete each step, the liquid rises. I\'ll be walking alongside it, keeping pace with your progress.',
        sub: 'Each step unlocks sequentially. Thorough and methodical — just how we practice medicine.',
        position: 'left-of',
    },
    {
        id: 3,
        targetId: 'tour-bottom-dock',
        pose: 'point',
        title: 'Navigation Controls',
        body: 'This dock at the bottom is your quick-navigation panel. The dots represent each of the 7 steps — click any completed step to revisit it. Use the arrows to move forward and back. The sidebar below also has reset, home, and theme controls.',
        sub: 'Going back to a previous step will require you to redo subsequent ones — maintaining data integrity throughout your analysis.',
        position: 'above',
    },
    {
        id: 4,
        targetId: null,
        pose: 'wave',
        title: 'You\'re Cleared for Rounds! 🎓',
        body: 'Excellent — orientation complete. You\'re welcome to begin exploring at your own pace. Start with Step 1 to read the clinical scenario for your chosen specialty, then work through each phase of the diagnostic pipeline. The complete protocol takes about 45 minutes.',
        sub: 'I\'ll be around if you need me — look for me perched on the thermometer. Best of luck, colleague!',
        position: 'center',
    },
];

// ─── Spotlight Overlay ────────────────────────────────────────────────────────
const SpotlightOverlay = ({ targetRect }) => {
    if (!targetRect) {
        return (
            <motion.div
                key="overlay-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/70"
            />
        );
    }

    const pad = 12;
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
                background: `radial-gradient(ellipse ${w + 80}px ${h + 80}px at ${x + w / 2}px ${y + h / 2}px, transparent 40%, rgba(0,0,0,0.78) 70%)`,
            }}
        />
    );
};

// ─── Highlight Ring ───────────────────────────────────────────────────────────
const HighlightRing = ({ targetRect }) => {
    if (!targetRect) return null;
    const pad = 12;
    return (
        <motion.div
            key={`ring-${targetRect.top}-${targetRect.left}`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[205] pointer-events-none rounded-2xl"
            style={{
                top: targetRect.top - pad,
                left: targetRect.left - pad,
                width: targetRect.width + pad * 2,
                height: targetRect.height + pad * 2,
                boxShadow: '0 0 0 3px rgba(108,92,231,0.45)',
                border: '2px solid rgba(108,92,231,0.35)',
            }}
        />
    );
};

// ─── Tooltip Card ─────────────────────────────────────────────────────────────
const TooltipCard = ({
    step, totalSteps, onNext, onPrev, onSkip, isDarkMode,
    targetRect, position
}) => {
    // Position the tooltip relative to the target
    const getStyle = () => {
        const tipW = 400;

        // Centered (no target)
        if (!targetRect || position === 'center') {
            return {
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: `${tipW}px`, width: 'calc(100vw - 48px)',
            };
        }

        const gap = 20;

        if (position === 'right-of') {
            // To the right of the sidebar
            return {
                top: `${Math.max(16, targetRect.top + targetRect.height / 2 - 150)}px`,
                left: `${targetRect.right + gap}px`,
                width: `${tipW}px`,
            };
        }

        if (position === 'left-of') {
            // To the left of the thermometer
            return {
                top: `${Math.max(16, targetRect.top + targetRect.height / 2 - 150)}px`,
                left: `${Math.max(16, targetRect.left - tipW - gap)}px`,
                width: `${tipW}px`,
            };
        }

        if (position === 'above') {
            // Above the bottom dock
            const left = Math.max(16, Math.min(
                targetRect.left + targetRect.width / 2 - tipW / 2,
                window.innerWidth - tipW - 16
            ));
            return {
                top: `${targetRect.top - 280 - gap}px`,
                left: `${left}px`,
                width: `${tipW}px`,
            };
        }

        // Fallback: below
        return {
            top: `${targetRect.bottom + gap}px`,
            left: `${Math.max(16, targetRect.left)}px`,
            width: `${tipW}px`,
        };
    };

    const isFirst = step.id === 0;
    const isLast = step.id === totalSteps - 1;

    // Doctor peek position
    const getDoctorPosition = () => {
        if (position === 'right-of') return { position: 'absolute', left: -20, bottom: 8, zIndex: 10 };
        if (position === 'left-of') return { position: 'absolute', right: -20, bottom: 8, zIndex: 10 };
        if (position === 'above') return { position: 'absolute', right: 12, bottom: -20, zIndex: 10 };
        // center
        return { position: 'absolute', right: -8, bottom: -16, zIndex: 10 };
    };

    // Card colors
    const cardBg = isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white';
    const cardBorder = isDarkMode ? 'border-[#2c2c2e]' : 'border-slate-200';
    const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
    const bodyColor = isDarkMode ? 'text-slate-300' : 'text-slate-600';
    const subColor = isDarkMode ? 'text-slate-500' : 'text-slate-400';
    const closeBtnColor = isDarkMode ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600';
    const backBtnColor = isDarkMode ? 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700';
    const dotInactive = isDarkMode ? 'bg-slate-700' : 'bg-slate-200';

    return (
        <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed z-[210] rounded-2xl border shadow-2xl overflow-visible ${cardBg} ${cardBorder}`}
            style={getStyle()}
        >
            {/* Top gradient bar */}
            <div className="h-1.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #6C5CE7, #A78BFA, #C8F560)' }} />

            {/* Dr. Dandelion peeking */}
            <motion.div
                style={getDoctorPosition()}
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 350, damping: 14 }}
            >
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                    <DrDandelion pose={step.pose} size={56} />
                </motion.div>
            </motion.div>

            <div className="p-6 pr-12">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#6C5CE7]/15">
                            <Stethoscope className="w-4 h-4 text-[#6C5CE7]" />
                        </div>
                        <h3 className={`font-bold text-[15px] leading-tight ${titleColor}`}>
                            {step.title}
                        </h3>
                    </div>
                    <button onClick={onSkip} className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${closeBtnColor}`} title="Skip tour">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Body */}
                <p className={`text-[13px] leading-[1.75] mb-2.5 ${bodyColor}`}>
                    {step.body}
                </p>
                <p className={`text-[12px] leading-relaxed mb-5 italic ${subColor}`}>
                    — Dr. Dandelion: &ldquo;{step.sub}&rdquo;
                </p>

                {/* Progress + nav */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ width: i === step.id ? 20 : 6, opacity: i === step.id ? 1 : i < step.id ? 0.5 : 0.25 }}
                                transition={{ duration: 0.3 }}
                                className={`h-1.5 rounded-full ${i <= step.id ? 'bg-[#6C5CE7]' : dotInactive}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <button
                                onClick={onPrev}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${backBtnColor}`}
                            >
                                <ArrowLeft className="w-3 h-3" /> Back
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors text-white"
                            style={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)' }}
                        >
                            {isLast ? (
                                <>Begin Rounds! <Sparkles className="w-3 h-3" /></>
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

// ─── Main OnboardingTour Component ────────────────────────────────────────────
const OnboardingTour = ({ isDarkMode }) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [visible, setVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(TOUR_KEY);
        const isMobile = window.innerWidth < 1024;
        if (!seen && !isMobile) {
            const t = setTimeout(() => setVisible(true), 1400);
            return () => clearTimeout(t);
        }
    }, []);

    useEffect(() => {
        const handleRestart = (e) => {
            if (e.detail?.step === 1) {
                localStorage.removeItem(TOUR_KEY);
                setStepIdx(0);
                setVisible(true);
            }
        };
        window.addEventListener('restart-step-tour', handleRestart);
        return () => window.removeEventListener('restart-step-tour', handleRestart);
    }, []);

    // Measure target element on step change
    useEffect(() => {
        if (!visible) return;
        const currentStep = STEPS[stepIdx];

        if (!currentStep.targetId) {
            setTargetRect(null);
            setReady(true);
            return;
        }

        const t1 = setTimeout(() => setReady(false), 0);

        const measure = () => {
            clearTimeout(t1);
            const el = document.getElementById(currentStep.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top, left: rect.left,
                    width: rect.width, height: rect.height,
                    bottom: rect.bottom, right: rect.right,
                });
            } else {
                setTargetRect(null);
            }
            setReady(true);
        };

        const t = setTimeout(measure, 150);
        return () => { clearTimeout(t); clearTimeout(t1); };
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
        if (stepIdx < STEPS.length - 1) setStepIdx(s => s + 1);
        else dismiss();
    };

    const handlePrev = () => {
        if (stepIdx > 0) setStepIdx(s => s - 1);
    };

    const currentStep = STEPS[stepIdx];

    return (
        <AnimatePresence>
            {visible && ready && (
                <>
                    <SpotlightOverlay targetRect={targetRect} isDarkMode={isDarkMode} />

                    <AnimatePresence mode="wait">
                        <HighlightRing key={stepIdx} targetRect={targetRect} />
                    </AnimatePresence>

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

                    {!targetRect && (
                        <div className="fixed inset-0 z-[208]" onClick={e => e.stopPropagation()} />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Helper: reset tour (for dev/testing) ─────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export const resetTour = () => localStorage.removeItem(TOUR_KEY);

export default OnboardingTour;
