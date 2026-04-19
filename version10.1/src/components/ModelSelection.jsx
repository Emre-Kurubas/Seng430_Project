import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Error Boundary for Model Visualizations ──────────────────────────────────
class VizErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('Visualization error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className={`p-8 rounded-2xl border text-center ${this.props.isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className={`font-bold mb-2 ${this.props.isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Visualization Error</h3>
                    <p className={`text-sm mb-4 ${this.props.isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        The visualization encountered an error. Try adjusting the parameters or selecting a different model.
                    </p>
                    <div className="bg-red-900/20 text-red-400 p-2 text-xs text-left overflow-auto mb-4 rounded max-h-[150px]">
                        <strong>{this.state.error && this.state.error.message}</strong>
                        <pre className="mt-1">{this.state.error && this.state.error.stack}</pre>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors"
                    >
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


const VIZ_CONTENT = {
    knn: {
        title: 'KNN Visualisation — How it Thinks',
        desc: 'KNN classifies a new patient by comparing them to the "K" most similar historical cases. The closest neighbours cast a vote on the outcome.',
        legends: [
            { type: 'circle', color: 'bg-rose-500', label: 'Readmitted' },
            { type: 'circle', color: 'bg-emerald-400', label: 'Not Readmitted' },
            { type: 'ring', label: 'Target Patient' },
            { type: 'circle', color: 'bg-indigo-500', label: 'Neighbour Match' }
        ],
        clinical: 'Identifies patients with similar clinical profiles. If 4 out of 5 similar neighbours experienced a complication, this patient likely will too.'
    },
    svm: {
        title: 'SVM — Decision Boundary & Support Vectors',
        desc: 'Support Vector Machine (SVM) works like drawing a line (or boundary) to keep two different groups as far apart as possible. The "Support Vectors" are just the patients sitting closest to this line. They are the most important cases because they shape where the boundary is drawn.',
        legends: [
            { type: 'circle', color: 'bg-red-600', label: 'Positive Outcome' },
            { type: 'circle', color: 'bg-green-600', label: 'Negative Outcome' },
            { type: 'circle-border', label: 'Support Vector (Critical Patient)' },
            { type: 'line', style: 'solid', label: 'Decision Boundary' },
            { type: 'line', style: 'dashed', label: 'Margin (Safety Buffer)' }
        ],
        clinical: 'The boundary is the "line of uncertainty." Patients far away are clear-cut cases. But the patients sitting right on the dashed lines (Support Vectors) are the tricky edge-cases that help the AI learn the difference between safe and at-risk.'
    },
    dt: {
        title: 'Decision Tree — Clinical Decision Flowchart',
        desc: 'The tree asks yes/no questions about patient measurements. Follow the path from top to bottom to reach a final decision. Hover over nodes to see details.',
        legends: [],
        clinical: 'This looks like a clinical guideline flowchart. The first question split is the most important one - the model identified this as the strongest predictor.'
    },
    rf: {
        title: 'Random Forest — Ensemble Voting',
        desc: 'Instead of relying on a single rule, Random Forest trains many individual Decision Trees on random subsets of the data. Each tree votes on the patient\'s outcome.',
        legends: [
            { type: 'dot', color: 'bg-rose-500', label: 'Vote: Positive' },
            { type: 'dot', color: 'bg-emerald-400', label: 'Vote: Negative' },
            { type: 'glow', label: 'Ensemble Aggregator' }
        ],
        clinical: 'Stability through consensus. By having 100 trees vote, it balances out individual bias or errors, making the prediction much more robust against statistical noise.'
    },
    lr: {
        title: 'Logistic Regression — Probability Curve',
        desc: 'Logistic Regression maps clinical measurements to a continuous risk probability from 0% to 100% using an S-shaped (sigmoid) curve.',
        legends: [
            { type: 'circle', color: 'bg-rose-500', label: 'Known Positive' },
            { type: 'circle', color: 'bg-emerald-400', label: 'Known Negative' },
            { type: 'line', color: 'bg-indigo-400', label: 'Sigmoid Probability' },
            { type: 'line', style: 'dashed', color: 'bg-amber-400', label: 'Decision Threshold' }
        ],
        clinical: 'The curve shows risk probability. Steep curves mean small changes in patient health (e.g. slight BP increase) cause large, dramatic jumps in clinical risk.'
    },
    nb: {
        title: 'Naive Bayes — Distributions',
        desc: 'Naive Bayes computes independent probability distributions for health conditions. It estimates risk by looking at where a patient\'s data points overlap these distributions.',
        legends: [
            { type: 'area', color: 'bg-emerald-500', label: 'Negative Distribution' },
            { type: 'area', color: 'bg-rose-500', label: 'Positive Distribution' },
            { type: 'dot', color: 'bg-amber-400', label: 'Overlap (Ambiguity Area)' }
        ],
        clinical: 'Based on pure statistical mapping of the dataset. For instance: "Given these factors, what is the statistical likelihood of this outcome?".'
    }
};

// ─── Static models array (outside component to avoid re-creation) ─────────────
const MODELS = [
    { id: 'knn', name: 'K-Nearest Neighbors', shortName: 'KNN', icon: Network, desc: 'Compares a new patient to the K most similar historical patients.', color: '#6366f1' },
    { id: 'svm', name: 'Support Vector Machine', shortName: 'SVM', icon: Activity, desc: 'Finds the clearest dividing line between two groups of patients.', color: '#8b5cf6' },
    { id: 'dt', name: 'Decision Tree', shortName: 'D-Tree', icon: GitBranch, desc: 'Asks a series of yes/no questions to reach a prediction.', color: '#10b981' },
    { id: 'rf', name: 'Random Forest', shortName: 'Forest', icon: Binary, desc: 'Trains many decision trees and takes a majority vote.', color: '#06b6d4' },
    { id: 'lr', name: 'Logistic Regression', shortName: 'Log-Reg', icon: TrendingUp, desc: 'Calculates probability based on a weighted combination of measurements.', color: '#f59e0b' },
    { id: 'nb', name: 'Naive Bayes', shortName: 'Bayes', icon: Info, desc: 'Uses probability theory to estimate likelihood of outcomes.', color: '#ec4899' },
];

/* ═══════════════════════════════════════════════════════════════
   Model Selector Card — hexagonal-inspired algorithm picker
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   Model Selector Card — iOS Wallet Style
   ═══════════════════════════════════════════════════════════════ */
const ModelCard = ({ model, isSelected, isDarkMode, onClick }) => {
    const Icon = model.icon;
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' }}
            style={{
                flex: '1 1 0', minWidth: 0, borderRadius: 18,
                background: isSelected ? model.color : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)'),
                color: isSelected ? 'white' : (isDarkMode ? 'var(--text-main)' : 'var(--text-main)'),
                border: isSelected ? 'none' : (isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--border)'),
                boxShadow: isSelected ? `0 12px 28px ${model.color}55` : 'var(--shadow-sm)',
                padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.3s ease'
            }}
            className={!isSelected && !isDarkMode ? 'bg-white' : ''}
        >
            <div style={{ 
                width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected ? 'rgba(255,255,255,0.2)' : `${model.color}15`,
                color: isSelected ? 'white' : model.color,
            }}>
                <Icon size={18} />
            </div>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                    {model.shortName}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.15 }}>
                    {model.name}
                </div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Metric Pill — animated micro metric display
   ═══════════════════════════════════════════════════════════════ */
const MetricPill = ({ label, value, icon: Icon, isDarkMode, color, delay = 0 }) => {
    const numVal = parseFloat(value);
    const pct = Math.round(numVal * 100);
    const isGood = numVal >= 0.7;
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={'group relative rounded-2xl p-4 transition-all duration-300 overflow-hidden ' + (isDarkMode
                ? 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]'
                : 'bg-white border border-slate-200 shadow-sm hover:shadow-md')}
        >
            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" style={{ background: color }} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className={'text-[10px] font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{label}</span>
                    {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
                </div>
                <div className={'text-2xl font-bold tabular-nums tracking-tight ' + (isGood ? '' : (isDarkMode ? 'text-amber-400' : 'text-amber-500'))} style={isGood ? { color } : {}}>
                    {pct}%
                </div>
                {/* Mini bar */}
                <div className={'mt-2 h-1 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, opacity: isGood ? 1 : 0.5 }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Custom Slider with gradient fill
   ═══════════════════════════════════════════════════════════════ */
const ParamSlider = ({ label, tooltip, value, onChange, min, max, step, lowLabel, highLabel, isDarkMode, primaryStr, displayValue }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <Tooltip isDarkMode={isDarkMode} content={tooltip}>
                <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {label} <HelpCircle className="w-3.5 h-3.5 opacity-40" />
                </label>
            </Tooltip>
            <span className="text-sm font-mono font-bold tabular-nums" style={{ color: primaryStr }}>{displayValue ?? value}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={onChange}
            className={'premium-slider w-full h-1.5 ' + (isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200')}
            style={{
                background: `linear-gradient(to right, ${primaryStr} ${((value - min) / (max - min)) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${((value - min) / (max - min)) * 100}%)`,
                accentColor: primaryStr,
            }}
        />
        <div className="flex justify-between text-[10px] text-slate-500">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
        </div>
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

    // Cancellation ref for stale training runs
    const trainingIdRef = useRef(0);
    const lastTriggeredRef = useRef('');

    // Model Configurations & State
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

    // Stable training function
    const trainModel = useCallback(async (isAuto = false) => {
        const currentTrainId = ++trainingIdRef.current;
        setTrainError(null);

        if (!dataset || dataset.length === 0 || !datasetSchema || datasetSchema.length === 0) {
            const emptyResult = {
                id: Date.now(),
                modelName: MODELS.find(m => m.id === selectedModel).name,
                settings: getSettingsString(),
                accuracy: 0,
                sensitivity: 0,
                specificity: 0,
                auc: 0,
                precision: 0,
                f1Score: 0
            };
            setLastResult(emptyResult);
            if (setTrainedModelResult) {
                setTrainedModelResult({
                    modelId: selectedModel,
                    ...emptyResult
                });
            }
            if (isInitialLoading) setIsInitialLoading(false);
            return;
        }

        setIsTraining(true);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        try {
            const metrics = await runMLTraining(selectedModel, params[selectedModel], dataset, datasetSchema, targetColumn, 42);

            // Check if this run is still the latest one
            if (currentTrainId !== trainingIdRef.current) return;

            const settingsStr = getSettingsString();
            const modelName = MODELS.find(m => m.id === selectedModel).name;

            const result = {
                id: Date.now(),
                modelName,
                settings: settingsStr,
                ...metrics
            };

            setLastResult(result);

            if (setTrainedModelResult) {
                setTrainedModelResult({
                    modelId: selectedModel,
                    modelName,
                    settings: settingsStr,
                    ...metrics
                });
            }
        } catch (err) {
            if (currentTrainId !== trainingIdRef.current) return;
            console.error('ML Pipeline Error:', err);
            setTrainError(err.message || 'An unexpected error occurred during training.');
            const settingsStr = getSettingsString();
            const modelName = MODELS.find(m => m.id === selectedModel).name;
            const fallbackResult = {
                id: Date.now(),
                modelName,
                settings: settingsStr,
                accuracy: 0,
                sensitivity: 0,
                specificity: 0,
                precision: 0,
                f1Score: 0,
                auc: 0
            };
            setLastResult(fallbackResult);
            if (setTrainedModelResult) setTrainedModelResult({ modelId: selectedModel, ...fallbackResult });
        } finally {
            if (currentTrainId === trainingIdRef.current) {
                setIsTraining(false);
                if (isInitialLoading) setIsInitialLoading(false);
            }
        }
    }, [selectedModel, params, dataset, datasetSchema, targetColumn, setTrainedModelResult]);

    // Targeted dependencies for training
    const currentModelParams = params[selectedModel];

    // Initial training & auto-retrain logic
    useEffect(() => {
        if (!autoRetrain && !isInitialLoading) return;

        // Create a unique key for the current model and its specific parameters
        const currentParamKey = `${selectedModel}-${JSON.stringify(currentModelParams)}`;

        // Prevent re-triggering if parameters haven't changed (unless it's the initial load)
        if (currentParamKey === lastTriggeredRef.current && !isInitialLoading) {
            return;
        }

        lastTriggeredRef.current = currentParamKey;

        let timer;
        const delay = isInitialLoading ? 500 : (selectedModel === 'rf' ? 1200 : 700);
        timer = setTimeout(() => {
            trainModel(true);
        }, delay);

        return () => {
            if (timer) clearTimeout(timer);
        };
        // We exclude trainModel and isInitialLoading to prevent the loading state toggle 
        // from re-triggering the effect and creating an infinite loop.
    }, [selectedModel, currentModelParams, autoRetrain]);

    const addToComparison = () => {
        if (lastResult) {
            setComparisonList(prev => {
                const isDuplicate = prev.some(r =>
                    r.modelName === lastResult.modelName &&
                    r.settings === lastResult.settings
                );
                if (!isDuplicate) {
                    return [...prev, lastResult];
                }
                return prev;
            });
        }
    };

    const currentModelData = MODELS.find(m => m.id === selectedModel);
    const isAlreadyCompared = comparisonList.some(r => r.modelName === lastResult?.modelName && r.settings === lastResult?.settings);

    /* ═══════════════ INITIAL LOADING STATE ═══════════════ */
    if (isInitialLoading) {
        return (
            <div className={`relative w-full flex flex-col items-center justify-center min-h-[60vh] rounded-3xl border shadow-md overflow-hidden ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="w-20 h-20 rounded-full border-[3px] border-t-transparent"
                            style={{ borderColor: `${primaryStr}20`, borderTopColor: primaryStr }}
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-3 rounded-full border-[3px] border-b-transparent"
                            style={{ borderColor: `${secondaryStr}20`, borderBottomColor: secondaryStr }}
                        />
                        <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7" style={{ color: primaryStr }} />
                    </div>
                    <h2 className={'text-3xl font-extrabold mb-3 ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                        Initializing{' '}
                        <span style={{ background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Models
                        </span>
                    </h2>
                    <p className={'max-w-md text-center text-sm leading-relaxed ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                        Processing your data and training initial algorithms…
                    </p>
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mt-6 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                        style={{ backgroundColor: `${primaryStr}12`, color: primaryStr }}
                    >
                        Running computation
                    </motion.div>
                </div>
            </div>
        );
    }

    /* ═══════════════ MAIN RENDER ═══════════════ */
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
                        Choose Models & Parameters
                    </motion.p>
                    <div className="flex justify-end gap-3 mb-4">
                        {/* Auto-retrain toggle */}
                        <div className="hidden md:flex items-center gap-2">
                            <span className={'text-xs font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Auto-retrain</span>
                            <button
                                onClick={() => setAutoRetrain(!autoRetrain)}
                                className={'w-10 h-5 rounded-full transition-all duration-300 relative ' + (autoRetrain ? '' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200'))}
                                style={autoRetrain ? { backgroundColor: secondaryStr } : {}}
                            >
                                <motion.div
                                    animate={{ x: autoRetrain ? 20 : 2 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                />
                            </button>
                        </div>
                        <motion.button
                            onClick={onNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all duration-300"
                            style={{ backgroundColor: secondaryStr, boxShadow: `0 8px 30px ${secondaryStr}35` }}
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* ═══════════════ ALGORITHM PICKER GRID ═══════════════ */}
                <motion.div variants={itemAnim}>
                    <div style={{
                        display: 'flex', gap: 10, flexWrap: 'wrap', padding: '6px 0 16px',
                    }}>
                        {MODELS.map((m, i) => (
                            <ModelCard
                                key={m.id}
                                model={m}
                                isSelected={selectedModel === m.id}
                                isDarkMode={isDarkMode}
                                onClick={() => setSelectedModel(m.id)}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* ═══════════════ TWO-COLUMN LAYOUT ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ── Left Column: Parameters + Actions ── */}
                    <motion.div variants={itemAnim} className="lg:col-span-4 space-y-5">

                        {/* Parameter Card */}
                        <motion.div
                            key={selectedModel}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="ios-list"
                        >
                            <div className="ios-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${currentModelData.color}15` }}>
                                        {React.createElement(currentModelData.icon, { className: 'w-5 h-5', style: { color: currentModelData.color } })}
                                    </div>
                                    <div>
                                        <div className="ios-list-title">{currentModelData.name}</div>
                                        <div className="ios-list-subtitle">{currentModelData.desc}</div>
                                    </div>
                                </div>

                                <div className={'pt-4 border-t space-y-6 ' + (isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
                                    {/* Dynamic Inputs */}
                                    {selectedModel === 'knn' && (
                                        <>
                                            <ParamSlider
                                                label="K — Neighbors" tooltip="The number of previous patients to look at. Lower K is more sensitive to outliers; higher K looks at the 'bigger picture'."
                                                value={params.knn.k} min={1} max={25} step={1}
                                                onChange={(e) => setParams({ ...params, knn: { ...params.knn, k: Number(e.target.value) } })}
                                                lowLabel="1 (Sensitive)" highLabel="25 (General)"
                                                isDarkMode={isDarkMode} primaryStr={primaryStr}
                                            />
                                            <div className="space-y-2">
                                                <Tooltip isDarkMode={isDarkMode} content="How the AI calculates 'similarity'. Euclidean is straight-line; Manhattan is street-grid distance.">
                                                    <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        Distance Measure <HelpCircle className="w-3.5 h-3.5 opacity-40" />
                                                    </label>
                                                </Tooltip>
                                                <select
                                                    className={`w-full p-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-indigo-500/30' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-indigo-500/20'}`}
                                                    value={params.knn.metric}
                                                    onChange={(e) => setParams({ ...params, knn: { ...params.knn, metric: e.target.value } })}
                                                >
                                                    <option>Euclidean (straight-line)</option>
                                                    <option>Manhattan (city-block)</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {selectedModel === 'svm' && (
                                        <>
                                            <ParamSlider
                                                label="C — Strictness" tooltip="Strictness of the boundary. Higher C tries for zero errors but may overfit; lower C allows some overlap for a smoother rule."
                                                value={params.svm.c} min={0.1} max={10.0} step={0.1}
                                                onChange={(e) => setParams({ ...params, svm: { ...params.svm, c: Number(e.target.value) } })}
                                                lowLabel="0.1 (Loose)" highLabel="10.0 (Strict)"
                                                isDarkMode={isDarkMode} primaryStr={primaryStr}
                                            />
                                            <div className="space-y-2">
                                                <Tooltip isDarkMode={isDarkMode} content="The shape of the dividing line. RBF handles complex curves; Linear is for simple straight-line splits.">
                                                    <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        Kernel Type <HelpCircle className="w-3.5 h-3.5 opacity-40" />
                                                    </label>
                                                </Tooltip>
                                                <select
                                                    className={`w-full p-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-indigo-500/30' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-indigo-500/20'}`}
                                                    value={params.svm.kernel}
                                                    onChange={(e) => setParams({ ...params, svm: { ...params.svm, kernel: e.target.value } })}
                                                >
                                                    <option value="RBF">RBF - Radial (curved)</option>
                                                    <option value="Linear">Linear (straight)</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {selectedModel === 'dt' && (
                                        <ParamSlider
                                            label="Maximum Depth" tooltip="The number of questions in the flowchart. Deep trees can 'overfit' by memorizing random noise."
                                            value={params.dt.maxDepth} min={1} max={10} step={1}
                                            onChange={(e) => setParams({ ...params, dt: { ...params.dt, maxDepth: Number(e.target.value) } })}
                                            lowLabel="1 (Simple)" highLabel="10 (Complex)"
                                            isDarkMode={isDarkMode} primaryStr={primaryStr}
                                        />
                                    )}

                                    {selectedModel === 'rf' && (
                                        <>
                                            <ParamSlider
                                                label="Number of Trees" tooltip="More trees lead to a more stable consensus, reducing the influence of individual 'lucky' trees."
                                                value={params.rf.trees} min={10} max={200} step={10}
                                                onChange={(e) => setParams({ ...params, rf: { ...params.rf, trees: Number(e.target.value) } })}
                                                lowLabel="10 (Fast)" highLabel="200 (Stable)"
                                                isDarkMode={isDarkMode} primaryStr={primaryStr}
                                            />
                                            <ParamSlider
                                                label="Max Depth Per Tree" tooltip="Limits how deep each tree can search. Shallow trees generalize better to new patients."
                                                value={params.rf.maxDepth} min={1} max={10} step={1}
                                                onChange={(e) => setParams({ ...params, rf: { ...params.rf, maxDepth: Number(e.target.value) } })}
                                                lowLabel="1 (Simple)" highLabel="10 (Complex)"
                                                isDarkMode={isDarkMode} primaryStr={primaryStr}
                                            />
                                        </>
                                    )}

                                    {selectedModel === 'lr' && (
                                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                            <div className="flex items-start gap-3">
                                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                                <div className="text-sm font-medium leading-relaxed">
                                                    Logistic Regression autonomously calibrates statistical significance directly from your clinical dataset. No manual parameters required.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedModel === 'nb' && (
                                        <ParamSlider
                                            label="Clinical Distribution Score" tooltip="Increases statistical reliability by preventing sparse anomalies from overly influencing the model."
                                            value={Math.log10(params.nb.smoothing)} min={-12} max={-5} step={1}
                                            onChange={(e) => setParams({ ...params, nb: { ...params.nb, smoothing: Math.pow(10, Number(e.target.value)) } })}
                                            lowLabel="Low (Strict)" highLabel="High (Flexible)"
                                            displayValue={`${(Math.abs(-13 - Math.log10(params.nb.smoothing)) * 10).toFixed(0)} Points`}
                                            isDarkMode={isDarkMode} primaryStr={primaryStr}
                                        />
                                    )}
                                </div>

                                {/* Training Error */}
                                <AnimatePresence>
                                    {trainError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={'mt-4 p-3 rounded-xl border text-xs flex gap-2 items-start ' + (isDarkMode ? 'bg-red-900/15 border-red-800/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}
                                        >
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>{trainError}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 mt-6">
                                    <div className="flex gap-3">
                                        {(!autoRetrain || trainError) && (
                                            <motion.button
                                                onClick={() => trainModel(false)}
                                                disabled={isTraining}
                                                whileHover={!isTraining ? { scale: 1.01 } : {}}
                                                whileTap={!isTraining ? { scale: 0.98 } : {}}
                                                className={'flex-1 flex gap-2 justify-center items-center py-3 rounded-2xl font-bold text-sm transition-all duration-300 ' + (isTraining
                                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                                    : 'text-white')}
                                                style={!isTraining ? { background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`, boxShadow: `0 8px 25px ${primaryStr}35` } : {}}
                                            >
                                                {isTraining ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : (
                                                    <Play className="w-4 h-4 fill-current" />
                                                )}
                                                <span>{isTraining ? 'Training…' : trainError ? 'Retry' : 'Run'}</span>
                                            </motion.button>
                                        )}
                                        <motion.button
                                            onClick={addToComparison}
                                            disabled={!lastResult || isTraining || isAlreadyCompared}
                                            whileHover={lastResult && !isTraining && !isAlreadyCompared ? { scale: 1.01 } : {}}
                                            whileTap={lastResult && !isTraining && !isAlreadyCompared ? { scale: 0.98 } : {}}
                                            className={'flex-1 flex gap-2 justify-center items-center py-3 rounded-2xl font-bold text-sm transition-all duration-300 ' + (
                                                (!lastResult || isTraining || isAlreadyCompared)
                                                    ? (isDarkMode ? 'ios-card text-slate-600 cursor-not-allowed border border-white/10' : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200')
                                                    : 'border-2'
                                            )}
                                            style={lastResult && !isTraining && !isAlreadyCompared ? { borderColor: `${primaryStr}40`, color: primaryStr, backgroundColor: `${primaryStr}06` } : {}}
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Compare</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Live Metrics Mini-Grid ── */}
                        <AnimatePresence mode="wait">
                            {lastResult && !isTraining && (
                                <motion.div
                                    key={`metrics-${lastResult.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    <MetricPill label="Accuracy" value={lastResult.accuracy} icon={Target} isDarkMode={isDarkMode} color={primaryStr} delay={0} />
                                    <MetricPill label="Sensitivity" value={lastResult.sensitivity} icon={Activity} isDarkMode={isDarkMode} color={secondaryStr} delay={0.06} />
                                    <MetricPill label="Specificity" value={lastResult.specificity} icon={BarChart3} isDarkMode={isDarkMode} color="#8b5cf6" delay={0.12} />
                                    <MetricPill label="AUC" value={lastResult.auc} icon={TrendingUp} isDarkMode={isDarkMode} color="#f59e0b" delay={0.18} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Training indicator */}
                        <AnimatePresence>
                            {isTraining && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={'rounded-2xl p-4 flex items-center gap-3 ' + (isDarkMode ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-indigo-50/50 border border-indigo-100')}
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                        className="w-8 h-8 rounded-full border-[2px] border-t-transparent flex-shrink-0"
                                        style={{ borderColor: `${primaryStr}25`, borderTopColor: primaryStr }}
                                    />
                                    <div>
                                        <div className={'text-sm font-semibold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>Training {currentModelData.shortName}…</div>
                                        <div className={'text-[11px] ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Settings: {getSettingsString()}</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── Right Column: Visualization + Comparison ── */}
                    <motion.div variants={itemAnim} className="lg:col-span-8 space-y-5">

                        {/* Visualization Card */}
                        <div className={'rounded-3xl overflow-hidden transition-all duration-300 ' + (isDarkMode
                            ? 'bg-white/[0.02] border border-white/[0.06]'
                            : 'bg-white border border-slate-200 shadow-sm')}>
                            <div className={'px-6 py-4 border-b flex items-center justify-between ' + (isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" style={{ color: currentModelData.color }} />
                                    <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        {VIZ_CONTENT[selectedModel]?.title || 'Visualization'}
                                    </h3>
                                </div>
                                {isTraining && (
                                    <motion.span
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="text-xs font-mono px-2.5 py-1 rounded-lg"
                                        style={{ color: secondaryStr, backgroundColor: `${secondaryStr}12` }}
                                    >
                                        Training…
                                    </motion.span>
                                )}
                            </div>
                            <div className="p-5">
                                <VizErrorBoundary isDarkMode={isDarkMode} key={`error-${selectedModel}`}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={selectedModel}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ModelVisualizer
                                                selectedModel={selectedModel}
                                                params={params}
                                                isDarkMode={isDarkMode}
                                                datasetSchema={datasetSchema}
                                                targetColumn={targetColumn}
                                                domain={domain}
                                                dataset={dataset}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </VizErrorBoundary>
                                {trainError && (
                                    <div className={`mt-4 p-3 rounded-xl text-sm ${isDarkMode ? 'bg-amber-900/15 text-amber-300 border border-amber-800/30' : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'}`}>
                                        ⚠️ Training warning: {trainError}. Results may use fallback predictions.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Comparison Table ── */}
                        <div className={'rounded-3xl overflow-hidden transition-all duration-300 ' + (isDarkMode
                            ? 'bg-white/[0.02] border border-white/[0.06]'
                            : 'bg-white border border-slate-200 shadow-sm')}>
                            <div className={'px-6 py-4 border-b flex items-center justify-between ' + (isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4" style={{ color: primaryStr }} />
                                    <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        Model Comparison
                                    </h3>
                                </div>
                                {comparisonList.length === 0 && (
                                    <span className={'text-xs italic ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                        Train and click "+ Compare" to add
                                    </span>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className={isDarkMode ? 'text-slate-500 bg-white/[0.02]' : 'text-slate-400 bg-slate-50/50'}>
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Model & Settings</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Accuracy</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Sensitivity</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Specificity</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">AUC</th>
                                        </tr>
                                    </thead>
                                    <tbody className={'divide-y ' + (isDarkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700')}>
                                        {comparisonList.length > 0 ? comparisonList.map((res, idx) => {
                                            // Find best values
                                            const bestAcc = Math.max(...comparisonList.map(r => parseFloat(r.accuracy)));
                                            const isBestAcc = parseFloat(res.accuracy) === bestAcc;
                                            return (
                                                <motion.tr
                                                    key={res.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}
                                                >
                                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                        {isBestAcc && <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                                        {res.modelName}
                                                        <span className={'text-[10px] font-normal ml-1 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>({res.settings})</span>
                                                    </td>
                                                    <td className={`px-6 py-4 font-bold tabular-nums ${parseFloat(res.accuracy) >= 0.8 ? 'text-emerald-500' : parseFloat(res.accuracy) >= 0.7 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {res.accuracy}
                                                    </td>
                                                    <td className={`px-6 py-4 font-semibold tabular-nums ${parseFloat(res.sensitivity) >= 0.7 ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>
                                                        {res.sensitivity}
                                                    </td>
                                                    <td className="px-6 py-4 tabular-nums">{res.specificity}</td>
                                                    <td className="px-6 py-4 tabular-nums">{res.auc}</td>
                                                </motion.tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="5" className={'px-6 py-10 text-center ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                                    No models compared yet.
                                                </td>
                                            </tr>
                                        )}
                                        {/* Live Result Preview Row */}
                                        {lastResult && !comparisonList.find(r => r.id === lastResult.id) && (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={(isDarkMode ? 'bg-indigo-500/[0.04]' : 'bg-indigo-50/50') + ' border-l-[3px]'}
                                                style={{ borderLeftColor: primaryStr }}
                                            >
                                                <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                    {lastResult.modelName}
                                                    <span className={'text-[10px] font-normal ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>({lastResult.settings})</span>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: primaryStr }}>Live</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold tabular-nums" style={{ color: primaryStr }}>{lastResult.accuracy}</td>
                                                <td className="px-6 py-4 tabular-nums">{lastResult.sensitivity}</td>
                                                <td className="px-6 py-4 tabular-nums">{lastResult.specificity}</td>
                                                <td className="px-6 py-4 tabular-nums">{lastResult.auc}</td>
                                            </motion.tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Visual Comparison Chart ── */}
                        <AnimatePresence>
                            {comparisonList.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 16 }}
                                    className={'rounded-3xl overflow-hidden relative transition-all duration-300 ' + (isDarkMode
                                        ? 'bg-white/[0.02] border border-white/[0.06]'
                                        : 'bg-white border border-slate-200 shadow-sm')}
                                >
                                    {/* Ambient Glow */}
                                    <div className="absolute top-[-80px] left-[-80px] w-52 h-52 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${primaryStr}0A` }} />

                                    <div className={'px-6 py-4 border-b flex items-center justify-between relative z-10 ' + (isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4" style={{ color: primaryStr }} />
                                            <h3 className={'text-xs font-bold uppercase tracking-widest'} style={{ color: primaryStr }}>
                                                Visual Comparison — {comparisonList.length} Model{comparisonList.length > 1 ? 's' : ''}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6 relative z-10">
                                        {['accuracy', 'sensitivity', 'specificity', 'auc'].map(metric => {
                                            const labels = { accuracy: '🎯 Accuracy', sensitivity: '⭐ Sensitivity', specificity: '🛡 Specificity', auc: '📈 AUC-ROC' };
                                            const thresholds = { accuracy: 0.65, sensitivity: 0.70, specificity: 0.65, auc: 0.75 };
                                            const barColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
                                            const best = Math.max(...comparisonList.map(r => parseFloat(r[metric])));
                                            return (
                                                <div key={metric}>
                                                    <div className="flex justify-between mb-2">
                                                        <span className={'text-xs font-bold ' + (isDarkMode ? 'text-slate-400' : 'text-slate-600')}>{labels[metric]}</span>
                                                        <span className={'text-[10px] font-semibold ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                                            threshold: {(thresholds[metric] * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 relative py-2">
                                                        {comparisonList.map((res, i) => {
                                                            const val = parseFloat(res[metric]);
                                                            const pct = Math.round(val * 100);
                                                            const isBest = val === best;
                                                            const passes = val >= thresholds[metric];
                                                            return (
                                                                <div key={res.id} className="flex items-center gap-3 relative z-10">
                                                                    <span className={`text-[10px] font-mono w-[80px] sm:w-[120px] shrink-0 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                        {res.modelName.split(' ').slice(-1)[0]}
                                                                        {isBest && <span className="ml-1 text-amber-400">★</span>}
                                                                    </span>
                                                                    <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                                        <motion.div
                                                                            className={'h-full rounded-full ' + (passes ? '' : 'opacity-50')}
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${pct}%` }}
                                                                            transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                                                            style={{ backgroundColor: barColors[i % barColors.length], boxShadow: passes ? `0 0 8px ${barColors[i % barColors.length]}30` : 'none' }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-xs font-bold w-10 text-right tabular-nums ${passes ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Clinical Threshold Line */}
                                                        <div className="absolute inset-0 flex items-center gap-3 pointer-events-none px-0">
                                                            <div className="w-[80px] sm:w-[120px] shrink-0" />
                                                            <div className="flex-1 h-full relative">
                                                                <div
                                                                    className={'absolute top-0 bottom-0 w-[2px] ' + (isDarkMode ? 'bg-red-500/40' : 'bg-red-500/30')}
                                                                    style={{ left: `${thresholds[metric] * 100}%` }}
                                                                >
                                                                    <div className={`absolute -top-1 px-1 -translate-x-1/2 -translate-y-full text-[8px] font-black uppercase tracking-tighter rounded ${isDarkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                                                        Limit
                                                                    </div>
                                                                    <div className="absolute bottom-0 -translate-x-[40%] w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                                                </div>
                                                            </div>
                                                            <div className="w-10" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className={`text-[10px] pt-2 border-t ${isDarkMode ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-100'}`}>
                                            ★ Best in category · Red values = below clinical threshold · Threshold markers shown on each bar
                                        </p>
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
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all duration-300"
                        style={{ backgroundColor: secondaryStr, boxShadow: `0 8px 30px ${secondaryStr}35` }}
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ModelSelection;
