import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, BookOpen, Layers, HelpCircle, ChevronRight,
    CheckCircle2, AlertTriangle, Info, Lock, Unlock,
    Activity, Database, Sliders, BarChart3, Lightbulb,
    Shield, FileText, Search
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPECIALTIES = [
    { n: 1, name: 'Cardiology', predicts: '30-day readmission risk after heart failure discharge', source: 'Heart Failure Clinical Records', target: 'DEATH_EVENT (binary)' },
    { n: 2, name: 'Radiology', predicts: 'Normal vs. pneumonia from clinical features', source: 'NIH Chest X-Ray metadata', target: 'Finding Label (binary/multi)' },
    { n: 3, name: 'Nephrology', predicts: 'Chronic kidney disease stage from routine lab values', source: 'UCI CKD Dataset (400 patients)', target: 'classification (CKD / not CKD)' },
    { n: 4, name: 'Oncology — Breast', predicts: 'Malignancy of a breast biopsy from cell measurements', source: 'Wisconsin Breast Cancer Dataset', target: 'diagnosis (M/B)' },
    { n: 5, name: "Neurology — Parkinson's", predicts: "Parkinson's disease from voice biomarkers", source: "UCI Parkinson's Dataset", target: 'status (0/1)' },
    { n: 6, name: 'Endocrinology — Diabetes', predicts: 'Diabetes onset within 5 years from metabolic markers', source: 'Pima Indians Diabetes Dataset', target: 'Outcome (0/1)' },
    { n: 7, name: 'Hepatology — Liver', predicts: 'Liver disease from blood test results', source: 'Indian Liver Patient Dataset', target: 'Dataset (liver disease y/n)' },
    { n: 8, name: 'Cardiology — Stroke', predicts: 'Stroke risk from demographics and comorbidities', source: 'Kaggle Stroke Prediction Dataset', target: 'stroke (0/1)' },
    { n: 9, name: 'Mental Health', predicts: 'Depression severity from PHQ-9 survey responses', source: 'Kaggle Depression/Anxiety Dataset', target: 'severity class' },
    { n: 10, name: 'Pulmonology — COPD', predicts: 'COPD exacerbation risk from spirometry data', source: 'Kaggle / PhysioNet COPD Dataset', target: 'exacerbation (y/n)' },
    { n: 11, name: 'Haematology — Anaemia', predicts: 'Type of anaemia from full blood count results', source: 'Kaggle Anaemia Classification Dataset', target: 'anemia_type (multi-class)' },
    { n: 12, name: 'Dermatology', predicts: 'Benign vs. malignant skin lesion from dermoscopy features', source: 'HAM10000 metadata (Kaggle)', target: 'dx_type (benign / malignant)' },
    { n: 13, name: 'Ophthalmology', predicts: 'Diabetic retinopathy severity from clinical findings', source: 'UCI / Kaggle Retinopathy Dataset', target: 'severity grade' },
    { n: 14, name: 'Orthopaedics — Spine', predicts: 'Normal vs. disc herniation from biomechanical measures', source: 'UCI Vertebral Column Dataset', target: 'class (Normal / Abnormal)' },
    { n: 15, name: 'ICU / Sepsis', predicts: 'Sepsis onset from vital signs and lab results', source: 'PhysioNet / Kaggle Sepsis Dataset', target: 'SepsisLabel (0/1)' },
    { n: 16, name: 'Obstetrics — Fetal Health', predicts: 'Fetal cardiotocography classification (normal / suspect / pathological)', source: 'UCI Fetal Health Dataset', target: 'fetal_health (1/2/3)' },
    { n: 17, name: 'Cardiology — Arrhythmia', predicts: 'Cardiac arrhythmia presence from ECG features', source: 'UCI Arrhythmia Dataset', target: 'arrhythmia (0/1)' },
    { n: 18, name: 'Oncology — Cervical', predicts: 'Cervical cancer risk from demographic and behavioural data', source: 'UCI Cervical Cancer Dataset', target: 'Biopsy (0/1)' },
    { n: 19, name: 'Thyroid / Endocrinology', predicts: 'Thyroid function classification (hypo / hyper / normal)', source: 'UCI Thyroid Disease Dataset', target: 'class (3 types)' },
    { n: 20, name: 'Pharmacy — Readmission', predicts: 'Hospital readmission risk for diabetic patients on medication', source: 'UCI Diabetes 130-US Hospitals Dataset', target: 'readmitted (<30 / >30 / NO)' },
];

const STEPS_TABLE = [
    { n: 1, name: 'Clinical Context', icon: BookOpen, what: 'Read about the medical problem the AI is trying to solve in your chosen specialty.', access: 'Always available', color: 'text-sky-500' },
    { n: 2, name: 'Data Exploration', icon: Database, what: 'Upload a patient dataset (or use the built-in example) and review the data.', access: 'Always available', color: 'text-violet-500' },
    { n: 3, name: 'Data Preparation', icon: Sliders, what: 'Choose how to handle missing values, normalise measurements, and split data into training and test groups.', access: 'Unlocks after Step 2', color: 'text-amber-500' },
    { n: 4, name: 'Model & Parameters', icon: Activity, what: 'Select one of six AI model types and adjust its settings using sliders.', access: 'Unlocks after Step 3', color: 'text-indigo-500' },
    { n: 5, name: 'Results', icon: BarChart3, what: 'See how well the AI performed, including how many patients were correctly identified.', access: 'Unlocks after Step 4', color: 'text-emerald-500' },
    { n: 6, name: 'Explainability', icon: Lightbulb, what: 'Find out which measurements mattered most and why the AI made a specific prediction for a patient.', access: 'Unlocks after Step 5', color: 'text-orange-500' },
    { n: 7, name: 'Ethics & Bias', icon: Shield, what: 'Check whether the AI treats different patient groups fairly and review an EU AI Act compliance checklist.', access: 'Always available', color: 'text-rose-500' },
];

const MODELS_TABLE = [
    { name: 'K-Nearest Neighbors (KNN)', plain: "Compares a new patient to the K most similar historical patients and predicts the same outcome as the majority. Like asking the nearest neighbours what they experienced.", adjust: 'K — how many past patients to compare (1–25). Distance measure — straight-line vs. city-block similarity.' },
    { name: 'Support Vector Machine (SVM)', plain: 'Finds the clearest dividing line between two groups of patients in the data. Good at separating complex, curved patterns.', adjust: 'Kernel — shape of the decision boundary. C (Strictness) — how hard the model tries to correctly classify every training patient.' },
    { name: 'Decision Tree', plain: 'Asks a series of yes/no questions about patient measurements and follows the branches to reach a prediction — like a clinical decision pathway.', adjust: 'Maximum Depth — how many questions the model can ask. More questions = more complex, but risks memorising training patients.' },
    { name: 'Random Forest', plain: 'Trains many decision trees simultaneously, each slightly different, then takes a majority vote. More stable and accurate than a single tree.', adjust: 'Number of Trees — more trees means more stable results but takes longer to train. Maximum Depth Per Tree — complexity of each individual tree.' },
    { name: 'Logistic Regression', plain: 'Calculates the probability that a patient belongs to one outcome group, based on a weighted combination of their measurements.', adjust: 'C (Regularisation) — smaller value = simpler model, less likely to overfit. Maximum Iterations — how long the model trains before stopping.' },
    { name: 'Naive Bayes', plain: "Uses probability theory to estimate how likely each outcome is, given a patient's measurements. Very fast and transparent.", adjust: 'Variance Smoothing — a technical stability setting that rarely needs changing. Good for seeing quick, interpretable results.' },
];

const METRICS_TABLE = [
    { name: 'Accuracy', meaning: 'Out of all test patients, what percentage did the AI classify correctly?', concern: 'Below 65% — the model is not performing reliably.' },
    { name: 'Sensitivity ⭐', meaning: 'Of patients who WERE readmitted (or had the condition), how many did the AI catch?', concern: 'Below 70% — the model is missing too many real cases. This is the most important measure for any screening task.' },
    { name: 'Specificity', meaning: 'Of patients who were NOT readmitted, how many did the AI correctly identify as safe?', concern: 'Below 65% — too many unnecessary follow-up actions or referrals.' },
    { name: 'Precision', meaning: 'Of all patients the AI flagged as high-risk, how many actually were high-risk?', concern: 'Below 60% — many false alarms, which waste clinical resources.' },
    { name: 'F1 Score', meaning: 'A combined score balancing Sensitivity and Precision. Useful when both missing cases and false alarms have real costs.', concern: 'Below 65% — the model struggles to balance catching cases and avoiding false alarms.' },
    { name: 'AUC-ROC', meaning: 'A 0.5–1.0 score for how well the model separates high-risk from low-risk patients overall. 0.5 = no better than chance; 1.0 = perfect.', concern: 'Below 0.75 — the model cannot reliably distinguish between patient groups.' },
];

const GLOSSARY = [
    { term: 'Algorithm', def: 'A set of step-by-step instructions a computer follows to find patterns in patient data and make predictions — like a fast, data-driven decision checklist.' },
    { term: 'Training Data', def: 'Historical patient records the model learns from. Similar to a doctor reviewing past cases before seeing new patients.' },
    { term: 'Test Data', def: 'Patients the model has never seen, used to measure how well the AI performs. If a model only works on training data, it has memorised rather than learned.' },
    { term: 'Features', def: 'The input measurements (columns in your data) used to make predictions — for example, age, blood pressure, creatinine level, smoking status.' },
    { term: 'Target Variable', def: 'The outcome the model is trying to predict — for example, readmission, diagnosis, survival, or disease stage.' },
    { term: 'Overfitting', def: "When a model memorises the training cases so precisely that it fails on new patients. Like a student who memorises exam answers but cannot apply the knowledge." },
    { term: 'Underfitting', def: 'When a model is too simple to learn anything useful. Like a clinician who gives the same diagnosis regardless of symptoms.' },
    { term: 'Normalisation', def: 'Adjusting all measurements to the same scale so no single measurement dominates because of its units. Age (0–100) and a troponin level (0–50,000) must be rescaled before they can be compared fairly.' },
    { term: 'Class Imbalance', def: 'When one outcome is much rarer than the other in the training data. A model trained on 95% negative cases may simply predict negative for everyone and appear 95% accurate — but miss all real cases.' },
    { term: 'SMOTE', def: 'Synthetic Minority Over-sampling Technique. Creates artificial examples of the rare outcome to balance the training data. Applied to training data only — never to test patients.' },
    { term: 'Sensitivity', def: 'Of all patients who truly have the condition, what fraction did the model correctly identify? Low sensitivity means the model misses real cases. Critical in any screening application.' },
    { term: 'Specificity', def: 'Of all patients who truly do not have the condition, what fraction did the model correctly call healthy? Low specificity means too many false alarms.' },
    { term: 'Precision', def: 'Of all patients the model flagged as positive, what fraction actually were? Low precision means many unnecessary referrals or treatments.' },
    { term: 'F1 Score', def: 'A single number that balances Sensitivity and Precision. Useful when both false negatives and false positives have real clinical costs.' },
    { term: 'AUC-ROC', def: 'A score from 0.5 (random guessing) to 1.0 (perfect separation) summarising how well the model distinguishes between positive and negative patients. Above 0.8 is considered good.' },
    { term: 'Confusion Matrix', def: 'A 2×2 table showing: correctly identified sick patients, correctly identified healthy patients, healthy patients incorrectly flagged as sick, and sick patients incorrectly called safe.' },
    { term: 'Feature Importance', def: 'A ranking of which patient measurements the model relied on most. Helps confirm whether the AI is using clinically meaningful signals.' },
    { term: 'Hyperparameter', def: 'A setting chosen before training that controls model behaviour — for example, K in KNN or tree depth in Decision Tree. Not learned from data; set by the user via sliders.' },
    { term: 'Bias (AI)', def: 'When a model performs significantly worse for certain patient subgroups (for example, older patients, women, or ethnic minorities) because they were under-represented in the training data.' },
    { term: 'Cross-Validation', def: 'Splitting the data multiple times and averaging results to get a more reliable performance estimate than a single train/test split.' },
];

const TABS = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'specialties', label: 'Specialties', icon: Layers },
    { id: 'steps', label: 'Steps 1–7', icon: ChevronRight },
    { id: 'models', label: 'AI Models', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'glossary', label: 'Glossary', icon: HelpCircle },
];

// ─── Section helpers ─────────────────────────────────────────────────────────

const SectionTitle = ({ children, isDarkMode }) => (
    <h3 className={`text-lg font-bold mb-3 pb-2 border-b ${isDarkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>
        {children}
    </h3>
);

const InfoBox = ({ color, icon: Icon, title, children, isDarkMode }) => {
    const colors = {
        green: { bg: isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800', ic: 'text-emerald-500' },
        amber: { bg: isDarkMode ? 'bg-amber-900/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800', ic: 'text-amber-500' },
        blue: { bg: isDarkMode ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800', ic: 'text-blue-500' },
        red: { bg: isDarkMode ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800', ic: 'text-red-500' },
    };
    const c = colors[color] || colors.blue;
    return (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm leading-relaxed ${c.bg}`}>
            {Icon && <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${c.ic}`} />}
            <div><strong>{title} </strong>{children}</div>
        </div>
    );
};

// ─── Tab Content ─────────────────────────────────────────────────────────────

const OverviewTab = ({ isDarkMode }) => (
    <div className="space-y-6">
        <div>
            <SectionTitle isDarkMode={isDarkMode}>1. What Is This Tool?</SectionTitle>
            <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                The <strong>HEALTH-AI ML Learning Tool</strong> helps doctors, nurses, and other healthcare professionals understand how artificial intelligence and machine learning work in real clinical settings — without any technical background.
            </p>
            <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                You will work through <strong>seven guided steps</strong> that take you from choosing a medical specialty, all the way through uploading patient data, training an AI model, and interpreting the results. Every screen uses plain clinical language, and every number is explained in terms of patient outcomes.
            </p>
            <InfoBox color="green" icon={CheckCircle2} title="✅ No technical experience needed —" isDarkMode={isDarkMode}>
                This tool runs entirely in your web browser. There is nothing to install, no command line to use, and no coding required.
            </InfoBox>
        </div>

        <div>
            <SectionTitle isDarkMode={isDarkMode}>🏥 Who Is This For?</SectionTitle>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Doctors, nurses, clinical researchers, and allied health professionals. No computer science background is required. You should be able to complete the full walkthrough in <strong>under 45 minutes</strong>.
            </p>
        </div>

        <div>
            <SectionTitle isDarkMode={isDarkMode}>How to Get Started</SectionTitle>
            <ol className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {[
                    'Open the tool in any modern web browser (Chrome, Firefox, Edge, or Safari).',
                    'Select your medical specialty from the row of buttons below the navigation bar.',
                    'Follow the seven steps in order — the progress bar always shows where you are.',
                    'No login is required for educational use.',
                ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${isDarkMode ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{i + 1}</span>
                        <span>{step}</span>
                    </li>
                ))}
            </ol>
        </div>

        <div>
            <SectionTitle isDarkMode={isDarkMode}>Step 0 — Choose Your Medical Specialty</SectionTitle>
            <p className={`text-sm leading-relaxed mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Before you begin, select the medical area you want to explore. The tool supports <strong>20 clinical specialties</strong>. Click the relevant button at the top of the screen; the entire tool will update to use data and language relevant to that specialty.
            </p>
            <InfoBox color="amber" icon={AlertTriangle} title="⚠️ Switching specialty resets the pipeline —" isDarkMode={isDarkMode}>
                If you change your specialty after you have already started working, all your current progress will be reset and you will return to Step 1.
            </InfoBox>
        </div>
    </div>
);

const SpecialtiesTab = ({ isDarkMode }) => (
    <div className="space-y-4">
        <SectionTitle isDarkMode={isDarkMode}>Table 1. Medical Specialties and Sample Datasets</SectionTitle>
        <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>All 20 supported specialties, their prediction task, data source, and target variable.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
                <thead className={isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                    <tr>
                        {['#', 'Specialty', 'What the AI Predicts', 'Data Source', 'Target Variable'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                    {SPECIALTIES.map(s => (
                        <tr key={s.n} className={`${isDarkMode ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-slate-50 text-slate-700'} transition-colors`}>
                            <td className={`px-3 py-2 font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{s.n}</td>
                            <td className="px-3 py-2 font-medium whitespace-nowrap">{s.name}</td>
                            <td className="px-3 py-2">{s.predicts}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{s.source}</td>
                            <td className={`px-3 py-2 font-mono text-[10px] whitespace-nowrap ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{s.target}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const StepsTab = ({ isDarkMode }) => (
    <div className="space-y-6">
        <div>
            <SectionTitle isDarkMode={isDarkMode}>Table 2. The Seven-Step Journey</SectionTitle>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                <table className="w-full text-xs">
                    <thead className={isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                        <tr>
                            {['Step', 'Name', 'What You Do', 'Access'].map(h => (
                                <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                        {STEPS_TABLE.map(s => {
                            const Icon = s.icon;
                            return (
                                <tr key={s.n} className={`${isDarkMode ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-slate-50 text-slate-700'} transition-colors`}>
                                    <td className="px-3 py-2.5">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>{s.n}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <Icon className={`w-3.5 h-3.5 shrink-0 ${s.color}`} />
                                            <span className="font-semibold whitespace-nowrap">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5">{s.what}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.access === 'Always available'
                                            ? isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                            : isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                                            }`}>{s.access}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Step-by-step detail */}
        {[
            {
                n: 1, title: 'Step 1 — Clinical Context', color: 'sky',
                body: "This screen introduces you to the clinical problem the AI is trying to solve. You will see a description of the medical condition, the patient population, and what outcome the AI is predicting. You do not need to do anything on this screen other than read and familiarise yourself with the context. When you are ready, click Next to move to Step 2.",
                tips: [],
            },
            {
                n: 2, title: 'Step 2 — Data Exploration', color: 'violet',
                body: "This is where you decide which patient data to use. You can use the built-in example dataset (pre-loaded and ready immediately) or upload your own CSV file (one row per patient, one column per measurement, max 50 MB).",
                tips: [
                    '🔒 Your data is private — uploaded files are never saved to any server.',
                    '🔑 You must open the Column Mapper, confirm the target column, and click Save before Step 3 unlocks.',
                ],
            },
            {
                n: 3, title: 'Step 3 — Data Preparation', color: 'amber',
                body: 'Before the AI can learn from patient data, the data needs to be cleaned and prepared. Control the Training vs. Testing split, how missing values are handled (Median / Mode / Remove), normalisation method (Z-score / Min-Max / None), and whether SMOTE is applied to address class imbalance.',
                tips: [
                    'Median imputation is recommended for most clinical datasets.',
                    'Z-score normalisation is recommended when measurements are on very different scales.',
                    'SMOTE only applies to training data — never to test patients.',
                ],
            },
            {
                n: 4, title: 'Step 4 — Model & Parameters', color: 'indigo',
                body: 'Choose one of six AI model types and adjust its settings using sliders. Auto-Retrain (default: on) retrains the model whenever you change a slider. Use + Compare to add trained models to the comparison table.',
                tips: [],
            },
            {
                n: 5, title: 'Step 5 — Results', color: 'emerald',
                body: 'See how well the AI performed on patients it has never seen before. Six performance measures are shown with clinical thresholds and a Confusion Matrix. A red banner appears automatically if Sensitivity falls below 50%.',
                tips: [
                    '🚨 If Sensitivity < 50%, return to Step 4 and try a different model or parameter.',
                ],
            },
            {
                n: 6, title: 'Step 6 — Explainability', color: 'orange',
                body: "A ranked bar chart shows which measurements had the most influence across all patients. Select a specific test patient to see a waterfall chart explaining what pushed the AI's prediction up or down, labelled in plain clinical language.",
                tips: [
                    '⚕️ These explanations show associations — they do not prove causation.',
                    'A clinician must always decide whether and how to act on any AI prediction.',
                ],
            },
            {
                n: 7, title: 'Step 7 — Ethics & Bias', color: 'rose',
                body: 'Check subgroup performance across gender and age groups. A 🔴 bias banner appears if any subgroup sensitivity is >10pp below the overall average. Complete the 8-item EU AI Act checklist and download your Summary Certificate.',
                tips: [],
            },
        ].map(s => (
            <div key={s.n} className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>{s.n}</span>
                    <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.title}</h4>
                </div>
                <p className={`text-[12px] leading-relaxed mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.body}</p>
                {s.tips.length > 0 && (
                    <ul className="space-y-1">
                        {s.tips.map((t, i) => (
                            <li key={i} className={`text-[11px] leading-relaxed pl-3 border-l-2 border-indigo-500/40 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t}</li>
                        ))}
                    </ul>
                )}
            </div>
        ))}
    </div>
);

const ModelsTab = ({ isDarkMode }) => (
    <div className="space-y-4">
        <SectionTitle isDarkMode={isDarkMode}>Table 3. The Six AI Model Types</SectionTitle>
        <div className="space-y-3">
            {MODELS_TABLE.map((m, i) => (
                <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h4 className={`font-bold text-sm mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{m.name}</h4>
                    <p className={`text-[12px] leading-relaxed mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{m.plain}</p>
                    <div className={`text-[11px] px-3 py-2 rounded-lg ${isDarkMode ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                        <span className="font-semibold">Adjustable: </span>{m.adjust}
                    </div>
                </div>
            ))}
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'}`}>
            <h4 className={`font-bold text-sm mb-2 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>💡 Auto-Retrain</h4>
            <p className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                When Auto-Retrain is on (the default), the model automatically retrains whenever you move a slider, so results update in real time. For large datasets (&gt;10,000 patients) you may want to turn this off and click Train Model manually.
            </p>
        </div>
    </div>
);

const MetricsTab = ({ isDarkMode }) => (
    <div className="space-y-4">
        <SectionTitle isDarkMode={isDarkMode}>Table 4. The Six Performance Measures</SectionTitle>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
            <table className="w-full text-xs">
                <thead className={isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                    <tr>
                        {['Measure', 'What It Means in Clinical Terms', 'When to Be Concerned'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                    {METRICS_TABLE.map(m => (
                        <tr key={m.name} className={`${isDarkMode ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                            <td className={`px-3 py-3 font-semibold whitespace-nowrap ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{m.name}</td>
                            <td className="px-3 py-3">{m.meaning}</td>
                            <td className={`px-3 py-3 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{m.concern}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <SectionTitle isDarkMode={isDarkMode}>The Confusion Matrix</SectionTitle>
        <div className="overflow-x-auto">
            <table className={`w-full text-xs border rounded-xl overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <thead className={isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                    <tr>
                        <th className="px-4 py-3" />
                        <th className="px-4 py-3 text-center font-semibold">AI Predicted: NOT at Risk</th>
                        <th className="px-4 py-3 text-center font-semibold">AI Predicted: AT RISK</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <td className={`px-4 py-3 font-semibold text-xs ${isDarkMode ? 'text-slate-400 bg-slate-800/30' : 'text-slate-500 bg-slate-50'}`}>Actually NOT at Risk</td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-800'}`}>✅ Correctly called safe (True Negative)</td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>⚠️ Unnecessary alarm — patient was fine (False Positive)</td>
                    </tr>
                    <tr className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <td className={`px-4 py-3 font-semibold text-xs ${isDarkMode ? 'text-slate-400 bg-slate-800/30' : 'text-slate-500 bg-slate-50'}`}>Actually AT RISK</td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-800'}`}>❌ MISSED — patient returned to hospital (False Negative — most dangerous)</td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-800'}`}>✅ Correctly flagged as high-risk (True Positive)</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <InfoBox color="blue" icon={Info} title="ROC Curve —" isDarkMode={isDarkMode}>
            A graph showing how well the model separates high-risk from low-risk patients at different decision thresholds. A model that hugs the top-left corner is performing well. A diagonal line means no better than random guessing. AUC &gt; 0.80 is considered good in clinical practice.
        </InfoBox>
    </div>
);

const GlossaryTab = ({ isDarkMode }) => {
    const [search, setSearch] = useState('');
    const filtered = GLOSSARY.filter(g =>
        g.term.toLowerCase().includes(search.toLowerCase()) ||
        g.def.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <div className="space-y-4">
            <SectionTitle isDarkMode={isDarkMode}>Glossary — Key Terms Explained</SectionTitle>
            <p className={`text-xs mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>All definitions are written for healthcare professionals with no AI background.</p>

            {/* Search */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <Search className="w-4 h-4 opacity-40 shrink-0" />
                <input
                    type="text"
                    placeholder="Search terms…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`flex-1 bg-transparent text-sm outline-none ${isDarkMode ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                />
                {search && <button onClick={() => setSearch('')} className="opacity-40 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>}
            </div>

            <div className="space-y-2">
                {filtered.length === 0 && (
                    <p className={`text-sm text-center py-8 opacity-50 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No terms match "{search}"</p>
                )}
                {filtered.map(g => (
                    <div key={g.term} className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <span className={`font-bold text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{g.term}</span>
                        <p className={`text-[12px] leading-relaxed mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{g.def}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const UserGuideModal = ({ isOpen, onClose, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const contentRef = useRef(null);

    // Scroll to top on tab change
    useEffect(() => {
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [activeTab]);

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`fixed inset-0 sm:inset-4 md:inset-8 lg:inset-12 z-[101] flex flex-col rounded-none sm:rounded-2xl border shadow-2xl overflow-hidden
                            ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 ${isDarkMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                                    <BookOpen className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                </div>
                                <div>
                                    <h2 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Guide</h2>
                                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        HEALTH-AI ML Learning Tool · Version 1.0 · Dr. Sevgi Koyuncu Tunç
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tab Bar */}
                        <div className={`flex gap-1 px-4 py-2 border-b overflow-x-auto shrink-0 ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all
                                            ${active
                                                ? isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                                : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'overview' && <OverviewTab isDarkMode={isDarkMode} />}
                                    {activeTab === 'specialties' && <SpecialtiesTab isDarkMode={isDarkMode} />}
                                    {activeTab === 'steps' && <StepsTab isDarkMode={isDarkMode} />}
                                    {activeTab === 'models' && <ModelsTab isDarkMode={isDarkMode} />}
                                    {activeTab === 'metrics' && <MetricsTab isDarkMode={isDarkMode} />}
                                    {activeTab === 'glossary' && <GlossaryTab isDarkMode={isDarkMode} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className={`px-6 py-3 border-t flex items-center justify-between text-[11px] shrink-0 ${isDarkMode ? 'border-slate-700 bg-slate-900/50 text-slate-500' : 'border-slate-200 bg-white text-slate-400'}`}>
                            <span>ML Visualization Tool · User Guide · February 2025 · Version 1.0</span>
                            <button onClick={onClose} className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                                Close
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserGuideModal;
