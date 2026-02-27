import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft,
    Info, TrendingUp, Target, Shield, Activity, BarChart3,
    ChevronDown, ChevronUp, HelpCircle
} from 'lucide-react';

// ─── Simulated Results (deterministic seed per render) ────────────────────────
const generateResults = () => {
    const seed = Math.random();
    const base = 0.68 + seed * 0.18;
    const sens = base - 0.04 + Math.random() * 0.08;
    const spec = base + 0.02 + Math.random() * 0.06;
    const prec = base - 0.02 + Math.random() * 0.06;
    const f1 = (2 * sens * prec) / (sens + prec);
    const auc = Math.min(base + 0.06 + Math.random() * 0.08, 0.99);

    const totalTest = 61 + Math.floor(Math.random() * 40);
    const tp = Math.round(totalTest * 0.2 * sens);
    const fn = Math.round(totalTest * 0.2 * (1 - sens));
    const tn = Math.round(totalTest * 0.8 * spec);
    const fp = Math.round(totalTest * 0.8 * (1 - spec));

    return {
        accuracy: parseFloat(base.toFixed(2)),
        sensitivity: parseFloat(sens.toFixed(2)),
        specificity: parseFloat(spec.toFixed(2)),
        precision: parseFloat(prec.toFixed(2)),
        f1Score: parseFloat(f1.toFixed(2)),
        auc: parseFloat(auc.toFixed(2)),
        tp, fn, tn, fp,
        totalTest,
    };
};

// ─── ROC Curve SVG ────────────────────────────────────────────────────────────
const ROCCurve = React.memo(({ auc, isDarkMode }) => {
    const w = 280, h = 220, pad = 36;

    // Parameterize a beta-ish curve shape based on AUC
    const curve = () => {
        const pts = [];
        for (let t = 0; t <= 1; t += 0.02) {
            const fpr = t;
            const tpr = Math.pow(t, Math.pow(2, 1 - auc * 2));
            const x = pad + fpr * (w - pad * 2);
            const y = h - pad - tpr * (h - pad * 2);
            pts.push(`${x},${y}`);
        }
        return `M${pad},${h - pad} ` + pts.map((p, i) => (i === 0 ? `L${p}` : `L${p}`)).join(' ');
    };

    const axisColor = isDarkMode ? '#475569' : '#CBD5E1';
    const labelColor = isDarkMode ? '#94A3B8' : '#64748B';
    const curveColor = '#6366F1';
    const randomColor = isDarkMode ? '#475569' : '#CBD5E1';

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
            {/* Grid */}
            {[0.25, 0.5, 0.75].map(v => (
                <React.Fragment key={v}>
                    <line
                        x1={pad} y1={h - pad - v * (h - pad * 2)}
                        x2={w - pad} y2={h - pad - v * (h - pad * 2)}
                        stroke={axisColor} strokeWidth="0.5" strokeDasharray="4,4"
                    />
                    <line
                        x1={pad + v * (w - pad * 2)} y1={pad}
                        x2={pad + v * (w - pad * 2)} y2={h - pad}
                        stroke={axisColor} strokeWidth="0.5" strokeDasharray="4,4"
                    />
                </React.Fragment>
            ))}

            {/* Axes */}
            <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={axisColor} strokeWidth="1.5" />
            <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={axisColor} strokeWidth="1.5" />

            {/* Diagonal (random) */}
            <line x1={pad} y1={h - pad} x2={w - pad} y2={pad}
                stroke={randomColor} strokeWidth="1.5" strokeDasharray="6,4" />

            {/* AUC fill */}
            <path
                d={`${curve()} L${w - pad},${h - pad} Z`}
                fill={curveColor} fillOpacity="0.12"
            />

            {/* ROC curve */}
            <motion.path
                d={curve()}
                fill="none" stroke={curveColor} strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Axis labels */}
            <text x={w / 2} y={h - 4} textAnchor="middle" fontSize="9" fill={labelColor}>FPR (1 − Specificity)</text>
            <text x={10} y={h / 2} textAnchor="middle" fontSize="9" fill={labelColor}
                transform={`rotate(-90, 10, ${h / 2})`}>TPR (Sensitivity)</text>

            {/* AUC Badge */}
            <rect x={w - pad - 58} y={pad + 6} width="62" height="20" rx="4" fill={curveColor} fillOpacity="0.2" />
            <text x={w - pad - 27} y={pad + 19}
                textAnchor="middle" fontSize="10" fontWeight="700" fill={curveColor}>
                AUC = {auc.toFixed(2)}
            </text>

            {/* Corner labels */}
            <text x={pad - 2} y={pad - 4} textAnchor="middle" fontSize="8" fill={labelColor}>1.0</text>
            <text x={pad - 2} y={h - pad + 2} textAnchor="middle" fontSize="8" fill={labelColor}>0</text>
            <text x={w - pad} y={h - pad + 10} textAnchor="middle" fontSize="8" fill={labelColor}>1.0</text>
        </svg>
    );
});

// ─── Animated Count-Up Hook ───────────────────────────────────────────────────
const useCountUp = (target, duration = 1200, delay = 0) => {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        let start = null;
        let raf;
        const timeout = setTimeout(() => {
            const step = (ts) => {
                if (!start) start = ts;
                const progress = Math.min((ts - start) / duration, 1);
                // Ease-out cubic
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

// ─── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = React.memo(({ label, value, desc, concern, isDarkMode, star, delay = 0 }) => {
    const pct = Math.round(value * 100);
    const animatedPct = useCountUp(pct, 1200, delay * 1000 + 400);
    const warn = concern && value < concern;
    const starSvc = star;

    const color = warn
        ? 'text-red-500'
        : value >= 0.80
            ? 'text-emerald-500'
            : value >= 0.70
                ? 'text-amber-400'
                : 'text-orange-500';

    const barColor = warn ? 'bg-red-500' : value >= 0.80 ? 'bg-emerald-500' : value >= 0.70 ? 'bg-amber-400' : 'bg-orange-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`p-4 rounded-xl border transition-all duration-300 group relative card-inner-shine
                ${isDarkMode
                    ? 'glass-depth-2 hover:border-slate-500'
                    : 'glass-depth-light-2 hover:border-slate-300'
                }
                ${warn ? (isDarkMode ? '!border-red-500/40 !bg-red-900/10' : '!border-red-200 !bg-red-50/60') : ''}
            `}
        >
            {starSvc && (
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    ⭐ KEY
                </span>
            )}
            <div className={`text-2xl font-black mb-1 metric-value-glow ${color}`}>{animatedPct}%</div>
            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
            <div className={`text-[11px] leading-tight mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</div>

            {/* Bar */}
            <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
                />
            </div>

            {warn && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                    <AlertTriangle className="w-3 h-3" /> Below threshold
                </div>
            )}
        </motion.div>
    );
});

// ─── Confusion Matrix Cell ────────────────────────────────────────────────────
const CMCell = React.memo(({ value, label, sub, type, isDarkMode }) => {
    const styles = {
        tp: { bg: isDarkMode ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', icon: '✅', iconCls: 'text-emerald-500', badge: isDarkMode ? 'text-emerald-400' : 'text-emerald-700' },
        tn: { bg: isDarkMode ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50/60 border-emerald-100', icon: '✅', iconCls: 'text-emerald-400', badge: isDarkMode ? 'text-emerald-400' : 'text-emerald-700' },
        fp: { bg: isDarkMode ? 'bg-amber-900/20 border-amber-500/20' : 'bg-amber-50 border-amber-200', icon: '⚠️', iconCls: 'text-amber-500', badge: isDarkMode ? 'text-amber-400' : 'text-amber-700' },
        fn: { bg: isDarkMode ? 'bg-red-900/30 border-red-500/40' : 'bg-red-50 border-red-200', icon: '❌', iconCls: 'text-red-500', badge: isDarkMode ? 'text-red-400' : 'text-red-700' },
    };
    const s = styles[type];
    return (
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-1 ${s.bg}`}>
            <span className="text-2xl">{s.icon}</span>
            <span className={`text-3xl font-black ${s.badge}`}>{value}</span>
            <span className={`text-xs font-bold ${s.badge}`}>{label}</span>
            <span className={`text-[10px] leading-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</span>
        </div>
    );
});

// ─── Collapsible Info Row ─────────────────────────────────────────────────────
const InfoRow = React.memo(({ measure, meaning, concern, isDarkMode, value }) => {
    const [open, setOpen] = useState(false);
    const warn = value !== undefined && value < concern?.threshold;
    return (
        <div className={`border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left group transition-colors
                    ${isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-2">
                    {warn && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{measure}</span>
                    {value !== undefined && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${warn
                            ? isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            : isDarkMode ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            }`}>{Math.round(value * 100)}%</span>
                    )}
                </div>
                {open ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
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
                        <div className={`px-4 pb-3 text-sm leading-relaxed space-y-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            <p>{meaning}</p>
                            {concern && (
                                <p className={`text-xs ${warn ? 'text-red-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
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

// ─── Main Component ───────────────────────────────────────────────────────────
const ResultsEvaluation = ({ isDarkMode, onNext, onPrev }) => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(50); // Decision threshold 0-100%

    useEffect(() => {
        const t = setTimeout(() => {
            setResults(generateResults());
            setLoading(false);
        }, 1200);
        return () => clearTimeout(t);
    }, []);

    // Simulate how threshold affects sensitivity & specificity
    const getThresholdMetrics = (t, base) => {
        if (!base) return { sens: 0, spec: 0, prec: 0 };
        const factor = (t - 50) / 100; // -0.5 to +0.5
        const sens = Math.min(0.99, Math.max(0.01, base.sensitivity - factor * 0.7));
        const spec = Math.min(0.99, Math.max(0.01, base.specificity + factor * 0.6));
        const prec = Math.min(0.99, Math.max(0.01, base.precision + factor * 0.5));
        return {
            sens: parseFloat(sens.toFixed(2)),
            spec: parseFloat(spec.toFixed(2)),
            prec: parseFloat(prec.toFixed(2)),
        };
    };

    const thresholdMetrics = useMemo(() => getThresholdMetrics(threshold, results), [threshold, results]);

    const lowSensitivity = results && results.sensitivity < 0.50;

    const metrics = useMemo(() => results ? [
        { label: 'Accuracy', value: results.accuracy, concern: 0.65, desc: 'Overall correct predictions out of all test patients', delay: 0.05 },
        { label: 'Sensitivity', value: results.sensitivity, concern: 0.70, desc: 'Of patients WHO WERE readmitted, how many did the AI catch?', delay: 0.10, star: true },
        { label: 'Specificity', value: results.specificity, concern: 0.65, desc: 'Of patients NOT readmitted, how many did the AI identify as safe?', delay: 0.15 },
        { label: 'Precision', value: results.precision, concern: 0.60, desc: 'Of all patients the AI flagged as high-risk, how many actually were?', delay: 0.20 },
        { label: 'F1 Score', value: results.f1Score, concern: 0.65, desc: 'Balance between Sensitivity and Precision.', delay: 0.25 },
        { label: 'AUC-ROC', value: results.auc, concern: 0.75, desc: 'How well the model separates high-risk from low-risk patients.', delay: 0.30 },
    ] : [], [results]);

    const tableRows = useMemo(() => results ? [
        {
            measure: 'Accuracy',
            meaning: 'Out of all test patients, what percentage did the AI classify correctly?',
            concern: { threshold: 0.65, text: 'Below 65% — the model is not performing reliably.' },
            value: results.accuracy,
        },
        {
            measure: '⭐ Sensitivity',
            meaning: 'Of patients who WERE readmitted (or had the condition), how many did the AI catch? This is the most important measure for any screening task.',
            concern: { threshold: 0.70, text: 'Below 70% — the model is missing too many real cases.' },
            value: results.sensitivity,
        },
        {
            measure: 'Specificity',
            meaning: 'Of patients who were NOT readmitted, how many did the AI correctly identify as safe?',
            concern: { threshold: 0.65, text: 'Below 65% — too many unnecessary follow-up actions or referrals.' },
            value: results.specificity,
        },
        {
            measure: 'Precision',
            meaning: 'Of all patients the AI flagged as high-risk, how many actually were high-risk?',
            concern: { threshold: 0.60, text: 'Below 60% — many false alarms, which waste clinical resources.' },
            value: results.precision,
        },
        {
            measure: 'F1 Score',
            meaning: 'A combined score balancing Sensitivity and Precision. Useful when both missing cases and false alarms have real costs.',
            concern: { threshold: 0.65, text: 'Below 65% — the model struggles to balance catching cases and avoiding false alarms.' },
            value: results.f1Score,
        },
        {
            measure: 'AUC-ROC',
            meaning: 'A 0.5–1.0 score for how well the model separates high-risk from low-risk patients overall. 0.5 = random chance; 1.0 = perfect separation.',
            concern: { threshold: 0.75, text: 'Below 0.75 — the model cannot reliably distinguish between patient groups.' },
            value: results.auc,
        },
    ] : [], [results]);

    return (
        <div className="w-full space-y-6 pb-20">

            {/* ── Header ── */}
            <div className={`p-4 sm:p-6 rounded-2xl border step-accent ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            STEP 5 OF 7
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={onPrev}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${isDarkMode
                                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg bg-slate-900 text-white hover:bg-slate-800"
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Results — How Well Does the Model Perform?
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Here we evaluate the model's predictions on the test patients it has never seen before. Accuracy alone is not enough — we examine sensitivity (catching real cases) and specificity (avoiding false alarms).
                </p>
            </div>

            {/* ── Low Sensitivity Warning ── */}
            <AnimatePresence>
                {!loading && lowSensitivity && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 font-medium
                            ${isDarkMode ? 'bg-red-900/20 border-red-500/50 text-red-300' : 'bg-red-50 border-red-300 text-red-800'}`}
                    >
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                        <div>
                            <span className="font-bold">🚨 Low Sensitivity Warning — </span>
                            This model misses more than half of the patients who actually have the condition (Sensitivity below 50%).
                            Return to Step 4 and try a different model or adjust the parameters before drawing any clinical conclusions.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Loading State ── */}
            {loading && (
                <div className={`rounded-2xl border p-16 flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Evaluating model on test patients…
                    </p>
                </div>
            )}

            {results && (
                <>
                    {/* ── Performance Metrics Grid ── */}
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                        <div className="flex items-center gap-2 mb-5">
                            <BarChart3 className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Performance Metrics — on {results.totalTest} Test Patients
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                            {metrics.map(m => (
                                <MetricCard key={m.label} {...m} isDarkMode={isDarkMode} />
                            ))}
                        </div>
                    </div>

                    {/* ── Two-column: Confusion Matrix + ROC ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Confusion Matrix */}
                        <div className={`p-6 rounded-2xl border card-inner-shine ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Target className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Confusion Matrix — What Did the Model Get Right and Wrong?
                                </h3>
                            </div>
                            <p className={`text-xs mb-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                This 2×2 table shows the model's predictions vs. what actually happened for the {results.totalTest} test patients.
                            </p>

                            {/* Column headers */}
                            <div className="grid grid-cols-3 gap-2 mb-1">
                                <div />
                                <div className={`text-center text-[10px] font-bold uppercase tracking-wider pb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Predicted NOT at Risk
                                </div>
                                <div className={`text-center text-[10px] font-bold uppercase tracking-wider pb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Predicted AT RISK
                                </div>
                            </div>

                            {/* Row 1 */}
                            <div className="grid grid-cols-3 gap-2 mb-2 items-stretch">
                                <div className={`flex items-center justify-end pr-2 text-[10px] font-bold uppercase tracking-wider text-right ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Actually<br />NOT at Risk
                                </div>
                                <CMCell value={results.tn} label="Correctly called safe" sub="True Negative" type="tn" isDarkMode={isDarkMode} />
                                <CMCell value={results.fp} label="Unnecessary alarm — patient was fine" sub="False Positive — costs resources, not a safety risk" type="fp" isDarkMode={isDarkMode} />
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-3 gap-2 items-stretch">
                                <div className={`flex items-center justify-end pr-2 text-[10px] font-bold uppercase tracking-wider text-right ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Actually<br />AT RISK
                                </div>
                                <CMCell value={results.fn} label="MISSED — patient returned to hospital" sub="False Negative — the most dangerous error" type="fn" isDarkMode={isDarkMode} />
                                <CMCell value={results.tp} label="Correctly flagged as high-risk" sub="True Positive" type="tp" isDarkMode={isDarkMode} />
                            </div>

                            {/* Callouts */}
                            <div className="mt-4 space-y-2">
                                <div className={`flex items-start gap-2 p-3 rounded-lg text-[11px] ${isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-500/20' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                                    <span>
                                        <strong>{results.fn} patients were missed (False Negatives).</strong> These patients were sent home without extra support but returned to hospital within 30 days.
                                    </span>
                                </div>
                                <div className={`flex items-start gap-2 p-3 rounded-lg text-[11px] ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-800 border border-blue-100'}`}>
                                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                                    <span>
                                        <strong>{results.fp} False Positives</strong> caused unnecessary follow-up calls. This is a cost, but not a safety risk. Usually preferable to missing real readmissions.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ROC Curve */}
                        <div className={`p-6 rounded-2xl border flex flex-col card-inner-shine ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    ROC Curve — How Well Does the Model Separate the Two Groups?
                                </h3>
                            </div>
                            <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                A model that hugs the top-left corner is performing well. The diagonal line means no better than random guessing.
                            </p>

                            <div className="flex-grow flex items-center justify-center min-h-[220px]">
                                <ROCCurve auc={results.auc} isDarkMode={isDarkMode} />
                            </div>

                            <div className={`mt-4 p-3 rounded-lg text-[11px] flex items-start gap-2
                                ${results.auc >= 0.80
                                    ? isDarkMode ? 'bg-emerald-900/20 border border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                                    : results.auc >= 0.75
                                        ? isDarkMode ? 'bg-amber-900/20 border border-amber-500/20 text-amber-300' : 'bg-amber-50 border border-amber-100 text-amber-800'
                                        : isDarkMode ? 'bg-red-900/20 border border-red-500/20 text-red-300' : 'bg-red-50 border border-red-100 text-red-800'
                                }`}>
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>
                                    AUC of <strong>{results.auc.toFixed(2)}</strong> — {
                                        results.auc >= 0.90 ? 'Excellent discriminative ability. The model reliably separates high-risk from low-risk patients.'
                                            : results.auc >= 0.80 ? 'Good discriminative ability. Well above random, suitable for clinical support.'
                                                : results.auc >= 0.75 ? 'Acceptable. The model shows useful separation, but there is room for improvement.'
                                                    : 'Poor separation. The model may not be reliable enough for clinical decision support. Try a different algorithm.'
                                    }
                                </span>
                            </div>

                            {/* Legend */}
                            <div className={`mt-3 flex gap-4 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-0.5 bg-indigo-500" />
                                    <span>ROC Curve (model)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-0.5 border-t border-dashed" style={{ borderColor: isDarkMode ? '#475569' : '#CBD5E1' }} />
                                    <span>Random chance</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Threshold Explorer ── */}
                    {results && (
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    🎚 Decision Threshold Explorer — What Happens if We Change the Alert Level?
                                </h3>
                            </div>
                            <p className={`text-xs mb-5 leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                The model outputs a risk probability (0–100%) for each patient. The threshold decides <strong>at what probability we flag someone as high-risk</strong>.
                                Lowering it catches more cases but causes more alarms. Raising it reduces alarms but misses more sick patients. Drag the slider to see the trade-off.
                            </p>

                            {/* Slider */}
                            <div className="mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Decision Threshold</span>
                                    <span className={`text-sm font-black font-mono ${threshold < 40 ? 'text-red-500' : threshold > 65 ? 'text-blue-500' : 'text-amber-500'}`}>
                                        {threshold}%
                                    </span>
                                </div>
                                <input
                                    type="range" min="10" max="90" step="5"
                                    value={threshold}
                                    onChange={e => setThreshold(Number(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((threshold - 10) / 80) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${((threshold - 10) / 80) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} 100%)` }}
                                />
                                <div className="flex justify-between text-[10px] mt-1">
                                    <span className="text-red-500 font-semibold">10% — Very Sensitive (more alarms)</span>
                                    <span className="text-blue-500 font-semibold">90% — Very Specific (fewer alarms)</span>
                                </div>
                            </div>

                            {/* Threshold metrics bars */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                {[
                                    { label: '⭐ Sensitivity', value: thresholdMetrics.sens, baseValue: results.sensitivity, warn: 0.70, desc: 'Catches real cases' },
                                    { label: 'Specificity', value: thresholdMetrics.spec, baseValue: results.specificity, warn: 0.65, desc: 'Avoids false alarms' },
                                    { label: 'Precision', value: thresholdMetrics.prec, baseValue: results.precision, warn: 0.60, desc: 'True flags among all flags' },
                                ].map(m => {
                                    const pct = Math.round(m.value * 100);
                                    const basePct = Math.round(m.baseValue * 100);
                                    const delta = pct - basePct;
                                    const color = m.value >= m.warn ? 'bg-emerald-500' : m.value >= m.warn - 0.10 ? 'bg-amber-500' : 'bg-red-500';
                                    const textColor = m.value >= m.warn ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : m.value >= m.warn - 0.10 ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : (isDarkMode ? 'text-red-400' : 'text-red-600');
                                    return (
                                        <div key={m.label} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{m.label}</div>
                                                    <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{m.desc}</div>
                                                </div>
                                                <div className={`text-xl font-black ${textColor}`}>{pct}%</div>
                                            </div>
                                            <div className={`h-2 rounded-full overflow-hidden mb-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                                <motion.div
                                                    className={`h-full rounded-full ${color}`}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <div className={`text-[10px] font-semibold ${delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {delta > 0 ? `+${delta}pp vs default` : delta < 0 ? `${delta}pp vs default` : 'Same as default'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Clinical interpretation */}
                            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 leading-relaxed ${isDarkMode ? 'bg-blue-900/15 border-blue-500/25 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                                <span>
                                    <strong>Clinical insight: </strong>
                                    {threshold < 35
                                        ? `Threshold of ${threshold}% — the model flags almost everyone as high-risk. You catch most sick patients, but staff will investigate many healthy patients. Use when missing a case is catastrophic (e.g., sepsis screening).`
                                        : threshold > 65
                                            ? `Threshold of ${threshold}% — only very probable cases are flagged. Resources are targeted efficiently, but some real cases will be missed. Use when clinical resources are very limited.`
                                            : `Threshold of ${threshold}% — a balanced point. Clinicians should choose the threshold based on the cost of missing a case versus the cost of an unnecessary investigation in their specific setting.`
                                    }
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── Clinical Reference Table ── */}
                    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className={`px-6 py-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Table — The Six Performance Measures Explained
                            </h3>
                            <span className={`ml-auto text-[10px] italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Tap each row to expand</span>
                        </div>
                        <div>
                            {tableRows.map((row) => (
                                <InfoRow
                                    key={row.measure}
                                    measure={row.measure}
                                    meaning={row.meaning}
                                    concern={row.concern ? { threshold: row.concern.threshold, text: row.concern.text } : null}
                                    isDarkMode={isDarkMode}
                                    value={row.value}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Navigation ── */}
                    <div className="flex justify-between items-center pt-4">
                        <button
                            onClick={onPrev}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium transition-colors
                                ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <ArrowLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95"
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ResultsEvaluation;
