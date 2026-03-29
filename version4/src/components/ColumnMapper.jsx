import React, { useState, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Database, ShieldCheck, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * ColumnMapper — Data Schema Validator Modal
 *
 * Receives the actual columns from the loaded CSV (via `columns` prop).
 * The user must:
 *   1. Review each detected column
 *   2. Assign roles (Target, Number, Category, Ignore)
 *   3. Click "Validate Fields" — runs schema checks
 *   4. Click "Save Mapping" — only enabled after validation passes
 *
 * The parent learns about save via `onSave(schemaOK)`.
 */

const ROLE_OPTIONS = [
    'Target (what we predict)',
    'Number (measurement)',
    'Category',
    'Ignore (not a metric)',
];

const ColumnMapper = ({ isOpen, onClose, onSave, isDarkMode, columns: externalCols }) => {
    // Build editable state from external columns
    const [columns, setColumns] = useState(() => {
        if (externalCols && externalCols.length > 0) {
            return externalCols.map((col) => {
                // Auto-detect role
                let role = 'Number (measurement)';
                let status = 'success';
                if (col.isTarget) {
                    role = 'Target (what we predict)';
                } else if (col.type === 'Identifier') {
                    role = 'Ignore (not a metric)';
                    status = 'error';
                } else if (col.type === 'Category') {
                    role = 'Category';
                }
                if (col.missingPct > 0 && status !== 'error') {
                    status = 'warning';
                }
                return {
                    name: col.name,
                    detected: col.missingPct > 0
                        ? `${col.type} - ${col.missingPct.toFixed(1)}% missing`
                        : col.type,
                    role,
                    status,
                    type: col.type,
                    missingPct: col.missingPct,
                    isTarget: col.isTarget || false,
                };
            });
        }
        // Fallback: demo columns
        return [
            { name: 'Readmitted_30d', detected: 'Binary (0/1)', role: 'Target (what we predict)', status: 'success', type: 'Number', missingPct: 0, isTarget: true },
            { name: 'Age', detected: 'Number', role: 'Number (measurement)', status: 'success', type: 'Number', missingPct: 0 },
            { name: 'Ejection_Fraction', detected: 'Number', role: 'Number (measurement)', status: 'success', type: 'Number', missingPct: 0 },
            { name: 'Serum_Creatinine', detected: 'Number - 6.8% missing', role: 'Number (measurement)', status: 'warning', type: 'Number', missingPct: 6.8 },
            { name: 'Smoker', detected: 'Category', role: 'Category', status: 'success', type: 'Category', missingPct: 0 },
            { name: 'patient_id', detected: 'Identifier-like', role: 'Ignore (not a metric)', status: 'error', type: 'Identifier', missingPct: 0 },
        ];
    });

    const [isValidated, setIsValidated] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [validationSuccess, setValidationSuccess] = useState(false);

    // Guard AFTER hooks — never before
    if (!isOpen) return null;

    // Compute schema diagnostics
    const identifierCols = columns.filter(c => c.type === 'Identifier' || c.name.toLowerCase().includes('id'));
    const ignoredIdentifiers = identifierCols.filter(c => c.role === 'Ignore (not a metric)');
    const hasUnhandledIdentifiers = identifierCols.length > 0 && ignoredIdentifiers.length < identifierCols.length;

    const targetCount = columns.filter(c => c.role === 'Target (what we predict)').length;
    const missingCols = columns.filter(c => c.missingPct > 0);

    // Validation logic
    const handleValidate = () => {
        const errors = [];

        if (targetCount === 0) {
            errors.push('No target column selected. You must designate exactly one column as the target.');
        } else if (targetCount > 1) {
            errors.push(`Multiple target columns found (${targetCount}). Only one column can be the target.`);
        }

        if (hasUnhandledIdentifiers) {
            const unhandled = identifierCols.filter(c => c.role !== 'Ignore (not a metric)').map(c => c.name);
            errors.push(`Identifier column(s) "${unhandled.join(', ')}" should be set to "Ignore" to prevent data leakage.`);
        }

        const featureCols = columns.filter(c => c.role !== 'Target (what we predict)' && c.role !== 'Ignore (not a metric)');
        if (featureCols.length === 0) {
            errors.push('No feature columns remaining. The model needs at least one feature to learn from.');
        }

        setValidationErrors(errors);
        if (errors.length === 0) {
            setIsValidated(true);
            setValidationSuccess(true);
            // Update status of all columns to success after validation
            setColumns(prev => prev.map(col => ({
                ...col,
                status: col.role === 'Ignore (not a metric)' ? 'muted' : col.missingPct > 0 ? 'warning' : 'success'
            })));
        } else {
            setIsValidated(false);
            setValidationSuccess(false);
        }
    };

    const handleSave = () => {
        if (!isValidated) return;
        onSave(true, columns);
    };

    const handleRoleChange = (idx, newRole) => {
        const newCols = [...columns];
        newCols[idx] = { ...newCols[idx], role: newRole };
        setColumns(newCols);
        // Reset validation when user changes roles
        setIsValidated(false);
        setValidationSuccess(false);
        setValidationErrors([]);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                {/* Premium Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] ring-1 ${isDarkMode ? 'bg-slate-900/90 ring-white/10' : 'bg-white/95 ring-black/5'} backdrop-blur-xl`}
                >
                    {/* Decorative Background Orbs */}
                    <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
                    <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

                    {/* Header */}
                    <div className={`relative px-8 py-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Data Schema Validator
                                </h2>
                                <p className={`text-sm mt-1 max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Assign a clinical role to each data column. Validate the schema, then save to unlock Step 3.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative z-10">
                        {/* Left Panel: Global Settings */}
                        <div className={`w-full lg:w-1/3 p-8 space-y-8 flex flex-col border-r overflow-y-auto ${isDarkMode ? 'border-slate-800 bg-slate-800/20' : 'border-slate-200 bg-slate-50/50'}`}>

                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <label className={`block text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Predictive Task
                                    </label>
                                    <div className="relative group">
                                        <select className={`w-full p-4 rounded-xl border appearance-none text-sm font-medium transition-all focus:ring-2 focus:outline-none ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-200 focus:ring-indigo-500/50 hover:border-slate-500' : 'bg-white border-slate-300 text-slate-700 focus:ring-indigo-500/30 hover:border-slate-400'}`}>
                                            <option>Binary classification (Yes / No outcome)</option>
                                            <option>Regression (Predict a number)</option>
                                            <option>Multi-class classification</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                            <ChevronRight className={`w-4 h-4 rotate-90 transition-transform group-hover:translate-y-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`block text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Target Column
                                    </label>
                                    <div className="relative group">
                                        <select 
                                            className={`w-full p-4 rounded-xl border appearance-none text-sm font-bold transition-all focus:ring-2 focus:outline-none ${isDarkMode ? 'bg-slate-900/50 border-indigo-500/50 text-indigo-300 focus:ring-indigo-500/50 hover:border-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700 focus:ring-indigo-500/30 hover:border-indigo-300'}`}
                                            value={columns.find(c => c.role === 'Target (what we predict)')?.name || ''}
                                            onChange={(e) => {
                                                const selectedName = e.target.value;
                                                setColumns(prev => prev.map(col => {
                                                    if (col.name === selectedName) return { ...col, role: 'Target (what we predict)' };
                                                    if (col.role === 'Target (what we predict)') return { ...col, role: 'Number (measurement)' };
                                                    return col;
                                                }));
                                                setIsValidated(false);
                                                setValidationSuccess(false);
                                            }}
                                        >
                                            {columns.filter(c => c.role === 'Target (what we predict)').map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                            {columns.filter(c => c.role !== 'Target (what we predict)').map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                            <ChevronRight className={`w-4 h-4 rotate-90 transition-transform group-hover:translate-y-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Validation Status Card */}
                                {!validationSuccess && (
                                    <div className={`p-5 rounded-2xl border backdrop-blur-md ${isDarkMode ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50 border-amber-200/50'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>Action Required</span>
                                            </div>
                                            {identifierCols.length > 0 && (
                                                <div className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-200/50 text-amber-800'}`}>
                                                    {identifierCols.length} Identifier{identifierCols.length > 1 ? 's' : ''} Found
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`} />
                                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-amber-200/80' : 'text-amber-900/80'}`}>
                                                {identifierCols.length > 0 ? (
                                                    <>
                                                        <span className="font-semibold text-amber-500">{identifierCols.map(c => c.name).join(', ')}</span> appear{identifierCols.length === 1 ? 's' : ''} to be identifier column{identifierCols.length > 1 ? 's' : ''}. Set to <span className="font-bold border-b border-amber-500/50 pb-0.5">"Ignore"</span> so they don&apos;t mislead the model.
                                                    </>
                                                ) : (
                                                    <>Review each column role, then click <span className="font-bold">Validate Fields</span> to check the schema.</>
                                                )}
                                            </p>
                                        </div>

                                        {/* Missing data info */}
                                        {missingCols.length > 0 && (
                                            <div className={`mt-3 pt-3 border-t text-sm ${isDarkMode ? 'border-amber-500/10 text-amber-200/70' : 'border-amber-200 text-amber-800/70'}`}>
                                                <span className="font-semibold">Missing data:</span> {missingCols.map(c => `${c.name} (${c.missingPct.toFixed(1)}%)`).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Validation Success Card */}
                                {validationSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`p-5 rounded-2xl border backdrop-blur-md ${isDarkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Schema Valid</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-emerald-200/80' : 'text-emerald-800'}`}>
                                                All columns validated successfully. Click <span className="font-bold">"Save Mapping"</span> to unlock Step 3.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Validation Errors */}
                                {validationErrors.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border space-y-2 ${isDarkMode ? 'bg-red-900/15 border-red-500/25' : 'bg-red-50 border-red-200'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                                            <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Validation Failed</span>
                                        </div>
                                        {validationErrors.map((err, i) => (
                                            <p key={i} className={`text-sm leading-relaxed flex items-start gap-2 ${isDarkMode ? 'text-red-200/80' : 'text-red-700'}`}>
                                                <span className="text-red-500 font-bold">•</span> {err}
                                            </p>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleValidate}
                                    className={`py-3.5 rounded-xl border text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 shadow-lg' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm'}`}
                                >
                                    {validationSuccess ? '✓ Validated' : 'Validate Fields'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!isValidated}
                                    className={`relative py-3.5 rounded-xl overflow-hidden group transition-all shadow-lg ${isValidated
                                        ? 'hover:-translate-y-0.5 active:translate-y-0 hover:shadow-emerald-500/25 cursor-pointer'
                                        : 'opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className={`absolute inset-0 transition-transform duration-500 ${isValidated ? 'bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:scale-110' : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                                    <span className="relative z-10 text-sm font-bold text-white flex items-center justify-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Save Mapping
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Right Panel: Column Details */}
                        <div className="w-full lg:w-2/3 flex flex-col relative">
                            {/* Inner Header */}
                            <div className={`px-8 py-5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Detected Columns ({columns.length})</h3>
                                <div className={`flex items-center gap-5 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>Ready</span>
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>Needs Review</span>
                                </div>
                            </div>

                            {/* Column List */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                                <div className={`grid grid-cols-12 gap-4 px-6 mx-2 text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <div className="col-span-4">Feature Name</div>
                                    <div className="col-span-4">Data Type</div>
                                    <div className="col-span-4">Assigned Role</div>
                                </div>

                                {columns.map((col, idx) => (
                                    <motion.div
                                        key={idx}
                                        layoutId={col.name}
                                        className={`grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl border transition-all duration-300 hover:shadow-md ${isDarkMode
                                            ? 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/80'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className={`col-span-4 font-bold text-sm truncate flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${col.status === 'error' ? 'bg-red-500' : col.status === 'warning' ? 'bg-amber-500' : col.status === 'muted' ? 'bg-slate-500' : 'bg-emerald-500'}`} />
                                            {col.name}
                                        </div>

                                        <div className="col-span-4">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${col.status === 'warning'
                                                ? (isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
                                                : col.status === 'error'
                                                    ? (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200')
                                                    : (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                                }`}>
                                                {col.detected}
                                            </span>
                                        </div>

                                        <div className="col-span-4 relative group">
                                            <select
                                                value={col.role}
                                                onChange={(e) => handleRoleChange(idx, e.target.value)}
                                                className={`w-full p-2.5 rounded-xl appearance-none text-sm font-medium cursor-pointer transition-all outline-none focus:ring-2 ${isDarkMode
                                                    ? 'bg-slate-900/60 border-slate-600 text-slate-200 focus:ring-indigo-500/50 hover:border-slate-400 border'
                                                    : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-indigo-500/30 hover:border-slate-300 border'
                                                    } ${col.status === 'error' && isDarkMode ? 'border-amber-500/50 bg-amber-900/10' : ''}`}
                                            >
                                                {ROLE_OPTIONS.map(opt => (
                                                    <option key={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                <ChevronRight className={`w-4 h-4 rotate-90 transition-transform group-hover:translate-y-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ColumnMapper;
