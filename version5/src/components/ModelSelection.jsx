import React, { useState, useEffect, useRef, useCallback } from 'react';

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
                <div className={`p-8 rounded-xl border text-center ${this.props.isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className={`font-bold mb-2 ${this.props.isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Visualization Error</h3>
                    <p className={`text-sm mb-4 ${this.props.isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        The visualization encountered an error. Try adjusting the parameters or selecting a different model.
                    </p>
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
import { Settings, Play, Plus, Activity, GitBranch, Binary, Network, TrendingUp, Info, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import ModelVisualizer from './ModelVisualizations';
import Tooltip from './Tooltip';
import { runMLTraining } from '../utils/mlEngine';

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
    { id: 'knn', name: 'K-Nearest Neighbors', icon: Network, desc: 'Compares a new patient to the K most similar historical patients.' },
    { id: 'svm', name: 'Support Vector Machine', icon: Activity, desc: 'Finds the clearest dividing line between two groups of patients.' },
    { id: 'dt', name: 'Decision Tree', icon: GitBranch, desc: 'Asks a series of yes/no questions to reach a prediction.' },
    { id: 'rf', name: 'Random Forest', icon: Binary, desc: 'Trains many decision trees and takes a majority vote.' },
    { id: 'lr', name: 'Logistic Regression', icon: TrendingUp, desc: 'Calculates probability based on a weighted combination of measurements.' },
    { id: 'nb', name: 'Naive Bayes', icon: Info, desc: 'Uses probability theory to estimate likelihood of outcomes.' },
];

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

    // Model Configurations & State
    const [params, setParams] = useState({
        knn: { k: 5, metric: 'Euclidean' },
        svm: { c: 1.0, kernel: 'RBF' },
        dt: { maxDepth: 3 },
        rf: { trees: 100 },
        lr: { c: 1.0 },
        nb: { smoothing: 1e-9 }
    });

    const getSettingsString = () => {
        const p = params[selectedModel];
        if (selectedModel === 'knn') return `K=${p.k}, ${p.metric}`;
        if (selectedModel === 'svm') return `C=${p.c}, ${p.kernel}`;
        if (selectedModel === 'dt') return `Depth=${p.maxDepth}`;
        if (selectedModel === 'rf') return `Trees=${p.trees}`;
        if (selectedModel === 'lr') return `C=${p.c}`;
        if (selectedModel === 'nb') return `Smooth=${p.smoothing}`;
        return '';
    };

    // Stable training function
    const trainModel = useCallback(async (isAuto = false) => {
        if (isTraining) return;
        
        // Cancellation check
        const currentTrainId = ++trainingIdRef.current;
        
        setTrainError(null);
        
        // Guard: Check data availability
        if (!dataset || dataset.length === 0 || !datasetSchema || datasetSchema.length === 0) {
            console.warn('Training aborted: Missing dataset or schema');
            setLastResult({
                id: Date.now(),
                modelName: MODELS.find(m => m.id === selectedModel).name,
                settings: getSettingsString(),
                accuracy: "0.00",
                sensitivity: "0.00",
                specificity: "0.00",
                auc: "0.00",
            });
            setIsTraining(false);
            if (isInitialLoading) setIsInitialLoading(false);
            return;
        }

        setIsTraining(true);
        
        // Yield to browser to show spinner
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        try {
            const metrics = await runMLTraining(selectedModel, params[selectedModel], dataset, datasetSchema, targetColumn);
            
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
            console.error('ML Pipeline Error:', err);
            if (currentTrainId === trainingIdRef.current) {
                setTrainError(err.message || 'An unexpected error occurred during training.');
            }
        } finally {
            if (currentTrainId === trainingIdRef.current) {
                setIsTraining(false);
                if (isInitialLoading) setIsInitialLoading(false);
            }
        }
    }, [selectedModel, params, dataset, datasetSchema, targetColumn, isTraining, isInitialLoading, setTrainedModelResult]);

    // Initial training & auto-retrain logic
    useEffect(() => {
        let timer;
        if (autoRetrain || isInitialLoading) {
            const delay = isInitialLoading ? 500 : (selectedModel === 'rf' ? 2200 : 1200);
            timer = setTimeout(() => {
                trainModel(true);
            }, delay);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [selectedModel, params, autoRetrain, trainModel, isInitialLoading]);

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

    if (isInitialLoading) {
        return (
            <div className={`w-full flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 rounded-3xl border ${isDarkMode ? 'bg-slate-800/20 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
                <div className="relative mb-8">
                    <div className={`w-24 h-24 border-4 rounded-full animate-spin ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} style={{ borderTopColor: primaryStr }} />
                    <div className={`absolute inset-3 border-4 rounded-full animate-spin ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`} style={{ borderBottomColor: secondaryStr, animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    <Network className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 animate-pulse`} style={{ color: primaryStr }} />
                </div>
                <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Model Training & Initialization</h2>
                <p className={`max-w-md text-center leading-relaxed font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Processing your data and training initial algorithms. Please wait while the machine learning models learn from the historical patients...
                </p>
                <div className={`mt-8 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse`} style={{ backgroundColor: `${primaryStr}1A`, color: primaryStr }}>
                    Running Heavy computation
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full mr-3`} style={{ backgroundColor: `${primaryStr}20`, color: primaryStr }}>
                            STEP 4 OF 7
                        </span>
                        <div className="flex items-center gap-2 md:hidden">
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Auto-retrain</span>
                            <button
                                onClick={() => setAutoRetrain(!autoRetrain)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${autoRetrain ? '' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
                                style={autoRetrain ? { backgroundColor: secondaryStr } : {}}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${autoRetrain ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Auto-retrain:</span>
                        <button
                            onClick={() => setAutoRetrain(!autoRetrain)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${autoRetrain ? '' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
                            style={autoRetrain ? { backgroundColor: primaryStr } : {}}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoRetrain ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <button
                            onClick={onPrev}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${isDarkMode
                                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 text-white shadow-lg`}
                            style={{ backgroundColor: secondaryStr, boxShadow: `0 4px 14px 0 ${secondaryStr}40` }}
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Model Selection & Parameter Tuning
                </h2>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Choose a machine learning algorithm, adjust its settings, and train it on your patient data. Try different models and compare their accuracy side by side.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Col: Model Selection & Params */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Algorithm Selector (Tabs) */}
                    <div className="relative group">
                        <div className={`flex overflow-x-auto pb-2 mb-2 scrollbar-hide gap-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-slate-900/60' : 'bg-slate-100'}`}>
                            {MODELS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedModel(m.id)}
                                    className={`relative flex-shrink-0 px-4 py-3 rounded-lg font-bold transition-all flex flex-col items-center gap-2 min-w-[100px] overflow-hidden ${selectedModel === m.id
                                        ? 'text-white shadow-lg'
                                        : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')
                                        }`}
                                    style={selectedModel === m.id ? { backgroundColor: primaryStr, boxShadow: `0 4px 14px 0 ${primaryStr}40` } : {}}
                                >
                                    {React.createElement(m.icon, { className: `w-5 h-5 ${selectedModel === m.id ? 'animate-pulse' : ''}` })}
                                    <span className="text-[10px] uppercase tracking-wider">{m.name.split(' ')[0]}</span>
                                    {selectedModel === m.id && (
                                        <motion.div
                                            layoutId="activeTabGlow"
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-white/40"
                                            initial={false}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        {/* Scroll hint for mobile */}
                        <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/40 to-transparent pointer-events-none" />
                    </div>

                    {/* Parameter Card */}
                    <div className={`p-6 rounded-xl border transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${primaryStr}20`, color: primaryStr }}>
                                {React.createElement(MODELS.find(m => m.id === selectedModel).icon, { className: "w-5 h-5" })}
                            </div>
                            <div>
                                <h3 className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {MODELS.find(m => m.id === selectedModel).name}
                                </h3>
                            </div>
                        </div>

                        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {MODELS.find(m => m.id === selectedModel).desc}
                        </p>

                        <div className={`space-y-6 border-t pt-6 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Parameters</h4>

                            {/* Dynamic Inputs based on Model */}
                            {selectedModel === 'knn' && (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Tooltip isDarkMode={isDarkMode} content="The number of previous patients to look at. Lower K is more sensitive to outliers; higher K looks at the 'bigger picture' of similar cases.">
                                                <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    K — Neighbors <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                                </label>
                                            </Tooltip>
                                            <span className={`text-sm font-mono font-bold`} style={{ color: primaryStr }}>{params.knn.k}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="20" step="1"
                                            value={params.knn.k}
                                            onChange={(e) => setParams({ ...params, knn: { ...params.knn, k: Number(e.target.value) } })}
                                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
                                            style={{
                                                background: `linear-gradient(to right, ${primaryStr} ${(params.knn.k / 20) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.knn.k / 20) * 100}%)`,
                                                accentColor: primaryStr
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>1 (Sensitive)</span>
                                            <span>20 (General)</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Tooltip isDarkMode={isDarkMode} content="How the AI calculates 'similarity'. Euclidean is straight-line map distance; Manhattan is street-grid distance.">
                                            <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                Distance Measure <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                            </label>
                                        </Tooltip>
                                        <select
                                            className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
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
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Tooltip isDarkMode={isDarkMode} content="Strictness of the boundary. Higher C tries for zero errors but may overfit; lower C allows some overlap for a smoother general rule.">
                                                <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    C — Strictness <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                                </label>
                                            </Tooltip>
                                            <span className={`text-sm font-mono font-bold`} style={{ color: primaryStr }}>{params.svm.c}</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="10.0" step="0.1"
                                            value={params.svm.c}
                                            onChange={(e) => setParams({ ...params, svm: { ...params.svm, c: Number(e.target.value) } })}
                                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
                                            style={{
                                                background: `linear-gradient(to right, ${primaryStr} ${(params.svm.c / 10) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.svm.c / 10) * 100}%)`,
                                                accentColor: primaryStr
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>0.1 (Loose)</span>
                                            <span>10.0 (Strict)</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Tooltip isDarkMode={isDarkMode} content="The shape of the dividing line. RBF handles complex curves; Linear is for simple straight-line splits.">
                                            <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                Kernel Type <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                            </label>
                                        </Tooltip>
                                        <select
                                            className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
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
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Tooltip isDarkMode={isDarkMode} content="The number of questions in the flowchart. Deep trees are very specific but can 'overfit' by memorizing random noise in the training group.">
                                            <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                Maximum Depth <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                            </label>
                                        </Tooltip>
                                        <span className={`text-sm font-mono font-bold`} style={{ color: primaryStr }}>{params.dt.maxDepth}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="10" step="1"
                                        value={params.dt.maxDepth}
                                        onChange={(e) => setParams({ ...params, dt: { ...params.dt, maxDepth: Number(e.target.value) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
                                        style={{
                                            background: `linear-gradient(to right, ${primaryStr} ${(params.dt.maxDepth / 10) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.dt.maxDepth / 10) * 100}%)`,
                                            accentColor: primaryStr
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>1 (Simple)</span>
                                        <span>10 (Complex)</span>
                                    </div>
                                </div>
                            )}

                            {selectedModel === 'rf' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Tooltip isDarkMode={isDarkMode} content="The number of individual trees voting. More trees lead to a more stable consensus, reducing the influence of individual 'lucky' trees.">
                                            <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                Number of Trees <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                            </label>
                                        </Tooltip>
                                        <span className={`text-sm font-mono font-bold`} style={{ color: primaryStr }}>{params.rf.trees}</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="200" step="10"
                                        value={params.rf.trees}
                                        onChange={(e) => setParams({ ...params, rf: { ...params.rf, trees: Number(e.target.value) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
                                        style={{
                                            background: `linear-gradient(to right, ${primaryStr} ${(params.rf.trees / 200) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.rf.trees / 200) * 100}%)`,
                                            accentColor: primaryStr
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>10 (Fast)</span>
                                        <span>200 (Stable)</span>
                                    </div>
                                </div>
                            )}

                            {selectedModel === 'lr' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Tooltip isDarkMode={isDarkMode} content="Simplifies the model. Higher C allows a complex, wiggly curve; lower C forces a simpler, flatter curve to prevent over-reacting to small noise.">
                                            <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                C — Regularisation <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                            </label>
                                        </Tooltip>
                                        <span className={`text-sm font-mono font-bold`} style={{ color: primaryStr }}>{params.lr.c}</span>
                                    </div>
                                    <input
                                        type="range" min="0.01" max="5.0" step="0.01"
                                        value={params.lr.c}
                                        onChange={(e) => setParams({ ...params, lr: { ...params.lr, c: Number(e.target.value) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
                                        style={{
                                            background: `linear-gradient(to right, ${primaryStr} ${(params.lr.c / 5) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.lr.c / 5) * 100}%)`,
                                            accentColor: primaryStr
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>0.01 (Strong/Simple)</span>
                                        <span>5.0 (Weak/Complex)</span>
                                    </div>
                                </div>
                            )}

                            {selectedModel === 'nb' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Tooltip isDarkMode={isDarkMode} content="A safety factor that prevents a zero probability just because we haven't seen a specific combination of traits in the training data yet.">
                                            <label className={`text-sm font-medium flex items-center gap-1.5 cursor-help ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                Variance Smoothing <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                                            </label>
                                        </Tooltip>
                                        <span className={`text-sm font-mono font-bold`} style={{ color: primaryStr }}>{params.nb.smoothing.toExponential(1)}</span>
                                    </div>
                                    <input
                                        type="range" min="-12" max="-5" step="1"
                                        value={Math.log10(params.nb.smoothing)}
                                        onChange={(e) => setParams({ ...params, nb: { ...params.nb, smoothing: Math.pow(10, Number(e.target.value)) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
                                        style={{
                                            /* Map -12 to -5 into a 0-100% scale */
                                            background: `linear-gradient(to right, ${primaryStr} ${((Math.log10(params.nb.smoothing) + 12) / 7) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${((Math.log10(params.nb.smoothing) + 12) / 7) * 100}%)`,
                                            accentColor: primaryStr
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>1e-12</span>
                                        <span>1e-5</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-6">
                                {trainError && (
                                    <div className={`p-3 rounded-lg border text-xs flex gap-2 items-start ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{trainError}</span>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    {(!autoRetrain || trainError) && (
                                        <button
                                            onClick={() => trainModel(false)}
                                            disabled={isTraining}
                                            className={`flex-1 flex gap-2 justify-center items-center py-2.5 rounded-lg font-bold transition-all duration-300 relative overflow-hidden group ${isTraining
                                                ? 'bg-slate-700 text-slate-400 cursor-wait'
                                                : 'text-white hover:-translate-y-0.5'
                                                }`}
                                            style={!isTraining ? { background: `linear-gradient(to right, ${primaryStr}, ${secondaryStr})`, boxShadow: `0 0 20px ${primaryStr}60` } : {}}
                                        >
                                            {!isTraining && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />}
                                            {isTraining ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                            <span className="relative z-10">{isTraining ? 'Training...' : trainError ? 'Retry Training' : 'Run Simulation'}</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={addToComparison}
                                        disabled={!lastResult || isTraining || comparisonList.some(r => r.modelName === lastResult?.modelName && r.settings === lastResult?.settings)}
                                        className={`flex-1 flex gap-2 justify-center items-center py-2.5 rounded-lg font-bold border transition-all duration-300 ${(!lastResult || isTraining || comparisonList.some(r => r.modelName === lastResult?.modelName && r.settings === lastResult?.settings))
                                            ? isDarkMode ? 'border-slate-700/50 text-slate-600 cursor-not-allowed bg-transparent' : 'border-slate-200 text-slate-300 cursor-not-allowed bg-transparent'
                                            : 'bg-transparent shadow-sm'
                                            }`}
                                        style={(!lastResult || isTraining || comparisonList.some(r => r.modelName === lastResult?.modelName && r.settings === lastResult?.settings)) ? {} : { borderColor: primaryStr, color: primaryStr, backgroundColor: `${primaryStr}10` }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Compare Model</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Viz & Stats */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Visualization Card */}
                    <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className={`px-5 py-3 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {VIZ_CONTENT[selectedModel]?.title || 'Visualization'}
                            </h3>
                            {isTraining && (
                                <span className={`text-xs font-mono animate-pulse px-2 py-1 rounded`} style={{ color: secondaryStr, backgroundColor: `${secondaryStr}33` }}>Training...</span>
                            )}
                        </div>
                        <div className="p-5">
                            <VizErrorBoundary isDarkMode={isDarkMode} key={`error-${selectedModel}`}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedModel}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ModelVisualizer 
                                            selectedModel={selectedModel} 
                                            params={params} 
                                            isDarkMode={isDarkMode} 
                                            datasetSchema={datasetSchema}
                                            targetColumn={targetColumn}
                                            domain={domain}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </VizErrorBoundary>
                            {trainError && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-amber-900/20 text-amber-300 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                    ⚠️ Training warning: {trainError}. Results may use fallback predictions.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Model Comparison</h3>
                            {comparisonList.length === 0 && <span className="text-xs text-slate-500 italic">Train and click "+ Compare" to add results</span>}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className={`${isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-50'}`}>
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Model & Settings</th>
                                        <th className="px-6 py-3 font-semibold">Accuracy</th>
                                        <th className="px-6 py-3 font-semibold">Sensitivity</th>
                                        <th className="px-6 py-3 font-semibold">Specificity</th>
                                        <th className="px-6 py-3 font-semibold">AUC</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                                    {comparisonList.length > 0 ? comparisonList.map((res) => (
                                        <tr key={res.id} className={`${isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50/80'} transition-colors`}>
                                            <td className="px-6 py-4 font-medium">
                                                {res.modelName} <span className="opacity-50 text-xs ml-1">({res.settings})</span>
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${parseFloat(res.accuracy) >= 0.8 ? 'text-emerald-500' : parseFloat(res.accuracy) >= 0.7 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {res.accuracy}
                                            </td>
                                            <td className={`px-6 py-4 font-semibold ${parseFloat(res.sensitivity) >= 0.7 ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>
                                                {res.sensitivity}
                                            </td>
                                            <td className="px-6 py-4">{res.specificity}</td>
                                            <td className="px-6 py-4">{res.auc}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center opacity-50">
                                                No models compared yet.
                                            </td>
                                        </tr>
                                    )}
                                    {/* Live Result Preview Row */}
                                    {lastResult && !comparisonList.find(r => r.id === lastResult.id) && (
                                        <tr className={`${isDarkMode ? 'bg-indigo-900/10' : 'bg-indigo-50'} border-l-4 border-indigo-500`}>
                                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                {lastResult.modelName} <span className="opacity-50 text-xs">({lastResult.settings})</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800">New</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-indigo-500">{lastResult.accuracy}</td>
                                            <td className="px-6 py-4">{lastResult.sensitivity}</td>
                                            <td className="px-6 py-4">{lastResult.specificity}</td>
                                            <td className="px-6 py-4">{lastResult.auc}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Visual Comparison Chart */}
                    {comparisonList.length > 0 && (
                        <div className={`rounded-xl border overflow-hidden relative shadow-lg ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50 backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
                            {/* Ambient Glow */}
                            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${primaryStr}1A` }} />

                            <div className={`px-6 py-4 border-b flex items-center justify-between relative z-10 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2`} style={{ color: primaryStr }}>
                                    <Activity className="w-4 h-4" />
                                    Visual Comparison — {comparisonList.length} Model{comparisonList.length > 1 ? 's' : ''}
                                </h3>
                            </div>
                            <div className="p-6 space-y-6 relative z-10">
                                {['accuracy', 'sensitivity', 'specificity', 'auc'].map(metric => {
                                    const labels = { accuracy: '🎯 Accuracy', sensitivity: '⭐ Sensitivity', specificity: '🛡 Specificity', auc: '📈 AUC-ROC' };
                                    const thresholds = { accuracy: 0.65, sensitivity: 0.70, specificity: 0.65, auc: 0.75 };
                                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500'];
                                    const best = Math.max(...comparisonList.map(r => parseFloat(r[metric])));
                                    return (
                                        <div key={metric}>
                                            <div className="flex justify-between mb-2">
                                                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{labels[metric]}</span>
                                                <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    threshold: {(thresholds[metric] * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 relative py-2">
                                                {/* Comparison Bars */}
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
                                                            <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                                <motion.div
                                                                    className={`h-full rounded-full ${passes ? '' : 'opacity-60'}`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.6, delay: i * 0.1 }}
                                                                    style={{ backgroundColor: colors[i % colors.length] ? undefined : secondaryStr, ...(!colors[i % colors.length] ? { backgroundColor: i === 0 ? primaryStr : secondaryStr } : {}) }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-bold w-10 text-right ${passes ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    );
                                                })}

                                                {/* Clinical Threshold Line Overlay */}
                                                <div className="absolute inset-0 flex items-center gap-3 pointer-events-none px-0">
                                                    {/* Matches label width */}
                                                    <div className="w-[80px] sm:w-[120px] shrink-0" />
                                                    
                                                    {/* Matches bar area width */}
                                                    <div className="flex-1 h-full relative">
                                                        <div 
                                                            className={`absolute top-0 bottom-0 w-[2px] ${isDarkMode ? 'bg-red-500/50' : 'bg-red-500/40'} border-l border-white/10`}
                                                            style={{ left: `${thresholds[metric] * 100}%` }}
                                                        >
                                                            <div className={`absolute -top-1 px-1 -translate-x-1/2 -translate-y-full text-[8px] font-black uppercase tracking-tighter rounded ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                                                Limit
                                                            </div>
                                                            {/* Dot at the bottom of the line for visual anchor */}
                                                            <div className="absolute bottom-0 -translate-x-[40%] w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Matches percentage width */}
                                                    <div className="w-10" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className={`text-[10px] pt-2 border-t ${isDarkMode ? 'text-slate-600 border-slate-700' : 'text-slate-400 border-slate-100'}`}>
                                    ★ Best in category · Red values = below clinical threshold · Threshold markers shown on each bar
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>


            {/* MobileNav */}
            <div className={`md:hidden flex justify-between items-center pt-8 border-t mt-8 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                    onClick={onPrev}
                    className={`px-6 py-2.5 rounded-lg border font-medium transition-colors ${isDarkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Previous
                </button>
                <button
                    onClick={onNext}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all text-white hover:scale-105 active:scale-95`}
                    style={{ backgroundColor: secondaryStr, boxShadow: `0 4px 14px 0 ${secondaryStr}40` }}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ModelSelection;
