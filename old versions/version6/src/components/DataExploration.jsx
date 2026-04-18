import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertTriangle, ArrowRight, AlertCircle, Database, FileWarning, CheckCircle2, XCircle } from 'lucide-react';
import ColumnMapper from './ColumnMapper';
import Papa from 'papaparse';
import { stratifiedSample } from '../utils/mlEngine';

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

const ClassBalanceChart = React.memo(({ classBalance, isLoading, isDarkMode }) => {
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
    const colors = [
        'bg-gradient-to-r from-slate-400 to-slate-500', 
        'bg-gradient-to-r from-emerald-400 to-emerald-500', 
        'bg-gradient-to-r from-indigo-400 to-indigo-500', 
        'bg-gradient-to-r from-amber-400 to-amber-500', 
        'bg-gradient-to-r from-rose-400 to-rose-500'
    ];

    const bars = entries.map(([label, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
            <div key={label} className={`group flex items-center gap-2 sm:gap-4 text-sm cursor-default p-2 rounded-lg transition-colors -mx-2 ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                <div className={'w-20 sm:w-40 text-right font-medium truncate transition-colors ' + (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900')}>
                    {label}
                </div>
                <div className={`flex-1 h-3.5 rounded-full overflow-hidden shadow-inner ${isDarkMode ? 'bg-slate-900 ring-1 ring-inset ring-slate-800' : 'bg-slate-100 ring-1 ring-inset ring-slate-200/50'}`}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: pct + '%' }}
                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.15 }}
                        className={'h-full rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] ' + colors[i % colors.length]}
                    />
                </div>
                <div className={'w-10 sm:w-12 font-bold transition-colors ' + (isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}>{pct}%</div>
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
});

const DataExploration = ({ isDarkMode, onNext, onPrev, domain, onPatientCountChange, dataset, setDataset, datasetSchema, setDatasetSchema, targetColumn, setTargetColumn }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    const containerAnim = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
    };
    const itemAnim = {
        hidden: { y: 12, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.3 } }
    };
    
    const [useDefaultDataset, setUseDefaultDataset] = useState(true);
    const [dataMode, setDataMode] = useState('default'); // 'default' = max 1000, 'all' = everything
    const [isMapperOpen, setIsMapperOpen] = useState(false);
    const [isMapped, setIsMapped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [classBalance, setClassBalance] = useState({});
    const [measurements, setMeasurements] = useState([]);
    const [stats, setStats] = useState({ patients: 0, measurements: 0, missing: '0%' });
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showBlockedBanner, setShowBlockedBanner] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [mapperColumns, setMapperColumns] = useState([]);
    const [parsedData, setParsedData] = useState([]);
    const [totalRowCount, setTotalRowCount] = useState(0);
    const [showGuide, setShowGuide] = useState(false);

    // Re-load when domain changes or user switches back to default dataset
    useEffect(() => {
        if (useDefaultDataset) {
            handleDefaultDataset();
            // Reset mapping when domain changes
            setIsMapped(false);
            setShowBlockedBanner(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useDefaultDataset, domain?.name]);

    // Recalculate class balance when target column changes
    const computeClassBalance = useCallback((data, targetCol) => {
        if (!data || data.length === 0 || !targetCol) return;
        const counts = {};
        data.forEach(row => {
            let v = row[targetCol];
            if (v === null || v === undefined || v === '') return;
            v = String(v).trim();
            counts[v] = (counts[v] || 0) + 1;
        });
        // If too many unique values (continuous), bin them
        const uniqueKeys = Object.keys(counts);
        if (uniqueKeys.length > 20) {
            // Continuous variable - bin into Low/Medium/High
            const numericVals = data.map(r => Number(r[targetCol])).filter(n => !isNaN(n));
            if (numericVals.length > 0) {
                let min = Infinity, max = -Infinity;
                for (const v of numericVals) { if (v < min) min = v; if (v > max) max = v; }
                const range = max - min || 1;
                const binned = { 'Low': 0, 'Medium': 0, 'High': 0 };
                numericVals.forEach(v => {
                    const pct = (v - min) / range;
                    if (pct < 0.33) binned['Low']++;
                    else if (pct < 0.67) binned['Medium']++;
                    else binned['High']++;
                });
                setClassBalance(binned);
                return;
            }
        }
        // If more than 10, show top 10
        if (uniqueKeys.length > 10) {
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            const top10 = Object.fromEntries(sorted.slice(0, 10));
            const othersCount = sorted.slice(10).reduce((acc, [, c]) => acc + c, 0);
            if (othersCount > 0) top10['Others'] = othersCount;
            setClassBalance(top10);
            return;
        }
        setClassBalance(counts);
    }, []);

    // When user changes target column, recalculate class balance
    useEffect(() => {
        if (parsedData.length > 0 && targetColumn) {
            computeClassBalance(parsedData, targetColumn);
        }
    }, [targetColumn, parsedData, computeClassBalance]);

    const processCSVResults = useCallback((results) => {
        const data = results.data;
        const fields = results.meta.fields;
        if (!data || data.length === 0) { setIsLoading(false); return; }
        
        setTotalRowCount(data.length);
        setParsedData(data);

        const patients = data.length;
        const numMeasurements = fields.length;
        let totalCells = patients * numMeasurements;
        let emptyCells = 0;

        // Use a subset for statistics computation if dataset is huge
        const statsData = data.length > 5000 ? data.slice(0, 5000) : data;

        // Known binary/categorical column names
        const KNOWN_CATEGORY_COLS = new Set([
            'sex', 'gender', 'smoking', 'diabetes', 'anaemia', 'anemia',
            'high_blood_pressure', 'hypertension', 'outcome', 'class',
            'diagnosis', 'status', 'result', 'target', 'label',
            'fetal_health', 'readmitted', 'stroke', 'biopsy',
            'DEATH_EVENT', 'exacerbation', 'severity', 'dx_type',
            'arrhythmia', 'sepsis', 'SepsisLabel'
        ]);

        const newMeasurements = fields.map((field, idx) => {
            let missingCount = 0;
            statsData.forEach(row => {
                const val = row[field];
                if (val === null || val === undefined || val === '') {
                    missingCount++;
                    emptyCells++;
                }
            });
            const missingPctVal = (missingCount / statsData.length) * 100;
            const firstVal = data.find(r => r[field] !== null && r[field] !== undefined && r[field] !== '')?.[field];
            
            // Improved type detection
            let type = !isNaN(Number(firstVal)) ? 'Number' : 'Category';
            const fieldLower = field.toLowerCase();
            if (fieldLower.includes('id') && !fieldLower.includes('diabetes')) type = 'Identifier';
            
            // Check if this is a known categorical column
            if (KNOWN_CATEGORY_COLS.has(field) || KNOWN_CATEGORY_COLS.has(fieldLower)) {
                type = 'Category';
            }
            
            // Check if numeric column is actually binary (0/1 only) → treat as Category
            if (type === 'Number') {
                const sampleVals = statsData.slice(0, 200).map(r => r[field]).filter(v => v !== null && v !== undefined && v !== '');
                const uniqueVals = new Set(sampleVals.map(v => String(v).trim()));
                if (uniqueVals.size <= 2) {
                    const vals = [...uniqueVals];
                    const allBinary = vals.every(v => v === '0' || v === '1' || v === 'true' || v === 'false' || v === 'yes' || v === 'no' || v === 'male' || v === 'female' || v === 'M' || v === 'F');
                    if (allBinary || uniqueVals.size <= 2) {
                        type = 'Category';
                    }
                }
            }
            
            let action = 'Ready';
            let status = 'ready';
            if (type === 'Identifier') { action = 'Exclude — Not a clinical measurement'; status = 'exclude'; }
            else if (missingPctVal > 0) { action = 'Fill Missing Values'; status = 'warning'; }
            return { name: field, type, missing: missingPctVal.toFixed(1) + '%', action, status, missingPctVal, isTarget: idx === fields.length - 1 };
        });

        const missingTotalPct = ((emptyCells / (statsData.length * numMeasurements || 1)) * 100).toFixed(1);
        setStats({ patients, measurements: numMeasurements, missing: missingTotalPct + '%' });
        setMeasurements(newMeasurements);

        // Build mapper columns for ColumnMapper
        const mapCols = fields.map((field, idx) => {
            const m = newMeasurements[idx];
            return {
                name: field,
                type: m.type,
                missingPct: m.missingPctVal,
                isTarget: idx === fields.length - 1,
            };
        });
        setMapperColumns(mapCols);

        // Auto-set target column to last field
        const lastField = fields[fields.length - 1];
        setTargetColumn(lastField || '');

        // Compute class balance using the target column
        computeClassBalance(data, lastField);

        // DON'T report total parsed row count — report the actual dataset size
        // that will be used (after sampling). patientCount is updated later in handleMapperSave.
        // For now, report the total so the UI can show it before mapping.
        onPatientCountChange?.(patients);
        setIsLoading(false);
        setUploadSuccess(true);
    }, [onPatientCountChange, computeClassBalance]);

    const handleDefaultDataset = useCallback(() => {
        setIsLoading(true);
        setMeasurements([]);
        setClassBalance({});
        setUploadError('');
        setUploadSuccess(false);
        const filename = DATASET_MAP[domain?.name] || 'cardiology.csv';
        Papa.parse('/datasets/' + filename, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: processCSVResults,
            error: (err) => {
                console.error('Error loading dataset:', err);
                setIsLoading(false);
                setUploadError('Failed to load the default dataset. Please try again.');
            }
        });
    }, [domain?.name, processCSVResults]);

    const validateFile = (file) => {
        // Check extension
        if (!file.name.toLowerCase().endsWith('.csv')) {
            return 'Invalid file type. Please upload a .csv file only.';
        }
        // Check size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            return 'File is too large. Maximum file size is 50 MB.';
        }
        // Check empty file
        if (file.size === 0) {
            return 'The uploaded file is empty. Please select a valid CSV file.';
        }
        return null;
    };

    const handleFileUpload = (e) => {
        const file = e.type === 'drop' ? e.dataTransfer.files[0] : e.target.files[0];
        if (!file) return;

        setUploadError('');
        setUploadSuccess(false);

        // Validate file
        const error = validateFile(file);
        if (error) {
            setUploadError(error);
            return;
        }

        setIsLoading(true);
        setMeasurements([]);
        setClassBalance({});
        setUploadedFileName(file.name);
        setUseDefaultDataset(false);
        setIsMapped(false);
        setShowBlockedBanner(false);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Validate parsed data
                if (!results.data || results.data.length === 0) {
                    setUploadError('The CSV file contains no data rows. Please check the file and try again.');
                    setIsLoading(false);
                    return;
                }
                if (!results.meta.fields || results.meta.fields.length < 2) {
                    setUploadError('The CSV file must have at least 2 columns (1 feature + 1 target). Found: ' + (results.meta.fields?.length || 0));
                    setIsLoading(false);
                    return;
                }
                processCSVResults(results);
            },
            error: (err) => {
                console.error('Error parsing CSV:', err);
                setUploadError('Failed to parse the CSV file. Please check the file format and try again.');
                setIsLoading(false);
            }
        });
    };

    const handleMapperSave = (schemaOK, mappedCols) => {
        if (schemaOK) {
            setIsMapped(true);
            setShowBlockedBanner(false);
            if (mappedCols) {
                setDatasetSchema(mappedCols);
                const target = mappedCols.find(c => c.role === 'Target (what we predict)')?.name;
                if (target) {
                    setTargetColumn(target);
                }
            }
            if (parsedData && parsedData.length > 0) {
                // Apply sampling based on dataMode
                if (dataMode === 'default' && parsedData.length > 1000) {
                    const lastField = targetColumn || measurements[measurements.length - 1]?.name;
                    const sampled = stratifiedSample(parsedData, lastField, 1000);
                    setDataset(sampled);
                    // Update patientCount to reflect the ACTUAL sampled dataset size
                    onPatientCountChange?.(sampled.length);
                } else {
                    setDataset(parsedData);
                    // Update patientCount to reflect full dataset size
                    onPatientCountChange?.(parsedData.length);
                }
            }
        }
        setIsMapperOpen(false);
    };

    const handleNextClick = () => {
        if (!isMapped) {
            setShowBlockedBanner(true);
            // Auto-dismiss after 5 seconds
            setTimeout(() => setShowBlockedBanner(false), 5000);
            return;
        }
        onNext();
    };

    const formatColumnName = (col) => {
        // Target column special mappings
        const targetMapping = {
            'DEATH_EVENT': 'Readmitted within 30 days (Yes / No)',
            'diagnosis': 'Diagnosis category (Malignant / Benign)',
            'Outcome': 'Clinical Outcome (Yes / No)',
            'classification': 'Disease Classification (CKD / Not CKD)',
            'stroke': 'Stroke occurrence (Yes / No)',
            'SepsisLabel': 'Sepsis onset (Yes / No)',
            'Biopsy': 'Biopsy Result (Yes / No)',
            'arrhythmia': 'Arrhythmia presence (Yes / No)',
            'status': 'Disease Status (Positive / Negative)',
            'Finding_Label': 'Finding Label (Normal / Abnormal)',
            'fetal_health': 'Fetal Health (Normal / Suspect / Pathological)',
            'readmitted': 'Readmission (<30 / >30 / No)',
            'class': 'Classification (Normal / Abnormal)',
            'dx_type': 'Diagnosis Type (Benign / Malignant)',
            'severity': 'Severity Grade',
            'anemia_type': 'Anaemia Type (Multi-class)',
            'exacerbation': 'Exacerbation Risk (Yes / No)',
            'Dataset': 'Liver Disease (Yes / No)',
        };
        if (targetMapping[col]) return targetMapping[col];
        // Convert snake_case and camelCase to human-readable Title Case
        return col
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <motion.div variants={itemAnim} className="mb-2">
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] tracking-[0.15em] font-bold uppercase px-2 py-1 rounded-md ${isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-100'}`}>
                        Step 2 of 7
                    </span>
                    <button
                        onClick={handleNextClick}
                        className={'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (isMapped
                            ? 'text-white'
                            : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}
                        style={isMapped ? { backgroundColor: primaryStr, boxShadow: `0 2px 10px ${primaryStr}30` } : {}}
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <h2 className={'text-3xl font-extrabold mb-1 tracking-tight ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                    Data Exploration
                </h2>
                <p className={'text-sm ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                    Examine the available data. Use the default dataset or upload your own CSV file.
                </p>
            </motion.div>

            {/* ── BLOCKED BANNER: Red warning when trying to bypass Column Mapper ── */}
            <AnimatePresence>
                {showBlockedBanner && !isMapped && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`p-3 sm:p-4 rounded-lg border flex items-start gap-3 shadow-sm ${isDarkMode
                            ? 'bg-red-900/10 border-red-800/30 text-red-200'
                            : 'bg-red-50/50 border-red-200/50 text-red-800'}`}
                    >
                        <XCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`} />
                        <div className="flex-1">
                            <h4 className={`font-semibold text-sm mb-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Step 3 is Blocked</h4>
                            <p className="text-sm">
                                You must open the <strong>Column Mapper</strong>, validate the data schema, and <strong>save the mapping</strong> before continuing.
                                This ensures data quality and prevents the model from learning from incorrect or misleading columns.
                            </p>
                            <button
                                onClick={() => setIsMapperOpen(true)}
                                className={`mt-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isDarkMode
                                    ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                                    : 'bg-red-100 border border-red-200 text-red-700 hover:bg-red-200'}`}
                            >
                                Open Column Mapper →
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Upload Error Banner ── */}
            <AnimatePresence>
                {uploadError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl border flex items-start gap-3 ${isDarkMode
                            ? 'bg-red-900/20 border-red-800/50 text-red-200'
                            : 'bg-red-50 border-red-200 text-red-700'}`}
                    >
                        <FileWarning className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                        <div>
                            <span className="font-bold">Upload Error: </span>
                            {uploadError}
                        </div>
                        <button
                            onClick={() => setUploadError('')}
                            className={`ml-auto shrink-0 p-1 rounded-full ${isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'}`}
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto w-full space-y-12 pb-12">
                
                {/* ── 1. Data Configuration ── */}
                <motion.section variants={itemAnim}>
                    <h2 className={`text-xl font-bold mb-6 pb-2 border-b ${isDarkMode ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-900'}`}>
                        1. Data Source Configuration
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Source Selection */}
                        <div className="space-y-4">
                        <h3 className={'text-sm font-semibold mb-4 uppercase tracking-wider ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Data Source</h3>
                        <div className={'flex p-1 rounded-lg mb-4 ' + (isDarkMode ? 'bg-slate-900' : 'bg-slate-100')}>
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

                        {/* Dataset Size Mode Toggle */}
                        {useDefaultDataset && (
                            <motion.div variants={itemAnim} className={'mb-4 p-3 rounded-lg border ' + (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200')}>
                                <div className={'text-[10px] font-bold uppercase tracking-wider mb-2 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Training Data Size</div>
                                <div className={'flex p-0.5 rounded-md ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}>
                                    <button
                                        onClick={() => setDataMode('default')}
                                        className={'flex-1 py-1.5 text-xs font-semibold rounded transition-all ' + (dataMode === 'default'
                                            ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'bg-white text-indigo-700 shadow-sm')
                                            : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'))}
                                    >
                                        Default (max 1,000)
                                    </button>
                                    <button
                                        onClick={() => setDataMode('all')}
                                        className={'flex-1 py-1.5 text-xs font-semibold rounded transition-all ' + (dataMode === 'all'
                                            ? (isDarkMode ? 'bg-amber-500/20 text-amber-300 shadow-sm' : 'bg-white text-amber-700 shadow-sm')
                                            : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'))}
                                    >
                                        Use All Data
                                    </button>
                                </div>
                                {totalRowCount > 1000 && (
                                    <p className={'text-[10px] mt-1.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        {dataMode === 'default'
                                            ? `Using 1,000 of ${totalRowCount.toLocaleString()} rows (stratified sample)`
                                            : `⚠️ Using all ${totalRowCount.toLocaleString()} rows — ML training may be slower`}
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {!useDefaultDataset && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label
                                    className={'relative overflow-hidden rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer shadow-inner ring-1 ring-inset ' + (isDarkMode
                                        ? `ring-slate-700 hover:bg-slate-900/60 ${isDragging ? 'bg-slate-900/60 ring-indigo-500' : 'bg-slate-900/40'}`
                                        : `ring-slate-200/60 hover:bg-slate-100/80 ${isDragging ? 'bg-slate-100/80 ring-indigo-500' : 'bg-slate-50/50'}`)}
                                    style={isDragging ? { borderColor: primaryStr } : {}}
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

                                {/* CSV Upload Guideline */}
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    className={'mt-3 w-full text-left flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors ' + (isDarkMode
                                        ? 'text-indigo-300 hover:bg-indigo-500/10'
                                        : 'text-indigo-600 hover:bg-indigo-50')}
                                >
                                    <span>{showGuide ? '▾' : '▸'}</span>
                                    How should my CSV be formatted?
                                </button>
                                {showGuide && (
                                    <div className={'mt-1 p-4 rounded-lg border text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 ' + (isDarkMode
                                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                                        : 'bg-indigo-50/50 border-indigo-100 text-slate-600')}
                                    >
                                        <p className="font-semibold text-sm mb-2" style={{ color: primaryStr }}>CSV Format Guide</p>
                                        <div className="space-y-1.5">
                                            <p><strong>First row</strong> must be column headers</p>
                                            <p><strong>Last column</strong> should be the target variable</p>
                                            <p><strong>Values</strong> should be numeric measurements or categories</p>
                                            <p><strong>Avoid</strong> images, free-text, or identifiers</p>
                                            <p>Supported: <code className={'px-1 py-0.5 rounded ' + (isDarkMode ? 'bg-slate-800' : 'bg-white')}>.csv</code> max 50 MB</p>
                                        </div>
                                        <div className={'mt-3 p-2 rounded font-mono text-[10px] leading-relaxed ' + (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500')}>
                                            Age, BloodPressure, Cholesterol, ..., Outcome<br/>
                                            65, 140, 220, ..., 1<br/>
                                            42, 120, 180, ..., 0
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 flex items-start flex-col gap-1">
                                    <p className={'text-xs leading-relaxed ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        Your file is processed locally and never stored.
                                    </p>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* Target Column */}
                        <div className="space-y-6">
                        <label className={'block text-sm font-medium ' + (isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                            Target Column (What We Want to Predict)
                        </label>
                        <div className="relative">
                            <select
                                value={targetColumn}
                                onChange={(e) => {
                                    const newTarget = e.target.value;
                                    setTargetColumn(newTarget);
                                    setMapperColumns(prev => prev.map(col => ({
                                        ...col,
                                        isTarget: col.name === newTarget
                                    })));
                                }}
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
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <p className={'text-xs ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            This is the outcome the model will learn to predict.
                        </p>

                        <div className="pt-6">
                            {/* Mapper Button */}
                    <button
                        onClick={() => setIsMapperOpen(true)}
                        className={'w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-medium transition-all ' + (
                            isMapped
                                ? (isDarkMode ? 'hover:brightness-110' : 'hover:brightness-95')
                                : (isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50')
                        )}
                        style={isMapped ? { backgroundColor: `${secondaryStr}1A`, color: secondaryStr, borderColor: `${secondaryStr}40` } : {}}
                    >
                        {isMapped ? (
                            <><CheckCircle2 className="w-4 h-4" /> Schema Validated ✓</>
                        ) : (
                            <><Database className="w-4 h-4" /> Open Column Mapper & Validate</>
                        )}
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

                    {isMapped && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={'p-4 rounded-lg flex gap-3 border '}
                            style={{ backgroundColor: `${secondaryStr}15`, borderColor: `${secondaryStr}30`, color: secondaryStr }}
                        >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <span className="font-bold">Schema saved.</span> All columns validated. You may proceed to Step 3.
                            </div>
                        </motion.div>
                    )}
                        </div>
                    </div>
                    </div>
                </motion.section>

                {/* ── 2. Data Overview ── */}
                <motion.section variants={itemAnim}>
                    <h2 className={`text-xl font-bold mb-8 pb-2 border-b ${isDarkMode ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-900'}`}>
                        2. Dataset Overview
                    </h2>

                    {/* Class Balance */}
                    <div className="mb-10">
                        <h3 className={'text-xs font-bold uppercase tracking-wider mb-6 ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            Class Balance — Distribution of &quot;{targetColumn ? formatColumnName(targetColumn) : 'Unknown'}&quot;
                        </h3>
                        <ClassBalanceChart classBalance={classBalance} isLoading={isLoading} isDarkMode={isDarkMode} />
                    </div>

                    {/* Measurements Table */}
                    <div className={`overflow-x-auto rounded-xl backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-slate-800/80 border border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)]' : 'bg-white/95 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                        <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-slate-700/60 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                            <h3 className={`text-[10px] uppercase tracking-[0.25em] font-semibold flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Patient Measurements (Features)
                            </h3>
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
                                    {measurements.map((item) => (
                                        <tr key={item.name} className={(isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50/80') + ' transition-colors'}>
                                            <td className="px-6 py-4 font-medium">{formatColumnName(item.name)}</td>
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
                </motion.section>
            </div>

            {/* Summary Cards */}
            <motion.div variants={itemAnim} className="flex flex-wrap justify-center items-center gap-20 pt-6 pb-4">
                <motion.div whileHover={{ y: -4, scale: 1.02 }} className={'flex flex-col items-center text-center cursor-default'}>
                    <div className={'text-5xl font-light tracking-tight ' + (isDarkMode ? 'text-slate-100' : 'text-slate-900')}>{stats.patients}</div>
                    <div className={'text-sm font-bold uppercase tracking-wider mt-2 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Patients</div>
                </motion.div>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} className={'flex flex-col items-center text-center cursor-default'}>
                    <div className={'text-5xl font-light tracking-tight ' + (isDarkMode ? 'text-slate-100' : 'text-slate-900')}>{stats.measurements}</div>
                    <div className={'text-sm font-bold uppercase tracking-wider mt-2 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Measurements</div>
                </motion.div>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} className={'flex flex-col items-center text-center cursor-default'}>
                    <div className={'text-5xl font-light tracking-tight ' + (isDarkMode ? 'text-slate-100' : 'text-slate-900')}>{stats.missing}</div>
                    <div className={'text-sm font-bold uppercase tracking-wider mt-2 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Missing Data</div>
                </motion.div>
            </motion.div>

            {/* Bottom Navigation */}
            <motion.div variants={itemAnim} className={`flex justify-between items-center pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                    onClick={onPrev}
                    className={'px-6 py-2.5 rounded-lg border font-medium transition-colors ' + (isDarkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50')}
                >
                    Previous
                </button>
                <button
                    onClick={handleNextClick}
                    className={'flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all ' + (isMapped
                        ? 'text-white hover:brightness-110'
                        : isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-400 hover:bg-slate-300')}
                    style={isMapped ? { backgroundColor: primaryStr, boxShadow: `0 4px 14px ${primaryStr}30` } : {}}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </motion.div>

            {/* Mapper Modal */}
            <AnimatePresence>
                {isMapperOpen && (
                    <ColumnMapper
                        isOpen={isMapperOpen}
                        onClose={() => setIsMapperOpen(false)}
                        onSave={handleMapperSave}
                        isDarkMode={isDarkMode}
                        columns={mapperColumns}
                        formatColumnName={formatColumnName}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DataExploration;
