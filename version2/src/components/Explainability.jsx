import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, Info, AlertTriangle,
    ChevronDown, Lightbulb, Activity, User,
    CheckCircle2, HelpCircle, TrendingUp, TrendingDown
} from 'lucide-react';

// ─── Domain-aware feature pools ──────────────────────────────────────────────
const DOMAIN_FEATURES = {
    default: [
        { id: 'ef', label: 'Ejection Fraction', clinical: 'How well the heart pumps blood (%)' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Kidney function marker' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'hosp_time', label: 'Time in Hospital', clinical: 'Days admitted during index episode' },
        { id: 'sodium', label: 'Serum Sodium', clinical: 'Electrolyte balance indicator' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Current or former tobacco use' },
        { id: 'bp', label: 'Systolic Blood Pressure', clinical: 'Arterial pressure at peak contraction' },
        { id: 'diabetes', label: 'Diabetes', clinical: 'Diagnosed diabetes mellitus' },
    ],
    Cardiology: [
        { id: 'ef', label: 'Ejection Fraction', clinical: 'How well the heart pumps blood (%)' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Kidney function marker' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'hosp_time', label: 'Time in Hospital', clinical: 'Days admitted during index episode' },
        { id: 'sodium', label: 'Serum Sodium', clinical: 'Electrolyte balance indicator' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Current or former tobacco use' },
    ],
    Nephrology: [
        { id: 'gfr', label: 'eGFR', clinical: 'Estimated glomerular filtration rate' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Primary kidney function marker' },
        { id: 'proteinuria', label: 'Proteinuria', clinical: 'Protein spill in urine' },
        { id: 'bp', label: 'Blood Pressure (systolic)', clinical: 'Arterial pressure' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'diabetes', label: 'Diabetes', clinical: 'Major CKD risk factor' },
    ],
    Oncology: [
        { id: 'stage', label: 'Tumour Stage', clinical: 'TNM staging classification' },
        { id: 'grade', label: 'Histological Grade', clinical: 'Degree of cellular differentiation' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'comorbidity', label: 'Comorbidity Index', clinical: 'Charlson comorbidity score' },
        { id: 'treatment', label: 'Treatment Regimen', clinical: 'Type of therapy received' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Tobacco exposure history' },
    ],
};

// ─── Generate simulated feature importance ────────────────────────────────────
const generateFeatureImportance = (features) => {
    const pool = [...features];
    let remaining = 1.0;
    return pool.map((f, i) => {
        const isLast = i === pool.length - 1;
        const val = isLast
            ? parseFloat(remaining.toFixed(2))
            : parseFloat((remaining * (0.25 + Math.random() * 0.25)).toFixed(2));
        remaining -= val;
        return { ...f, importance: Math.max(val, 0.01) };
    }).sort((a, b) => b.importance - a.importance);
};

// ─── Generate single-patient SHAP-like contributions ─────────────────────────
const generatePatientContributions = (features, patientIdx) => {
    const seed = patientIdx * 7;
    const result = features.slice(0, 6).map((f, i) => {
        const sign = (seed + i) % 3 === 0 ? -1 : 1;
        const magnitude = parseFloat(((0.05 + Math.random() * 0.25) * sign).toFixed(2));
        const isRisk = magnitude > 0;

        const exampleValues = {
            ef: ['very low (18%)', 'low (28%)', 'borderline (42%)', 'normal (58%)'],
            creatinine: ['elevated (2.8)', 'high (1.9)', 'borderline (1.4)', 'normal (0.9)'],
            age: ['elderly (79)', 'older (71)', 'middle-aged (58)', 'younger (44)'],
            hosp_time: ['long stay (12d)', 'extended (8d)', 'average (5d)', 'short (2d)'],
            sodium: ['low (128)', 'borderline-low (133)', 'normal (139)', 'high (146)'],
            smoking: ['current smoker', 'ex-smoker', 'non-smoker'],
            bp: ['hypertensive (165)', 'elevated (145)', 'normal (120)', 'low (98)'],
            diabetes: ['type 2 diagnosed', 'controlled', 'non-diabetic'],
            gfr: ['severely reduced (18)', 'reduced (35)', 'mildly reduced (52)', 'normal (72)'],
            proteinuria: ['heavy (3.8g/d)', 'moderate (1.2g/d)', 'mild (0.3g/d)', 'absent'],
            stage: ['Stage IV', 'Stage III', 'Stage II', 'Stage I'],
            grade: ['High grade (G3)', 'Intermediate (G2)', 'Low grade (G1)'],
            comorbidity: ['High index (8)', 'Moderate (5)', 'Low (2)', 'None (0)'],
            treatment: ['Palliative', 'Salvage chemo', 'Adjuvant', 'Curative intent'],
        };
        const vals = exampleValues[f.id] || ['elevated', 'borderline', 'normal', 'low'];
        const valIdx = isRisk ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
        const value = vals[Math.min(valIdx, vals.length - 1)];

        return {
            id: f.id,
            label: f.label,
            value,
            contribution: magnitude,
            isRisk,
        };
    }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    // Final risk score
    const base = 0.35 + Math.random() * 0.40;
    return { contributions: result, riskScore: parseFloat(base.toFixed(2)) };
};

// ─── Patient Pool ─────────────────────────────────────────────────────────────
const generatePatients = (features) => {
    const vitalsPool = {
        ef: [
            { label: 'Ejection Fraction', value: '18%', abnormal: true },
            { label: 'Ejection Fraction', value: '28%', abnormal: true },
            { label: 'Ejection Fraction', value: '42%', abnormal: false },
            { label: 'Ejection Fraction', value: '60%', abnormal: false },
        ],
        creatinine: [
            { label: 'Creatinine', value: '2.8 mg/dL', abnormal: true },
            { label: 'Creatinine', value: '1.9 mg/dL', abnormal: true },
            { label: 'Creatinine', value: '1.2 mg/dL', abnormal: false },
        ],
        age: [
            { label: 'Age', value: '79 yrs', abnormal: false },
            { label: 'Age', value: '64 yrs', abnormal: false },
            { label: 'Age', value: '51 yrs', abnormal: false },
        ],
        bp: [
            { label: 'BP (sys)', value: '168 mmHg', abnormal: true },
            { label: 'BP (sys)', value: '142 mmHg', abnormal: true },
            { label: 'BP (sys)', value: '118 mmHg', abnormal: false },
        ],
    };

    const ages = [79, 67, 72, 55, 83, 61, 48, 70];
    const riskLabels = ['High Risk', 'High Risk', 'Low Risk', 'High Risk', 'High Risk', 'Low Risk', 'Low Risk', 'High Risk'];

    return Array.from({ length: 8 }, (_, i) => {
        const age = ages[i];
        const riskLabel = riskLabels[i];
        const primaryFeature = features[0];
        const vitalsArr = [];

        // Age vital
        vitalsArr.push({ label: 'Age', value: `${age} yrs`, abnormal: age > 70 });

        // Primary feature vital
        const pool = vitalsPool[primaryFeature.id];
        if (pool) {
            vitalsArr.push(pool[i % pool.length]);
        } else {
            vitalsArr.push({ label: primaryFeature.label.slice(0, 12), value: riskLabel === 'High Risk' ? 'Abnormal' : 'Normal', abnormal: riskLabel === 'High Risk' });
        }

        // A secondary feature
        const secPool = vitalsPool['creatinine'];
        vitalsArr.push(secPool[i % secPool.length]);

        const bpPool = vitalsPool['bp'];
        vitalsArr.push(bpPool[i % bpPool.length]);

        return {
            id: i,
            riskLabel,
            vitals: vitalsArr,
            label: `Patient #${41 + i} · Age ${age} · ${riskLabel}`,
        };
    });
};


// ─── Horizontal Bar ───────────────────────────────────────────────────────────
const HBar = React.memo(({ label, clinical, importance, maxVal, isDarkMode, delay }) => {
    const pct = Math.round((importance / maxVal) * 100);
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay }}
            className="group feature-bar-container"
        >
            <div className="flex items-center justify-between mb-1 gap-2">
                <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {label}
                    </span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{clinical}</span>
                </div>
                <span className={`text-xs font-mono font-bold shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {importance.toFixed(2)}
                </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <motion.div
                    className="h-full rounded-full feature-gradient-bar feature-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: delay + 0.1, ease: 'easeOut' }}
                />
            </div>
        </motion.div>
    );
});

// ─── Waterfall Bar ────────────────────────────────────────────────────────────
const WaterfallBar = React.memo(({ label, value, contribution, isRisk, maxAbs, isDarkMode, delay }) => {
    const barPct = Math.round((Math.abs(contribution) / maxAbs) * 100);
    const sign = contribution > 0 ? '+' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all
                ${isRisk
                    ? isDarkMode ? 'bg-red-900/15 border-red-500/20' : 'bg-red-50 border-red-100'
                    : isDarkMode ? 'bg-emerald-900/15 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
                }`}
        >
            {/* Direction icon */}
            <div className={`shrink-0 ${isRisk ? 'text-red-500' : 'text-emerald-500'}`}>
                {isRisk ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>

            {/* Label + value */}
            <div className="w-28 sm:w-52 shrink-0">
                <span className={`text-[11px] font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {label}
                </span>
                <span className={`text-[10px] ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {value}
                </span>
            </div>

            {/* Direction-aware bar */}
            <div className="flex-1 flex items-center gap-2">
                {!isRisk && <div className="flex-1" />}
                <div className={`h-5 rounded flex-shrink-0 ${isRisk ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(barPct, 4)}%`, maxWidth: '100%' }}
                >
                    <motion.div
                        className="h-full rounded"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6, delay: delay + 0.1, ease: 'easeOut' }}
                    />
                </div>
                {isRisk && <div className="flex-1" />}
            </div>

            {/* Value label */}
            <span className={`text-xs font-bold font-mono shrink-0 w-12 text-right
                ${isRisk ? 'text-red-500' : 'text-emerald-500'}`}>
                {sign}{contribution.toFixed(2)}
            </span>
        </motion.div>
    );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Explainability = ({ isDarkMode, onNext, onPrev, domain }) => {
    const domainKey = domain?.name || 'default';
    const features = DOMAIN_FEATURES[domainKey] || DOMAIN_FEATURES.default;

    const [featureImportance, setFeatureImportance] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(0);
    const [patientData, setPatientData] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [explained, setExplained] = useState(false);
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    // Generate feature importance on mount
    useEffect(() => {
        const t = setTimeout(() => {
            setFeatureImportance(generateFeatureImportance(features));
            setPatients(generatePatients(features));
            setLoadingFeatures(false);
        }, 800);
        return () => clearTimeout(t);
    }, [domainKey, features]);

    const handleExplain = () => {
        setExplaining(true);
        setExplained(false);
        setPatientData(null);
        setTimeout(() => {
            setPatientData(generatePatientContributions(features, selectedPatient));
            setExplaining(false);
            setExplained(true);
        }, 900);
    };

    const top1 = featureImportance[0];
    const maxImportance = featureImportance[0]?.importance || 1;

    const senseCheckMessages = {
        ef: 'Ejection Fraction is the top predictor — this makes strong clinical sense. Low ejection fraction is a well-established biomarker for heart failure readmission risk.',
        creatinine: 'Serum Creatinine as the top feature is clinically sound. Impaired kidney function is a major driver of cardiovascular complications and readmission.',
        age: 'Age ranking highest is expected — older patients have greater physiological vulnerability and higher 30-day readmission risk.',
        gfr: 'eGFR at the top is consistent with nephrology evidence — it directly quantifies kidney function and disease progression risk.',
        stage: 'Tumour stage as the primary driver is clinically expected — advanced stage correlates strongly with poorer outcomes and higher readmission.',
        bp: 'Blood Pressure leading is consistent — hypertension is a systemic risk factor with broad clinical impact on readmissions.',
        sodium: 'Serum Sodium as top feature is clinically meaningful — hyponatraemia is associated with increased severity in cardiac and renal conditions.',
        default: 'The top-ranked feature aligns with established clinical knowledge — it is a well-recognised risk factor in the medical literature.',
    };

    const senseCheck = top1
        ? (senseCheckMessages[top1.id] || senseCheckMessages.default)
        : '';

    const whatIfMessages = {
        ef: "What-If: If this patient's ejection fraction improved from very low to borderline (42%), the predicted risk would drop to approximately 38%. This supports the clinical value of optimising cardiac function.",
        creatinine: "What-If: If this patient's creatinine were 1.2 instead of 2.1, the predicted risk would drop to approximately 41%. This kind of analysis helps assess kidney-targeted interventions.",
        age: "What-If: Age cannot be modified, but this highlights the need for age-adjusted care protocols and proactive discharge planning for elderly patients.",
        gfr: "What-If: If eGFR improved by 15 units with optimal fluid management, the model estimates a risk reduction of around 18%. Supports nephroprotective strategies.",
        stage: "What-If: Staging is fixed at diagnosis, but the model confirms that stage III–IV patients need intensive post-discharge follow-up.",
        default: "What-If: If the values of the top contributing feature were in the normal range, the model estimates a meaningful risk reduction. This helps assess which interventions might have most impact.",
    };

    const whatIf = top1
        ? (whatIfMessages[top1.id] || whatIfMessages.default)
        : '';

    return (
        <div className="w-full space-y-6 pb-20">

            {/* ── Header ── */}
            <div className={`p-4 sm:p-6 rounded-2xl border step-accent ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                        STEP 6 OF 7
                    </span>
                    <button
                        onClick={onNext}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg bg-slate-900 text-white hover:bg-slate-800"
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Explainability — Why Did the Model Make This Prediction?
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    A model that cannot explain itself should not be trusted in clinical settings. Here we look at which patient measurements were most important, and why a specific patient was flagged as high risk.
                </p>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── LEFT: Feature Importance ── */}
                <div className="lg:col-span-5 space-y-4">
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Most Important Patient Measurements (Overall)
                            </h3>
                        </div>
                        <p className={`text-[11px] mb-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Ranked by how strongly each measurement influenced predictions across all test patients. Higher = more influential.
                        </p>

                        {loadingFeatures ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`h-10 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {featureImportance.map((f, i) => (
                                    <HBar
                                        key={f.id}
                                        label={f.label}
                                        clinical={f.clinical}
                                        importance={f.importance}
                                        maxVal={maxImportance}
                                        isDarkMode={isDarkMode}
                                        delay={i * 0.07}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Clinical Sense Check */}
                        {!loadingFeatures && top1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className={`mt-5 p-4 rounded-xl border flex items-start gap-3 text-[11px] leading-relaxed
                                    ${isDarkMode ? 'bg-emerald-900/15 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                                <div>
                                    <span className="font-bold">Clinical sense-check: </span>
                                    {senseCheck}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* ── Single Patient Selector ── */}
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-4">
                            <User className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Single Patient Explanation
                            </h3>
                        </div>
                        <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Select a Test Patient
                        </label>
                        <div className="relative mb-4">
                            <select
                                value={selectedPatient}
                                onChange={e => { setSelectedPatient(Number(e.target.value)); setExplained(false); }}
                                className={`w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border text-sm outline-none transition-colors
                                    ${isDarkMode
                                        ? 'bg-slate-900 border-slate-600 text-slate-200 focus:border-indigo-500'
                                        : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-indigo-500'}`}
                            >
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>

                        <button
                            onClick={handleExplain}
                            disabled={explaining || loadingFeatures}
                            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                                ${explaining || loadingFeatures
                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-95'}`}
                        >
                            {explaining ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating explanation…
                                </>
                            ) : (
                                <>
                                    <Lightbulb className="w-4 h-4" />
                                    Explain This Patient →
                                </>
                            )}
                        </button>

                        {/* Patient Profile Card */}
                        {patients[selectedPatient] && (
                            <motion.div
                                key={selectedPatient}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {patients[selectedPatient].label.charAt(0)}
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {patients[selectedPatient].label}
                                        </div>
                                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Test patient profile</div>
                                    </div>
                                    <div className={`ml-auto text-xs font-black px-2.5 py-1 rounded-lg ${patients[selectedPatient].riskLabel === 'High Risk'
                                        ? isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
                                        : isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                        {patients[selectedPatient].riskLabel || 'Unknown'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(patients[selectedPatient].vitals || []).map((v, i) => (
                                        <div key={i} className={`px-2 py-1.5 rounded-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                                            <div className={`text-[9px] font-semibold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{v.label}</div>
                                            <div className={`text-xs font-bold ${v.abnormal ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{v.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Waterfall + Clinical Reminders ── */}
                <div className="lg:col-span-7 space-y-4">

                    {/* Waterfall Explanation */}
                    <div className={`p-6 rounded-2xl border min-h-[240px] flex flex-col card-inner-shine ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {explained && patientData
                                    ? `Why was this patient flagged as high risk? (${Math.round(patientData.riskScore * 100)}% probability)`
                                    : 'Patient-Level Explanation — Waterfall Chart'
                                }
                            </h3>
                        </div>

                        {!explained && !explaining && (
                            <div className={`flex-1 flex flex-col items-center justify-center gap-3 py-12 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                <Lightbulb className="w-10 h-10 opacity-30" />
                                <p className="text-sm text-center max-w-xs opacity-60">
                                    Select a test patient on the left and click <strong>Explain This Patient</strong> to see what drove the AI's prediction.
                                </p>
                            </div>
                        )}

                        {explaining && (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <div className="w-10 h-10 mx-auto border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Calculating feature contributions…</p>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {explained && patientData && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-1 mt-3"
                                >
                                    <p className={`text-[11px] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Each bar shows how much a measurement pushed the prediction <strong className="text-red-500">toward</strong> or <strong className="text-emerald-500">away from</strong> readmission. The longer the bar, the stronger the effect.
                                    </p>

                                    {/* Legend */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-semibold">
                                            <div className="w-3 h-3 rounded bg-red-500" /> Pushes toward HIGH RISK
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                                            <div className="w-3 h-3 rounded bg-emerald-500" /> Pushes toward LOW RISK
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {(() => {
                                            const maxAbs = Math.max(...patientData.contributions.map(x => Math.abs(x.contribution)));
                                            return patientData.contributions.map((c, i) => (
                                                <WaterfallBar
                                                    key={c.id}
                                                    label={c.label}
                                                    value={c.value}
                                                    contribution={c.contribution}
                                                    isRisk={c.isRisk}
                                                    maxAbs={maxAbs}
                                                    isDarkMode={isDarkMode}
                                                    delay={i * 0.06}
                                                />
                                            ));
                                        })()}
                                    </div>

                                    {/* Risk score summary */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className={`mt-4 p-3 rounded-xl border flex items-center justify-between
                                            ${patientData.riskScore >= 0.60
                                                ? isDarkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
                                                : patientData.riskScore >= 0.40
                                                    ? isDarkMode ? 'bg-amber-900/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                                                    : isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                                            }`}
                                    >
                                        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            Predicted readmission probability:
                                        </span>
                                        <span className={`text-xl font-black ${patientData.riskScore >= 0.60 ? 'text-red-500'
                                            : patientData.riskScore >= 0.40 ? 'text-amber-500'
                                                : 'text-emerald-500'
                                            }`}>
                                            {Math.round(patientData.riskScore * 100)}%
                                        </span>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Clinical reminders (always visible once features loaded) */}
                    <AnimatePresence>
                        {!loadingFeatures && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-3"
                            >
                                {/* Association ≠ Causation */}
                                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-[12px] leading-relaxed
                                    ${isDarkMode ? 'bg-amber-900/15 border-amber-500/25 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}
                                >
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                    <div>
                                        <span className="font-bold">⚕️ Important Clinical Reminder — </span>
                                        These explanations show <em>associations</em> between measurements and outcomes in the training data — they do not prove causation.
                                        A clinician must always decide whether and how to act on any AI prediction. The tool is an educational aid, not a diagnostic device.
                                    </div>
                                </div>

                                {/* What-If */}
                                {explained && patientData && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className={`p-4 rounded-2xl border flex items-start gap-3 text-[12px] leading-relaxed
                                            ${isDarkMode ? 'bg-blue-900/15 border-blue-500/25 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'}`}
                                    >
                                        <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                        <div>
                                            <span className="font-bold">💡 What-If Analysis — </span>
                                            {whatIf}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Navigation ── */}
            <div className="flex justify-between items-center pt-4">
                <button
                    onClick={onPrev}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium transition-colors
                        ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                    <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95"
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Explainability;
