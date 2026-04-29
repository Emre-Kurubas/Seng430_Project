import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ArrowLeft, Download,
    Shield, Users, BarChart3, BookOpen, Activity,
    Check, ChevronDown, ChevronUp, Scale, Sparkles, ArrowRight
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReportLoadingOverlay from './ReportLoadingOverlay';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => parseFloat((min + Math.random() * (max - min)).toFixed(2));
const pct = (v) => Math.round(v * 100);

const colorForValue = (v, warn, danger, isDarkMode) => {
    if (v < danger) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (v < warn) return isDarkMode ? 'text-amber-400' : 'text-amber-600';
    return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
};

const badgeForValue = (v, warn, danger, isDarkMode) => {
    if (v < danger) return { label: 'Fail', cls: isDarkMode ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200' };
    if (v < warn) return { label: 'Review', cls: isDarkMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200' };
    return { label: 'Pass', cls: isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
};

// ─── Subgroup data generator ──────────────────────────────────────────────────
const generateSubgroups = (trainedModelResult) => {
    const overall = trainedModelResult ? {
        acc: Math.max(trainedModelResult.accuracy, 0.70),
        sens: Math.max(trainedModelResult.sensitivity, 0.65),
        spec: Math.max(trainedModelResult.specificity, 0.70)
    } : { acc: rand(0.72, 0.85), sens: rand(0.68, 0.78), spec: rand(0.75, 0.88) };

    const baseAcc = overall.acc;
    const baseSens = overall.sens;
    const spec = overall.spec;

    return {
        overall,
        rows: [
            { group: 'Male', val: 450, acc: Math.min(baseAcc + rand(0.01, 0.03), 0.99), sens: Math.min(baseSens + rand(0.01, 0.03), 0.99), spec: Math.min(spec + rand(0.01, 0.03), 0.99), isRef: true },
            { group: 'Female', val: 310, acc: Math.max(baseAcc - rand(0.02, 0.05), 0.60), sens: Math.max(baseSens - rand(0.04, 0.08), 0.55), spec: spec, isRef: false },
            { group: 'Age 18–60', val: 520, acc: baseAcc, sens: baseSens, spec: spec, isRef: false },
            { group: 'Age 61–75', val: 180, acc: Math.max(baseAcc - rand(0.01, 0.03), 0.60), sens: Math.max(baseSens - rand(0.02, 0.05), 0.58), spec: spec, isRef: false },
            { group: 'Age 76+', val: 60, acc: Math.max(baseAcc - rand(0.03, 0.06), 0.55), sens: Math.max(baseSens - rand(0.05, 0.10), 0.50), spec: spec, isRef: false },
        ],
    };
};

const generateRepresentation = () => ({
    training: { male: rand(0.58, 0.70), female: rand(0.30, 0.42), elderly: rand(0.10, 0.18) },
    hospital: { male: rand(0.44, 0.54), female: rand(0.46, 0.56), elderly: rand(0.28, 0.38) },
});

const CHECKLIST_ITEMS = [
    { id: 'explainability', label: 'Feature Importance Configured', detail: 'SHAP-value waterfall logic verified on all predictive clusters.', preChecked: true },
    { id: 'data_doc', label: 'Dataset Lineage Provenance', detail: 'Source hospital origin, time frame, and collection constraints documented in Step 2.', preChecked: true },
    { id: 'bias_audit', label: 'Sub-group Disparity Addressed', detail: 'Analyzed model variance across male vs female and age brackets.', preChecked: false },
    { id: 'human_oversight', label: 'Clinician-in-the-Loop Workflow', detail: 'Mandatory physician sign-off for algorithmic high-risk flag prior to operational intervention.', preChecked: false },
    { id: 'privacy', label: 'Data Masking & Privacy (GDPR/HIPAA)', detail: 'All raw clinical values securely stripped of personally identifiable traits.', preChecked: false },
    { id: 'validation', label: 'Cross-Domain Validation Matrix', detail: 'Simulated performance run on separate unseen holdout cohort.', preChecked: false },
];

const CASE_STUDIES = [
    { title: 'The Accuracy Paradox', color: 'amber', body: 'A model achieved 90% accuracy but failed completely on an ethnic minority subset due to severe class imbalance.' },
    { title: 'Harm by Automation Bias', color: 'red', body: 'A diagnostic AI deployed without human-in-the-loop safeguards misdiagnosed 14% of early-stage conditions.' },
    { title: 'Success via Auditing', color: 'emerald', body: 'Proactive algorithmic bias auditing enabled a care network to adjust decision boundaries, saving countless lives equitably.' },
];

const SubgroupRow = React.memo(({ group, val, acc, sens, spec, overall, isDarkMode, delay, isRef }) => {
    const gap = overall.sens - sens;
    const sensBad = gap > 0.10;
    const badge = isRef ? { label: 'System Ref', cls: isDarkMode ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50' : 'bg-slate-100/80 text-slate-500 border border-slate-200' } : badgeForValue(sens, 0.65, 0.50, isDarkMode);

    return (
        <motion.tr initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={'border-b transition-all duration-300 hover:scale-[1.01] hover:z-10 relative ' + (isDarkMode ? 'border-slate-800 hover:bg-slate-800/80' : 'border-indigo-50/50 hover:bg-white shadow-[0_0_0_1px_transparent] hover:shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)]')}
        >
            <td className="px-5 py-4">
                <div className="flex flex-col">
                    <span className={'text-sm font-bold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{group}</span>
                    <span className={'text-[10px] uppercase tracking-wider font-semibold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{val} records</span>
                </div>
            </td>
            <td className={'px-3 py-4 text-sm font-black text-center ' + colorForValue(acc, 0.72, 0.65, isDarkMode)}>{pct(acc)}%</td>
            <td className={'px-3 py-4 text-center'}>
                <div className={'flex items-center justify-center gap-1.5 text-sm font-black ' + colorForValue(sens, 0.65, 0.50, isDarkMode)}>
                    {pct(sens)}% {sensBad && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                </div>
            </td>
            <td className={'px-3 py-4 text-center text-sm font-black font-mono ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                {(sens / (overall.sens || 1)).toFixed(2)}
            </td>
            <td className={'px-3 py-4 text-sm font-black text-center ' + colorForValue(spec, 0.72, 0.65, isDarkMode)}>{pct(spec)}%</td>
            <td className="px-5 py-4 text-right">
                <span className={'text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ' + badge.cls}>
                    {badge.label}
                </span>
            </td>
        </motion.tr>
    );
});

const ChecklistItem = React.memo(({ item, checked, onToggle, isDarkMode, delay }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={`px-5 py-4 cursor-pointer transition-all duration-200 ${!item.preChecked ? 'cursor-pointer' : 'cursor-not-allowed'} ${isDarkMode ? 'border-b border-white/[0.06] hover:bg-white/[0.02]' : 'border-b border-slate-100 hover:bg-slate-50'}`}
            style={checked ? { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' } : {}}
            onClick={() => !item.preChecked && onToggle(item.id)}
        >
            <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${checked ? '' : isDarkMode ? 'border-2 border-slate-600' : 'border-2 border-slate-300'}`}
                    style={checked ? { backgroundColor: '#f97316' } : {}}
                >
                    <AnimatePresence>
                        {checked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={14} color="white" strokeWidth={3} /></motion.div>}
                    </AnimatePresence>
                </div>
                <div className="flex-1">
                    <div className={`text-sm font-medium ${checked ? (isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through') : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                        {item.label}
                        {item.preChecked && <span className={'text-[9px] ml-2 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ' + (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')}>System Set</span>}
                    </div>
                    {!checked && <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.detail}</div>}
                </div>
            </div>
        </motion.div>
    );
});

const CaseStudyCard = React.memo(({ cs, isDarkMode, delay }) => {
    const colors = {
        red: { bg: isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100', text: isDarkMode ? 'text-red-400' : 'text-red-700', icon: isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-500' },
        amber: { bg: isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100', text: isDarkMode ? 'text-amber-400' : 'text-amber-700', icon: isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-500' },
        emerald: { bg: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100', text: isDarkMode ? 'text-emerald-400' : 'text-emerald-700', icon: isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-500' },
    };
    const c = colors[cs.color];
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }} className={`p-4 rounded-2xl flex gap-4 transition-all duration-300 hover:scale-[1.02] border ${c.bg}`}>
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${c.icon}`}>
                {cs.color === 'emerald' ? <Sparkles className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${c.text}`}>{cs.title}</p>
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{cs.body}</p>
            </div>
        </motion.div>
    );
});

const RepBar = React.memo(({ label, trainingPct, hospitalPct, isDarkMode, delay, primaryStr }) => {
    const gap = Math.abs(trainingPct - hospitalPct);
    const warn = gap > 15;
    return (
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }} className={`p-3.5 rounded-2xl border transition-all duration-300 ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-4">
                <span className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{label}</span>
                {warn && <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded flex items-center justify-center"><AlertTriangle className="w-3 h-3" /> {gap.toFixed(0)}pp Diff</div>}
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] w-14 font-semibold uppercase tracking-wider ${isDarkMode ? 'text-primary-300' : 'text-indigo-600'}`}>Train</span>
                    <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900/50 outline outline-1 outline-slate-700' : 'bg-slate-200 inset-shadow-sm'}`}>
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: primaryStr }} initial={{ width: 0 }} animate={{ width: `${trainingPct}%` }} transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }} />
                    </div>
                    <span className={`text-xs font-mono font-black w-8 text-right`} style={{ color: primaryStr }}>{Math.round(trainingPct)}%</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] w-14 font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Deploy</span>
                    <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900/50 outline outline-1 outline-slate-700' : 'bg-slate-200 inset-shadow-sm'}`}>
                        <motion.div className="h-full rounded-full bg-slate-400" initial={{ width: 0 }} animate={{ width: `${hospitalPct}%` }} transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }} />
                    </div>
                    <span className={`text-xs font-mono font-black w-8 text-right ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(hospitalPct)}%</span>
                </div>
            </div>
        </motion.div>
    );
});

// ─── Shared UI Helpers ────────────────────────────────────────────────────────
const Card = ({ children, className = '', isDarkMode }) => (
    <div className={`rounded-[32px] p-6 md:p-8 flex flex-col relative transition-colors ${isDarkMode ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'} border ${className}`}>
        {children}
    </div>
);

// ─── Subgroup Performance Table ───────────────────────────────────────────────
const SubgroupPerformanceTable = ({ subgroups, isDarkMode }) => {
    const overallSens = subgroups?.overall?.sens ?? 0;
    const biasRows = subgroups?.rows?.filter(r => !r.isRef && overallSens - r.sens > 0.10) ?? [];
    
    return (
        <Card isDarkMode={isDarkMode} className="h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className={`font-semibold text-[15px] uppercase tracking-widest ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Subgroup Performance — Is the model fair?</h3>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left" style={{ minWidth: 500 }}>
                    <thead className={`border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                        <tr>
                            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Group</th>
                            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Accuracy</th>
                            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Sensitivity</th>
                            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Specificity</th>
                            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Fairness</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subgroups?.rows?.map((r, i) => {
                            const gap = overallSens - r.sens;
                            const isBad = !r.isRef && gap > 0.10;
                            const isWarn = !r.isRef && gap > 0.05 && !isBad;
                            return (
                                <tr key={r.group} className={`border-b ${isDarkMode ? 'border-white/5' : 'border-slate-50'}`}>
                                    <td className={`px-3 py-4 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{r.group}</td>
                                    <td className={`px-3 py-4 text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(r.acc * 100)}%</td>
                                    <td className={`px-3 py-4 text-sm font-bold ${isBad ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-emerald-500'}`}>{Math.round(r.sens * 100)}%</td>
                                    <td className={`px-3 py-4 text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(r.spec * 100)}%</td>
                                    <td className="px-3 py-4 text-right">
                                        {isBad ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                                                <AlertTriangle className="w-3 h-3" /> Review Needed
                                            </span>
                                        ) : isWarn ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                Review
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                OK
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {biasRows.length > 0 && (
                <div className={`mt-4 p-4 rounded-2xl flex gap-3 ${isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                        <strong>Bias Detected:</strong> Sensitivity for <strong>{biasRows[0].group}</strong> ({Math.round(biasRows[0].sens * 100)}%) is {Math.round((overallSens - biasRows[0].sens) * 100)} percentage points lower than the baseline. This means the model misses far more cases in this group. <strong>This model should NOT be deployed until this gap is addressed.</strong>
                    </p>
                </div>
            )}
        </Card>
    );
};

// ─── Sankey/Flow Chart (Bottom Left) ───────────────────────────────────────────
const DatasetFlowChart = ({ subgroups, isDarkMode }) => {
    const groups = subgroups?.rows?.slice(0, 5) || [];
    const colors = ['#b09fff', '#60a5fa', '#c8f560', '#fcd34d', '#f87171'];
    
    const leftX = 0;
    const rightX = 300;
    const height = 240;
    
    const leftBlockHeight = 100;
    const leftYStart = (height - leftBlockHeight) / 2;
    
    let currentRightY = 10;
    let currentLeftY = leftYStart;
    
    const totalVal = groups.reduce((acc, g) => acc + g.val, 0) || 1;

    return (
        <Card isDarkMode={isDarkMode} className="h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-6 z-10">
                <div className={`font-semibold text-[15px] uppercase tracking-widest ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Dataset Flow by Subgroup</div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-500">
                    <BookOpen className="w-3 h-3" /> Training Data ⌄
                </div>
            </div>
            
            <div className="flex-1 relative mt-4">
                <svg viewBox="0 0 400 240" preserveAspectRatio="none" className="w-full h-full absolute inset-0 overflow-visible z-0">
                    <rect x={leftX} y={leftYStart} width={40} height={leftBlockHeight} fill={isDarkMode ? '#3f3f46' : '#e2e8f0'} rx="4" />
                    
                    {groups.map((g, i) => {
                        const proportion = g.val / totalVal;
                        const rightHeight = Math.max(20, proportion * 180);
                        const leftHeightPart = proportion * leftBlockHeight;
                        
                        const color = colors[i % colors.length];
                        
                        const startY1 = currentLeftY;
                        const startY2 = currentLeftY + leftHeightPart;
                        const endY1 = currentRightY;
                        const endY2 = currentRightY + rightHeight;
                        
                        const path = `M ${leftX + 40} ${startY1} C ${leftX + 150} ${startY1}, ${rightX - 100} ${endY1}, ${rightX} ${endY1} L ${rightX} ${endY2} C ${rightX - 100} ${endY2}, ${leftX + 150} ${startY2}, ${leftX + 40} ${startY2} Z`;
                        
                        currentLeftY += leftHeightPart;
                        currentRightY += rightHeight + 15;
                        
                        return (
                            <path key={i} d={path} fill={color} opacity="0.6" className="transition-all hover:opacity-90 cursor-pointer" />
                        );
                    })}
                </svg>

                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-2">
                        <div className={`text-[18px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{totalVal}</div>
                        <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Total Cohort</div>
                    </div>
                    
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col pt-[10px]">
                        {groups.map((g, i) => {
                            const color = colors[i % colors.length];
                            const proportion = g.val / totalVal;
                            const rightHeight = Math.max(20, proportion * 180);
                            return (
                                <div key={i} className="flex items-center gap-2 pr-2" style={{ height: rightHeight + 'px', marginBottom: '15px' }}>
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{g.group}</span>
                                        <span className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{g.val} <span className="text-[9px] font-semibold text-slate-500">({Math.round(proportion*100)}%)</span></span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};

// ─── Population Pyramid (Top Right) ───────────────────────────────────────────
const PopulationPyramid = ({ isDarkMode }) => {
    const data = [
        { label: '75-100', m: 35, f: 45 },
        { label: '50-75', m: 70, f: 80 },
        { label: '25-50', m: 85, f: 75 },
        { label: '0-25', m: 50, f: 45 },
    ];
    
    return (
        <Card isDarkMode={isDarkMode} className="h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-4 z-10">
                <div className={`font-semibold text-[15px] uppercase tracking-widest ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Patient Demographics</div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-500">
                    <Activity className="w-3 h-3" /> Dist ⌄
                </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center w-full px-4 relative">
                {/* Labels */}
                <div className="absolute left-0 right-0 flex flex-col justify-between h-[150px] py-3 pointer-events-none z-10">
                    {data.map((d, i) => (
                        <div key={i} className="flex justify-between w-full text-[10px] font-semibold text-slate-400">
                            <span>{d.label}</span>
                            <span>{d.label}</span>
                        </div>
                    ))}
                </div>
                
                {/* Bars */}
                <div className="w-full max-w-[200px] h-[150px] flex flex-col justify-between py-1 relative mb-4 mt-2">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 dark:bg-slate-700 -translate-x-1/2" />
                    
                    {data.map((d, i) => (
                        <div key={i} className="w-full flex items-center justify-center relative h-6">
                            <div className="absolute right-1/2 top-1 bottom-1 bg-gradient-to-l from-[#b09fff] to-[#b09fff]/50 rounded-l-sm" style={{ width: `${d.m}%` }} />
                            <div className="absolute left-1/2 top-1 bottom-1 bg-gradient-to-r from-[#f87171] to-[#f87171]/50 rounded-r-sm" style={{ width: `${d.f}%` }} />
                        </div>
                    ))}
                </div>
                
                {/* Bottom X-axis labels moved further down to avoid overlap */}
                <div className="w-full max-w-[200px] flex justify-between text-[9px] font-bold text-slate-400 mt-2">
                    <span>25%</span><span>0%</span><span>25%</span>
                </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-auto pt-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#b09fff]" /> Male</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#f87171]" /> Female</div>
            </div>
        </Card>
    );
};

// ─── Rep Bars Card (Bottom Right) ───────────────────────────────────────────────
const RepBarsCard = ({ repData, primaryStr, isDarkMode }) => {
    if (!repData) return null;
    return (
        <Card isDarkMode={isDarkMode} className="h-full">
            <h3 className={`font-semibold text-[15px] uppercase tracking-widest mb-6 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Training Data vs. Real Population</h3>
            
            <div className="space-y-4">
                <RepBar label="Male Presentation" trainingPct={Math.round(repData.training.male * 100)} hospitalPct={Math.round(repData.hospital.male * 100)} isDarkMode={isDarkMode} delay={0.1} primaryStr={primaryStr} />
                <RepBar label="Female Presentation" trainingPct={Math.round(repData.training.female * 100)} hospitalPct={Math.round(repData.hospital.female * 100)} isDarkMode={isDarkMode} delay={0.2} primaryStr={primaryStr} />
            </div>

            {Math.abs(repData.training.female - repData.hospital.female) > 0.15 && (
                <div className={`mt-4 p-4 rounded-2xl flex gap-3 ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                        <strong>Under-representation:</strong> Only {Math.round(repData.training.female * 100)}% of training patients were female, but {Math.round(repData.hospital.female * 100)}% of real patients are female. This mismatch explains the model's poor performance for women. Retrain with a more balanced dataset.
                    </p>
                </div>
            )}
        </Card>
    );
};

// ─── PDF Report Generator ──────────────────────────────────────────────────────
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
    const checkPageSpace = (need) => { if (y + need > pageH - 20) addPage(); };

    const drawLine = (yPos, color = mid) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageW - margin, yPos);
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

    const pctStr = (v) => v != null ? Math.round(v * 100) + '%' : 'N/A';

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
        margin: { left: margin, right: margin },
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

    y = tableEndY + 10;

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
            margin: { left: margin, right: margin },
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
        y = tableEndY + 10;
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
            margin: { left: margin, right: margin },
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
        y = tableEndY + 10;
    }

    // ══════════════════════════════════════════════════════════════
    //  EU AI ACT COMPLIANCE CHECKLIST
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(55);
    sectionTitle('EU AI Act Compliance Checklist');

    tableEndY = y;
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
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
const EthicsBias = ({ isDarkMode, onPrev, domain, trainedModelResult }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';
    const [subgroups, setSubgroups] = useState(null);
    const [repData, setRepData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [checkedItems, setCheckedItems] = useState(() => CHECKLIST_ITEMS.filter(i => i.preChecked).map(i => i.id));
    

    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setSubgroups(generateSubgroups(trainedModelResult));
            setRepData(generateRepresentation());
            setLoading(false);
        }, 800);
        return () => clearTimeout(t);
    }, [trainedModelResult]);

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

    const overallSens = subgroups?.overall?.sens ?? 0;
    const biasRows = subgroups?.rows?.filter(r => !r.isRef && overallSens - r.sens > 0.10) ?? [];

    return (
        <>
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-44 max-w-7xl mx-auto">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-6">
                
                {/* ═══════════════ ROW 1: TABLE & CHECKLIST ═══════════════ */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: 7 cols */}
                    <div className="xl:col-span-7 flex flex-col gap-6">
                        <SubgroupPerformanceTable subgroups={subgroups} isDarkMode={isDarkMode} />
                    </div>

                    {/* RIGHT COLUMN: 5 cols */}
                    <div className="xl:col-span-5 flex flex-col gap-6">
                        <Card isDarkMode={isDarkMode} className="h-full p-0 overflow-hidden">
                            <div className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                <h3 className={`font-semibold text-[15px] uppercase tracking-widest ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>EU AI Act Compliance Checklist</h3>
                            </div>
                            <div className="flex flex-col p-2">
                                {CHECKLIST_ITEMS.map((item, i) => (
                                    <ChecklistItem key={item.id} item={item} checked={checkedItems.includes(item.id)} onToggle={id => setCheckedItems(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} isDarkMode={isDarkMode} delay={i * 0.05} />
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ═══════════════ ROW 2: REP BARS & CASE STUDIES ═══════════════ */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
                    {/* LEFT: 7 cols */}
                    <div className="xl:col-span-7 flex flex-col gap-6">
                        <RepBarsCard repData={repData} primaryStr={primaryStr} isDarkMode={isDarkMode} />
                    </div>

                    {/* RIGHT: 5 cols */}
                    <div className="xl:col-span-5 flex flex-col gap-6">
                        <Card isDarkMode={isDarkMode} className="h-full p-6">
                            <h3 className={`font-semibold text-[15px] uppercase tracking-widest mb-6 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Real-World AI Failures in Healthcare</h3>
                            <div className="space-y-4 pt-2">
                                {CASE_STUDIES.map((cs, i) => <CaseStudyCard key={cs.title} cs={cs} isDarkMode={isDarkMode} delay={i * 0.1} />)}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ═══════════════ ROW 3: FLOW & PYRAMID ═══════════════ */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
                    {/* LEFT: 7 cols */}
                    <div className="xl:col-span-7 flex flex-col gap-6">
                        <DatasetFlowChart subgroups={subgroups} isDarkMode={isDarkMode} />
                    </div>

                    {/* RIGHT: 5 cols */}
                    <div className="xl:col-span-5 flex flex-col gap-6">
                        <PopulationPyramid isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* ═══════════════ ROW 4: CONGRATULATIONS BANNER ═══════════════ */}
                <div className="pt-6">
                    <div className={`p-6 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xl">🎓</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>
                            <strong>Congratulations — you have completed all 7 steps.</strong> You have defined a clinical problem, explored patient data, prepared it correctly, trained and compared ML models, evaluated results with clinical metrics, understood why the model makes predictions, and checked it for fairness. Download your Summary Certificate to document what you built.
                        </p>
                    </div>
                </div>

                {/* ── Navigation ── */}
                <motion.div variants={itemAnim} className={'flex justify-between items-center pt-8 border-t ' + (isDarkMode ? 'border-slate-800' : 'border-slate-200')}>
                    <motion.button onClick={onPrev} whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}
                        className={'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ' + (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}>
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </motion.button>
                     <motion.button onClick={handleGenerateCert} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={!isGenerating ? { backgroundColor: primaryStr } : { backgroundColor: isDarkMode ? '#334155' : '#94a3b8' }}
                    >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <><Download className="w-4 h-4 text-white" /> Report</>}
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>

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
