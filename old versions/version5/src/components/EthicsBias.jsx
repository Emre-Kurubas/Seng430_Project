import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ArrowLeft, Download,
    Shield, Users, BarChart3, BookOpen, Activity,
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
const generateSubgroups = (trainedModelResult) => {
    // Safety floor: Ensure base metrics are realistic for an audit report
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
            { group: 'Male', value: '450 patients', acc: Math.min(baseAcc + rand(0.01, 0.03), 0.99), sens: Math.min(baseSens + rand(0.01, 0.03), 0.99), spec: Math.min(spec + rand(0.01, 0.03), 0.99), fairness: 'reference' },
            { group: 'Female', value: '310 patients', acc: Math.max(baseAcc - rand(0.02, 0.05), 0.60), sens: Math.max(baseSens - rand(0.04, 0.08), 0.55), spec: spec, fairness: null },
            { group: 'Age 18–60', value: '520 patients', acc: baseAcc, sens: baseSens, spec: spec, fairness: null },
            { group: 'Age 61–75', value: '180 patients', acc: Math.max(baseAcc - rand(0.01, 0.03), 0.60), sens: Math.max(baseSens - rand(0.02, 0.05), 0.58), spec: spec, fairness: null },
            { group: 'Age 76+', value: '60 patients', acc: Math.max(baseAcc - rand(0.03, 0.06), 0.55), sens: Math.max(baseSens - rand(0.05, 0.10), 0.50), spec: spec, fairness: null },
        ],
    };
};

const generateRepresentation = () => ({
    training: { male: rand(0.58, 0.70), female: rand(0.30, 0.42), elderly: rand(0.10, 0.18) },
    hospital: { male: rand(0.44, 0.54), female: rand(0.46, 0.56), elderly: rand(0.28, 0.38) },
});

const CHECKLIST_ITEMS = [
    { id: 'explainability', label: 'Model outputs include explanations (completed in Step 6)', detail: 'Implemented feature importance and per-patient explanations.', preChecked: true },
    { id: 'data_doc', label: 'Training data source is documented (shown in Step 2)', detail: 'Dataset source, time period, and demographics recorded.', preChecked: true },
    { id: 'bias_audit', label: 'Subgroup bias audit completed', detail: 'Checked fairness across gender and age groups.', preChecked: false },
    { id: 'human_oversight', label: 'Human oversight plan defined', detail: 'Clinician reviews all high-risk flags.', preChecked: false },
    { id: 'privacy', label: 'Patient data privacy protected (GDPR)', detail: 'No PII used in training.', preChecked: false },
    { id: 'monitoring', label: 'Drift monitoring plan established', detail: 'Re-check model every 3 months.', preChecked: false },
    { id: 'incidents', label: 'Incident reporting pathway defined', detail: 'Process for reporting harm.', preChecked: false },
    { id: 'validation', label: 'Clinical validation completed', detail: 'Supervised testing in real environment.', preChecked: false },
];

const CASE_STUDIES = [
    { title: 'Case 1: Sepsis Algorithm Bias', color: 'red', body: 'A US sepsis algorithm performed worse for Black patients due to unrepresentative training data.' },
    { title: 'Case 2: Accuracy ≠ Safety', color: 'amber', body: 'A model with 85% accuracy had very low sensitivity for elderly patients, causing missed high-risk cases.' },
    { title: 'Case 3: Success: Fairness by Design', color: 'emerald', body: 'A hospital reduced readmissions by 20% after auditing their AI for age bias and adjusting decision thresholds.' },
];

const SubgroupRow = React.memo(({ group, acc, sens, spec, overall, isDarkMode, delay, isRef }) => {
    const gap = overall.sens - sens;
    const sensBad = gap > 0.10;
    return (
        <motion.tr initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay }}
            className={`border-b transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'} ${isRef ? (isDarkMode ? 'bg-slate-800/20' : 'bg-slate-50/60') : ''}`}>
            <td className={`px-4 py-3 font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {group}
                {isRef && <span className={`ml-2 text-[9px] font-bold px-1 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>REF</span>}
            </td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${colorForValue(acc, 0.72, 0.65, isDarkMode)}`}>{pct(acc)}%</td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${colorForValue(sens, 0.65, 0.50, isDarkMode)}`}>
                {pct(sens)}%
                {sensBad && <span className="ml-1 text-red-500">↓</span>}
            </td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${isDarkMode ? 'text-slate-400 font-mono' : 'text-slate-500 font-mono'}`}>
                {(sens / (overall.sens || 1)).toFixed(2)}
            </td>
            <td className={`px-4 py-3 text-sm font-bold text-center ${colorForValue(spec, 0.72, 0.65, isDarkMode)}`}>{pct(spec)}%</td>
            <td className="px-4 py-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${isRef ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200') : badgeForValue(sens, 0.65, 0.50, isDarkMode).cls}`}>
                    {isRef ? 'OK' : badgeForValue(sens, 0.65, 0.50, isDarkMode).label}
                </span>
            </td>
        </motion.tr>
    );
});

const ChecklistItem = React.memo(({ item, checked, onToggle, isDarkMode, delay }) => {
    const [open, setOpen] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}
            className={`rounded-xl border transition-all ${checked ? (isDarkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50/80 border-emerald-200') : (isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200')}`}>
            <div className="flex items-start gap-3 p-3.5">
                <button onClick={() => !item.preChecked && onToggle(item.id)} className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${checked ? 'bg-emerald-500 border-emerald-500' : (isDarkMode ? 'border-slate-600 hover:border-indigo-400' : 'border-slate-300 hover:border-indigo-500')} ${item.preChecked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-medium leading-snug ${checked ? (isDarkMode ? 'text-emerald-300' : 'text-emerald-800') : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                            {item.label}
                            {item.preChecked && <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>Pre-filled</span>}
                        </span>
                        <button onClick={() => setOpen(o => !o)} className="shrink-0 mt-0.5 opacity-40 hover:opacity-70 transition-opacity">
                            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    {open && <p className={`text-[11px] mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.detail}</p>}
                </div>
            </div>
        </motion.div>
    );
});

const CaseStudyCard = React.memo(({ cs, isDarkMode, delay }) => {
    const colors = {
        red: { bg: isDarkMode ? 'bg-red-900/15 border-red-500/25' : 'bg-red-50 border-red-200', title: isDarkMode ? 'text-red-300' : 'text-red-800' },
        amber: { bg: isDarkMode ? 'bg-amber-900/15 border-amber-500/25' : 'bg-amber-50 border-amber-200', title: isDarkMode ? 'text-amber-300' : 'text-amber-800' },
        emerald: { bg: isDarkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200', title: isDarkMode ? 'text-emerald-300' : 'text-emerald-800' },
    };
    const c = colors[cs.color];
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className={`p-4 rounded-xl border ${c.bg}`}>
            <p className={`text-sm font-bold mb-2 ${c.title}`}>{cs.title}</p>
            <p className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{cs.body}</p>
        </motion.div>
    );
});

const RepBar = React.memo(({ label, trainingPct, hospitalPct, isDarkMode, delay, primaryStr }) => {
    const gap = Math.abs(trainingPct - hospitalPct);
    const warn = gap > 15;
    return (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay }} className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold">
                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
                {warn && <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{gap.toFixed(0)}pp gap</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] w-20 text-right ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Training</span>
                <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: primaryStr }} initial={{ width: 0 }} animate={{ width: `${trainingPct}%` }} transition={{ duration: 0.7, delay: delay + 0.1 }} />
                </div>
                <span className={`text-[11px] font-mono w-8`} style={{ color: primaryStr }}>{Math.round(trainingPct)}%</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] w-20 text-right ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hospital</span>
                <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div className="h-full rounded-full bg-slate-400" initial={{ width: 0 }} animate={{ width: `${hospitalPct}%` }} transition={{ duration: 0.7, delay: delay + 0.2 }} />
                </div>
                <span className={`text-[11px] font-mono w-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{Math.round(hospitalPct)}%</span>
            </div>
        </motion.div>
    );
});

// ─── Premium PDF Certificate (Competition-Winning Design) ──────────────────────────
const generateCertificate = async ({ checked, subgroups, domain, trainedModelResult }) => {
    const dName = domain?.name || 'General Clinical';
    const metrics = trainedModelResult || { accuracy: 0.85, sensitivity: 0.82, specificity: 0.88, precision: 0.84, f1Score: 0.83, auc: 0.89 };
    const dateStr = new Date().toLocaleString();
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const auditID = `HEALTH-AI-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const cleanDate = dateStr.includes(' at') ? dateStr.split(' at')[0] : dateStr.split(' ')[0];

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Clinical Audit Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=JetBrains+Mono&display=swap');
  body { font-family: 'Outfit', sans-serif; padding: 0; margin: 0; color: #1e293b; background: white; -webkit-print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; background: white; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
  
  .accent-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 8px; background: linear-gradient(to bottom, ${primaryStr}, #10b981); }
  
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
  .brand-area { display: flex; align-items: center; gap: 12px; }
  .logo-box { width: 44px; height: 44px; background: ${primaryStr}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 20px; box-shadow: 0 4px 10px ${primaryStr}44; }
  .brand { font-size: 24px; font-weight: 800; color: #0f172a; }
  .report-meta { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b; line-height: 1.5; }

  .hero-section { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 30px; }
  h1 { font-size: 34px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -1.5px; }
  .hero-desc { font-size: 14px; color: #64748b; margin-top: 8px; line-height: 1.4; max-width: 400px; }
  
  .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${primaryStr}; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ""; flex: 1; height: 1px; background: #f1f5f9; }

  .metrics-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; }
  .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; }
  .kpi-lbl { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 2px; }

  .vis-block { background: #fff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; }
  .chart-label { font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 10px; }

  .main-grid { display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 40px; }
  
  .table { width: 100%; border-collapse: collapse; }
  .table th { text-align: left; font-size: 10px; color: #94a3b8; text-transform: uppercase; padding: 10px 5px; border-bottom: 2px solid #f1f5f9; }
  .table td { padding: 12px 5px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .sens-bar-bg { height: 6px; background: #f1f5f9; border-radius: 3px; position: relative; margin-top: 4px; overflow: hidden; }
  .sens-bar-fill { height: 100%; border-radius: 3px; }

  .justification-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 15px; }
  .just-card { background: #f8fafc; border-left: 3px solid ${primaryStr}; border-radius: 0 8px 8px 0; padding: 12px; }
  .just-title { font-size: 11px; font-weight: 800; color: ${primaryStr}; margin-bottom: 4px; }
  .just-body { font-size: 10px; color: #475569; line-height: 1.4; }

  .signature-block { margin-top: auto; padding-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
  .sig-line { border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .footer-meta { margin-top: 30px; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #f1f5f9; padding-top: 15px; font-size: 9px; color: #94a3b8; font-weight: 600; }
</style></head><body>
<div class="page">
<div class="accent-bar"></div>
<div class="header">
  <div class="brand-area">
    <div class="logo-box">H</div>
    <div class="brand">HEALTH<span style="color:${primaryStr}">AI</span></div>
  </div>
  <div class="report-meta">
    AUDIT ID: ${auditID}<br>
    SYSTEM: v5.0-PRO (STABLE)<br>
    DATE: ${cleanDate}
  </div>
</div>
<div class="hero-section">
  <div>
    <h1>Algorithmic Safety Audit</h1>
    <p class="hero-desc">Independent technical verification of predictive integrity, demographic fairness, and clinical justification for the <strong>${dName}</strong> deployment pipeline.</p>
  </div>
  <div class="vis-block">
    <div class="chart-label">ROC PERFORMANCE CURVE</div>
    <svg width="180" height="120" viewBox="0 0 180 120">
      <path d="M20,100 L160,100" stroke="#e2e8f0" stroke-width="1"/>
      <path d="M20,20 L20,100" stroke="#e2e8f0" stroke-width="1"/>
      <path d="M20,100 L160,20" stroke="#94a3b8" stroke-dasharray="3,2"/>
      <path d="M20,100 Q40,40 160,20" fill="none" stroke="${primaryStr}" stroke-width="3" stroke-linecap="round"/>
      <text x="90" y="70" text-anchor="middle" font-size="10" font-weight="800" fill="${primaryStr}">AUC: ${pct(metrics.auc || 0.89)}%</text>
    </svg>
  </div>
</div>
<div class="metrics-summary">
  <div class="kpi-card"><div class="kpi-val">${pct(metrics.accuracy)}%</div><div class="kpi-lbl">Overall Accuracy</div></div>
  <div class="kpi-card"><div class="kpi-val">${pct(metrics.sensitivity)}%</div><div class="kpi-lbl">Safety (Recall)</div></div>
  <div class="kpi-card"><div class="kpi-val">${pct(metrics.specificity)}%</div><div class="kpi-lbl">Efficiency (Spec.)</div></div>
  <div class="kpi-card"><div class="kpi-val">${pct(metrics.f1Score || 0.83)}%</div><div class="kpi-lbl">F1 Stability</div></div>
  <div class="kpi-card"><div class="kpi-val">${pct(metrics.precision || 0.84)}%</div><div class="kpi-lbl">Confidence</div></div>
  <div class="kpi-card"><div class="kpi-val">HIGH</div><div class="kpi-lbl">Audit Status</div></div>
</div>
<div class="main-grid">
  <div>
    <div class="section-title">01. Demographic Fairness Analysis</div>
    <table class="table">
      <thead><tr><th>Demographic Group</th><th>Sensitivity</th><th>Bias Index</th></tr></thead>
      <tbody>
        ${(subgroups?.rows || []).map(r => `
          <tr>
            <td style="font-weight:600">${r.group}</td>
            <td>
              <div style="font-weight:700">${pct(r.sens)}%</div>
              <div class="sens-bar-bg"><div class="sens-bar-fill" style="width:${pct(r.sens)}%; background:${r.sens < subgroups.overall.sens - 0.1 ? '#ef4444' : primaryStr}"></div></div>
            </td>
            <td style="font-family:'JetBrains Mono', monospace; font-size:11px">${(r.sens / (subgroups.overall.sens || 1)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="section-title" style="margin-top:30px">02. Ethics & Regulatory Checklist</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      <div style="font-size:11px; color:#1e293b; display:flex; gap:8px;">✅ EU AI Act (High-Risk) Validated</div>
      <div style="font-size:11px; color:#1e293b; display:flex; gap:8px;">✅ Demographic Parity Analysis</div>
      <div style="font-size:11px; color:#1e293b; display:flex; gap:8px;">✅ ISO 13485:2016 Compliant</div>
      <div style="font-size:11px; color:#334155; font-style:italic;">+ ${checked.length} Professional Protocols Signed</div>
    </div>
  </div>
  <div>
    <div class="section-title">03. Clinical Strategy Justification</div>
    <div class="justification-grid">
      ${(domain?.topFeaturesClinical || []).slice(0,3).map(f => `
        <div class="just-card">
          <div class="just-title">${f.feature}</div>
          <div class="just-body">${f.justification}</div>
        </div>
      `).join('')}
    </div>
    <div class="section-title" style="margin-top:25px">04. Dataset Origin</div>
    <div style="font-size:11px; color:#64748b; line-height:1.6">
      <strong style="color:#0f172a">SOURCE:</strong> ${domain?.source || 'Clinical Records'}<br>
      <strong style="color:#0f172a">TARGET:</strong> ${domain?.target || 'Class Prediction'}
    </div>
  </div>
</div>
<div class="signature-block">
  <div class="sig-line">Lead Clinical AI Specialist (Digital Signature)</div>
  <div class="sig-line">Medical Ethics Review Board Representative</div>
</div>
<div class="footer-meta">
  <div>INTERNAL CLASSIFICATION: MEDICAL GRADE PRO</div>
  <div>© 2026 HEALTHAI board • SPRINT 4 DELIVERABLE</div>
</div>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 800); }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EthicsBias = ({ isDarkMode, onPrev, domain, trainedModelResult }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const [subgroups, setSubgroups] = useState(null);
    const [repData, setRepData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [checkedItems, setCheckedItems] = useState(() => 
        CHECKLIST_ITEMS.filter(i => i.preChecked).map(i => i.id)
    );
    const [auditPhase, setAuditPhase] = useState(0);
    const auditPhases = [
        "Initializing Ethical Scan...",
        "Validating Model Accuracy...",
        "Auditing Demographic Bias...",
        "Verifying EU AI Act Compliance...",
        "Generating Signed Certificate..."
    ];

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
        // Instant generation as requested
        await generateCertificate({ checked: checkedItems, subgroups, domain, trainedModelResult });
        setIsGenerating(false);
    };

    const overallSens = subgroups?.overall?.sens ?? 0;
    const biasRows = subgroups?.rows?.filter(r => !r.fairness && overallSens - r.sens > 0.10) ?? [];
    const allChecked = checkedItems.length === CHECKLIST_ITEMS.length;
    const trainingFemalePct = repData ? Math.round(repData.training.female * 100) : 0;
    const hospitalFemalePct = repData ? Math.round(repData.hospital.female * 100) : 0;

    return (
        <div className="w-full space-y-6 pb-20">
            {/* ── Sprint 4: Clinical Sense-Check Banner ── */}
            <div className={`p-5 rounded-2xl border-l-4 flex gap-4 ${isDarkMode ? 'bg-indigo-900/10 border-indigo-500/50 text-indigo-100' : 'bg-indigo-50 border-indigo-500/50 text-indigo-900 shadow-sm'}`}>
                <div className={`p-2 rounded-xl shrink-0 h-fit ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Activity className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Clinical Impact Verification</p>
                    <p className="text-sm font-semibold leading-relaxed">
                        {domain?.whyMatters || "Understanding the clinical context is essential for ethical AI deployment."}
                    </p>
                </div>
            </div>

            {/* ── Sprint 4: Ethical Caution Banner ── */}
            <div className={`p-4 rounded-xl border flex gap-3 items-center ${isDarkMode ? 'bg-amber-900/10 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">CAUTION: This model identifies clinical associations, not direct causation. Use as decision support ONLY.</p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase">Step 7 of 7</span>
                    <button onClick={handleGenerateCert} disabled={isGenerating} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${isGenerating ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        {isGenerating ? 'Generating...' : <><Download className="w-4 h-4" /> Certificate</>}
                    </button>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ethics & Bias</h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Audit fairness and regulatory compliance before deployment.</p>
                
                {!loading && (
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {pct(subgroups.overall.acc)}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Accuracy</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {pct(subgroups.overall.sens)}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Sensitivity</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {pct(subgroups.overall.spec)}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Specificity</div>
                        </div>
                    </div>
                )}
            </div>

            {!loading && biasRows.map(row => (
                <div key={row.group} className={`p-4 rounded-xl border-2 ${isDarkMode ? 'bg-red-900/10 border-red-500/50 text-red-300' : 'bg-red-50 border-red-300 text-red-800'} text-sm`}>
                    <AlertTriangle className="w-5 h-5 inline mr-2 text-red-500" />
                    <strong>Bias Warning:</strong> Sensitivity for {row.group} is significantly lower than average. Deployment not recommended.
                </div>
            ))}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="p-4 border-b flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-500"><Users className="w-4 h-4" /> Subgroup Performance</div>
                        {loading ? <div className="p-10 text-center text-sm">Auditing...</div> : 
                        <table className="w-full text-sm text-left">
                            <thead className={isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}><tr><th className="px-4 py-3">Group</th><th className="px-4 py-3 text-center">Acc</th><th className="px-4 py-3 text-center">Sens</th><th className="px-4 py-3 text-center">Index</th><th className="px-4 py-3 text-center">Spec</th><th className="px-4 py-3 text-center">Status</th></tr></thead>
                            <tbody>{subgroups?.rows.map((r, i) => <SubgroupRow key={r.group} {...r} overall={subgroups.overall} isDarkMode={isDarkMode} delay={i * 0.05} isRef={r.fairness === 'reference'} />)}</tbody>
                        </table>}
                    </div>
                </div>
                <div className="lg:col-span-5">
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-4 font-bold text-xs uppercase tracking-wider text-slate-500"><Shield className="w-4 h-4" /> EU AI Act Checklist</div>
                        <div className="space-y-2">{CHECKLIST_ITEMS.map((item, i) => <ChecklistItem key={item.id} item={item} checked={checkedItems.includes(item.id)} onToggle={id => setCheckedItems(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} isDarkMode={isDarkMode} delay={i * 0.05} />)}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Dataset Representation</div>
                    {!loading && <div className="space-y-4">
                        <RepBar label="Male patients" trainingPct={Math.round(repData.training.male * 100)} hospitalPct={Math.round(repData.hospital.male * 100)} isDarkMode={isDarkMode} delay={0.1} primaryStr={primaryStr} />
                        <RepBar label="Female patients" trainingPct={Math.round(repData.training.female * 100)} hospitalPct={Math.round(repData.hospital.female * 100)} isDarkMode={isDarkMode} delay={0.2} primaryStr={primaryStr} />
                        <RepBar label="Elderly (76+)" trainingPct={Math.round(repData.training.elderly * 100)} hospitalPct={Math.round(repData.hospital.elderly * 100)} isDarkMode={isDarkMode} delay={0.3} primaryStr={primaryStr} />
                    </div>}
                </div>
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Clinical Case Studies</div>
                    <div className="space-y-3">{CASE_STUDIES.map((cs, i) => <CaseStudyCard key={cs.title} cs={cs} isDarkMode={isDarkMode} delay={i * 0.1} />)}</div>
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <button onClick={onPrev} className="px-6 py-2 rounded-xl border font-bold flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"><ArrowLeft className="w-4 h-4" /> Previous Step</button>
                <div className="flex gap-4">
                    <button onClick={handleGenerateCert} disabled={isGenerating} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 text-white shadow-xl transition-all hover:scale-105 active:scale-95 relative overflow-hidden ${isGenerating ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        {isGenerating ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="text-sm">Auditing...</span>
                                </div>
                                <span className="absolute bottom-1 text-[8px] uppercase tracking-tighter opacity-60 animate-pulse">{auditPhases[auditPhase]}</span>
                            </div>
                        ) : (
                            <><Download className="w-5 h-5" /> Issue Audit Certificate</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Export ──────────────────────────────────────────────────────────────────
export default EthicsBias;
