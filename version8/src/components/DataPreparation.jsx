import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sliders, CheckCircle2, AlertCircle, BarChart3, Database, Split, Scale, Users, Sparkles, Zap, ChevronDown, Layers, Shield, FlaskConical, ArrowRightLeft } from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';

/* ═══════════════════════════════════════════════════════════════
   Animated Count-Up
   ═══════════════════════════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.2 }) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const target = typeof value === 'number' ? value : parseInt(value) || 0;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(Math.round(eased * target));
            if (progress < 1) ref.current = requestAnimationFrame(animate);
        };
        ref.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(ref.current);
    }, [value, duration]);
    return <>{display.toLocaleString()}</>;
};



/* ═══════════════════════════════════════════════════════════════
   Animated Ring Donut — Train/Test Split
   ═══════════════════════════════════════════════════════════════ */
const SplitDonut = React.memo(({ trainPct, isDarkMode, primaryStr, secondaryStr }) => {
    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const trainDash = (trainPct / 100) * circumference;
    const testDash = circumference - trainDash;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
            <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
                {/* Test arc */}
                <motion.circle
                    cx="65" cy="65" r={radius}
                    fill="none"
                    stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Train arc */}
                <motion.circle
                    cx="65" cy="65" r={radius}
                    fill="none"
                    stroke={primaryStr}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${trainDash} ${circumference}`}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${trainDash} ${circumference}` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ filter: `drop-shadow(0 0 6px ${primaryStr}40)` }}
                />
                {/* Test highlight arc */}
                <motion.circle
                    cx="65" cy="65" r={radius}
                    fill="none"
                    stroke={secondaryStr}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${testDash} ${circumference}`}
                    strokeDashoffset={-trainDash}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${testDash} ${circumference}` }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ filter: `drop-shadow(0 0 6px ${secondaryStr}40)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={'text-2xl font-bold tabular-nums ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{trainPct}%</span>
                <span className={'text-[8px] uppercase tracking-widest font-bold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Train</span>
            </div>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Setting Card with icon, label, control
   ═══════════════════════════════════════════════════════════════ */
const SettingCard = ({ icon: Icon, label, color, isDarkMode, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
        className={'group rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ' + (isDarkMode
            ? 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]'
            : 'hover:shadow-lg bg-white border border-slate-200 shadow-md')}
    >
        {/* Glow on hover */}
        <div
            className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"
            style={{ background: color }}
        />
        <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-4">
                <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + (isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-50')}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className={'text-sm font-semibold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>{label}</span>
            </div>
            {children}
        </div>
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   Custom Option Selector (replaces native <select>)
   ═══════════════════════════════════════════════════════════════ */
const OptionSelector = ({ options, value, onChange, isDarkMode, accentColor }) => {
    return (
        <div className="space-y-1.5">
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <motion.button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        whileTap={{ scale: 0.98 }}
                        className={'w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 ' + (isActive
                            ? (isDarkMode ? 'text-white' : 'text-slate-900')
                            : (isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'))}
                        style={isActive ? {
                            backgroundColor: isDarkMode ? `${accentColor}12` : `${accentColor}08`,
                            boxShadow: `inset 0 0 0 1px ${accentColor}25`,
                        } : {}}
                    >
                        <div
                            className={'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ' + (isActive ? '' : (isDarkMode ? 'border-slate-600' : 'border-slate-300'))}
                            style={isActive ? { borderColor: accentColor } : {}}
                        >
                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: accentColor }}
                                />
                            )}
                        </div>
                        <span className={'font-medium ' + (isActive ? 'text-current' : '')}>{opt.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Animated Before/After Bar (enhanced)
   ═══════════════════════════════════════════════════════════════ */
const AnimatedBar = ({ label, value, displayValue, colorCode, delay = 0, isDarkMode }) => (
    <div className="flex items-center text-xs gap-3">
        <div className={`w-14 text-right font-medium shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>
        <div className={`flex-grow h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(value, 2)}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay }}
                className="h-full rounded-full"
                style={{ backgroundColor: colorCode, boxShadow: `0 0 8px ${colorCode}30` }}
            />
        </div>
        <div className={`w-12 text-right font-mono font-bold tabular-nums ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{displayValue}</div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   Normalisation Before/After Visualization
   ═══════════════════════════════════════════════════════════════ */
const NormalisationViz = React.memo(({ normMethod, isDarkMode, dataset, datasetSchema, primaryStr, secondaryStr }) => {
    const targetFeature = datasetSchema?.find(c => c.role === 'Number (measurement)')?.name || 'Example Feature';

    let nMin = 14, nMax = 80, nAvg = 38;
    if (dataset && dataset.length > 0 && targetFeature !== 'Example Feature') {
        const vals = dataset.map(row => Number(row[targetFeature])).filter(n => !isNaN(n));
        if (vals.length > 0) {
            let min = Infinity, max = -Infinity, sum = 0;
            for (let i = 0; i < vals.length; i++) {
                if (vals[i] < min) min = vals[i];
                if (vals[i] > max) max = vals[i];
                sum += vals[i];
            }
            nMin = min;
            nMax = max;
            nAvg = sum / vals.length;
        }
    }

    const raw = { min: Number(nMin.toFixed(1)), avg: Number(nAvg.toFixed(1)), max: Number(nMax.toFixed(1)) };
    const stdDev = nMax === nMin ? 1 : (nMax - nMin) / 4;

    let normed;
    if (normMethod === 'min-max') {
        normed = { min: { val: 0, pct: 2 }, avg: { val: (raw.avg - raw.min) / (raw.max - raw.min || 1), pct: ((raw.avg - raw.min) / (raw.max - raw.min || 1)) * 100 }, max: { val: 1.00, pct: 100 } };
    } else if (normMethod === 'z-score') {
        normed = {
            min: { val: (raw.min - raw.avg) / stdDev, pct: 3 },
            avg: { val: 0.00, pct: 50 },
            max: { val: (raw.max - raw.avg) / stdDev, pct: 97 }
        };
    } else {
        normed = { min: { val: raw.min, pct: 2 }, avg: { val: raw.avg, pct: 50 }, max: { val: raw.max, pct: 100 } };
    }

    const methodLabel = normMethod === 'min-max' ? '0–1' : normMethod === 'z-score' ? 'z-score' : 'raw';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={'rounded-2xl p-5 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-indigo-50/50 border border-indigo-100 shadow-md')}
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" style={{ color: primaryStr }} />
                    <span className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                        Normalisation — {targetFeature}
                    </span>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ backgroundColor: `${primaryStr}15`, color: primaryStr }}>{methodLabel}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="space-y-3">
                    <div className={'text-center text-[10px] font-bold uppercase tracking-widest mb-3 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Before (raw)</div>
                    <AnimatedBar label="Min" value={2} displayValue={`${raw.min}`} colorCode={isDarkMode ? '#64748b' : '#94a3b8'} delay={0} isDarkMode={isDarkMode} />
                    <AnimatedBar label="Avg" value={50} displayValue={`${raw.avg}`} colorCode={primaryStr} delay={0.1} isDarkMode={isDarkMode} />
                    <AnimatedBar label="Max" value={100} displayValue={`${raw.max}`} colorCode={secondaryStr} delay={0.2} isDarkMode={isDarkMode} />
                </div>

                {/* After */}
                <div className="space-y-3 relative">
                    <div className={'absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block ' + (isDarkMode ? 'text-slate-700' : 'text-slate-300')}>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    <div className={'text-center text-[10px] font-bold uppercase tracking-widest mb-3 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>After ({methodLabel})</div>
                    <AnimatedBar label="Min" value={normed.min.pct} displayValue={typeof normed.min.val === 'number' ? normed.min.val.toFixed(2) : normed.min.val} colorCode={isDarkMode ? '#64748b' : '#94a3b8'} delay={0.4} isDarkMode={isDarkMode} />
                    <AnimatedBar label="Avg" value={normed.avg.pct} displayValue={typeof normed.avg.val === 'number' ? normed.avg.val.toFixed(2) : normed.avg.val} colorCode={primaryStr} delay={0.5} isDarkMode={isDarkMode} />
                    <AnimatedBar label="Max" value={normed.max.pct} displayValue={typeof normed.max.val === 'number' ? normed.max.val.toFixed(2) : normed.max.val} colorCode={secondaryStr} delay={0.6} isDarkMode={isDarkMode} />
                </div>
            </div>
        </motion.div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Class Balance Before/After Visualization
   ═══════════════════════════════════════════════════════════════ */
const ClassBalanceViz = React.memo(({ imbalanceMethod, isDarkMode, dataset, targetColumn, primaryStr, secondaryStr }) => {
    let beforeMajority = 68;
    let beforeMinority = 32;
    let clsNames = ['Majority Class', 'Minority Class'];

    if (dataset && dataset.length > 0 && targetColumn) {
        const counts = {};
        dataset.forEach(r => {
            const v = r[targetColumn];
            if (v !== undefined && v !== null && v !== '') {
                counts[v] = (counts[v] || 0) + 1;
            }
        });
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (entries.length >= 2) {
            const total = entries.reduce((acc, curr) => acc + curr[1], 0);
            beforeMajority = Math.round((entries[0][1] / total) * 100);
            beforeMinority = Math.round((entries[1][1] / total) * 100);
            clsNames = [entries[0][0], entries[1][0]];
        }
    }

    let afterMajority, afterMinority, afterLabel;
    if (imbalanceMethod === 'smote') {
        afterMajority = 50;
        afterMinority = 50;
        afterLabel = 'AFTER SMOTE';
    } else {
        afterMajority = beforeMajority;
        afterMinority = beforeMinority;
        afterLabel = 'NO CHANGE';
    }

    // Donut helper
    const MiniDonut = ({ majority, minority, label, delay = 0 }) => {
        const r = 36;
        const sw = 8;
        const c = 2 * Math.PI * r;
        const majDash = (majority / 100) * c;
        const minDash = (minority / 100) * c;

        return (
            <div className="flex flex-col items-center gap-3">
                <div className="relative" style={{ width: 90, height: 90 }}>
                    <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
                        <circle cx="45" cy="45" r={r} fill="none" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} strokeWidth={sw} />
                        <motion.circle
                            cx="45" cy="45" r={r} fill="none"
                            stroke={secondaryStr}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeDasharray={`${majDash} ${c}`}
                            initial={{ strokeDasharray: `0 ${c}` }}
                            animate={{ strokeDasharray: `${majDash} ${c}` }}
                            transition={{ duration: 1, delay: delay, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <motion.circle
                            cx="45" cy="45" r={r} fill="none"
                            stroke={primaryStr}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeDasharray={`${minDash} ${c}`}
                            strokeDashoffset={-majDash}
                            initial={{ strokeDasharray: `0 ${c}` }}
                            animate={{ strokeDasharray: `${minDash} ${c}` }}
                            transition={{ duration: 1, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{label}</span>
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: secondaryStr }} />
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{clsNames[0]}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{majority}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: primaryStr }} />
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{clsNames[1]}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{minority}%</strong></span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={'rounded-2xl p-5 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-blue-50/50 border border-blue-100 shadow-md')}
        >
            <div className="flex items-center gap-2 mb-5">
                <Users className="w-4 h-4" style={{ color: primaryStr }} />
                <span className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                    Class Balance — {imbalanceMethod === 'smote' ? 'SMOTE Applied' : 'No Resampling'}
                </span>
            </div>
            <div className="flex items-center justify-center gap-10 flex-wrap">
                <MiniDonut majority={beforeMajority} minority={beforeMinority} label="Before" delay={0} />
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                    className={'p-2 rounded-full ' + (isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-100')}
                >
                    <ArrowRight className="w-4 h-4" style={{ color: primaryStr }} />
                </motion.div>
                <MiniDonut majority={afterMajority} minority={afterMinority} label={imbalanceMethod === 'smote' ? 'After' : 'Same'} delay={0.4} />
            </div>
        </motion.div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Pipeline Step Indicator
   ═══════════════════════════════════════════════════════════════ */
const PipelineIndicator = ({ isApplied, isDarkMode, primaryStr, secondaryStr }) => {
    const steps = [
        { label: 'Missing Values', icon: Database },
        { label: 'Normalise', icon: Scale },
        { label: 'Split Data', icon: Split },
        { label: 'Balance', icon: Users },
    ];

    return (
        <div className="flex items-center justify-center gap-1 py-3">
            {steps.map((step, i) => (
                <React.Fragment key={step.label}>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: isApplied ? i * 0.12 : 0, duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                        className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-500 ' + (
                            isApplied
                                ? ''
                                : (isDarkMode ? 'bg-white/[0.03] text-slate-500' : 'bg-slate-50 text-slate-400')
                        )}
                        style={isApplied ? {
                            backgroundColor: isDarkMode ? `${secondaryStr}12` : `${secondaryStr}08`,
                            color: secondaryStr,
                        } : {}}
                    >
                        {isApplied ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.12 + 0.2, type: 'spring', stiffness: 500 }}
                            >
                                <CheckCircle2 className="w-3 h-3" />
                            </motion.div>
                        ) : (
                            <step.icon className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">{step.label}</span>
                    </motion.div>
                    {i < steps.length - 1 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 16 }}
                            transition={{ delay: isApplied ? i * 0.12 + 0.1 : 0, duration: 0.3 }}
                            className={'h-px ' + (isApplied ? '' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200'))}
                            style={isApplied ? { backgroundColor: `${secondaryStr}30` } : {}}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Visualizations Panel
   ═══════════════════════════════════════════════════════════════ */
const VisualizationsPanel = React.memo(({ isApplied, isAnimating, isDarkMode, normMethod, imbalanceMethod, dataset, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    return (
        <>
            {/* Loading Overlay */}
            <AnimatePresence>
                {isAnimating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-5 rounded-3xl"
                        style={{ backgroundColor: isDarkMode ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
                    >
                        {/* Spinning rings */}
                        <div className="relative w-16 h-16">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 rounded-full border-[3px] border-t-transparent"
                                style={{ borderColor: `${secondaryStr}25`, borderTopColor: secondaryStr }}
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-2 rounded-full border-[3px] border-b-transparent"
                                style={{ borderColor: `${primaryStr}25`, borderBottomColor: primaryStr }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FlaskConical className="w-5 h-5" style={{ color: primaryStr }} />
                            </div>
                        </div>
                        <div className="text-center">
                            <div className={'font-semibold text-sm ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>Applying transformations…</div>
                            <div className={'text-xs mt-1 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Normalising • Handling gaps • Balancing classes</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isApplied && !isAnimating ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center space-y-6 py-16">
                    {/* Animated illustration */}
                    <div className="relative w-28 h-28">
                        <motion.div
                            className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div className={`absolute inset-3 rounded-full border ${isDarkMode ? 'border-slate-700/60' : 'border-slate-200/80'}`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: [0, 5, 0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className={'p-4 rounded-2xl ' + (isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 bg-white border border-slate-200 shadow-md')}
                            >
                                <Sliders className={'w-8 h-8 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
                            </motion.div>
                        </div>
                        <motion.div
                            className="absolute -top-1 -right-1"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div className={'p-1.5 rounded-lg ' + (isDarkMode ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-100')}>
                                <BarChart3 className={'w-3.5 h-3.5 ' + (isDarkMode ? 'text-indigo-400' : 'text-indigo-500')} />
                            </div>
                        </motion.div>
                        <motion.div
                            className="absolute -bottom-1 -left-1"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        >
                            <div className={'p-1.5 rounded-lg ' + (isDarkMode ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-100')}>
                                <Scale className={'w-3.5 h-3.5 ' + (isDarkMode ? 'text-emerald-400' : 'text-emerald-500')} />
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <p className={`text-lg font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Configure settings on the left and click &quot;Apply&quot; to see the transformation results.
                        </p>
                        <p className={`text-sm max-w-md ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            You can adjust the train/test split, missing value strategy, normalisation method, and class imbalance handling.
                        </p>
                    </div>

                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${isDarkMode ? 'border-slate-700 text-slate-500 bg-slate-800/50' : 'border-slate-200 text-slate-400 bg-slate-50'}`}>
                        <ArrowLeft className="w-3 h-3" />
                        <span>Adjust settings then Apply</span>
                    </div>
                </div>
            ) : isApplied && !isAnimating ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col space-y-5"
                >
                    <NormalisationViz normMethod={normMethod} isDarkMode={isDarkMode} dataset={dataset} datasetSchema={datasetSchema} primaryStr={primaryStr} secondaryStr={secondaryStr} />
                    <ClassBalanceViz imbalanceMethod={imbalanceMethod} isDarkMode={isDarkMode} dataset={dataset} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />
                </motion.div>
            ) : null}
        </>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Main DataPreparation Component
   ═══════════════════════════════════════════════════════════════ */
const DataPreparation = ({ isDarkMode, onNext, onPrev, domain, patientCount, dataset, datasetSchema, targetColumn }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';



    const [splitRatio, setSplitRatio] = useState(80);
    const [missingValueMethod, setMissingValueMethod] = useState('median');
    const [normalizationMethod, setNormalizationMethod] = useState('z-score');
    const [imbalanceMethod, setImbalanceMethod] = useState('smote');
    const [isApplied, setIsApplied] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Use real patient count from DataExploration; fallback to 300
    const totalPatients = patientCount > 0 ? patientCount : 300;
    const trainCount = Math.round(totalPatients * (splitRatio / 100));
    const testCount = totalPatients - trainCount;

    const handleApply = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsApplied(true);
            setIsAnimating(false);
        }, 1500); // Fake processing delay
    }, []);

    // For re-apply tracking
    const handleSettingsChange = (setter) => (val) => {
        const newVal = typeof val === 'object' ? val.target.value : val;
        setter(newVal);
        if (isApplied) {
            setIsApplied(false);
        }
    };

    const missingOptions = [
        { value: 'median', label: 'Fill with median (recommended)' },
        { value: 'mode', label: 'Fill with most common value' },
        { value: 'remove', label: 'Remove incomplete rows' },
    ];
    const normOptions = [
        { value: 'z-score', label: 'Z-score (recommended)' },
        { value: 'min-max', label: 'Min-Max Scaling (0–1)' },
        { value: 'none', label: 'None (raw values)' },
    ];
    const imbalanceOptions = [
        { value: 'smote', label: 'SMOTE — synthetic oversampling' },
        { value: 'none', label: 'None — keep original' },
    ];

    const missingHelp = {
        'median': 'Fills gaps with the middle value. Preserves all patients and is robust to outliers.',
        'mode': 'Fills gaps with the most frequently occurring value in each column.',
        'remove': 'Removes rows with any missing values. May reduce your dataset size significantly.',
    };
    const normHelp = {
        'z-score': 'Centers data around mean (0) with standard deviation of 1. Best for most ML models.',
        'min-max': 'Scales all values to [0, 1]. Useful when bounded values are needed.',
        'none': 'No scaling. Only suitable for tree-based models that are scale-invariant.',
    };
    const imbalanceHelp = {
        'smote': 'Generates synthetic examples of the minority class so both classes are equally represented.',
        'none': 'Keeps original class distribution. The model may bias towards the majority class.',
    };

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
                                className={'w-10 h-10 rounded-2xl flex items-center justify-center ' + (isDarkMode ? 'bg-white/[0.05]' : 'bg-cyan-100/80')}
                                style={{ boxShadow: `0 0 20px ${primaryStr}15` }}
                            >
                                <FlaskConical className="w-5 h-5" style={{ color: primaryStr }} />
                            </motion.div>
                            <span className={`text-[10px] tracking-[0.15em] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Step 3 · Prep
                            </span>
                        </div>
                        <motion.button
                            onClick={onNext}
                            disabled={!isApplied}
                            whileHover={isApplied ? { scale: 1.02 } : {}}
                            whileTap={isApplied ? { scale: 0.98 } : {}}
                            className={'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ' + (isApplied
                                ? 'text-white shadow-lg'
                                : isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}
                            style={isApplied ? { backgroundColor: primaryStr, boxShadow: `0 8px 30px ${primaryStr}35` } : {}}
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
                        Prepare the{' '}
                        <span style={{
                            background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Evidence
                        </span>
                    </motion.h2>
                    <motion.p
                        className={'text-sm mt-3 max-w-xl leading-relaxed ' + (isDarkMode ? 'text-slate-400' : 'text-slate-600')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Raw data isn’t ready for algorithms. Fill gaps, normalize scales, split into train/test, and address class imbalance.
                    </motion.p>
                </motion.div>

                {/* ── Pipeline Progress ── */}
                <motion.div variants={itemAnim}>
                    <PipelineIndicator isApplied={isApplied} isDarkMode={isDarkMode} primaryStr={primaryStr} secondaryStr={secondaryStr} />
                </motion.div>

                {/* ═══════════════ MAIN BENTO GRID ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ── Left Column: Settings (stacked cards) ── */}
                    <motion.div variants={itemAnim} className="lg:col-span-4 space-y-4">

                        {/* Train / Test Split Card */}
                        <SettingCard icon={Split} label="Train / Test Split" color={secondaryStr} isDarkMode={isDarkMode} delay={0.1}>
                            <div className="flex items-center gap-5">
                                <SplitDonut trainPct={splitRatio} isDarkMode={isDarkMode} primaryStr={primaryStr} secondaryStr={secondaryStr} />
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="range"
                                        min="60"
                                        max="90"
                                        value={splitRatio}
                                        onChange={(e) => {
                                            setSplitRatio(parseInt(e.target.value));
                                            if (isApplied) setIsApplied(false);
                                        }}
                                        className={'w-full h-1.5 rounded-lg appearance-none cursor-pointer ' + (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}
                                        style={{ accentColor: primaryStr }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>60%</span>
                                        <span>90%</span>
                                    </div>
                                    <div className={'grid grid-cols-2 gap-2 text-center text-xs p-2.5 rounded-xl ' + (isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
                                        <div>
                                            <div className={'font-bold text-base tabular-nums ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                                <AnimatedNumber value={trainCount} />
                                            </div>
                                            <div className={'text-[9px] uppercase tracking-widest font-semibold mt-0.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Train</div>
                                        </div>
                                        <div>
                                            <div className={'font-bold text-base tabular-nums ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                                <AnimatedNumber value={testCount} />
                                            </div>
                                            <div className={'text-[9px] uppercase tracking-widest font-semibold mt-0.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Test</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SettingCard>

                        {/* Missing Values Card */}
                        <SettingCard icon={Database} label="Missing Values" color="#f59e0b" isDarkMode={isDarkMode} delay={0.2}>
                            <OptionSelector
                                options={missingOptions}
                                value={missingValueMethod}
                                onChange={handleSettingsChange(setMissingValueMethod)}
                                isDarkMode={isDarkMode}
                                accentColor="#f59e0b"
                            />
                            <p className={'text-[11px] mt-3 leading-relaxed ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                {missingHelp[missingValueMethod]}
                            </p>
                        </SettingCard>

                        {/* Normalisation Card */}
                        <SettingCard icon={Scale} label="Normalisation" color={primaryStr} isDarkMode={isDarkMode} delay={0.3}>
                            <OptionSelector
                                options={normOptions}
                                value={normalizationMethod}
                                onChange={handleSettingsChange(setNormalizationMethod)}
                                isDarkMode={isDarkMode}
                                accentColor={primaryStr}
                            />
                            <p className={'text-[11px] mt-3 leading-relaxed ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                {normHelp[normalizationMethod]}
                            </p>
                        </SettingCard>

                        {/* Class Imbalance Card */}
                        <SettingCard icon={Users} label="Class Imbalance" color="#ec4899" isDarkMode={isDarkMode} delay={0.4}>
                            <OptionSelector
                                options={imbalanceOptions}
                                value={imbalanceMethod}
                                onChange={handleSettingsChange(setImbalanceMethod)}
                                isDarkMode={isDarkMode}
                                accentColor="#ec4899"
                            />
                            <p className={'text-[11px] mt-3 leading-relaxed ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                {imbalanceHelp[imbalanceMethod]}
                            </p>
                        </SettingCard>

                        {/* Apply Button */}
                        <motion.button
                            onClick={handleApply}
                            disabled={isAnimating}
                            whileHover={!isAnimating ? { scale: 1.01, y: -1 } : {}}
                            whileTap={!isAnimating ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className={'w-full py-4 rounded-2xl font-bold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 ' + (isAnimating ? 'cursor-wait opacity-70' : '')}
                            style={{
                                backgroundColor: isApplied ? secondaryStr : primaryStr,
                                boxShadow: `0 8px 30px ${isApplied ? secondaryStr : primaryStr}30`,
                            }}
                        >
                            {isAnimating ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                        <FlaskConical className="w-4 h-4" />
                                    </motion.div>
                                    Processing…
                                </>
                            ) : isApplied ? (
                                <>
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </motion.div>
                                    Settings Applied
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Apply Preparation Settings
                                </>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* ── Right Column: Visualizations ── */}
                    <motion.div variants={itemAnim} className="lg:col-span-8 space-y-5">

                        {/* Main Visualization Panel */}
                        <div className={'rounded-3xl p-6 min-h-[500px] flex flex-col relative overflow-hidden transition-all duration-300 ' + (isDarkMode
                            ? 'bg-white/[0.02] border border-white/[0.06]'
                            : 'bg-emerald-50/50 border border-emerald-100 shadow-md')}
                        >
                            <VisualizationsPanel
                                isApplied={isApplied}
                                isAnimating={isAnimating}
                                isDarkMode={isDarkMode}
                                normMethod={normalizationMethod}
                                imbalanceMethod={imbalanceMethod}
                                dataset={dataset}
                                datasetSchema={datasetSchema}
                                targetColumn={targetColumn}
                                primaryStr={primaryStr}
                                secondaryStr={secondaryStr}
                            />
                        </div>

                        {/* ── Success Banner ── */}
                        <AnimatePresence>
                            {isApplied && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className={'rounded-3xl p-6 flex gap-5 relative overflow-hidden ' + (isDarkMode
                                        ? 'bg-emerald-500/[0.06] border border-emerald-500/20'
                                        : 'bg-emerald-50/80 bg-white border border-slate-200 shadow-md/60')}
                                >
                                    {/* Decorative glow */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: `${secondaryStr}15` }} />

                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                                        className={'p-3 rounded-2xl shrink-0 h-fit ' + (isDarkMode ? 'bg-emerald-500/15' : 'bg-emerald-100')}
                                    >
                                        <CheckCircle2 className={'w-7 h-7 ' + (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')} />
                                    </motion.div>
                                    <div className="relative z-10">
                                        <h4 className={'font-bold text-lg mb-1 ' + (isDarkMode ? 'text-emerald-100' : 'text-emerald-800')}>
                                            ✅ Ready: Data is clean, split, and balanced.
                                        </h4>
                                        <p className={'text-sm leading-relaxed mb-3 ' + (isDarkMode ? 'text-emerald-200/70' : 'text-emerald-900/70')}>
                                            We have set aside <strong>{testCount}</strong> patients to test the model later. The remaining <strong>{trainCount}</strong> patients are balanced and normalised for optimal training.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                `Split: ${splitRatio}/${100 - splitRatio}`,
                                                `Missing: ${missingValueMethod}`,
                                                `Norm: ${normalizationMethod}`,
                                                `Balance: ${imbalanceMethod}`,
                                            ].map((tag, i) => (
                                                <motion.span
                                                    key={tag}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 + i * 0.08 }}
                                                    className={'px-2.5 py-1 rounded-full text-[11px] font-semibold ' + (isDarkMode
                                                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                                        : 'bg-emerald-100 text-emerald-700 bg-white border border-slate-200 shadow-md')}
                                                >
                                                    {tag}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* ── Bottom Navigation ── */}
                <motion.div variants={itemAnim} className={`flex justify-between items-center pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <motion.button
                        onClick={onPrev}
                        whileHover={{ x: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className={'px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ' + (isDarkMode
                            ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50')}
                    >
                        ← Previous
                    </motion.button>
                    <motion.button
                        onClick={onNext}
                        disabled={!isApplied}
                        whileHover={isApplied ? { scale: 1.02, x: 3 } : {}}
                        whileTap={isApplied ? { scale: 0.97 } : {}}
                        className={'flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ' + (isApplied
                            ? 'text-white shadow-lg'
                            : isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}
                        style={isApplied ? { backgroundColor: primaryStr, boxShadow: `0 8px 30px ${primaryStr}35` } : {}}
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DataPreparation;
