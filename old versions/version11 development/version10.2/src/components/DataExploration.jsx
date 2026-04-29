import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Upload, AlertTriangle, ArrowRight, AlertCircle, Database, FileWarning, CheckCircle2, XCircle, Sparkles, BarChart3, Target, Layers, Shield, ChevronDown, Activity, Settings2, LayoutTemplate, ActivitySquare, Users } from 'lucide-react';
import ColumnMapper from './ColumnMapper';
import Papa from 'papaparse';
import { stratifiedSample } from '../utils/mlEngine';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import Tooltip from './Tooltip';

// ─── Specialty → CSV filename mapping ────────────────────────────────────────
const DATASET_MAP = {
    'Cardiology': 'cardiology.csv',
    'Radiology': 'radiology.csv',
    'Nephrology': 'nephrology.csv',
    'Oncology — Breast': 'oncology_breast.csv',
    "Neurology — Parkinson's": 'neurology_parkinsons.csv',
    'Endocrinology — Diabetes': 'endocrinology_diabetes.csv',
    'Hepatology — Liver': 'hepatology_liver.csv',
    'Cardiology — Stroke': 'cardiology_stroke.csv',
    'Mental Health': 'mental_health.csv',
    'Pulmonology — COPD': 'pulmonology_copd.csv',
    'Haematology — Anaemia': 'haematology_anaemia.csv',
    'Dermatology': 'dermatology.csv',
    'Ophthalmology': 'ophthalmology.csv',
    'Orthopaedics — Spine': 'orthopaedics_spine.csv',
    'ICU / Sepsis': 'icu_sepsis.csv',
    'Obstetrics — Fetal Health': 'obstetrics_fetal.csv',
    'Cardiology — Arrhythmia': 'cardiology_arrhythmia.csv',
    'Oncology — Cervical': 'oncology_cervical.csv',
    'Thyroid / Endocrinology': 'thyroid_endocrine.csv',
    'Pharmacy — Readmission': 'pharmacy_readmission.csv',
};

/* ═══════════════════════════════════════════════════════════════
   Animated Counting Number
   ═══════════════════════════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.8, isDarkMode, suffix = '', colorClass }) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const target = typeof value === 'number' ? value : parseFloat(value) || 0;
        let start = 0;
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
    return <span className={colorClass}>{display.toLocaleString()}{suffix}</span>;
};



/* ═══════════════════════════════════════════════════════════════
   Donut Chart for Class Balance
   ═══════════════════════════════════════════════════════════════ */
const DonutChart = React.memo(({ classBalance, isDarkMode, primaryStr }) => {
    const total = Object.values(classBalance).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const entries = Object.entries(classBalance);
    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
    ];

    const radius = 58;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                {entries.map(([label, count], i) => {
                    const pct = count / total;
                    const dashLength = pct * circumference;
                    const dashOffset = accumulated * circumference;
                    accumulated += pct;
                    return (
                        <motion.circle
                            key={label}
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${dashLength} ${circumference}`}
                            strokeDashoffset={-dashOffset}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{ strokeDasharray: `${dashLength} ${circumference}` }}
                            transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 4px ${colors[i % colors.length]}40)` }}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={'text-2xl font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{entries.length}</span>
                <span className={'text-[9px] uppercase tracking-widest font-semibold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Classes</span>
            </div>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Class Balance Chart (bars + donut)
   ═══════════════════════════════════════════════════════════════ */
const ClassBalanceChart = React.memo(({ classBalance, isLoading, isDarkMode, primaryStr }) => {
    if (Object.keys(classBalance).length === 0) {
        return (
            <p className={'text-sm ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                {isLoading ? 'Loading dataset...' : 'Load a dataset to see class distribution.'}
            </p>
        );
    }
    const total = Object.values(classBalance).reduce((a, b) => a + b, 0);
    const entries = Object.entries(classBalance);
    const maxCount = Math.max(...Object.values(classBalance));
    const majorityPct = total > 0 ? Math.round((maxCount / total) * 100) : 0;
    const isImbalanced = majorityPct > 60;
    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Donut */}
                <div className="flex-shrink-0">
                    <DonutChart classBalance={classBalance} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                </div>
                {/* Bars */}
                <div className="flex-1 space-y-3 w-full">
                    {entries.map(([label, count], i) => {
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className={`group flex items-center gap-3 text-sm cursor-default px-3 py-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
                                    style={{ backgroundColor: colors[i % colors.length], boxShadow: `0 0 8px ${colors[i % colors.length]}40` }}
                                />
                                <div className={'w-24 sm:w-36 text-right font-medium truncate transition-colors ' + (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900')}>
                                    {label}
                                </div>
                                <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: pct + '%' }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{
                                            backgroundColor: colors[i % colors.length],
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
                                        }}
                                    />
                                </div>
                                <div className={'w-16 text-right font-mono text-xs font-bold tabular-nums transition-colors ' + (isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}>
                                    {pct}%
                                    <span className={'text-[10px] font-normal ml-1 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                        ({count.toLocaleString()})
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   3D Tilt Measurement Card
   ═══════════════════════════════════════════════════════════════ */
const MeasurementCard = ({ item, index, isTarget, isDarkMode, primaryStr, formatColumnName }) => {
    const hasIssue = item.status === 'warning' || item.status === 'exclude';
    const cardRef = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-50, 50], [6, -6]);
    const rotateY = useTransform(x, [-50, 50], [-6, 6]);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

    const handleMouse = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleLeave = () => { x.set(0); y.set(0); };

    const statusColor = item.status === 'ready'
        ? '#10b981'
        : item.status === 'warning'
            ? '#f59e0b'
            : '#ef4444';

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.6), ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            className={'group relative rounded-2xl p-4 transition-all duration-300 cursor-default overflow-hidden ' + 
                'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] xl:w-[calc(20%-9.6px)] text-left block ' + (
                isTarget
                    ? (isDarkMode ? 'bg-slate-800/80 ring-1 ring-inset shadow-lg ring-white/10' : 'bg-slate-50 border border-slate-200 shadow-md')
                    : (isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-white border border-slate-200 hover:shadow-md')
            )}
            style={{
                rotateX: springX,
                rotateY: springY,
                perspective: 600,
                transformStyle: 'preserve-3d',
                ...(!isDarkMode ? {
                    // Solid white coloring in light mode done via tailwind classes above
                } : {})
            }}
        >
            {/* Animated gradient border on hover */}
            <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${primaryStr}10, transparent 60%)`,
                }}
            />

            {/* Status indicator — animated pulse for warnings */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <div className="relative">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: statusColor }}
                    />
                    {item.status === 'warning' && (
                        <div
                            className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                            style={{ backgroundColor: statusColor, opacity: 0.4 }}
                        />
                    )}
                </div>
            </div>

            <p className={'text-[13px] font-semibold leading-snug truncate pr-6 ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')} title={formatColumnName(item.name)}>
                {formatColumnName(item.name)}
            </p>
            <div className="flex items-center gap-2 mt-2">
                <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded-md ' + (
                    item.type === 'Number'
                        ? (isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                        : item.type === 'Category'
                            ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                            : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500')
                )}>
                    {item.type}
                </span>
                {hasIssue && (
                    <span className={'text-[9px] font-bold uppercase tracking-wider ' + (
                        item.status === 'warning' ? 'text-amber-500' : 'text-red-400'
                    )}>
                        {item.missing !== '0.0%' ? item.missing + ' gap' : 'Excl.'}
                    </span>
                )}
            </div>
            {isTarget && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-2 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${primaryStr}, transparent)` }}
                />
            )}
            {isTarget && (
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1" style={{ color: primaryStr }}>
                    <Target className="w-3 h-3" /> Target
                </span>
            )}
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   NEW DASHBOARD WIDGETS
   ═══════════════════════════════════════════════════════════════ */
const DashboardStatCard = ({ value, label, subtitle, icon: Icon, isDarkMode, delay, color, suffix = '', trend = null }) => (
    <motion.div 
        className="relative overflow-hidden group" 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'white', 
            borderRadius: 24, padding: '24px', margin: 0, display: 'flex', flexDirection: 'column', height: '100%', 
            border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)', 
            boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)' 
        }}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: `${color}15`, color: color }}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
        <div className="relative z-10">
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
            <div className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <AnimatedNumber value={value} isDarkMode={isDarkMode} suffix={suffix} colorClass={isDarkMode ? 'text-white' : 'text-slate-900'} />
            </div>
            {subtitle && <div className={`text-xs mt-2 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</div>}
        </div>
        {/* Subtle background wave/line */}
        <svg className="absolute bottom-0 left-0 w-full h-[100px] opacity-[0.15] pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
             <path d="M0,40 Q25,10 50,20 T100,5 L100,40 L0,40" fill="none" stroke={color} strokeWidth="2" />
             <path d="M0,40 Q25,10 50,20 T100,5 L100,40 L0,40 Z" fill={`url(#grad-${color.replace('#','')})`} />
             <defs>
                 <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor={color} stopOpacity="1" />
                     <stop offset="100%" stopColor={color} stopOpacity="0" />
                 </linearGradient>
             </defs>
        </svg>
    </motion.div>
);

const GaugeChart = ({ value, label, subtitle, color, isDarkMode }) => {
    const radius = 70;
    const strokeWidth = 16;
    const circumference = Math.PI * radius; // Half circle
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative w-full h-full min-h-[220px] pt-4">
            <div className="relative" style={{ width: 180, height: 100 }}>
                {/* Background arc */}
                <svg viewBox="0 0 180 100" className="w-full h-full overflow-visible">
                    <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    {value > 0 && (
                        <motion.path
                            d="M 20 90 A 70 70 0 0 1 160 90"
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
                        />
                    )}
                </svg>
                <div className="absolute bottom-0 inset-x-0 flex flex-col items-center translate-y-3">
                    <AnimatedNumber value={value} duration={1.5} suffix="%" colorClass={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                </div>
            </div>
            <div className="mt-8 text-center">
                <div className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{label}</div>
                {subtitle && <div className={`text-[10px] mt-1 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</div>}
            </div>
        </div>
    );
};

const DataFlowSankey = ({ stats, color, isDarkMode, targetColumn }) => {
    const { patients, missing, missingPct } = stats;
    const validCount = patients - (patients * missingPct / 100);
    
    return (
        <div className="relative w-full h-[260px] flex items-center justify-center">
             {/* Simple visual connection paths */}
             <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 260">
                  <motion.path 
                      d="M 90 130 C 220 130, 240 70, 320 70" 
                      fill="none" stroke="url(#validFlow)" strokeWidth="44" opacity="0.8" 
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }}
                      strokeLinecap="round"
                  />
                  {missingPct > 0 && (
                      <motion.path 
                          d="M 90 130 C 220 130, 240 190, 320 190" 
                          fill="none" stroke="url(#missingFlow)" strokeWidth="24" opacity="0.8"
                          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }}
                          strokeLinecap="round"
                      />
                  )}
                  <defs>
                      <linearGradient id="validFlow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#facc15" />
                          <stop offset="100%" stopColor={color} />
                      </linearGradient>
                      <linearGradient id="missingFlow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#facc15" />
                          <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                  </defs>
             </svg>

             {/* Source Node */}
             <motion.div 
                 className="absolute left-[10px] md:left-[30px] top-[95px] w-28"
                 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
             >
                  <div className={`p-4 rounded-3xl shadow-xl border text-center ${isDarkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                      <div className="text-3xl font-black" style={{ color: '#facc15' }}>
                          <AnimatedNumber value={patients || 0} isDarkMode={isDarkMode} colorClass="" />
                      </div>
                      <div className={`text-[9px] uppercase tracking-wider font-bold mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Rows</div>
                  </div>
             </motion.div>

             {/* Target Node: Valid */}
             <motion.div 
                 className="absolute right-[10px] md:right-[30px] top-[30px] w-36"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
             >
                  <div className={`p-4 rounded-3xl shadow-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <div className="text-sm font-black text-slate-900 dark:text-white">Valid Data</div>
                      </div>
                      <div className="text-xl font-bold mt-2" style={{ color: color }}>
                          <AnimatedNumber value={validCount || 0} isDarkMode={isDarkMode} />
                      </div>
                      <div className={`text-[10px] font-medium mt-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>For: {targetColumn || 'Model'}</div>
                  </div>
             </motion.div>

             {/* Target Node: Missing */}
             <motion.div 
                 className="absolute right-[10px] md:right-[30px] top-[148px] w-36"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
             >
                  <div className={`p-4 rounded-3xl shadow-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <div className="text-sm font-black text-slate-900 dark:text-white">Missing Gaps</div>
                      </div>
                      <div className="text-xl font-bold text-red-500 mt-2">{missingPct || 0}%</div>
                      <div className={`text-[10px] font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Will be imputed</div>
                  </div>
             </motion.div>
        </div>
    );
};

const PyramidBarChart = ({ classBalance, isDarkMode, primaryStr }) => {
    const entries = Object.entries(classBalance);
    if (entries.length === 0) return (
       <div className={`h-full flex items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
           No distribution available
       </div>
    );
    
    // Sort descending by count
    const sorted = entries.sort((a,b) => b[1] - a[1]).slice(0, 7);
    const max = Math.max(...sorted.map(e => e[1]));
    
    return (
        <div className="flex flex-col justify-center gap-3 w-full h-full pt-2 pb-2">
            {sorted.map(([label, count], i) => {
                const pct = (count / max) * 100;
                return (
                    <div key={label} className="flex items-center gap-4 text-xs group">
                        <div className={`w-24 text-right truncate font-bold ${isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'} transition-colors`}>{label}</div>
                        <div className="flex-1 flex items-center justify-center relative h-6">
                            {/* Centered bar (like a pyramid) */}
                            <div className="absolute inset-x-0 h-full flex justify-center items-center">
                                <motion.div 
                                    className="h-3 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                    style={{ background: `linear-gradient(90deg, ${primaryStr}40, ${primaryStr}, ${primaryStr}40)` }}
                                />
                            </div>
                        </div>
                        <div className={`w-12 text-left font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <AnimatedNumber value={count} duration={1} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
const DataExploration = ({ isDarkMode, onNext, onPrev, domain, onPatientCountChange, dataset, setDataset, datasetSchema, setDatasetSchema, targetColumn, setTargetColumn }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    const [useDefaultDataset, setUseDefaultDataset] = useState(true);
    const [dataMode, setDataMode] = useState('default'); // 'default' = max 1000, 'all' = everything
    const [isMapperOpen, setIsMapperOpen] = useState(false);
    const [isMapped, setIsMapped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [classBalance, setClassBalance] = useState({});
    const [measurements, setMeasurements] = useState([]);
    const [stats, setStats] = useState({ patients: 0, measurements: 0, missing: '0%' });
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedFileSize, setUploadedFileSize] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showBlockedBanner, setShowBlockedBanner] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [mapperColumns, setMapperColumns] = useState([]);
    const [parsedData, setParsedData] = useState([]);
    const [totalRowCount, setTotalRowCount] = useState(0);
    const [showGuide, setShowGuide] = useState(false);
    const [hoveredSection, setHoveredSection] = useState(null);
    const [isManageDataOpen, setIsManageDataOpen] = useState(true);

    // Re-load when domain changes or user switches back to default dataset
    useEffect(() => {
        if (useDefaultDataset) {
            handleDefaultDataset();
            // Reset mapping when domain changes
            setIsMapped(false);
            setShowBlockedBanner(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useDefaultDataset, domain?.name]);

    // Recalculate class balance when target column changes
    const computeClassBalance = useCallback((data, targetCol) => {
        if (!data || data.length === 0 || !targetCol) return;
        const counts = {};
        data.forEach(row => {
            let v = row[targetCol];
            if (v === null || v === undefined || v === '') return;
            v = String(v).trim();
            counts[v] = (counts[v] || 0) + 1;
        });
        // If too many unique values (continuous), bin them
        const uniqueKeys = Object.keys(counts);
        if (uniqueKeys.length > 20) {
            // Continuous variable - bin into Low/Medium/High
            const numericVals = data.map(r => Number(r[targetCol])).filter(n => !isNaN(n));
            if (numericVals.length > 0) {
                let min = Infinity, max = -Infinity;
                for (const v of numericVals) { if (v < min) min = v; if (v > max) max = v; }
                const range = max - min || 1;
                const binned = { 'Low': 0, 'Medium': 0, 'High': 0 };
                numericVals.forEach(v => {
                    const pct = (v - min) / range;
                    if (pct < 0.33) binned['Low']++;
                    else if (pct < 0.67) binned['Medium']++;
                    else binned['High']++;
                });
                setClassBalance(binned);
                return;
            }
        }
        // If more than 10, show top 10
        if (uniqueKeys.length > 10) {
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            const top10 = Object.fromEntries(sorted.slice(0, 10));
            const othersCount = sorted.slice(10).reduce((acc, [, c]) => acc + c, 0);
            if (othersCount > 0) top10['Others'] = othersCount;
            setClassBalance(top10);
            return;
        }
        setClassBalance(counts);
    }, []);

    // When user changes target column, recalculate class balance
    useEffect(() => {
        if (parsedData.length > 0 && targetColumn) {
            computeClassBalance(parsedData, targetColumn);
        }
    }, [targetColumn, parsedData, computeClassBalance]);

    const processCSVResults = useCallback((results) => {
        const data = results.data;
        const fields = results.meta.fields;
        if (!data || data.length === 0) { setIsLoading(false); return; }

        setTotalRowCount(data.length);
        setParsedData(data);

        const patients = data.length;
        const numMeasurements = fields.length;
        let totalCells = patients * numMeasurements;
        let emptyCells = 0;

        // Use a subset for statistics computation if dataset is huge
        const statsData = data.length > 5000 ? data.slice(0, 5000) : data;

        // Known binary/categorical column names
        const KNOWN_CATEGORY_COLS = new Set([
            'sex', 'gender', 'smoking', 'diabetes', 'anaemia', 'anemia',
            'high_blood_pressure', 'hypertension', 'outcome', 'class',
            'diagnosis', 'status', 'result', 'target', 'label',
            'fetal_health', 'readmitted', 'stroke', 'biopsy',
            'DEATH_EVENT', 'exacerbation', 'severity', 'dx_type',
            'arrhythmia', 'sepsis', 'SepsisLabel'
        ]);

        const newMeasurements = fields.map((field, idx) => {
            let missingCount = 0;
            statsData.forEach(row => {
                const val = row[field];
                if (val === null || val === undefined || val === '') {
                    missingCount++;
                    emptyCells++;
                }
            });
            const missingPctVal = (missingCount / statsData.length) * 100;
            const firstVal = data.find(r => r[field] !== null && r[field] !== undefined && r[field] !== '')?.[field];

            // Improved type detection
            let type = !isNaN(Number(firstVal)) ? 'Number' : 'Category';
            const fieldLower = field.toLowerCase();
            if (fieldLower.includes('id') && !fieldLower.includes('diabetes')) type = 'Identifier';

            // Check if this is a known categorical column
            if (KNOWN_CATEGORY_COLS.has(field) || KNOWN_CATEGORY_COLS.has(fieldLower)) {
                type = 'Category';
            }

            // Check if numeric column is actually binary (0/1 only) → treat as Category
            if (type === 'Number') {
                const sampleVals = statsData.slice(0, 200).map(r => r[field]).filter(v => v !== null && v !== undefined && v !== '');
                const uniqueVals = new Set(sampleVals.map(v => String(v).trim()));
                if (uniqueVals.size <= 2) {
                    const vals = [...uniqueVals];
                    const allBinary = vals.every(v => v === '0' || v === '1' || v === 'true' || v === 'false' || v === 'yes' || v === 'no' || v === 'male' || v === 'female' || v === 'M' || v === 'F');
                    if (allBinary || uniqueVals.size <= 2) {
                        type = 'Category';
                    }
                }
            }

            let action = 'Ready';
            let status = 'ready';
            if (type === 'Identifier') { action = 'Exclude — Not a clinical measurement'; status = 'exclude'; }
            else if (missingPctVal > 0) { action = 'Fill Missing Values'; status = 'warning'; }
            return { name: field, type, missing: missingPctVal.toFixed(1) + '%', action, status, missingPctVal, isTarget: idx === fields.length - 1 };
        });

        const missingTotalPct = ((emptyCells / (statsData.length * numMeasurements || 1)) * 100).toFixed(1);
        setStats({ patients, measurements: numMeasurements, missing: missingTotalPct + '%' });
        setMeasurements(newMeasurements);

        // Smart Target Column Auto-Detection
        const targetKeywords = ['outcome', 'target', 'diagnosis', 'status', 'label', 'sepsislabel', 'stroke', 'readmitted', 'death_event', 'class', 'biopsy', 'severity', 'exacerbation'];
        let guessedTarget = fields[fields.length - 1];
        for (const field of fields) {
            if (targetKeywords.includes(field.toLowerCase())) {
                guessedTarget = field;
                break;
            }
        }

        // Build mapper columns for ColumnMapper
        const mapCols = fields.map((field, idx) => {
            const m = newMeasurements[idx];
            return {
                name: field,
                type: m.type,
                missingPct: m.missingPctVal,
                isTarget: field === guessedTarget,
            };
        });
        setMapperColumns(mapCols);

        setTargetColumn(guessedTarget || '');

        // Compute class balance using the target column
        computeClassBalance(data, guessedTarget);

        // DON'T report total parsed row count — report the actual dataset size
        // that will be used (after sampling). patientCount is updated later in handleMapperSave.
        // For now, report the total so the UI can show it before mapping.
        onPatientCountChange?.(patients);
        setIsLoading(false);
        setUploadSuccess(true);
    }, [onPatientCountChange, computeClassBalance]);

    const handleDefaultDataset = useCallback(() => {
        setIsLoading(true);
        setMeasurements([]);
        setClassBalance({});
        setUploadError('');
        setUploadSuccess(false);
        const filename = DATASET_MAP[domain?.name] || 'cardiology.csv';
        Papa.parse('/datasets/' + filename, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: processCSVResults,
            error: (err) => {
                console.error('Error loading dataset:', err);
                setIsLoading(false);
                setUploadError('Failed to load the default dataset. Please try again.');
            }
        });
    }, [domain?.name, processCSVResults]);

    const validateFile = (file) => {
        // Check extension
        if (!file.name.toLowerCase().endsWith('.csv')) {
            return 'Invalid file type. Please upload a .csv file only.';
        }
        // Check size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            return 'File is too large. Maximum file size is 50 MB.';
        }
        // Check empty file
        if (file.size === 0) {
            return 'The uploaded file is empty. Please select a valid CSV file.';
        }
        return null;
    };

    const handleFileUpload = (e) => {
        const file = e.type === 'drop' ? e.dataTransfer.files[0] : e.target.files[0];
        if (!file) return;

        setUploadError('');
        setUploadSuccess(false);

        // Validate file
        const error = validateFile(file);
        if (error) {
            setUploadError(error);
            return;
        }

        setIsLoading(true);
        setMeasurements([]);
        setClassBalance({});
        setUploadedFileName(file.name);
        setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');
        setUseDefaultDataset(false);
        setIsMapped(false);
        setShowBlockedBanner(false);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Validate parsed data
                if (!results.data || results.data.length < 10) {
                    setUploadError('The CSV file must contain at least 10 rows (patients). Please check the file and try again.');
                    setIsLoading(false);
                    return;
                }
                if (!results.meta.fields || results.meta.fields.length < 2) {
                    setUploadError('The CSV file must have at least 2 columns (1 feature + 1 target). Found: ' + (results.meta.fields?.length || 0));
                    setIsLoading(false);
                    return;
                }

                // Verify at least one numeric measurement column exists
                const hasNumericColumn = results.meta.fields.some(field => {
                    const firstVal = results.data.find(r => r[field] !== null && r[field] !== undefined && r[field] !== '')?.[field];
                    if (firstVal === undefined || firstVal === null || String(firstVal).trim() === '') return false;
                    return !isNaN(Number(firstVal));
                });

                if (!hasNumericColumn) {
                    setUploadError('The CSV file must contain at least one numeric measurement column.');
                    setIsLoading(false);
                    return;
                }

                processCSVResults(results);
            },
            error: (err) => {
                console.error('Error parsing CSV:', err);
                setUploadError('Failed to parse the CSV file. Please check the file format and try again.');
                setIsLoading(false);
            }
        });
    };

    const handleMapperSave = (schemaOK, mappedCols) => {
        if (schemaOK) {
            setIsMapped(true);
            setShowBlockedBanner(false);
            if (mappedCols) {
                setDatasetSchema(mappedCols);
                const target = mappedCols.find(c => c.role === 'Target (what we predict)')?.name;
                if (target) {
                    setTargetColumn(target);
                }
            }
            if (parsedData && parsedData.length > 0) {
                // Apply sampling based on dataMode
                if (dataMode === 'default' && parsedData.length > 1000) {
                    const lastField = targetColumn || measurements[measurements.length - 1]?.name;
                    const sampled = stratifiedSample(parsedData, lastField, 1000);
                    setDataset(sampled);
                    // Update patientCount to reflect the ACTUAL sampled dataset size
                    onPatientCountChange?.(sampled.length);
                } else {
                    setDataset(parsedData);
                    // Update patientCount to reflect full dataset size
                    onPatientCountChange?.(parsedData.length);
                }
            }
        }
        setIsMapperOpen(false);
    };

    const handleNextClick = () => {
        if (!isMapped) {
            setShowBlockedBanner(true);
            // Auto-dismiss after 5 seconds
            setTimeout(() => setShowBlockedBanner(false), 5000);
            return;
        }
        onNext();
    };

    const formatColumnName = (col) => {
        // Target column special mappings
        const targetMapping = {
            'DEATH_EVENT': 'Readmitted within 30 days (Yes / No)',
            'diagnosis': 'Diagnosis category (Malignant / Benign)',
            'Outcome': 'Clinical Outcome (Yes / No)',
            'classification': 'Disease Classification (CKD / Not CKD)',
            'stroke': 'Stroke occurrence (Yes / No)',
            'SepsisLabel': 'Sepsis onset (Yes / No)',
            'Biopsy': 'Biopsy Result (Yes / No)',
            'arrhythmia': 'Arrhythmia presence (Yes / No)',
            'status': 'Disease Status (Positive / Negative)',
            'Finding_Label': 'Finding Label (Normal / Abnormal)',
            'fetal_health': 'Fetal Health (Normal / Suspect / Pathological)',
            'readmitted': 'Readmission (<30 / >30 / No)',
            'class': 'Classification (Normal / Abnormal)',
            'dx_type': 'Diagnosis Type (Benign / Malignant)',
            'severity': 'Severity Grade',
            'anemia_type': 'Anaemia Type (Multi-class)',
            'exacerbation': 'Exacerbation Risk (Yes / No)',
            'Dataset': 'Liver Disease (Yes / No)',
        };
        if (targetMapping[col]) return targetMapping[col];
        // Convert snake_case and camelCase to human-readable Title Case
        return col
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    // Counts for the mini legend
    const readyCount = measurements.filter(m => m.status === 'ready').length;
    const warningCount = measurements.filter(m => m.status === 'warning').length;
    const excludeCount = measurements.filter(m => m.status === 'exclude').length;

    const missingVal = parseFloat(stats.missing);
    const missingColor = missingVal === 0 ? '#10b981' : missingVal < 5 ? '#f59e0b' : '#ef4444';
    const missingLabel = missingVal === 0 ? 'No Gaps' : missingVal < 5 ? 'Minor Gaps' : 'Needs Attention';

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative max-w-7xl mx-auto w-full">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-6">
                {/* Header */}
                <motion.div variants={itemAnim} className="flex items-center justify-between mb-8">
                    <div>
                        <motion.h1 
                            className="text-3xl font-black tracking-tight"
                            style={{ color: isDarkMode ? '#fff' : '#0f172a' }}
                        >
                            Data Profile Dashboard
                        </motion.h1>
                        <p className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Dataset metrics, health checks, and demographics
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsManageDataOpen(!isManageDataOpen)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${isManageDataOpen ? (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600') : (isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-900 text-white hover:bg-slate-800')}`}
                    >
                        <Database className="w-4 h-4" />
                        {isManageDataOpen ? 'Hide Data Source' : 'Manage Data'}
                    </button>
                </motion.div>

                {/* Blocked Banner */}
                <AnimatePresence>
                    {showBlockedBanner && !isMapped && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className={`p-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm ${isDarkMode
                                ? 'bg-red-950/40 text-red-200 border border-red-500/20'
                                : 'bg-red-50 text-red-700 border border-red-200'}`}
                        >
                            <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                            <div className="flex-1">
                                <h4 className={`font-semibold text-sm mb-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Dataset Needs Validation</h4>
                                <p className="text-sm">Verify your target outcome and continue via the column mapper.</p>
                                <button
                                    onClick={() => setIsMapperOpen(true)}
                                    className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDarkMode
                                        ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                >
                                    Validate Now →
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload Error */}
                <AnimatePresence>
                    {uploadError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-2xl flex items-start gap-3 ${isDarkMode ? 'bg-red-950/40 text-red-200' : 'bg-red-50 text-red-700'}`}
                        >
                            <FileWarning className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                            <div className="flex-1 text-sm">{uploadError}</div>
                            <button onClick={() => setUploadError('')}>
                                <XCircle className="w-4 h-4 opacity-60 hover:opacity-100" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Data Source Panel (Collapsible) */}
                <AnimatePresence>
                    {isManageDataOpen && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className={`p-6 rounded-[32px] overflow-hidden relative ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure Data Source</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left: Source toggle + upload */}
                                    <div className="space-y-4">
                                        <div className={`inline-flex p-1 rounded-2xl ${isDarkMode ? 'bg-slate-900/60' : 'bg-white shadow-sm border border-slate-200'}`}>
                                            <button
                                                onClick={() => setUseDefaultDataset(true)}
                                                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${useDefaultDataset ? (isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900') : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Default Dataset
                                            </button>
                                            <button
                                                onClick={() => setUseDefaultDataset(false)}
                                                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${!useDefaultDataset ? (isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900') : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Upload CSV
                                            </button>
                                        </div>
                                        {/* Upload area or default hint here... */}
                                        {!useDefaultDataset && (
                                            <label className={`relative w-full rounded-2xl h-24 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                                                {isLoading ? 'Parsing...' : uploadedFileName ? <span className="font-semibold text-emerald-500">{uploadedFileName} uploaded</span> : <div className="flex items-center gap-2"><Upload size={16}/><span>Drop CSV here or click</span></div>}
                                            </label>
                                        )}
                                        {useDefaultDataset && (
                                            <div className={`p-4 rounded-xl text-sm ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}`}>
                                                Using default clinical dataset for {domain?.name}. Data is automatically sampled to 1,000 rows for optimal performance.
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Right: Target Config */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-[0.18em] mb-2 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Target Outcome</label>
                                            <select
                                                value={targetColumn}
                                                onChange={(e) => {
                                                    const newTarget = e.target.value;
                                                    setTargetColumn(newTarget);
                                                    setMapperColumns(prev => prev.map(col => ({ ...col, isTarget: col.name === newTarget })));
                                                }}
                                                className={`w-full p-3.5 rounded-2xl appearance-none outline-none text-sm font-bold ${isDarkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900 border border-slate-300'}`}
                                            >
                                                {measurements.map(m => <option key={m.name} value={m.name}>{formatColumnName(m.name)}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => setIsMapperOpen(true)}
                                            className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold transition-all ${isMapped ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-900 text-white hover:bg-slate-800')}`}
                                        >
                                            {isMapped ? <><CheckCircle2 className="w-5 h-5"/> Schema Validated</> : <><Shield className="w-5 h-5"/> Validate Dataset Columns</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Metrics Grid */}
                <motion.div variants={itemAnim} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardStatCard
                        value={stats.patients}
                        label="Patient Records"
                        subtitle="Total volume of clinical data"
                        icon={Users}
                        isDarkMode={isDarkMode}
                        delay={0.1}
                        color={primaryStr}
                    />
                    <DashboardStatCard
                        value={stats.measurements}
                        label="Available Features"
                        subtitle="Clinical variables per patient"
                        icon={LayoutTemplate}
                        isDarkMode={isDarkMode}
                        delay={0.2}
                        color={secondaryStr}
                    />
                    <DashboardStatCard
                        value={100 - parseFloat(stats.missing || '0')}
                        label="Data Completeness"
                        subtitle="Percentage without missing values"
                        icon={ActivitySquare}
                        isDarkMode={isDarkMode}
                        delay={0.3}
                        color={parseFloat(stats.missing || '0') < 5 ? '#10b981' : '#f59e0b'}
                        suffix="%"
                    />
                </motion.div>

                {/* Complex Charts Grid */}
                <motion.div variants={itemAnim} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left/Middle: Flow/Sankey (takes up 2 cols) */}
                    <div className={`lg:col-span-2 p-6 rounded-[32px] overflow-hidden relative ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center gap-2 mb-2">
                             <Layers className="w-5 h-5" style={{ color: primaryStr }} />
                             <h3 className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dataset Composition Architecture</h3>
                        </div>
                        <DataFlowSankey 
                            stats={{ patients: stats.patients, missing: parseFloat(stats.missing || '0'), missingPct: parseFloat(stats.missing || '0') }} 
                            color={primaryStr} 
                            isDarkMode={isDarkMode} 
                            targetColumn={formatColumnName(targetColumn)} 
                        />
                    </div>

                    {/* Right: Class Pyramid & Gauge Stack */}
                    <div className="flex flex-col gap-6">
                        {/* Target Distribution Pyramid */}
                        <div className={`flex-1 p-6 rounded-[32px] overflow-hidden relative ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                            <h3 className={`text-[11px] font-bold uppercase tracking-widest text-center mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Target Class Distribution</h3>
                            <PyramidBarChart classBalance={classBalance} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                        </div>

                        {/* Data Quality Gauge */}
                        <div className={`p-6 py-8 rounded-[32px] overflow-hidden relative ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                            <GaugeChart 
                                value={100 - parseFloat(stats.missing || '0')} 
                                label="Data Readiness Score"
                                subtitle={parseFloat(stats.missing || '0') === 0 ? "Perfect Quality" : "Imputation required for missing data"}
                                color={parseFloat(stats.missing || '0') < 5 ? '#10b981' : '#f59e0b'}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Navigation */}
                <motion.div variants={itemAnim} className={`flex justify-between items-center pt-8 mt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <motion.button
                        onClick={onPrev}
                        whileHover={{ x: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        ← Back to Context
                    </motion.button>
                    <motion.button
                        onClick={handleNextClick}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isMapped ? 'text-white shadow-xl' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}
                        style={isMapped ? { backgroundColor: primaryStr, boxShadow: `0 8px 30px ${primaryStr}40` } : {}}
                    >
                        Explore Data Preparation <ArrowRight className="w-4 h-4 ml-1" />
                    </motion.button>
                </motion.div>
            </div>

            {/* Mapper Modal */}
            <AnimatePresence>
                {isMapperOpen && (
                    <ColumnMapper
                        isOpen={isMapperOpen}
                        onClose={() => setIsMapperOpen(false)}
                        onSave={handleMapperSave}
                        isDarkMode={isDarkMode}
                        columns={mapperColumns}
                        formatColumnName={formatColumnName}
                        primaryStr={primaryStr}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DataExploration;
