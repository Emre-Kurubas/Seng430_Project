import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ArrowLeft, Download,
    Activity, Check, Sparkles, BookOpen,
    Users, Target, Eye, ShieldCheck, TrendingUp
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import StepTour from './StepTour';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReportLoadingOverlay from './ReportLoadingOverlay';
import Tooltip from './Tooltip';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => parseFloat((min + Math.random() * (max - min)).toFixed(2));
const pctStr = (v) => v != null ? Math.round(v * 100) + '%' : 'N/A';

// ─── Animated Number ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, duration = 1.5, decimals = 0 }) => {
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

// ─── Compute metrics from true/predicted labels ──────────────────────────────
const computeGroupMetrics = (yTrue, yPred) => {
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (let i = 0; i < yTrue.length; i++) {
        if (yTrue[i] === 1 && yPred[i] === 1) tp++;
        else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
        else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
        else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
    }
    return {
        acc: parseFloat(((tp + tn) / (yTrue.length || 1)).toFixed(3)),
        sens: parseFloat((tp / ((tp + fn) || 1)).toFixed(3)),
        spec: parseFloat((tn / ((tn + fp) || 1)).toFixed(3)),
    };
};

// ─── Real subgroup data from actual dataset ──────────────────────────────────
const generateSubgroups = (trainedModelResult, dataset, targetColumn) => {
    // If we have a trained model with predictFn AND a real dataset, compute real subgroup metrics
    if (trainedModelResult?.predictFn && trainedModelResult?.featureCols?.length > 0 && dataset?.length > 0 && targetColumn) {
        const featureCols = trainedModelResult.featureCols;
        const predictFn = trainedModelResult.predictFn;

        // Build target mapping (same logic as mlEngine)
        const targetValues = [...new Set(dataset.map(r => r[targetColumn]).filter(v => v !== undefined && v !== ''))];
        const targetMap = {};
        if (targetValues.length >= 2) { targetMap[targetValues[0]] = 0; targetMap[targetValues[1]] = 1; }
        else { targetMap[targetValues[0] || '1'] = 1; }

        // Prepare feature arrays and true labels for every row
        const allFeatures = [];
        const allYTrue = [];
        const rowMeta = []; // store original row for demographic grouping
        dataset.forEach(row => {
            const features = featureCols.map(col => { const v = Number(row[col]); return isNaN(v) ? 0 : v; });
            const hasValid = features.some(v => v !== 0) || features.length <= 5;
            if (!hasValid) return;
            let y = targetMap[row[targetColumn]]; if (y === undefined) y = 0;
            allFeatures.push(features);
            allYTrue.push(y);
            rowMeta.push(row);
        });

        // Predict all at once
        const allPreds = predictFn(allFeatures).map(v => Number(v) >= 0.5 ? 1 : 0);
        const overall = computeGroupMetrics(allYTrue, allPreds);

        // Detect demographic columns
        const allCols = Object.keys(dataset[0] || {});
        const sexCol = allCols.find(c => ['sex', 'gender'].includes(c.toLowerCase()));
        const ageCol = allCols.find(c => c.toLowerCase() === 'age');

        const maleVals = new Set(['1', 'male', 'm', '1.0']);
        const femaleVals = new Set(['0', 'female', 'f', '0.0']);

        const subgroupRows = [];

        if (sexCol) {
            const maleIdx = [], femaleIdx = [];
            rowMeta.forEach((row, i) => {
                const v = String(row[sexCol] ?? '').toLowerCase().trim();
                if (maleVals.has(v)) maleIdx.push(i);
                else if (femaleVals.has(v)) femaleIdx.push(i);
            });
            if (maleIdx.length > 0) {
                const m = computeGroupMetrics(maleIdx.map(i => allYTrue[i]), maleIdx.map(i => allPreds[i]));
                subgroupRows.push({ group: 'Male', val: maleIdx.length, ...m, isRef: true });
            }
            if (femaleIdx.length > 0) {
                const m = computeGroupMetrics(femaleIdx.map(i => allYTrue[i]), femaleIdx.map(i => allPreds[i]));
                subgroupRows.push({ group: 'Female', val: femaleIdx.length, ...m, isRef: false });
            }
        }

        if (ageCol) {
            const young = [], mid = [], old = [];
            rowMeta.forEach((row, i) => {
                const age = Number(row[ageCol]);
                if (isNaN(age)) return;
                if (age <= 60) young.push(i);
                else if (age <= 75) mid.push(i);
                else old.push(i);
            });
            if (young.length > 0) { const m = computeGroupMetrics(young.map(i => allYTrue[i]), young.map(i => allPreds[i])); subgroupRows.push({ group: 'Age ≤ 60', val: young.length, ...m, isRef: false }); }
            if (mid.length > 0) { const m = computeGroupMetrics(mid.map(i => allYTrue[i]), mid.map(i => allPreds[i])); subgroupRows.push({ group: 'Age 61–75', val: mid.length, ...m, isRef: false }); }
            if (old.length > 0) { const m = computeGroupMetrics(old.map(i => allYTrue[i]), old.map(i => allPreds[i])); subgroupRows.push({ group: 'Age 76+', val: old.length, ...m, isRef: false }); }
        }

        // If no demographic columns exist, show single "All Patients" row
        if (subgroupRows.length === 0) {
            subgroupRows.push({ group: 'All Patients', val: rowMeta.length, ...overall, isRef: true });
        }

        return { overall, rows: subgroupRows };
    }

    // Fallback: use overall metrics from trainedModelResult (no dataset available)
    const overall = trainedModelResult ? {
        acc: trainedModelResult.accuracy || 0,
        sens: trainedModelResult.sensitivity || 0,
        spec: trainedModelResult.specificity || 0,
    } : { acc: 0, sens: 0, spec: 0 };
    return { overall, rows: [{ group: 'All Patients', val: 0, ...overall, isRef: true }] };
};

// ─── Real demographic representation from actual dataset ─────────────────────
const generateRepresentation = (dataset) => {
    if (!dataset || dataset.length === 0) {
        return { training: { male: 0.50, female: 0.50 }, hospital: { male: 0.48, female: 0.52 } };
    }
    const allCols = Object.keys(dataset[0] || {});
    const sexCol = allCols.find(c => ['sex', 'gender'].includes(c.toLowerCase()));

    const maleVals = new Set(['1', 'male', 'm', '1.0']);
    const femaleVals = new Set(['0', 'female', 'f', '0.0']);

    let maleCount = 0, femaleCount = 0;
    if (sexCol) {
        dataset.forEach(row => {
            const v = String(row[sexCol] ?? '').toLowerCase().trim();
            if (maleVals.has(v)) maleCount++;
            else if (femaleVals.has(v)) femaleCount++;
        });
    }
    const total = maleCount + femaleCount || 1;
    return {
        training: { male: parseFloat((maleCount / total).toFixed(3)), female: parseFloat((femaleCount / total).toFixed(3)) },
        // General hospital population baseline (WHO/CDC reference averages)
        hospital: { male: 0.48, female: 0.52 },
    };
};

const CHECKLIST_ITEMS = [
    { id: 'explainability', label: 'Model is explainable (outputs have reasons)', detail: 'We implemented feature importance and per-patient explanations in Step 6', preChecked: true },
    { id: 'data_doc', label: 'Training data is documented', detail: 'Dataset source, size, time period, and patient demographics are recorded', preChecked: true },
    { id: 'bias_audit', label: 'Subgroup bias audit completed', detail: 'Performance gaps between male/female and age groups must be addressed before deployment', preChecked: false },
    { id: 'human_oversight', label: 'Human oversight plan defined', detail: 'A qualified clinician must review all high-risk flags before any action is taken', preChecked: false },
    { id: 'privacy', label: 'Patient data privacy protected', detail: 'GDPR compliant: no personally identifiable information used in model training', preChecked: false },
    { id: 'drift_monitor', label: 'Drift monitoring plan established', detail: 'Model accuracy must be re-checked every 3 months as patient population changes', preChecked: false },
    { id: 'incident_report', label: 'Incident reporting pathway defined', detail: 'If the model causes harm, there is a clear process for reporting and review', preChecked: false },
    { id: 'clinical_val', label: 'Clinical validation completed', detail: 'Model tested in real clinical environment with supervision before full deployment', preChecked: false },
];

const CASE_STUDIES = [
    { title: 'The Accuracy Paradox', color: 'amber', body: 'A model achieved 90% accuracy but failed completely on an ethnic minority subset due to severe class imbalance.' },
    { title: 'Harm by Automation Bias', color: 'red', body: 'A diagnostic AI deployed without human-in-the-loop safeguards misdiagnosed 14% of early-stage conditions.' },
    { title: 'Success via Auditing', color: 'emerald', body: 'Proactive algorithmic bias auditing enabled a care network to adjust decision boundaries, saving countless lives equitably.' },
];

// ─── Shared UI Helpers ────────────────────────────────────────────────────────
const Card = ({ children, title, action, className = '', isDarkMode }) => (
    <div className={`border rounded-2xl flex flex-col overflow-hidden transition-colors ${isDarkMode ? 'bg-[#131316] border-[#1f1f23]' : 'bg-white border-gray-200 shadow-sm'} ${className}`}>
        {(title || action) && (
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
                {title && <h3 className={`text-[14px] font-semibold tracking-tight ${isDarkMode ? 'text-[#e0e0e0]' : 'text-gray-800'}`}>{title}</h3>}
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="px-6 pb-6 flex-1 flex flex-col">{children}</div>
    </div>
);

const TopMetricCard = ({ title, value, subtext, icon: Icon, colorClass, isDarkMode }) => (
    <div className={`flex flex-col relative py-2 pl-4 pr-6`}>
        <div className="flex items-center gap-2 mb-1">
            <div className={`w-5 h-5 rounded flex items-center justify-center bg-gray-50 dark:bg-[#18181b] border ${isDarkMode ? 'border-[#27272a]' : 'border-gray-200'}`}>
                {Icon && <Icon className={`w-3 h-3 ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`} />}
            </div>
            <span className={`text-[12px] font-medium ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>{title}</span>
        </div>
        <div className={`text-[24px] font-bold tabular-nums leading-none mt-1 mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
        </div>
        <div className={`text-[11px] font-medium ${colorClass}`}>{subtext}</div>
    </div>
);

// ─── Dashboard Components ──────────────────────────────────────────────────
const describeArc = (x, y, radius, startAngle, endAngle) => {
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

const SemicirclePath = ({ cx=50, cy=50, startAngle, endAngle, color, opacity=1, delay=0 }) => {
    return (
        <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
            d={describeArc(cx, cy, 35, startAngle, endAngle)} 
            fill="none" 
            stroke={color} 
            strokeWidth="12" 
            opacity={opacity}
        />
    );
};

const RepresentationHalfDonutChart = ({ repData, isDarkMode }) => {
    if (!repData) return null;
    
    const tMale = repData.training.male;
    const tFemale = repData.training.female;
    const tTotal = tMale + tFemale;
    const tMalePct = tMale / tTotal;
    
    const hMale = repData.hospital.male;
    const hFemale = repData.hospital.female;
    const hTotal = hMale + hFemale;
    const hMalePct = hMale / hTotal;

    const boldColor = isDarkMode ? '#fff' : '#111827';

    return (
        <Card isDarkMode={isDarkMode} title="Demographics: Training vs Real" className="h-full flex flex-col">
            <div className="flex-1 flex flex-col relative py-4 items-center justify-center">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Empty tracks */}
                        <path d={describeArc(50, 42, 35, -90, 90)} fill="none" stroke={isDarkMode ? '#27272a' : '#f3f4f6'} strokeWidth="12" />
                        <path d={describeArc(50, 58, 35, 90, 270)} fill="none" stroke={isDarkMode ? '#27272a' : '#f3f4f6'} strokeWidth="12" />
                        
                        {/* Top Semicircle - Training Data (-90 to 90) */}
                        <SemicirclePath cx={50} cy={42} startAngle={-90} endAngle={-90 + (tMalePct * 180)} color="#a78bfa" delay={0} />
                        <SemicirclePath cx={50} cy={42} startAngle={-90 + (tMalePct * 180)} endAngle={90} color="#f472b6" delay={0.2} />

                        {/* Bottom Semicircle - Hospital Data (90 to 270) */}
                        <SemicirclePath cx={50} cy={58} startAngle={90} endAngle={90 + (hMalePct * 180)} color="#a78bfa" opacity={0.6} delay={0.4} />
                        <SemicirclePath cx={50} cy={58} startAngle={90 + (hMalePct * 180)} endAngle={270} color="#f472b6" opacity={0.6} delay={0.6} />
                        
                        <text x="50" y="40" textAnchor="middle" fill={boldColor} fontSize="8" fontWeight="bold">Training</text>
                        <text x="50" y="64" textAnchor="middle" fill={boldColor} fontSize="8" fontWeight="bold">Real World</text>
                    </svg>
                    
                    {/* Callout Lines */}
                    <div className="absolute top-8 -left-8 text-[10px] font-semibold text-[#a78bfa] cursor-pointer" title={`Training Male: ${Math.round(tMalePct*100)}%`}>Male <span className="block text-[9px] font-normal text-gray-500">{Math.round(tMalePct*100)}%</span></div>
                    <div className="absolute top-8 -right-8 text-[10px] font-semibold text-[#f472b6] text-right cursor-pointer" title={`Training Female: ${Math.round((1-tMalePct)*100)}%`}>Female <span className="block text-[9px] font-normal text-gray-500">{Math.round((1-tMalePct)*100)}%</span></div>
                    
                    <div className="absolute bottom-6 -left-8 text-[10px] font-semibold text-[#a78bfa] opacity-70 cursor-pointer" title={`Real World Male: ${Math.round(hMalePct*100)}%`}>Male <span className="block text-[9px] font-normal text-gray-500">{Math.round(hMalePct*100)}%</span></div>
                    <div className="absolute bottom-6 -right-8 text-[10px] font-semibold text-[#f472b6] opacity-70 text-right cursor-pointer" title={`Real World Female: ${Math.round((1-hMalePct)*100)}%`}>Female <span className="block text-[9px] font-normal text-gray-500">{Math.round((1-hMalePct)*100)}%</span></div>
                </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 pb-1 shrink-0">
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-sm bg-[#a78bfa] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Male</span></div>
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-sm bg-[#f472b6] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Female</span></div>
            </div>
        </Card>
    );
};

const SubgroupMetricsBarChart = ({ subgroups, isDarkMode }) => {
    const groups = subgroups?.rows || [];
    const gridColor = isDarkMode ? '#27272a' : '#f3f4f6';
    const textColor = isDarkMode ? 'text-[#a1a1aa]' : 'text-[#9ca3af]';

    return (
        <Card isDarkMode={isDarkMode} title="Demographic Representation Gap" className="h-full flex flex-col">
            <div className="flex-1 w-full relative mt-4 min-h-[250px] flex flex-col">
                {/* Y Axis Labels */}
                {[25, 50, 75, 100].map(y => (
                    <span key={y} className={`absolute left-0 text-[10px] ${textColor}`} style={{ top: `${100-y}%`, marginTop: '-6px' }}>{y}</span>
                ))}
                
                {/* SVG Container */}
                <div className="absolute inset-0 left-6 bottom-6">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        {[0, 25, 50, 75, 100].map(y => (
                            <line key={y} x1="0" y1={100-y} x2="100" y2={100-y} stroke={gridColor} strokeWidth={y === 0 ? "1" : "0.5"} strokeDasharray={y === 0 ? "0" : "2 2"} />
                        ))}
                        {groups.map((g, i) => {
                            const sectionW = 100 / groups.length;
                            const xCenter = i * sectionW + sectionW / 2;
                            const hAcc = g.acc * 100;
                            const hSens = g.sens * 100;
                            const hSpec = g.spec * 100;
                            const barW = 3.5;
                            const spacing = 4.5;
                            const xBase = xCenter - spacing;
                            
                            return (
                                <g key={i}>
                                    <motion.rect initial={{ height: 0, y: 100 }} animate={{ height: hAcc, y: 100 - hAcc }} transition={{ duration: 0.8, delay: i * 0.1 }} x={xBase} width={barW} fill="#3b82f6" rx="1" style={{ cursor: 'pointer' }} whileHover={{ opacity: 0.7 }}>
                                        <title>{g.group} - Accuracy: {Math.round(hAcc)}%</title>
                                    </motion.rect>
                                    <motion.rect initial={{ height: 0, y: 100 }} animate={{ height: hSens, y: 100 - hSens }} transition={{ duration: 0.8, delay: i * 0.1 + 0.1 }} x={xBase + spacing} width={barW} fill="#10b981" rx="1" style={{ cursor: 'pointer' }} whileHover={{ opacity: 0.7 }}>
                                        <title>{g.group} - Sensitivity: {Math.round(hSens)}%</title>
                                    </motion.rect>
                                    <motion.rect initial={{ height: 0, y: 100 }} animate={{ height: hSpec, y: 100 - hSpec }} transition={{ duration: 0.8, delay: i * 0.1 + 0.2 }} x={xBase + spacing * 2} width={barW} fill="#8b5cf6" rx="1" style={{ cursor: 'pointer' }} whileHover={{ opacity: 0.7 }}>
                                        <title>{g.group} - Specificity: {Math.round(hSpec)}%</title>
                                    </motion.rect>
                                </g>
                            );
                        })}
                    </svg>
                </div>
                {/* X Labels */}
                <div className={`absolute left-6 right-0 bottom-0 h-6 flex justify-around items-end text-[11px] font-medium ${textColor}`}>
                    {groups.map(g => <div key={g.group} className="flex-1 text-center truncate">{g.group}</div>)}
                </div>
            </div>
            <div className="flex justify-center gap-6 mt-8 pb-1 shrink-0">
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Accuracy</span></div>
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-sm bg-[#10b981] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Sensitivity</span></div>
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Specificity</span></div>
            </div>
        </Card>
    );
};

const AnomalyLineChart = ({ trainedModelResult, isDarkMode }) => {
    // Generate anomaly data based on the current model's performance
    const acc = trainedModelResult?.accuracy || 0.85;
    const sens = trainedModelResult?.sensitivity || 0.85;
    const spec = trainedModelResult?.specificity || 0.85;
    const prec = trainedModelResult?.precision || 0.85;

    const err = (1 - acc) * 100;
    
    // Calculate pseudo-real anomaly scores from 0-100
    const biasScore = Math.abs(sens - spec) * 200 + 10;
    const driftScore = err * 1.5 + 5;
    const outlierScore = (1 - prec) * 150 + 10;
    const missingScore = 15; // Assume relatively clean data for this step
    const errorScore = err * 2 + 10;
    const noiseScore = 20;

    const currentSessionPts = [biasScore, driftScore, outlierScore, missingScore, errorScore, noiseScore].map(v => Math.min(Math.max(v, 5), 95));
    
    // Threshold lines
    const warningPts = [60, 60, 60, 60, 60, 60];
    const criticalPts = [80, 80, 80, 80, 80, 80];
    
    const labels = ['Bias Surge', 'Drift', 'Outliers', 'Missing', 'Errors', 'Noise'];
    
    const scale = (val) => 100 - (val / 100) * 100;
    
    const mkPath = (pts) => {
        let p = `M 0 ${scale(pts[0])} `;
        const step = 100 / (pts.length - 1);
        for(let i=1; i<pts.length; i++) {
            p += `C ${step*(i-0.5)} ${scale(pts[i-1])}, ${step*(i-0.5)} ${scale(pts[i])}, ${step*i} ${scale(pts[i])} `;
        }
        return p;
    };

    const gridColor = isDarkMode ? '#27272a' : '#f3f4f6';
    const textColor = isDarkMode ? 'text-[#a1a1aa]' : 'text-[#9ca3af]';

    return (
        <Card isDarkMode={isDarkMode} title="Data Integrity Anomalies" className="h-full flex flex-col">
            <div className="flex-1 w-full relative mt-4 min-h-[250px] flex flex-col">
                {/* Y Axis Labels */}
                {[20, 40, 60, 80, 100].map(y => (
                    <span key={y} className={`absolute left-0 text-[10px] ${textColor}`} style={{ top: `${100-y}%`, marginTop: '-6px' }}>{y}</span>
                ))}

                {/* SVG Container */}
                <div className="absolute inset-0 left-6 bottom-6">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        {[0, 20, 40, 60, 80, 100].map(y => (
                            <line key={y} x1="0" y1={100-y} x2="100" y2={100-y} stroke={gridColor} strokeWidth={y===0?"1":"0.5"} strokeDasharray={y===0?"0":"2 2"} />
                        ))}

                        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }} d={mkPath(warningPts)} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }} d={mkPath(criticalPts)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

                        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} d={mkPath(currentSessionPts)} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                    </svg>

                    {/* Render dots as absolutely positioned HTML elements to avoid SVG preserveAspectRatio distortion */}
                    {currentSessionPts.map((p, i) => (
                        <motion.div
                            key={`p1-${i}`}
                            className="absolute bg-[#3b82f6] rounded-full cursor-pointer z-50 pointer-events-auto group"
                            style={{ 
                                left: `${(100/(currentSessionPts.length-1))*i}%`, 
                                top: `${scale(p)}%`,
                                width: '12px',
                                height: '12px',
                                marginLeft: '-6px',
                                marginTop: '-6px',
                                boxShadow: isDarkMode ? '0 0 0 2px rgba(19, 19, 22, 0.8)' : '0 0 0 2px rgba(255, 255, 255, 0.8)'
                            }}
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            whileHover={{ scale: 1.5, zIndex: 100 }}
                            transition={{ delay: 1.5 + i*0.1 }}
                        >
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded -top-6 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap shadow-lg z-50">
                                {Math.round(p)}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* X Labels */}
                <div className={`absolute left-6 right-0 bottom-0 h-6 flex justify-between items-end text-[11px] font-medium ${textColor}`}>
                    {labels.map((l, i) => (
                        <div key={l} className="text-center w-0 flex justify-center" style={{ left: `${(100/(labels.length-1))*i}%`, position: 'absolute', bottom: 0 }}>
                            <span className="whitespace-nowrap">{l}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-center gap-6 mt-8 pb-1 shrink-0">
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-full border-2 border-[#3b82f6] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Current Session</span></div>
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#f59e0b] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Warning Threshold</span></div>
                <div className="flex items-center gap-1.5"><motion.div whileHover={{ scale: 1.5 }} className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#ef4444] cursor-pointer"/> <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#d4d4d8]' : 'text-gray-600'}`}>Critical Threshold</span></div>
            </div>
        </Card>
    );
};

const ChecklistItem = React.memo(({ item, checked, onToggle, isDarkMode }) => (
    <Tooltip content={item.detail} isDarkMode={isDarkMode} position="top" noUnderline className="block w-full mb-1.5 last:mb-0">
        <div 
            className={`py-1.5 px-3 transition-all duration-200 border rounded-lg ${!item.preChecked ? 'cursor-pointer' : 'cursor-not-allowed'} ${checked ? (isDarkMode ? 'bg-[#1a2e1d] border-[#10b981]/30' : 'bg-[#ecfdf5] border-[#10b981]/30') : (isDarkMode ? 'border-[#1f1f23] hover:border-[#3f3f46]' : 'border-gray-200 hover:border-gray-300')}`} 
            onClick={() => !item.preChecked && onToggle(item.id)}
        >
            <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-[#10b981] text-white' : isDarkMode ? 'border border-[#3f3f46]' : 'border border-gray-300'}`}>
                    {checked && <Check size={10} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <div className={`text-[11px] font-semibold leading-tight ${checked ? (isDarkMode ? 'text-[#10b981]' : 'text-gray-900') : (isDarkMode ? 'text-[#e4e4e7]' : 'text-gray-800')}`}>
                        {item.label}
                    </div>
                </div>
            </div>
        </div>
    </Tooltip>
));

const CaseStudyCard = React.memo(({ cs, isDarkMode }) => {
    const colors = {
        red: { bg: isDarkMode ? 'bg-[#2e1616] border-[#ef4444]/20' : 'bg-red-50 border-red-100', text: isDarkMode ? 'text-[#ef4444]' : 'text-red-700', icon: isDarkMode ? 'text-[#ef4444]' : 'text-red-500' },
        amber: { bg: isDarkMode ? 'bg-amber-900/20 border-[#f59e0b]/20' : 'bg-amber-50 border-amber-100', text: isDarkMode ? 'text-[#f59e0b]' : 'text-amber-700', icon: isDarkMode ? 'text-[#f59e0b]' : 'text-amber-500' },
        emerald: { bg: isDarkMode ? 'bg-[#132b1f] border-[#10b981]/20' : 'bg-emerald-50 border-emerald-100', text: isDarkMode ? 'text-[#10b981]' : 'text-emerald-700', icon: isDarkMode ? 'text-[#10b981]' : 'text-emerald-500' },
    };
    const c = colors[cs.color];
    return (
        <div className={`p-5 h-full rounded-2xl flex flex-col gap-4 transition-all duration-300 border ${c.bg}`}>
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 shadow-sm ${c.icon}`}>
                {cs.color === 'emerald' ? <Sparkles className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
                <p className={`text-[14px] font-bold uppercase tracking-wider mb-2 ${c.text}`}>{cs.title}</p>
                <p className={`text-[13px] leading-relaxed ${isDarkMode ? 'text-[#e4e4e7]' : 'text-gray-700'}`}>{cs.body}</p>
            </div>
        </div>
    );
});

// ─── PDF Generation ───────────────────────────────────────────────────────────
const generateCertificate = async ({ checked, subgroups, domain, trainedModelResult, repData }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ── Color palette ─────────────────────────────────────────────
    const primary = [99, 102, 241];   // indigo
    const accent  = [16, 185, 129];   // emerald
    const danger  = [239, 68, 68];    // red
    const warn    = [245, 158, 11];   // amber
    const dark    = [30, 41, 59];     // slate-800
    const mid     = [100, 116, 139];  // slate-500
    const light   = [241, 245, 249];  // slate-100

    // ── Utility helpers ───────────────────────────────────────────
    const addPage = () => { doc.addPage(); y = margin; };
    const checkPageSpace = (need) => { if (y + need > pageH - 40) addPage(); };

    const drawDrDandelion = (doc, startX, startY, size = 32, pose = 'wave') => {
        const pxSize = size / 16;
        const C = {
            hair: [59, 35, 20], skin: [255, 205, 148], eye: [26, 26, 26],
            coat: [255, 255, 255], coatS: [224, 224, 224], steth: [108, 92, 231],
            mouth: [225, 112, 85], cheek: [250, 187, 158], pants: [44, 94, 168], shoe: [34, 34, 34]
        };
        const pixels = [];
        const put = (x, y, c) => pixels.push({ x, y, c });

        for (let x = 5; x <= 9; x++) put(x, 0, C.hair);
        for (let x = 4; x <= 10; x++) put(x, 1, C.hair);
        put(3, 2, C.hair); put(4, 2, C.hair); put(10, 2, C.hair); put(11, 2, C.hair);
        for (let x = 5; x <= 9; x++) put(x, 2, C.skin);
        for (let x = 4; x <= 10; x++) put(x, 3, C.skin);
        for (let x = 4; x <= 10; x++) put(x, 4, C.skin);
        for (let x = 5; x <= 9; x++) put(x, 5, C.skin);
        put(5, 3, C.eye); put(6, 3, C.eye); put(8, 3, C.eye); put(9, 3, C.eye);
        put(4, 4, C.cheek); put(10, 4, C.cheek);
        put(7, 5, C.mouth); put(8, 5, C.mouth);
        for (let y = 6; y <= 11; y++) for (let x = 4; x <= 10; x++) put(x, y, C.coat);
        put(3, 7, C.coat); put(3, 8, C.coat); put(11, 7, C.coat); put(11, 8, C.coat);
        put(4, 6, C.coatS); put(4, 7, C.coatS); put(10, 6, C.coatS); put(10, 7, C.coatS);
        put(7, 7, C.coatS); put(7, 8, C.coatS); put(7, 9, C.coatS); put(7, 10, C.coatS);
        put(5, 7, C.steth); put(5, 8, C.steth); put(6, 8, C.steth);
        if (pose === 'wave') {
            put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
            put(11, 7, C.skin); put(12, 6, C.skin); put(12, 5, C.skin); put(13, 4, C.skin);
        } else if (pose === 'point') {
            put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
            put(11, 8, C.skin); put(12, 8, C.skin); put(13, 8, C.skin);
        } else {
            put(3, 8, C.skin); put(3, 9, C.skin); put(3, 10, C.skin);
            put(11, 8, C.skin); put(11, 9, C.skin); put(11, 10, C.skin);
        }
        for (let x = 5; x <= 6; x++) { put(x, 12, C.pants); put(x, 13, C.pants); }
        for (let x = 8; x <= 9; x++) { put(x, 12, C.pants); put(x, 13, C.pants); }
        put(4, 14, C.shoe); put(5, 14, C.shoe); put(6, 14, C.shoe); put(8, 14, C.shoe); put(9, 14, C.shoe); put(10, 14, C.shoe);

        pixels.forEach(p => {
            doc.setFillColor(...p.c);
            doc.rect(startX + p.x * pxSize, startY + p.y * pxSize, pxSize, pxSize, 'F');
        });
    };

    const drawLine = (yPos, color = mid) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageW - margin, yPos);
    };

    const drawQuote = (text) => {
        const lines = doc.splitTextToSize(text, contentW);
        checkPageSpace(lines.length * 4 + 5);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...mid);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 6;
    };

    const sectionTitle = (text) => {
        checkPageSpace(20);
        doc.setFillColor(...primary);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(text.toUpperCase(), margin + 5, y + 7);
        y += 15;
    };

    // ══════════════════════════════════════════════════════════════
    //  PAGE 1 — TITLE & OVERVIEW
    // ══════════════════════════════════════════════════════════════

    // Background accent bar at top
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageW, 4, 'F');

    // Title
    y = 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...dark);
    doc.text('ML Pipeline Summary Certificate', margin, y);
    y += 10;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...mid);
    doc.text('Generated by the ML Visualization Tool for Healthcare Professionals', margin, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  Version 1.0`, margin, y);
    y += 10;

    drawLine(y);
    y += 8;

    // ── Specialty Card ────────────────────────────────────────────
    sectionTitle('Clinical Specialty');

    doc.setFillColor(...light);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text(domain?.name || 'Not Selected', margin + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mid);
    const descLines = doc.splitTextToSize(domain?.description || 'No description available', contentW - 12);
    doc.text(descLines, margin + 6, y + 15);

    doc.setFontSize(8);
    doc.text('Data Source: ' + (domain?.source || 'N/A'), margin + 6, y + 23);

    y += 34;

    // ── Clinical Question ────────────────────────────────────────
    if (domain?.clinicalQuestion) {
        checkPageSpace(22);
        doc.setFillColor(238, 242, 255); // light indigo
        doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...primary);
        doc.text('CLINICAL QUESTION', margin + 5, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...dark);
        const qLines = doc.splitTextToSize(domain.clinicalQuestion, contentW - 10);
        doc.text(qLines, margin + 5, y + 12);
        y += 22;
    }

    // ══════════════════════════════════════════════════════════════
    //  MODEL PERFORMANCE METRICS
    // ══════════════════════════════════════════════════════════════
    sectionTitle('Model Performance');

    // Model name & settings
    const modelName = trainedModelResult?.modelName || 'No model trained';
    const modelSettings = trainedModelResult?.settings || 'Default';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text('Model: ' + modelName, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mid);
    doc.text('Settings: ' + modelSettings, margin, y);
    y += 8;

    // Metrics table
    const metrics = [
        { name: 'Accuracy', value: trainedModelResult?.accuracy, threshold: 0.65, desc: 'Percentage of all patients correctly classified' },
        { name: 'Sensitivity *', value: trainedModelResult?.sensitivity, threshold: 0.70, desc: 'Fraction of true positive cases caught' },
        { name: 'Specificity', value: trainedModelResult?.specificity, threshold: 0.65, desc: 'Fraction of true negatives correctly identified' },
        { name: 'Precision', value: trainedModelResult?.precision, threshold: 0.60, desc: 'Of flagged patients, fraction truly at risk' },
        { name: 'F1 Score', value: trainedModelResult?.f1Score, threshold: 0.65, desc: 'Harmonic mean of Sensitivity and Precision' },
        { name: 'AUC-ROC', value: trainedModelResult?.auc, threshold: 0.75, desc: 'Overall separability score (0.5–1.0)' },
    ];

    let tableEndY = y;
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, bottom: 45 },
        head: [['Metric', 'Value', 'Threshold', 'Status', 'Description']],
        body: metrics.map(m => {
            const val = m.value != null ? m.value : 0;
            const status = val >= m.threshold ? '[PASS]' : val >= m.threshold * 0.75 ? '[REVIEW]' : '[FAIL]';
            return [m.name, pctStr(val), '>= ' + pctStr(m.threshold), status, m.desc];
        }),
        styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 30 },
            1: { halign: 'center', cellWidth: 18 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 20 },
            4: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 60; },
    });

    y = tableEndY + 8;
    drawQuote('Dr. Dandelion says: "Accuracy alone can be misleading in healthcare. We prioritize Sensitivity to avoid missing true cases, and Precision to ensure alerts are meaningful. Always look at the F1 Score for a balanced view."');

    // ── Sensitivity Warning ──────────────────────────────────────
    if (trainedModelResult?.sensitivity != null && trainedModelResult.sensitivity < 0.50) {
        checkPageSpace(16);
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(margin, y, contentW, 13, 2, 2, 'F');
        doc.setDrawColor(...danger);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentW, 13, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...danger);
        doc.text('WARNING: LOW SENSITIVITY', margin + 5, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...dark);
        doc.text('Sensitivity is below 50%. The model misses more than half of true positive cases. Consider retraining.', margin + 5, y + 10);
        y += 18;
    }

    // ══════════════════════════════════════════════════════════════
    //  SUBGROUP EQUITY / BIAS ANALYSIS
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(60);
    sectionTitle('Subgroup Equity Analysis');

    if (subgroups?.rows) {
        // Bias warnings
        const overallSens = subgroups.overall?.sens ?? 0;
        const biasRows = subgroups.rows.filter(r => !r.isRef && overallSens - r.sens > 0.10);

        if (biasRows.length > 0) {
            checkPageSpace(14 * biasRows.length);
            biasRows.forEach(row => {
                const gap = Math.round((overallSens - row.sens) * 100);
                doc.setFillColor(254, 242, 242);
                doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(...danger);
                doc.text(`BIAS DETECTED: ${row.group} sensitivity deficit of ${gap} percentage points - deployment not advised.`, margin + 4, y + 6.5);
                y += 13;
            });
        }

        // Subgroup table
        tableEndY = y;
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin, bottom: 45 },
            head: [['Demographic', 'N Records', 'Accuracy', 'Sensitivity', 'S.Index', 'Specificity', 'Audit']],
            body: subgroups.rows.map(r => {
                const sIdx = (r.sens / (subgroups.overall.sens || 1)).toFixed(2);
                const audit = r.isRef ? 'Ref' : (overallSens - r.sens > 0.10 ? '[FAIL]' : r.sens < 0.65 ? '[REVIEW]' : '[PASS]');
                return [r.group, r.val, pctStr(r.acc), pctStr(r.sens), sIdx, pctStr(r.spec), audit];
            }),
            styles: { fontSize: 8, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'center', fontStyle: 'bold' },
            },
            didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 50; },
        });
        
        y = tableEndY + 8;
        drawQuote('Dr. Dandelion says: "Algorithmic bias occurs when a model performs significantly worse for specific demographic groups. We mandate a sensitivity difference of less than 10% across all subgroups to ensure equitable care."');
    }

    // ══════════════════════════════════════════════════════════════
    //  DATA REPRESENTATION PARITY
    // ══════════════════════════════════════════════════════════════
    if (repData) {
        checkPageSpace(45);
        sectionTitle('Training Data Representation');

        tableEndY = y;
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin, bottom: 45 },
            head: [['Group', 'Training %', 'Hospital %', 'Diff (pp)', 'Status']],
            body: [
                ['Male', Math.round(repData.training.male * 100) + '%', Math.round(repData.hospital.male * 100) + '%',
                    Math.abs(Math.round(repData.training.male * 100) - Math.round(repData.hospital.male * 100)) + 'pp',
                    Math.abs(repData.training.male - repData.hospital.male) > 0.15 ? '[!] Under-rep' : '[OK]'],
                ['Female', Math.round(repData.training.female * 100) + '%', Math.round(repData.hospital.female * 100) + '%',
                    Math.abs(Math.round(repData.training.female * 100) - Math.round(repData.hospital.female * 100)) + 'pp',
                    Math.abs(repData.training.female - repData.hospital.female) > 0.15 ? '[!] Under-rep' : '[OK]'],
                ['Elderly (>76)', Math.round(repData.training.elderly * 100) + '%', Math.round(repData.hospital.elderly * 100) + '%',
                    Math.abs(Math.round(repData.training.elderly * 100) - Math.round(repData.hospital.elderly * 100)) + 'pp',
                    Math.abs(repData.training.elderly - repData.hospital.elderly) > 0.15 ? '[!] Under-rep' : '[OK]'],
            ],
            styles: { fontSize: 8, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
            headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center', fontStyle: 'bold' },
            },
            didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 30; },
        });

        y = tableEndY + 8;
        drawQuote('Dr. Dandelion says: "If your training data doesn\'t look like the real world, the model will be blind to minority cases. Keep the difference under 15 percentage points."');
    }

    // ══════════════════════════════════════════════════════════════
    //  EU AI ACT COMPLIANCE CHECKLIST
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(55);
    sectionTitle('EU AI Act Compliance Checklist');

    tableEndY = y;
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, bottom: 45 },
        head: [['#', 'Requirement', 'Pre-set?', 'Status']],
        body: CHECKLIST_ITEMS.map((item, i) => {
            const isChecked = checked.includes(item.id);
            return [
                i + 1,
                item.label + ' — ' + item.detail,
                item.preChecked ? 'Yes' : 'No',
                isChecked ? '[YES] Confirmed' : '[NO] Pending',
            ];
        }),
        styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 16, halign: 'center' },
            3: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        },
        didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 60; },
    });

    y = tableEndY + 8;

    // Checklist summary
    const total = CHECKLIST_ITEMS.length;
    const completed = checked.length;
    checkPageSpace(14);
    doc.setFillColor(completed === total ? 236 : 254, completed === total ? 253 : 249, completed === total ? 245 : 235);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...(completed === total ? accent : warn));
    doc.text(`Checklist Completion: ${completed} / ${total} items confirmed` + (completed === total ? ' -- All requirements met.' : ' -- Outstanding items remain.'), margin + 5, y + 6.5);
    y += 16;

    // ══════════════════════════════════════════════════════════════
    //  CASE PRECEDENT
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(50);
    sectionTitle('Real-World AI Failure Case Studies');

    CASE_STUDIES.forEach((cs, i) => {
        checkPageSpace(18);
        const bgColor = cs.color === 'red' ? [254, 242, 242] : cs.color === 'amber' ? [255, 251, 235] : [236, 253, 245];
        doc.setFillColor(...bgColor);
        doc.roundedRect(margin, y, contentW, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...(cs.color === 'red' ? danger : cs.color === 'amber' ? warn : accent));
        doc.text((i + 1) + '. ' + cs.title, margin + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...dark);
        const bodyLines = doc.splitTextToSize(cs.body, contentW - 8);
        doc.text(bodyLines, margin + 4, y + 10);
        y += 17;
    });

    // ══════════════════════════════════════════════════════════════
    //  FOOTER / DISCLAIMER
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(30);
    y += 4;
    drawLine(y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primary);
    doc.text('CLINICAL DISCLAIMER', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    const disclaimer = 'This certificate is generated for educational purposes only. AI detects statistical associations, not causation. All model outputs must be reviewed by a qualified clinician before any clinical decision is made. This tool is not a medical device or diagnostic instrument. All patient data used was processed locally in the browser and was never transmitted to any server.';
    const discLines = doc.splitTextToSize(disclaimer, contentW);
    doc.text(discLines, margin, y);
    y += discLines.length * 3.5 + 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Prepared by HealthCare Team  ·  ML Visualization Tool  ·  SENG 430', margin, y);

    // Bottom accent bar on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        
        // Draw Dr. Dandelion on bottom right
        drawDrDandelion(doc, pageW - margin - 20, pageH - margin - 22, 24, p % 2 === 0 ? 'wave' : 'point');

        doc.setFillColor(...primary);
        doc.rect(0, pageH - 3, pageW, 3, 'F');
        // Page number
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...mid);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    // ── Save ─────────────────────────────────────────────────────
    const specialtySlug = (domain?.name || 'report').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`ML_Summary_Certificate_${specialtySlug}.pdf`);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EthicsBias = ({ isDarkMode, onPrev, domain, trainedModelResult, dataset, targetColumn }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const [subgroups, setSubgroups] = useState(null);
    const [repData, setRepData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [checkedItems, setCheckedItems] = useState(() => CHECKLIST_ITEMS.filter(i => i.preChecked).map(i => i.id));
    
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setSubgroups(generateSubgroups(trainedModelResult, dataset, targetColumn));
            setRepData(generateRepresentation(dataset));
            setLoading(false);
        }, 800);
        return () => clearTimeout(t);
    }, [trainedModelResult, dataset, targetColumn]);

    const handleGenerateCert = async () => {
        setIsGenerating(true);
        setShowOverlay(true);
    };

    const handleAnimationFinished = async () => {
        try {
            await generateCertificate({ checked: checkedItems, subgroups, domain, trainedModelResult, repData });
        } catch (err) {
            console.error('Report generation failed:', err);
            alert('Report generation failed: ' + err.message);
        } finally {
            setTimeout(() => {
                setShowOverlay(false);
                setIsGenerating(false);
            }, 1200);
        }
    };

    return (
        <>
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-32 max-w-[1400px] mx-auto min-h-screen">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 px-4 md:px-6 pt-6 space-y-5">
                
                {/* ═══════════════ TOP STATS BAR ═══════════════ */}
                <div className={`flex flex-wrap items-center justify-between p-2 rounded-2xl border ${isDarkMode ? 'bg-[#131316] border-[#1f1f23]' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <TopMetricCard isDarkMode={isDarkMode} title="Total Records" value={(dataset?.length || 0).toLocaleString()} subtext="" icon={Users} colorClass="text-[#10b981]" />
                    <div className={`w-px h-12 ${isDarkMode ? 'bg-[#1f1f23]' : 'bg-gray-200'}`} />
                    <TopMetricCard isDarkMode={isDarkMode} title="Subgroup Flags" value={subgroups?.rows?.filter(g => g.acc < 0.7 || g.sens < 0.7).length || 0} subtext="Requires review" icon={AlertTriangle} colorClass="text-[#ef4444]" />
                    <div className={`w-px h-12 ${isDarkMode ? 'bg-[#1f1f23]' : 'bg-gray-200'}`} />
                    <TopMetricCard isDarkMode={isDarkMode} title="Model Accuracy" value={Math.round((trainedModelResult?.accuracy || 0) * 100) + '%'} subtext="" icon={Activity} colorClass="text-[#f59e0b]" />
                    <div className={`w-px h-12 ${isDarkMode ? 'bg-[#1f1f23]' : 'bg-gray-200'}`} />
                    <TopMetricCard isDarkMode={isDarkMode} title="Confirmed Audits" value={`${checkedItems.length} / ${CHECKLIST_ITEMS.length}`} subtext="" icon={ShieldCheck} colorClass="text-[#10b981]" />
                    <div className={`w-px h-12 ${isDarkMode ? 'bg-[#1f1f23]' : 'bg-gray-200'}`} />
                    <div className={`pr-4 pl-4 py-2 relative overflow-hidden rounded-xl flex-1 flex justify-end ${isDarkMode ? 'bg-white/[0.02]' : 'bg-gray-50/50'}`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-[40px] -mr-10 -mt-10 rounded-full`} style={{ backgroundColor: primaryStr }} />
                        <div className="relative z-10 text-right">
                            <span className={`text-[12px] font-medium ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Risk Precision</span>
                            <div className={`text-[24px] font-bold tabular-nums leading-none mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round((trainedModelResult?.precision || 0) * 100)}%</div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ ROW 1: BAR METRICS & DOUBLE DONUT ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    <div id="s7-subgroups" className="lg:col-span-8 flex flex-col">
                        <SubgroupMetricsBarChart subgroups={subgroups} isDarkMode={isDarkMode} />
                    </div>
                    <div id="s7-representation" className="lg:col-span-4 flex flex-col">
                        <RepresentationHalfDonutChart repData={repData} isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* ═══════════════ ROW 2: ANOMALIES & CHECKLIST ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    <div id="s7-anomalies" className="lg:col-span-7 flex flex-col">
                        <AnomalyLineChart trainedModelResult={trainedModelResult} isDarkMode={isDarkMode} />
                    </div>
                    <div id="s7-checklist" className="lg:col-span-5 flex flex-col">
                        <Card isDarkMode={isDarkMode} title="Compliance Checklist" className="h-full">
                            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar">
                                {CHECKLIST_ITEMS.map((item) => (
                                    <ChecklistItem 
                                        key={item.id} 
                                        item={item} 
                                        checked={checkedItems.includes(item.id) || item.preChecked} 
                                        onToggle={id => setCheckedItems(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} 
                                        isDarkMode={isDarkMode} 
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ═══════════════ ROW 3: CASE STUDIES ═══════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                    {CASE_STUDIES.map(cs => <CaseStudyCard key={cs.title} cs={cs} isDarkMode={isDarkMode} />)}
                </div>

                {/* ── Navigation ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                    className={`flex justify-between items-center pt-8 border-t mt-8 ${isDarkMode ? 'border-[#1f1f23]' : 'border-gray-200'}`}>
                    <motion.button onClick={onPrev} whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border ${isDarkMode ? 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border-transparent hover:border-[#27272a]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent hover:border-gray-200'}`}>
                        ← Previous
                    </motion.button>
                     <motion.button onClick={handleGenerateCert} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-black transition-all shadow-sm focus:outline-none ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: '#c8d84a' }}
                    >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Download className="w-4 h-4" /> Download Certificate</>}
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>

            {/* Dr. Dandelion Step Tour */}
            <StepTour
                stepNumber={7}
                isDarkMode={isDarkMode}
                steps={[
                    {
                        targetId: 's7-subgroups',
                        position: 'below',
                        pose: 'wave',
                        title: 'Demographic Bias Audit',
                        body: 'This bar chart breaks down model performance across different demographic groups (e.g., Male vs. Female, Age groups). A truly ethical model should perform equally well for everyone. If you see a large drop in sensitivity for one specific group, that is Algorithmic Bias.',
                        sub: 'In healthcare, a biased model could systematically under-diagnose a specific minority group, leading to severe disparities in care.',
                    },
                    {
                        targetId: 's7-representation',
                        position: 'left',
                        pose: 'point',
                        title: 'Data Representation Gap',
                        body: 'Often, bias happens because the training data isn\'t diverse enough. This donut chart compares the demographic breakdown of your training dataset against the real-world hospital population. If they don\'t match, your model is learning from skewed data.',
                        sub: 'If you train a heart disease model mostly on male data, it might miss the different symptom presentations in female patients.',
                    },
                    {
                        targetId: 's7-anomalies',
                        position: 'below',
                        pose: 'wave',
                        title: 'Data Integrity & Drift',
                        body: 'This chart monitors the overall health of the model and data. "Drift" happens when real-world patient profiles slowly change over time, making your old model outdated. Anomaly spikes here warn you that the model might need retraining soon.',
                        sub: 'Models are not "deploy and forget." They are living tools that require continuous monitoring.',
                    },
                    {
                        targetId: 's7-checklist',
                        position: 'left',
                        pose: 'point',
                        title: 'EU AI Act Compliance',
                        body: 'Finally, before deployment, you must review this checklist based on real AI regulations. It ensures human oversight, privacy, and clinical validation. Check off the remaining manual items, then download your final compliance certificate!',
                        sub: 'Congratulations! You\'ve reached the end of the pipeline. You now understand how to build AI that is accurate, explainable, and ethical.',
                    },
                ]}
            />

        <AnimatePresence>
            {showOverlay && (
                <ReportLoadingOverlay
                    isVisible={showOverlay}
                    color={primaryStr}
                    onFinished={handleAnimationFinished}
                />
            )}
        </AnimatePresence>
        </>
    );
}

export default EthicsBias;
