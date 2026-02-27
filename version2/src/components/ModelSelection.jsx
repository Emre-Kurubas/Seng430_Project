import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, Plus, Activity, GitBranch, Binary, Network, TrendingUp, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import ModelVisualizer from './ModelVisualizations';

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
        desc: 'SVM draws the widest possible boundary between readmitted (red) and safe (green) patients. The support vectors (outlined circles) are the most critical cases that define the boundary.',
        legends: [
            { type: 'circle', color: 'bg-red-600', label: 'Readmitted' },
            { type: 'circle', color: 'bg-green-600', label: 'Not Readmitted' },
            { type: 'circle-border', label: 'Support Vector' },
            { type: 'line', style: 'solid', label: 'Decision Boundary' },
            { type: 'line', style: 'dashed', label: 'Margin' }
        ],
        clinical: 'The boundary is the "line of uncertainty." Patients far from the line are easy to classify. Patients near the line (support vectors) are the difficult cases that required the most attention during training.'
    },
    dt: {
        title: 'Decision Tree — Clinical Decision Flowchart',
        desc: 'The tree asks yes/no questions about patient measurements. Follow the path from top to bottom to reach a final decision. Hover over nodes to see details.',
        legends: [],
        clinical: 'This looks like a clinical guideline flowchart. The first question (Ejection Fraction < 38%) is the most important split - the model identified this as the strongest predictor.'
    },
    rf: {
        title: 'Random Forest — Ensemble Voting',
        desc: 'Instead of relying on a single rule, Random Forest trains many individual Decision Trees on random subsets of the data. Each tree votes on the patient\'s outcome.',
        legends: [
            { type: 'dot', color: 'bg-rose-500', label: 'Vote: Readmit' },
            { type: 'dot', color: 'bg-emerald-400', label: 'Vote: Safe' },
            { type: 'glow', label: 'Ensemble Aggregator' }
        ],
        clinical: 'Stability through consensus. By having 100 trees vote, it balances out individual bias or errors, making the prediction much more robust against statistical noise.'
    },
    lr: {
        title: 'Logistic Regression — Probability Curve',
        desc: 'Logistic Regression maps clinical measurements to a continuous risk probability from 0% to 100% using an S-shaped (sigmoid) curve.',
        legends: [
            { type: 'circle', color: 'bg-rose-500', label: 'Known Readmitted' },
            { type: 'circle', color: 'bg-emerald-400', label: 'Known Safe' },
            { type: 'line', color: 'bg-indigo-400', label: 'Sigmoid Probability' },
            { type: 'line', style: 'dashed', color: 'bg-amber-400', label: 'Decision Threshold' }
        ],
        clinical: 'The curve shows risk probability. Steep curves mean small changes in patient health (e.g. slight BP increase) cause large, dramatic jumps in clinical risk.'
    },
    nb: {
        title: 'Naive Bayes — Distributions',
        desc: 'Naive Bayes computes independent probability distributions for health conditions. It estimates risk by looking at where a patient\'s data points overlap these distributions.',
        legends: [
            { type: 'area', color: 'bg-emerald-500', label: 'Safe Distribution' },
            { type: 'area', color: 'bg-rose-500', label: 'Readmitted Distribution' },
            { type: 'dot', color: 'bg-amber-400', label: 'Overlap (Ambiguity Area)' }
        ],
        clinical: 'Based on pure statistical mapping of the dataset. For instance: "Given Age=70, what is the statistical likelihood of readmission vs safety?".'
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

const ModelSelection = ({ isDarkMode, onNext, onPrev }) => {
    const [selectedModel, setSelectedModel] = useState('knn');
    const [autoRetrain, setAutoRetrain] = useState(true);
    const [isTraining, setIsTraining] = useState(false);
    const [comparisonList, setComparisonList] = useState([]);
    const [lastResult, setLastResult] = useState(null);

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

    const trainModel = () => {
        setIsTraining(true);
        // Mock result generation based on model type and randomness
        setTimeout(() => {
            const baseAcc = 0.70;
            const randomVar = Math.random() * 0.15;
            const result = {
                id: Date.now(),
                modelName: MODELS.find(m => m.id === selectedModel).name,
                settings: getSettingsString(),
                accuracy: (baseAcc + randomVar).toFixed(2),
                sensitivity: (baseAcc + randomVar - 0.05).toFixed(2),
                specificity: (baseAcc + randomVar + 0.05).toFixed(2),
                auc: (baseAcc + randomVar + 0.02).toFixed(2),
            };
            setLastResult(result);
            setIsTraining(false);
        }, 600);
    };

    // Simulator for "Training"
    useEffect(() => {
        if (autoRetrain) {
            trainModel();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params, selectedModel]);

    const addToComparison = () => {
        if (lastResult && !comparisonList.find(r => r.id === lastResult.id)) {
            setComparisonList([...comparisonList, lastResult]);
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full mr-3 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            STEP 4 OF 7
                        </span>
                        <div className="flex items-center gap-2 md:hidden">
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Auto-retrain</span>
                            <button
                                onClick={() => setAutoRetrain(!autoRetrain)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${autoRetrain ? 'bg-emerald-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${autoRetrain ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Auto-retrain:</span>
                        <button
                            onClick={() => setAutoRetrain(!autoRetrain)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${autoRetrain ? 'bg-indigo-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
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
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg bg-slate-900 text-white hover:bg-slate-800"
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

                    {/* Algorithm Selector */}
                    <div className={`p-1 rounded-xl grid grid-cols-3 gap-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {MODELS.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedModel(m.id)}
                                className={`py-2 px-1 text-xs font-medium rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${selectedModel === m.id
                                    ? (isDarkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow')
                                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                                    }`}
                            >
                                {m.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>

                    {/* Parameter Card */}
                    <div className={`p-6 rounded-xl border transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
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
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>K — Neighbors to Compare</label>
                                            <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{params.knn.k}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="25" step="1"
                                            value={params.knn.k}
                                            onChange={(e) => setParams({ ...params, knn: { ...params.knn, k: Number(e.target.value) } })}
                                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50 accent-indigo-400 hover:accent-indigo-300' : 'bg-slate-200 accent-indigo-500 hover:accent-indigo-600'}`}
                                            style={{
                                                background: `linear-gradient(to right, ${isDarkMode ? '#6366f1' : '#4f46e5'} ${(params.knn.k / 25) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.knn.k / 25) * 100}%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>1 (Sensitive)</span>
                                            <span>25 (General)</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Distance Measure</label>
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
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>C — Strictness of Boundary</label>
                                            <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{params.svm.c}</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="10.0" step="0.1"
                                            value={params.svm.c}
                                            onChange={(e) => setParams({ ...params, svm: { ...params.svm, c: Number(e.target.value) } })}
                                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50 accent-sky-400 hover:accent-sky-300' : 'bg-slate-200 accent-sky-500 hover:accent-sky-600'}`}
                                            style={{
                                                background: `linear-gradient(to right, ${isDarkMode ? '#38bdf8' : '#0ea5e9'} ${(params.svm.c / 10) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.svm.c / 10) * 100}%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>0.1 (Loose)</span>
                                            <span>10.0 (Strict)</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kernel Type</label>
                                        <select
                                            className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
                                            value={params.svm.kernel}
                                            onChange={(e) => setParams({ ...params, svm: { ...params.svm, kernel: e.target.value } })}
                                        >
                                            <option value="RBF">RBF - Radial (curved)</option>
                                            <option value="Linear">Linear (straight)</option>
                                            <option value="Poly">Polynomial</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedModel === 'dt' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Maximum Depth</label>
                                        <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{params.dt.maxDepth}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="10" step="1"
                                        value={params.dt.maxDepth}
                                        onChange={(e) => setParams({ ...params, dt: { ...params.dt, maxDepth: Number(e.target.value) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50 accent-emerald-400 hover:accent-emerald-300' : 'bg-slate-200 accent-emerald-500 hover:accent-emerald-600'}`}
                                        style={{
                                            background: `linear-gradient(to right, ${isDarkMode ? '#34d399' : '#10b981'} ${(params.dt.maxDepth / 10) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.dt.maxDepth / 10) * 100}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>1 (Simple)</span>
                                        <span>10 (Complex)</span>
                                    </div>
                                </div>
                            )}

                            {selectedModel === 'rf' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Number of Trees</label>
                                        <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{params.rf.trees}</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="200" step="10"
                                        value={params.rf.trees}
                                        onChange={(e) => setParams({ ...params, rf: { ...params.rf, trees: Number(e.target.value) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50 accent-amber-400 hover:accent-amber-300' : 'bg-slate-200 accent-amber-500 hover:accent-amber-600'}`}
                                        style={{
                                            background: `linear-gradient(to right, ${isDarkMode ? '#fbbf24' : '#f59e0b'} ${(params.rf.trees / 200) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.rf.trees / 200) * 100}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>10 (Fast)</span>
                                        <span>200 (Stable)</span>
                                    </div>
                                </div>
                            )}

                            {selectedModel === 'lr' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>C — Regularisation Strength</label>
                                        <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{params.lr.c}</span>
                                    </div>
                                    <input
                                        type="range" min="0.01" max="5.0" step="0.01"
                                        value={params.lr.c}
                                        onChange={(e) => setParams({ ...params, lr: { ...params.lr, c: Number(e.target.value) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50 accent-rose-400 hover:accent-rose-300' : 'bg-slate-200 accent-rose-500 hover:accent-rose-600'}`}
                                        style={{
                                            background: `linear-gradient(to right, ${isDarkMode ? '#fb7185' : '#f43f5e'} ${(params.lr.c / 5) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${(params.lr.c / 5) * 100}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>0.01 (Strong/Simple)</span>
                                        <span>5.0 (Weak/Complex)</span>
                                    </div>
                                </div>
                            )}

                            {selectedModel === 'nb' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Variance Smoothing</label>
                                        <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{params.nb.smoothing.toExponential(1)}</span>
                                    </div>
                                    <input
                                        type="range" min="-12" max="-5" step="1"
                                        value={Math.log10(params.nb.smoothing)}
                                        onChange={(e) => setParams({ ...params, nb: { ...params.nb, smoothing: Math.pow(10, Number(e.target.value)) } })}
                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-slate-700/50 accent-fuchsia-400 hover:accent-fuchsia-300' : 'bg-slate-200 accent-fuchsia-500 hover:accent-fuchsia-600'}`}
                                        style={{
                                            /* Map -12 to -5 into a 0-100% scale */
                                            background: `linear-gradient(to right, ${isDarkMode ? '#e879f9' : '#d946ef'} ${((Math.log10(params.nb.smoothing) + 12) / 7) * 100}%, ${isDarkMode ? '#334155' : '#e2e8f0'} ${((Math.log10(params.nb.smoothing) + 12) / 7) * 100}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>1e-12</span>
                                        <span>1e-5</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-6">
                                {(!autoRetrain) && (
                                    <button
                                        onClick={trainModel}
                                        disabled={isTraining}
                                        className={`flex-1 flex gap-2 justify-center items-center py-2.5 rounded-lg font-bold transition-all duration-300 relative overflow-hidden group ${isTraining
                                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {!isTraining && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />}
                                        {isTraining ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                        <span className="relative z-10">{isTraining ? 'Training...' : 'Run Simulation'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={addToComparison}
                                    disabled={!lastResult || isTraining || comparisonList.some(r => r.id === lastResult?.id)}
                                    className={`flex-1 flex gap-2 justify-center items-center py-2.5 rounded-lg font-bold border transition-all duration-300 ${(!lastResult || isTraining || comparisonList.some(r => r.id === lastResult?.id))
                                        ? isDarkMode ? 'border-slate-700/50 text-slate-600 cursor-not-allowed bg-transparent' : 'border-slate-200 text-slate-300 cursor-not-allowed bg-transparent'
                                        : isDarkMode
                                            ? 'border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                            : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm'
                                        }`}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Compare Model</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Viz & Stats */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Visualization Card */}
                    <div className="relative w-full aspect-[21/9] min-h-[300px] sm:min-h-[450px]">
                        {isTraining && (
                            <div className="absolute top-4 right-4 z-20">
                                <span className={`text-xs font-mono text-emerald-500 animate-pulse px-2 py-1 rounded shadow-sm ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/80'}`}>Training...</span>
                            </div>
                        )}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedModel}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 w-full h-full flex items-center justify-center"
                            >
                                <ModelVisualizer selectedModel={selectedModel} params={params} isDarkMode={isDarkMode} />
                            </motion.div>
                        </AnimatePresence>
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
                                            <td className="px-6 py-4 font-bold text-emerald-500">{res.accuracy}</td>
                                            <td className="px-6 py-4">{res.sensitivity}</td>
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
                            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className={`px-6 py-4 border-b flex items-center justify-between relative z-10 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
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
                                            <div className="space-y-1.5">
                                                {comparisonList.map((res, i) => {
                                                    const val = parseFloat(res[metric]);
                                                    const pct = Math.round(val * 100);
                                                    const isBest = val === best;
                                                    const passes = val >= thresholds[metric];
                                                    return (
                                                        <div key={res.id} className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-mono w-[80px] sm:w-[120px] shrink-0 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                {res.modelName.split(' ').slice(-1)[0]}
                                                                {isBest && <span className="ml-1 text-amber-400">★</span>}
                                                            </span>
                                                            <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                                <motion.div
                                                                    className={`h-full rounded-full ${colors[i % colors.length]} ${passes ? '' : 'opacity-60'}`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.6, delay: i * 0.1 }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-bold w-10 text-right ${passes ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {/* Threshold marker */}
                                                <div className="relative h-0">
                                                    <div
                                                        className={`absolute top-0 w-px h-3 ${isDarkMode ? 'bg-red-500/60' : 'bg-red-400/60'}`}
                                                        style={{ left: `calc(${thresholds[metric] * 100}% + 120px + 12px)` }}
                                                    />
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
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95`}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ModelSelection;
