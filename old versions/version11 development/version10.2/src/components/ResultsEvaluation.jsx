import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Target, Eye, ArrowRight,
    Users, FileWarning, CheckSquare, XSquare, AlertCircle, Calendar,
    ChevronDown, HeartPulse, AlertTriangle
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';

/* ═══════════════════════════════════════════════════════════════
   Animated Number
   ═══════════════════════════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.5, decimals = 0, isPercent = false }) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const target = typeof value === 'number' ? value : parseFloat(value) || 0;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(eased * target);
            if (progress < 1) ref.current = requestAnimationFrame(animate);
            else setDisplay(target);
        };
        ref.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(ref.current);
    }, [value, duration]);
    return <span>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
};

/* ═══════════════════════════════════════════════════════════════
   Dashboard Card Shell
   ═══════════════════════════════════════════════════════════════ */
const Card = ({ children, title, subtitle, action, className = '', isDarkMode }) => (
    <div className={`border rounded-2xl flex flex-col overflow-hidden transition-colors ${isDarkMode ? 'bg-[#131316] border-[#1f1f23]' : 'bg-white border-gray-200 shadow-sm'} ${className}`}>
        {(title || action) && (
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <div>
                    {title && <h3 className={`text-[15px] font-medium tracking-tight ${isDarkMode ? 'text-[#e0e0e0]' : 'text-gray-800'}`}>{title}</h3>}
                    {subtitle && <p className={`text-[12px] mt-1 ${isDarkMode ? 'text-[#777]' : 'text-gray-500'}`}>{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="px-6 pb-6 flex-1 flex flex-col">{children}</div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   Top Metric Card
   ═══════════════════════════════════════════════════════════════ */
const TopMetricCard = ({ icon: Icon, title, value, subtext, subtextColor, subtextLightColor, isPercent = true, isLast = false, delay = 0, isDarkMode }) => {
    const bgClass = isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-gray-50 border-gray-100';
    const bgLastClass = isDarkMode ? 'bg-gradient-to-br from-[#1c1c20] to-[#2a2a1a] border-[#3f3f46]' : 'bg-gradient-to-br from-gray-50 to-gray-200/50 border-gray-200';
    const iconBgClass = isDarkMode ? 'bg-[#27272a] border-[#3f3f46]/50' : 'bg-white border-gray-200 shadow-sm';
    
    // For specific subtext highlight colors to pop well on light mode too
    const finalSubColor = !isDarkMode && subtextLightColor ? subtextLightColor : subtextColor;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`relative p-5 rounded-2xl border flex flex-col justify-between min-h-[135px] overflow-hidden ${isLast ? bgLastClass : bgClass}`}
        >
            {isLast && <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full pointer-events-none ${isDarkMode ? 'bg-[#c8d84a]/20' : 'bg-[#c8d84a]/30'}`} />}
            
            <div className="flex items-start gap-3 relative z-10">
                <div className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center ${iconBgClass}`}>
                    {Icon && <Icon className={`w-4 h-4 ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`} />}
                </div>
                <span className={`text-[13px] font-medium leading-tight whitespace-pre-wrap ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-700'}`}>{title}</span>
            </div>

            <div className="mt-4 relative z-10">
                <div className={`text-[28px] font-bold leading-none tracking-tight tabular-nums mb-1.5 flex items-baseline ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedNumber value={isPercent ? value * 100 : value} decimals={isPercent ? 1 : 2} />
                    {isPercent && <span className={`text-[16px] ml-0.5 ${isDarkMode ? 'text-[#71717a]' : 'text-gray-400'}`}>%</span>}
                </div>
                
                <div className="text-[12px] font-medium flex items-center gap-1" style={{ color: finalSubColor }}>
                    {(subtextColor === '#34d399' || subtextColor === '#10b981') && '+ '}{subtext}
                </div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   ROC Curve Content
   ═══════════════════════════════════════════════════════════════ */
const ROCCurve = ({ auc = 0.5, isDarkMode }) => {
    const points = [];
    for (let i = 0; i <= 40; i++) {
        const fpr = i / 40; 
        let tpr = fpr;
        if (auc > 0.5) {
            const power = (1 - Math.min(auc, 0.999)) / Math.min(auc, 0.999);
            tpr = Math.pow(fpr, power);
        }
        points.push({ x: fpr * 100, y: 100 - (tpr * 100) });
    }
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

    const gridColor = isDarkMode ? '#27272a' : '#f3f4f6';
    const axisColor = isDarkMode ? '#3f3f46' : '#d1d5db';
    const textColor = isDarkMode ? '#71717a' : '#9ca3af';
    const titleColor = isDarkMode ? '#a1a1aa' : '#6b7280';
    const randColor = isDarkMode ? '#52525b' : '#d1d5db';
    const panelBg = isDarkMode ? 'bg-[#18181b]/80 border-[#27272a]' : 'bg-white/80 border-gray-200 shadow-sm text-gray-800';

    return (
        <div className="flex flex-col items-center justify-center w-full flex-1 relative mt-6 px-6 pb-6 min-h-[340px]">
            <svg viewBox="-15 -10 130 130" className="w-full h-full max-w-[480px] mx-auto overflow-visible max-h-full">
                {/* Grid */}
                {[25, 50, 75].map(v => (
                    <g key={`grid-${v}`}>
                        <line x1={v} y1="0" x2={v} y2="100" stroke={gridColor} strokeWidth="0.5" strokeDasharray="3 3" />
                        <line x1="0" y1={v} x2="100" y2={v} stroke={gridColor} strokeWidth="0.5" strokeDasharray="3 3" />
                    </g>
                ))}
                
                {/* Axes */}
                <line x1="0" y1="100" x2="100" y2="100" stroke={axisColor} strokeWidth="1.5" />
                <line x1="0" y1="0" x2="0" y2="100" stroke={axisColor} strokeWidth="1.5" />
                
                {/* Labels */}
                {['0.0', '0.25', '0.50', '0.75', '1.0'].map((lbl, i) => {
                    const pos = i * 25;
                    return (
                        <g key={`lbl-${lbl}`}>
                            <text x="-3" y={100 - pos} fill={textColor} fontSize="3.5" textAnchor="end" alignmentBaseline="middle">{lbl}</text>
                            <text x={pos} y="105" fill={textColor} fontSize="3.5" textAnchor="middle">{lbl}</text>
                        </g>
                    );
                })}
                
                {/* Axis Titles */}
                <text x="50" y="112" fill={titleColor} fontSize="4" fontWeight="500" textAnchor="middle">False Positive Rate (1 - Specificity)</text>
                <text x="-10" y="50" fill={titleColor} fontSize="4" fontWeight="500" textAnchor="middle" transform="rotate(-90, -10, 50)">True Positive Rate (Sensitivity)</text>

                {/* Random Guessing */}
                <line x1="0" y1="100" x2="100" y2="0" stroke={randColor} strokeWidth="1" strokeDasharray="2 2" />
                <text x="50" y="47" fill={randColor} fontSize="3" transform="rotate(-45, 50, 50)">Random Guess</text>
                
                {/* AUC Area */}
                <path d={`${pathD} L 100 100 L 0 100 Z`} fill="url(#aucGrad)" opacity="0.3" />
                
                {/* Curve */}
                <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.5))' }} />
                
                {/* Gradient */}
                <defs>
                    <linearGradient id="aucGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
            
            <div className={`absolute top-2 right-4 backdrop-blur border rounded-xl p-4 flex flex-col items-center ${panelBg}`}>
                <span className={`text-[11px] font-medium mb-0.5 ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>AUC Score</span>
                <span className={`text-[22px] font-bold tabular-nums leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedNumber value={auc} decimals={2} />
                </span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Confusion Matrix List
   ═══════════════════════════════════════════════════════════════ */
const ConfusionMatrixList = ({ tp, tn, fp, fn, isDarkMode }) => {
    const total = tp + tn + fp + fn;
    
    const hdrColor = isDarkMode ? 'text-[#71717a]' : 'text-gray-400';
    const itemHoverBg = isDarkMode ? 'hover:bg-[#18181b]' : 'hover:bg-gray-50';
    const itemHoverBorder = isDarkMode ? 'hover:border-[#27272a]' : 'hover:border-gray-200';
    const titleColor = isDarkMode ? 'text-[#e4e4e7]' : 'text-gray-800';
    const descColor = isDarkMode ? 'text-[#71717a] group-hover:text-[#a1a1aa]' : 'text-gray-500 group-hover:text-gray-600';
    const valColor = isDarkMode ? 'text-white' : 'text-gray-900';

    const greenIcoBg = isDarkMode ? 'bg-[#132b1f]' : 'bg-[#e6f4ea]';
    const redIcoBg = isDarkMode ? 'bg-[#2e1616]' : 'bg-[#fce8e8]';

    return (
        <div className="flex flex-col gap-1.5 pb-2">
            <div className={`grid grid-cols-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider mb-2 ${hdrColor}`}>
                <div className="col-span-2">Outcome</div>
                <div className="text-right">Count</div>
                <div className="text-right">Rate</div>
            </div>

            {/* True Negative */}
            <div className={`p-3 rounded-xl bg-transparent border border-transparent transition-all flex items-center justify-between group ${itemHoverBg} ${itemHoverBorder}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${greenIcoBg}`}>
                        <CheckSquare className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div>
                        <div className={`text-[13px] font-medium flex items-center gap-2 ${titleColor}`}>Correctly Safe <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /></div>
                        <div className={`text-[11px] transition-colors mt-0.5 ${descColor}`}>Predicted safe, actually safe</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <div className={`text-[15px] font-bold tabular-nums ${valColor}`}><AnimatedNumber value={tn} /></div>
                    <div className="text-[11px] text-[#10b981] font-medium">{total > 0 ? ((tn/total)*100).toFixed(1) : 0}%</div>
                </div>
            </div>
            
            {/* True Positive */}
            <div className={`p-3 rounded-xl bg-transparent border border-transparent transition-all flex items-center justify-between group ${itemHoverBg} ${itemHoverBorder}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${greenIcoBg}`}>
                        <CheckSquare className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div>
                        <div className={`text-[13px] font-medium flex items-center gap-2 ${titleColor}`}>Correctly High-Risk <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /></div>
                        <div className={`text-[11px] transition-colors mt-0.5 ${descColor}`}>Predicted risk, actually risk</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <div className={`text-[15px] font-bold tabular-nums ${valColor}`}><AnimatedNumber value={tp} /></div>
                    <div className="text-[11px] text-[#10b981] font-medium">{total > 0 ? ((tp/total)*100).toFixed(1) : 0}%</div>
                </div>
            </div>

            {/* False Positive */}
            <div className={`p-3 rounded-xl bg-transparent border border-transparent transition-all flex items-center justify-between group ${itemHoverBg} ${itemHoverBorder}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${redIcoBg}`}>
                        <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                    </div>
                    <div>
                        <div className={`text-[13px] font-medium flex items-center gap-2 ${titleColor}`}>False Alarm (FP) <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /></div>
                        <div className={`text-[11px] transition-colors mt-0.5 ${descColor}`}>Predicted risk, actually safe</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <div className={`text-[15px] font-bold tabular-nums ${valColor}`}><AnimatedNumber value={fp} /></div>
                    <div className="text-[11px] text-[#ef4444] font-medium">{total > 0 ? ((fp/total)*100).toFixed(1) : 0}%</div>
                </div>
            </div>

            {/* False Negative */}
            <div className={`p-3 rounded-xl bg-transparent border border-transparent transition-all flex items-center justify-between group ${itemHoverBg} ${itemHoverBorder}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${redIcoBg}`}>
                        <XSquare className="w-4 h-4 text-[#ef4444]" />
                    </div>
                    <div>
                        <div className={`text-[13px] font-medium flex items-center gap-2 ${titleColor}`}>Missed Patient (FN) <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /></div>
                        <div className={`text-[11px] transition-colors mt-0.5 ${descColor}`}>Predicted safe, actually risk</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <div className={`text-[15px] font-bold tabular-nums ${valColor}`}><AnimatedNumber value={fn} /></div>
                    <div className="text-[11px] text-[#ef4444] font-medium">{total > 0 ? ((fn/total)*100).toFixed(1) : 0}%</div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Error Rate Monitoring
   ═══════════════════════════════════════════════════════════════ */
const ErrorRateMonitoring = ({ accuracy, isDarkMode }) => {
    const errRate = (1 - accuracy) * 100;
    const accPct = accuracy * 100;

    const titleColor = isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-700';
    const iconBorder = isDarkMode ? 'border-[#27272a] bg-[#18181b]' : 'border-gray-200 bg-white shadow-sm';
    const trackColor = isDarkMode ? 'bg-[#27272a]' : 'bg-gray-200';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-transparent p-1 rounded-xl">
                    <span className={`text-[13px] font-medium ${titleColor}`}>Positive Review (Correct)</span>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center pointer-events-none ${iconBorder}`}>
                        <span className="text-[12px]">😊</span>
                    </div>
                </div>
                <div className={`relative w-full h-1.5 rounded-full mt-1 ${trackColor}`}>
                    <div className="absolute top-0 left-0 h-full bg-[#c8d84a] rounded-full shadow-[0_0_10px_rgba(200,216,74,0.3)] transition-all duration-1000" style={{ width: `${accPct}%` }}></div>
                    <div className="absolute -top-7 text-[11px] font-bold text-[#b4c43a]" style={{ left: `calc(${accPct}% - 12px)` }}>{accPct.toFixed(0)}%</div>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
                <div className="flex justify-between items-center bg-transparent p-1 rounded-xl">
                    <span className={`text-[13px] font-medium ${titleColor}`}>Negative Review (Errors)</span>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center pointer-events-none ${iconBorder}`}>
                        <span className="text-[12px] opacity-70 grayscale">😞</span>
                    </div>
                </div>
                <div className={`relative w-full h-1.5 rounded-full mt-1 ${trackColor}`}>
                    <div className="absolute top-0 left-0 h-full bg-[#c8d84a] rounded-full shadow-[0_0_10px_rgba(200,216,74,0.3)] transition-all duration-1000" style={{ width: `${errRate}%` }}></div>
                    <div className="absolute -top-7 text-[11px] font-bold text-[#b4c43a]" style={{ left: `calc(${errRate}% - 12px)` }}>{errRate.toFixed(0)}%</div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
const ResultsEvaluation = ({ isDarkMode, onNext, onPrev, trainedModelResult, domain }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    
    // We remove the static text "View Full Report." and dropdowns based on user request.

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            if (trainedModelResult) setResults(trainedModelResult);
            setLoading(false);
        }, 400);
        return () => clearTimeout(t);
    }, [trainedModelResult]);

    const showWarning = results?.sensitivity < 0.5;

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-32 max-w-[1400px] mx-auto min-h-screen">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 px-4 md:px-6 pt-6 space-y-6">

                {loading ? (
                    <div className={`relative rounded-2xl p-16 flex flex-col items-center justify-center gap-4 border ${isDarkMode ? 'bg-[#131316] border-[#1f1f23]' : 'bg-white border-gray-200'}`}>
                        <div className="relative w-10 h-10">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className={`absolute inset-0 rounded-full border-2 border-t-[#c8d84a] ${isDarkMode ? 'border-[#27272a]' : 'border-gray-200'}`} />
                        </div>
                        <p className={`text-sm font-medium animate-pulse ${isDarkMode ? 'text-[#71717a]' : 'text-gray-400'}`}>Gathering evaluation data…</p>
                    </div>
                ) : !results ? (
                    <div className="rounded-2xl p-12 text-center border border-amber-500/20 bg-amber-500/5">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-80" />
                        <h3 className="text-lg font-bold mb-2 text-amber-600 dark:text-amber-400">No Model Results Found</h3>
                        <p className="text-sm text-amber-600/80 dark:text-amber-300/70 max-w-md mx-auto">You should train a model in Step 4 before evaluating results here. You can still proceed to explore the rest of the pipeline.</p>
                    </div>
                ) : (
                    <>
                        {showWarning && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 dark:bg-red-500/8 dark:border-red-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4 mb-4">
                                <FileWarning className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-[12px] leading-relaxed text-red-700 dark:text-red-200/80 flex-1 font-medium">
                                    The model misses more than half of the high-risk patients. Return to Step 4 and adjust parameters.
                                </p>
                            </motion.div>
                        )}

                        {/* ═══════════════════════════════════════════
                            ROW 1: 6 Metric Cards
                        ═══════════════════════════════════════════ */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                            <TopMetricCard isDarkMode={isDarkMode} icon={Activity} title="Overall Accuracy" value={results.accuracy} subtext="Correct overall" subtextColor="#34d399" subtextLightColor="#10b981" delay={0} />
                            <TopMetricCard isDarkMode={isDarkMode} icon={Users} title="Sensitivity Rate" value={results.sensitivity} subtext="Caught cases" subtextColor={results.sensitivity > 0.7 ? '#34d399' : '#f87171'} subtextLightColor={results.sensitivity > 0.7 ? '#10b981' : '#ef4444'} delay={0.05} />
                            <TopMetricCard isDarkMode={isDarkMode} icon={Target} title="Specificity Rate" value={results.specificity} subtext="Avoids false alarms" subtextColor="#34d399" subtextLightColor="#10b981" delay={0.10} />
                            <TopMetricCard isDarkMode={isDarkMode} icon={Eye} title="Precision Score" value={results.precision} subtext="True high-risk" subtextColor="#34d399" subtextLightColor="#10b981" delay={0.15} />
                            <TopMetricCard isDarkMode={isDarkMode} icon={HeartPulse} title="F1-Score Balance" value={results.f1Score} subtext="Harmonic mean" subtextColor="#34d399" subtextLightColor="#10b981" delay={0.20} />
                            <TopMetricCard isDarkMode={isDarkMode} icon={Activity} title="AUC-ROC Score" value={results.auc} isPercent={false} subtext="Separation ability" subtextColor="#34d399" subtextLightColor="#10b981" delay={0.25} isLast={true} />
                        </div>

                        {/* ═══════════════════════════════════════════
                            ROW 2: ROC Curve + Confusion Matrix
                        ═══════════════════════════════════════════ */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 items-stretch">
                            
                            {/* LEFT BIG CARD (ROC Curve) */}
                            <Card isDarkMode={isDarkMode} title="ROC Curve — Separability" className="lg:col-span-7">
                                <ROCCurve auc={results.auc} isDarkMode={isDarkMode} />
                            </Card>

                            {/* RIGHT CARDS (Stacked) */}
                            <div className="lg:col-span-5 flex flex-col gap-5">
                                {/* Top right: Confusion Details */}
                                <Card isDarkMode={isDarkMode} title="Confusion Matrix Details">
                                    <ConfusionMatrixList tp={results.tp} tn={results.tn} fp={results.fp} fn={results.fn} isDarkMode={isDarkMode} />
                                </Card>

                                {/* Bottom right: Error Rates */}
                                <Card isDarkMode={isDarkMode} title="Model Performance Monitoring">
                                    <ErrorRateMonitoring accuracy={results.accuracy} isDarkMode={isDarkMode} />
                                </Card>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Bottom Navigation ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                    className={`flex justify-between items-center pt-8 border-t mt-8 ${isDarkMode ? 'border-[#1f1f23]' : 'border-gray-200'}`}>
                    <motion.button onClick={onPrev} whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border ${isDarkMode ? 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border-transparent hover:border-[#27272a]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent hover:border-gray-200'}`}>
                        ← Previous
                    </motion.button>
                    <motion.button onClick={onNext} whileHover={{ scale: 1.02, x: 3 }} whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-black transition-all shadow-sm focus:outline-none"
                        style={{ backgroundColor: '#c8d84a' }}>
                        Next Step <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ResultsEvaluation;
