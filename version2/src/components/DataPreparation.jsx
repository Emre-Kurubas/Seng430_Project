import React, { useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sliders, CheckCircle2, AlertCircle, BarChart3, Database, Split, Scale, Users } from 'lucide-react';

// ─── Animated Before/After Bar ─────────────────────────────────────────────
const AnimatedBar = ({ label, value, displayValue, color, delay = 0, isDarkMode }) => (
    <div className="flex items-center text-xs">
        <div className={`w-16 text-right mr-3 opacity-70 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{label}</div>
        <div className={`flex-grow h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay }}
                className={`h-full ${color} rounded-full`}
            />
        </div>
        <div className={`w-14 text-right ml-3 font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{displayValue}</div>
    </div>
);

// ─── Normalisation Before/After ─────────────────────────────────────────────
// Real statistics from cardiology.csv — Ejection Fraction column:
//   n=299, min=14, mean=38.08, max=80, std=11.83
//   Z-score formula: z = (x − μ) / σ
//   Min-Max formula: x' = (x − min) / (max − min)
const NormalisationViz = React.memo(({ normMethod, isDarkMode }) => {
    // Raw values for "Ejection Fraction" (from cardiology.csv)
    const raw = { min: 14, avg: 38, max: 80 };

    // Normalised values depend on method
    let normed;
    if (normMethod === 'min-max') {
        // (14-14)/(80-14)=0.00, (38-14)/(80-14)=0.36, (80-14)/(80-14)=1.00
        normed = { min: { val: 0, pct: 2 }, avg: { val: 0.36, pct: 36 }, max: { val: 1.00, pct: 100 } };
    } else if (normMethod === 'z-score') {
        // (14-38.08)/11.83 = -2.04,  (38.08-38.08)/11.83 = 0.00,  (80-38.08)/11.83 = 3.55
        normed = { min: { val: -2.04, pct: 3 }, avg: { val: 0.00, pct: 50 }, max: { val: 3.55, pct: 97 } };
    } else {
        // 'none' — same as raw
        normed = { min: { val: raw.min, pct: raw.min }, avg: { val: raw.avg, pct: raw.avg }, max: { val: raw.max, pct: raw.max } };
    }

    const methodLabel = normMethod === 'min-max' ? '0–1' : normMethod === 'z-score' ? 'z-score' : 'raw';

    return (
        <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center justify-between border-b pb-2 ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-100'}`}>
                <span>Before & After Normalisation — Ejection Fraction</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{methodLabel}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="space-y-4">
                    <div className={`text-center text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>BEFORE (raw values)</div>
                    <div className="space-y-3">
                        <AnimatedBar label="Minimum" value={raw.min} displayValue={`${raw.min}%`} color="bg-red-500" delay={0} isDarkMode={isDarkMode} />
                        <AnimatedBar label="Average" value={raw.avg} displayValue={`${raw.avg}%`} color="bg-indigo-500" delay={0.15} isDarkMode={isDarkMode} />
                        <AnimatedBar label="Maximum" value={raw.max} displayValue={`${raw.max}%`} color="bg-emerald-500" delay={0.3} isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* After */}
                <div className="space-y-4 relative">
                    <div className={`absolute -left-4 top-1/2 -translate-y-1/2 hidden md:block ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className={`text-center text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>AFTER (normalised {methodLabel})</div>
                    <div className="space-y-3">
                        <AnimatedBar label="Minimum" value={normed.min.pct} displayValue={typeof normed.min.val === 'number' ? normed.min.val.toFixed(2) : normed.min.val} color="bg-red-500" delay={0.5} isDarkMode={isDarkMode} />
                        <AnimatedBar label="Average" value={normed.avg.pct} displayValue={typeof normed.avg.val === 'number' ? normed.avg.val.toFixed(2) : normed.avg.val} color="bg-indigo-500" delay={0.65} isDarkMode={isDarkMode} />
                        <AnimatedBar label="Maximum" value={normed.max.pct} displayValue={typeof normed.max.val === 'number' ? normed.max.val.toFixed(2) : normed.max.val} color="bg-emerald-500" delay={0.8} isDarkMode={isDarkMode} />
                    </div>
                </div>
            </div>
        </div>
    );
});

// ─── SMOTE Before/After ─────────────────────────────────────────────────────
// Real class distribution from cardiology.csv:
//   DEATH_EVENT=0 → 203 patients (68%)
//   DEATH_EVENT=1 →  96 patients (32%)
const ClassBalanceViz = React.memo(({ imbalanceMethod, isDarkMode }) => {
    const beforeMajority = 68;
    const beforeMinority = 32;

    let afterMajority, afterMinority, afterLabel;
    if (imbalanceMethod === 'smote') {
        afterMajority = 50;
        afterMinority = 50;
        afterLabel = 'AFTER SMOTE';
    } else {
        afterMajority = beforeMajority;
        afterMinority = beforeMinority;
        afterLabel = 'NO CHANGE';
    }

    return (
        <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center justify-between border-b pb-2 ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-100'}`}>
                <span>Class Balance — Before & After {imbalanceMethod === 'smote' ? 'SMOTE' : '(No Resampling)'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div>
                    <div className={`text-center text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>BEFORE</div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Not Readmitted</span>
                            <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{beforeMajority}%</span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${beforeMajority}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                className="h-full bg-indigo-600 rounded-full"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs mb-1 mt-3">
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Readmitted</span>
                            <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{beforeMinority}%</span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${beforeMinority}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.35 }}
                                className="h-full bg-amber-500 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* After */}
                <div className="relative">
                    <div className={`absolute -left-4 top-1/2 -translate-y-1/2 hidden md:block ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className={`text-center text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{afterLabel}</div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Not Readmitted</span>
                            <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{afterMajority}%</span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${afterMajority}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                                className={`h-full rounded-full ${imbalanceMethod === 'smote' ? 'bg-indigo-600' : 'bg-indigo-600'}`}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs mb-1 mt-3">
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Readmitted</span>
                            <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{afterMinority}%</span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${afterMinority}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.75 }}
                                className={`h-full rounded-full ${imbalanceMethod === 'smote' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ─── Visualisations Panel ───────────────────────────────────────────────────
const VisualizationsPanel = React.memo(({ isApplied, isAnimating, isDarkMode, normMethod, imbalanceMethod }) => {
    return (
        <>
            {/* Loading Overlay */}
            <AnimatePresence>
                {isAnimating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-2 w-8 h-8 border-4 border-indigo-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
                        </div>
                        <div className={`font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Applying transformations...</div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Processing normalisation, handling missing values, balancing classes...</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isApplied && !isAnimating ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center space-y-4 opacity-50 py-16">
                    <BarChart3 className="w-16 h-16 text-slate-400" />
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Configure settings on the left and click &quot;Apply&quot; to see the transformation results.
                    </p>
                    <p className={`text-sm max-w-md ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        You can adjust the train/test split, missing value strategy, normalisation method, and class imbalance handling.
                    </p>
                </div>
            ) : isApplied && !isAnimating ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col space-y-8"
                >
                    {/* Normalisation Viz */}
                    <NormalisationViz normMethod={normMethod} isDarkMode={isDarkMode} />

                    {/* Class Balance Viz */}
                    <ClassBalanceViz imbalanceMethod={imbalanceMethod} isDarkMode={isDarkMode} />
                </motion.div>
            ) : null}
        </>
    );
});

const DataPreparation = ({ isDarkMode, onNext, onPrev, patientCount }) => {
    const [splitRatio, setSplitRatio] = useState(80);
    const [missingValueMethod, setMissingValueMethod] = useState('median');
    const [normalizationMethod, setNormalizationMethod] = useState('z-score');
    const [imbalanceMethod, setImbalanceMethod] = useState('smote');
    const [isApplied, setIsApplied] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Use real patient count from DataExploration; fallback to 300
    const totalPatients = patientCount > 0 ? patientCount : 300;
    const trainCount = Math.round(totalPatients * (splitRatio / 100));
    const testCount = totalPatients - trainCount;

    const handleApply = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsApplied(true);
            setIsAnimating(false);
        }, 1500); // Fake processing delay
    }, []);

    // For re-apply tracking
    const handleSettingsChange = (setter) => (e) => {
        setter(typeof e === 'object' ? e.target.value : e);
        // If already applied, mark as needing re-apply
        if (isApplied) {
            setIsApplied(false);
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className={`p-6 rounded-2xl border step-accent ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                        STEP 3 OF 7
                    </span>
                    <button
                        onClick={onNext}
                        disabled={!isApplied}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isApplied
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                            : isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Data Preparation — Cleaning & Organising Your Data
                </h2>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Before a model can learn, the data must be clean, consistent, and split into two groups: one for training (learning) and one for testing (checking accuracy on patients the model has never seen).
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Settings */}
                <div className="lg:col-span-4 space-y-6">
                    <div className={`p-6 rounded-xl border h-full ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-6">
                            <Sliders className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Preparation Settings</h3>
                        </div>

                        <div className="space-y-8">
                            {/* Train / Test Split */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        <Split className="w-4 h-4 text-emerald-500" /> Train / Test Split
                                    </label>
                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{splitRatio}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="60"
                                    max="90"
                                    value={splitRatio}
                                    onChange={(e) => {
                                        setSplitRatio(parseInt(e.target.value));
                                        if (isApplied) setIsApplied(false);
                                    }}
                                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>60% train</span>
                                    <span>90% train</span>
                                </div>
                                <p className={`text-xs p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    Training: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{trainCount}</strong> patients • Testing: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{testCount}</strong> patients
                                    <br />
                                    <span className="opacity-80 mt-1 block">The model learns from the training group and is tested on the testing group.</span>
                                </p>
                            </div>

                            {/* Missing Values */}
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <Database className="w-4 h-4 text-emerald-500" /> Handling Missing Values
                                </label>
                                <select
                                    value={missingValueMethod}
                                    onChange={handleSettingsChange(setMissingValueMethod)}
                                    className={`w-full p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                >
                                    <option value="median">Fill with the middle value (median) — recommended</option>
                                    <option value="mode">Fill with most common value (mode)</option>
                                    <option value="remove">Remove patients with missing data</option>
                                </select>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {missingValueMethod === 'median' && 'Serum Creatinine has 6.8% missing. Filling with the median preserves all patients.'}
                                    {missingValueMethod === 'mode' && 'Fill missing values with the most frequently occurring value in each column.'}
                                    {missingValueMethod === 'remove' && 'Rows with any missing values will be removed. This may reduce your dataset size.'}
                                </p>
                            </div>

                            {/* Normalisation */}
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <Scale className="w-4 h-4 text-emerald-500" /> Normalisation
                                </label>
                                <select
                                    value={normalizationMethod}
                                    onChange={handleSettingsChange(setNormalizationMethod)}
                                    className={`w-full p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                >
                                    <option value="z-score">Z-score (recommended for most models)</option>
                                    <option value="min-max">Min-Max Scaling (0-1)</option>
                                    <option value="none">None</option>
                                </select>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {normalizationMethod === 'z-score' && 'Centers data around mean (0) with standard deviation of 1. Best for algorithms sensitive to feature scales.'}
                                    {normalizationMethod === 'min-max' && 'Scales all values to the range [0, 1]. Useful when you need bounded values.'}
                                    {normalizationMethod === 'none' && 'No scaling applied. Use only with tree-based models that are scale-invariant.'}
                                </p>
                            </div>

                            {/* Class Imbalance */}
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <Users className="w-4 h-4 text-emerald-500" /> Class Imbalance
                                </label>
                                <select
                                    value={imbalanceMethod}
                                    onChange={handleSettingsChange(setImbalanceMethod)}
                                    className={`w-full p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                >
                                    <option value="smote">SMOTE — Create synthetic similar cases</option>
                                    <option value="none">None (Keep original distribution)</option>
                                </select>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {imbalanceMethod === 'smote' && 'Only 32% readmitted. SMOTE balances training data so the model learns both outcomes equally.'}
                                    {imbalanceMethod === 'none' && 'Keep the original class distribution. The model may bias towards the majority class.'}
                                </p>
                            </div>

                            <button
                                onClick={handleApply}
                                disabled={isAnimating}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isAnimating
                                    ? 'bg-slate-500 cursor-wait'
                                    : isApplied
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {isAnimating ? 'Processing...' : isApplied ? '✓ Settings Applied' : 'Apply Preparation Settings'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visualizations */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Main Visualization Card */}
                    <div className={`p-6 rounded-xl border min-h-[500px] flex flex-col ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>

                        <VisualizationsPanel
                            isApplied={isApplied}
                            isAnimating={isAnimating}
                            isDarkMode={isDarkMode}
                            normMethod={normalizationMethod}
                            imbalanceMethod={imbalanceMethod}
                        />

                    </div>

                    {/* ── GREEN SUCCESS BANNER ── */}
                    <AnimatePresence>
                        {isApplied && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className={`p-5 rounded-xl border-2 flex gap-4 shadow-lg ${isDarkMode
                                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}
                            >
                                <div className={`p-2.5 rounded-full shrink-0 ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                                    <CheckCircle2 className={`w-7 h-7 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">✅ Ready: Data is clean, split, and balanced.</h4>
                                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-emerald-200/80' : 'text-emerald-900/80'}`}>
                                        We have set aside <strong>{testCount}</strong> patients to test the model later. The remaining <strong>{trainCount}</strong> patients are balanced and normalised for optimal training.
                                    </p>
                                    <div className={`mt-3 flex flex-wrap gap-3 text-xs font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                        <span className={`px-2 py-1 rounded-full border ${isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-100'}`}>
                                            Split: {splitRatio}/{100 - splitRatio}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full border ${isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-100'}`}>
                                            Missing: {missingValueMethod}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full border ${isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-100'}`}>
                                            Norm: {normalizationMethod}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full border ${isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-100'}`}>
                                            Balance: {imbalanceMethod}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className={`flex justify-between items-center pt-8 border-t mt-8 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
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
                    disabled={!isApplied}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all ${isApplied
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 active:scale-95 shadow-emerald-500/20'
                        : isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default DataPreparation;
