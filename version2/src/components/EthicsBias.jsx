import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, CheckCircle2, ArrowLeft, Download,
    Shield, Users, BarChart3, BookOpen, Info,
    Check, ChevronDown, ChevronUp, Award, Sparkles
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => parseFloat((min + Math.random() * (max - min)).toFixed(2));
const pct = (v) => Math.round(v * 100);

const colorForValue = (v, warn, danger, isDarkMode) => {
    if (v < danger) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (v < warn) return isDarkMode ? 'text-amber-400' : 'text-amber-600';
    return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
};

const badgeForValue = (v, warn, danger, isDarkMode) => {
    if (v < danger) return { label: '⚠ Review Needed', cls: isDarkMode ? 'bg-red-900/30 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200' };
    if (v < warn) return { label: 'Review', cls: isDarkMode ? 'bg-amber-900/30 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'OK', cls: isDarkMode ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200' };
};

// ─── Subgroup data generator ──────────────────────────────────────────────────
const generateSubgroups = () => {
    const overall = { acc: rand(0.72, 0.82), sens: rand(0.65, 0.75), spec: rand(0.72, 0.85) };
    return {
        overall,
        rows: [
            { group: 'Male', acc: rand(0.75, 0.87), sens: rand(0.62, 0.74), spec: rand(0.75, 0.90), fairness: 'reference' },
            { group: 'Female', acc: rand(0.68, 0.78), sens: rand(0.38, 0.52), spec: rand(0.78, 0.88), fairness: null },
            { group: 'Age 18–60', acc: rand(0.77, 0.87), sens: rand(0.62, 0.72), spec: rand(0.78, 0.90), fairness: null },
            { group: 'Age 61–75', acc: rand(0.72, 0.82), sens: rand(0.54, 0.66), spec: rand(0.72, 0.86), fairness: null },
            { group: 'Age 76+', acc: rand(0.66, 0.76), sens: rand(0.34, 0.48), spec: rand(0.72, 0.84), fairness: null },
        ],
    };
};

// ─── Training representation ──────────────────────────────────────────────────
const generateRepresentation = () => ({
    training: { male: rand(0.58, 0.70), female: rand(0.30, 0.42) },
    hospital: { male: rand(0.44, 0.54), female: rand(0.46, 0.56) },
});

// ─── EU AI Act checklist items ────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
    {
        id: 'explainability',
        label: 'Model outputs include explanations (completed in Step 6)',
        detail: 'Implemented feature importance and per-patient explanations in Step 6.',
        preChecked: true,
    },
    {
        id: 'data_doc',
        label: 'Training data source is documented (shown in Step 2)',
        detail: 'Dataset source, time period, and patient demographics are recorded.',
        preChecked: true,
    },
    {
        id: 'bias_audit',
        label: 'Subgroup bias audit completed',
        detail: 'Performance gaps between male/female and age groups must be addressed before deployment.',
        preChecked: false,
    },
    {
        id: 'human_oversight',
        label: 'Human oversight plan defined — a clinician will review all AI predictions',
        detail: 'A qualified clinician must review all high-risk flags before any action is taken.',
        preChecked: false,
    },
    {
        id: 'privacy',
        label: 'Patient data privacy protected (GDPR)',
        detail: 'GDPR compliant: no personally identifiable information used in model training.',
        preChecked: false,
    },
    {
        id: 'monitoring',
        label: 'Drift monitoring plan established',
        detail: 'Model accuracy must be re-checked every 3 months as patient population changes.',
        preChecked: false,
    },
    {
        id: 'incidents',
        label: 'Incident reporting pathway defined',
        detail: 'If the model causes harm, there is a clear process for reporting and review.',
        preChecked: false,
    },
    {
        id: 'validation',
        label: 'Clinical validation completed before any real-world use',
        detail: 'Model tested in real clinical environment with supervision before full deployment.',
        preChecked: false,
    },
];

// ─── Case Studies ─────────────────────────────────────────────────────────────
const CASE_STUDIES = [
    {
        icon: '⚠',
        title: 'Case 1: Sepsis Algorithm Bias',
        color: 'red',
        body: 'A US sepsis prediction algorithm was found to perform significantly worse for Black patients because it was trained mostly on data from white patients. Hospitals had to suspend the tool and retrain it with representative data.',
    },
    {
        icon: '⚠',
        title: 'Case 2: Accuracy ≠ Safety',
        color: 'amber',
        body: 'A readmission model with 85% overall accuracy was deployed but had only 30% sensitivity for elderly patients — the highest-risk group. The hospital reported more missed readmissions after deploying the AI than before.',
    },
    {
        icon: '✅',
        title: 'How to Prevent This',
        color: 'emerald',
        body: 'Always check subgroup performance. Always require human review. Always retrain periodically. Never deploy based on overall accuracy alone.',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SubgroupRow = React.memo(({ group, acc, sens, spec, overall, isDarkMode, delay, isRef }) => {
    const gap = overall.sens - sens;
    const sensBad = gap > 0.10;
    return (
        <motion.tr
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay }}
            className={`border-b transition-colors
                ${isDarkMode ? 'border-slate-700 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}
                ${isRef ? (isDarkMode ? 'bg-slate-800/20' : 'bg-slate-50/60') : ''}
            `}
        >
            <td className={`px-4 py-3 font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {group}
                {isRef && <span className={`ml-2 text-[9px] font-bold px-1 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>REF</span>}
            </td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${colorForValue(acc, 0.72, 0.65, isDarkMode)}`}>{pct(acc)}%</td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${colorForValue(sens, 0.65, 0.50, isDarkMode)}`}>
                {pct(sens)}%
                {sensBad && <span className="ml-1 text-red-500">↓</span>}
            </td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${colorForValue(spec, 0.72, 0.65, isDarkMode)}`}>{pct(spec)}%</td>
            <td className="px-4 py-3 text-center">
                {isRef
                    ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${isDarkMode ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>OK</span>
                    : <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${badgeForValue(sens, 0.65, 0.50, isDarkMode).cls}`}>
                        {badgeForValue(sens, 0.65, 0.50, isDarkMode).label}
                    </span>
                }
            </td>
        </motion.tr>
    );
});

const ChecklistItem = React.memo(({ item, checked, onToggle, isDarkMode, delay }) => {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            className={`rounded-xl border transition-all ${checked
                ? isDarkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50/80 border-emerald-200'
                : isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                }`}
        >
            <div className="flex items-start gap-3 p-3.5">
                <button
                    onClick={() => !item.preChecked && onToggle(item.id)}
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border-2 transition-all
                        ${checked
                            ? 'bg-emerald-500 border-emerald-500'
                            : isDarkMode ? 'border-slate-600 hover:border-indigo-400' : 'border-slate-300 hover:border-indigo-500'
                        }
                        ${item.preChecked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                >
                    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-medium leading-snug ${checked
                            ? isDarkMode ? 'text-emerald-300' : 'text-emerald-800'
                            : isDarkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                            {item.label}
                            {item.preChecked && (
                                <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                    Pre-filled
                                </span>
                            )}
                        </span>
                        <button onClick={() => setOpen(o => !o)} className="shrink-0 mt-0.5 opacity-40 hover:opacity-70 transition-opacity">
                            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    <AnimatePresence>
                        {open && (
                            <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`overflow-hidden text-[11px] mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                            >
                                {item.detail}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
});

const CaseStudyCard = React.memo(({ cs, isDarkMode, delay }) => {
    const colors = {
        red: { bg: isDarkMode ? 'bg-red-900/15 border-red-500/25' : 'bg-red-50 border-red-200', icon: 'text-red-500', title: isDarkMode ? 'text-red-300' : 'text-red-800' },
        amber: { bg: isDarkMode ? 'bg-amber-900/15 border-amber-500/25' : 'bg-amber-50 border-amber-200', icon: 'text-amber-500', title: isDarkMode ? 'text-amber-300' : 'text-amber-800' },
        emerald: { bg: isDarkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-500', title: isDarkMode ? 'text-emerald-300' : 'text-emerald-800' },
    };
    const c = colors[cs.color];
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`p-4 rounded-xl border ${c.bg}`}
        >
            <p className={`text-sm font-bold mb-2 ${c.title}`}>{cs.title}</p>
            <p className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{cs.body}</p>
        </motion.div>
    );
});

// ─── Horizontal comparison bar ─────────────────────────────────────────────────
const RepBar = React.memo(({ label, trainingPct, hospitalPct, isDarkMode, delay }) => {
    const gap = Math.abs(trainingPct - hospitalPct);
    const warn = gap > 15;
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay }}
            className="space-y-1"
        >
            <div className="flex justify-between text-[11px] font-semibold">
                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
                {warn && <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{gap.toFixed(0)}pp gap</span>}
            </div>
            {/* Training */}
            <div className="flex items-center gap-2">
                <span className={`text-[10px] w-20 text-right ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Training</span>
                <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div
                        className="h-full rounded-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${trainingPct}%` }}
                        transition={{ duration: 0.7, delay: delay + 0.1 }}
                    />
                </div>
                <span className={`text-[11px] font-mono w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{Math.round(trainingPct)}%</span>
            </div>
            {/* Hospital */}
            <div className="flex items-center gap-2">
                <span className={`text-[10px] w-20 text-right ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hospital</span>
                <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div
                        className="h-full rounded-full bg-slate-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${hospitalPct}%` }}
                        transition={{ duration: 0.7, delay: delay + 0.2 }}
                    />
                </div>
                <span className={`text-[11px] font-mono w-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(hospitalPct)}%</span>
            </div>
        </motion.div>
    );
});

// ─── PDF Certificate (simple HTML-print approach) ────────────────────────────
const downloadCertificate = (checked, subgroups, domain) => {
    const total = CHECKLIST_ITEMS.length;
    const done = checked.length;
    const overall = subgroups?.overall;
    const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HEALTH-AI Summary Certificate</title>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; background: #f8fafc; color: #1e293b; }
  .cert { max-width: 760px; margin: auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 40px rgba(0,0,0,0.08); border: 2px solid #6366f1; }
  h1 { color: #6366f1; font-size: 28px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 28px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
  .green { background: #dcfce7; color: #166534; }
  .red   { background: #fee2e2; color: #991b1b; }
  .amber { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
  .stamp { text-align:center; margin-bottom:24px; }
  .stamp span { font-size: 48px; }
</style>
</head>
<body>
<div class="cert">
  <div class="stamp"><span>🎓</span></div>
  <h1>HEALTH-AI Learning Tool</h1>
  <p class="sub">Summary Certificate — Erasmus+ KA220-HED · Generated ${dateStr}</p>

  <h2>Exercise Summary</h2>
  <table>
    <tr><th>Specialty / Domain</th><td>${domain?.name || 'Cardiology'}</td></tr>
    <tr><th>Steps Completed</th><td>7 of 7</td></tr>
    <tr><th>EU AI Act Items</th><td>${done} / ${total} confirmed</td></tr>
  </table>

  <h2>Model Performance (Overall)</h2>
  <table>
    <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
    <tr><td>Accuracy</td><td>${overall ? Math.round(overall.acc * 100) + '%' : 'N/A'}</td><td><span class="badge ${overall?.acc >= 0.65 ? 'green' : 'red'}">${overall?.acc >= 0.65 ? 'Acceptable' : 'Below Threshold'}</span></td></tr>
    <tr><td>Sensitivity</td><td>${overall ? Math.round(overall.sens * 100) + '%' : 'N/A'}</td><td><span class="badge ${overall?.sens >= 0.65 ? 'green' : overall?.sens >= 0.50 ? 'amber' : 'red'}">${overall?.sens >= 0.65 ? 'Acceptable' : overall?.sens >= 0.50 ? 'Review' : 'Below Threshold'}</span></td></tr>
    <tr><td>Specificity</td><td>${overall ? Math.round(overall.spec * 100) + '%' : 'N/A'}</td><td><span class="badge ${overall?.spec >= 0.65 ? 'green' : 'red'}">${overall?.spec >= 0.65 ? 'Acceptable' : 'Below Threshold'}</span></td></tr>
  </table>

  <h2>EU AI Act Compliance Checklist</h2>
  <table>
    <tr><th>Item</th><th>Status</th></tr>
    ${CHECKLIST_ITEMS.map(item => `<tr><td>${item.label}</td><td><span class="badge ${checked.includes(item.id) ? 'green' : 'red'}">${checked.includes(item.id) ? '✓ Confirmed' : 'Pending'}</span></td></tr>`).join('')}
  </table>

  <h2>Bias Findings</h2>
  <table>
    <tr><th>Patient Group</th><th>Sensitivity</th><th>Status</th></tr>
    ${(subgroups?.rows || []).map(r => `<tr><td>${r.group}</td><td>${Math.round(r.sens * 100)}%</td><td><span class="badge ${r.sens >= 0.65 ? 'green' : r.sens >= 0.50 ? 'amber' : 'red'}">${r.sens >= 0.65 ? 'OK' : r.sens >= 0.50 ? 'Review' : 'Action Needed'}</span></td></tr>`).join('')}
  </table>

  <div class="footer">
    This certificate confirms completion of the HEALTH-AI educational exercise.<br>
    This is not a professional accreditation. All patient data used was simulated.
  </div>
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EthicsBias = ({ isDarkMode, onPrev, domain }) => {
    const [subgroups, setSubgroups] = useState(null);
    const [repData, setRepData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState(
        CHECKLIST_ITEMS.filter(i => i.preChecked).map(i => i.id)
    );

    useEffect(() => {
        const t = setTimeout(() => {
            setSubgroups(generateSubgroups());
            setRepData(generateRepresentation());
            setLoading(false);
        }, 900);
        return () => clearTimeout(t);
    }, []);

    const toggleItem = (id) =>
        setCheckedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const overallSens = subgroups?.overall?.sens ?? 0;
    const biasRows = subgroups?.rows?.filter(r => !r.fairness && overallSens - r.sens > 0.10) ?? [];
    const allChecked = checkedItems.length === CHECKLIST_ITEMS.length;
    const trainingMalePct = repData ? Math.round(repData.training.male * 100) : 0;
    const trainingFemalePct = repData ? Math.round(repData.training.female * 100) : 0;
    const hospitalMalePct = repData ? Math.round(repData.hospital.male * 100) : 0;
    const hospitalFemalePct = repData ? Math.round(repData.hospital.female * 100) : 0;
    const femaleGap = Math.abs(trainingFemalePct - hospitalFemalePct);
    const repWarn = femaleGap > 15;

    return (
        <div className="w-full space-y-6 pb-20">

            {/* ── Header ── */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                        STEP 7 OF 7
                    </span>
                    <button
                        onClick={() => downloadCertificate(checkedItems, subgroups, domain)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Download Summary Certificate
                    </button>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Ethics & Bias — Is This Model Fair for All Patients?
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Before any AI tool is used in a hospital, it must be checked for fairness across different patient groups. A model that works well on average but poorly for elderly or female patients is not safe to deploy.
                </p>
            </div>

            {/* ── Bias Warning ── */}
            <AnimatePresence>
                {!loading && biasRows.length > 0 && biasRows.map(row => {
                    const maleSens = subgroups.rows.find(r => r.group === 'Male')?.sens ?? 0;
                    const gapPP = Math.round((maleSens - row.sens) * 100);
                    return (
                        <motion.div
                            key={row.group}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-start gap-3 p-4 rounded-2xl border-2 font-medium text-sm
                                ${isDarkMode ? 'bg-red-900/20 border-red-500/50 text-red-300' : 'bg-red-50 border-red-300 text-red-800'}`}
                        >
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                            <div>
                                <span className="font-bold">🔴 Bias Detected: </span>
                                Sensitivity for <strong>{row.group.toLowerCase()} patients ({pct(row.sens)}%)</strong> is {gapPP} percentage points lower than for male patients ({pct(maleSens)}%).
                                This means the model misses far more readmissions in this group.{' '}
                                <strong>This model should NOT be deployed until this gap is addressed.</strong>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* ── Two-column: Subgroup Table + Checklist ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Subgroup Table */}
                <div className="lg:col-span-7">
                    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                        <div className={`px-5 py-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <Users className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Subgroup Performance — Is the Model Fair?
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-8 flex items-center justify-center gap-3">
                                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Auditing subgroups…</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className={`${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-xs">Patient Group</th>
                                            <th className="px-4 py-3 text-center font-semibold text-xs">Accuracy</th>
                                            <th className="px-4 py-3 text-center font-semibold text-xs">Sensitivity</th>
                                            <th className="px-4 py-3 text-center font-semibold text-xs">Specificity</th>
                                            <th className="px-4 py-3 text-center font-semibold text-xs">Fairness</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subgroups?.rows.map((r, i) => (
                                            <SubgroupRow
                                                key={r.group}
                                                {...r}
                                                overall={subgroups.overall}
                                                isDarkMode={isDarkMode}
                                                delay={i * 0.07}
                                                isRef={r.fairness === 'reference'}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Legend */}
                        {!loading && (
                            <div className={`px-5 py-3 border-t flex flex-wrap gap-3 text-[10px] font-semibold ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full bg-emerald-500`} /> OK (≥ 65%)</span>
                                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full bg-amber-500`} /> Review (50–64%)</span>
                                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full bg-red-500`} /> Action Needed (&lt; 50%)</span>
                                <span className={`ml-auto italic ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Sensitivity flagged if &gt;10pp gap vs. Male</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* EU AI Act Checklist */}
                <div className="lg:col-span-5">
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm h-full flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                EU AI Act Compliance Checklist
                            </h3>
                        </div>
                        <p className={`text-[11px] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Check each item when you are satisfied your project meets that requirement. Two items are pre-checked from earlier steps.
                        </p>

                        {/* Progress bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-[11px] mb-1">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Progress</span>
                                <span className={`font-bold ${allChecked ? 'text-emerald-500' : isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    {checkedItems.length}/{CHECKLIST_ITEMS.length}
                                </span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                <motion.div
                                    className={`h-full rounded-full ${allChecked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                    animate={{ width: `${(checkedItems.length / CHECKLIST_ITEMS.length) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 flex-1">
                            {CHECKLIST_ITEMS.map((item, i) => (
                                <ChecklistItem
                                    key={item.id}
                                    item={item}
                                    checked={checkedItems.includes(item.id)}
                                    onToggle={toggleItem}
                                    isDarkMode={isDarkMode}
                                    delay={i * 0.04}
                                />
                            ))}
                        </div>

                        {allChecked && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'}`}
                            >
                                <Award className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span className={`text-xs font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                                    All items confirmed. Your project meets all EU AI Act requirements for this exercise.
                                </span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Two-column: Training Representation + Case Studies ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Training Data Representation */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Training Data vs. Real Hospital Population
                        </h3>
                    </div>
                    <p className={`text-[11px] mb-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        If any group is under-represented by more than 15 pp, a warning appears. Under-representation means the AI has had less opportunity to learn from that group.
                    </p>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className={`h-14 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />)}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-5">
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Training Data</p>
                                    <RepBar label="Male patients" trainingPct={trainingMalePct} hospitalPct={hospitalMalePct} isDarkMode={isDarkMode} delay={0.05} />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Real Hospital Population</p>
                                    <RepBar label="Female patients" trainingPct={trainingFemalePct} hospitalPct={hospitalFemalePct} isDarkMode={isDarkMode} delay={0.15} />
                                </div>
                            </div>

                            {/* Legend */}
                            <div className={`flex gap-4 mt-4 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-500" /> Training data</div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-400" /> Hospital population</div>
                            </div>

                            {repWarn && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-4 p-3 rounded-xl border flex items-start gap-2 text-[11px]
                                        ${isDarkMode ? 'bg-amber-900/15 border-amber-500/25 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                                    <span>
                                        <strong>Under-representation: </strong>
                                        Only {trainingFemalePct}% of training patients were female, but {hospitalFemalePct}% of real patients are female.
                                        This mismatch may explain the model's poor performance for women. Retrain with a more balanced dataset.
                                    </span>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>

                {/* Case Studies */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Real-World AI Failures in Healthcare — What Goes Wrong
                        </h3>
                    </div>
                    <p className={`text-[11px] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        These case studies are designed for clinicians with no AI background, to ground the learning experience in real consequences.
                    </p>
                    <div className="space-y-3">
                        {CASE_STUDIES.map((cs, i) => (
                            <CaseStudyCard key={cs.title} cs={cs} isDarkMode={isDarkMode} delay={i * 0.1} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Completion Banner ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4
                    ${isDarkMode ? 'bg-emerald-900/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}
            >
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                            🎉 Congratulations — you have completed all 7 steps.
                        </p>
                        <p className={`text-xs leading-relaxed mt-1 ${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                            You have defined a clinical problem, explored patient data, prepared it correctly, trained and compared ML models, evaluated results with clinical metrics, understood why the model makes predictions, and checked it for fairness.
                            Download your Summary Certificate to document what you built.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => downloadCertificate(checkedItems, subgroups, domain)}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                >
                    <Download className="w-4 h-4" /> Download Summary Certificate
                </button>
            </motion.div>

            {/* ── Navigation ── */}
            <div className="flex justify-between items-center pt-2">
                <button
                    onClick={onPrev}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium transition-colors
                        ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                    <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button
                    onClick={() => downloadCertificate(checkedItems, subgroups, domain)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
                >
                    <Download className="w-4 h-4" /> Download Summary Certificate
                </button>
            </div>
        </div>
    );
};

export default EthicsBias;
