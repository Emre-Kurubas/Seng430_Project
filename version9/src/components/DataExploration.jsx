import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Upload, AlertTriangle, ArrowRight, AlertCircle, Database, FileWarning, CheckCircle2, XCircle, Sparkles, BarChart3, Target, Layers, Shield, ChevronDown } from 'lucide-react';
import ColumnMapper from './ColumnMapper';
import Papa from 'papaparse';
import { stratifiedSample } from '../utils/mlEngine';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import Tooltip from './Tooltip';

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

/* ═══════════════════════════════════════════════════════════════
   Animated Counting Number
   ═══════════════════════════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.8, isDarkMode, suffix = '', colorClass }) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const target = typeof value === 'number' ? value : parseFloat(value) || 0;
        let start = 0;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(Math.round(eased * target));
            if (progress < 1) ref.current = requestAnimationFrame(animate);
        };
        ref.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(ref.current);
    }, [value, duration]);
    return <span className={colorClass}>{display.toLocaleString()}{suffix}</span>;
};



/* ═══════════════════════════════════════════════════════════════
   Donut Chart for Class Balance
   ═══════════════════════════════════════════════════════════════ */
const DonutChart = React.memo(({ classBalance, isDarkMode, primaryStr }) => {
    const total = Object.values(classBalance).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const entries = Object.entries(classBalance);
    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
    ];

    const radius = 58;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                {entries.map(([label, count], i) => {
                    const pct = count / total;
                    const dashLength = pct * circumference;
                    const dashOffset = accumulated * circumference;
                    accumulated += pct;
                    return (
                        <motion.circle
                            key={label}
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${dashLength} ${circumference}`}
                            strokeDashoffset={-dashOffset}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{ strokeDasharray: `${dashLength} ${circumference}` }}
                            transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 4px ${colors[i % colors.length]}40)` }}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={'text-2xl font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{entries.length}</span>
                <span className={'text-[9px] uppercase tracking-widest font-semibold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Classes</span>
            </div>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   Class Balance Chart (bars + donut)
   ═══════════════════════════════════════════════════════════════ */
const ClassBalanceChart = React.memo(({ classBalance, isLoading, isDarkMode, primaryStr }) => {
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
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Donut */}
                <div className="flex-shrink-0">
                    <DonutChart classBalance={classBalance} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                </div>
                {/* Bars */}
                <div className="flex-1 space-y-3 w-full">
                    {entries.map(([label, count], i) => {
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className={`group flex items-center gap-3 text-sm cursor-default px-3 py-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
                                    style={{ backgroundColor: colors[i % colors.length], boxShadow: `0 0 8px ${colors[i % colors.length]}40` }}
                                />
                                <div className={'w-24 sm:w-36 text-right font-medium truncate transition-colors ' + (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900')}>
                                    {label}
                                </div>
                                <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: pct + '%' }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{
                                            backgroundColor: colors[i % colors.length],
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
                                        }}
                                    />
                                </div>
                                <div className={'w-16 text-right font-mono text-xs font-bold tabular-nums transition-colors ' + (isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}>
                                    {pct}%
                                    <span className={'text-[10px] font-normal ml-1 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                        ({count.toLocaleString()})
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════════════
   3D Tilt Measurement Card
   ═══════════════════════════════════════════════════════════════ */
const MeasurementCard = ({ item, index, isTarget, isDarkMode, primaryStr, formatColumnName }) => {
    const hasIssue = item.status === 'warning' || item.status === 'exclude';
    const cardRef = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-50, 50], [6, -6]);
    const rotateY = useTransform(x, [-50, 50], [-6, 6]);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

    const handleMouse = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleLeave = () => { x.set(0); y.set(0); };

    const statusColor = item.status === 'ready'
        ? '#10b981'
        : item.status === 'warning'
            ? '#f59e0b'
            : '#ef4444';

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.6), ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            className={'group relative rounded-2xl p-4 transition-all duration-300 cursor-default overflow-hidden ' + 
                'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] xl:w-[calc(20%-9.6px)] text-left block ' + (
                isTarget
                    ? (isDarkMode ? 'bg-slate-800/80 ring-1 ring-inset shadow-lg ring-white/10' : 'bg-slate-50 border border-slate-200 shadow-md')
                    : (isDarkMode ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-white border border-slate-200 hover:shadow-md')
            )}
            style={{
                rotateX: springX,
                rotateY: springY,
                perspective: 600,
                transformStyle: 'preserve-3d',
                ...(!isDarkMode ? {
                    // Solid white coloring in light mode done via tailwind classes above
                } : {})
            }}
        >
            {/* Animated gradient border on hover */}
            <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${primaryStr}10, transparent 60%)`,
                }}
            />

            {/* Status indicator — animated pulse for warnings */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <div className="relative">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: statusColor }}
                    />
                    {item.status === 'warning' && (
                        <div
                            className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                            style={{ backgroundColor: statusColor, opacity: 0.4 }}
                        />
                    )}
                </div>
            </div>

            <p className={'text-[13px] font-semibold leading-snug truncate pr-6 ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')} title={formatColumnName(item.name)}>
                {formatColumnName(item.name)}
            </p>
            <div className="flex items-center gap-2 mt-2">
                <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded-md ' + (
                    item.type === 'Number'
                        ? (isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                        : item.type === 'Category'
                            ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                            : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500')
                )}>
                    {item.type}
                </span>
                {hasIssue && (
                    <span className={'text-[9px] font-bold uppercase tracking-wider ' + (
                        item.status === 'warning' ? 'text-amber-500' : 'text-red-400'
                    )}>
                        {item.missing !== '0.0%' ? item.missing + ' gap' : 'Excl.'}
                    </span>
                )}
            </div>
            {isTarget && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-2 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${primaryStr}, transparent)` }}
                />
            )}
            {isTarget && (
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1" style={{ color: primaryStr }}>
                    <Target className="w-3 h-3" /> Target
                </span>
            )}
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Stat Card — iOS Style Widget
   ═══════════════════════════════════════════════════════════════ */
const StatCard = ({ value, label, icon: Icon, isDarkMode, delay, color, suffix = '', type }) => (
    <motion.div 
        className="ios-card" 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay, type: 'spring' }}
        style={{ background: type === 'features' ? 'linear-gradient(135deg, var(--ios-orange), #ffb340)' : type === 'missing' ? 'linear-gradient(135deg, var(--ios-pink), #ff3b30)' : 'linear-gradient(135deg, var(--ios-blue), #2c9aff)', color: 'white', padding: '24px', margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
    >
        <Icon size={28} opacity={0.8} color="white" />
        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>
                <AnimatedNumber value={value} isDarkMode={isDarkMode} suffix={suffix} colorClass="text-white" />
            </div>
            <div style={{ fontWeight: 600, opacity: 0.9, marginTop: 4 }}>{label}</div>
        </div>
    </motion.div>
);


/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
const DataExploration = ({ isDarkMode, onNext, onPrev, domain, onPatientCountChange, dataset, setDataset, datasetSchema, setDatasetSchema, targetColumn, setTargetColumn }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    const [useDefaultDataset, setUseDefaultDataset] = useState(true);
    const [dataMode, setDataMode] = useState('default'); // 'default' = max 1000, 'all' = everything
    const [isMapperOpen, setIsMapperOpen] = useState(false);
    const [isMapped, setIsMapped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [classBalance, setClassBalance] = useState({});
    const [measurements, setMeasurements] = useState([]);
    const [stats, setStats] = useState({ patients: 0, measurements: 0, missing: '0%' });
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedFileSize, setUploadedFileSize] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showBlockedBanner, setShowBlockedBanner] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [mapperColumns, setMapperColumns] = useState([]);
    const [parsedData, setParsedData] = useState([]);
    const [totalRowCount, setTotalRowCount] = useState(0);
    const [showGuide, setShowGuide] = useState(false);
    const [hoveredSection, setHoveredSection] = useState(null);

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

        // Smart Target Column Auto-Detection
        const targetKeywords = ['outcome', 'target', 'diagnosis', 'status', 'label', 'sepsislabel', 'stroke', 'readmitted', 'death_event', 'class', 'biopsy', 'severity', 'exacerbation'];
        let guessedTarget = fields[fields.length - 1];
        for (const field of fields) {
            if (targetKeywords.includes(field.toLowerCase())) {
                guessedTarget = field;
                break;
            }
        }

        // Build mapper columns for ColumnMapper
        const mapCols = fields.map((field, idx) => {
            const m = newMeasurements[idx];
            return {
                name: field,
                type: m.type,
                missingPct: m.missingPctVal,
                isTarget: field === guessedTarget,
            };
        });
        setMapperColumns(mapCols);

        setTargetColumn(guessedTarget || '');

        // Compute class balance using the target column
        computeClassBalance(data, guessedTarget);

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
        setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');
        setUseDefaultDataset(false);
        setIsMapped(false);
        setShowBlockedBanner(false);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Validate parsed data
                if (!results.data || results.data.length < 10) {
                    setUploadError('The CSV file must contain at least 10 rows (patients). Please check the file and try again.');
                    setIsLoading(false);
                    return;
                }
                if (!results.meta.fields || results.meta.fields.length < 2) {
                    setUploadError('The CSV file must have at least 2 columns (1 feature + 1 target). Found: ' + (results.meta.fields?.length || 0));
                    setIsLoading(false);
                    return;
                }

                // Verify at least one numeric measurement column exists
                const hasNumericColumn = results.meta.fields.some(field => {
                    const firstVal = results.data.find(r => r[field] !== null && r[field] !== undefined && r[field] !== '')?.[field];
                    if (firstVal === undefined || firstVal === null || String(firstVal).trim() === '') return false;
                    return !isNaN(Number(firstVal));
                });

                if (!hasNumericColumn) {
                    setUploadError('The CSV file must contain at least one numeric measurement column.');
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

    // Counts for the mini legend
    const readyCount = measurements.filter(m => m.status === 'ready').length;
    const warningCount = measurements.filter(m => m.status === 'warning').length;
    const excludeCount = measurements.filter(m => m.status === 'exclude').length;

    const missingVal = parseFloat(stats.missing);
    const missingColor = missingVal === 0 ? '#10b981' : missingVal < 5 ? '#f59e0b' : '#ef4444';
    const missingLabel = missingVal === 0 ? 'No Gaps' : missingVal < 5 ? 'Minor Gaps' : 'Needs Attention';

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative max-w-7xl mx-auto w-full">
            {/* Background particles */}
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
                        Data Profile
                    </motion.p>
                </motion.div>

                {/* ── BLOCKED BANNER ── */}
                <AnimatePresence>
                    {showBlockedBanner && !isMapped && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className={`p-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm ${isDarkMode
                                ? 'bg-red-950/40 text-red-200 border border-red-500/20'
                                : 'bg-red-50 text-red-700 border border-red-200'}`}
                        >
                            <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                            <div className="flex-1">
                                <h4 className={`font-semibold text-sm mb-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Step 3 is Blocked</h4>
                                <p className="text-sm">
                                    Open the <strong>Column Mapper</strong>, validate, and <strong>save</strong> before continuing.
                                </p>
                                <button
                                    onClick={() => setIsMapperOpen(true)}
                                    className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDarkMode
                                        ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                >
                                    Open Column Mapper →
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Upload Error ── */}
                <AnimatePresence>
                    {uploadError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-2xl flex items-start gap-3 ${isDarkMode
                                ? 'bg-red-950/40 text-red-200'
                                : 'bg-red-50 text-red-700'}`}
                        >
                            <FileWarning className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                            <div className="flex-1 text-sm">{uploadError}</div>
                            <button onClick={() => setUploadError('')} className="shrink-0 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══════════════ BENTO GRID LAYOUT ═══════════════ */}

                {/* ── Section 1: Data Source — two-column bento ── */}
                <motion.section variants={itemAnim}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ' + (isDarkMode ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500')}>1</div>
                        <h2 className={'text-lg font-bold ' + (isDarkMode ? 'text-slate-100' : 'text-slate-900')}>Data Source</h2>
                        <div className={'flex-1 h-px ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Left: Source toggle + upload — 3 cols */}
                        <motion.div
                            className={'lg:col-span-3 rounded-3xl p-6 transition-all duration-300 overflow-hidden relative ' + (isDarkMode
                                ? 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1]'
                                : 'bg-white border border-slate-200 shadow-sm')}
                            onMouseEnter={() => setHoveredSection('source')}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            {/* Subtle glow on hover */}
                            <AnimatePresence>
                                {hoveredSection === 'source' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: `radial-gradient(circle at 50% 0%, ${primaryStr}08, transparent 70%)` }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative z-10 space-y-5">
                                {/* Toggle pill */}
                                <div className={'inline-flex p-1 rounded-2xl ' + (isDarkMode ? 'bg-slate-800/80' : 'bg-slate-50')}>
                                    <motion.button
                                        onClick={() => setUseDefaultDataset(true)}
                                        whileTap={{ scale: 0.97 }}
                                        className={'px-5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ' + (useDefaultDataset
                                            ? (isDarkMode ? 'bg-slate-700 text-white shadow-lg shadow-slate-900/50' : 'bg-white text-slate-900 shadow-md')
                                            : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'))}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Database className="w-3.5 h-3.5" />
                                            {useDefaultDataset && isLoading ? 'Loading…' : 'Default Dataset'}
                                        </span>
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setUseDefaultDataset(false)}
                                        whileTap={{ scale: 0.97 }}
                                        className={'px-5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ' + (!useDefaultDataset
                                            ? (isDarkMode ? 'bg-slate-700 text-white shadow-lg shadow-slate-900/50' : 'bg-white text-slate-900 shadow-md')
                                            : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'))}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Upload className="w-3.5 h-3.5" />
                                            Upload CSV
                                        </span>
                                    </motion.button>
                                </div>

                                {/* Data size toggle */}
                                <AnimatePresence mode="wait">
                                    {useDefaultDataset ? (
                                        <motion.div
                                            key="default-opts"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={'p-4 rounded-2xl ' + (isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50/80')}
                                        >
                                            <div className={'text-[9px] font-bold uppercase tracking-[0.2em] mb-3 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Sample Size</div>
                                            <div className={'inline-flex p-0.5 rounded-xl ' + (isDarkMode ? 'bg-slate-900/80' : 'bg-slate-200/50')}>
                                                <button
                                                    onClick={() => setDataMode('default')}
                                                    className={'px-4 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 ' + (dataMode === 'default'
                                                        ? (isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                                                        : (isDarkMode ? 'text-slate-500' : 'text-slate-500'))}
                                                >
                                                    Max 1,000
                                                </button>
                                                <button
                                                    onClick={() => setDataMode('all')}
                                                    className={'px-4 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 ' + (dataMode === 'all'
                                                        ? (isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                                                        : (isDarkMode ? 'text-slate-500' : 'text-slate-500'))}
                                                >
                                                    All Data
                                                </button>
                                            </div>
                                            {totalRowCount > 1000 && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={'text-[10px] mt-2 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}
                                                >
                                                    {dataMode === 'default'
                                                        ? `Stratified sample · 1,000 of ${totalRowCount.toLocaleString()} rows`
                                                        : `Using all ${totalRowCount.toLocaleString()} rows`}
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="upload-zone"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-3"
                                        >
                                            <label
                                                className={'relative rounded-2xl min-h-[140px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 overflow-hidden ' + (isDarkMode
                                                    ? `${isDragging ? 'bg-slate-800 scale-[1.005]' : 'bg-slate-800/30 hover:bg-slate-800/50'}`
                                                    : `${isDragging ? 'bg-indigo-50/50 scale-[1.005]' : 'bg-slate-50/50 hover:bg-slate-100/60'}`)}
                                                style={{
                                                    border: isDragging ? `2px dashed ${primaryStr}` : `1.5px dashed ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
                                                }}
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
                                                {isLoading ? (
                                                    <div className="flex flex-col items-center gap-2.5 py-4">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            className={'w-8 h-8 rounded-full border-2 border-t-transparent ' + (isDarkMode ? 'border-slate-700' : 'border-slate-300')}
                                                            style={{ borderTopColor: primaryStr }}
                                                        />
                                                        <p className={'text-xs font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>Parsing…</p>
                                                    </div>
                                                ) : uploadSuccess && uploadedFileName ? (
                                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-1.5 py-4">
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                            className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        </motion.div>
                                                        <p className={'text-sm font-semibold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>{uploadedFileName}</p>
                                                        <p className={'text-[10px] ' + (isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600/70')}>{uploadedFileSize} · Ready</p>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 py-6">
                                                        <motion.div
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                        >
                                                            <Upload className={'w-6 h-6 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-300')} strokeWidth={1.5} />
                                                        </motion.div>
                                                        <p className={'text-sm font-medium ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Drop CSV here</p>
                                                        <p className={'text-[10px] ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>or click · max 50 MB</p>
                                                    </div>
                                                )}
                                            </label>

                                            <button
                                                onClick={() => setShowGuide(!showGuide)}
                                                className={'w-full text-left flex items-center gap-1.5 text-[11px] font-medium px-1 py-1 transition-colors ' + (isDarkMode
                                                    ? 'text-slate-500 hover:text-slate-400'
                                                    : 'text-slate-400 hover:text-slate-500')}
                                            >
                                                <motion.span
                                                    animate={{ rotate: showGuide ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown className="w-3 h-3" />
                                                </motion.span>
                                                CSV format guide
                                            </button>
                                            <AnimatePresence>
                                                {showGuide && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className={'p-3 rounded-xl text-xs space-y-1.5 ' + (isDarkMode
                                                            ? 'bg-slate-800/50 text-slate-500'
                                                            : 'bg-slate-50 text-slate-400')}
                                                    >
                                                        <p><strong className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Row 1</strong> = headers</p>
                                                        <p><strong className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Last col</strong> = target variable</p>
                                                        <div className={'mt-2 p-2 rounded-lg font-mono text-[10px] leading-relaxed ' + (isDarkMode ? 'bg-slate-900 text-slate-600' : 'bg-white text-slate-400')}>
                                                            Age, BP, Chol, …, Outcome<br />
                                                            65, 140, 220, …, 1
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <p className={'text-[10px] px-1 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                                Processed locally. Never stored.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Right: Target + Validate — 2 cols */}
                        <motion.div
                            className={'lg:col-span-2 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden ' + (isDarkMode
                                ? 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1]'
                                : 'bg-white border border-slate-200 shadow-sm')}
                            onMouseEnter={() => setHoveredSection('target')}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            <AnimatePresence>
                                {hoveredSection === 'target' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: `radial-gradient(circle at 80% 20%, ${secondaryStr}08, transparent 70%)` }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative z-10 space-y-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4" style={{ color: primaryStr }} />
                                    <label className={'text-[10px] font-bold uppercase tracking-[0.18em] ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                        Target Outcome
                                    </label>
                                </div>
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
                                        className={'w-full p-3.5 pr-10 rounded-2xl appearance-none border-0 outline-none text-sm font-medium transition-all duration-200 ' + (isDarkMode
                                            ? 'bg-slate-800/60 text-white hover:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30'
                                            : 'bg-slate-50 text-slate-900 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/20')}
                                    >
                                        {measurements.map(m => (
                                            <option key={m.name} value={m.name}>
                                                {formatColumnName(m.name)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                        <ChevronDown className={'w-4 h-4 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-300')} />
                                    </div>
                                </div>
                                <p className={'text-[10px] px-1 ' + (isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                                    The outcome the model will predict.
                                </p>

                                {/* Validate Button */}
                                <motion.button
                                    onClick={() => setIsMapperOpen(true)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={'w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ' + (
                                        isMapped
                                            ? ''
                                            : (isDarkMode
                                                ? 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]'
                                                : 'bg-slate-900 text-white hover:bg-slate-800')
                                    )}
                                    style={isMapped ? {
                                        backgroundColor: isDarkMode ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                                        color: secondaryStr,
                                    } : {}}
                                >
                                    {isMapped ? (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </motion.div>
                                            Schema Validated
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Validate Columns
                                        </>
                                    )}
                                </motion.button>

                                <AnimatePresence mode="wait">
                                    {!isMapped && totalRowCount > 0 && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className={'text-[11px] px-1 flex items-center gap-1.5 ' + (isDarkMode ? 'text-amber-400/60' : 'text-amber-600/60')}
                                        >
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            Required before Step 3
                                        </motion.p>
                                    )}
                                    {isMapped && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className={'text-[11px] px-1 flex items-center gap-1.5 ' + (isDarkMode ? 'text-emerald-400/60' : 'text-emerald-600/60')}
                                        >
                                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                                            Ready for Step 3
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* ═══════════════ Section 2: DATASET OVERVIEW ═══════════════ */}
                <motion.section variants={itemAnim}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ' + (isDarkMode ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500')}>2</div>
                        <h2 className={'text-lg font-bold ' + (isDarkMode ? 'text-slate-100' : 'text-slate-900')}>Dataset Overview</h2>
                        <div className={'flex-1 h-px ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')} />
                    </div>

                    {/* ── Stat Cards — iOS Grid ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                        <StatCard
                            value={stats.patients}
                            label="Patients Total"
                            icon={Layers}
                            isDarkMode={isDarkMode}
                            delay={0.1}
                            color={primaryStr}
                            type="patients"
                        />
                        <StatCard
                            value={stats.measurements}
                            label="Clinical Features"
                            icon={BarChart3}
                            isDarkMode={isDarkMode}
                            delay={0.2}
                            color={secondaryStr}
                            type="features"
                        />
                        <StatCard
                            value={stats.missing}
                            label="Missing Gaps"
                            icon={AlertTriangle}
                            isDarkMode={isDarkMode}
                            delay={0.3}
                            color={missingColor}
                            type="missing"
                        />
                    </div>

                    {/* ── Class Balance ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className={'rounded-3xl p-6 mb-8 transition-all duration-300 ' + (isDarkMode
                            ? 'bg-white/[0.02] border border-white/[0.06]'
                            : 'bg-emerald-50/40 border border-emerald-100 shadow-md')}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" style={{ color: primaryStr }} />
                                <h3 className={'text-[10px] font-bold uppercase tracking-[0.2em] ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    Outcome Distribution — {targetColumn ? formatColumnName(targetColumn) : '…'}
                                </h3>
                            </div>
                            
                            {/* Substituted Imbalance Warning Tooltip */}
                            {(() => {
                                if (Object.keys(classBalance).length === 0) return null;
                                const total = Object.values(classBalance).reduce((a, b) => a + b, 0);
                                const maxCount = Math.max(...Object.values(classBalance));
                                const majorityPct = total > 0 ? Math.round((maxCount / total) * 100) : 0;
                                if (majorityPct > 60) {
                                    return (
                                        <Tooltip 
                                            content={<span><strong className="text-amber-500">Imbalance detected:</strong> The majority class makes up {majorityPct}% of the data. We will handle it in Step 3.</span>}
                                            isDarkMode={isDarkMode} 
                                            position="left" 
                                            noUnderline 
                                            className="flex items-center"
                                        >
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full cursor-help transition-colors bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Imbalanced Data</span>
                                            </div>
                                        </Tooltip>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <ClassBalanceChart classBalance={classBalance} isLoading={isLoading} isDarkMode={isDarkMode} primaryStr={primaryStr} />
                    </motion.div>

                    {/* ── Measurement Tile Grid ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4" style={{ color: primaryStr }} />
                                <h3 className={'text-[10px] font-bold uppercase tracking-[0.2em] ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    Patient Measurements · {measurements.length}
                                </h3>
                            </div>
                            {/* Mini legend */}
                            <div className="flex items-center gap-4">
                                {readyCount > 0 && (
                                    <span className={'flex items-center gap-1.5 text-[10px] font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> {readyCount} ready
                                    </span>
                                )}
                                {warningCount > 0 && (
                                    <span className={'flex items-center gap-1.5 text-[10px] font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        <span className="w-2 h-2 rounded-full bg-amber-400" /> {warningCount} gaps
                                    </span>
                                )}
                                {excludeCount > 0 && (
                                    <span className={'flex items-center gap-1.5 text-[10px] font-medium ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                        <span className="w-2 h-2 rounded-full bg-red-400" /> {excludeCount} excluded
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {measurements.map((item, i) => (
                                <MeasurementCard
                                    key={item.name}
                                    item={item}
                                    index={i}
                                    isTarget={item.name === targetColumn}
                                    isDarkMode={isDarkMode}
                                    primaryStr={primaryStr}
                                    formatColumnName={formatColumnName}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.section>

                {/* Bottom Navigation */}
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
                        onClick={handleNextClick}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className={'flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ' + (isMapped
                            ? 'text-white shadow-lg'
                            : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}
                        style={isMapped ? { backgroundColor: primaryStr, boxShadow: `0 8px 30px ${primaryStr}35` } : {}}
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>

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
                        primaryStr={primaryStr}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DataExploration;
