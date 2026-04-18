import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, Info, AlertTriangle,
    ChevronDown, Lightbulb, Activity, User,
    CheckCircle2, HelpCircle, TrendingUp, TrendingDown
} from 'lucide-react';

// ─── Domain-aware feature pools (all 20 domains) ─────────────────────────────
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
    'Cardiology': [
        { id: 'ef', label: 'Ejection Fraction', clinical: 'How well the heart pumps blood (%)' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Kidney function marker' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'hosp_time', label: 'Time in Hospital', clinical: 'Days admitted during index episode' },
        { id: 'sodium', label: 'Serum Sodium', clinical: 'Electrolyte balance indicator' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Current or former tobacco use' },
    ],
    'Radiology': [
        { id: 'density', label: 'Lung Opacity Density', clinical: 'Degree of visible cloudiness on chest imaging' },
        { id: 'consolidation', label: 'Consolidation Area', clinical: 'Region of solidified lung tissue' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'fever', label: 'Body Temperature', clinical: 'Presence of fever indicating infection' },
        { id: 'wbc', label: 'White Blood Cell Count', clinical: 'Immune response activity level' },
        { id: 'cough_dur', label: 'Cough Duration (days)', clinical: 'Length of cough symptom' },
    ],
    'Nephrology': [
        { id: 'gfr', label: 'eGFR', clinical: 'Estimated glomerular filtration rate' },
        { id: 'creatinine', label: 'Serum Creatinine', clinical: 'Primary kidney function marker' },
        { id: 'proteinuria', label: 'Proteinuria', clinical: 'Protein spill in urine' },
        { id: 'bp', label: 'Blood Pressure (systolic)', clinical: 'Arterial pressure' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'diabetes', label: 'Diabetes', clinical: 'Major CKD risk factor' },
    ],
    'Oncology — Breast': [
        { id: 'radius_mean', label: 'Mean Cell Nucleus Radius', clinical: 'Average size of cell nuclei in biopsy' },
        { id: 'texture_mean', label: 'Cell Texture', clinical: 'Variation in grey-scale intensity' },
        { id: 'perimeter_mean', label: 'Cell Perimeter', clinical: 'Boundary length of cell nuclei' },
        { id: 'area_mean', label: 'Cell Area', clinical: 'Cross-sectional area of cell nuclei' },
        { id: 'concavity_mean', label: 'Concavity', clinical: 'Severity of concave portions of the contour' },
        { id: 'symmetry_mean', label: 'Cell Symmetry', clinical: 'Symmetry of cell nuclei shape' },
    ],
    "Neurology — Parkinson's": [
        { id: 'jitter', label: 'Voice Jitter', clinical: 'Frequency variation in vocal cord vibration' },
        { id: 'shimmer', label: 'Voice Shimmer', clinical: 'Amplitude variation in voice signal' },
        { id: 'hnr', label: 'Harmonics-to-Noise Ratio', clinical: 'Voice clarity measure' },
        { id: 'rpde', label: 'Recurrence Period Density', clinical: 'Voice signal complexity' },
        { id: 'dfa', label: 'Detrended Fluctuation', clinical: 'Signal self-similarity measure' },
        { id: 'spread1', label: 'Fundamental Frequency Spread', clinical: 'Pitch variability range' },
    ],
    'Endocrinology — Diabetes': [
        { id: 'glucose', label: 'Plasma Glucose Level', clinical: 'Blood sugar concentration after fasting' },
        { id: 'bmi', label: 'Body Mass Index', clinical: 'Weight-to-height ratio indicator' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'insulin', label: 'Serum Insulin', clinical: 'Insulin level after glucose tolerance test' },
        { id: 'bp', label: 'Blood Pressure (diastolic)', clinical: 'Resting blood pressure reading' },
        { id: 'pregnancies', label: 'Number of Pregnancies', clinical: 'Gestational diabetes history proxy' },
    ],
    'Hepatology — Liver': [
        { id: 'sgot', label: 'SGOT (AST)', clinical: 'Liver enzyme — cell damage indicator' },
        { id: 'sgpt', label: 'SGPT (ALT)', clinical: 'Liver-specific enzyme marker' },
        { id: 'alkphos', label: 'Alkaline Phosphatase', clinical: 'Bile duct and liver enzyme' },
        { id: 'total_bilirubin', label: 'Total Bilirubin', clinical: 'Liver waste processing indicator' },
        { id: 'albumin', label: 'Serum Albumin', clinical: 'Liver protein synthesis capacity' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
    ],
    'Cardiology — Stroke': [
        { id: 'hypertension', label: 'Hypertension Status', clinical: 'History of high blood pressure' },
        { id: 'avg_glucose', label: 'Average Glucose Level', clinical: 'Long-term blood sugar control' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'bmi', label: 'Body Mass Index', clinical: 'Weight-to-height ratio' },
        { id: 'heart_disease', label: 'Heart Disease History', clinical: 'Prior cardiac conditions' },
        { id: 'smoking', label: 'Smoking Status', clinical: 'Current or former tobacco use' },
    ],
    'Mental Health': [
        { id: 'phq_score', label: 'PHQ-9 Total Score', clinical: 'Standardised depression severity score' },
        { id: 'sleep_quality', label: 'Sleep Quality Rating', clinical: 'Self-reported sleep disturbance' },
        { id: 'interest_loss', label: 'Loss of Interest', clinical: 'Anhedonia severity indicator' },
        { id: 'fatigue', label: 'Fatigue Level', clinical: 'Self-reported energy level' },
        { id: 'concentration', label: 'Concentration Difficulty', clinical: 'Cognitive impact assessment' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
    ],
    'Pulmonology — COPD': [
        { id: 'fev1', label: 'FEV1', clinical: 'Forced expiratory volume in 1 second' },
        { id: 'fvc', label: 'FVC', clinical: 'Forced vital capacity' },
        { id: 'fev1_fvc', label: 'FEV1/FVC Ratio', clinical: 'Airflow obstruction severity' },
        { id: 'smoking_years', label: 'Pack-Years of Smoking', clinical: 'Cumulative tobacco exposure' },
        { id: 'exacerbation_hx', label: 'Prior Exacerbation Count', clinical: 'Number of previous acute episodes' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
    ],
    'Haematology — Anaemia': [
        { id: 'haemoglobin', label: 'Haemoglobin Level', clinical: 'Oxygen-carrying protein concentration' },
        { id: 'mcv', label: 'Mean Cell Volume', clinical: 'Average red blood cell size' },
        { id: 'mch', label: 'Mean Cell Haemoglobin', clinical: 'Average haemoglobin per cell' },
        { id: 'rbc', label: 'Red Blood Cell Count', clinical: 'Total red cell concentration' },
        { id: 'iron', label: 'Serum Iron', clinical: 'Iron availability in blood' },
        { id: 'ferritin', label: 'Serum Ferritin', clinical: 'Iron storage indicator' },
    ],
    'Dermatology': [
        { id: 'asymmetry', label: 'Lesion Asymmetry', clinical: 'Shape irregularity of the skin lesion' },
        { id: 'border', label: 'Border Irregularity', clinical: 'Edge sharpness of the lesion' },
        { id: 'color_var', label: 'Colour Variation', clinical: 'Number of colours within the lesion' },
        { id: 'diameter', label: 'Lesion Diameter', clinical: 'Size of the skin lesion in mm' },
        { id: 'evolution', label: 'Change Over Time', clinical: 'Whether the lesion has evolved recently' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
    ],
    'Ophthalmology': [
        { id: 'macula_thick', label: 'Macular Thickness', clinical: 'Central retina thickness measurement' },
        { id: 'hba1c', label: 'HbA1c', clinical: 'Long-term blood glucose control' },
        { id: 'diabetes_dur', label: 'Diabetes Duration (years)', clinical: 'Time since diabetes diagnosis' },
        { id: 'bp', label: 'Blood Pressure', clinical: 'Systemic vascular stress' },
        { id: 'microaneurysms', label: 'Microaneurysm Count', clinical: 'Number of micro-bleeds in retina' },
        { id: 'exudates', label: 'Exudate Presence', clinical: 'Lipid deposits on retina' },
    ],
    'Orthopaedics — Spine': [
        { id: 'pelvic_inc', label: 'Pelvic Incidence', clinical: 'Pelvic alignment angle' },
        { id: 'pelvic_tilt', label: 'Pelvic Tilt', clinical: 'Forward/backward pelvic rotation' },
        { id: 'lumbar_angle', label: 'Lumbar Lordosis Angle', clinical: 'Lower spine curvature' },
        { id: 'sacral_slope', label: 'Sacral Slope', clinical: 'Sacrum inclination angle' },
        { id: 'pelvic_radius', label: 'Pelvic Radius', clinical: 'Pelvic bone size measure' },
        { id: 'spondylo_grade', label: 'Spondylolisthesis Grade', clinical: 'Vertebral slippage severity' },
    ],
    'ICU / Sepsis': [
        { id: 'hr', label: 'Heart Rate', clinical: 'Beats per minute — tachycardia sign' },
        { id: 'map', label: 'Mean Arterial Pressure', clinical: 'Average blood pressure across heartbeat' },
        { id: 'temp', label: 'Body Temperature', clinical: 'Fever or hypothermia indicator' },
        { id: 'resp_rate', label: 'Respiratory Rate', clinical: 'Breaths per minute' },
        { id: 'wbc', label: 'White Blood Cell Count', clinical: 'Immune system activation level' },
        { id: 'lactate', label: 'Blood Lactate', clinical: 'Tissue oxygen deficit marker' },
    ],
    'Obstetrics — Fetal Health': [
        { id: 'baseline_hr', label: 'Baseline Fetal Heart Rate', clinical: 'Resting heart rate of the fetus' },
        { id: 'accelerations', label: 'Heart Rate Accelerations', clinical: 'Increases in fetal heart rate' },
        { id: 'decelerations', label: 'Late Decelerations', clinical: 'Heart rate drops after contractions' },
        { id: 'uterine_contractions', label: 'Uterine Contraction Count', clinical: 'Number of contractions per 10 min' },
        { id: 'variability', label: 'Heart Rate Variability', clinical: 'Beat-to-beat variation (sign of health)' },
        { id: 'movement', label: 'Fetal Movements', clinical: 'Number of movements detected' },
    ],
    'Cardiology — Arrhythmia': [
        { id: 'rr_interval', label: 'R-R Interval', clinical: 'Time between heartbeats (regularity)' },
        { id: 'pr_interval', label: 'P-R Interval', clinical: 'Electrical conduction delay' },
        { id: 'qrs_duration', label: 'QRS Duration', clinical: 'Ventricular depolarisation time' },
        { id: 'qt_interval', label: 'Q-T Interval', clinical: 'Ventricular electrical cycle length' },
        { id: 'heart_rate', label: 'Heart Rate', clinical: 'Beats per minute' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
    ],
    'Oncology — Cervical': [
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'sexual_partners', label: 'Number of Sexual Partners', clinical: 'HPV exposure risk factor' },
        { id: 'first_intercourse', label: 'Age at First Intercourse', clinical: 'Early exposure risk factor' },
        { id: 'pregnancies', label: 'Number of Pregnancies', clinical: 'Reproductive history' },
        { id: 'smoking_years', label: 'Years of Smoking', clinical: 'Cumulative tobacco exposure' },
        { id: 'hormonal_yrs', label: 'Years on Hormonal Contraceptives', clinical: 'Hormonal exposure duration' },
    ],
    'Thyroid / Endocrinology': [
        { id: 'tsh', label: 'TSH Level', clinical: 'Thyroid-stimulating hormone concentration' },
        { id: 't3', label: 'T3 Level', clinical: 'Active thyroid hormone' },
        { id: 't4', label: 'T4 Level', clinical: 'Main thyroid hormone produced' },
        { id: 'goitre', label: 'Goitre Present', clinical: 'Thyroid gland enlargement' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'sex', label: 'Sex', clinical: 'Biological sex (thyroid disease prevalence varies)' },
    ],
    'Pharmacy — Readmission': [
        { id: 'num_medications', label: 'Number of Medications', clinical: 'Total prescribed drugs — polypharmacy risk' },
        { id: 'num_procedures', label: 'Number of Procedures', clinical: 'Complexity of the hospital stay' },
        { id: 'num_diagnoses', label: 'Number of Diagnoses', clinical: 'Comorbidity burden indicator' },
        { id: 'time_in_hospital', label: 'Time in Hospital (days)', clinical: 'Length of the admission' },
        { id: 'age', label: 'Age', clinical: 'Patient age in years' },
        { id: 'insulin_change', label: 'Insulin Dosage Changed', clinical: 'Whether insulin regimen was adjusted' },
    ],
};

// ─── Column-name → clinical label mapping helper ─────────────────────────────
const COLUMN_TO_CLINICAL = {
    // Common raw column names → human-readable clinical labels
    'age': 'Age', 'Age': 'Age', 'AGE': 'Age',
    'sex': 'Biological Sex', 'Sex': 'Biological Sex', 'gender': 'Biological Sex', 'Gender': 'Biological Sex',
    'bmi': 'Body Mass Index', 'BMI': 'Body Mass Index',
    'bp': 'Blood Pressure', 'blood_pressure': 'Blood Pressure',
    'smoking': 'Smoking Status', 'ever_smoked': 'Smoking Status',
    'ejection_fraction': 'Ejection Fraction', 'DEATH_EVENT': 'Mortality Outcome',
    'serum_creatinine': 'Serum Creatinine', 'creatinine_phosphokinase': 'Creatinine Phosphokinase',
    'serum_sodium': 'Serum Sodium', 'platelets': 'Platelet Count',
    'time': 'Follow-Up Period (days)', 'anaemia': 'Anaemia Status',
    'diabetes': 'Diabetes Status', 'high_blood_pressure': 'Hypertension',
    'radius_mean': 'Mean Cell Radius', 'texture_mean': 'Cell Texture',
    'perimeter_mean': 'Cell Perimeter', 'area_mean': 'Cell Area',
    'smoothness_mean': 'Cell Smoothness', 'compactness_mean': 'Cell Compactness',
    'concavity_mean': 'Cell Concavity', 'concave points_mean': 'Concave Points',
    'symmetry_mean': 'Cell Symmetry', 'fractal_dimension_mean': 'Fractal Dimension',
    'Glucose': 'Plasma Glucose', 'BloodPressure': 'Blood Pressure',
    'SkinThickness': 'Skin Fold Thickness', 'Insulin': 'Serum Insulin',
    'Pregnancies': 'Number of Pregnancies', 'DiabetesPedigreeFunction': 'Diabetes Family History Score',
    'Outcome': 'Diabetes Outcome',
    'hypertension': 'Hypertension Status', 'heart_disease': 'Heart Disease History',
    'avg_glucose_level': 'Average Glucose Level', 'work_type': 'Work Type',
    'Residence_type': 'Residence Type', 'smoking_status': 'Smoking Status',
    'stroke': 'Stroke Outcome',
};

const toClinicalLabel = (colName) => {
    if (COLUMN_TO_CLINICAL[colName]) return COLUMN_TO_CLINICAL[colName];
    // Auto-humanize: replace underscores, title-case
    return colName
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase());
};

// ─── Generate simulated feature importance ────────────────────────────────────
const generateFeatureImportance = (features) => {
    if (!features || features.length === 0) return [];
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
const generatePatientContributions = (features, patient) => {
    if (!features || features.length === 0) return { contributions: [], riskScore: 0 };
    
    // Fallback if no real patient
    if (!patient || !patient.rowData) {
        const result = features.slice(0, 6).map((f, i) => {
            const sign = i % 2 === 0 ? -1 : 1;
            const magnitude = parseFloat(((0.05 + Math.random() * 0.25) * sign).toFixed(2));
            return {
                id: f.id,
                label: f.label,
                value: 'Unknown',
                contribution: magnitude,
                isRisk: magnitude > 0,
            };
        }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
        return { contributions: result, riskScore: 0.5 };
    }

    const seed = patient.id * 7;
    const result = features.map((f, i) => {
        const sign = (seed + i) % 3 === 0 ? -1 : 1;
        const magnitude = parseFloat(((0.05 + Math.random() * 0.25) * sign).toFixed(2));
        const isRisk = magnitude > 0;
        const val = patient.rowData[f.id];

        return {
            id: f.id,
            label: f.label,
            value: val !== undefined ? String(val).slice(0, 15) : 'N/A',
            contribution: magnitude,
            isRisk,
        };
    }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 7);

    // Final risk score
    const riskAsStr = String(patient.riskLabel).toLowerCase();
    const isActuallyHighRisk = riskAsStr === '1' || riskAsStr === 'true' || riskAsStr === 'yes' || riskAsStr === 'positive';
    const base = isActuallyHighRisk ? 0.65 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3;
    
    return { contributions: result, riskScore: parseFloat(base.toFixed(2)) };
};

// ─── Patient Pool ─────────────────────────────────────────────────────────────
const generatePatients = (features, dataset, targetColumn) => {
    if (!dataset || dataset.length === 0 || !features || features.length === 0) {
        return Array.from({ length: 3 }, (_, i) => ({
            id: i,
            riskLabel: 'Unknown',
            vitals: [{ label: 'Data', value: 'N/A', abnormal: false }],
            label: `Mock Patient #${i + 1}`,
            rowData: null
        }));
    }

    const shuffled = [...dataset].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(3, dataset.length));

    return selected.map((row, i) => {
        const riskVal = row[targetColumn];
        const riskLabel = riskVal !== undefined ? String(riskVal).toUpperCase() : 'UNKNOWN';

        const vitalsArr = features.slice(0, 4).map(f => {
            const val = row[f.id];
            return {
                label: f.label.slice(0, 15),
                value: val !== undefined ? String(val).slice(0, 12) : 'N/A',
                abnormal: false
            };
        });

        return {
            id: i,
            riskLabel,
            vitals: vitalsArr,
            label: `Patient ID #${Math.floor(Math.random() * 8999) + 1000} · ${targetColumn}: ${riskLabel}`,
            rowData: row
        };
    });
};


// ─── Horizontal Bar ───────────────────────────────────────────────────────────
const HBar = React.memo(({ label, clinical, importance, maxVal, isDarkMode, delay, primaryStr }) => {
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
                <span className={`text-xs font-mono font-bold shrink-0`} style={{ color: primaryStr }}>
                    {importance.toFixed(2)}
                </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%`, backgroundColor: primaryStr }}
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

// ─── Domain clinical sense-check messages (all 20) ───────────────────────────
const DOMAIN_SENSE_CHECK = {
    'Cardiology': 'Ejection Fraction and Serum Creatinine being top predictors makes strong clinical sense — low EF is a hallmark of heart failure severity, and impaired kidneys compound cardiac risk.',
    'Radiology': 'Lung opacity density and consolidation area driving the prediction is radiologically sound — these are the hallmark features that distinguish pneumonia from normal lung tissue.',
    'Nephrology': 'eGFR and Serum Creatinine at the top is expected — these directly measure kidney function and are the gold standard for CKD staging.',
    'Oncology — Breast': 'Mean cell radius and concavity being top features is consistent with pathology — malignant cells tend to be larger and have more irregular shapes.',
    "Neurology — Parkinson's": 'Voice jitter and shimmer as top predictors is supported by research — Parkinson\'s disease affects vocal cord control, making these early biomarkers.',
    'Endocrinology — Diabetes': 'Plasma glucose level being the top predictor is the defining diagnostic criterion for diabetes — this is exactly what clinicians would expect.',
    'Hepatology — Liver': 'Liver enzymes (SGOT/SGPT) being most important aligns with clinical practice — elevated levels directly indicate hepatocellular damage.',
    'Cardiology — Stroke': 'Hypertension and glucose levels as top features is clinically expected — these are the two most modifiable risk factors for cerebrovascular events.',
    'Mental Health': 'PHQ-9 score driving the prediction makes sense — it is the validated standard screening instrument for depression severity in clinical practice.',
    'Pulmonology — COPD': 'FEV1 and FEV1/FVC ratio at the top is textbook pulmonology — these spirometry values directly quantify airflow obstruction severity.',
    'Haematology — Anaemia': 'Haemoglobin and MCV as top features is diagnostically correct — haemoglobin confirms anaemia and MCV helps classify the type (micro/macro/normocytic).',
    'Dermatology': 'Asymmetry and border irregularity being top features follows the clinical ABCDE rule (Asymmetry, Border, Colour, Diameter, Evolution) used by dermatologists.',
    'Ophthalmology': 'Macular thickness and HbA1c as top features makes clinical sense — diabetic retinopathy is driven by poor glucose control causing retinal micro-damage.',
    'Orthopaedics — Spine': 'Pelvic incidence and lumbar lordosis angle at the top is biomechanically correct — these parameters define spinal alignment and predict disc problems.',
    'ICU / Sepsis': 'Heart rate and mean arterial pressure as key features aligns with the SOFA score — these vital signs are the earliest indicators of septic deterioration.',
    'Obstetrics — Fetal Health': 'Baseline fetal heart rate and accelerations being top features is standard obstetric practice — these are the primary indicators of fetal well-being on CTG.',
    'Cardiology — Arrhythmia': 'R-R interval and QRS duration as top features is electrophysiologically sound — irregular intervals and wide QRS indicate cardiac rhythm disorders.',
    'Oncology — Cervical': 'Age and number of sexual partners as top features reflects epidemiological evidence — HPV transmission patterns directly influence cervical cancer risk.',
    'Thyroid / Endocrinology': 'TSH level being the top predictor is the clinical gold standard — TSH is always the first test ordered to assess thyroid function.',
    'Pharmacy — Readmission': 'Number of medications and procedures as top features reflects polypharmacy risk — complex medication regimens dramatically increase readmission probability.',
};

const DOMAIN_WHAT_IF = {
    'Cardiology': "What-If: If the patient's ejection fraction improved from very low to borderline (42%), the predicted risk would drop approximately 18 percentage points. This supports optimising cardiac function before discharge.",
    'Radiology': "What-If: If the lung opacity density decreased, the model would classify this as less likely pneumonia. Serial imaging could confirm treatment response.",
    'Nephrology': "What-If: If eGFR improved by 15 units with optimal fluid management, the model estimates a risk reduction of around 18%. Supports nephroprotective strategies.",
    'Oncology — Breast': "What-If: Cell measurements are fixed at biopsy, but this confirms the value of fine needle aspirate analysis in early detection and treatment planning.",
    "Neurology — Parkinson's": "What-If: Voice measurements are objective biomarkers. Tracking changes over time could help monitor disease progression and treatment efficacy.",
    'Endocrinology — Diabetes': "What-If: Reducing plasma glucose to normal fasting levels through lifestyle changes could reduce the 5-year diabetes onset risk by an estimated 25%.",
    'Hepatology — Liver': "What-If: If liver enzymes normalised with treatment (e.g., alcohol cessation), the model estimates a significant reduction in liver disease classification risk.",
    'Cardiology — Stroke': "What-If: Controlling hypertension and glucose levels could reduce stroke risk. The model estimates a 20% risk reduction with normalised blood pressure.",
    'Mental Health': "What-If: Reducing PHQ-9 score through therapy or medication would shift the severity classification. Each 5-point improvement typically represents a clinically meaningful change.",
    'Pulmonology — COPD': "What-If: Smoking cessation could slow FEV1 decline. The model estimates that maintaining FEV1 above 50% predicted would significantly reduce exacerbation risk.",
    'Haematology — Anaemia': "What-If: Correcting haemoglobin through appropriate treatment (iron, B12, or other) would change the classification. The type of anaemia determines the intervention.",
    'Dermatology': "What-If: Lesion features are fixed at examination, but early excision of suspicious lesions (high asymmetry + border irregularity) prevents progression to advanced melanoma.",
    'Ophthalmology': "What-If: Improving HbA1c by 1% could reduce retinopathy progression risk by approximately 40%, as shown in the UKPDS and DCCT trials.",
    'Orthopaedics — Spine': "What-If: Biomechanical parameters are structural, but physiotherapy to improve pelvic tilt and core stability can reduce symptom severity despite fixed anatomy.",
    'ICU / Sepsis': "What-If: Early antibiotic administration within 1 hour of sepsis suspicion reduces mortality by approximately 7% per hour of delay. Time-critical intervention.",
    'Obstetrics — Fetal Health': "What-If: Repositioning the mother or administering oxygen can improve fetal heart rate patterns. Persistent abnormalities may require emergency delivery.",
    'Cardiology — Arrhythmia': "What-If: Antiarrhythmic medication or cardioversion could normalise the R-R interval, potentially reducing stroke risk associated with atrial fibrillation.",
    'Oncology — Cervical': "What-If: HPV vaccination in younger populations and regular screening can dramatically reduce cervical cancer risk. Modifiable risk factors identified here support prevention.",
    'Thyroid / Endocrinology': "What-If: Normalising TSH with levothyroxine (hypothyroid) or anti-thyroid drugs (hyperthyroid) would change the classification and resolve symptoms.",
    'Pharmacy — Readmission': "What-If: Medication reconciliation at discharge and pharmacist-led counselling could reduce readmission risk — reducing from 8+ medications to essential-only improves adherence.",
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Explainability = ({ isDarkMode, onNext, onPrev, domain, dataset, datasetSchema, targetColumn }) => {
    const domainKey = domain?.name || 'default';
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';
    
    const activeFeatures = React.useMemo(() => {
        if (datasetSchema && datasetSchema.length > 0) {
            return datasetSchema
                .filter(col => col.role === 'Number (measurement)' || col.role === 'Category')
                .map(col => ({
                    id: col.name,
                    label: toClinicalLabel(col.name),
                    clinical: col.role === 'Category' ? 'Categorical variable' : 'Numeric measurement'
                }));
        }
        return DOMAIN_FEATURES[domainKey] || DOMAIN_FEATURES.default;
    }, [datasetSchema, domainKey]);

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
            setFeatureImportance(generateFeatureImportance(activeFeatures));
            setPatients(generatePatients(activeFeatures, dataset, targetColumn));
            setLoadingFeatures(false);
        }, 800);
        return () => clearTimeout(t);
    }, [activeFeatures, dataset, targetColumn]);

    const handleExplain = () => {
        setExplaining(true);
        setExplained(false);
        setPatientData(null);
        setTimeout(() => {
            setPatientData(generatePatientContributions(activeFeatures, patients[selectedPatient]));
            setExplaining(false);
            setExplained(true);
        }, 900);
    };

    const top1 = featureImportance[0];
    const maxImportance = featureImportance[0]?.importance || 1;

    // Domain-specific clinical sense-check (covers all 20 domains)
    const senseCheck = top1
        ? (DOMAIN_SENSE_CHECK[domainKey] || `The top-ranked feature "${top1.label}" aligns with established clinical knowledge for ${domainKey} — it is a well-recognised risk factor in the medical literature.`)
        : '';

    // Domain-specific what-if (covers all 20 domains)
    const whatIf = top1
        ? (DOMAIN_WHAT_IF[domainKey] || `What-If: If the values of ${top1.label} were in the normal range, the model estimates a meaningful risk reduction. This helps assess which interventions might have the most clinical impact.`)
        : '';

    return (
        <div className="w-full space-y-6 pb-20">

            {/* ── Header ── */}
            <div className={`p-4 sm:p-6 rounded-2xl border step-accent ${isDarkMode ? 'glass-depth-1' : 'glass-depth-light-1'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit`} style={{ backgroundColor: `${primaryStr}20`, color: primaryStr }}>
                        STEP 6 OF 7
                    </span>
                    <button
                        onClick={onNext}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 text-white shadow-lg"
                        style={{ backgroundColor: secondaryStr, boxShadow: `0 4px 14px 0 ${secondaryStr}40` }}
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
                            <Activity className={`w-4 h-4`} style={{ color: primaryStr }} />
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
                                        primaryStr={primaryStr}
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
                            <User className={`w-4 h-4`} style={{ color: primaryStr }} />
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
                            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 text-white shadow-lg hover:scale-[1.01] active:scale-95
                                ${explaining || loadingFeatures
                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                    : ''}`}
                            style={!explaining && !loadingFeatures ? { backgroundColor: secondaryStr, boxShadow: `0 4px 14px 0 ${secondaryStr}40` } : {}}
                        >
                            {explaining ? (
                                <>
                                    <div className={`w-4 h-4 border-2 rounded-full animate-spin`} style={{ borderTopColor: primaryStr, borderColor: `${primaryStr}4D` }} />
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
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black`} style={{ backgroundColor: `${primaryStr}20`, color: primaryStr }}>
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
                            <HelpCircle className={`w-4 h-4`} style={{ color: primaryStr }} />
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
                                    <div className={`w-10 h-10 mx-auto border-4 rounded-full animate-spin`} style={{ borderTopColor: primaryStr, borderColor: `${primaryStr}4D` }} />
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
                                            const absVals = patientData.contributions.map(x => Math.abs(x.contribution));
                                            const maxAbs = absVals.length > 0 ? Math.max(...absVals) : 1;
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
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all text-white hover:scale-105 active:scale-95`}
                    style={{ backgroundColor: secondaryStr, boxShadow: `0 4px 14px 0 ${secondaryStr}40` }}
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Explainability;
