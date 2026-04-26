import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles, Stethoscope } from 'lucide-react';

// ─── localStorage prefix ─────────────────────────────────────────────────────
const STEP_TOUR_PREFIX = 'healthai_step_tour_';

// ─── Dr. Dandelion — Pixel Art (SVG, dark hair) ──────────────────────────────
const DrDandelion = ({ pose = 'wave', size = 56 }) => {
    const pixels = [];
    const put = (x, y, c) => pixels.push({ x, y, c });

    const C = {
        hair: '#3B2314', skin: '#FFCD94', eye: '#1a1a1a',
        coat: '#FFFFFF', coatS: '#E0E0E0', steth: '#6C5CE7',
        mouth: '#E17055', cheek: '#FABB9E', pants: '#2c5ea8', shoe: '#222',
    };

    // Hair
    for (let x = 5; x <= 9; x++) put(x, 0, C.hair);
    for (let x = 4; x <= 10; x++) put(x, 1, C.hair);
    put(3, 2, C.hair); put(4, 2, C.hair); put(10, 2, C.hair); put(11, 2, C.hair);
    // Face
    for (let x = 5; x <= 9; x++) put(x, 2, C.skin);
    for (let x = 4; x <= 10; x++) put(x, 3, C.skin);
    for (let x = 4; x <= 10; x++) put(x, 4, C.skin);
    for (let x = 5; x <= 9; x++) put(x, 5, C.skin);
    // Eyes
    put(5, 3, C.eye); put(6, 3, C.eye); put(8, 3, C.eye); put(9, 3, C.eye);
    // Cheeks & mouth
    put(4, 4, C.cheek); put(10, 4, C.cheek);
    put(7, 5, C.mouth); put(8, 5, C.mouth);
    // Coat
    for (let y = 6; y <= 11; y++) for (let x = 4; x <= 10; x++) put(x, y, C.coat);
    put(3, 7, C.coat); put(3, 8, C.coat); put(11, 7, C.coat); put(11, 8, C.coat);
    put(4, 6, C.coatS); put(4, 7, C.coatS); put(10, 6, C.coatS); put(10, 7, C.coatS);
    put(7, 7, C.coatS); put(7, 8, C.coatS); put(7, 9, C.coatS); put(7, 10, C.coatS);
    put(5, 7, C.steth); put(5, 8, C.steth); put(6, 8, C.steth);
    // Arms
    if (pose === 'wave') {
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        put(12, 6, C.skin); put(12, 7, C.skin); put(13, 5, C.skin);
    } else if (pose === 'point') {
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        put(12, 8, C.skin); put(13, 8, C.skin); put(14, 8, C.skin);
    } else {
        put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
        put(11, 8, C.skin); put(11, 9, C.skin); put(11, 10, C.skin);
    }
    // Pants & shoes
    for (let x = 5; x <= 6; x++) { put(x, 12, C.pants); put(x, 13, C.pants); }
    for (let x = 8; x <= 9; x++) { put(x, 12, C.pants); put(x, 13, C.pants); }
    put(4, 14, C.shoe); put(5, 14, C.shoe); put(6, 14, C.shoe);
    put(8, 14, C.shoe); put(9, 14, C.shoe); put(10, 14, C.shoe);

    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
            {pixels.map((p, i) => <rect key={i} x={p.x} y={p.y} width="1" height="1" fill={p.c} />)}
        </svg>
    );
};

// ─── Calculate best tooltip position ─────────────────────────────────────────
const calcTooltipStyle = (targetRect, preferredPos, tipW = 360, tipH = 220) => {
    if (!targetRect) {
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: `${tipW}px`, width: 'calc(100vw - 48px)' };
    }

    const gap = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;

    // Helper to clamp
    const clampX = (x) => Math.max(pad, Math.min(x, vw - tipW - pad));
    const clampY = (y) => Math.max(pad, Math.min(y, vh - tipH - pad));

    // Try preferred position, fall back to alternatives
    const positions = [preferredPos, 'below', 'above', 'right', 'left'];

    for (const pos of positions) {
        if (pos === 'below') {
            const top = targetRect.bottom + gap;
            if (top + tipH < vh - pad) {
                return { top: `${top}px`, left: `${clampX(targetRect.left + targetRect.width / 2 - tipW / 2)}px`, width: `${tipW}px` };
            }
        }
        if (pos === 'above') {
            const top = targetRect.top - tipH - gap;
            if (top > pad) {
                return { top: `${top}px`, left: `${clampX(targetRect.left + targetRect.width / 2 - tipW / 2)}px`, width: `${tipW}px` };
            }
        }
        if (pos === 'right') {
            const left = targetRect.right + gap;
            if (left + tipW < vw - pad) {
                return { top: `${clampY(targetRect.top + targetRect.height / 2 - tipH / 2)}px`, left: `${left}px`, width: `${tipW}px` };
            }
        }
        if (pos === 'left') {
            const left = targetRect.left - tipW - gap;
            if (left > pad) {
                return { top: `${clampY(targetRect.top + targetRect.height / 2 - tipH / 2)}px`, left: `${left}px`, width: `${tipW}px` };
            }
        }
    }

    // Ultimate fallback: center
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: `${tipW}px`, width: 'calc(100vw - 48px)' };
};

// ─── Step Tour Component ─────────────────────────────────────────────────────
const StepTour = ({ stepNumber, steps, isDarkMode }) => {
    const storageKey = STEP_TOUR_PREFIX + stepNumber;
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(storageKey);
        if (!seen && window.innerWidth >= 1024) {
            const t = setTimeout(() => setVisible(true), 2000);
            return () => clearTimeout(t);
        }
    }, [storageKey]);

    useEffect(() => {
        const handleRestart = (e) => {
            if (e.detail?.step === stepNumber) {
                localStorage.removeItem(storageKey);
                setIdx(0);
                setVisible(true);
            }
        };
        window.addEventListener('restart-step-tour', handleRestart);
        return () => window.removeEventListener('restart-step-tour', handleRestart);
    }, [stepNumber, storageKey]);

    // Scroll target into view + measure
    useEffect(() => {
        if (!visible || !steps[idx]) return;
        const step = steps[idx];

        if (!step.targetId) {
            setTargetRect(null);
            setReady(true);
            return;
        }

        setReady(false);

        const scrollAndMeasure = () => {
            const el = document.getElementById(step.targetId);
            if (!el) { setTargetRect(null); setReady(true); return; }

            // Find the scrollable container (.app-layout)
            const scrollContainer = document.querySelector('.app-layout') || document.documentElement;

            // Scroll the element into the visible area of its scroll container
            const elRect = el.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const isAbove = elRect.top < containerRect.top + 40;
            const isBelow = elRect.bottom > containerRect.bottom - 40;

            if (isAbove || isBelow) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Wait for scroll to settle, then measure in viewport coordinates
            setTimeout(() => {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top, left: rect.left,
                    width: rect.width, height: rect.height,
                    bottom: rect.bottom, right: rect.right,
                });
                setReady(true);
            }, 500);
        };

        const t = setTimeout(scrollAndMeasure, 100);
        return () => clearTimeout(t);
    }, [idx, visible, steps]);

    // Resize handler
    useEffect(() => {
        if (!visible) return;
        const onResize = () => {
            const step = steps[idx];
            if (step?.targetId) {
                const el = document.getElementById(step.targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right });
                }
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [visible, idx, steps]);

    const dismiss = useCallback(() => {
        localStorage.setItem(storageKey, 'true');
        setVisible(false);
    }, [storageKey]);

    const handleNext = () => {
        if (idx < steps.length - 1) setIdx(i => i + 1);
        else dismiss();
    };
    const handlePrev = () => { if (idx > 0) setIdx(i => i - 1); };

    if (!visible || !ready || !steps[idx]) return null;

    const step = steps[idx];
    const isFirst = idx === 0;
    const isLast = idx === steps.length - 1;

    // Colors
    const cardBg = isDarkMode ? '#1c1c1e' : '#ffffff';
    const cardBorder = isDarkMode ? '#2c2c2e' : '#e2e8f0';
    const titleColor = isDarkMode ? '#fff' : '#0f172a';
    const bodyColor = isDarkMode ? '#cbd5e1' : '#475569';
    const subColor = isDarkMode ? '#64748b' : '#94a3b8';
    const dotInactiveBg = isDarkMode ? '#334155' : '#e2e8f0';
    const closeBtnHover = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9';

    // Spotlight cutout overlay
    const renderOverlay = () => {
        if (!targetRect) {
            return (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                }} />
            );
        }

        const p = 10; // padding around target
        const r = 16; // border-radius
        const x = targetRect.left - p;
        const y = targetRect.top - p;
        const w = targetRect.width + p * 2;
        const h = targetRect.height + p * 2;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}>
                <svg
                    width={vw}
                    height={vh}
                    viewBox={`0 0 ${vw} ${vh}`}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                >
                    <defs>
                        <mask id={`step-tour-mask-${idx}`}>
                            <rect x="0" y="0" width={vw} height={vh} fill="white" />
                            <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
                        </mask>
                    </defs>
                    <rect x="0" y="0" width={vw} height={vh} fill="rgba(0,0,0,0.65)" mask={`url(#step-tour-mask-${idx})`} />
                </svg>
                {/* Highlight ring — pure CSS fixed positioning */}
                <div style={{
                    position: 'fixed',
                    top: y - 2, left: x - 2,
                    width: w + 4, height: h + 4,
                    borderRadius: r + 2,
                    border: '2px solid rgba(108,92,231,0.45)',
                    boxShadow: '0 0 0 3px rgba(108,92,231,0.15)',
                    pointerEvents: 'none',
                }} />
            </div>
        );
    };

    const tooltipStyle = calcTooltipStyle(targetRect, step.position);

    return ReactDOM.createPortal(
        <>
            {/* Overlay with cutout */}
            <AnimatePresence>
                <motion.div
                    key={`overlay-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderOverlay()}
                </motion.div>
            </AnimatePresence>

            {/* Click blocker */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 208 }} onClick={e => e.stopPropagation()} />

            {/* Tooltip card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`tip-${idx}`}
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        position: 'fixed', zIndex: 210,
                        borderRadius: 16, overflow: 'visible',
                        backgroundColor: cardBg,
                        border: `1px solid ${cardBorder}`,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                        ...tooltipStyle,
                    }}
                >
                    {/* Gradient bar */}
                    <div style={{ height: 5, width: '100%', borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg, #6C5CE7, #A78BFA, #C8F560)' }} />

                    {/* Doctor peeking */}
                    <motion.div
                        style={{ position: 'absolute', right: -6, bottom: -10, zIndex: 10 }}
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 350, damping: 14 }}
                    >
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                            <DrDandelion pose={step.pose || 'point'} size={48} />
                        </motion.div>
                    </motion.div>

                    <div style={{ padding: '16px 48px 16px 16px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ padding: 6, borderRadius: 10, backgroundColor: 'rgba(108,92,231,0.12)' }}>
                                    <Stethoscope style={{ width: 14, height: 14, color: '#6C5CE7' }} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 14, color: titleColor, lineHeight: 1.3 }}>{step.title}</span>
                            </div>
                            <button
                                onClick={dismiss}
                                style={{
                                    all: 'unset', cursor: 'pointer', padding: 4, borderRadius: 8,
                                    color: subColor, display: 'flex', flexShrink: 0, marginLeft: 8,
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = closeBtnHover}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>

                        {/* Body */}
                        <p style={{ fontSize: 12, lineHeight: 1.7, color: bodyColor, marginBottom: 6 }}>{step.body}</p>
                        <p style={{ fontSize: 11, lineHeight: 1.5, color: subColor, fontStyle: 'italic', marginBottom: 14 }}>
                            — Dr. Dandelion: &ldquo;{step.sub}&rdquo;
                        </p>

                        {/* Progress + nav */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {steps.map((_, i) => (
                                    <div key={i} style={{
                                        width: i === idx ? 16 : 5, height: 5, borderRadius: 3,
                                        backgroundColor: i <= idx ? '#6C5CE7' : dotInactiveBg,
                                        opacity: i === idx ? 1 : i < idx ? 0.6 : 0.3,
                                        transition: 'all 0.3s',
                                    }} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {!isFirst && (
                                    <button onClick={handlePrev} style={{
                                        all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                        border: `1px solid ${cardBorder}`, color: subColor,
                                    }}>
                                        <ArrowLeft style={{ width: 12, height: 12 }} /> Back
                                    </button>
                                )}
                                <button onClick={handleNext} style={{
                                    all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                    color: '#fff', background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)',
                                }}>
                                    {isLast ? <>Got it! <Sparkles style={{ width: 12, height: 12 }} /></> : <>Next <ArrowRight style={{ width: 12, height: 12 }} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>,
        document.body
    );
};

export default StepTour;
