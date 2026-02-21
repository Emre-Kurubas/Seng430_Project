import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sliders, CheckCircle2, AlertCircle, BarChart3, Database, Split, Scale, Users } from 'lucide-react';

const DataPreparation = ({ isDarkMode, onNext, onPrev, domain, patientCount }) => {
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

    const handleApply = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsApplied(true);
            setIsAnimating(false);
        }, 1500); // Fake processing delay
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                        STEP 3 OF 7

                    </span>
                    <button
                        onClick={onNext}
                        disabled={!isApplied}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isApplied
                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
                                    onChange={(e) => setSplitRatio(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-slate-700"
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
                                    onChange={(e) => setMissingValueMethod(e.target.value)}
                                    className={`w-full p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                >
                                    <option value="median">Fill with the middle value (median) — recommended</option>
                                    <option value="mode">Fill with most common value (mode)</option>
                                    <option value="remove">Remove patients with missing data</option>
                                </select>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Serum Creatinine has 6.8% missing. Filling with the median preserves all 304 patients.
                                </p>
                            </div>

                            {/* Normalisation */}
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <Scale className="w-4 h-4 text-emerald-500" /> Normalisation
                                </label>
                                <select
                                    value={normalizationMethod}
                                    onChange={(e) => setNormalizationMethod(e.target.value)}
                                    className={`w-full p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                >
                                    <option value="z-score">Z-score (recommended for most models)</option>
                                    <option value="min-max">Min-Max Scaling (0-1)</option>
                                    <option value="none">None</option>
                                </select>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Age (0-100) and Serum Sodium (130-150) are on different scales. Normalisation prevents size confusion.
                                </p>
                            </div>

                            {/* Class Imbalance */}
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <Users className="w-4 h-4 text-emerald-500" /> Class Imbalance
                                </label>
                                <select
                                    value={imbalanceMethod}
                                    onChange={(e) => setImbalanceMethod(e.target.value)}
                                    className={`w-full p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                >
                                    <option value="smote">SMOTE — Create synthetic similar cases</option>
                                    <option value="none">None (Keep original distribution)</option>
                                </select>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Only 33% readmitted. SMOTE balances training data so the model learns both outcomes equally.
                                </p>
                            </div>

                            <button
                                onClick={handleApply}
                                disabled={isAnimating}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isAnimating
                                    ? 'bg-slate-500 cursor-wait'
                                    : isApplied
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                                    }`}
                            >
                                {isAnimating ? 'Processing...' : isApplied ? 'Update Settings' : 'Apply Preparation Settings'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visualizations */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Main Visualization Card */}
                    <div className={`p-6 rounded-xl border min-h-[500px] flex flex-col ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>

                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {isAnimating && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-10 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
                                >
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div className={`font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Applying transformations...</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isApplied && !isAnimating ? (
                            <div className="flex flex-col items-center justify-center flex-grow text-center space-y-4 opacity-50">
                                <BarChart3 className="w-16 h-16 text-slate-400" />
                                <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Configure settings on the left and click "Apply" to see the transformation results.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Normalisation Viz */}
                                <div>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center justify-between border-b pb-2 ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-100'}`}>
                                        <span>Before & After Normalisation — Ejection Fraction</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Before */}
                                        <div className="space-y-4">
                                            <div className={`text-center text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>BEFORE (raw values)</div>
                                            <div className="space-y-3">
                                                <div className="flex items-center text-xs">
                                                    <div className="w-16 text-right mr-3 opacity-70">Minimum</div>
                                                    <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-red-500 w-[14%] rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 text-right ml-3 font-mono">14%</div>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <div className="w-16 text-right mr-3 opacity-70">Average</div>
                                                    <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 w-[38%] rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 text-right ml-3 font-mono">38%</div>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <div className="w-16 text-right mr-3 opacity-70">Maximum</div>
                                                    <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 w-[80%] rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 text-right ml-3 font-mono">80%</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* After */}
                                        <div className="space-y-4 relative">
                                            <div className={`absolute -left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                            <div className={`text-center text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>AFTER (normalised 0–1)</div>
                                            <div className="space-y-3">
                                                <div className="flex items-center text-xs">
                                                    <div className="w-16 text-right mr-3 opacity-70">Minimum</div>
                                                    <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-red-500 w-[2%] rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 text-right ml-3 font-mono">0.00</div>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <div className="w-16 text-right mr-3 opacity-70">Average</div>
                                                    <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 w-[50%] rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 text-right ml-3 font-mono">0.50</div>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <div className="w-16 text-right mr-3 opacity-70">Maximum</div>
                                                    <div className="flex-grow bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 w-[100%] rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 text-right ml-3 font-mono">1.00</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Class Balance Viz */}
                                <div>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center justify-between border-b pb-2 ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-100'}`}>
                                        <span>Class Balance — Before & After SMOTE</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Before */}
                                        <div>
                                            <div className={`text-center text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>BEFORE</div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span>Not Readmitted</span>
                                                    <span className="font-mono">67%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 w-[67%]"></div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs mb-1 mt-3">
                                                    <span>Readmitted</span>
                                                    <span className="font-mono">33%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 w-[33%]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* After */}
                                        <div className="relative">
                                            <div className={`absolute -left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                            <div className={`text-center text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>AFTER SMOTE</div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span>Not Readmitted</span>
                                                    <span className="font-mono">50%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 w-[50%]"></div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs mb-1 mt-3">
                                                    <span>Readmitted</span>
                                                    <span className="font-mono">50%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[50%]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Success Message */}
                    <AnimatePresence>
                        {isApplied && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className={`p-4 rounded-xl border flex gap-4 ${isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
                            >
                                <div className={`p-2 rounded-full shrink-0 ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                                    <CheckCircle2 className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">Ready: Data is clean, split, and balanced.</h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-emerald-200/80' : 'text-emerald-900/80'}`}>
                                        We have set aside {testCount} patients to test the model later. The remaining {trainCount} patients are balanced and normalised for optimal training.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
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
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default DataPreparation;
