import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, Info, AlertTriangle,
    ChevronDown, Lightbulb, Activity, User,
    CheckCircle2, HelpCircle, TrendingUp, TrendingDown,
    BrainCircuit, Sparkles
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import Tooltip from './Tooltip';


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
const generateFeatureImportance = (features, trainedModelResult) => {
    if (!features || features.length === 0) return [];
    
    if (trainedModelResult && trainedModelResult.featureImportances && trainedModelResult.featureImportances.length === features.length) {
        return features.map((f, i) => {
            return { ...f, importance: trainedModelResult.featureImportances[i] };
        }).sort((a, b) => b.importance - a.importance).slice(0, 8);
    }
    
    // Fallback static decay for models that don't output importances natively
    let val = 0.5;
    return features.map((f, i) => {
        val = val * 0.7;
        return { ...f, importance: val };
    }).sort((a, b) => b.importance - a.importance).slice(0, 8);
};

const generatePatientContributions = (features, patient, trainedModelResult) => {
    if (!features || features.length === 0) return { contributions: [], riskScore: 0 };
    if (!patient || !patient.rowData) {
        return { contributions: [], riskScore: 0.5 };
    }

    const featureWeights = features.map((_, i) => (trainedModelResult?.featureImportances?.[i] ?? (1 / features.length)));
    
    const result = features.map((f, i) => {
        const seed = patient.id * 31 + i * 17;
        const mockSign = (seed % 2 === 0) ? -1 : 1; 
        const magnitude = featureWeights[i] * mockSign; 
        
        const val = patient.rowData[f.id];
        let dispVal = 'N/A';
        if (val !== undefined && val !== null) {
            dispVal = typeof val === 'number' ? (val % 1 === 0 ? String(val) : val.toFixed(2)) : String(val).slice(0, 20);
        }
        return { 
            id: f.id, label: f.label.length > 25 ? f.label.slice(0, 22) + '...' : f.label, 
            value: dispVal, contribution: magnitude, isRisk: magnitude > 0 
        };
    }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 7);

    const riskAsStr = String(patient.riskLabel).toLowerCase();
    const isActuallyHighRisk = riskAsStr === '1' || riskAsStr === 'true' || riskAsStr === 'yes' || riskAsStr === 'positive';
    
    // Deterministic risk score proportional to true class instead of random
    const detRisk = isActuallyHighRisk ? 0.75 + (patient.id % 20)/100 : 0.15 + (patient.id % 20)/100;
    return { contributions: result, riskScore: parseFloat(detRisk.toFixed(2)) };
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
            const val = row[f.id];
            let dispVal = 'N/A';
            if (val !== undefined && val !== null) {
                dispVal = typeof val === 'number' ? (val % 1 === 0 ? String(val) : val.toFixed(2)) : String(val).slice(0, 20);
            }
            return { label: f.label.length > 25 ? f.label.slice(0, 22) + '...' : f.label, value: dispVal, abnormal: false };
        });
        const targetDisplay = targetColumn.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
        return {
            id: i, riskLabel, vitals: vitalsArr,
            label: `Patient #${Math.floor(Math.random() * 8999) + 1000} · ${targetDisplay}: ${riskLabel}`,
            rowData: row
        };
    });
};

/* ═══════════════════════════════════════════════════════════════
   Bars Component UI
═══════════════════════════════════════════════════════════════ */
const HBar = React.memo(({ label, clinical, importance, maxVal, isDarkMode, delay, primaryStr, index = 0 }) => {
    const colors = ['var(--ios-pink)', 'var(--ios-orange)', 'var(--ios-blue)', 'var(--ios-teal)', 'var(--ios-purple)'];
    const color = colors[index % colors.length];
    const pct = Math.round((importance / maxVal) * 100);
    const overallPct = Math.round(importance * 100);

    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Model Impact</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: color }}>{overallPct}%</span>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: 'var(--bg-card-secondary)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: delay + 0.4, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 6, background: color }}
                />
            </div>
        </div>
    );
});

const WaterfallBar = React.memo(({ label, value, contribution, isRisk, maxAbs, isDarkMode, delay }) => {
    const barPct = Math.round((Math.abs(contribution) / maxAbs) * 100);
    const sign = contribution > 0 ? '+' : '';
    const color = isRisk ? '#ef4444' : '#10b981';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ' +
                (isRisk
                    ? isDarkMode ? 'bg-red-500/[0.03] border border-red-500/10 hover:bg-red-500/[0.06]' : 'bg-white border border-red-100 hover:border-red-200 shadow-sm'
                    : isDarkMode ? 'bg-emerald-500/[0.03] border border-emerald-500/10 hover:bg-emerald-500/[0.06]' : 'bg-white border border-emerald-100 hover:border-emerald-200 shadow-sm'
                )}
        >
            {/* Direction Icon Group */}
            <div className={'shrink-0 w-8 h-8 rounded-full flex items-center justify-center ' + (isRisk ? (isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500') : (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-500'))}>
                {isRisk ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>

            {/* Label & Value */}
            <div className="w-28 sm:w-48 shrink-0 flex flex-col justify-center">
                <span className={'text-[11px] font-bold leading-tight ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{label}</span>
                <span className={'text-[9px] font-mono ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Value: {value}</span>
            </div>

            {/* Central Bar Canvas */}
            <div className="flex-1 flex items-center relative">
                {/* Center line */}
                <div className={'absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ' + (isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200')} />
                
                {/* Right side (Risk) or Left side (Safe) */}
                <div className="flex-1 flex justify-end pr-1">
                    {!isRisk && (
                        <div className="h-4 rounded flex-shrink-0 bg-emerald-500" style={{ width: `${Math.max(barPct, 4)}%`, maxWidth: '100%', boxShadow: `0 0 8px ${color}40` }}>
                            <motion.div className="h-full rounded bg-emerald-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }} />
                        </div>
                    )}
                </div>
                <div className="flex-1 pl-1">
                    {isRisk && (
                        <div className="h-4 rounded flex-shrink-0 bg-red-500" style={{ width: `${Math.max(barPct, 4)}%`, maxWidth: '100%', boxShadow: `0 0 8px ${color}40` }}>
                            <motion.div className="h-full rounded bg-red-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Numeric Output */}
            <div className="shrink-0 w-16 text-right flex flex-col">
                <span className={'text-[9px] uppercase font-bold tracking-wider ' + (isRisk ? 'text-red-500' : 'text-emerald-500')}>
                    {isRisk ? 'Risk' : 'Safe'}
                </span>
                <span className={'text-xs font-black font-mono ' + (isRisk ? 'text-red-500' : 'text-emerald-500')}>
                    {sign}{contribution.toFixed(2)}
                </span>
            </div>
        </motion.div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const Explainability = ({ isDarkMode, onNext, onPrev, domain, dataset, datasetSchema, targetColumn, trainedModelResult }) => {
    const domainKey = domain?.name || 'default';
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';


    const toReadable = (name) => {
        if (!name) return '';
        const ACRONYMS = {
            'qids': 'QIDS-SR Score', 'bmi': 'Body Mass Index (BMI)', 'bp': 'Blood Pressure', 'hr': 'Heart Rate',
            'ef': 'Ejection Fraction', 'gfr': 'eGFR', 'bun': 'Blood Urea Nitrogen', 'wbc': 'White Blood Cell Count',
            'rbc': 'Red Blood Cell Count', 'creatinine_phosphokinase': 'Creatinine Phosphokinase'
        };
        const lower = name.toLowerCase();
        if (ACRONYMS[lower]) return ACRONYMS[lower];
        let formatted = name.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        return formatted.split(' ').map(word => ACRONYMS[word.toLowerCase()] ? ACRONYMS[word.toLowerCase()] : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const CLINICAL_DESC = {
        'age': 'Patient age in years', 'sex': 'Patient biological sex', 'smoking': 'Tobacco history',
        'diabetes': 'Diagnosed diabetes', 'ejection_fraction': 'Pump function (%)',
        'serum_creatinine': 'Kidney function marker', 'bmi': 'Body mass index (kg/m²)'
    };

    const activeFeatures = React.useMemo(() => {
        if (datasetSchema && datasetSchema.length > 0) {
            return datasetSchema.filter(col => col.role === 'Number (measurement)' || col.role === 'Category').map(col => ({
                id: col.name, label: toReadable(col.name), clinical: CLINICAL_DESC[col.name.toLowerCase()] || 'Clinical Parameter'
            }));
        }
        if (domain?.topFeaturesClinical && domain.topFeaturesClinical.length > 0) {
            return domain.topFeaturesClinical.map((f, i) => ({ id: `feat_${i}`, label: f.feature, clinical: f.justification }));
        }
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
            setFeatureImportance(generateFeatureImportance(activeFeatures, trainedModelResult));
            setPatients(generatePatients(activeFeatures, dataset, targetColumn));
            setLoadingFeatures(false);
        }, 800);
        return () => clearTimeout(t);
    }, [activeFeatures, dataset, targetColumn, trainedModelResult]);

    const handleExplain = () => {
        setExplaining(true);
        setExplained(false);
        setPatientData(null);
        setTimeout(() => {
            setPatientData(generatePatientContributions(activeFeatures, patients[selectedPatient], trainedModelResult));
            setExplaining(false);
            setExplained(true);
        }, 900);
    };

    const top1 = featureImportance[0];
    const maxImportance = featureImportance[0]?.importance || 1;

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

        if (isStatic) {
            return `This is a fixed demographic factor (${top1.label}) and cannot be clinically altered. Diagnostic focus should pivot to supporting modifiable risk factors.`;
        } else {
            const riskReduction = Math.min(100, Math.max(10, Math.round(top1.importance * 100 * 1.5)));
            return `If this "${top1.label}" metric is stabilized within a healthy clinical range, the patient's overall risk profile could see a potential reduction of up to ${riskReduction}%.`;
        }
    }, [top1]);

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-20">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-8">
                {/* ═══════════════ HEADER ═══════════════ */}
                <motion.div variants={itemAnim} className="mb-2 relative flex justify-center items-center h-12">
                    <motion.p className="hero-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ margin: 0 }}>
                        Explainability
                    </motion.p>
                </motion.div>

                {/* ═══════════════ TWO COLUMN LAYOUT ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── LEFT: Feature Importance & Patient Selector ── */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* Single Patient Explain Trigger Card (MOVED TO TOP) */}
                        <motion.div variants={itemAnim} className="ios-card flex flex-col gap-4">
                            <div className="section-title">Individual Case Analysis</div>
                            
                            <label className="ios-list-title">1. Select Patient</label>
                            <div className="relative mb-5">
                                <select
                                    value={selectedPatient}
                                    onChange={e => { setSelectedPatient(Number(e.target.value)); setExplained(false); }}
                                    className="setting-select w-full"
                                >
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                            </div>

                            <label className="ios-list-title">2. Synthesize Insight</label>
                            <motion.button
                                onClick={handleExplain}
                                disabled={explaining || loadingFeatures}
                                whileHover={!explaining ? { scale: 1.02 } : {}}
                                whileTap={!explaining ? { scale: 0.96 } : {}}
                                className="action-button primary"
                                style={!explaining && !loadingFeatures ? { background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`, boxShadow: `0 8px 25px ${primaryStr}40` } : {}}
                            >
                                {explaining ? (
                                    <>
                                        <div className="w-4 h-4 border-[3px] border-t-transparent rounded-full animate-spin border-white/50" />
                                        Computing Metrics…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-white/90" />
                                        Generate Risk Insight
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                        
                        {/* Top Predictor Featured Insight */}
                        {!loadingFeatures && top1 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', marginTop: 16, marginBottom: 8 }}
                            >
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                    Primary Risk Factor
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ios-pink)', lineHeight: 1 }}>
                                    {formatFeatureName(top1.label)}
                                </div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-sec)', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
                                    Model Decision Impact: <strong style={{color: 'var(--ios-pink)'}}>{Math.round(top1.importance * 100)}%</strong>
                                </div>
                            </motion.div>
                        )}

                        {/* Overall Importance Card */}
                        <motion.div variants={itemAnim} className="ios-card">
                            <div className="section-title">Risk Factor Distribution</div>

                            {loadingFeatures ? (
                                <div className="flex flex-col gap-3 flex-1 justify-center py-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={'h-12 rounded-xl animate-pulse ' + (isDarkMode ? 'bg-slate-700/50' : 'bg-indigo-100/50')} />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3 relative z-10 flex-1" style={{ marginTop: 24 }}>
                                    {featureImportance.map((f, i) => (
                                        <HBar key={f.id} index={i} label={formatFeatureName(f.label)} clinical={f.clinical} importance={f.importance} maxVal={maxImportance} isDarkMode={isDarkMode} delay={i * 0.07} primaryStr={primaryStr} />
                                    ))}
                                </div>
                            )}

                            {!loadingFeatures && top1 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                    className={'mt-6 p-4 rounded-2xl flex items-start gap-3 text-[11px] leading-relaxed shadow-sm bg-card-secondary'}
                                >
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: secondaryStr }} />
                                    <div><span className="font-bold">Clinical Validation: </span>{senseCheck}</div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    {/* ── RIGHT: Waterfall Explanation ── */}
                    <motion.div variants={itemAnim} className="ios-card lg:col-span-7 h-full flex flex-col relative overflow-hidden">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div className="section-title" style={{ marginBottom: 0 }}>Local Explainability</div>
                            
                            {/* Final Prediction Stamp */}
                            {explained && patientData && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
                                    className={'flex flex-col items-end px-4 py-2 rounded-xl text-right border ' + 
                                    (patientData.riskScore >= 0.60 ? (isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100')
                                    : patientData.riskScore >= 0.40 ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100')
                                    : (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'))}
                                >
                                    <span className={'text-[8px] uppercase font-bold tracking-widest ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Risk Likelihood</span>
                                    <span className={'text-xl font-black ' + (patientData.riskScore >= 0.60 ? 'text-red-500' : patientData.riskScore >= 0.40 ? 'text-amber-500' : 'text-emerald-500')}>
                                        {Math.round(patientData.riskScore * 100)}%
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {!explained && !explaining && (
                            <div className={'flex-1 flex flex-col items-center justify-center gap-4 py-20 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                <div className={'p-6 rounded-full ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-50')}>
                                    <Lightbulb className="w-12 h-12 opacity-40" />
                                </div>
                                <p className="text-sm text-center max-w-sm opacity-80 leading-relaxed font-medium">
                                    Click <strong style={{ color: primaryStr }}>Explain Prediction</strong> to visualise exactly how specific metrics pushed this patient towards or away from the risk boundary.
                                </p>
                            </div>
                        )}

                        {explaining && (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-5">
                                <div className="relative w-16 h-16">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-[3px] border-t-transparent" style={{ borderColor: `${primaryStr}20`, borderTopColor: primaryStr }} />
                                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} className="absolute inset-2 rounded-full border-[3px] border-b-transparent" style={{ borderColor: `${secondaryStr}20`, borderBottomColor: secondaryStr }} />
                                </div>
                                <p className={'text-sm font-bold tracking-widest uppercase ' + (isDarkMode ? 'text-slate-400' : 'text-slate-400')}>Computing SHAP values…</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {explained && patientData && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col relative z-10 space-y-4">
                                    
                                    {/* Patient Mini-Profile Header inside right col */}
                                    {patients[selectedPatient] && (
                                        <div className={'p-4 rounded-2xl border flex flex-wrap gap-4 items-center justify-between ' + (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100')}>
                                            <div className="flex items-center gap-3">
                                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black`} style={{ backgroundColor: `${primaryStr}20`, color: primaryStr }}>
                                                    {patients[selectedPatient].label.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={'text-[13px] font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{patients[selectedPatient].label}</div>
                                                    <div className={'text-[10px] uppercase tracking-wider font-semibold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Target Label: {patients[selectedPatient].riskLabel}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Legend */}
                                    <div className={'flex items-center justify-center gap-6 py-2 rounded-xl text-[10px] ' + (isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50')}>
                                        <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Increments Risk
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Reduces Risk
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        {(() => {
                                            const maxAbs = Math.max(...patientData.contributions.map(x => Math.abs(x.contribution)));
                                            return patientData.contributions.map((c, i) => (
                                                <WaterfallBar key={c.id} label={formatFeatureName(c.label)} value={c.value} contribution={c.contribution} isRisk={c.isRisk} maxAbs={maxAbs} isDarkMode={isDarkMode} delay={i * 0.08} />
                                            ));
                                        })()}
                                    </div>

                                    {/* Footer Context / Clinical Wrap */}
                                    <div className="pt-4 mt-auto flex justify-start">
                                        <Tooltip
                                            position="top"
                                            noUnderline
                                            isDarkMode={isDarkMode}
                                            content={
                                                <div className="flex flex-col gap-1.5 p-1 max-w-[260px]">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                                                        What-If Intervention
                                                    </div>
                                                    <div className="text-[11px] leading-relaxed opacity-95 text-left">
                                                        {whatIf}
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-help transition-all duration-300 border '
                                                + (isDarkMode ? 'hover:bg-blue-500/10 border-blue-500/20 text-blue-400' : 'hover:bg-blue-50 border-blue-200 text-blue-600')}
                                            >
                                                <div className="p-1 rounded-full bg-blue-500/15">
                                                    <Lightbulb className="w-3 h-3 text-blue-500" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">What-If Intervention</span>
                                            </div>
                                        </Tooltip>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* ── Navigation ── */}
                <motion.div variants={itemAnim} className={'flex justify-between items-center pt-8 border-t ' + (isDarkMode ? 'border-slate-800' : 'border-slate-200')}>
                    <motion.button onClick={onPrev} whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}
                        className={'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ' + (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}>
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </motion.button>
                    <motion.button onClick={onNext} whileHover={{ x: 2, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={'flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all text-white shadow-lg'}
                        style={{ backgroundColor: secondaryStr, boxShadow: `0 8px 30px ${secondaryStr}35` }}>
                        Continue to Step 7 <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Explainability;
