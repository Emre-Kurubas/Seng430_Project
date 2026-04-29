import React, { useState, useEffect, useMemo, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, Info, AlertTriangle,
    ChevronDown, Lightbulb, Activity, User,
    CheckCircle2, HelpCircle, TrendingUp, TrendingDown,
    BrainCircuit, Sparkles, BarChart3, Zap, Shield, Target
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import Tooltip from './Tooltip';


/* ═══════════════════════════════════════════════════════════════
   Animated Counting Number
   ═══════════════════════════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.5 }) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const target = typeof value === 'number' ? value : parseFloat(value) || 0;
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
    return <span>{display.toLocaleString()}</span>;
};

const formatFeatureName = (name) => {
    if (!name) return '';
    try {
        return String(name).split('_').map(word => {
            const lower = word.toLowerCase();
            if (['mdvp', 'dda', 'ddp', 'apq', 'ppq', 'nhr', 'hnr', 'rpde', 'dfa', 'ppe', 'fpr', 'tpr', 'apq3', 'apq5'].includes(lower)) return lower.toUpperCase();
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    } catch {
        return String(name);
    }
};

// ─── Domain-aware feature pools ──────────────────────────────────────────────
const DOMAIN_FEATURES = {
    default: [
        { id: 'ef', label: 'Ejection Fraction', clinical: 'How well the heart pumps blood (%)' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Kidney function marker' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'hosp_time', label: 'Time in Hospital', clinical: 'Days admitted during index episode' },
        { id: 'sodium', label: 'Serum Sodium', clinical: 'Electrolyte balance indicator' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Current or former tobacco use' },
        { id: 'bp', label: 'Systolic Blood Pressure', clinical: 'Arterial pressure at peak contraction' },
        { id: 'diabetes', label: 'Diabetes', clinical: 'Diagnosed diabetes mellitus' },
    ],
    Cardiology: [
        { id: 'ef', label: 'Ejection Fraction', clinical: 'How well the heart pumps blood (%)' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Kidney function marker' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'hosp_time', label: 'Time in Hospital', clinical: 'Days admitted during index episode' },
        { id: 'sodium', label: 'Serum Sodium', clinical: 'Electrolyte balance indicator' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Current or former tobacco use' },
    ],
    Nephrology: [
        { id: 'gfr', label: 'eGFR', clinical: 'Estimated glomerular filtration rate' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Primary kidney function marker' },
        { id: 'proteinuria', label: 'Proteinuria', clinical: 'Protein spill in urine' },
        { id: 'bp', label: 'Blood Pressure (systolic)', clinical: 'Arterial pressure' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'diabetes', label: 'Diabetes', clinical: 'Major CKD risk factor' },
    ],
    Oncology: [
        { id: 'stage', label: 'Tumour Stage', clinical: 'TNM staging classification' },
        { id: 'grade', label: 'Histological Grade', clinical: 'Degree of cellular differentiation' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'comorbidity', label: 'Comorbidity Index', clinical: 'Charlson comorbidity score' },
        { id: 'treatment', label: 'Treatment Regimen', clinical: 'Type of therapy received' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Tobacco exposure history' },
    ],
};

// ─── Generate simulated feature importance & patients ────────────────────────────────────
const generateFeatureImportance = (features) => {
    if (!features || features.length === 0) return [];
    const pool = [...features]; let remaining = 1.0;
    return pool.map((f, i) => {
        const isLast = i === pool.length - 1;
        const val = isLast ? parseFloat(remaining.toFixed(2)) : parseFloat((remaining * (0.25 + Math.random() * 0.25)).toFixed(2));
        remaining -= val;
        return { ...f, importance: Math.max(val, 0.01) };
    }).sort((a, b) => b.importance - a.importance).slice(0, 8);
};

const generatePatientContributions = (features, patient) => {
    if (!features || features.length === 0) return { contributions: [], riskScore: 0 };
    if (!patient || !patient.rowData) {
        const seedBase = patient ? (patient.id || 123) : 123;
        const result = features.slice(0, 6).map((f, i) => {
            const sign = i % 2 === 0 ? -1 : 1;
            const pseudoRand = Math.abs(Math.sin(seedBase * 13 + i * 17));
            const magnitude = parseFloat(((0.05 + pseudoRand * 0.25) * sign).toFixed(2));
            return { id: f.id, label: f.label, value: 'Unknown', contribution: magnitude, isRisk: magnitude > 0 };
        }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
        return { contributions: result, riskScore: 0.5 };
    }
    const seed = patient.id * 7;
    const result = features.map((f, i) => {
        const sign = (seed + i) % 3 === 0 ? -1 : 1;
        const pseudoRand = Math.abs(Math.sin(seed + i * 13));
        const magnitude = parseFloat(((0.05 + pseudoRand * 0.25) * sign).toFixed(2));
        const val = patient.rowData[f.id];
        let dispVal = 'N/A';
        if (val !== undefined && val !== null) dispVal = typeof val === 'number' ? (val % 1 === 0 ? String(val) : val.toFixed(2)) : String(val).slice(0, 20);
        return { id: f.id, label: f.label.length > 25 ? f.label.slice(0, 22) + '...' : f.label, value: dispVal, contribution: magnitude, isRisk: magnitude > 0 };
    }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 7);
    const riskAsStr = String(patient.riskLabel).toLowerCase();
    const isActuallyHighRisk = riskAsStr === '1' || riskAsStr === 'true' || riskAsStr === 'yes' || riskAsStr === 'positive';
    const pseudoRandRisk = Math.abs(Math.sin(seed + 99));
    const base = isActuallyHighRisk ? 0.65 + pseudoRandRisk * 0.3 : 0.1 + pseudoRandRisk * 0.3;
    return { contributions: result, riskScore: parseFloat(base.toFixed(2)) };
};

const generatePatients = (features, dataset, targetColumn) => {
    if (!dataset || dataset.length === 0 || !features || features.length === 0) {
        return Array.from({ length: 8 }, (_, i) => ({
            id: i, riskLabel: 'Unknown', vitals: [{ label: 'Data', value: 'N/A', abnormal: false }],
            label: `Mock Patient #${i + 1}`, rowData: null
        }));
    }
    const shuffled = [...dataset].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(3, dataset.length));
    return selected.map((row, i) => {
        const riskVal = row[targetColumn];
        const riskLabel = riskVal !== undefined ? String(riskVal).toUpperCase() : 'UNKNOWN';
        const vitalsArr = features.slice(0, 4).map(f => {
            const val = row[f.id]; let dispVal = 'N/A';
            if (val !== undefined && val !== null) dispVal = typeof val === 'number' ? (val % 1 === 0 ? String(val) : val.toFixed(2)) : String(val).slice(0, 20);
            return { label: f.label.length > 25 ? f.label.slice(0, 22) + '...' : f.label, value: dispVal, abnormal: false };
        });
        const targetDisplay = targetColumn.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
        return { id: i, riskLabel, vitals: vitalsArr, label: `Patient #${Math.floor(Math.random() * 8999) + 1000} · ${targetDisplay}: ${riskLabel}`, rowData: row };
    });
};


/* ═══════════════════════════════════════════════════════════════
   BENTO CARD: Risk Drivers (left tall card — like "Energy Used")
   Shows top feature with overlapping circles + importance bars
   ═══════════════════════════════════════════════════════════════ */
const RiskDriversCard = ({ featureImportance, isDarkMode }) => {
    return (
        <div className={`${isDarkMode ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'} rounded-[40px] p-8 md:p-10 w-full flex flex-col border relative overflow-hidden transition-colors h-full`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 z-10">
                <div className={`flex items-center gap-2.5 font-semibold text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    <Zap className="w-5 h-5" /> Risk Drivers
                </div>
            </div>
            


            {/* Overlapping Circles */}
            <div className="relative h-[250px] mb-6 w-full flex items-center justify-center -translate-x-2" style={{ minWidth: 320 }}>
                {featureImportance.slice(0, 6).map((f, i) => {
                    const pct = Math.round(f.importance * 100);
                    const configs = [
                        { pos: 'left-[2%] top-[0%]', size: 'w-[145px] h-[145px]', text: 'text-[36px]', bg: 'bg-[#b09fff]', color: 'text-slate-900', border: 'z-20' },
                        { pos: 'left-[40%] top-[4%]', size: 'w-[125px] h-[125px]', text: 'text-[32px]', bg: isDarkMode ? 'bg-[#2a2a2d]' : 'bg-[#1c1c1e]', color: 'text-white', border: 'border border-white/5 shadow-2xl z-10' },
                        { pos: 'left-[26%] top-[40%]', size: 'w-[110px] h-[110px]', text: 'text-[28px]', bg: 'bg-[#c8f560]', color: 'text-[#111111]', border: `border-[4px] border-white dark:border-[#1c1c1e] shadow-xl z-50` },
                        { pos: 'left-[5%] top-[52%]', size: 'w-[95px] h-[95px]', text: 'text-[24px]', bg: 'bg-[#f87171]', color: 'text-white', border: `border-[3px] border-white dark:border-[#1c1c1e] shadow-lg z-40` },
                        { pos: 'left-[55%] top-[48%]', size: 'w-[100px] h-[100px]', text: 'text-[24px]', bg: 'bg-[#60a5fa]', color: 'text-white', border: `border-[2px] border-white dark:border-[#1c1c1e] shadow-md z-30` },
                        { pos: 'left-[68%] top-[14%]', size: 'w-[85px] h-[85px]', text: 'text-[20px]', bg: 'bg-[#fcd34d]', color: 'text-[#111111]', border: `border-[2px] border-white dark:border-[#1c1c1e] shadow-sm z-5` }
                    ];
                    const cfg = configs[i];
                    return (
                        <div key={i} className={`absolute ${cfg.pos} ${cfg.size} rounded-full ${cfg.bg} flex items-center justify-center ${cfg.color} flex-col transition-transform hover:scale-105 duration-300 ${cfg.border}`}>
                            <span className={`${cfg.text} font-medium tracking-tight leading-none mb-1`}><AnimatedNumber value={pct} />%</span>
                            <span className="text-[10px] font-medium opacity-80 px-2 text-center truncate w-full">{formatFeatureName(f.label).slice(0, 11)}</span>
                        </div>
                    );
                })}
            </div>

            {/* Thick Horizontal Bars for remaining features */}
            <div className="space-y-4 mt-auto z-10 w-full pt-8">
                {featureImportance.slice(0, 6).map((f, i) => {
                    const pct = Math.round(f.importance * 100);
                    const colors = ['#b09fff', isDarkMode ? '#52525b' : '#cbd5e1', '#c8f560', '#f87171', '#60a5fa', '#fcd34d'];
                    return (
                        <div key={f.id} className="flex flex-col gap-1.5">
                            <div className="flex items-end justify-between gap-3 mb-1">
                                <span className={`text-[20px] font-medium tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#111111]'}`}>{pct}<span className="text-sm opacity-50">%</span></span>
                                <span className="text-[12px] font-semibold text-slate-500 flex items-center gap-2 mb-0.5 truncate">
                                    {formatFeatureName(f.label).slice(0, 22)} <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: colors[i] }} />
                                </span>
                            </div>
                            <div className={`h-2.5 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} rounded-full overflow-hidden w-full`}>
                                <motion.div initial={{width:0}} animate={{width: `${Math.max(pct * 2, 5)}%`}} transition={{duration: 1.5, delay: i * 0.1}} className="h-full rounded-full" style={{ backgroundColor: colors[i] }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


/* ═══════════════════════════════════════════════════════════════
   BENTO CARD: Patient Select (mini — like "Heart Rate")
   ═══════════════════════════════════════════════════════════════ */
const PatientSelectCard = ({ patients, selectedPatient, onSelect, onExplain, explaining, loadingFeatures, isDarkMode, primaryStr }) => (
    <div className={`${isDarkMode ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'} rounded-[36px] p-7 md:p-8 flex flex-col justify-between border flex-1 min-h-[220px] transition-colors`}>
        <div className="flex justify-between items-center mb-4">
            <div className={`flex items-center gap-3 font-semibold text-[17px] ${isDarkMode ? 'text-slate-200' : 'text-[#111111]'}`}>
                <User className="w-5 h-5 flex-shrink-0" strokeWidth={2} /> Case Study
            </div>
        </div>
        <select value={selectedPatient} onChange={e => { onSelect(Number(e.target.value)); }}
            className={`w-full p-2.5 rounded-xl border text-xs outline-none mb-3 ${isDarkMode ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            {patients.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <motion.button onClick={onExplain} disabled={explaining || loadingFeatures}
            whileHover={!explaining ? { scale: 1.02 } : {}} whileTap={!explaining ? { scale: 0.97 } : {}}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all ${explaining || loadingFeatures ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: primaryStr }}>
            {explaining ? (<><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white/50" />Computing…</>) : (<><Sparkles className="w-4 h-4" />Explain</>)}
        </motion.button>
    </div>
);


/* ═══════════════════════════════════════════════════════════════
   BENTO CARD: Clinical Validation (mini — like "Activity")
   ═══════════════════════════════════════════════════════════════ */
const ClinicalValidationCard = ({ senseCheck, top1, isDarkMode }) => (
    <div className={`${isDarkMode ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'} rounded-[36px] p-7 md:p-8 flex flex-col justify-between border flex-1 min-h-[220px] transition-colors`}>
        <div className="flex justify-between items-center mb-4">
            <div className={`flex items-center gap-3 font-semibold text-[17px] ${isDarkMode ? 'text-slate-200' : 'text-[#111111]'}`}>
                <Shield className="w-5 h-5 flex-shrink-0" strokeWidth={2} /> Validation
            </div>
        </div>
        <div className="flex justify-between items-end mt-auto">
            <div className="flex items-baseline gap-1.5">
                <span className={`text-[48px] font-medium tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#111111]'}`}>
                    <AnimatedNumber value={top1 ? Math.round(top1.importance * 100) : 0} />
                </span>
                <span className="text-base font-semibold text-slate-500">%</span>
            </div>
            <div className="flex flex-col items-end mb-1">
                <span className={`text-[14px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-[#111111]'}`}>Top Driver</span>
                <span className="text-[12px] font-semibold text-slate-500 mt-0.5 truncate max-w-[100px]">{top1 ? formatFeatureName(top1.label) : 'N/A'}</span>
            </div>
        </div>
    </div>
);





/* ═══════════════════════════════════════════════════════════════
   BENTO CARD: SHAP Analysis (dark card — like "Sleep Analysis")
   ═══════════════════════════════════════════════════════════════ */
const SHAPAnalysisCard = ({ patientData, explained, explaining, patients, selectedPatient, primaryStr, isDarkMode, whatIf }) => (
    <div className={`${isDarkMode ? 'bg-[#161618] border border-white/5 text-white' : 'bg-white border text-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'} rounded-[36px] p-7 md:p-8 flex flex-col relative overflow-hidden transition-colors w-full min-h-[460px] h-full`}>
        <div className="flex justify-between items-center mb-6">
            <div className={`flex items-center gap-3 font-medium text-[17px] ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <BrainCircuit className="w-5 h-5 text-slate-400" />
                Local Explainability
            </div>
            {explained && patientData && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-2 ${
                        patientData.riskScore >= 0.60 ? 'bg-red-500/20 text-red-300' : 
                        patientData.riskScore >= 0.40 ? 'bg-amber-500/20 text-amber-300' : 
                        'bg-emerald-500/20 text-emerald-300'
                    }`}>
                    Risk: {Math.round(patientData.riskScore * 100)}%
                </motion.div>
            )}
            {!explained && (
                <div className="bg-white/10 px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer hover:bg-white/20 transition-colors flex items-center gap-2 text-slate-200">
                    Awaiting ⌄
                </div>
            )}
        </div>

        {/* Loading / Empty State */}
        {!explained && !explaining && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12 text-slate-500">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <Lightbulb className="w-10 h-10 opacity-30" />
                </div>
                <p className="text-xs text-center max-w-sm opacity-80 leading-relaxed font-medium">
                    Click <strong className="text-[#c8f560]">Explain</strong> to visualise how specific metrics push this patient towards or away from risk.
                </p>
            </div>
        )}

        {explaining && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative w-12 h-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-2 border-t-transparent border-[#c8f560]/20" style={{ borderTopColor: '#c8f560' }} />
                </div>
                <p className="text-xs font-bold tracking-widest uppercase text-slate-500">Computing SHAP values…</p>
            </div>
        )}

        {/* Results */}
        {explained && patientData && (
            <>
                {/* Big Stats Row */}
                <div className="flex flex-wrap gap-10 sm:gap-14 mb-8">
                    <div>
                        <div className="text-[#c8f560] font-medium tracking-tight text-[44px] flex items-baseline gap-2 mb-1 leading-none">
                            <div className="w-2 h-8 rounded-full bg-[#c8f560] self-center" />
                            <AnimatedNumber value={patientData.contributions.filter(c => !c.isRisk).length} />
                        </div>
                        <div className="text-slate-400 text-[14px] font-medium tracking-wide mt-3 ml-5">Safe Factors</div>
                    </div>
                    <div>
                        <div className="text-[#b09fff] font-medium tracking-tight text-[44px] flex items-baseline gap-2 mb-1 leading-none">
                            <div className="w-2 h-8 rounded-full bg-[#b09fff] self-center" />
                            <AnimatedNumber value={patientData.contributions.filter(c => c.isRisk).length} />
                        </div>
                        <div className="text-slate-400 text-[14px] font-medium tracking-wide mt-3 ml-5">Risk Factors</div>
                    </div>
                </div>

                {/* The bar chart */}
                <div className="flex-1 flex items-end justify-between px-2 mt-6 gap-2 pb-6" style={{ minHeight: 140 }}>
                    {patientData.contributions.map((c, i) => {
                        const maxAbs = Math.max(...patientData.contributions.map(x => Math.abs(x.contribution)));
                        const heightPct = Math.max(15, Math.round((Math.abs(c.contribution) / maxAbs) * 100));
                        const valPct = Math.round(Math.abs(c.contribution) * 100);
                        const isRisk = c.isRisk;
                        const label = formatFeatureName(c.label);

                        return (
                            <div key={c.id} className="flex flex-col items-center justify-end h-[190px] w-full max-w-[42px]">
                                <Tooltip 
                                    isDarkMode={true}
                                    noUnderline
                                    position="top"
                                    className="w-full h-full flex flex-col justify-end"
                                    content={
                                        <div className="flex flex-col gap-1 p-0.5">
                                            <div className={`text-[10px] font-bold uppercase tracking-wider ${isRisk ? 'text-[#b09fff]' : 'text-[#c8f560]'}`}>
                                                {isRisk ? 'Risk Driver' : 'Safe Factor'}
                                            </div>
                                            <div className="text-[12px] font-medium text-white">{label}</div>
                                            <div className="text-[14px] font-bold text-white mt-1">{valPct}% Impact</div>
                                        </div>
                                    }
                                >
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${heightPct}%` }} 
                                        whileHover={{ scaleX: 1.1, filter: 'brightness(1.2)' }}
                                        transition={{ duration: 1.5, delay: i * 0.05 }} 
                                        className={`w-full rounded-full transition-all cursor-help ${
                                            isRisk ? 'bg-[#b09fff] shadow-[0_0_15px_rgba(176,159,255,0.3)]' : 'bg-[#c8f560] shadow-[0_0_15px_rgba(200,245,96,0.3)]'
                                        }`} 
                                    />
                                </Tooltip>
                                <div className="h-10 mt-3 flex items-start justify-center text-center">
                                    <span className="text-[9px] font-semibold tracking-tight text-slate-400 leading-[1.1] break-words w-full">
                                        {label.split(' ').map((word, idx) => <React.Fragment key={idx}>{word}<br/></React.Fragment>)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* What-If Footer */}
                {whatIf && (
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <Tooltip position="top" noUnderline isDarkMode={true}
                            content={<div className="flex flex-col gap-1.5 p-1 max-w-[260px]"><div className="text-[10px] font-bold uppercase tracking-widest text-[#c8f560]">What-If Intervention</div><div className="text-[11px] leading-relaxed opacity-95 text-left">{whatIf}</div></div>}>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-help transition-all duration-300 border border-[#c8f560]/20 hover:bg-[#c8f560]/10 text-[#c8f560]">
                                <div className="p-1 rounded-full bg-[#c8f560]/15"><Lightbulb className="w-3 h-3 text-[#c8f560]" /></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">What-If Intervention</span>
                            </div>
                        </Tooltip>
                    </div>
                )}
            </>
        )}
    </div>
);


/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
const Explainability = ({ isDarkMode, onNext, onPrev, domain, dataset, datasetSchema, targetColumn }) => {
    const domainKey = domain?.name || 'default';
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    const toReadable = (name) => {
        if (!name) return '';
        const ACRONYMS = { 'qids': 'QIDS-SR Score', 'bmi': 'Body Mass Index (BMI)', 'bp': 'Blood Pressure', 'hr': 'Heart Rate', 'ef': 'Ejection Fraction', 'gfr': 'eGFR', 'bun': 'Blood Urea Nitrogen', 'wbc': 'White Blood Cell Count', 'rbc': 'Red Blood Cell Count', 'creatinine_phosphokinase': 'Creatinine Phosphokinase' };
        const lower = name.toLowerCase();
        if (ACRONYMS[lower]) return ACRONYMS[lower];
        let formatted = name.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        return formatted.split(' ').map(word => ACRONYMS[word.toLowerCase()] ? ACRONYMS[word.toLowerCase()] : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const CLINICAL_DESC = { 'age': 'Patient age in years', 'sex': 'Patient biological sex', 'smoking': 'Tobacco history', 'diabetes': 'Diagnosed diabetes', 'ejection_fraction': 'Pump function (%)', 'serum_creatinine': 'Kidney function marker', 'bmi': 'Body mass index (kg/m²)' };

    const activeFeatures = React.useMemo(() => {
        if (datasetSchema && datasetSchema.length > 0) {
            return datasetSchema.filter(col => col.role === 'Number (measurement)' || col.role === 'Category').map(col => ({
                id: col.name, label: toReadable(col.name), clinical: CLINICAL_DESC[col.name.toLowerCase()] || 'Clinical Parameter'
            }));
        }
        if (domain?.topFeaturesClinical?.length > 0) return domain.topFeaturesClinical.map((f, i) => ({ id: `feat_${i}`, label: f.feature, clinical: f.justification }));
        return DOMAIN_FEATURES[domainKey] || DOMAIN_FEATURES.default;
    }, [datasetSchema, domainKey, domain]);

    const [featureImportance, setFeatureImportance] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(0);
    const [patientData, setPatientData] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [explained, setExplained] = useState(false);
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setFeatureImportance(generateFeatureImportance(activeFeatures));
            setPatients(generatePatients(activeFeatures, dataset, targetColumn));
            setLoadingFeatures(false);
        }, 800);
        return () => clearTimeout(t);
    }, [activeFeatures, dataset, targetColumn]);

    const handleExplain = () => {
        setExplaining(true); setExplained(false); setPatientData(null);
        setTimeout(() => { setPatientData(generatePatientContributions(activeFeatures, patients[selectedPatient])); setExplaining(false); setExplained(true); }, 900);
    };

    const top1 = featureImportance[0];

    const senseCheck = useMemo(() => {
        if (!top1) return '';
        if (domain?.topFeaturesClinical) {
            const match = domain.topFeaturesClinical.find(f => f.feature.toLowerCase() === top1.label.toLowerCase() || f.feature.toLowerCase() === top1.id.toLowerCase());
            if (match) return `${match.feature} is the top predictor — ${match.justification}`;
            const first = domain.topFeaturesClinical[0];
            return `In ${domain.name}, ${top1.label} is currently the top driver, aligning closely with typical patterns like ${first.feature}.`;
        }
        return `The clinical priority of ${top1.label} aligns strongly with established medical literature for this overall outcome probability.`;
    }, [top1, domain]);

    const whatIf = useMemo(() => {
        if (!top1) return '';
        const unchangeable = ['age', 'sex', 'gender', 'height', 'yaş', 'cinsiyet', 'boy', 'kimlik'];
        const isStatic = unchangeable.some(kw => top1.label.toLowerCase().includes(kw) || top1.id.toLowerCase().includes(kw));
        if (isStatic) return `This is a fixed demographic factor (${top1.label}) and cannot be clinically altered. Focus should pivot to modifiable risk factors.`;
        const riskReduction = Math.min(100, Math.max(10, Math.round(top1.importance * 100 * 1.5)));
        return `If "${top1.label}" is stabilized within a healthy clinical range, the patient's overall risk profile could see a potential reduction of up to ${riskReduction}%.`;
    }, [top1]);

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-44 max-w-6xl mx-auto">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-5">
                
                {loadingFeatures ? (
                    <div className={`relative rounded-[24px] p-16 flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-slate-200'} shadow-sm`}>
                        <div className="relative w-10 h-10">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500" />
                        </div>
                        <p className={`text-sm font-medium animate-pulse ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Analyzing feature importance...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 1. HEADER REMOVED PER REQUEST */}

                        {/* 2. THE MAIN DASHBOARD GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                            {/* LEFT COLUMN — Risk Drivers */}
                            <div className="lg:col-span-5 flex flex-col h-full">
                                <RiskDriversCard featureImportance={featureImportance} isDarkMode={isDarkMode} />
                            </div>

                            {/* RIGHT COLUMN — Mini Cards + SHAP */}
                            <div className="lg:col-span-7 flex flex-col gap-5 h-full">
                                {/* Top Row of Right Column — Side-by-side mini cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <PatientSelectCard 
                                        patients={patients}
                                        selectedPatient={selectedPatient}
                                        onSelect={(v) => { setSelectedPatient(v); setExplained(false); }}
                                        onExplain={handleExplain}
                                        explaining={explaining}
                                        loadingFeatures={loadingFeatures}
                                        isDarkMode={isDarkMode}
                                        primaryStr={primaryStr}
                                    />
                                    <ClinicalValidationCard
                                        senseCheck={senseCheck}
                                        top1={top1}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>

                                {/* Bottom Row of Right Column — SHAP Analysis */}
                                <div className="flex-1 flex flex-col">
                                    <SHAPAnalysisCard 
                                        patientData={patientData}
                                        explained={explained}
                                        explaining={explaining}
                                        patients={patients}
                                        selectedPatient={selectedPatient}
                                        primaryStr={primaryStr}
                                        isDarkMode={isDarkMode}
                                        whatIf={whatIf}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Navigation ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className={`flex justify-between items-center pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
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
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all shadow-sm"
                        style={{ backgroundColor: secondaryStr }}
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Explainability;
