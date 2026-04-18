import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sliders, CheckCircle2, AlertCircle, BarChart3, Database, Split, Scale, Users, Sparkles, Zap, ChevronDown, Layers, Shield, FlaskConical, ArrowRightLeft } from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import Tooltip from './Tooltip';

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
   iOS Controls
   ═══════════════════════════════════════════════════════════════ */
function SegmentedControl({ options, selected, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-card-secondary)', padding: 4, borderRadius: 12, marginTop: 8 }}>
      {options.map(opt => (
        <div 
          key={opt.value} 
          onClick={() => onChange(opt.value)} 
          style={{ 
            flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 10,
            background: selected === opt.value ? 'var(--bg-card)' : 'transparent',
            boxShadow: selected === opt.value ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: selected === opt.value ? 600 : 500,
            color: selected === opt.value ? 'var(--text-main)' : 'var(--text-sec)',
            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s ease' 
          }}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}

function IosSwitch({ checked, onChange, disabled }) {
  return (
    <div 
      onClick={() => !disabled && onChange(!checked)} 
      style={{ 
        width: 50, height: 30, borderRadius: 15, background: checked ? 'var(--ios-green)' : 'var(--border)', 
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <motion.div 
        style={{ 
          width: 26, height: 26, borderRadius: 13, background: 'white', 
          position: 'absolute', top: 2, left: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' 
        }} 
        animate={{ x: checked ? 20 : 0 }} 
        transition={{ type: 'spring', stiffness: 500, damping: 30 }} 
      />
    </div>
  );
}

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
            className={'rounded-2xl p-5 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm')}
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
            className={'rounded-2xl p-5 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm')}
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
                                className={'p-4 rounded-2xl ' + (isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm')}
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
                    <motion.p 
                        className="hero-subtitle" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', marginBottom: 32 }}
                    >
                        Preprocessing Options
                    </motion.p>
                </motion.div>

                {/* ── Pipeline Progress ── */}
                <motion.div variants={itemAnim}>
                    <PipelineIndicator isApplied={isApplied} isDarkMode={isDarkMode} primaryStr={primaryStr} secondaryStr={secondaryStr} />
                </motion.div>

                {/* ═══════════════ MAIN BENTO GRID ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ── Left Column: iOS List Settings ── */}
                    <motion.div variants={itemAnim} className="lg:col-span-4 space-y-4">
                        <motion.div className="ios-list">
                            {/* Train / Test Split */}
                            <div className="ios-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div>
                                        <div className="ios-list-title">Data Split</div>
                                        <div className="ios-list-subtitle">Train / Test ratio</div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: primaryStr }}>{splitRatio}%</div>
                                </div>
                                <input
                                    type="range"
                                    min="60"
                                    max="90"
                                    value={splitRatio}
                                    onChange={(e) => {
                                        setSplitRatio(parseInt(e.target.value));
                                        if (isApplied) setIsApplied(false);
                                    }}
                                    className={'premium-slider w-full h-1.5 mb-3 ' + (isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200')}
                                    style={{
                                        background: `linear-gradient(to right, ${primaryStr} ${((splitRatio - 60) / (90 - 60)) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${((splitRatio - 60) / (90 - 60)) * 100}%)`,
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: 'var(--text-sec)' }}>
                                    <span>Train: {trainCount}</span>
                                    <span>Test: {testCount}</span>
                                </div>
                            </div>

                            {/* Missing Values */}
                            <div className="ios-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div>
                                    <div className="ios-list-title">Missing Values</div>
                                    <div className="ios-list-subtitle">How to handle empty fields</div>
                                </div>
                                <SegmentedControl
                                    options={[
                                        { value: 'median', label: 'Median' },
                                        { value: 'mode', label: 'Mode' },
                                        { value: 'remove', label: 'Drop' }
                                    ]}
                                    selected={missingValueMethod}
                                    onChange={handleSettingsChange(setMissingValueMethod)}
                                />
                            </div>

                            {/* Normalisation */}
                            <div className="ios-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div>
                                    <div className="ios-list-title">Normalisation</div>
                                    <div className="ios-list-subtitle">Scale variables evenly</div>
                                </div>
                                <SegmentedControl
                                    options={[
                                        { value: 'z-score', label: 'Z-Score' },
                                        { value: 'min-max', label: 'Min-Max' },
                                        { value: 'none', label: 'None' }
                                    ]}
                                    selected={normalizationMethod}
                                    onChange={handleSettingsChange(setNormalizationMethod)}
                                />
                            </div>

                            {/* Class Imbalance */}
                            <div className="ios-list-item">
                                <div>
                                    <div className="ios-list-title">Address Imbalance (SMOTE)</div>
                                    <div className="ios-list-subtitle">Generate synthetic data</div>
                                </div>
                                <IosSwitch
                                    checked={imbalanceMethod === 'smote'}
                                    onChange={(val) => handleSettingsChange(setImbalanceMethod)(val ? 'smote' : 'none')}
                                />
                            </div>
                        </motion.div>

                        {/* Apply Button */}
                        <motion.button
                            onClick={handleApply}
                            disabled={isAnimating}
                            whileHover={!isAnimating ? { scale: 1.01, y: -1 } : {}}
                            whileTap={!isAnimating ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className={'w-full py-4 rounded-2xl font-bold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 ios-card ' + (isAnimating ? 'cursor-wait opacity-70' : '')}
                            style={{
                                backgroundColor: isApplied ? secondaryStr : primaryStr,
                                boxShadow: `0 8px 30px ${isApplied ? secondaryStr : primaryStr}30`,
                                marginTop: 16, padding: '16px', margin: '16px 0 0 0'
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
                        <div className={'relative min-h-[500px] flex flex-col overflow-hidden rounded-3xl p-6 transition-all duration-300 ' + (isDarkMode 
                            ? 'bg-white/[0.02] border border-white/[0.06]' 
                            : 'bg-white border border-slate-200 shadow-sm')}
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

                        {/* ── Minimal Success Indicator ── */}
                        <AnimatePresence>
                            {isApplied && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-center -mt-2 mb-2"
                                >
                                    <Tooltip
                                        position="top"
                                        noUnderline
                                        isDarkMode={isDarkMode}
                                        content={
                                            <div className="flex flex-col gap-2 p-1">
                                                <div className="font-bold border-b pb-1 mb-1 border-emerald-500/20 text-emerald-500">
                                                    Prepared & Ready
                                                </div>
                                                <p className="opacity-90">
                                                    Reserved <strong>{testCount}</strong> patients for testing.
                                                    Remaining <strong>{trainCount}</strong> are balanced & scaled.
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-mono opacity-80 uppercase">
                                                    <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded">Split: {splitRatio}/{100 - splitRatio}</span>
                                                    <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded">Missing: {missingValueMethod.substring(0,6)}</span>
                                                    <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded">Norm: {normalizationMethod}</span>
                                                    <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded">Bal: {imbalanceMethod}</span>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <div className={'flex items-center gap-2 px-4 py-2 rounded-full cursor-help transition-all duration-300 border '
                                            + (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100')}>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Data Is Ready For Modeling</span>
                                        </div>
                                    </Tooltip>
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
