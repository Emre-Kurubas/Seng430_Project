import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowUpRight, ArrowDownRight,
    Database, Scale, Users, CheckCircle2, ChevronDown,
    Zap, Settings2, ArrowRightLeft
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import StepTour from './StepTour';

/* ═══════════════════════════════════════════════════════════════
   Custom Hooks & Utilities
   ═══════════════════════════════════════════════════════════════ */
const useCountUp = (target, duration = 1000, delay = 0) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = null; let raf;
        const timeout = setTimeout(() => {
            const step = (ts) => {
                if (!start) start = ts;
                const progress = Math.min((ts - start) / duration, 1);
                setCount(Math.round((1 - Math.pow(1 - progress, 3)) * target));
                if (progress < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }, delay);
        return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
    }, [target, duration, delay]);
    return count;
};

/* ═══════════════════════════════════════════════════════════════
   UI Components
   ═══════════════════════════════════════════════════════════════ */
const MetricSubCard = ({ title, options, selectedIdx, onSelect, subtext, trend, icon: Icon, color, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className={`p-4 lg:p-5 rounded-[24px] transition-all duration-500 hover:-translate-y-1 relative group ${isDarkMode ? 'bg-white/[0.015] hover:bg-white/[0.035] border border-white/[0.04]' : 'bg-slate-50/50 hover:bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50'} ${isOpen ? 'z-50' : 'z-10'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-[12px] flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/[0.03]' : 'bg-white shadow-sm border border-slate-100'}`}>
                        <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <h4 className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h4>
                </div>
            </div>

            <div className={`text-[9px] font-semibold uppercase tracking-wider mb-2 opacity-50 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Strategy Mode</div>

            <div className="relative mb-3">
                <div onClick={() => setIsOpen(!isOpen)}
                    className="flex justify-between items-center w-full py-1 cursor-pointer group/select">
                    <span className={`text-[17px] sm:text-xl font-bold tracking-tight select-none ${isDarkMode ? 'text-slate-50' : 'text-slate-800'}`}>
                        {options[selectedIdx]}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} ${isOpen ? 'rotate-180' : 'opacity-40 group-hover/select:opacity-100'}`} />
                </div>
                <div className="w-full h-[1px] bg-slate-200 dark:bg-white/10 opacity-50 mb-1" />

                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                            className={`absolute top-full left-0 w-[110%] -ml-[5%] mt-2 rounded-[16px] overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-[#27272a] border-white/[0.04] shadow-black/60' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                            {options.map((opt, i) => (
                                <div key={opt} onClick={() => { onSelect(i); setIsOpen(false); }}
                                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${i === selectedIdx ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600') : (isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600')}`}>
                                    {opt}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold mt-4" style={{ color: trend > 0 ? '#10b981' : '#f43f5e' }}>
                <div className={`flex shrink-0 items-center justify-center w-4 h-4 rounded-full ${trend > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                </div>
                <span className="opacity-90 leading-tight">{subtext}</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Sankey / Funnel Data Split
   ═══════════════════════════════════════════════════════════════ */
const DataAllocationChart = ({ splitRatio, trainCount, testCount, totalCount, isDarkMode }) => {
    const cp = 50;
    const testRatio = 100 - splitRatio;

    // Y positions
    const yTotal = 50;
    const hTotal = 30; // base thickness

    const hTrain = (splitRatio / 100) * 80;
    const yTrain = 15;

    const hTest = (testRatio / 100) * 80;
    const yTest = 85 - hTest;

    const pathTrain = `M 0,${yTotal - hTotal / 2} C ${cp},${yTotal - hTotal / 2} ${100 - cp},${yTrain} 100,${yTrain} L 100,${yTrain + hTrain} C ${100 - cp},${yTrain + hTrain} ${cp},${yTotal + hTotal / 2 - (hTotal * (testRatio / 100))} 0,${yTotal + hTotal / 2 - (hTotal * (testRatio / 100))} Z`;
    const pathTest = `M 0,${yTotal + hTotal / 2 - (hTotal * (testRatio / 100))} C ${cp},${yTotal + hTotal / 2 - (hTotal * (testRatio / 100))} ${100 - cp},${yTest} 100,${yTest} L 100,${yTest + hTest} C ${100 - cp},${yTest + hTest} ${cp},${yTotal + hTotal / 2} 0,${yTotal + hTotal / 2} Z`;

    return (
        <div className="relative w-full h-[220px] flex items-center pr-32 mt-2 mb-2">

            {/* Left Box (Glassmorphic Total) */}
            <div className={`w-28 shrink-0 z-20 p-4 rounded-[20px] flex flex-col items-center justify-center text-center backdrop-blur-xl border ${isDarkMode ? 'bg-white/[0.04] border-white/[0.08] shadow-2xl shadow-black/40' : 'bg-white/80 border-slate-200/50 shadow-xl shadow-slate-200/40'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total</div>
                <div className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-800'}`}>{totalCount}</div>
            </div>

            {/* SVG Sankey container */}
            <svg viewBox="0 0 100 100" className="flex-1 h-full overflow-visible z-10 -ml-1" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="fadeIndigo" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="fadeRose" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
                <path d={pathTrain} fill="url(#fadeIndigo)" className="transition-all duration-500 ease-out" />
                <path d={pathTest} fill="url(#fadeRose)" className="transition-all duration-500 ease-out" />
            </svg>

            {/* Right Blocks */}
            <div className="absolute right-0 top-6 w-32 space-y-1 transition-all duration-500">
                <div className="flex items-center gap-2 mb-1.5 opacity-80">
                    <div className="w-2 h-2 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Training Set</span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{trainCount} <span className="text-[11px] font-semibold opacity-50 ml-1">({splitRatio}%)</span></div>
            </div>

            <div className="absolute right-0 bottom-6 w-32 space-y-1 transition-all duration-500">
                <div className="flex items-center gap-2 mb-1.5 opacity-80">
                    <div className="w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Test Set</span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{testCount} <span className="text-[11px] font-semibold opacity-50 ml-1">({testRatio}%)</span></div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Transformation Data Grid (3-Column)
   ═══════════════════════════════════════════════════════════════ */
const UnifiedTransformationChart = ({ isDarkMode, isApplied, normMethod, smoteMethod, dataset, datasetSchema, targetColumn }) => {
    // 1. Determine Class Imbalance Percentages
    const classStats = useMemo(() => {
        if (!dataset) return null;
        const tCol = targetColumn || datasetSchema?.find(s => s.role === 'Target')?.name;
        if (!tCol) return null;

        let counts = {};
        let total = 0;
        dataset.forEach(row => {
            const val = row[tCol];
            if (val !== undefined && val !== null) {
                counts[val] = (counts[val] || 0) + 1;
                total++;
            }
        });

        let readmittedCount = 0;
        let notReadmittedCount = 0;

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length >= 2) {
            if (counts['1'] !== undefined && counts['0'] !== undefined) {
                readmittedCount = counts['1'];
                notReadmittedCount = counts['0'];
            } else {
                notReadmittedCount = sorted[0][1];
                readmittedCount = sorted[1][1];
            }
        } else {
            return null;
        }

        const rawReadmitPct = (readmittedCount / total) * 100;
        const rawNotReadmitPct = (notReadmittedCount / total) * 100;

        return { rawReadmitPct, rawNotReadmitPct };
    }, [dataset, datasetSchema, targetColumn]);

    // 2. Determine Continuous Stats
    const featStats = useMemo(() => {
        if (!dataset || !datasetSchema) return null;
        const numericCol = datasetSchema.find(s => s.role === 'Number (measurement)' || s.type === 'number');
        if (!numericCol) return null;

        const feature = String(numericCol.name).trim();

        let min = Infinity, max = -Infinity, sum = 0, count = 0;
        dataset.forEach(row => {
            let val = Number(row[feature]);
            if (!isNaN(val)) {
                if (val < min) min = val;
                if (val > max) max = val;
                sum += val; count++;
            }
        });

        if (count === 0 || max <= min) return null;
        const avg = sum / count;
        const stdDev = (max - min) / 4 || 1;

        return { min, avg, max, stdDev };
    }, [dataset, datasetSchema]);

    const fmtNorm = (v) => Math.abs(v) > 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(2);
    const fmtPct = (v) => v.toFixed(1) + '%';

    let rMin = '-', rAvg = '-', rMax = '-', rReadmit = '-', rNotReadmit = '-';
    let aMin = '-', aAvg = '-', aMax = '-', aReadmit = '-', aNotReadmit = '-';
    let wRMin = 0, wRAvg = 0, wRMax = 0, wAMin = 0, wAAvg = 0, wAMax = 0;

    // Default percentages for classes
    let lPctR = 0, rPctR = 0, lPctNR = 0, rPctNR = 0;

    if (featStats) {
        rMin = fmtNorm(featStats.min);
        rAvg = fmtNorm(featStats.avg);
        rMax = fmtNorm(featStats.max);

        // Max range for scale tracking (Before)
        const maxRScale = Math.max(Math.abs(featStats.min), Math.abs(featStats.max));
        wRMin = Math.abs(featStats.min) / (maxRScale || 1) * 100;
        wRAvg = Math.abs(featStats.avg) / (maxRScale || 1) * 100;
        wRMax = Math.abs(featStats.max) / (maxRScale || 1) * 100;

        if (!isApplied || normMethod === 'None') {
            aMin = rMin; aAvg = rAvg; aMax = rMax;
            wAMin = wRMin; wAAvg = wRAvg; wAMax = wRMax;
        } else if (normMethod === 'Min-Max') {
            aMin = '0.00'; aMax = '1.00';
            const avgVal = (featStats.avg - featStats.min) / (featStats.max - featStats.min);
            aAvg = avgVal.toFixed(2);
            wAMin = 0; wAMax = 100; wAAvg = avgVal * 100;
        } else if (normMethod === 'Z-Score') {
            const minZ = (featStats.min - featStats.avg) / featStats.stdDev;
            const maxZ = (featStats.max - featStats.avg) / featStats.stdDev;

            aMin = minZ.toFixed(2);
            aAvg = '0.00';
            aMax = maxZ.toFixed(2);

            const maxZScale = Math.max(Math.abs(minZ), Math.abs(maxZ));
            wAMin = Math.abs(minZ) / (maxZScale || 1) * 100;
            wAAvg = 0;
            wAMax = Math.abs(maxZ) / (maxZScale || 1) * 100;
        }
    }

    if (classStats) {
        rReadmit = fmtPct(classStats.rawReadmitPct);
        rNotReadmit = fmtPct(classStats.rawNotReadmitPct);
        lPctR = classStats.rawReadmitPct;
        lPctNR = classStats.rawNotReadmitPct;

        if (!isApplied || smoteMethod === 'None') {
            aReadmit = rReadmit;
            aNotReadmit = rNotReadmit;
            rPctR = lPctR;
            rPctNR = lPctNR;
        } else if (smoteMethod === 'SMOTE Oversampling') {
            aReadmit = '50.0%';
            aNotReadmit = '50.0%';
            rPctR = 50;
            rPctNR = 50;
        }
    }

    const PyramidRow = ({ label, lVal, rVal, lW, rW, isPctBox = false }) => {
        // Enforce a minimum 1% width so there is a tiny tick 
        const leftWidth = Math.min(Math.max(lW, 1), 100);
        const rightWidth = Math.min(Math.max(rW, 1), 100);

        const rBg = isApplied ? (isPctBox ? 'linear-gradient(to right, #34d399, #10b981)' : 'linear-gradient(to right, #34d399, #10b981)') : 'linear-gradient(to right, #94a3b8, #64748b)';

        return (
            <div className="flex w-full items-center gap-2 px-0 sm:px-2 my-1.5 h-6">
                {/* Left Side (Before) */}
                <div className="flex-1 flex items-center justify-between gap-3 h-full overflow-hidden">
                    <span className={`text-[10px] font-bold font-mono tracking-tighter shrink-0 w-8 text-right opacity-80 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{lVal}</span>
                    <div className="h-full w-full flex justify-end items-center">
                        <div className="h-full rounded-l-md transition-all duration-[1200ms] ease-out shadow-sm"
                            style={{ width: `${leftWidth}%`, background: 'linear-gradient(to left, #8b5cf6, #6366f1)' }} />
                    </div>
                </div>

                {/* Spine */}
                <div className="w-28 shrink-0 flex items-center justify-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                </div>

                {/* Right Side (After) */}
                <div className="flex-1 flex items-center justify-between gap-3 h-full overflow-hidden">
                    <div className="h-full w-full flex justify-start items-center">
                        <div className="h-full rounded-r-md transition-all duration-[1200ms] ease-out shadow-sm"
                            style={{ width: `${rightWidth}%`, background: rBg }} />
                    </div>
                    <span className={`text-[10px] font-bold font-mono tracking-tighter shrink-0 w-8 text-left transition-colors duration-500 opacity-80 ${isApplied ? 'text-emerald-500 drop-shadow-sm' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>{rVal}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex-1 flex flex-col pt-2 pb-0 animate-[fadeIn_0.5s_ease-out_forwards]">

            {/* Headers */}
            <div className="flex justify-between items-center w-full px-4 mb-4 border-b pb-3 border-slate-200 dark:border-white/10">
                <div className="flex-1 text-right flex flex-col items-end px-2">
                    <div className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Before</div>
                    <div className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300`}>Raw Data</div>
                </div>

                <div className="w-28 shrink-0 text-center text-[10px] font-black uppercase tracking-widest opacity-30">Metrics</div>

                <div className="flex-1 text-left flex flex-col items-start px-2">
                    <div className={`text-[11px] font-black uppercase tracking-widest mb-1 transition-colors duration-500 ${isApplied ? 'text-emerald-500' : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}>After</div>
                    <div className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider transition-colors duration-500 ${isApplied ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                        {isApplied ? 'Processed Data' : 'Pending Execute'}
                    </div>
                </div>
            </div>

            {/* Pyramid Rows */}
            <div className="flex flex-col w-full flex-1 justify-center relative z-10">
                <PyramidRow label="Min" lVal={rMin} rVal={aMin} lW={wRMin} rW={wAMin} />
                <PyramidRow label="Avg" lVal={rAvg} rVal={aAvg} lW={wRAvg} rW={wAAvg} />
                <PyramidRow label="Max" lVal={rMax} rVal={aMax} lW={wRMax} rW={wAMax} />

                <div className="w-full flex justify-center my-1.5 opacity-50">
                    <div className="w-1/2 h-px border-b border-dashed border-slate-300 dark:border-white/20"></div>
                </div>

                <PyramidRow label="Readmitted" lVal={rReadmit} rVal={aReadmit} lW={lPctR} rW={rPctR} isPctBox={true} />
                <PyramidRow label="Not Readmitted" lVal={rNotReadmit} rVal={aNotReadmit} lW={lPctNR} rW={rPctNR} isPctBox={true} />
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Smoothed Readiness Gauge Chart
   ═══════════════════════════════════════════════════════════════ */
const GaugeChart = ({ score, isDarkMode }) => {
    const radius = 64;
    const stroke = 12;
    const cx = 100;
    const cy = 100;

    const cLength = Math.PI * radius;
    const offset = cLength - (score / 100) * cLength;

    return (
        <div className="relative flex flex-col items-center pt-8 mb-6">
            <svg viewBox="0 0 200 110" className="w-56 h-auto drop-shadow-md">
                <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
                {/* Background track */}
                <path d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
                    fill="none" stroke={isDarkMode ? '#ffffff08' : '#e2e8f080'} strokeWidth={stroke} strokeLinecap="round" />
                {/* Inner track */}
                <path d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
                    fill="none" stroke="url(#gaugeGrad)" strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={cLength} strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />

            </svg>
            <div className="absolute top-[82px] left-1/2 -translate-x-1/2 flex flex-col items-center w-full">
                <div className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(score)}<span className="text-2xl text-slate-400 font-bold ml-0.5">%</span></div>
                <div className={`text-[9px] mt-1 font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Integrity Score</div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
const DataPreparation = ({ isDarkMode, onNext, onPrev, domain, patientCount, dataset, datasetSchema, targetColumn }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    // Core ML states mapped to aesthetic widgets
    const [splitRatio, setSplitRatio] = useState(80);

    const missingOpts = ['Median Fill', 'Mode Fill', 'Drop Rows'];
    const normOpts = ['Z-Score', 'Min-Max', 'None'];
    const smoteOpts = ['SMOTE Oversampling', 'None'];

    const [missIdx, setMissIdx] = useState(0);
    const [normIdx, setNormIdx] = useState(0);
    const [smoteIdx, setSmoteIdx] = useState(0);

    const [isApplied, setIsApplied] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const totalPatients = patientCount > 0 ? patientCount : 359;
    const trainCount = Math.round(totalPatients * (splitRatio / 100));
    const testCount = totalPatients - trainCount;

    const dynamicGaugeScore = useMemo(() => {
        if (!dataset || dataset.length === 0) return { raw: 64, applied: 98 };

        let validRows = 0;
        let totalRows = dataset.length;
        let missingCells = 0;
        let totalCells = 0;

        dataset.forEach(row => {
            let hasMissing = false;
            Object.values(row).forEach(v => {
                totalCells++;
                if (v === null || v === undefined || v === '') {
                    hasMissing = true;
                    missingCells++;
                }
            });
            if (!hasMissing) validRows++;
        });

        const tCol = datasetSchema?.find(s => s.role === 'Target')?.name;
        let imbalancePenalty = 0;

        if (tCol) {
            const classCounts = {};
            dataset.forEach(row => {
                if (row[tCol] !== undefined) {
                    classCounts[row[tCol]] = (classCounts[row[tCol]] || 0) + 1;
                }
            });
            const counts = Object.values(classCounts).sort((a, b) => b - a);
            if (counts.length >= 2) {
                const ratio = counts[1] / counts[0];
                if (ratio < 0.4) imbalancePenalty = (0.4 - ratio) * 60;
            }
        }

        const missingPenalty = (missingCells / Math.max(totalCells, 1)) * 400;

        let rawScore = 100 - missingPenalty - imbalancePenalty - 15;
        if (rawScore < 35) rawScore = 35;
        if (rawScore > 85) rawScore = 85;

        let appliedScore = 100;

        if (missingOpts[missIdx] === 'Drop Rows' && (totalRows - validRows) / Math.max(totalRows, 1) > 0.1) {
            appliedScore -= 8;
        }
        if (normOpts[normIdx] === 'None') {
            appliedScore -= 12;
        }
        if (smoteOpts[smoteIdx] === 'None' && imbalancePenalty > 5) {
            appliedScore -= 15;
        }

        return { raw: Math.floor(rawScore), applied: Math.floor(appliedScore) };
    }, [dataset, datasetSchema, missIdx, normIdx, smoteIdx]);

    const gaugeScore = isApplied ? dynamicGaugeScore.applied : dynamicGaugeScore.raw;

    const handleApply = () => {
        setIsAnimating(true);
        setTimeout(() => { setIsApplied(true); setIsAnimating(false); }, 1500);
    };

    return (
        <>
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-44 max-w-[1400px] mx-auto overflow-hidden">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 px-6 pt-6">

                {/* ─ 左侧大列 (Left Column: span 8) ─ */}
                <div className="lg:col-span-8 flex flex-col gap-5">

                    {/* TOP LEFT: Strategies */}
                    <motion.div variants={itemAnim} id="s3-strategy" className={`rounded-[32px] p-6 lg:p-8 flex-shrink-0 backdrop-blur-3xl shadow-sm ${isDarkMode ? 'bg-white/[0.015] border border-white/[0.04]' : 'bg-white/80 border border-slate-200/60'}`}>
                        <div className="flex items-center mb-8 px-2">
                            <h2 className={`text-[17px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Data Preparation Strategy</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <MetricSubCard
                                title="Missing Values"
                                options={missingOpts}
                                selectedIdx={missIdx}
                                onSelect={(val) => { setMissIdx(val); setIsApplied(false); }}
                                subtext={missIdx === 2 ? "Removes missing rows" : "Imputes central value"}
                                trend={1} icon={Database} color="#10b981"
                                isDarkMode={isDarkMode}
                            />
                            <MetricSubCard
                                title="Normalisation"
                                options={normOpts}
                                selectedIdx={normIdx}
                                onSelect={(val) => { setNormIdx(val); setIsApplied(false); }}
                                subtext={normIdx === 2 ? "Leaves variants raw" : "Scales variance uniformly"}
                                trend={1} icon={Scale} color="#3b82f6"
                                isDarkMode={isDarkMode}
                            />
                            <MetricSubCard
                                title="Class Imbalance"
                                options={smoteOpts}
                                selectedIdx={smoteIdx}
                                onSelect={(val) => { setSmoteIdx(val); setIsApplied(false); }}
                                subtext={smoteIdx === 1 ? "Keeps natural imbalance" : "Synthetic balancing"}
                                trend={1} icon={Users} color="#8b5cf6"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </motion.div>

                    {/* BOTTOM LEFT: Sankey Allocation */}
                    <motion.div variants={itemAnim} id="s3-allocation" className={`flex-1 rounded-[32px] p-6 lg:p-8 flex flex-col backdrop-blur-3xl shadow-sm ${isDarkMode ? 'bg-white/[0.015] border border-white/[0.04]' : 'bg-white/80 border border-slate-200/60'}`}>
                        <div className="flex items-center mb-8 px-2">
                            <h2 className={`text-[17px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Train & Test Set Allocation</h2>
                        </div>
                        <DataAllocationChart splitRatio={splitRatio} trainCount={trainCount} testCount={testCount} totalCount={totalPatients} isDarkMode={isDarkMode} />

                        {/* Beautiful Smooth Slider */}
                        <div className="mt-auto pt-8 px-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Drag to adjust allocation</span>
                                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{splitRatio}% Training Ratio</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full overflow-visible" style={{ background: isDarkMode ? '#ffffff10' : '#e2e8f0' }}>
                                <div className="absolute top-0 left-0 h-full rounded-full transition-all" style={{ width: `${((splitRatio - 60) / 30) * 100}%`, background: '#8b5cf6' }} />
                                <input type="range" min="60" max="90" value={splitRatio}
                                    onChange={(e) => { setSplitRatio(parseInt(e.target.value)); setIsApplied(false); }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                                />
                                {/* Custom Thumb */}
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] border-2 border-[#8b5cf6] pointer-events-none transition-all"
                                    style={{ left: `${((splitRatio - 60) / 30) * 100}%` }} />
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* ─ 右侧大列 (Right Column: span 4) ─ */}
                <div className="lg:col-span-4 flex flex-col gap-5">

                    {/* TOP RIGHT: Normalisation Before/After */}
                    <motion.div variants={itemAnim} id="s3-transformation" className={`rounded-[32px] p-6 lg:p-8 flex flex-col backdrop-blur-3xl shadow-sm ${isDarkMode ? 'bg-white/[0.015] border border-white/[0.04]' : 'bg-white/80 border border-slate-200/60'}`}>
                        <div className="flex items-center mb-0 px-1">
                            <h2 className={`text-[17px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Transformation Analysis</h2>
                        </div>
                        <UnifiedTransformationChart
                            isDarkMode={isDarkMode}
                            isApplied={isApplied}
                            normMethod={normOpts[normIdx]}
                            smoteMethod={smoteOpts[smoteIdx]}
                            dataset={dataset}
                            datasetSchema={datasetSchema}
                            targetColumn={targetColumn}
                        />
                    </motion.div>

                    {/* BOTTOM RIGHT: Gauge & Apply */}
                    <motion.div variants={itemAnim} id="s3-execute" className={`flex-1 rounded-[32px] p-6 lg:p-8 flex flex-col backdrop-blur-3xl shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-white/[0.015] border border-white/[0.04]' : 'bg-white/80 border border-slate-200/60'}`}>
                        <div className="flex items-center mb-2 px-1 relative z-10">
                            <h2 className={`text-[17px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Preparation Status</h2>
                        </div>

                        <GaugeChart score={gaugeScore} isDarkMode={isDarkMode} />

                        <div className="flex justify-between items-center w-full px-2 mt-4 mb-3 text-[11px] font-bold relative z-10">
                            <span className={`opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review transformation log</span>
                            <span className="text-emerald-500 cursor-pointer hover:text-emerald-400 transition-colors flex items-center gap-1">Details <ArrowRight className="w-3 h-3" /></span>
                        </div>

                        <div className={`mt-auto p-4 rounded-[16px] flex items-start gap-3 backdrop-blur-md relative z-10 
                            ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-slate-50/80 border border-slate-100'}`}>
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isApplied ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                {isApplied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
                            </div>
                            <p className={`text-[11px] font-medium leading-relaxed opacity-80 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {isApplied ? 'Data is clean, scale-normalized, balanced, and strictly split for model ingestion.' : 'Pending execute. Raw arrays hold varying magnitudes with missing data potentials.'}
                            </p>
                        </div>

                        <motion.button
                            onClick={handleApply} disabled={isAnimating || isApplied}
                            whileHover={!isAnimating && !isApplied ? { scale: 1.02 } : {}} whileTap={!isAnimating && !isApplied ? { scale: 0.98 } : {}}
                            className={`w-full mt-5 py-4 rounded-[20px] font-bold text-white text-[13px] transition-all duration-500 flex items-center justify-center gap-2 relative z-10
                                ${isAnimating ? 'cursor-wait opacity-80' : isApplied ? 'cursor-default opacity-90' : 'hover:shadow-[0_8px_20px_-6px_rgba(236,72,153,0.4)]'}`}
                            style={{
                                background: isApplied ? '#10b981' : isDarkMode ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'linear-gradient(135deg, #e11d48, #be185d)'
                            }}
                        >
                            {isAnimating ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Zap className="w-4 h-4" /></motion.div> Processing...</>)
                                : isApplied ? (<>Ready for Modeling</>)
                                    : (<>Execute Preparations</>)}
                        </motion.button>

                        {/* Decorative background glow for button */}
                        {!isApplied && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-rose-500/30 blur-2xl rounded-full z-0 pointer-events-none" />
                        )}
                    </motion.div>

                </div>
            </div>

            {/* ── Bottom Navigation ── */}
            <motion.div variants={itemAnim} className={`relative z-10 px-6 mt-10 mb-4 flex justify-between items-center pt-8 border-t ${isDarkMode ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
                <motion.button onClick={onPrev} whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                    className={'px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ' + (isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50')}>
                    ← Previous
                </motion.button>
                <motion.button onClick={onNext} disabled={!isApplied}
                    whileHover={isApplied ? { scale: 1.02, x: 3 } : {}} whileTap={isApplied ? { scale: 0.97 } : {}}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${isApplied
                        ? 'text-white'
                        : isDarkMode ? 'bg-white/[0.03] border border-white/[0.05] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    style={isApplied ? { backgroundColor: secondaryStr } : {}}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
            </motion.div>

        </motion.div>

            {/* Dr. Dandelion Step Tour */}
            <StepTour
                stepNumber={3}
                isDarkMode={isDarkMode}
                steps={[
                    {
                        targetId: 's3-strategy',
                        position: 'below',
                        pose: 'point',
                        title: 'Data Preparation Strategy',
                        body: 'These three cards control how your raw data gets cleaned before model training. Missing Values decides how to handle gaps (fill with median/mode or drop rows). Normalisation scales features so no single variable dominates. Class Imbalance uses SMOTE to synthesise minority samples when one outcome is much rarer.',
                        sub: 'Think of this as prepping a patient chart — you wouldn\'t send incomplete records to a specialist. Each dropdown lets you select the best approach for your dataset.',
                    },
                    {
                        targetId: 's3-allocation',
                        position: 'right',
                        pose: 'wave',
                        title: 'Train & Test Set Allocation',
                        body: 'This Sankey diagram shows how your dataset splits into training data (what the model learns from) and test data (what we evaluate it on). Drag the slider to adjust the ratio — typically 70-80% for training. The model NEVER sees the test set during training, ensuring an honest evaluation.',
                        sub: 'In clinical trials, we always hold back unseen cases for validation. Same principle here — no peeking at the test answers!',
                    },
                    {
                        targetId: 's3-transformation',
                        position: 'left',
                        pose: 'point',
                        title: 'Transformation Analysis',
                        body: 'This before/after pyramid shows exactly what changes when you execute. The left side shows raw data ranges (Min, Avg, Max) and original class distributions. The right side shows what they become after normalisation and SMOTE. Green bars mean transformations are active.',
                        sub: 'Always verify your transformations visually. Normalisation should compress ranges, and SMOTE should equalize the class percentages.',
                    },
                    {
                        targetId: 's3-execute',
                        position: 'left',
                        pose: 'wave',
                        title: 'Preparation Status & Execute',
                        body: 'The integrity gauge shows your dataset\'s readiness score. Before execution it reflects raw data quality; after, it shows the improved state. Click "Execute Preparations" to apply all your selected strategies. The Continue button only unlocks once preparations are complete.',
                        sub: 'Once you execute, your data is clean, normalised, balanced, and split. Think of it as completing pre-operative checks — everything must be green before we proceed.',
                    },
                ]}
            />
        </>
    );
};

export default DataPreparation;
