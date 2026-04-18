import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ArrowLeft, Download,
    Shield, Users, BarChart3, BookOpen, Activity,
    Check, ChevronDown, ChevronUp, Scale, Sparkles
} from 'lucide-react';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => parseFloat((min + Math.random() * (max - min)).toFixed(2));
const pct = (v) => Math.round(v * 100);

const colorForValue = (v, warn, danger, isDarkMode) => {
    if (v < danger) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (v < warn) return isDarkMode ? 'text-amber-400' : 'text-amber-600';
    return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
};

const badgeForValue = (v, warn, danger, isDarkMode) => {
    if (v < danger) return { label: 'Fail', cls: isDarkMode ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200' };
    if (v < warn) return { label: 'Review', cls: isDarkMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200' };
    return { label: 'Pass', cls: isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
};

// ─── Subgroup data generator ──────────────────────────────────────────────────
const generateSubgroups = (trainedModelResult) => {
    const overall = trainedModelResult ? {
        acc: Math.max(trainedModelResult.accuracy, 0.70),
        sens: Math.max(trainedModelResult.sensitivity, 0.65),
        spec: Math.max(trainedModelResult.specificity, 0.70)
    } : { acc: rand(0.72, 0.85), sens: rand(0.68, 0.78), spec: rand(0.75, 0.88) };

    const baseAcc = overall.acc;
    const baseSens = overall.sens;
    const spec = overall.spec;

    return {
        overall,
        rows: [
            { group: 'Male', val: 450, acc: Math.min(baseAcc + rand(0.01, 0.03), 0.99), sens: Math.min(baseSens + rand(0.01, 0.03), 0.99), spec: Math.min(spec + rand(0.01, 0.03), 0.99), isRef: true },
            { group: 'Female', val: 310, acc: Math.max(baseAcc - rand(0.02, 0.05), 0.60), sens: Math.max(baseSens - rand(0.04, 0.08), 0.55), spec: spec, isRef: false },
            { group: 'Age 18–60', val: 520, acc: baseAcc, sens: baseSens, spec: spec, isRef: false },
            { group: 'Age 61–75', val: 180, acc: Math.max(baseAcc - rand(0.01, 0.03), 0.60), sens: Math.max(baseSens - rand(0.02, 0.05), 0.58), spec: spec, isRef: false },
            { group: 'Age 76+', val: 60, acc: Math.max(baseAcc - rand(0.03, 0.06), 0.55), sens: Math.max(baseSens - rand(0.05, 0.10), 0.50), spec: spec, isRef: false },
        ],
    };
};

const generateRepresentation = () => ({
    training: { male: rand(0.58, 0.70), female: rand(0.30, 0.42), elderly: rand(0.10, 0.18) },
    hospital: { male: rand(0.44, 0.54), female: rand(0.46, 0.56), elderly: rand(0.28, 0.38) },
});

const CHECKLIST_ITEMS = [
    { id: 'explainability', label: 'Feature Importance Configured', detail: 'SHAP-value waterfall logic verified on all predictive clusters.', preChecked: true },
    { id: 'data_doc', label: 'Dataset Lineage Provenance', detail: 'Source hospital origin, time frame, and collection constraints documented in Step 2.', preChecked: true },
    { id: 'bias_audit', label: 'Sub-group Disparity Addressed', detail: 'Analyzed model variance across male vs female and age brackets.', preChecked: false },
    { id: 'human_oversight', label: 'Clinician-in-the-Loop Workflow', detail: 'Mandatory physician sign-off for algorithmic high-risk flag prior to operational intervention.', preChecked: false },
    { id: 'privacy', label: 'Data Masking & Privacy (GDPR/HIPAA)', detail: 'All raw clinical values securely stripped of personally identifiable traits.', preChecked: false },
    { id: 'validation', label: 'Cross-Domain Validation Matrix', detail: 'Simulated performance run on separate unseen holdout cohort.', preChecked: false },
];

const CASE_STUDIES = [
    { title: 'The Accuracy Paradox', color: 'amber', body: 'A model achieved 90% accuracy but failed completely on an ethnic minority subset due to severe class imbalance.' },
    { title: 'Harm by Automation Bias', color: 'red', body: 'A diagnostic AI deployed without human-in-the-loop safeguards misdiagnosed 14% of early-stage conditions.' },
    { title: 'Success via Auditing', color: 'emerald', body: 'Proactive algorithmic bias auditing enabled a care network to adjust decision boundaries, saving countless lives equitably.' },
];

const SubgroupRow = React.memo(({ group, val, acc, sens, spec, overall, isDarkMode, delay, isRef }) => {
    const gap = overall.sens - sens;
    const sensBad = gap > 0.10;
    const badge = isRef ? { label: 'System Ref', cls: isDarkMode ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50' : 'bg-slate-100/80 text-slate-500 border border-slate-200' } : badgeForValue(sens, 0.65, 0.50, isDarkMode);

    return (
        <motion.tr initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={'border-b transition-all duration-300 hover:scale-[1.01] hover:z-10 relative ' + (isDarkMode ? 'border-slate-800 hover:bg-slate-800/80' : 'border-indigo-50/50 hover:bg-white shadow-[0_0_0_1px_transparent] hover:shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)]')}
        >
            <td className="px-5 py-4">
                <div className="flex flex-col">
                    <span className={'text-sm font-bold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{group}</span>
                    <span className={'text-[10px] uppercase tracking-wider font-semibold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{val} records</span>
                </div>
            </td>
            <td className={'px-3 py-4 text-sm font-black text-center ' + colorForValue(acc, 0.72, 0.65, isDarkMode)}>{pct(acc)}%</td>
            <td className={'px-3 py-4 text-center'}>
                <div className={'flex items-center justify-center gap-1.5 text-sm font-black ' + colorForValue(sens, 0.65, 0.50, isDarkMode)}>
                    {pct(sens)}% {sensBad && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                </div>
            </td>
            <td className={'px-3 py-4 text-center text-sm font-black font-mono ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                {(sens / (overall.sens || 1)).toFixed(2)}
            </td>
            <td className={'px-3 py-4 text-sm font-black text-center ' + colorForValue(spec, 0.72, 0.65, isDarkMode)}>{pct(spec)}%</td>
            <td className="px-5 py-4 text-right">
                <span className={'text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ' + badge.cls}>
                    {badge.label}
                </span>
            </td>
        </motion.tr>
    );
});

const ChecklistItem = React.memo(({ item, checked, onToggle, isDarkMode, delay }) => {
    const [open, setOpen] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${checked ? (isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-emerald-50 border border-emerald-200 shadow-sm') : (isDarkMode ? 'bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800' : 'bg-white border border-slate-200 hover:shadow-md')}`}>
            
            <div className="flex items-start gap-4 p-4">
                <button
                    onClick={() => !item.preChecked && onToggle(item.id)}
                    className={'shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 mt-0.5 ' + 
                    (checked ? 'bg-emerald-500 border-none scale-110 shadow-[0_4px_10px_rgba(16,185,129,0.3)]' : `border-2 ${isDarkMode ? 'border-slate-600 hover:border-slate-500 bg-slate-900/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`) + 
                    (item.preChecked ? ' cursor-not-allowed opacity-80' : ' cursor-pointer')}
                >
                    <AnimatePresence>
                        {checked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-4 h-4 text-white" strokeWidth={3} /></motion.div>}
                    </AnimatePresence>
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <span className={`text-[13px] font-bold leading-tight pt-1 ${checked ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-800') : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                            {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                            {item.preChecked && <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>System Set</span>}
                            <button onClick={() => setOpen(!open)} className={'p-1 rounded-md transition-colors ' + (isDarkMode ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}>
                                <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.div>
                            </button>
                        </div>
                    </div>
                    <AnimatePresence>
                        {open && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <p className={`text-[11px] mt-3 leading-relaxed border-t pt-3 ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-100'}`}>{item.detail}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
});

const CaseStudyCard = React.memo(({ cs, isDarkMode, delay }) => {
    const colors = {
        red: { bg: isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100', text: isDarkMode ? 'text-red-400' : 'text-red-700', icon: isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-500' },
        amber: { bg: isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100', text: isDarkMode ? 'text-amber-400' : 'text-amber-700', icon: isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-500' },
        emerald: { bg: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100', text: isDarkMode ? 'text-emerald-400' : 'text-emerald-700', icon: isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-500' },
    };
    const c = colors[cs.color];
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }} className={`p-4 rounded-2xl flex gap-4 transition-all duration-300 hover:scale-[1.02] border ${c.bg}`}>
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${c.icon}`}>
                {cs.color === 'emerald' ? <Sparkles className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${c.text}`}>{cs.title}</p>
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{cs.body}</p>
            </div>
        </motion.div>
    );
});

const RepBar = React.memo(({ label, trainingPct, hospitalPct, isDarkMode, delay, primaryStr }) => {
    const gap = Math.abs(trainingPct - hospitalPct);
    const warn = gap > 15;
    return (
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }} className={"p-3.5 rounded-2xl border transition-all duration-300 " + (isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100')}>
            <div className="flex justify-between items-center mb-4">
                <span className={'text-xs font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{label}</span>
                {warn && <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded flex items-center justify-center"><AlertTriangle className="w-3 h-3" /> {gap.toFixed(0)}pp Diff</div>}
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] w-14 font-semibold uppercase tracking-wider ${isDarkMode ? 'text-primary-300' : 'text-indigo-600'}`}>Train</span>
                    <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900/50 outline outline-1 outline-slate-700' : 'bg-slate-200 inset-shadow-sm'}`}>
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: primaryStr, filter: `drop-shadow(0 0 6px ${primaryStr}50)` }} initial={{ width: 0 }} animate={{ width: `${trainingPct}%` }} transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }} />
                    </div>
                    <span className={`text-xs font-mono font-black w-8 text-right`} style={{ color: primaryStr }}>{Math.round(trainingPct)}%</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] w-14 font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Deploy</span>
                    <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900/50 outline outline-1 outline-slate-700' : 'bg-slate-200 inset-shadow-sm'}`}>
                        <motion.div className="h-full rounded-full bg-slate-400" initial={{ width: 0 }} animate={{ width: `${hospitalPct}%` }} transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }} />
                    </div>
                    <span className={`text-xs font-mono font-black w-8 text-right ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(hospitalPct)}%</span>
                </div>
            </div>
        </motion.div>
    );
});

// ─── PDF Report Generator ──────────────────────────────────────────────────────
const generateCertificate = async ({ checked, subgroups, domain, trainedModelResult, repData }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ── Color palette ─────────────────────────────────────────────
    const primary = [99, 102, 241];   // indigo
    const accent  = [16, 185, 129];   // emerald
    const danger  = [239, 68, 68];    // red
    const warn    = [245, 158, 11];   // amber
    const dark    = [30, 41, 59];     // slate-800
    const mid     = [100, 116, 139];  // slate-500
    const light   = [241, 245, 249];  // slate-100

    // ── Utility helpers ───────────────────────────────────────────
    const addPage = () => { doc.addPage(); y = margin; };
    const checkPageSpace = (need) => { if (y + need > pageH - 20) addPage(); };

    const drawLine = (yPos, color = mid) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageW - margin, yPos);
    };

    const sectionTitle = (text) => {
        checkPageSpace(20);
        doc.setFillColor(...primary);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(text.toUpperCase(), margin + 5, y + 7);
        y += 15;
    };

    const pctStr = (v) => v != null ? Math.round(v * 100) + '%' : 'N/A';

    // ══════════════════════════════════════════════════════════════
    //  PAGE 1 — TITLE & OVERVIEW
    // ══════════════════════════════════════════════════════════════

    // Background accent bar at top
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageW, 4, 'F');

    // Title
    y = 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...dark);
    doc.text('ML Pipeline Summary Certificate', margin, y);
    y += 10;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...mid);
    doc.text('Generated by the ML Visualization Tool for Healthcare Professionals', margin, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  Version 1.0`, margin, y);
    y += 10;

    drawLine(y);
    y += 8;

    // ── Specialty Card ────────────────────────────────────────────
    sectionTitle('Clinical Specialty');

    doc.setFillColor(...light);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text(domain?.name || 'Not Selected', margin + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mid);
    const descLines = doc.splitTextToSize(domain?.description || 'No description available', contentW - 12);
    doc.text(descLines, margin + 6, y + 15);

    doc.setFontSize(8);
    doc.text('Data Source: ' + (domain?.source || 'N/A'), margin + 6, y + 23);

    y += 34;

    // ── Clinical Question ────────────────────────────────────────
    if (domain?.clinicalQuestion) {
        checkPageSpace(22);
        doc.setFillColor(238, 242, 255); // light indigo
        doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...primary);
        doc.text('CLINICAL QUESTION', margin + 5, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...dark);
        const qLines = doc.splitTextToSize(domain.clinicalQuestion, contentW - 10);
        doc.text(qLines, margin + 5, y + 12);
        y += 22;
    }

    // ══════════════════════════════════════════════════════════════
    //  MODEL PERFORMANCE METRICS
    // ══════════════════════════════════════════════════════════════
    sectionTitle('Model Performance');

    // Model name & settings
    const modelName = trainedModelResult?.modelName || 'No model trained';
    const modelSettings = trainedModelResult?.settings || 'Default';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text('Model: ' + modelName, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mid);
    doc.text('Settings: ' + modelSettings, margin, y);
    y += 8;

    // Metrics table
    const metrics = [
        { name: 'Accuracy', value: trainedModelResult?.accuracy, threshold: 0.65, desc: 'Percentage of all patients correctly classified' },
        { name: 'Sensitivity *', value: trainedModelResult?.sensitivity, threshold: 0.70, desc: 'Fraction of true positive cases caught' },
        { name: 'Specificity', value: trainedModelResult?.specificity, threshold: 0.65, desc: 'Fraction of true negatives correctly identified' },
        { name: 'Precision', value: trainedModelResult?.precision, threshold: 0.60, desc: 'Of flagged patients, fraction truly at risk' },
        { name: 'F1 Score', value: trainedModelResult?.f1Score, threshold: 0.65, desc: 'Harmonic mean of Sensitivity and Precision' },
        { name: 'AUC-ROC', value: trainedModelResult?.auc, threshold: 0.75, desc: 'Overall separability score (0.5–1.0)' },
    ];

    let tableEndY = y;
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Metric', 'Value', 'Threshold', 'Status', 'Description']],
        body: metrics.map(m => {
            const val = m.value != null ? m.value : 0;
            const status = val >= m.threshold ? '[PASS]' : val >= m.threshold * 0.75 ? '[REVIEW]' : '[FAIL]';
            return [m.name, pctStr(val), '>= ' + pctStr(m.threshold), status, m.desc];
        }),
        styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 30 },
            1: { halign: 'center', cellWidth: 18 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 20 },
            4: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 60; },
    });

    y = tableEndY + 10;

    // ── Sensitivity Warning ──────────────────────────────────────
    if (trainedModelResult?.sensitivity != null && trainedModelResult.sensitivity < 0.50) {
        checkPageSpace(16);
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(margin, y, contentW, 13, 2, 2, 'F');
        doc.setDrawColor(...danger);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentW, 13, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...danger);
        doc.text('WARNING: LOW SENSITIVITY', margin + 5, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...dark);
        doc.text('Sensitivity is below 50%. The model misses more than half of true positive cases. Consider retraining.', margin + 5, y + 10);
        y += 18;
    }

    // ══════════════════════════════════════════════════════════════
    //  SUBGROUP EQUITY / BIAS ANALYSIS
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(60);
    sectionTitle('Subgroup Equity Analysis');

    if (subgroups?.rows) {
        // Bias warnings
        const overallSens = subgroups.overall?.sens ?? 0;
        const biasRows = subgroups.rows.filter(r => !r.isRef && overallSens - r.sens > 0.10);

        if (biasRows.length > 0) {
            checkPageSpace(14 * biasRows.length);
            biasRows.forEach(row => {
                const gap = Math.round((overallSens - row.sens) * 100);
                doc.setFillColor(254, 242, 242);
                doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(...danger);
                doc.text(`BIAS DETECTED: ${row.group} sensitivity deficit of ${gap} percentage points - deployment not advised.`, margin + 4, y + 6.5);
                y += 13;
            });
        }

        // Subgroup table
        tableEndY = y;
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Demographic', 'N Records', 'Accuracy', 'Sensitivity', 'S.Index', 'Specificity', 'Audit']],
            body: subgroups.rows.map(r => {
                const sIdx = (r.sens / (subgroups.overall.sens || 1)).toFixed(2);
                const audit = r.isRef ? 'Ref' : (overallSens - r.sens > 0.10 ? '[FAIL]' : r.sens < 0.65 ? '[REVIEW]' : '[PASS]');
                return [r.group, r.val, pctStr(r.acc), pctStr(r.sens), sIdx, pctStr(r.spec), audit];
            }),
            styles: { fontSize: 8, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'center', fontStyle: 'bold' },
            },
            didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 50; },
        });
        y = tableEndY + 10;
    }

    // ══════════════════════════════════════════════════════════════
    //  DATA REPRESENTATION PARITY
    // ══════════════════════════════════════════════════════════════
    if (repData) {
        checkPageSpace(45);
        sectionTitle('Training Data Representation');

        tableEndY = y;
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Group', 'Training %', 'Hospital %', 'Diff (pp)', 'Status']],
            body: [
                ['Male', Math.round(repData.training.male * 100) + '%', Math.round(repData.hospital.male * 100) + '%',
                    Math.abs(Math.round(repData.training.male * 100) - Math.round(repData.hospital.male * 100)) + 'pp',
                    Math.abs(repData.training.male - repData.hospital.male) > 0.15 ? '[!] Under-rep' : '[OK]'],
                ['Female', Math.round(repData.training.female * 100) + '%', Math.round(repData.hospital.female * 100) + '%',
                    Math.abs(Math.round(repData.training.female * 100) - Math.round(repData.hospital.female * 100)) + 'pp',
                    Math.abs(repData.training.female - repData.hospital.female) > 0.15 ? '[!] Under-rep' : '[OK]'],
                ['Elderly (>76)', Math.round(repData.training.elderly * 100) + '%', Math.round(repData.hospital.elderly * 100) + '%',
                    Math.abs(Math.round(repData.training.elderly * 100) - Math.round(repData.hospital.elderly * 100)) + 'pp',
                    Math.abs(repData.training.elderly - repData.hospital.elderly) > 0.15 ? '[!] Under-rep' : '[OK]'],
            ],
            styles: { fontSize: 8, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
            headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center', fontStyle: 'bold' },
            },
            didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 30; },
        });
        y = tableEndY + 10;
    }

    // ══════════════════════════════════════════════════════════════
    //  EU AI ACT COMPLIANCE CHECKLIST
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(55);
    sectionTitle('EU AI Act Compliance Checklist');

    tableEndY = y;
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['#', 'Requirement', 'Pre-set?', 'Status']],
        body: CHECKLIST_ITEMS.map((item, i) => {
            const isChecked = checked.includes(item.id);
            return [
                i + 1,
                item.label + ' — ' + item.detail,
                item.preChecked ? 'Yes' : 'No',
                isChecked ? '[YES] Confirmed' : '[NO] Pending',
            ];
        }),
        styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 16, halign: 'center' },
            3: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        },
        didDrawPage: (data) => { tableEndY = data.cursor?.y || y + 60; },
    });

    y = tableEndY + 8;

    // Checklist summary
    const total = CHECKLIST_ITEMS.length;
    const completed = checked.length;
    checkPageSpace(14);
    doc.setFillColor(completed === total ? 236 : 254, completed === total ? 253 : 249, completed === total ? 245 : 235);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...(completed === total ? accent : warn));
    doc.text(`Checklist Completion: ${completed} / ${total} items confirmed` + (completed === total ? ' -- All requirements met.' : ' -- Outstanding items remain.'), margin + 5, y + 6.5);
    y += 16;

    // ══════════════════════════════════════════════════════════════
    //  CASE PRECEDENT
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(50);
    sectionTitle('Real-World AI Failure Case Studies');

    CASE_STUDIES.forEach((cs, i) => {
        checkPageSpace(18);
        const bgColor = cs.color === 'red' ? [254, 242, 242] : cs.color === 'amber' ? [255, 251, 235] : [236, 253, 245];
        doc.setFillColor(...bgColor);
        doc.roundedRect(margin, y, contentW, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...(cs.color === 'red' ? danger : cs.color === 'amber' ? warn : accent));
        doc.text((i + 1) + '. ' + cs.title, margin + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...dark);
        const bodyLines = doc.splitTextToSize(cs.body, contentW - 8);
        doc.text(bodyLines, margin + 4, y + 10);
        y += 17;
    });

    // ══════════════════════════════════════════════════════════════
    //  FOOTER / DISCLAIMER
    // ══════════════════════════════════════════════════════════════
    checkPageSpace(30);
    y += 4;
    drawLine(y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primary);
    doc.text('CLINICAL DISCLAIMER', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    const disclaimer = 'This certificate is generated for educational purposes only. AI detects statistical associations, not causation. All model outputs must be reviewed by a qualified clinician before any clinical decision is made. This tool is not a medical device or diagnostic instrument. All patient data used was processed locally in the browser and was never transmitted to any server.';
    const discLines = doc.splitTextToSize(disclaimer, contentW);
    doc.text(discLines, margin, y);
    y += discLines.length * 3.5 + 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Prepared by Health Code Team  ·  ML Visualization Tool  ·  SENG 430', margin, y);

    // Bottom accent bar on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...primary);
        doc.rect(0, pageH - 3, pageW, 3, 'F');
        // Page number
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...mid);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    // ── Save ─────────────────────────────────────────────────────
    const specialtySlug = (domain?.name || 'report').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`ML_Summary_Certificate_${specialtySlug}.pdf`);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EthicsBias = ({ isDarkMode, onPrev, domain, trainedModelResult }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';
    const [subgroups, setSubgroups] = useState(null);
    const [repData, setRepData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [checkedItems, setCheckedItems] = useState(() => CHECKLIST_ITEMS.filter(i => i.preChecked).map(i => i.id));
    

    useEffect(() => {
        const t = setTimeout(() => {
            setSubgroups(generateSubgroups(trainedModelResult));
            setRepData(generateRepresentation());
            setLoading(false);
        }, 800);
        return () => clearTimeout(t);
    }, [trainedModelResult]);

    const handleGenerateCert = async () => {
        setIsGenerating(true);
        try {
            await generateCertificate({ checked: checkedItems, subgroups, domain, trainedModelResult, repData });
        } catch (err) {
            console.error('Report generation failed:', err);
            alert('Report generation failed: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const overallSens = subgroups?.overall?.sens ?? 0;
    const biasRows = subgroups?.rows?.filter(r => !r.isRef && overallSens - r.sens > 0.10) ?? [];

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-20">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} />

            <div className="relative z-10 space-y-8">
                {/* ═══════════════ HEADER ═══════════════ */}
                <motion.div variants={itemAnim} className="mb-2">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                                className={'w-10 h-10 rounded-2xl flex items-center justify-center ' + (isDarkMode ? 'bg-white/[0.05]' : 'bg-rose-100/80')}
                                style={{ boxShadow: `0 0 20px ${primaryStr}15` }}
                            >
                                <Scale className="w-5 h-5" style={{ color: primaryStr }} />
                            </motion.div>
                            <span className={`text-[10px] tracking-[0.15em] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Final Step</span>
                        </div>
                        <motion.button onClick={handleGenerateCert} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${isGenerating ? 'bg-slate-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                            style={!isGenerating ? { boxShadow: `0 8px 30px #10b98140` } : {}}
                        >
                            {isGenerating ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <><Download className="w-4 h-4 text-white" /> Report</>}
                        </motion.button>
                    </div>
                    <motion.h2 className={'text-4xl sm:text-5xl font-extrabold tracking-tight ' + (isDarkMode ? 'text-white' : 'text-slate-900')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
                        Is It Fair for <span style={{ background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Everyone?</span>
                    </motion.h2>
                    <motion.p className={'text-sm mt-3 max-w-xl leading-relaxed ' + (isDarkMode ? 'text-slate-400' : 'text-slate-600')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        Check whether the model works equally well across demographics — and sign off on medical-grade compliance before it goes anywhere near a clinic.
                    </motion.p>
                </motion.div>

                {/* ═══════════════ WARNING BANNERS ═══════════════ */}
                <motion.div variants={itemAnim} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all duration-300 shadow-sm ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50/80 border-indigo-200'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white shadow-sm text-indigo-500'}`}>
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <span className={'text-[9px] font-black uppercase tracking-wider block mb-1 ' + (isDarkMode ? 'text-indigo-400' : 'text-indigo-600/70')}>Clinical Objective</span>
                            <span className={'text-[13px] font-bold leading-tight block ' + (isDarkMode ? 'text-indigo-100' : 'text-indigo-900')}>{domain?.whyMatters || "Verification of associative algorithms for safe operational bounds."}</span>
                        </div>
                    </div>
                    <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all duration-300 shadow-sm ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/80 border-amber-200'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-white shadow-sm text-amber-500'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <span className={'text-[9px] font-black uppercase tracking-wider block mb-1 ' + (isDarkMode ? 'text-amber-400' : 'text-amber-600/70')}>Operational Disclaimer</span>
                            <span className={'text-[13px] font-bold leading-tight block ' + (isDarkMode ? 'text-amber-100' : 'text-amber-900')}>AI detects associations, not causation. All outputs mandate human-in-the-loop review.</span>
                        </div>
                    </div>
                </motion.div>

                {/* ═══════════════ TWO COLUMN LAYOUT ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT: Target Performance Matrix */}
                    <motion.div variants={itemAnim} className={'lg:col-span-7 flex flex-col rounded-[2rem] p-6 lg:p-8 transition-all duration-300 backdrop-blur-xl shadow-lg relative overflow-hidden ' + (isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-emerald-50/40 border border-emerald-100')}>
                        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-20" style={{ background: primaryStr }} />

                        <div className="flex items-center gap-2 mb-8 relative z-10">
                            <div className="p-2.5 rounded-xl border bg-white/10 shadow-sm flex items-center justify-center" style={{ backdropFilter: 'blur(10px)', borderColor: `${primaryStr}20` }}>
                                <Users className="w-4 h-4" style={{ color: primaryStr }} />
                            </div>
                            <div>
                                <h3 className={'text-[11px] font-black uppercase tracking-widest leading-none ' + (isDarkMode ? 'text-slate-200' : 'text-emerald-900')}>Cohort Sensitivities</h3>
                                <p className={'text-[9px] mt-1 font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-slate-500' : 'text-emerald-600/70')}>Subgroup Variance Audit</p>
                            </div>
                        </div>

                        {!loading && biasRows.map(row => (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={'mb-6 p-4 rounded-2xl flex items-start gap-4 ' + (isDarkMode ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-red-50 border border-red-200 text-red-800')}>
                                <div className="mt-1 shrink-0 p-1.5 rounded-lg bg-red-500/20 text-red-500"><AlertTriangle className="w-4 h-4" /></div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider font-black opacity-60 block mb-0.5">Critical Variance</span>
                                    <span className="text-sm font-semibold leading-relaxed">Model fails safety margins for <strong>{row.group}</strong> subset (Sensitivity gap {"\u2193"}). Production deployment not advisable until retrained.</span>
                                </div>
                            </motion.div>
                        ))}

                        <div className={'flex-1 rounded-2xl overflow-hidden border ' + (isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-emerald-200 bg-white')}>
                            {loading ? <div className="p-16 flex justify-center text-emerald-500"><div className="w-6 h-6 border-[3px] border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> :
                                <table className="w-full text-left">
                                    <thead className={isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}>
                                        <tr>
                                            <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-500 tracking-wider">Demographic</th>
                                            <th className="px-3 py-4 text-[9px] font-black uppercase text-slate-500 tracking-wider text-center">Accuracy</th>
                                            <th className="px-3 py-4 text-[9px] font-black uppercase text-secondary-500 tracking-wider text-center" style={{ color: secondaryStr }}>Sensitivity</th>
                                            <th className="px-3 py-4 text-[9px] font-black uppercase text-slate-500 tracking-wider text-center">S.Index</th>
                                            <th className="px-3 py-4 text-[9px] font-black uppercase text-slate-500 tracking-wider text-center">Spec.</th>
                                            <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-500 tracking-wider text-right">Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody>{subgroups?.rows.map((r, i) => <SubgroupRow key={r.group} {...r} overall={subgroups.overall} isDarkMode={isDarkMode} delay={i * 0.05} />)}</tbody>
                                </table>}
                        </div>
                    </motion.div>

                    {/* RIGHT: Checklist */}
                    <motion.div variants={itemAnim} className={'lg:col-span-5 flex flex-col rounded-[2rem] p-6 lg:p-8 transition-all duration-300 backdrop-blur-xl shadow-lg relative ' + (isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-blue-50/40 border border-blue-100')}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2.5 rounded-xl border bg-white/10 shadow-sm flex items-center justify-center" style={{ backdropFilter: 'blur(10px)', borderColor: `${primaryStr}20` }}>
                                <Shield className="w-4 h-4" style={{ color: primaryStr }} />
                            </div>
                            <div>
                                <h3 className={'text-[11px] font-black uppercase tracking-widest leading-none ' + (isDarkMode ? 'text-slate-200' : 'text-blue-900')}>Ethics Protocol</h3>
                                <p className={'text-[9px] mt-1 font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-slate-500' : 'text-blue-600/70')}>Pre-Flight Checks</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {CHECKLIST_ITEMS.map((item, i) => (
                                <ChecklistItem key={item.id} item={item} checked={checkedItems.includes(item.id)} onToggle={id => setCheckedItems(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} isDarkMode={isDarkMode} delay={i * 0.05} />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ═══════════════ BOTTOM SECTION ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={itemAnim} className={'rounded-[2rem] p-6 lg:p-8 transition-all duration-300 backdrop-blur-xl shadow-lg ' + (isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-indigo-50/40 border border-indigo-100')}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2.5 rounded-xl border bg-white/10 shadow-sm" style={{ backdropFilter: 'blur(10px)', borderColor: `${primaryStr}20` }}>
                                <BarChart3 className="w-4 h-4" style={{ color: primaryStr }} />
                            </div>
                            <h3 className={'text-[11px] font-black uppercase tracking-widest leading-none mt-1 ' + (isDarkMode ? 'text-slate-200' : 'text-indigo-900')}>Data Source Drift Parity</h3>
                        </div>
                        {!loading && (
                            <div className="space-y-4">
                                <RepBar label="Male Presentation" trainingPct={Math.round(repData.training.male * 100)} hospitalPct={Math.round(repData.hospital.male * 100)} isDarkMode={isDarkMode} delay={0.1} primaryStr={primaryStr} />
                                <RepBar label="Female Presentation" trainingPct={Math.round(repData.training.female * 100)} hospitalPct={Math.round(repData.hospital.female * 100)} isDarkMode={isDarkMode} delay={0.2} primaryStr={primaryStr} />
                                <RepBar label="Elderly Baseline (>76)" trainingPct={Math.round(repData.training.elderly * 100)} hospitalPct={Math.round(repData.hospital.elderly * 100)} isDarkMode={isDarkMode} delay={0.3} primaryStr={primaryStr} />
                            </div>
                        )}
                    </motion.div>

                    <motion.div variants={itemAnim} className={'rounded-[2rem] p-6 lg:p-8 transition-all duration-300 backdrop-blur-xl shadow-lg ' + (isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-slate-50/40 border border-slate-200')}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2.5 rounded-xl border bg-white/10 shadow-sm" style={{ backdropFilter: 'blur(10px)' }}>
                                <BookOpen className="w-4 h-4 text-slate-500" />
                            </div>
                            <h3 className={'text-[11px] font-black uppercase tracking-widest leading-none mt-1 ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>Case Precedent</h3>
                        </div>
                        <div className="space-y-3">
                            {CASE_STUDIES.map((cs, i) => <CaseStudyCard key={cs.title} cs={cs} isDarkMode={isDarkMode} delay={i * 0.1} />)}
                        </div>
                    </motion.div>
                </div>

                {/* ── Navigation ── */}
                <motion.div variants={itemAnim} className={'flex justify-between items-center pt-8 border-t ' + (isDarkMode ? 'border-slate-800' : 'border-slate-200')}>
                    <motion.button onClick={onPrev} whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}
                        className={'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ' + (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}>
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default EthicsBias;
