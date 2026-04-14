import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft,
    Info, TrendingUp, Target, Shield, Activity, BarChart3,
    ChevronDown, ChevronUp, HelpCircle, Sparkles, Gauge,
    FlaskConical, Eye, Crosshair, Zap
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';



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
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
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
   Radial Gauge Metric Card — with animated arc
═══════════════════════════════════════════════════════════════ */
const MetricCard = React.memo(({ label, value, desc, interpretation, concern, isDarkMode, star, delay = 0, icon: Icon, color }) => {
    const pct = Math.round(value * 100);
    const animatedPct = useCountUp(pct, 1200, delay * 1000 + 400);
    const warn = concern && value < concern;

    const gaugeColor = color || (value >= 0.80 ? '#10b981' : value >= 0.60 ? '#f59e0b' : '#ef4444');

    // Arc math for the gauge
    const radius = 34;
    const strokeWidth = 5;
    const circumference = Math.PI * radius; // semicircle
    const dashOffset = circumference * (1 - value);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
            className={'group relative p-4 rounded-2xl transition-all duration-300 overflow-hidden ' + (isDarkMode
                ? 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]'
                : 'bg-white border border-slate-200 shadow-md')
                + (warn ? (isDarkMode ? ' !border-red-500/30' : ' !border-red-200 shadow-[inset_0_0_0_100px_rgba(254,226,226,0.5)]') : '')}
        >
            {/* Corner glow on hover */}
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" style={{ background: gaugeColor }} />

            {star && (
                <span className={'absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full '
                    + (isDarkMode ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 bg-white border border-slate-200 shadow-md')}>
                    ⭐ KEY
                </span>
            )}

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Semicircle gauge */}
                <div className="relative mb-2" style={{ width: 80, height: 44 }}>
                    <svg viewBox="0 0 80 44" className="w-full h-full overflow-visible">
                        {/* Background arc */}
                        <path d="M 6 40 A 34 34 0 0 1 74 40" fill="none"
                            stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} strokeWidth={strokeWidth} strokeLinecap="round" />
                        {/* Animated value arc */}
                        <motion.path
                            d="M 6 40 A 34 34 0 0 1 74 40" fill="none"
                            stroke={gaugeColor} strokeWidth={strokeWidth} strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: dashOffset }}
                            transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
                            style={{ filter: `drop-shadow(0 0 4px ${gaugeColor}40)` }}
                        />
                    </svg>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                        <div className="text-xl font-black tabular-nums leading-none" style={{ color: gaugeColor }}>
                            {animatedPct}%
                        </div>
                    </div>
                </div>

                <div className={'text-[10px] font-bold uppercase tracking-widest mb-0.5 ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</div>
                <div className={'text-[10px] leading-tight ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{desc}</div>

                {warn && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] text-red-500 font-semibold">
                        <AlertTriangle className="w-2.5 h-2.5" /> Below threshold
                    </div>
                )}
            </div>
        </motion.div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Confusion Matrix Cell — glassmorphic with animated count
═══════════════════════════════════════════════════════════════ */
const CMCell = React.memo(({ value, label, sub, type, isDarkMode, delay = 0 }) => {
    const animatedVal = useCountUp(value, 800, delay * 1000 + 300);
    const configs = {
        tp: { icon: CheckCircle2, color: '#10b981', bg: isDarkMode ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: isDarkMode ? 'rgba(16,185,129,0.15)' : '#a7f3d0' },
        tn: { icon: CheckCircle2, color: '#10b981', bg: isDarkMode ? 'rgba(16,185,129,0.05)' : '#f0fdf4', border: isDarkMode ? 'rgba(16,185,129,0.1)' : '#bbf7d0' },
        fp: { icon: AlertTriangle, color: '#f59e0b', bg: isDarkMode ? 'rgba(245,158,11,0.06)' : '#fffbeb', border: isDarkMode ? 'rgba(245,158,11,0.15)' : '#fde68a' },
        fn: { icon: AlertTriangle, color: '#ef4444', bg: isDarkMode ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fecaca' },
    };
    const cfg = configs[type];
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            className="rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5"
            style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
            <span className="text-3xl font-black tabular-nums" style={{ color: cfg.color }}>{animatedVal}</span>
            <span className={'text-[10px] font-bold leading-tight ' + (isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{label}</span>
            <span className={'text-[9px] leading-tight ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{sub}</span>
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
        if (!base) return { sens: 0, spec: 0, prec: 0 };
        const factor = (t - 50) / 100;
        const sens = Math.min(0.99, Math.max(0.01, base.sensitivity - factor * 0.7));
        const spec = Math.min(0.99, Math.max(0.01, base.specificity + factor * 0.6));
        const prec = Math.min(0.99, Math.max(0.01, base.precision + factor * 0.5));
        return { sens: parseFloat(sens.toFixed(2)), spec: parseFloat(spec.toFixed(2)), prec: parseFloat(prec.toFixed(2)) };
    };

    const thresholdMetrics = useMemo(() => getThresholdMetrics(threshold, results), [threshold, results]);
    const lowSensitivity = results && results.sensitivity < 0.50;

    const metricIcons = [Target, Eye, Shield, Crosshair, Zap, TrendingUp];
    const metricColors = [primaryStr, '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6', secondaryStr];

    const metrics = useMemo(() => results ? [
        { label: 'Accuracy', value: results.accuracy, concern: 0.60, desc: 'Overall correct predictions', interpretation: 'Reliability: How often the AI is correct across all patients.', delay: 0.05, icon: metricIcons[0], color: metricColors[0] },
        { label: 'Sensitivity', value: results.sensitivity, concern: 0.60, desc: 'Catch rate for real cases', interpretation: 'Safety: Of patients readmitted, how many were caught?', delay: 0.10, star: true, icon: metricIcons[1], color: metricColors[1] },
        { label: 'Specificity', value: results.specificity, concern: 0.60, desc: 'Avoids false alarms', interpretation: 'Accuracy in identifying healthy patients as safe.', delay: 0.15, icon: metricIcons[2], color: metricColors[2] },
        { label: 'Precision', value: results.precision, concern: 0.60, desc: 'Confidence in flagged cases', interpretation: 'Trust: If it flags a patient, how often is it right?', delay: 0.20, icon: metricIcons[3], color: metricColors[3] },
        { label: 'F1 Score', value: results.f1Score, concern: 0.60, desc: 'Balanced measure', interpretation: 'Utility: Balance between missing cases and false alarms.', delay: 0.25, icon: metricIcons[4], color: metricColors[4] },
        { label: 'AUC-ROC', value: results.auc, concern: 0.60, desc: 'Discrimination ability', interpretation: 'Power: Ability to separate high-risk from low-risk.', delay: 0.30, icon: metricIcons[5], color: metricColors[5] },
    ] : [], [results]);

    const tableRows = useMemo(() => results ? [
        { measure: 'Accuracy', meaning: 'Out of all test patients, what percentage did the AI classify correctly?', concern: { threshold: 0.65, text: 'Below 65% — the model is not performing reliably.' }, value: results.accuracy },
        { measure: '⭐ Sensitivity', meaning: 'Of patients who WERE readmitted (or had the condition), how many did the AI catch? This is the most important measure for any screening task.', concern: { threshold: 0.70, text: 'Below 70% — the model is missing too many real cases.' }, value: results.sensitivity },
        { measure: 'Specificity', meaning: 'Of patients who were NOT readmitted, how many did the AI correctly identify as safe?', concern: { threshold: 0.65, text: 'Below 65% — too many unnecessary follow-up actions.' }, value: results.specificity },
        { measure: 'Precision', meaning: 'Of all patients the AI flagged as high-risk, how many actually were high-risk?', concern: { threshold: 0.60, text: 'Below 60% — many false alarms, wasting clinical resources.' }, value: results.precision },
        { measure: 'F1 Score', meaning: 'A combined score balancing Sensitivity and Precision. Useful when both missing cases and false alarms have real costs.', concern: { threshold: 0.65, text: 'Below 65% — the model struggles to balance catching cases and avoiding false alarms.' }, value: results.f1Score },
        { measure: 'AUC-ROC', meaning: 'A 0.5–1.0 score for how well the model separates high-risk from low-risk patients. 0.5 = random; 1.0 = perfect.', concern: { threshold: 0.75, text: 'Below 0.75 — the model cannot reliably distinguish between patient groups.' }, value: results.auc },
    ] : [], [results]);

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-20">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-8">
                {/* ═══════════════ HEADER ═══════════════ */}
                <motion.div variants={itemAnim} className="mb-2">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                                className={'w-10 h-10 rounded-2xl flex items-center justify-center ' + (isDarkMode ? 'bg-white/[0.05]' : 'bg-pink-100/80')}
                                style={{ boxShadow: `0 0 20px ${primaryStr}15` }}
                            >
                                <Gauge className="w-5 h-5" style={{ color: primaryStr }} />
                            </motion.div>
                            <span className={`text-[10px] tracking-[0.15em] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Step 5 · Evaluate
                            </span>
                        </div>
                        <motion.button
                            onClick={onNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all duration-300"
                            style={{ backgroundColor: secondaryStr, boxShadow: `0 8px 30px ${secondaryStr}35` }}
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                    <motion.h2
                        className={'text-4xl sm:text-5xl font-extrabold tracking-tight ' + (isDarkMode ? 'text-white' : 'text-slate-900')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        How Well{' '}
                        <span style={{ background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Did It Learn?
                        </span>
                    </motion.h2>
                    <motion.p
                        className={'text-sm mt-3 max-w-xl leading-relaxed ' + (isDarkMode ? 'text-slate-400' : 'text-slate-600')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Go beyond accuracy. We check sensitivity, specificity, and clinical trade-offs on the held-out test patients.
                    </motion.p>
                </motion.div>

                {/* ── Low Sensitivity Warning ── */}
                <AnimatePresence>
                    {!loading && lowSensitivity && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className={'flex items-start gap-3 p-5 rounded-2xl border-2 font-medium '
                                + (isDarkMode ? 'bg-red-500/[0.06] border-red-500/30 text-red-300' : 'bg-red-50 border-red-300 text-red-800')}
                        >
                            <div className={'p-2 rounded-xl shrink-0 ' + (isDarkMode ? 'bg-red-500/15' : 'bg-red-100')}>
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <span className="font-bold">🚨 Low Sensitivity Warning — </span>
                                This model misses more than half of real cases. Return to Step 4 and try a different model or adjust parameters before drawing clinical conclusions.
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

                        {/* ═══════════════ METRICS GRID ═══════════════ */}
                        <motion.div variants={itemAnim}>
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4" style={{ color: primaryStr }} />
                                <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    Performance Metrics {results.totalTest ? `— on ${results.totalTest} Test Patients` : ''}
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                                {metrics.map(m => (
                                    <MetricCard key={m.label} {...m} isDarkMode={isDarkMode} />
                                ))}
                            </div>
                        </motion.div>

                        {/* ═══════════════ TWO-COLUMN: CM + ROC ═══════════════ */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            {/* ── Confusion Matrix ── */}
                            <motion.div variants={itemAnim} className={'rounded-3xl p-6 transition-all duration-300 ' + (isDarkMode
                                ? 'bg-white/[0.02] border border-white/[0.06]'
                                : 'bg-white border border-slate-200 shadow-md')}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4" style={{ color: primaryStr }} />
                                    <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        Confusion Matrix
                                    </h3>
                                </div>
                                <p className={'text-[11px] mb-5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                    Predictions vs. reality for {results.totalTest || 'test'} patients.
                                </p>

                                {/* Column headers */}
                                <div className="grid grid-cols-3 gap-2 mb-1">
                                    <div />
                                    <div className={'text-center text-[9px] font-bold uppercase tracking-wider pb-1 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        Predicted Safe
                                    </div>
                                    <div className={'text-center text-[9px] font-bold uppercase tracking-wider pb-1 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        Predicted At Risk
                                    </div>
                                </div>

                                {/* Row 1 */}
                                <div className="grid grid-cols-3 gap-2 mb-2 items-stretch">
                                    <div className={'flex items-center justify-end pr-2 text-[9px] font-bold uppercase tracking-wider text-right ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        Actually<br />Safe
                                    </div>
                                    <CMCell value={results.tn} label="Correctly safe" sub="True Negative" type="tn" isDarkMode={isDarkMode} delay={0.1} />
                                    <CMCell value={results.fp} label="Unnecessary alarm" sub="False Positive" type="fp" isDarkMode={isDarkMode} delay={0.15} />
                                </div>

                                {/* Row 2 */}
                                <div className="grid grid-cols-3 gap-2 items-stretch">
                                    <div className={'flex items-center justify-end pr-2 text-[9px] font-bold uppercase tracking-wider text-right ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        Actually<br />At Risk
                                    </div>
                                    <CMCell value={results.fn} label="MISSED patient" sub="False Negative — dangerous" type="fn" isDarkMode={isDarkMode} delay={0.2} />
                                    <CMCell value={results.tp} label="Correctly flagged" sub="True Positive" type="tp" isDarkMode={isDarkMode} delay={0.25} />
                                </div>

                                {/* Callouts */}
                                <div className="mt-4 space-y-2">
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                        className={'flex items-start gap-2 p-3 rounded-xl text-[11px] ' + (isDarkMode ? 'bg-red-500/[0.06] text-red-300 border border-red-500/15' : 'bg-red-50 text-red-800 border border-red-100')} >
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                                        <span><strong>{results.fn} patients missed</strong> — sent home but returned to hospital within 30 days.</span>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                        className={'flex items-start gap-2 p-3 rounded-xl text-[11px] ' + (isDarkMode ? 'bg-blue-500/[0.06] text-blue-300 border border-blue-500/15' : 'bg-blue-50 text-blue-800 border border-blue-100')} >
                                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                                        <span><strong>{results.fp} false positives</strong> — unnecessary follow-ups. Costly but not a safety risk.</span>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* ── ROC Curve ── */}
                            <motion.div variants={itemAnim} className={'rounded-3xl p-6 flex flex-col transition-all duration-300 ' + (isDarkMode
                                ? 'bg-white/[0.02] border border-white/[0.06]'
                                : 'bg-white border border-slate-200 shadow-md')}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity className="w-4 h-4" style={{ color: primaryStr }} />
                                    <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        ROC Curve
                                    </h3>
                                </div>
                                <p className={'text-[11px] mb-4 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                    A model hugging the top-left corner performs well. The diagonal = random guessing.
                                </p>

                                <div className="flex-grow flex items-center justify-center min-h-[220px]">
                                    <ROCCurve auc={results.auc} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                </div>

                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                    className={'mt-4 p-3.5 rounded-xl text-[11px] flex items-start gap-2 '
                                        + (results.auc >= 0.80
                                            ? isDarkMode ? 'bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-300' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                                            : results.auc >= 0.60
                                                ? isDarkMode ? 'bg-amber-500/[0.06] border border-amber-500/15 text-amber-300' : 'bg-amber-50 border border-amber-100 text-amber-800'
                                                : isDarkMode ? 'bg-red-500/[0.06] border border-red-500/15 text-red-300' : 'bg-red-50 border border-red-100 text-red-800'
                                        )}>
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>
                                        AUC of <strong>{Number(results.auc).toFixed(2)}</strong> — {
                                            results.auc >= 0.90 ? 'Excellent discriminative ability.'
                                                : results.auc >= 0.80 ? 'Good — suitable for clinical support.'
                                                    : results.auc >= 0.60 ? 'Acceptable — room for improvement.'
                                                        : 'Poor — try a different algorithm.'
                                        }
                                    </span>
                                </motion.div>

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
                                            { label: '⭐ Sensitivity', value: thresholdMetrics.sens, baseValue: results.sensitivity, warn: 0.70, desc: 'Catches real cases', color: '#ef4444' },
                                            { label: 'Specificity', value: thresholdMetrics.spec, baseValue: results.specificity, warn: 0.65, desc: 'Avoids false alarms', color: '#06b6d4' },
                                            { label: 'Precision', value: thresholdMetrics.prec, baseValue: results.precision, warn: 0.60, desc: 'True flags among all', color: '#f59e0b' },
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
                                    <div className={'p-4 rounded-2xl text-xs flex items-start gap-2 leading-relaxed '
                                        + (isDarkMode ? 'bg-blue-500/[0.06] border border-blue-500/15 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-800')}>
                                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                        <span>
                                            <strong>Clinical insight: </strong>
                                            {threshold < 35
                                                ? `At ${threshold}%, the model flags almost everyone as high-risk. Maximum safety, but many unnecessary investigations.`
                                                : threshold > 65
                                                    ? `At ${threshold}%, only very probable cases are flagged. Efficient resources, but some cases will be missed.`
                                                    : `At ${threshold}%, a balanced trade-off. Clinicians should choose based on the cost of missing a case vs. unnecessary investigation.`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Retrain CTA ── */}
                        {results && (
                            <motion.div variants={itemAnim}
                                className={'rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden '
                                    + (isDarkMode ? 'bg-indigo-500/[0.04] border border-indigo-500/15' : 'bg-indigo-50/50 bg-white border border-slate-200 shadow-md/60')}>
                                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: `${primaryStr}10` }} />
                                <div className="relative z-10">
                                    <h4 className={'text-sm font-bold mb-1 ' + (isDarkMode ? 'text-indigo-300' : 'text-indigo-800')}>
                                        🔄 Want different results?
                                    </h4>
                                    <p className={'text-xs ' + (isDarkMode ? 'text-indigo-400/70' : 'text-indigo-600/70')}>
                                        Go back to Step 4 to retrain with different settings or algorithms.
                                    </p>
                                </div>
                                <motion.button
                                    onClick={() => onGoToStep && onGoToStep(4)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={'shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-md '
                                        + (isDarkMode
                                            ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                                            : 'bg-indigo-100 bg-white border border-slate-200 shadow-md text-indigo-700 hover:bg-indigo-200')}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Retrain → Step 4
                                </motion.button>
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
