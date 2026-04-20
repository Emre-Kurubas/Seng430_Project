import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft,
    Info, TrendingUp, Target, Shield, Activity, BarChart3,
    ChevronDown, ChevronUp, HelpCircle, Sparkles, Gauge,
    FlaskConical, Eye, Crosshair, Zap, RotateCcw
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';

/* ═══════════════════════════════════════════════════════════════
   Activity Ring — Apple Watch style
═══════════════════════════════════════════════════════════════ */
function ActivityRing({ progress, color, size = 100, stroke = 12, icon: Icon, delay = 0 }) {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={`${color}33`} strokeWidth={stroke} fill="none" />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, delay, type: 'spring', bounce: 0.2 }}
                />
            </svg>
            {Icon && <Icon size={size * 0.25} color={color} />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   ROC Curve SVG — Enhanced with gradient fill + animated path
═══════════════════════════════════════════════════════════════ */
const ROCCurve = React.memo(({ auc, isDarkMode, primaryStr }) => {
    const w = 300, h = 240, pad = 40;

    const curve = () => {
        const pts = [];
        for (let t = 0; t <= 1; t += 0.02) {
            const fpr = t;
            const tpr = Math.pow(t, Math.pow(2, 1 - auc * 2));
            const x = pad + fpr * (w - pad * 2);
            const y = h - pad - tpr * (h - pad * 2);
            pts.push(`${x},${y}`);
        }
        return `M${pad},${h - pad} ` + pts.map(p => `L${p}`).join(' ');
    };

    const axisColor = isDarkMode ? '#334155' : '#CBD5E1';
    const labelColor = isDarkMode ? '#64748b' : '#64748B';
    const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" style={{ maxHeight: 300 }}>
            {/* Grid */}
            {[0.25, 0.5, 0.75].map(v => (
                <React.Fragment key={v}>
                    <line x1={pad} y1={h - pad - v * (h - pad * 2)} x2={w - pad} y2={h - pad - v * (h - pad * 2)} stroke={gridColor} strokeWidth="1" />
                    <line x1={pad + v * (w - pad * 2)} y1={pad} x2={pad + v * (w - pad * 2)} y2={h - pad} stroke={gridColor} strokeWidth="1" />
                </React.Fragment>
            ))}

            {/* Axes */}
            <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={axisColor} strokeWidth="1.5" />
            <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={axisColor} strokeWidth="1.5" />

            {/* Diagonal (random) */}
            <line x1={pad} y1={h - pad} x2={w - pad} y2={pad} stroke={axisColor} strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />

            {/* AUC gradient fill */}
            <defs>
                <linearGradient id="aucGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryStr} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={primaryStr} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <path d={`${curve()} L${w - pad},${h - pad} Z`} fill="url(#aucGrad)" />

            {/* ROC curve — animated */}
            <motion.path
                d={curve()}
                fill="none" stroke={primaryStr} strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                filter={`drop-shadow(0 0 4px ${primaryStr}40)`}
            />

            {/* AUC Badge */}
            <rect x={w - pad - 64} y={pad + 4} width="66" height="22" rx="6"
                fill={isDarkMode ? `${primaryStr}20` : `${primaryStr}12`}
                stroke={primaryStr} strokeWidth="0.5" />
            <text x={w - pad - 31} y={pad + 19} textAnchor="middle" fontSize="10" fontWeight="700" fill={primaryStr}>
                AUC = {Number(auc).toFixed(2)}
            </text>

            {/* Axis labels */}
            <text x={w / 2} y={h - 6} textAnchor="middle" fontSize="9" fill={labelColor} fontFamily="Inter, sans-serif">FPR (1 − Specificity)</text>
            <text x={10} y={h / 2} textAnchor="middle" fontSize="9" fill={labelColor} fontFamily="Inter, sans-serif" transform={`rotate(-90, 10, ${h / 2})`}>TPR (Sensitivity)</text>

            {/* Corner labels */}
            <text x={pad - 4} y={pad - 4} textAnchor="end" fontSize="8" fill={labelColor}>1.0</text>
            <text x={pad - 4} y={h - pad + 2} textAnchor="end" fontSize="8" fill={labelColor}>0</text>
            <text x={w - pad} y={h - pad + 12} textAnchor="middle" fontSize="8" fill={labelColor}>1.0</text>
        </svg>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Animated Count-Up Hook
═══════════════════════════════════════════════════════════════ */
const useCountUp = (target, duration = 1200, delay = 0) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = null;
        let raf;
        const timeout = setTimeout(() => {
            const step = (ts) => {
                if (!start) start = ts;
                const progress = Math.min((ts - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.round(eased * target));
                if (progress < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }, delay);
        return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
    }, [target, duration, delay]);
    return count;
};

/* ═══════════════════════════════════════════════════════════════
   Old MetricCard removed, replaced by ActivityRing inline
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   Confusion Matrix Cell — iOS Card
═══════════════════════════════════════════════════════════════ */
const CMCell = React.memo(({ value, label, sub, type, isDarkMode, delay = 0 }) => {
    const animatedVal = useCountUp(value, 800, delay * 1000 + 300);
    const configs = {
        tp: { color: 'var(--ios-green)' },
        tn: { color: 'var(--text-main)' },
        fp: { color: 'var(--ios-blue)' },
        fn: { color: 'var(--ios-red)' },
    };
    const cfg = configs[type];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            className="ios-card" style={{ textAlign: 'center', margin: 0 }}
        >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: cfg.color }}>{animatedVal}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{sub}</div>
        </motion.div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Collapsible Info Row — for clinical reference
═══════════════════════════════════════════════════════════════ */
const InfoRow = React.memo(({ measure, meaning, concern, isDarkMode, value }) => {
    const [open, setOpen] = useState(false);
    const warn = value !== undefined && value < concern?.threshold;
    return (
        <div className={'border-b last:border-0 ' + (isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
            <button
                onClick={() => setOpen(o => !o)}
                className={'w-full flex items-center justify-between px-5 py-3.5 text-left group transition-colors '
                    + (isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50')}
            >
                <div className="flex items-center gap-2.5">
                    {warn && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    <span className={'text-sm font-semibold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{measure}</span>
                    {value !== undefined && (
                        <span className={'text-xs font-bold px-2 py-0.5 rounded-lg ' + (warn
                            ? isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'
                            : isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 bg-white border border-slate-200 shadow-md'
                        )}>{Math.round(value * 100)}%</span>
                    )}
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className={'w-4 h-4 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')} />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={'px-5 pb-4 text-sm leading-relaxed space-y-1.5 ' + (isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                            <p>{meaning}</p>
                            {concern && (
                                <p className={'text-xs ' + (warn ? 'text-red-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                    ⚡ {concern.text}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const ResultsEvaluation = ({ isDarkMode, onNext, onPrev, onGoToStep, trainedModelResult, domain }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';


    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(50);

    useEffect(() => {
        const t = setTimeout(() => {
            if (trainedModelResult) setResults(trainedModelResult);
            setLoading(false);
        }, 400);
        return () => clearTimeout(t);
    }, [trainedModelResult]);

    const getThresholdMetrics = (t, base) => {
        if (!base) return { sens: 0, spec: 0, prec: 0, tp: 0, fp: 0, tn: 0, fn: 0 };
        
        // If we don't have raw probability arrays, fallback to standard output
        if (!base.rawProbabilities || !base.rawTrue) {
            return {
                sens: base.sensitivity ?? 0,
                spec: base.specificity ?? 0,
                prec: base.precision ?? 0,
                tp: base.tp ?? 0,
                fp: base.fp ?? 0,
                tn: base.tn ?? 0,
                fn: base.fn ?? 0
            };
        }

        const thresholdValue = t / 100;
        let tp = 0, tn = 0, fp = 0, fn = 0;

        for (let i = 0; i < base.rawTrue.length; i++) {
            const actual = base.rawTrue[i];
            const predicted = base.rawProbabilities[i] >= thresholdValue ? 1 : 0;
            
            if (actual === 1 && predicted === 1) tp++;
            else if (actual === 0 && predicted === 0) tn++;
            else if (actual === 0 && predicted === 1) fp++;
            else if (actual === 1 && predicted === 0) fn++;
        }

        const sens = tp / ((tp + fn) || 1);
        const spec = tn / ((tn + fp) || 1);
        const prec = tp / ((tp + fp) || 1);

        return { 
            sens: parseFloat(sens.toFixed(2)), 
            spec: parseFloat(spec.toFixed(2)), 
            prec: parseFloat(prec.toFixed(2)),
            tp, fp, tn, fn
        };
    };

    const thresholdMetrics = useMemo(() => getThresholdMetrics(threshold, results), [threshold, results]);
    const lowSensitivity = thresholdMetrics.sens < 0.50;
    const lowSpecificity = thresholdMetrics.spec < 0.50;
    
    // Toast State
    const [toastMessage, setToastMessage] = useState(null);

    const handleRetrain = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setToastMessage("Model successfully re-optimized with current parameters.");
            setTimeout(() => setToastMessage(null), 3000);
        }, 800);
    };

    const metricIcons = [Target, Eye, Shield, Crosshair, Zap, TrendingUp];
    const metricColors = [primaryStr, '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6', secondaryStr];

    const metrics = useMemo(() => results ? [
        { label: 'Accuracy', value: results?.accuracy ?? 0, concern: 0.60, desc: 'Overall correct predictions', interpretation: 'Reliability: How often the AI is correct across all patients.', delay: 0.05, icon: metricIcons[0], color: metricColors[0] },
        { label: 'Sensitivity', value: results?.sensitivity ?? 0, concern: 0.60, desc: 'Catch rate for real cases', interpretation: 'Safety: Of patients readmitted, how many were caught?', delay: 0.10, star: true, icon: metricIcons[1], color: metricColors[1] },
        { label: 'Specificity', value: results?.specificity ?? 0, concern: 0.60, desc: 'Avoids false alarms', interpretation: 'Accuracy in identifying healthy patients as safe.', delay: 0.15, icon: metricIcons[2], color: metricColors[2] },
        { label: 'Precision', value: results?.precision ?? 0, concern: 0.60, desc: 'Confidence in flagged cases', interpretation: 'Trust: If it flags a patient, how often is it right?', delay: 0.20, icon: metricIcons[3], color: metricColors[3] },
        { label: 'F1 Score', value: results?.f1Score ?? 0, concern: 0.60, desc: 'Balanced measure', interpretation: 'Utility: Balance between missing cases and false alarms.', delay: 0.25, icon: metricIcons[4], color: metricColors[4] },
        { label: 'AUC-ROC', value: results?.auc ?? 0.5, concern: 0.60, desc: 'Discrimination ability', interpretation: 'Power: Ability to separate high-risk from low-risk.', delay: 0.30, icon: metricIcons[5], color: metricColors[5] },
    ] : [], [results]);

    const tableRows = useMemo(() => results ? [
        { measure: 'Accuracy', meaning: 'Out of all test patients, what percentage did the AI classify correctly?', concern: { threshold: 0.65, text: 'Below 65% — the model is not performing reliably.' }, value: results?.accuracy ?? 0 },
        { measure: '⭐ Sensitivity', meaning: 'Of patients who WERE readmitted (or had the condition), how many did the AI catch? This is the most important measure for any screening task.', concern: { threshold: 0.70, text: 'Below 70% — the model is missing too many real cases.' }, value: results?.sensitivity ?? 0 },
        { measure: 'Specificity', meaning: 'Of patients who were NOT readmitted, how many did the AI correctly identify as safe?', concern: { threshold: 0.65, text: 'Below 65% — too many unnecessary follow-up actions.' }, value: results?.specificity ?? 0 },
        { measure: 'Precision', meaning: 'Of all patients the AI flagged as high-risk, how many actually were high-risk?', concern: { threshold: 0.60, text: 'Below 60% — many false alarms, wasting clinical resources.' }, value: results?.precision ?? 0 },
        { measure: 'F1 Score', meaning: 'A combined score balancing Sensitivity and Precision. Useful when both missing cases and false alarms have real costs.', concern: { threshold: 0.65, text: 'Below 65% — the model struggles to balance catching cases and avoiding false alarms.' }, value: results?.f1Score ?? 0 },
        { measure: 'AUC-ROC', meaning: 'A 0.5–1.0 score for how well the model separates high-risk from low-risk patients. 0.5 = random; 1.0 = perfect.', concern: { threshold: 0.75, text: 'Below 0.75 — the model cannot reliably distinguish between patient groups.' }, value: results?.auc ?? 0.5 },
    ] : [], [results]);

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-20">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-8">
                {/* ═══════════════ HEADER ═══════════════ */}
                <motion.div variants={itemAnim} className="mb-2 relative flex justify-center items-center h-12">
                    <motion.p 
                        className="hero-subtitle" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        style={{ margin: 0, textTransform: 'capitalize' }}
                    >
                        Evaluation — {results?.modelName || 'Selected Model'}
                    </motion.p>
                    {results && (
                        <motion.button
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            onClick={handleRetrain}
                            className={'absolute right-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors '
                                + (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retrain
                        </motion.button>
                    )}
                </motion.div>

                {/* ── Toast Notification ── */}
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border text-sm font-semibold"
                            style={{ 
                                backgroundColor: isDarkMode ? '#1e293b' : 'white',
                                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                color: isDarkMode ? '#cbd5e1' : '#475569'
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {toastMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Dynamic Decision Warnings ── */}
                <AnimatePresence>
                    {!loading && (lowSensitivity || lowSpecificity) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <div className={'flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-bold rounded-full w-fit mx-auto border '
                                + (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>
                                    {lowSensitivity && lowSpecificity 
                                        ? "Critical setup: The current threshold severely damages both detection rates and false alarm rates."
                                        : lowSensitivity 
                                            ? `Low sensitivity detected (${Math.round(thresholdMetrics.sens*100)}%): The chosen threshold makes the model miss a majority of actual risk cases.`
                                            : `Low specificity detected (${Math.round(thresholdMetrics.spec*100)}%): The model flags an unreasonable number of false positive alarms.`
                                    }
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Loading State ── */}
                {loading && (
                    <div className={'relative rounded-3xl border p-16 flex flex-col items-center justify-center gap-5 overflow-hidden '
                        + (isDarkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200 shadow-md')}>
                        <div className="relative w-16 h-16">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 rounded-full border-[3px] border-t-transparent"
                                style={{ borderColor: `${primaryStr}20`, borderTopColor: primaryStr }}
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-2 rounded-full border-[3px] border-b-transparent"
                                style={{ borderColor: `${secondaryStr}20`, borderBottomColor: secondaryStr }}
                            />
                            <Gauge className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5" style={{ color: primaryStr }} />
                        </div>
                        <p className={'text-sm font-medium ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            Evaluating model on test patients…
                        </p>
                    </div>
                )}

                {results && (
                    <motion.div variants={containerAnim} initial="hidden" animate="show" className="w-full space-y-6">

                        {/* ═══════════════ METRICS GRID (ACTIVITY RINGS) ═══════════════ */}
                        <motion.div variants={itemAnim}>
                            <motion.div 
                              className="ios-card flex-center"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              style={{ flexDirection: 'column', gap: 32, padding: 40 }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                                {metrics.map((m, i) => {
                                    return (
                                      <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                        <ActivityRing progress={Math.round(m.value * 100)} color={m.color} icon={m.icon} size={90} stroke={10} delay={0.2 + i * 0.1} />
                                        <div style={{ textAlign: 'center' }}>
                                          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{Math.round(m.value * 100)}%</div>
                                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                                        </div>
                                      </div>
                                    );
                                })}
                              </div>
                            </motion.div>
                        </motion.div>

                        {/* ═══════════════ TWO-COLUMN: CM + ROC ═══════════════ */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            {/* ── Confusion Matrix ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <motion.div 
                                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <CMCell value={thresholdMetrics.tp ?? (results?.tp ?? 0)} label="Correctly Caught" sub="True Positives" type="tp" isDarkMode={isDarkMode} delay={0.1} />
                                    <CMCell value={thresholdMetrics.fn ?? (results?.fn ?? 0)} label="Missed Risk" sub="False Negatives" type="fn" isDarkMode={isDarkMode} delay={0.2} />
                                    <CMCell value={thresholdMetrics.tn ?? (results?.tn ?? 0)} label="Correctly Safe" sub="True Negatives" type="tn" isDarkMode={isDarkMode} delay={0.15} />
                                    <CMCell value={thresholdMetrics.fp ?? (results?.fp ?? 0)} label="False Alarms" sub="False Positives" type="fp" isDarkMode={isDarkMode} delay={0.25} />
                                </motion.div>

                                {/* Callouts */}
                                <div className="mt-3 flex justify-between px-3">
                                    <div className={'flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold ' + (isDarkMode ? 'text-red-400' : 'text-red-600')}>
                                      <AlertTriangle className="w-3 h-3" />
                                      {thresholdMetrics.fn ?? (results?.fn ?? 0)} Missed
                                    </div>
                                    <div className={'flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold ' + (isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                                      <Info className="w-3 h-3" />
                                      {thresholdMetrics.fp ?? (results?.fp ?? 0)} False Alarms
                                    </div>
                                </div>
                            </div>

                            {/* ── ROC Curve ── */}
                            <motion.div variants={itemAnim} className={'rounded-3xl p-6 flex flex-col transition-all duration-300 ' + (isDarkMode
                                ? 'bg-white/[0.02] border border-white/[0.06]'
                                : 'bg-white border border-slate-200 shadow-md')}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" style={{ color: primaryStr }} />
                                        <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                            ROC Curve
                                        </h3>
                                    </div>
                                    <div className={'flex items-center gap-1.5 text-[10px] font-bold '
                                        + ((results?.auc ?? 0.5) >= 0.80 ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                                        : (results?.auc ?? 0.5) >= 0.60 ? (isDarkMode ? 'text-amber-400' : 'text-amber-600')
                                        : (isDarkMode ? 'text-red-400' : 'text-red-600'))}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        AUC {Number(results?.auc ?? 0.5).toFixed(2)}
                                    </div>
                                </div>
                                <p className={'text-[11px] mb-4 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                    {(results?.auc ?? 0.5) >= 0.90 ? 'Excellent' : (results?.auc ?? 0.5) >= 0.80 ? 'Good' : (results?.auc ?? 0.5) >= 0.60 ? 'Acceptable' : 'Poor'} discriminative ability. The diagonal = random guessing.
                                </p>

                                <div className="flex-grow flex items-center justify-center min-h-[220px]">
                                    <ROCCurve auc={results?.auc ?? 0.5} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                </div>

                                {/* Legend */}
                                <div className={'mt-3 flex gap-4 text-[10px] ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: primaryStr }} />
                                        <span>ROC Curve</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-0.5 border-t border-dashed" style={{ borderColor: isDarkMode ? '#334155' : '#CBD5E1' }} />
                                        <span>Random chance</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ═══════════════ THRESHOLD EXPLORER ═══════════════ */}
                        {results && (
                            <motion.div variants={itemAnim} className={'rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ' + (isDarkMode
                                ? 'bg-white/[0.02] border border-white/[0.06]'
                                : 'bg-white border border-slate-200 shadow-md')}>
                                {/* Decoration */}
                                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-30" style={{ background: primaryStr }} />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-4 h-4" style={{ color: primaryStr }} />
                                        <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                            Decision Threshold Explorer
                                        </h3>
                                    </div>
                                    <p className={'text-[11px] mb-6 leading-relaxed max-w-2xl ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        The model outputs a risk probability for each patient. The threshold decides <strong>at what level we flag someone</strong>. Drag to see the sensitivity ↔ specificity trade-off.
                                    </p>

                                    {/* Slider */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={'text-xs font-semibold ' + (isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Threshold</span>
                                            <motion.span
                                                key={threshold}
                                                initial={{ scale: 1.2 }}
                                                animate={{ scale: 1 }}
                                                className={'text-lg font-black font-mono tabular-nums ' + (threshold < 40 ? 'text-red-500' : threshold > 65 ? 'text-blue-500' : 'text-amber-500')}
                                            >
                                                {threshold}%
                                            </motion.span>
                                        </div>
                                        <input
                                            type="range" min="10" max="90" step="5"
                                            value={threshold}
                                            onChange={e => setThreshold(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                                            style={{
                                                accentColor: primaryStr,
                                                background: `linear-gradient(to right, ${primaryStr} ${((threshold - 10) / 80) * 100}%, ${isDarkMode ? '#1e293b' : '#e2e8f0'} ${((threshold - 10) / 80) * 100}%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] mt-1.5">
                                            <span className="text-red-500 font-semibold">10% — Sensitive (more alarms)</span>
                                            <span className="text-blue-500 font-semibold">90% — Specific (fewer alarms)</span>
                                        </div>
                                    </div>

                                    {/* Threshold metrics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                        {[
                                            { label: '⭐ Sensitivity', value: thresholdMetrics.sens, baseValue: results?.sensitivity ?? 0, warn: 0.70, desc: 'Catches real cases', color: '#ef4444' },
                                            { label: 'Specificity', value: thresholdMetrics.spec, baseValue: results?.specificity ?? 0, warn: 0.65, desc: 'Avoids false alarms', color: '#06b6d4' },
                                            { label: 'Precision', value: thresholdMetrics.prec, baseValue: results?.precision ?? 0, warn: 0.60, desc: 'True flags among all', color: '#f59e0b' },
                                        ].map(m => {
                                            const pct = Math.round(m.value * 100);
                                            const basePct = Math.round(m.baseValue * 100);
                                            const delta = pct - basePct;
                                            const barColor = m.value >= m.warn ? secondaryStr : m.value >= m.warn - 0.10 ? '#f59e0b' : '#ef4444';
                                            return (
                                                <div key={m.label} className={'rounded-2xl p-4 ' + (isDarkMode
                                                    ? 'bg-white/[0.02] border border-white/[0.05]'
                                                    : 'bg-slate-50/50 border border-slate-100')}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className={'text-xs font-bold ' + (isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{m.label}</div>
                                                            <div className={'text-[9px] ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{m.desc}</div>
                                                        </div>
                                                        <div className="text-xl font-black tabular-nums" style={{ color: barColor }}>{pct}%</div>
                                                    </div>
                                                    <div className={'h-1.5 rounded-full overflow-hidden mb-1.5 ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}>
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}30` }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                    <div className={'text-[10px] font-semibold ' + (delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : (isDarkMode ? 'text-slate-600' : 'text-slate-400'))}>
                                                        {delta > 0 ? `+${delta}pp vs default` : delta < 0 ? `${delta}pp vs default` : 'Same as default'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Clinical interpretation */}
                                    <div className={'mt-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 '
                                        + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        <Info className="w-3 h-3" />
                                        <span>
                                            {threshold < 35
                                                ? `High Safety Priority // Many Alarms`
                                                : threshold > 65
                                                    ? `High Efficiency Priority // Some Misses`
                                                    : `Balanced Trade-Off`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Clinical Reference ── */}
                        <motion.div variants={itemAnim} className={'rounded-3xl overflow-hidden transition-all duration-300 ' + (isDarkMode
                            ? 'bg-white/[0.02] border border-white/[0.06]'
                            : 'bg-white border border-slate-200 shadow-md')}>
                            <div className={'px-6 py-4 border-b flex items-center gap-2 ' + (isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
                                <HelpCircle className="w-4 h-4" style={{ color: primaryStr }} />
                                <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    Clinical Reference — Metrics Explained
                                </h3>
                                <span className={'ml-auto text-[10px] italic ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>Tap to expand</span>
                            </div>
                            <div>
                                {tableRows.map(row => (
                                    <InfoRow
                                        key={row.measure}
                                        measure={row.measure}
                                        meaning={row.meaning}
                                        concern={row.concern}
                                        isDarkMode={isDarkMode}
                                        value={row.value}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* ── Bottom Nav ── */}
                        <motion.div variants={itemAnim} className={`flex justify-between items-center pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <motion.button
                                onClick={onPrev}
                                whileHover={{ x: -3 }}
                                whileTap={{ scale: 0.97 }}
                                className={'px-5 py-2.5 rounded-xl text-sm font-medium transition-colors '
                                    + (isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50')}
                            >
                                ← Previous
                            </motion.button>
                            <motion.button
                                onClick={onNext}
                                whileHover={{ scale: 1.02, x: 3 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all duration-300"
                                style={{ backgroundColor: secondaryStr, boxShadow: `0 8px 30px ${secondaryStr}35` }}
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default ResultsEvaluation;
