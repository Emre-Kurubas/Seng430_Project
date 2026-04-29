import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Error Boundary for Model Visualizations ──────────────────────────────────
class VizErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error('Visualization error:', error, info); }
    render() {
        if (this.state.hasError) {
            return (
                <div className={`p-10 rounded-[24px] border text-center relative overflow-hidden ${this.props.isDarkMode ? 'bg-white/[0.02] border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="text-5xl mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] relative z-10">⚠️</div>
                    <h3 className={`font-bold text-lg mb-2 relative z-10 ${this.props.isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Visualization Error</h3>
                    <p className={`text-[13px] font-medium mb-5 relative z-10 ${this.props.isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try adjusting the parameters or selecting a different model algorithm.</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors">
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, Plus, Activity, GitBranch, Binary, Network, TrendingUp, Info, CheckCircle2, ArrowRight, HelpCircle, AlertTriangle, Sparkles, Cpu, Zap, ChevronRight, Trophy, Target, BarChart3, Star } from 'lucide-react';
import ModelVisualizer from './ModelVisualizations';
import Tooltip from './Tooltip';
import { runMLTraining } from '../utils/mlEngine';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import StepTour from './StepTour';

const VIZ_CONTENT = {
    knn: { title: 'KNN Visualisation — How it Thinks', desc: 'KNN classifies a new patient by comparing them to the "K" most similar historical cases.', legends: [{ type: 'circle', color: 'bg-rose-500', label: 'Readmitted' }, { type: 'circle', color: 'bg-emerald-400', label: 'Not Readmitted' }, { type: 'ring', label: 'Target Patient' }, { type: 'circle', color: 'bg-indigo-500', label: 'Neighbour Match' }], clinical: 'Identifies patients with similar clinical profiles.' },
    svm: { title: 'SVM — Decision Boundary & Support Vectors', desc: 'SVM draws a boundary to keep groups as far apart as possible.', legends: [{ type: 'circle', color: 'bg-red-600', label: 'Positive' }, { type: 'circle', color: 'bg-green-600', label: 'Negative' }, { type: 'circle-border', label: 'Support Vector' }, { type: 'line', style: 'solid', label: 'Boundary' }, { type: 'line', style: 'dashed', label: 'Margin' }], clinical: 'The boundary is the "line of uncertainty."' },
    dt: { title: 'Decision Tree — Clinical Flowchart', desc: 'Asks yes/no questions about patient measurements.', legends: [], clinical: 'Looks like a clinical guideline flowchart.' },
    rf: { title: 'Random Forest — Ensemble Voting', desc: 'Trains many Decision Trees on random subsets and votes.', legends: [{ type: 'dot', color: 'bg-rose-500', label: 'Vote: Positive' }, { type: 'dot', color: 'bg-emerald-400', label: 'Vote: Negative' }, { type: 'glow', label: 'Aggregator' }], clinical: 'Stability through consensus.' },
    lr: { title: 'Logistic Regression — Probability Curve', desc: 'Maps measurements to risk probability using an S-shaped curve.', legends: [{ type: 'circle', color: 'bg-rose-500', label: 'Known Positive' }, { type: 'circle', color: 'bg-emerald-400', label: 'Known Negative' }, { type: 'line', color: 'bg-indigo-400', label: 'Sigmoid' }, { type: 'line', style: 'dashed', color: 'bg-amber-400', label: 'Threshold' }], clinical: 'Steep curves mean small changes cause large risk jumps.' },
    nb: { title: 'Naive Bayes — Distributions', desc: 'Computes probability distributions for health conditions.', legends: [{ type: 'area', color: 'bg-emerald-500', label: 'Negative' }, { type: 'area', color: 'bg-rose-500', label: 'Positive' }, { type: 'dot', color: 'bg-amber-400', label: 'Overlap' }], clinical: 'Based on pure statistical mapping of the dataset.' }
};

const MODELS = [
    { id: 'knn', name: 'K-Nearest Neighbors', shortName: 'KNN', icon: Network, desc: 'Compares to K most similar historical patients.', color: '#6366f1' },
    { id: 'svm', name: 'Support Vector Machine', shortName: 'SVM', icon: Activity, desc: 'Finds the clearest dividing line between groups.', color: '#8b5cf6' },
    { id: 'dt', name: 'Decision Tree', shortName: 'D-Tree', icon: GitBranch, desc: 'Asks yes/no questions to reach a prediction.', color: '#10b981' },
    { id: 'rf', name: 'Random Forest', shortName: 'Forest', icon: Binary, desc: 'Trains many decision trees and takes a vote.', color: '#06b6d4' },
    { id: 'lr', name: 'Logistic Regression', shortName: 'Log-Reg', icon: TrendingUp, desc: 'Calculates probability from weighted measurements.', color: '#f59e0b' },
    { id: 'nb', name: 'Naive Bayes', shortName: 'Bayes', icon: Info, desc: 'Uses probability theory to estimate likelihood.', color: '#ec4899' },
];

/* ═══════════════════════════════════════════════════════════════
   Clean Model Selector Pill
   ═══════════════════════════════════════════════════════════════ */
const ModelPill = ({ model, isSelected, isDarkMode, onClick }) => {
    const Icon = model.icon;
    return (
        <motion.button onClick={onClick}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={`group relative flex items-center gap-3 px-4 py-3 text-left transition-all duration-300 rounded-[20px] overflow-hidden border
                ${isSelected ? 'text-white shadow-lg' : isDarkMode ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'}`}
            style={isSelected ? { backgroundColor: model.color, borderColor: model.color } : {}}
        >
            {isSelected && <div className="absolute inset-0 bg-white/10 blur-md pointer-events-none" />}
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 z-10"
                style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : `${model.color}15`, color: isSelected ? 'white' : model.color }}>
                <Icon size={18} />
            </div>
            <div className="min-w-0 z-10">
                <div className={`text-[13px] font-bold leading-tight truncate ${isSelected ? 'text-white' : isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{model.name}</div>
                <div className={`text-[11px] font-medium mt-0.5 truncate ${isSelected ? 'text-white/80' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{model.shortName}</div>
            </div>
        </motion.button>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Compact Stat Metric (same pattern as Steps 2 & 5)
   ═══════════════════════════════════════════════════════════════ */
const MetricCard = ({ label, value, icon: Icon, isDarkMode, color, delay = 0 }) => {
    const numVal = parseFloat(value);
    const pct = Math.round(numVal * 100);
    const isGood = numVal >= 0.7;
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
            className={`relative overflow-hidden group p-5 rounded-[24px] flex flex-col justify-between ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3 relative z-10">
                <span className={'text-[11px] font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
                {Icon && <div className="p-1.5 rounded-[10px] transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15`, color }}><Icon className="w-4 h-4" /></div>}
            </div>
            <div className={`text-3xl font-black tracking-tight tabular-nums relative z-10 ${isGood ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-amber-400' : 'text-amber-500')}`}>{pct}%</div>
            <div className={'mt-4 h-1.5 rounded-full overflow-hidden relative z-10 ' + (isDarkMode ? 'bg-slate-800/80 shadow-inner' : 'bg-slate-100')}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full" style={{ backgroundColor: color, boxShadow: isGood && isDarkMode ? `inset 0 1px 0px rgba(255,255,255,0.2), 0 0 12px ${color}60` : '' }} />
            </div>
            {/* Subtle radial glow */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500" style={{ backgroundColor: color }} />
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Parameter Slider — clean version
   ═══════════════════════════════════════════════════════════════ */
const ParamSlider = ({ label, tooltip, value, onChange, min, max, step, lowLabel, highLabel, isDarkMode, primaryStr, displayValue }) => (
    <div className="space-y-2.5">
        <div className="flex justify-between items-center">
            <Tooltip isDarkMode={isDarkMode} content={tooltip}>
                <label className={`text-[13px] font-semibold flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {label} <HelpCircle className="w-3.5 h-3.5 opacity-40" />
                </label>
            </Tooltip>
            <span className={`text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-white/[0.04]' : 'bg-slate-100'}`} style={{ color: primaryStr }}>{displayValue ?? value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
            className={'w-full h-2 rounded-full appearance-none cursor-pointer shadow-inner'}
            style={{ background: `linear-gradient(to right, ${primaryStr} ${((value - min) / (max - min)) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${((value - min) / (max - min)) * 100}%)`, accentColor: primaryStr }}
        />
        <div className={`flex justify-between text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   Main ModelSelection Component
   ═══════════════════════════════════════════════════════════════ */
const ModelSelection = ({ isDarkMode, onNext, onPrev, dataset, datasetSchema, targetColumn, setTrainedModelResult, domain, comparisonList, setComparisonList }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    const [selectedModel, setSelectedModel] = useState('knn');
    const [autoRetrain, setAutoRetrain] = useState(true);
    const [isTraining, setIsTraining] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [lastResult, setLastResult] = useState(null);
    const [trainError, setTrainError] = useState(null);

    const trainingIdRef = useRef(0);
    const lastTriggeredRef = useRef('');

    const [params, setParams] = useState({
        knn: { k: 5, metric: 'Euclidean' },
        svm: { c: 1.0, kernel: 'RBF' },
        dt: { maxDepth: 3 },
        rf: { trees: 100, maxDepth: 3 },
        lr: { iterations: 1000 },
        nb: { smoothing: 1e-9 }
    });

    const getSettingsString = () => {
        const p = params[selectedModel];
        if (selectedModel === 'knn') return `K=${p.k}, ${p.metric}`;
        if (selectedModel === 'svm') return `C=${p.c}, ${p.kernel}`;
        if (selectedModel === 'dt') return `Depth=${p.maxDepth}`;
        if (selectedModel === 'rf') return `Trees=${p.trees}, Depth=${p.maxDepth}`;
        if (selectedModel === 'lr') return `Iter=${p.iterations}`;
        if (selectedModel === 'nb') return `Smooth=${p.smoothing}`;
        return '';
    };

    const trainModel = useCallback(async (isAuto = false) => {
        const currentTrainId = ++trainingIdRef.current;
        setTrainError(null);
        if (!dataset || dataset.length === 0 || !datasetSchema || datasetSchema.length === 0) {
            const emptyResult = { id: Date.now(), modelName: MODELS.find(m => m.id === selectedModel).name, settings: getSettingsString(), accuracy: 0, sensitivity: 0, specificity: 0, auc: 0, precision: 0, f1Score: 0 };
            setLastResult(emptyResult);
            if (setTrainedModelResult) setTrainedModelResult({ modelId: selectedModel, ...emptyResult });
            if (isInitialLoading) setIsInitialLoading(false);
            return;
        }
        setIsTraining(true);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        try {
            const metrics = await runMLTraining(selectedModel, params[selectedModel], dataset, datasetSchema, targetColumn, 42);
            if (currentTrainId !== trainingIdRef.current) return;
            const settingsStr = getSettingsString();
            const modelName = MODELS.find(m => m.id === selectedModel).name;
            const result = { id: Date.now(), modelName, settings: settingsStr, ...metrics };
            setLastResult(result);
            if (setTrainedModelResult) setTrainedModelResult({ modelId: selectedModel, modelName, settings: settingsStr, ...metrics });
        } catch (err) {
            if (currentTrainId !== trainingIdRef.current) return;
            console.error('ML Pipeline Error:', err);
            setTrainError(err.message || 'An unexpected error occurred during training.');
            const settingsStr = getSettingsString(); const modelName = MODELS.find(m => m.id === selectedModel).name;
            const fallbackResult = { id: Date.now(), modelName, settings: settingsStr, accuracy: 0, sensitivity: 0, specificity: 0, precision: 0, f1Score: 0, auc: 0 };
            setLastResult(fallbackResult);
            if (setTrainedModelResult) setTrainedModelResult({ modelId: selectedModel, ...fallbackResult });
        } finally {
            if (currentTrainId === trainingIdRef.current) { setIsTraining(false); if (isInitialLoading) setIsInitialLoading(false); }
        }
    }, [selectedModel, params, dataset, datasetSchema, targetColumn, setTrainedModelResult]);

    const currentModelParams = params[selectedModel];
    useEffect(() => {
        if (!autoRetrain && !isInitialLoading) return;
        const currentParamKey = `${selectedModel}-${JSON.stringify(currentModelParams)}`;
        if (currentParamKey === lastTriggeredRef.current && !isInitialLoading) return;
        lastTriggeredRef.current = currentParamKey;
        const delay = isInitialLoading ? 500 : (selectedModel === 'rf' ? 1200 : 700);
        const timer = setTimeout(() => { trainModel(true); }, delay);
        return () => clearTimeout(timer);
    }, [selectedModel, currentModelParams, autoRetrain]);

    const addToComparison = () => {
        if (lastResult) {
            setComparisonList(prev => {
                const isDuplicate = prev.some(r => r.modelName === lastResult.modelName && r.settings === lastResult.settings);
                if (!isDuplicate) return [...prev, lastResult];
                return prev;
            });
        }
    };

    const currentModelData = MODELS.find(m => m.id === selectedModel);
    const isAlreadyCompared = comparisonList.some(r => r.modelName === lastResult?.modelName && r.settings === lastResult?.settings);

    /* ═══════════════ INITIAL LOADING STATE ═══════════════ */
    if (isInitialLoading) {
        return (
            <div className={`relative w-full flex flex-col items-center justify-center min-h-[60vh] rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-8">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="w-16 h-16 rounded-full border-[3px] border-t-transparent" style={{ borderColor: `${primaryStr}20`, borderTopColor: primaryStr }} />
                        <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6" style={{ color: primaryStr }} />
                    </div>
                    <h2 className={'text-2xl font-bold mb-2 ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>Initializing Models</h2>
                    <p className={'text-sm ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Processing your data and training initial algorithms…</p>
                </div>
            </div>
        );
    }

    /* ═══════════════ MAIN RENDER ═══════════════ */
    return (
        <>
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-44">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />
            <div className="relative z-10 space-y-5">

                {/* ── Header Actions ── */}
                <motion.div variants={itemAnim} className="flex justify-end gap-3">
                    <div className="hidden md:flex items-center gap-2">
                        <span className={'text-xs font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Auto-retrain</span>
                        <button onClick={() => setAutoRetrain(!autoRetrain)}
                            className={'w-10 h-5 rounded-full transition-all duration-300 relative ' + (autoRetrain ? '' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200'))}
                            style={autoRetrain ? { backgroundColor: secondaryStr } : {}}>
                            <motion.div animate={{ x: autoRetrain ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </button>
                    </div>
                    <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-300"
                        style={{ backgroundColor: secondaryStr }}>
                        Next Step <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>

                {/* ── Algorithm Picker ── */}
                <motion.div variants={itemAnim} id="s4-algorithms" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {MODELS.map(m => <ModelPill key={m.id} model={m} isSelected={selectedModel === m.id} isDarkMode={isDarkMode} onClick={() => setSelectedModel(m.id)} />)}
                </motion.div>

                {/* ── Two-Column Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* Left Column: Parameters + Metrics */}
                    <motion.div variants={itemAnim} id="s4-params" className="lg:col-span-4 space-y-4">

                        {/* Parameter Card */}
                        <motion.div key={selectedModel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                            className={`relative rounded-[24px] overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${currentModelData.color}15`, boxShadow: isDarkMode ? `0 0 20px ${currentModelData.color}10` : '' }}>
                                        {React.createElement(currentModelData.icon, { className: 'w-6 h-6', style: { color: currentModelData.color } })}
                                    </div>
                                    <div>
                                        <div className={`text-[15px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{currentModelData.name}</div>
                                        <div className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{currentModelData.desc}</div>
                                    </div>
                                </div>
                                <div className={'pt-5 border-t space-y-6 ' + (isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}>
                                    {selectedModel === 'knn' && (<>
                                        <ParamSlider label="K — Neighbors" tooltip="Number of previous patients to look at." value={params.knn.k} min={1} max={25} step={1}
                                            onChange={(e) => setParams({ ...params, knn: { ...params.knn, k: Number(e.target.value) } })} lowLabel="1 (Sensitive)" highLabel="25 (General)" isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                        <div className="space-y-2.5">
                                            <Tooltip isDarkMode={isDarkMode} content="How 'similarity' is calculated."><label className={`text-[13px] font-semibold flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Distance Measure <HelpCircle className="w-3.5 h-3.5 opacity-40" /></label></Tooltip>
                                            <select className={`w-full p-3 rounded-[14px] border text-[13px] font-medium outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 ${isDarkMode ? 'bg-white/[0.02] border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`} style={{ focusRingColor: primaryStr }}
                                                value={params.knn.metric} onChange={(e) => setParams({ ...params, knn: { ...params.knn, metric: e.target.value } })}>
                                                <option className={isDarkMode ? 'bg-slate-900' : ''}>Euclidean (straight-line)</option><option className={isDarkMode ? 'bg-slate-900' : ''}>Manhattan (city-block)</option>
                                            </select>
                                        </div>
                                    </>)}
                                    {selectedModel === 'svm' && (<>
                                        <ParamSlider label="C — Strictness" tooltip="Higher C = stricter boundary." value={params.svm.c} min={0.1} max={10.0} step={0.1}
                                            onChange={(e) => setParams({ ...params, svm: { ...params.svm, c: Number(e.target.value) } })} lowLabel="0.1 (Loose)" highLabel="10.0 (Strict)" isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                        <div className="space-y-2.5">
                                            <Tooltip isDarkMode={isDarkMode} content="Shape of the dividing line."><label className={`text-[13px] font-semibold flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kernel Type <HelpCircle className="w-3.5 h-3.5 opacity-40" /></label></Tooltip>
                                            <select className={`w-full p-3 rounded-[14px] border text-[13px] font-medium outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 ${isDarkMode ? 'bg-white/[0.02] border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`} style={{ focusRingColor: primaryStr }}
                                                value={params.svm.kernel} onChange={(e) => setParams({ ...params, svm: { ...params.svm, kernel: e.target.value } })}>
                                                <option value="RBF" className={isDarkMode ? 'bg-slate-900' : ''}>RBF - Radial (curved)</option><option value="Linear" className={isDarkMode ? 'bg-slate-900' : ''}>Linear (straight)</option>
                                            </select>
                                        </div>
                                    </>)}
                                    {selectedModel === 'dt' && (
                                        <ParamSlider label="Maximum Depth" tooltip="Number of questions in the flowchart." value={params.dt.maxDepth} min={1} max={10} step={1}
                                            onChange={(e) => setParams({ ...params, dt: { ...params.dt, maxDepth: Number(e.target.value) } })} lowLabel="1 (Simple)" highLabel="10 (Complex)" isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                    )}
                                    {selectedModel === 'rf' && (<>
                                        <ParamSlider label="Number of Trees" tooltip="More trees = more stable consensus." value={params.rf.trees} min={10} max={200} step={10}
                                            onChange={(e) => setParams({ ...params, rf: { ...params.rf, trees: Number(e.target.value) } })} lowLabel="10 (Fast)" highLabel="200 (Stable)" isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                        <ParamSlider label="Max Depth Per Tree" tooltip="Limits search depth." value={params.rf.maxDepth} min={1} max={10} step={1}
                                            onChange={(e) => setParams({ ...params, rf: { ...params.rf, maxDepth: Number(e.target.value) } })} lowLabel="1 (Simple)" highLabel="10 (Complex)" isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                    </>)}
                                    {selectedModel === 'lr' && (
                                        <div className={`p-4 rounded-[14px] text-[13px] leading-relaxed font-medium ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border border-indigo-100 text-indigo-700'}`}>
                                            <div className="flex items-start gap-3"><Info className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" /><span>Logistic Regression autonomously calibrates from your dataset. No manual parameters required.</span></div>
                                        </div>
                                    )}
                                    {selectedModel === 'nb' && (
                                        <ParamSlider label="Clinical Distribution Score" tooltip="Prevents sparse anomalies from overly influencing." value={Math.log10(params.nb.smoothing)} min={-12} max={-5} step={1}
                                            onChange={(e) => setParams({ ...params, nb: { ...params.nb, smoothing: Math.pow(10, Number(e.target.value)) } })} lowLabel="Low (Strict)" highLabel="High (Flexible)"
                                            displayValue={`${(Math.abs(-13 - Math.log10(params.nb.smoothing)) * 10).toFixed(0)} Points`} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                                    )}
                                </div>

                                {/* Training Error */}
                                <AnimatePresence>
                                    {trainError && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className={'mt-5 p-4 rounded-[14px] border text-[13px] flex gap-3 items-start ' + (isDarkMode ? 'bg-red-900/15 border-red-800/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}>
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{trainError}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    {(!autoRetrain || trainError) && (
                                        <motion.button onClick={() => trainModel(false)} disabled={isTraining} whileHover={!isTraining ? { scale: 1.02, filter: 'brightness(1.1)' } : {}} whileTap={!isTraining ? { scale: 0.98 } : {}}
                                            className={'flex-1 flex gap-2 justify-center items-center py-3 rounded-[14px] font-bold text-[13px] transition-all duration-300 ' + (isTraining ? (isDarkMode ? 'bg-white/[0.03] text-slate-500 cursor-wait' : 'bg-slate-100 text-slate-400 cursor-wait') : 'text-white shadow-lg shadow-black/10')}
                                            style={!isTraining ? { backgroundColor: primaryStr, boxShadow: `0 4px 14px ${primaryStr}40` } : {}}>
                                            {isTraining ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Play className="w-4 h-4 fill-current" />}
                                            <span>{isTraining ? 'Training…' : trainError ? 'Retry' : 'Run Pipeline'}</span>
                                        </motion.button>
                                    )}
                                    <motion.button onClick={addToComparison} disabled={!lastResult || isTraining || isAlreadyCompared}
                                        whileHover={lastResult && !isTraining && !isAlreadyCompared ? { scale: 1.02, filter: 'brightness(1.1)' } : {}}
                                        whileTap={lastResult && !isTraining && !isAlreadyCompared ? { scale: 0.98 } : {}}
                                        className={'flex-1 flex gap-2 justify-center items-center py-3 rounded-[14px] font-bold text-[13px] transition-all duration-300 border ' + (
                                            (!lastResult || isTraining || isAlreadyCompared) ? (isDarkMode ? 'bg-white/[0.02] text-slate-600 cursor-not-allowed border-white/[0.06]' : 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-200') : '')}
                                        style={lastResult && !isTraining && !isAlreadyCompared ? { border: `1px solid ${primaryStr}40`, color: primaryStr, backgroundColor: `${primaryStr}10` } : {}}>
                                        <Plus className="w-4 h-4" /><span>Add to Compare</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Live Metrics Grid ── */}
                        <AnimatePresence mode="wait">
                            {lastResult && !isTraining && (
                                <motion.div key={`metrics-${lastResult.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
                                    className="grid grid-cols-2 gap-4">
                                    <MetricCard label="Accuracy" value={lastResult.accuracy} icon={Target} isDarkMode={isDarkMode} color={primaryStr} delay={0} />
                                    <MetricCard label="Sensitivity" value={lastResult.sensitivity} icon={Activity} isDarkMode={isDarkMode} color={secondaryStr} delay={0.06} />
                                    <MetricCard label="Specificity" value={lastResult.specificity} icon={BarChart3} isDarkMode={isDarkMode} color="#8b5cf6" delay={0.12} />
                                    <MetricCard label="AUC" value={lastResult.auc} icon={TrendingUp} isDarkMode={isDarkMode} color="#f59e0b" delay={0.18} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Training indicator */}
                        <AnimatePresence>
                            {isTraining && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className={'rounded-[24px] p-5 flex items-center gap-4 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-slate-50 border border-slate-200 shadow-sm')}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                        className="w-7 h-7 rounded-full border-[3px] border-t-transparent flex-shrink-0" style={{ borderColor: `${primaryStr}25`, borderTopColor: primaryStr }} />
                                    <div>
                                        <div className={'text-[13px] font-bold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>Training {currentModelData.shortName}…</div>
                                        <div className={'text-[11px] font-medium mt-0.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{getSettingsString()}</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Right Column: Visualization + Comparison */}
                    <motion.div variants={itemAnim} className="lg:col-span-8 space-y-5">

                        {/* Visualization Card */}
                        <div id="s4-visualization" className={'rounded-[24px] overflow-hidden relative transition-all duration-300 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-slate-200 shadow-sm')}>
                            <div className={'px-6 py-4 border-b flex items-center justify-between ' + (isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}>
                                <div className="flex items-center gap-2.5">
                                    <Sparkles className="w-4 h-4" style={{ color: currentModelData.color }} />
                                    <h3 className={'text-[11px] font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        {VIZ_CONTENT[selectedModel]?.title || 'Visualization'}
                                    </h3>
                                </div>
                                {isTraining && (
                                    <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                                        className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-white shadow-sm" style={{ backgroundColor: secondaryStr }}>
                                        Training…
                                    </motion.span>
                                )}
                            </div>
                            <div className="p-6">
                                <VizErrorBoundary isDarkMode={isDarkMode} key={`error-${selectedModel}`}>
                                    <AnimatePresence mode="wait">
                                        <motion.div key={selectedModel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                            <ModelVisualizer selectedModel={selectedModel} params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} domain={domain} dataset={dataset} />
                                        </motion.div>
                                    </AnimatePresence>
                                </VizErrorBoundary>
                                {trainError && (
                                    <div className={`mt-4 p-3 rounded-xl text-xs ${isDarkMode ? 'bg-amber-900/15 text-amber-300 border border-amber-800/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                        ⚠️ Training warning: {trainError}. Results may use fallback predictions.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div id="s4-comparison" className={'rounded-[24px] overflow-hidden relative transition-all duration-300 ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-slate-200 shadow-sm')}>
                            <div className={'px-6 py-4 border-b flex items-center justify-between ' + (isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}>
                                <div className="flex items-center gap-2.5">
                                    <Trophy className="w-4 h-4" style={{ color: primaryStr }} />
                                    <h3 className={'text-[11px] font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Model Comparison</h3>
                                </div>
                                {comparisonList.length === 0 && <span className={'text-[11px] font-medium italic ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>Train & click "+ Add to Compare"</span>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className={isDarkMode ? 'text-slate-400 bg-white/[0.03]' : 'text-slate-500 bg-slate-50'}>
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest border-b border-white/[0.05]">Model & Settings</th>
                                            <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-widest border-b border-white/[0.05]">Accuracy</th>
                                            <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-widest border-b border-white/[0.05]">Sensitivity</th>
                                            <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-widest border-b border-white/[0.05]">Specificity</th>
                                            <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-widest border-b border-white/[0.05]">AUC</th>
                                        </tr>
                                    </thead>
                                    <tbody className={'divide-y ' + (isDarkMode ? 'divide-white/[0.04] text-slate-300' : 'divide-slate-100 text-slate-700')}>
                                        {comparisonList.length > 0 ? comparisonList.map((res, idx) => {
                                            const bestAcc = Math.max(...comparisonList.map(r => parseFloat(r.accuracy)));
                                            const isBestAcc = parseFloat(res.accuracy) === bestAcc;
                                            return (
                                                <motion.tr key={res.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                                    className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                                                    <td className="px-6 py-4 font-semibold flex items-center gap-2">
                                                        {isBestAcc && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />}
                                                        {res.modelName} <span className={'text-[11px] font-medium ml-1 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>({res.settings})</span>
                                                    </td>
                                                    <td className={`px-5 py-4 text-[13px] font-black tabular-nums ${parseFloat(res.accuracy) >= 0.8 ? 'text-emerald-500' : parseFloat(res.accuracy) >= 0.7 ? 'text-amber-500' : 'text-rose-500'}`}>{res.accuracy}</td>
                                                    <td className={`px-5 py-4 text-[13px] font-bold tabular-nums ${parseFloat(res.sensitivity) >= 0.7 ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>{res.sensitivity}</td>
                                                    <td className="px-5 py-4 text-[13px] font-medium tabular-nums">{res.specificity}</td>
                                                    <td className="px-5 py-4 text-[13px] font-medium tabular-nums">{res.auc}</td>
                                                </motion.tr>
                                            );
                                        }) : (
                                            <tr><td colSpan="5" className={'px-6 py-10 text-center font-medium text-[13px]' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>No models compared yet.</td></tr>
                                        )}
                                        {lastResult && !comparisonList.find(r => r.id === lastResult.id) && (
                                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className={(isDarkMode ? 'bg-indigo-500/[0.04]' : 'bg-indigo-50/50') + ' border-l-[3px]'} style={{ borderLeftColor: primaryStr }}>
                                                <td className="px-6 py-4 font-semibold flex items-center gap-2">
                                                    {lastResult.modelName}
                                                    <span className={'text-[11px] font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>({lastResult.settings})</span>
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 text-white shadow-sm" style={{ backgroundColor: primaryStr }}><Activity className="w-2.5 h-2.5" /> Live</span>
                                                </td>
                                                <td className="px-5 py-4 text-[13px] font-black tabular-nums" style={{ color: primaryStr }}>{lastResult.accuracy}</td>
                                                <td className="px-5 py-4 text-[13px] font-medium tabular-nums">{lastResult.sensitivity}</td>
                                                <td className="px-5 py-4 text-[13px] font-medium tabular-nums">{lastResult.specificity}</td>
                                                <td className="px-5 py-4 text-[13px] font-medium tabular-nums">{lastResult.auc}</td>
                                            </motion.tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Visual Comparison Chart */}
                        <AnimatePresence>
                            {comparisonList.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                                    className={'rounded-[24px] overflow-hidden relative ' + (isDarkMode ? 'bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-slate-200 shadow-sm')}>
                                    <div className={'px-6 py-4 border-b flex items-center gap-2.5 ' + (isDarkMode ? 'border-white/[0.06]' : 'border-slate-100')}>
                                        <Activity className="w-4 h-4" style={{ color: primaryStr }} />
                                        <h3 className={'text-[11px] font-bold uppercase tracking-widest'} style={{ color: primaryStr }}>
                                            Visual Comparison — {comparisonList.length} Model{comparisonList.length > 1 ? 's' : ''}
                                        </h3>
                                    </div>
                                    <div className="p-6 space-y-7">
                                        {['accuracy', 'sensitivity', 'specificity', 'auc'].map(metric => {
                                            const labels = { accuracy: '🎯 Accuracy', sensitivity: '⭐ Sensitivity', specificity: '🛡 Specificity', auc: '📈 AUC-ROC' };
                                            const thresholds = { accuracy: 0.65, sensitivity: 0.70, specificity: 0.65, auc: 0.75 };
                                            const barColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
                                            const best = Math.max(...comparisonList.map(r => parseFloat(r[metric])));
                                            return (
                                                <div key={metric}>
                                                    <div className="flex justify-between mb-3">
                                                        <span className={'text-[13px] font-bold ' + (isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{labels[metric]}</span>
                                                        <span className={'text-[11px] font-semibold flex items-center gap-1 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}><span className="w-1.5 h-1.5 rounded-full bg-red-500/50" /> threshold: {(thresholds[metric] * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="space-y-3 relative py-2">
                                                        {comparisonList.map((res, i) => {
                                                            const val = parseFloat(res[metric]); const pct = Math.round(val * 100); const isBest = val === best; const passes = val >= thresholds[metric];
                                                            return (
                                                                <div key={res.id} className="flex items-center gap-4 relative z-10">
                                                                    <span className={`text-[11px] font-mono font-medium w-[80px] sm:w-[120px] shrink-0 truncate flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                        {res.modelName.split(' ').slice(-1)[0]}
                                                                        {isBest && <Star className="w-3 h-3 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />}
                                                                    </span>
                                                                    <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800/80 shadow-inner' : 'bg-slate-100'}`}>
                                                                        <motion.div className={'h-full rounded-full shadow-sm ' + (passes ? '' : 'opacity-50')} initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                                            transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                                                            style={{ backgroundColor: barColors[i % barColors.length], boxShadow: passes && isDarkMode ? `inset 0 1px 0px rgba(255,255,255,0.2), 0 0 10px ${barColors[i % barColors.length]}60` : '' }} />
                                                                    </div>
                                                                    <span className={`text-[13px] font-black w-10 text-right tabular-nums ${passes ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>{pct}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="absolute inset-0 flex items-center gap-4 pointer-events-none">
                                                            <div className="w-[80px] sm:w-[120px] shrink-0" />
                                                            <div className="flex-1 h-full relative">
                                                                <div className={'absolute top-0 bottom-0 w-[2px] ' + (isDarkMode ? 'bg-red-500/30 border-l border-red-500/50' : 'bg-red-500/30')} style={{ left: `${thresholds[metric] * 100}%` }}>
                                                                    <div className={`absolute -top-2 px-1.5 py-0.5 -translate-x-1/2 -translate-y-full text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1 ${isDarkMode ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-600'}`}>Limit</div>
                                                                </div>
                                                            </div>
                                                            <div className="w-10" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className={`text-[11px] font-medium pt-3 border-t ${isDarkMode ? 'text-slate-500 border-white/[0.06]' : 'text-slate-400 border-slate-100'}`}>
                                            <span className="text-amber-400">★</span> Best in category · Red values = below clinical threshold
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* ── Bottom Navigation ── */}
                <motion.div variants={itemAnim} className={`flex justify-between items-center pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <motion.button onClick={onPrev} whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                        className={'px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ' + (isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50')}>
                        ← Previous
                    </motion.button>
                    <motion.button onClick={onNext} whileHover={{ scale: 1.02, x: 3 }} whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-300"
                        style={{ backgroundColor: secondaryStr }}>
                        Continue <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>

            {/* Dr. Dandelion Step Tour */}
            <StepTour
                stepNumber={4}
                isDarkMode={isDarkMode}
                steps={[
                    {
                        targetId: 's4-algorithms',
                        position: 'below',
                        pose: 'wave',
                        title: 'Choose Your Algorithm',
                        body: 'These six pills represent different ML algorithms — each is a distinct approach to learning patterns in your data. KNN finds similar patients, SVM draws boundaries, Decision Tree asks yes/no questions, Random Forest votes among many trees, Logistic Regression calculates probability, and Naive Bayes uses statistical distributions.',
                        sub: 'Each algorithm is like a different diagnostic method. Try multiple ones and compare — that\'s how we find the best fit for your clinical scenario.',
                    },
                    {
                        targetId: 's4-params',
                        position: 'right',
                        pose: 'point',
                        title: 'Hyperparameters & Training',
                        body: 'This panel lets you tune each algorithm\'s settings — like adjusting K in KNN (how many neighbors to consult) or tree depth in Decision Trees. After configuring, click "Run Pipeline" to train the model, then "Add to Compare" to save its results for head-to-head comparison.',
                        sub: 'Think of hyperparameters as dosage adjustments — too low and the model underperforms, too high and it overfits. The metrics below show accuracy, sensitivity, specificity, and AUC.',
                    },
                    {
                        targetId: 's4-visualization',
                        position: 'left',
                        pose: 'wave',
                        title: 'Algorithm Visualization',
                        body: 'This card shows how the selected algorithm "thinks" about your data. Each model type has its own interactive visualization — KNN shows neighbor distances, SVM shows the decision boundary, Decision Tree shows a flowchart, and so on. These update in real-time as you change parameters.',
                        sub: 'Visualizations are crucial for explainability. In clinical AI, you must be able to explain WHY a model makes a certain prediction.',
                    },
                    {
                        targetId: 's4-comparison',
                        position: 'left',
                        pose: 'point',
                        title: 'Model Comparison Table',
                        body: 'This table collects all models you\'ve trained and compared. It shows Accuracy (overall correctness), Sensitivity (catching true positives), Specificity (avoiding false alarms), and AUC (overall discriminative ability). The star marks the best performer in each metric.',
                        sub: 'In medicine, sensitivity is often prioritized — missing a disease (false negative) is usually worse than a false alarm. Choose your champion model wisely!',
                    },
                ]}
            />
        </>
    );
};

export default ModelSelection;
