import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertTriangle, ArrowRight, AlertCircle, Database } from 'lucide-react';
import ColumnMapper from './ColumnMapper';
import Papa from 'papaparse';

// ─── Specialty → CSV filename mapping ────────────────────────────────────────
const DATASET_MAP = {
    'Cardiology': 'cardiology.csv',
    'Radiology': 'radiology.csv',
    'Nephrology': 'nephrology.csv',
    'Oncology — Breast': 'oncology_breast.csv',
    "Neurology — Parkinson's": 'neurology_parkinsons.csv',
    'Endocrinology — Diabetes': 'endocrinology_diabetes.csv',
    'Hepatology — Liver': 'hepatology_liver.csv',
    'Cardiology — Stroke': 'cardiology_stroke.csv',
    'Mental Health': 'mental_health.csv',
    'Pulmonology — COPD': 'pulmonology_copd.csv',
    'Haematology — Anaemia': 'haematology_anaemia.csv',
    'Dermatology': 'dermatology.csv',
    'Ophthalmology': 'ophthalmology.csv',
    'Orthopaedics — Spine': 'orthopaedics_spine.csv',
    'ICU / Sepsis': 'icu_sepsis.csv',
    'Obstetrics — Fetal Health': 'obstetrics_fetal.csv',
    'Cardiology — Arrhythmia': 'cardiology_arrhythmia.csv',
    'Oncology — Cervical': 'oncology_cervical.csv',
    'Thyroid / Endocrinology': 'thyroid_endocrine.csv',
    'Pharmacy — Readmission': 'pharmacy_readmission.csv',
};

const DataExploration = ({ isDarkMode, onNext, onPrev, domain, onPatientCountChange }) => {
    const [useDefaultDataset, setUseDefaultDataset] = useState(true);
    const [targetColumn, setTargetColumn] = useState('');
    const [isMapperOpen, setIsMapperOpen] = useState(false);
    const [isMapped, setIsMapped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [classBalance, setClassBalance] = useState({});
    const [measurements, setMeasurements] = useState([]);
    const [stats, setStats] = useState({ patients: 0, measurements: 0, missing: '0%' });
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Re-load when domain changes or user switches back to default dataset
    React.useEffect(() => {
        if (useDefaultDataset) {
            handleDefaultDataset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useDefaultDataset, domain?.name]);

    const processCSVResults = (results) => {
        const data = results.data;
        const fields = results.meta.fields;
        if (!data || data.length === 0) { setIsLoading(false); return; }

        const patients = data.length;
        const numMeasurements = fields.length;
        let totalCells = patients * numMeasurements;
        let emptyCells = 0;

        const newMeasurements = fields.map(field => {
            let missingCount = 0;
            data.forEach(row => {
                const val = row[field];
                if (val === null || val === undefined || val === '') {
                    missingCount++;
                    emptyCells++;
                }
            });
            const missingPctVal = (missingCount / patients) * 100;
            const firstVal = data.find(r => r[field] !== null && r[field] !== undefined && r[field] !== '')?.[field];
            let type = !isNaN(Number(firstVal)) ? 'Number' : 'Category';
            if (field.toLowerCase().includes('id')) type = 'Identifier';
            let action = 'Ready';
            let status = 'ready';
            if (type === 'Identifier') { action = 'Exclude — Not a clinical measurement'; status = 'exclude'; }
            else if (missingPctVal > 0) { action = 'Fill Missing Values'; status = 'warning'; }
            return { name: field, type, missing: missingPctVal.toFixed(1) + '%', action, status };
        });

        const missingTotalPct = ((emptyCells / totalCells) * 100).toFixed(1);
        setStats({ patients, measurements: numMeasurements, missing: missingTotalPct + '%' });
        setMeasurements(newMeasurements);

        // Auto-set target column to last field
        const lastField = fields[fields.length - 1];
        setTargetColumn(lastField || '');

        // Compute class balance
        if (lastField) {
            const counts = {};
            data.forEach(row => {
                const v = row[lastField];
                if (v !== null && v !== undefined && v !== '') {
                    counts[v] = (counts[v] || 0) + 1;
                }
            });
            setClassBalance(counts);
        }

        onPatientCountChange?.(patients);
        setIsLoading(false);
    };

    const handleDefaultDataset = () => {
        setIsLoading(true);
        setMeasurements([]);
        setClassBalance({});
        const filename = DATASET_MAP[domain?.name] || 'cardiology.csv';
        Papa.parse('/datasets/' + filename, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: processCSVResults,
            error: (err) => {
                console.error('Error loading dataset:', err);
                setIsLoading(false);
            }
        });
    };

    const handleFileUpload = (e) => {
        const file = e.type === 'drop' ? e.dataTransfer.files[0] : e.target.files[0];
        if (!file) return;
        setIsLoading(true);
        setMeasurements([]);
        setClassBalance({});
        setUploadedFileName(file.name);
        setUseDefaultDataset(false);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: processCSVResults,
            error: (err) => {
                console.error('Error loading dataset:', err);
                setIsLoading(false);
            }
        });
    };

    const handleMapperSave = () => {
        setIsMapped(true);
        setIsMapperOpen(false);
    };

    // ─── Class Balance helper ─────────────────────────────────────────────────
    const renderClassBalance = () => {
        if (Object.keys(classBalance).length === 0) {
            return (
                <p className={'text-sm ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                    {isLoading ? 'Loading dataset...' : 'Load a dataset to see class distribution.'}
                </p>
            );
        }
        const total = Object.values(classBalance).reduce((a, b) => a + b, 0);
        const entries = Object.entries(classBalance);
        const maxCount = Math.max(...Object.values(classBalance));
        const majorityPct = total > 0 ? Math.round((maxCount / total) * 100) : 0;
        const isImbalanced = majorityPct > 60;
        const colors = ['bg-slate-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500'];

        const bars = entries.map(([label, count], i) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
                <div key={label} className="flex items-center gap-2 sm:gap-4 text-sm">
                    <div className={'w-20 sm:w-40 text-right font-medium truncate ' + (isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                        {label}
                    </div>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: pct + '%' }}
                            transition={{ duration: 1, ease: 'easeOut', delay: i * 0.15 }}
                            className={'h-full ' + colors[i % colors.length] + ' rounded-full'}
                        />
                    </div>
                    <div className={'w-10 sm:w-12 font-bold ' + (isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{pct}%</div>
                </div>
            );
        });

        return (
            <div>
                <div className="space-y-4 mb-6">{bars}</div>
                {isImbalanced && (
                    <div className={'p-3 rounded-lg flex gap-3 text-sm ' + (isDarkMode
                        ? 'bg-amber-900/20 text-amber-200 border border-amber-800/50'
                        : 'bg-orange-50 text-orange-800 border border-orange-100')}>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                        <p>
                            <span className="font-bold">Imbalance detected:</span> The majority class makes up {majorityPct}% of the data. A lazy model could exploit this — we will handle it in Step 3.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className={'p-4 sm:p-6 rounded-2xl border shadow-sm ' + (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between mb-4">
                    <span className={'text-xs font-bold px-2 py-1 rounded-full ' + (isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700')}>
                        STEP 2 OF 7
                    </span>
                    <button
                        onClick={onNext}
                        disabled={!isMapped}
                        className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ' + (isMapped
                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed')}
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <h2 className={'text-2xl font-bold mb-2 ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                    Data Exploration — Understanding Your Patient Dataset
                </h2>
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Before training any model, we examine what data is available. Use the default dataset or upload your own CSV file of de-identified patient records.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Data Source */}
                    <div className={'p-5 rounded-xl border shadow-sm ' + (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')}>
                        <h3 className={'text-sm font-semibold mb-4 uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Data Source</h3>
                        <div className={'flex p-1 rounded-lg mb-6 ' + (isDarkMode ? 'bg-slate-900' : 'bg-slate-100')}>
                            <button
                                onClick={() => setUseDefaultDataset(true)}
                                className={'flex-1 py-2 text-sm font-medium rounded-md transition-all ' + (useDefaultDataset
                                    ? (isDarkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow')
                                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'))}
                            >
                                {useDefaultDataset && isLoading ? 'Loading...' : 'Use Default Dataset'}
                            </button>
                            <button
                                onClick={() => setUseDefaultDataset(false)}
                                className={'flex-1 py-2 text-sm font-medium rounded-md transition-all ' + (!useDefaultDataset
                                    ? (isDarkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow')
                                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'))}
                            >
                                Upload Your CSV
                            </button>
                        </div>

                        {!useDefaultDataset && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label
                                    className={'relative overflow-hidden border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ' + (isDarkMode
                                        ? `border-slate-700 hover:bg-slate-800/50 ${isDragging ? 'bg-slate-800/50 border-indigo-500' : 'bg-slate-800/30'}`
                                        : `border-slate-300 hover:bg-slate-100 ${isDragging ? 'bg-slate-100 border-indigo-500' : 'bg-slate-50'}`)}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
                                >
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                    />
                                    <div className={'p-3 rounded-full mb-3 ' + (isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50')}>
                                        <Upload className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <p className={'font-medium mb-1 z-10 ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>
                                        {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Drag & drop your CSV file here'}
                                    </p>
                                    <p className={'text-xs z-10 ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        or click to browse • .csv only • max 50 MB
                                    </p>
                                </label>

                                <div className="mt-3 flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">🔒</span>
                                    <p className={'text-xs leading-relaxed ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        Your file is processed in this session only. It is never stored or shared with anyone.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Target Column */}
                    <div className="space-y-3">
                        <label className={'block text-sm font-medium ' + (isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                            Target Column (What We Want to Predict)
                        </label>
                        <div className="relative">
                            {(() => {
                                const formatColumnName = (col) => {
                                    const mapping = {
                                        'DEATH_EVENT': 'Readmitted within 30 days (Yes / No)',
                                        'diagnosis': 'Diagnosis category (Malignant / Benign)',
                                        'Outcome': 'Clinical Outcome (Yes / No)',
                                        'classification': 'Disease Classification (CKD / Not CKD)',
                                        'stroke': 'Stroke occurrence (Yes / No)',
                                        'SepsisLabel': 'Sepsis onset (Yes / No)',
                                        'Biopsy': 'Biopsy Result (Yes / No)',
                                        'arrhythmia': 'Arrhythmia presence (Yes / No)'
                                    };
                                    if (mapping[col]) return mapping[col];

                                    // Fallback text formatting: "serum_sodium" -> "Serum Sodium"
                                    return col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                };

                                return (
                                    <select
                                        value={targetColumn}
                                        onChange={(e) => setTargetColumn(e.target.value)}
                                        className={'w-full p-3 pr-10 rounded-lg appearance-none border outline-none focus:ring-2 focus:ring-indigo-500 ' + (isDarkMode
                                            ? 'bg-slate-800 border-slate-600 text-white'
                                            : 'bg-white border-slate-300 text-slate-900')}
                                    >
                                        {measurements.map(m => (
                                            <option key={m.name} value={m.name}>
                                                {formatColumnName(m.name)}
                                            </option>
                                        ))}
                                    </select>
                                );
                            })()}
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <p className={'text-xs ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            This is the outcome the model will learn to predict.
                        </p>
                    </div>

                    {/* Mapper Button */}
                    <button
                        onClick={() => setIsMapperOpen(true)}
                        className={'w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-medium transition-all ' + (isDarkMode
                            ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50')}
                    >
                        <Database className="w-4 h-4" />
                        Open Column Mapper & Validate
                    </button>

                    {!isMapped && (
                        <div className={'p-4 rounded-lg flex gap-3 border ' + (isDarkMode
                            ? 'bg-red-900/20 border-red-800/50 text-red-200'
                            : 'bg-red-50 border-red-100 text-red-700')}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                            <div className="text-sm">
                                <span className="font-bold">Action required:</span> You must open the Column Mapper, validate the schema, and save before continuing to Step 3.
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Class Balance */}
                    <div className={'p-6 rounded-xl border shadow-sm ' + (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')}>
                        <h3 className={'text-xs font-bold uppercase tracking-wider mb-6 ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            Class Balance — Distribution of &quot;{targetColumn}&quot;
                        </h3>
                        {renderClassBalance()}
                    </div>

                    {/* Measurements Table */}
                    <div className={'overflow-hidden rounded-xl border shadow-sm ' + (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')}>
                        <div className={'px-6 py-4 border-b ' + (isDarkMode ? 'border-slate-700' : 'border-slate-100')}>
                            <h3 className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Patient Measurements (Features)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className={isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-50'}>
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Measurement</th>
                                        <th className="px-6 py-3 font-semibold">Type</th>
                                        <th className="px-6 py-3 font-semibold">Missing?</th>
                                        <th className="px-6 py-3 font-semibold">Action Needed</th>
                                    </tr>
                                </thead>
                                <tbody className={'divide-y ' + (isDarkMode ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700')}>
                                    {measurements.map((item, idx) => (
                                        <tr key={idx} className={(isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50/80') + ' transition-colors'}>
                                            <td className="px-6 py-4 font-medium">{item.name}</td>
                                            <td className="px-6 py-4">{item.type}</td>
                                            <td className="px-6 py-4">{item.missing}</td>
                                            <td className="px-6 py-4">
                                                <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' + (
                                                    item.status === 'ready' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200') :
                                                        item.status === 'warning' ? (isDarkMode ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200') :
                                                            (isDarkMode ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200')
                                                )}>
                                                    {item.action}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={'p-6 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 ' + (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')}>
                    <div className={'text-3xl font-bold font-serif ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{stats.patients}</div>
                    <div className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Patients</div>
                </div>
                <div className={'p-6 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 ' + (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')}>
                    <div className={'text-3xl font-bold font-serif ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{stats.measurements}</div>
                    <div className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Measurements</div>
                </div>
                <div className={'p-6 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 ' + (isDarkMode ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                    <div className={'text-3xl font-bold font-serif ' + (isDarkMode ? 'text-amber-400' : 'text-amber-600')}>{stats.missing}</div>
                    <div className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-amber-500/80' : 'text-amber-600/80')}>Missing Data</div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={onPrev}
                    className={'px-6 py-2.5 rounded-lg border font-medium transition-colors ' + (isDarkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50')}
                >
                    Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={!isMapped}
                    className={'flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all ' + (isMapped
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed')}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Mapper Modal */}
            <AnimatePresence>
                {isMapperOpen && (
                    <ColumnMapper
                        isOpen={isMapperOpen}
                        onClose={() => setIsMapperOpen(false)}
                        onSave={handleMapperSave}
                        isDarkMode={isDarkMode}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DataExploration;
