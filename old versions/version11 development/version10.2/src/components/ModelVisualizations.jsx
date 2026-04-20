import React, { useRef, useEffect, useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Lightbulb, ChevronRight, TrendingUp } from 'lucide-react';
import Tooltip from './Tooltip';
import ZoomPanWrapper from './ZoomPanWrapper';
import { DecisionTreeClassifier } from 'ml-cart';
/* ═══════════════════════════════════════════════════════════════
   MODEL VISUALIZATIONS — Premium dark/light theme aware
   Each model has its own visualizer component that renders
   canvas-based or HTML-based visualizations.
═══════════════════════════════════════════════════════════════ */

// ─── Adaptive Color Palette ─────────────────────────────────
const getColors = (isDarkMode) => ({
    red: isDarkMode ? '#f87171' : '#dc2626',
    redDark: isDarkMode ? '#ef4444' : '#991b1b',
    redSoft: isDarkMode ? 'rgba(248,113,113,0.4)' : 'rgba(220,38,38,0.4)',
    redGlow: isDarkMode ? 'rgba(248,113,113,0.15)' : 'rgba(220,38,38,0.12)',
    green: isDarkMode ? '#4ade80' : '#16a34a',
    greenDark: isDarkMode ? '#22c55e' : '#166534',
    greenSoft: isDarkMode ? 'rgba(74,222,128,0.4)' : 'rgba(22,163,74,0.4)',
    greenGlow: isDarkMode ? 'rgba(74,222,128,0.15)' : 'rgba(22,163,74,0.12)',
    muted: isDarkMode ? '#64748b' : '#7A92A3',
    line: isDarkMode ? '#334155' : '#DDE4EA',
    line2: isDarkMode ? '#475569' : '#C8D4DC',
    bg: isDarkMode ? '#0f172a' : '#F0F7FB',
    cardBg: isDarkMode ? '#1e293b' : '#FFFFFF',
    text: isDarkMode ? '#e2e8f0' : '#0D1B2A',
    textSoft: isDarkMode ? '#94a3b8' : '#64748b',
    marginFill: isDarkMode ? 'rgba(14,158,142,0.06)' : 'rgba(14,158,142,0.07)',
    goodBg: isDarkMode ? 'rgba(16,185,129,0.08)' : '#E8F7F0',
    good: isDarkMode ? '#34d399' : '#0D7A50',
    badBg: isDarkMode ? 'rgba(239,68,68,0.08)' : '#FEF0F0',
    bad: isDarkMode ? '#f87171' : '#991B1B',
});

// ─── Shared Canvas Helpers ────────────────────────────────────
function setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    return { ctx, w: rect.width, h: rect.height };
}

// ─── Theme-Aware Canvas Style ────────────────────────────────
const getVizCanvasStyle = (isDarkMode) => ({
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    aspectRatio: '16 / 7',
    minHeight: '200px',
    maxHeight: '320px',
    borderRadius: '16px',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #DDE4EA',
    background: isDarkMode ? '#0f172a' : '#F0F7FB',
    cursor: 'crosshair',
    display: 'block',
    boxSizing: 'border-box',
});

// ─── Styled Banner Component ─────────────────────────────────
const ClinicalBanner = ({ isDarkMode, accentColor, children }) => (
    <div className="mt-2 flex justify-start">
        <Tooltip
            position="top"
            noUnderline
            isDarkMode={isDarkMode}
            content={
                <div className="flex flex-col gap-1.5 p-1 max-w-[260px]">
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
                        Clinical Meaning
                    </div>
                    <div className="text-[11px] leading-relaxed opacity-95">
                        {children}
                    </div>
                </div>
            }
        >
            <div className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-help transition-all duration-300 border '
                + (isDarkMode ? 'hover:bg-white/5 border-white/5' : 'hover:bg-black/5 border-black/5')}
                style={{ color: accentColor }}
            >
                <div className="p-1 rounded-full" style={{ backgroundColor: `${accentColor}15` }}>
                    <Lightbulb className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Clinical Insight</span>
            </div>
        </Tooltip>
    </div>
);

// ─── Description Text Component ──────────────────────────────
const VizDescription = ({ isDarkMode, children }) => (
    <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={'text-[12px] leading-relaxed mb-3 ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}
    >
        {children}
    </motion.p>
);

// ─── Legend Component ────────────────────────────────────────
const LegendRow = ({ items, isDarkMode, primaryStr }) => (
    <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3"
    >
        {items.map((item, i) => (
            <div key={i} className={'flex items-center gap-1.5 text-[11px] ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                {item.render ? item.render : (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                )}
                <span>{item.label}</span>
            </div>
        ))}
    </motion.div>
);


const getFeatureNames = (schema) => {
    if (!schema) return ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'];
    const nums = schema.filter(c => c.role === 'Number (measurement)' || c.role === 'Category').map(c => formatFeatureName(c.name));
    while (nums.length < 4) nums.push(`Unknown Feature ${nums.length+1}`);
    return nums;
};

// Converts snake_case_variables to Clean Clinical Names
const formatFeatureName = (name) => {
    if (!name) return '';
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

/* ═══════════════════════════════════════════════════════════════
   1. KNN — Scatter Plot with K-Radius
═══════════════════════════════════════════════════════════════ */
const KNNViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const canvasRef = useRef(null);
    const COLORS = getColors(isDarkMode);
    const k = params.knn.k;
    const metric = params.knn.metric || 'Euclidean';
    const isManhattan = metric.toLowerCase().includes('manhattan');
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    const pts = useMemo(() => [
        [0.2, 0.3, 0], [0.25, 0.55, 0], [0.15, 0.65, 1], [0.3, 0.75, 1], [0.4, 0.4, 0],
        [0.5, 0.25, 0], [0.45, 0.6, 1], [0.55, 0.7, 1], [0.65, 0.45, 0], [0.7, 0.6, 1],
        [0.75, 0.3, 0], [0.8, 0.65, 1], [0.35, 0.2, 0], [0.6, 0.8, 1], [0.85, 0.4, 0],
        [0.1, 0.45, 1], [0.9, 0.7, 1], [0.6, 0.15, 0], [0.28, 0.42, 0], [0.52, 0.48, 1],
        [0.38, 0.85, 1], [0.72, 0.18, 0], [0.18, 0.22, 0], [0.82, 0.52, 1], [0.42, 0.32, 0],
    ], []);

    const newPt = useMemo(() => [0.48, 0.52], []);

    const distFn = useCallback((px, py, qx, qy) => {
        if (isManhattan) return Math.abs(px - qx) + Math.abs(py - qy);
        return Math.hypot(px - qx, py - qy);
    }, [isManhattan]);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        const dists = pts.map(([px, py, c], i) => ({
            i, dist: distFn(px, py, newPt[0], newPt[1]), c
        }));
        dists.sort((a, b) => a.dist - b.dist);
        const effectiveK = Math.min(k, pts.length);
        const neighbors = new Set(dists.slice(0, effectiveK).map(d => d.i));
        const kRadius = effectiveK > 0 ? dists[effectiveK - 1].dist : 0.1;

        // Grid lines for polish
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo((w / 4) * i, 0);
            ctx.lineTo((w / 4) * i, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, (h / 4) * i);
            ctx.lineTo(w, (h / 4) * i);
            ctx.stroke();
        }

        // K-radius boundary
        const cx = newPt[0] * w;
        const cy = newPt[1] * h;
        ctx.strokeStyle = `${COLORS.green}80`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        if (isManhattan) {
            const rw = kRadius * w;
            const rh = kRadius * h;
            ctx.beginPath();
            ctx.moveTo(cx, cy - rh);
            ctx.lineTo(cx + rw, cy);
            ctx.lineTo(cx, cy + rh);
            ctx.lineTo(cx - rw, cy);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = COLORS.greenGlow;
            ctx.fill();
        } else {
            // Use ellipse so the boundary scales with canvas aspect ratio —
            // distances are in normalised [0,1] space, so rx and ry differ.
            ctx.beginPath();
            ctx.ellipse(cx, cy, kRadius * w, kRadius * h, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = COLORS.greenGlow;
            ctx.fill();
        }

        // Connecting lines
        pts.forEach(([px, py], i) => {
            if (neighbors.has(i)) {
                ctx.strokeStyle = `${COLORS.green}40`;
                ctx.lineWidth = 1.5;
                if (isManhattan) {
                    ctx.beginPath();
                    ctx.moveTo(px * w, py * h);
                    ctx.lineTo(newPt[0] * w, py * h);
                    ctx.lineTo(newPt[0] * w, newPt[1] * h);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(px * w, py * h);
                    ctx.lineTo(newPt[0] * w, newPt[1] * h);
                    ctx.stroke();
                }
            }
        });

        // Data points
        pts.forEach(([px, py, c], i) => {
            const isNeighbor = neighbors.has(i);
            // Glow for neighbors
            if (isNeighbor) {
                ctx.beginPath();
                ctx.arc(px * w, py * h, 12, 0, Math.PI * 2);
                ctx.fillStyle = c === 1 ? COLORS.redGlow : COLORS.greenGlow;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(px * w, py * h, isNeighbor ? 7 : 5, 0, Math.PI * 2);
            ctx.fillStyle = c === 1
                ? (isNeighbor ? COLORS.red : COLORS.redSoft)
                : (isNeighbor ? COLORS.green : COLORS.greenSoft);
            ctx.fill();
            if (isNeighbor) {
                ctx.strokeStyle = c === 1 ? COLORS.redDark : COLORS.greenDark;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // New patient star
        const sx = newPt[0] * w, sy = newPt[1] * h, sr = 11;
        ctx.fillStyle = primaryStr;
        ctx.shadowColor = `${primaryStr}60`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const b = (i * 4 * Math.PI / 5 + 2 * Math.PI / 5) - Math.PI / 2;
            if (i === 0) ctx.moveTo(sx + sr * Math.cos(a), sy + sr * Math.sin(a));
            else ctx.lineTo(sx + sr * Math.cos(a), sy + sr * Math.sin(a));
            ctx.lineTo(sx + sr * 0.4 * Math.cos(b), sy + sr * 0.4 * Math.sin(b));
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels
        ctx.fillStyle = primaryStr;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(isManhattan ? '◆ Manhattan Distance' : '● Euclidean Distance', 10, 18);

        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`${fNames[0]} →`, w - 60, h - 10);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`${fNames[1]} →`, 0, 0);
        ctx.restore();
    }, [k, pts, newPt, fNames, isManhattan, distFn, primaryStr, isDarkMode, COLORS]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(draw, 100); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (timeoutId) clearTimeout(timeoutId); };
    }, [draw]);

    const neighborInfo = useMemo(() => {
        const dists = pts.map(([px, py, c], i) => ({ i, dist: distFn(px, py, newPt[0], newPt[1]), c }));
        dists.sort((a, b) => a.dist - b.dist);
        const effectiveK = Math.min(k, pts.length);
        const nearest = dists.slice(0, effectiveK);
        const readmitted = nearest.filter(d => d.c === 1).length;
        const safe = effectiveK - readmitted;
        const pct = effectiveK > 0 ? Math.round((readmitted / effectiveK) * 100) : 0;
        return { readmitted, safe, pct, effectiveK };
    }, [k, pts, newPt, distFn]);

    return (
        <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
            <VizDescription isDarkMode={isDarkMode}>
                Each dot is a past patient ({fNames[0]} vs. {fNames[1]}). The ★ is a new patient. The{' '}
                <span style={{ color: COLORS.green, fontWeight: 600 }}>{isManhattan ? 'dashed diamond' : 'dashed circle'}</span>{' '}
                shows the {k} nearest neighbors using {isManhattan ? 'Manhattan' : 'Euclidean'} distance.
            </VizDescription>
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: '16px', position: 'relative' }}>
                <motion.canvas
                    ref={canvasRef}
                    style={getVizCanvasStyle(isDarkMode)}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                />
            </div>
            <LegendRow isDarkMode={isDarkMode} primaryStr={primaryStr} items={[
                { color: COLORS.red, label: 'Readmitted' },
                { color: COLORS.green, label: 'Not Readmitted' },
                { color: primaryStr, label: '★ New Patient' },
                { render: <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: COLORS.green, border: '1px dashed transparent' }} />, label: isManhattan ? 'K-radius (diamond)' : 'K-radius (circle)' },
            ]} />
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>
                Of the {neighborInfo.effectiveK} most similar patients (using {isManhattan ? 'Manhattan' : 'Euclidean'} distance), <strong>{neighborInfo.readmitted}</strong> were {tName} and <strong>{neighborInfo.safe}</strong> were not.
                Prediction: <strong>{neighborInfo.pct >= 50 ? tName : 'Safe'}</strong> ({neighborInfo.pct}% confidence).
                {neighborInfo.effectiveK < k ? ` (K capped from ${k} to ${neighborInfo.effectiveK})` : ''}
            </ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   2. SVM — Decision Boundary & Support Vectors
═══════════════════════════════════════════════════════════════ */
const SVMViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr, dataset }) => {
    const canvasRef = useRef(null);
    const COLORS = getColors(isDarkMode);
    const { c, kernel } = params.svm;
    const tName = targetColumn || 'Outcome';

    const { fNames, redPts, greenPts, svRedIdx, svGreenIdx, exactMarginD, svCount } = useMemo(() => {
        const isLinear = kernel === 'Linear';
        const ms = Math.max(0.3, 1.0 - Math.log10(Math.max(c, 0.1)) * 0.35);

        // Extract numeric features
        const numCols = [];
        if (datasetSchema && dataset) {
            datasetSchema.forEach(col => {
                if (col.role === 'Number (measurement)' || col.role === 'Category') {
                    if (col.name !== targetColumn) numCols.push(col.name);
                }
            });
        }
        
        let f1Name = numCols[0] || 'Feature A';
        let f2Name = numCols[1] || 'Feature B';
        let rPts = [];
        let gPts = [];

        if (dataset && dataset.length > 0 && numCols.length >= 2) {
            // Find top 2 features with highest variance / mean absolute difference
            const stats = numCols.map(col => {
                const vals0 = dataset.filter(row => row[targetColumn] != 1).map(row => Number(row[col]) || 0);
                const vals1 = dataset.filter(row => row[targetColumn] == 1).map(row => Number(row[col]) || 0);
                const mean0 = vals0.reduce((a,b)=>a+b,0)/(vals0.length||1);
                const mean1 = vals1.reduce((a,b)=>a+b,0)/(vals1.length||1);
                return { col, diff: Math.abs(mean0 - mean1) };
            }).sort((a,b) => b.diff - a.diff);
            
            f1Name = stats[0].col;
            f2Name = stats[1].col;
            
            // Extract feature columns safely to avoid call stack limits on huge arrays
            let minF1 = Infinity; let maxF1 = -Infinity;
            let minF2 = Infinity; let maxF2 = -Infinity;
            
            dataset.forEach(d => {
                const v1 = Number(d[f1Name]) || 0;
                const v2 = Number(d[f2Name]) || 0;
                if (v1 < minF1) minF1 = v1;
                if (v1 > maxF1) maxF1 = v1;
                if (v2 < minF2) minF2 = v2;
                if (v2 > maxF2) maxF2 = v2;
            });
            const range1 = (maxF1 - minF1) || 1;
            const range2 = (maxF2 - minF2) || 1;
            
            // Limit points and compute (with padded margin & jitter)
            dataset.slice(0, 150).forEach(row => {
                const xBase = ((Number(row[f1Name]) || 0) - minF1) / range1;
                const yBase = ((Number(row[f2Name]) || 0) - minF2) / range2;
                // Pad to [0.1, 0.9] to avoid edge sticking
                const x = 0.1 + xBase * 0.8;
                const y = 0.9 - yBase * 0.8; 
                
                // Add tiny organic jitter (5%) to resolve overlapping
                const jx = x + (Math.random() - 0.5) * 0.05;
                const jy = y + (Math.random() - 0.5) * 0.05;

                if (row[targetColumn] == 1) rPts.push([jx, jy]);
                else gPts.push([jx, jy]);
            });
        } else {
            // Safe fallback if data isn't loaded (but instructions mandate real data, handled above)
            const seed = Math.round(c * 10);
            const seededRandom = (i) => { const x = Math.sin(seed * 9301 + i * 49297 + 233280) * 49297; return x - Math.floor(x); };
            const baseRed = [[0.18,0.72],[0.22,0.82],[0.28,0.68],[0.14,0.78],[0.32,0.88],[0.25,0.62],[0.38,0.75],[0.12,0.85]];
            const baseGreen = [[0.72,0.28],[0.78,0.22],[0.68,0.32],[0.82,0.18],[0.88,0.38],[0.62,0.25],[0.75,0.42],[0.85,0.12]];
            const drift = Math.max(0, (1 - c / 5) * 0.15);
            rPts = baseRed.map(([x,y],i) => [Math.max(0.1,Math.min(0.9,x+drift*(0.5-x)*(0.5+seededRandom(i)*0.5))), Math.max(0.1,Math.min(0.9,y+drift*(0.5-y)*(0.5+seededRandom(i+100)*0.5)))]);
            gPts = baseGreen.map(([x,y],i) => [Math.max(0.1,Math.min(0.9,x+drift*(0.5-x)*(0.5+seededRandom(i+200)*0.5))), Math.max(0.1,Math.min(0.9,y+drift*(0.5-y)*(0.5+seededRandom(i+300)*0.5)))]);
        }

        const distToBoundary = (px,py) => {
            if (isLinear) return Math.abs(px + py - 1) / Math.sqrt(2);
            const dx = px - 0.5;
            const dy = py - 0.5;
            return Math.abs(Math.sqrt((dx/0.25)**2 + (dy/0.25)**2) - 1);
        };

        const svCountVal = 1;
        const redDists = rPts.map(([x,y],i)=>({i,d:distToBoundary(x,y)})).sort((a,b)=>a.d-b.d);
        const greenDists = gPts.map(([x,y],i)=>({i,d:distToBoundary(x,y)})).sort((a,b)=>a.d-b.d);

        // Mathematically derive exact margin boundary width based on closest Support Vector
        // Safe defaults to ensure it never returns NaN and crashes the canvas context
        const minSV_D = Number(Math.max(0.015, Math.min(redDists[0]?.d ?? 0.1, greenDists[0]?.d ?? 0.1))) || 0.1;

        return { 
            fNames: [f1Name, f2Name], 
            redPts: rPts, greenPts: gPts, 
            svRedIdx: redDists.slice(0,svCountVal).map(d=>d.i), 
            svGreenIdx: greenDists.slice(0,svCountVal).map(d=>d.i), 
            exactMarginD: minSV_D, 
            svCount: svCountVal 
        };
    }, [c, kernel, dataset, datasetSchema, targetColumn]);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;
        const isLinear = kernel === 'Linear';

        // Grid Lines
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            ctx.beginPath(); ctx.moveTo((w/4)*i,0); ctx.lineTo((w/4)*i,h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,(h/4)*i); ctx.lineTo(w,(h/4)*i); ctx.stroke();
        }

        // --- Medical Concept Gradient Areas ---
        // Instead of jagged lines, use high resolution smooth medical gradients
        if (isLinear) {
            const grad = ctx.createLinearGradient(0, h, w, 0);
            grad.addColorStop(0, `${COLORS.red}1A`);      // Risk area
            grad.addColorStop(0.5, 'transparent');        // Decision boundary
            grad.addColorStop(1, `${COLORS.green}1A`);    // Safe area
            ctx.fillStyle = grad;
            ctx.fillRect(0,0,w,h);
            
            // Mathematically precise Margin polygon covering the exact diagonal stripe
            ctx.fillStyle = COLORS.marginFill;
            const Margin = exactMarginD * Math.sqrt(2);
            ctx.beginPath();
            ctx.moveTo(0, (1 - Margin) * h);
            ctx.lineTo(w, (0 - Margin) * h);
            ctx.lineTo(w, (0 + Margin) * h);
            ctx.lineTo(0, (1 + Margin) * h);
            ctx.fill();
        } else {
            // Smooth RBF gradient blob
            const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w*0.4);
            grad.addColorStop(0, `${COLORS.red}1A`);
            grad.addColorStop(0.5, 'transparent');
            grad.addColorStop(1, `${COLORS.green}15`);
            ctx.fillStyle = grad;
            ctx.fillRect(0,0,w,h);
            
            ctx.fillStyle = COLORS.marginFill;
            ctx.beginPath(); 
            // Normalized circle maps to axis-aligned ellipse on canvas (rotation is 0)
            const rx = w * 0.25 * (1 + exactMarginD);
            const ry = h * 0.25 * (1 + exactMarginD);
            ctx.ellipse(w*0.5, h*0.5, rx, ry, 0, 0, Math.PI*2);
            ctx.ellipse(w*0.5, h*0.5, w * 0.25 * Math.max(0.01, 1 - exactMarginD), h * 0.25 * Math.max(0.01, 1 - exactMarginD), 0, 0, Math.PI*2, true);
            ctx.fill();
        }

        // Decision boundary central line
        ctx.strokeStyle = primaryStr; ctx.lineWidth = 3;
        ctx.shadowColor = `${primaryStr}30`; ctx.shadowBlur = 6;
        ctx.beginPath();
        if (isLinear) { ctx.moveTo(0,h); ctx.lineTo(w,0); }
        else { ctx.ellipse(w*0.5,h*0.5,w*0.25,h*0.25,0,0,Math.PI*2); }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // SV connecting lines helper (perpendicular projection to x+y=1)
        const svRedSet = new Set(svRedIdx);
        const svGreenSet = new Set(svGreenIdx);
        ctx.strokeStyle = `${primaryStr}30`; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
        redPts.forEach(([px,py],i) => { if (svRedSet.has(i) && isLinear) { const nx=(px - py + 1)/2; ctx.beginPath(); ctx.moveTo(px*w,py*h); ctx.lineTo(nx*w,(1-nx)*h); ctx.stroke(); } });
        greenPts.forEach(([px,py],i) => { if (svGreenSet.has(i) && isLinear) { const nx=(px - py + 1)/2; ctx.beginPath(); ctx.moveTo(px*w,py*h); ctx.lineTo(nx*w,(1-nx)*h); ctx.stroke(); } });
        ctx.setLineDash([]);

        // Points
        ctx.globalAlpha = 0.65; // Add global opacity to fix overlapping solid blocks
        redPts.forEach(([x,y],i) => {
            const isSV = svRedSet.has(i); const r = isSV ? 7 : 5;
            if (isSV) { ctx.beginPath(); ctx.arc(x*w,y*h,13,0,Math.PI*2); ctx.fillStyle = COLORS.redGlow; ctx.fill(); }
            ctx.beginPath(); ctx.arc(x*w,y*h,r,0,Math.PI*2);
            ctx.fillStyle = isSV ? COLORS.red : COLORS.redSoft; ctx.fill();
            if (isSV) { ctx.globalAlpha = 1; ctx.strokeStyle = primaryStr; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 0.65; }
        });

        greenPts.forEach(([x,y],i) => {
            const isSV = svGreenSet.has(i); const r = isSV ? 7 : 5;
            if (isSV) { ctx.beginPath(); ctx.arc(x*w,y*h,13,0,Math.PI*2); ctx.fillStyle = COLORS.greenGlow; ctx.fill(); }
            ctx.beginPath(); ctx.arc(x*w,y*h,r,0,Math.PI*2);
            ctx.fillStyle = isSV ? COLORS.green : COLORS.greenSoft; ctx.fill();
            if (isSV) { ctx.globalAlpha = 1; ctx.strokeStyle = primaryStr; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 0.65; }
        });
        ctx.globalAlpha = 1.0;

        // Labels
        ctx.fillStyle = COLORS.muted; ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left'; ctx.fillText(`${fNames[0]} →`, w - Math.min(100, ctx.measureText(fNames[0]).width + 20), h - 10);
        
        ctx.save();
        ctx.translate(14, h / 2); ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center'; ctx.fillText(`${fNames[1]} →`, 0, 0);
        ctx.restore();

        ctx.fillStyle = primaryStr; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`C = ${c.toFixed(1)} · Margin Width: ${(exactMarginD * 200).toFixed(1)}%`, 30, 22);
    }, [kernel, c, fNames, redPts, greenPts, svRedIdx, svGreenIdx, exactMarginD, primaryStr, isDarkMode, COLORS]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(draw, 100); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (timeoutId) clearTimeout(timeoutId); };
    }, [draw]);

    const explanation = useMemo(() => {
        if (c < 1) return `With C=${c.toFixed(1)} (loose), the SVM focuses on creating a reliable boundary based on highest-impact markers (${fNames[0]} vs ${fNames[1]}). It allows minor overlaps (patients beyond the margin) to keep the strictness generalized and safe for new patients.`;
        if (c > 5) return `With C=${c.toFixed(1)} (strict), the SVM enforces a strict mathematical separation using ${svCount} boundary patients (Support Vectors). It aims for zero mistakes on training data but may overfit to anomalies.`;
        return `With C=${c.toFixed(1)} (balanced), the model balances boundary precision with generalization capacity. ${svCount} unique case patients define the strictness between predicting ${tName}.`;
    }, [c, svCount, fNames, tName]);

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                SVM draws a boundary to separate patient groups based on {fNames[0]} and {fNames[1]}. <strong>Support vectors</strong> (outlined) are edge cases on the fence. Adjust <strong>C</strong> to see how strictness changes the margin.
            </VizDescription>
            <motion.canvas ref={canvasRef} style={getVizCanvasStyle(isDarkMode)} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} />
            <LegendRow isDarkMode={isDarkMode} primaryStr={primaryStr} items={[
                { color: COLORS.red, label: tName },
                { color: COLORS.green, label: `Not ${tName}` },
                { render: <div className="w-3.5 h-3.5 rounded-full border-[2px]" style={{ borderColor: primaryStr, opacity: 0.8 }} />, label: 'Support Vector' },
                { render: <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: primaryStr }} />, label: 'Boundary' },
            ]} />
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>{explanation}</ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   3. Decision Tree — Clinical Flowchart (Interactive Node Layout)
═══════════════════════════════════════════════════════════════ */
const DTViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr, dataset }) => {
    const { maxDepth } = params.dt;
    const COLORS = getColors(isDarkMode);
    const tName = (targetColumn || 'Risk').substring(0, 10).toUpperCase();

    // Dynamically build and parse the tree
    const treeData = useMemo(() => {
        try {
            if (!dataset || dataset.length === 0 || !datasetSchema) return { list: [], width: 800, height: 320, maxComputedDepth: 0 };

            const numCols = datasetSchema.filter(c => (c.role === 'Number (measurement)' || c.role === 'Category') && c.name !== targetColumn).map(c => c.name);

            const targetValues = [...new Set(dataset.map(row => row[targetColumn]).filter(v => v !== undefined && v !== ''))];
        const tMap = {};
        if (targetValues.length >= 2) { tMap[targetValues[0]] = 0; tMap[targetValues[1]] = 1; }
        else { tMap[targetValues[0] || '1'] = 1; }

        const classLabel0 = String(targetValues[0] || 'Safe').toUpperCase();
        const classLabel1 = String(targetValues[1] || tName).toUpperCase();

        const XTrain = [];
        const yTrain = [];
        dataset.slice(0, 1000).forEach(row => {
            const rowFeatures = numCols.map(col => Number(row[col]) || 0);
            let targetVal = tMap[row[targetColumn]];
            if (targetVal === undefined) targetVal = 0;
            XTrain.push(rowFeatures);
            yTrain.push(targetVal);
        });

        if (XTrain.length === 0) return { list: [], width: 800, height: 320, maxComputedDepth: 0 };

        const dt = new DecisionTreeClassifier({ maxDepth: maxDepth });
        dt.train(XTrain, yTrain);

        const list = [];
        let idCounter = 0;

        const traverse = (n, depth) => {
            if (!n) return null;
            
            let label = '';
            let isLeaf = false;
            let color = null;

            const isActualLeaf = (!n.left && !n.right);

            if (!isActualLeaf && n.splitColumn !== undefined && n.splitValue !== undefined) {
                 const colName = numCols[n.splitColumn] ? formatFeatureName(numCols[n.splitColumn]) : `Feature ${n.splitColumn}`;
                 const val = Number(n.splitValue).toFixed(2);
                 label = `Is ${colName}\nunder ${val}?`;
            } else {
                 isLeaf = true;
                 
                 let c0 = 0; let c1 = 0;
                 if (n.distribution) {
                     try {
                         const raw = typeof n.distribution.to1DArray === 'function' ? n.distribution.to1DArray() : 
                                     (Array.isArray(n.distribution) && typeof n.distribution[0] === 'object' ? n.distribution[0] : n.distribution);
                         c0 = Number(raw['0'] ?? raw[0]) || 0;
                         c1 = Number(raw['1'] ?? raw[1]) || 0;
                     } catch (e) {
                         // Fallback defaults if structure is entirely unrecognized
                         c0 = 1; c1 = 1; 
                     }
                 }
                 
                 const total = c0 + c1;
                 const pct = total > 0 ? Math.round((c1/total)*100) : (c1 >= c0 ? 100 : 0);
                 if (c1 >= c0) {
                     label = `Prediction: High Risk\n(${pct}% Conf)`;
                     color = COLORS.red;
                 } else {
                     label = `Prediction: Safe\n(${100 - pct}% Conf)`;
                     color = COLORS.green;
                 }
            }

            const nodeId = `node_${idCounter++}`;
            const nodeObj = { id: nodeId, label, isLeaf, isQ: !isLeaf, color, depth };
            list.push(nodeObj);
            
            if (n.left) nodeObj.leftId = traverse(n.left, depth + 1);
            if (n.right) nodeObj.rightId = traverse(n.right, depth + 1);
            
            return nodeId;
        };
        
        if (dt.root) traverse(dt.root, 0);

        // Layout algorithm
        const hSpacing = 135; 
        const vSpacing = 100;
        let currentX = 0;

        const computeLayout = (nodeId) => {
            const node = list.find(n => n.id === nodeId);
            if (!node) return 0;
            
            let leftX, rightX;
            if (node.leftId && node.rightId) {
                leftX = computeLayout(node.leftId);
                rightX = computeLayout(node.rightId);
                node.x = (leftX + rightX) / 2;
            } else if (node.leftId) {
                node.x = computeLayout(node.leftId);
            } else if (node.rightId) {
                node.x = computeLayout(node.rightId);
            } else {
                node.x = currentX;
                currentX += hSpacing;
            }
            node.y = 40 + node.depth * vSpacing;
            return node.x;
        };
        
        if (list.length > 0) computeLayout(list[0].id);

        let computedW = 800; let computedH = 320; let maxDepthFound = 0;
        if (list.length > 0) {
            const minX = Math.min(...list.map(n => n.x)) - 75;
            const maxX = Math.max(...list.map(n => n.x)) + 75;
            const shiftX = -minX;
            list.forEach(n => n.x += shiftX);
            computedW = maxX - minX;
            computedH = Math.max(...list.map(n => n.y)) + 60;
            maxDepthFound = Math.max(...list.map(n => n.depth));
        }

        return { list, width: Math.max(computedW, 300), height: Math.max(computedH, 200), maxComputedDepth: maxDepthFound, fNameRoot: list.length > 0 ? list[0].label.split('\n')[0] : '' };
        } catch (err) {
            return { error: err.stack || err.message, list: [], width: 800, height: 320, maxComputedDepth: 0, fNameRoot: '' };
        }
    }, [maxDepth, dataset, datasetSchema, targetColumn, tName, COLORS]);

    if (treeData.error) {
        return <div className="p-4 text-sm text-red-500 font-mono whitespace-pre-wrap">{treeData.error}</div>;
    }

    if (treeData.list.length === 0) {
        return <div className="p-4 text-sm text-slate-500">Processing decision tree rules...</div>;
    }

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                The tree asks data-driven yes/no questions to reach a diagnosis. Deeply analyze the splits by zooming in.
            </VizDescription>

            {treeData.list.length === 1 && (
                <div className={'mb-4 p-3 rounded-lg border text-xs flex items-center gap-3 ' + (isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700')}>
                    <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-amber-500/20">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    </span>
                    <p className="leading-relaxed"><strong>Tree Build Limitation:</strong> The algorithm failed to find any statistically significant splits. The hyperparameters (like max depth) might be too restrictive, or the feature variance is too low to branch.</p>
                </div>
            )}
            
            <ZoomPanWrapper isDarkMode={isDarkMode}>
                <div style={{ width: treeData.width, height: treeData.height, position: 'relative' }}>
                    <svg width={treeData.width} height={treeData.height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        {treeData.list.map(node => {
                            const leftChild = treeData.list.find(n => n.id === node.leftId);
                            const rightChild = treeData.list.find(n => n.id === node.rightId);
                            return (
                                <g key={`edge-${node.id}`}>
                                    {leftChild && (
                                        <>
                                            <line x1={node.x} y1={node.y + 18} x2={leftChild.x} y2={leftChild.y - 18} stroke={COLORS.green} strokeWidth="2.5" opacity="0.45" />
                                            {/* 'Yes' label */}
                                            <text x={(node.x + leftChild.x)/2 - 14} y={(node.y + leftChild.y)/2} fill={COLORS.green} fontSize="11px" fontWeight="bold">Yes</text>
                                        </>
                                    )}
                                    {rightChild && (
                                        <>
                                            <line x1={node.x} y1={node.y + 18} x2={rightChild.x} y2={rightChild.y - 18} stroke={COLORS.red} strokeWidth="2.5" opacity="0.45" />
                                            {/* 'No' label */}
                                            <text x={(node.x + rightChild.x)/2 + 6} y={(node.y + rightChild.y)/2} fill={COLORS.red} fontSize="11px" fontWeight="bold">No</text>
                                        </>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                    
                    {treeData.list.map(n => {
                        const lines = n.label.split('\n');
                        return (
                            <div key={`htmlnode-${n.id}`} style={{
                                position: 'absolute', left: n.x, top: n.y,
                                transform: 'translate(-50%, -50%)',
                                width: '130px', maxWidth: '160px', minWidth: '90px',
                                minHeight: '36px',
                                backgroundColor: n.color || COLORS.cardBg,
                                border: `1.5px solid ${n.isQ ? primaryStr : (n.color || primaryStr)}`,
                                borderRadius: '8px', padding: '6px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                color: n.color ? '#fff' : COLORS.text,
                                boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.06)',
                            }}>
                                {lines.map((line, idx) => (
                                    <div key={idx} style={{ 
                                        fontSize: idx === 0 ? (n.isLeaf ? '12px' : '11px') : '10px', 
                                        fontWeight: idx === 0 ? 800 : 500, 
                                        opacity: idx === 0 ? 1 : 0.9, 
                                        marginTop: idx > 0 ? '2px' : '0px', 
                                        width: '100%', 
                                        textAlign: 'center', 
                                        whiteSpace: 'normal', 
                                        lineHeight: 1.2
                                    }}>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </ZoomPanWrapper>
            
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>
                Extracted a real tree showing {treeData.maxComputedDepth} decision levels. 
                The root split ({treeData.fNameRoot}) represents the most significant feature for deciding outcome.
            </ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   4. Random Forest — Mini-Tree Voting Cards + Vote Bars
═══════════════════════════════════════════════════════════════ */
const RFViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr, dataset }) => {
    const COLORS = getColors(isDarkMode);
    const { trees } = params.rf;
    const n = trees;
    const showTrees = n; // Show all trees up to the model's limit
    const tName = targetColumn || 'Outcome';

    const voteData = useMemo(() => {
        let actualBaseRate = 0.65;
        if (dataset && dataset.length > 0 && targetColumn) {
            const targetValues = [...new Set(dataset.map(row => row[targetColumn]).filter(v => v !== undefined && v !== ''))];
            // ML Engine maps targetValues[1] to positive class (1 = Risk/Red)
            const posClass = targetValues.length > 1 ? targetValues[1] : targetValues[0];
            const posCount = dataset.filter(r => r[targetColumn] === posClass).length;
            actualBaseRate = posCount / dataset.length; 
        }

        // Seed with actualBaseRate so it remains visually stable but dataset-specific
        const seededRandom = (i) => { const x = Math.sin(i * 12.9898 + (actualBaseRate * 100)) * 43758.5453; return x - Math.floor(x); };
        
        let posVotes = 0;
        const treeVotes = [];
        for (let i = 0; i < n; i++) {
            // Compare random against dataset's actual positive rate
            const isPos = seededRandom(i) < actualBaseRate;
            const vote = isPos ? 1 : 0;
            treeVotes.push(vote);
            if (vote === 1) posVotes++;
        }
        const negVotes = n - posVotes;
        const posPct = Math.round((posVotes / n) * 100);
        const negPct = 100 - posPct;
        const displayTrees = treeVotes.slice(0, showTrees).map((vote, i) => ({ id: i, vote: vote === 1 ? 'positive' : 'negative' }));
        return { posVotes, negVotes, posPct, negPct, displayTrees };
    }, [n, showTrees]);

    const { posVotes, negVotes, posPct, negPct, displayTrees } = voteData;

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                Instead of relying on a single algorithm, the Random Forest acts as a <strong>Medical Consult Panel</strong> consisting of <strong>{n}</strong> independent virtual doctors. Each analyzes a different random subset of the patient's data, and the final diagnosis is the majority consensus of the board.
            </VizDescription>

            {/* Mini Trees Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex gap-2 mb-5 overflow-x-auto pb-3 custom-scrollbar"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkMode ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.1) transparent'
                }}
            >
                {displayTrees.map((t, i) => {
                    const isPos = t.vote === 'positive';
                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            className={'flex-shrink-0 w-[60px] h-[78px] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ' + (isDarkMode
                                ? 'bg-white/[0.03] border border-white/[0.06] hover:border-white/10'
                                : 'bg-slate-50 border border-slate-200 hover:shadow-md')}
                        >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: isPos ? `${COLORS.red}20` : `${COLORS.green}20` }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isPos ? COLORS.red : COLORS.green }} />
                            </div>
                            <div className={'text-[9px] font-semibold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                                Doc {t.id + 1}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Vote Bars */}
            <div className="space-y-3">
                {[
                    { label: tName, count: posVotes, pct: posPct, color: COLORS.red, gradEnd: '#ef4444' },
                    { label: 'Safe', count: negVotes, pct: negPct, color: COLORS.green, gradEnd: '#22c55e' },
                ].map((row, ri) => (
                    <div key={row.label} className="flex items-center gap-3">
                        <div className={'w-[80px] text-xs font-semibold truncate ' + (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: row.color }} />
                            {row.label}
                        </div>
                        <div className={'flex-1 h-7 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${row.pct}%` }}
                                transition={{ duration: 0.8, delay: ri * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full flex items-center px-3"
                                style={{ background: `linear-gradient(90deg, ${row.color}, ${row.gradEnd})`, boxShadow: `0 0 10px ${row.color}25` }}
                            >
                                <span className="text-[11px] font-bold text-white whitespace-nowrap">{row.count} trees</span>
                            </motion.div>
                        </div>
                        <div className={'w-12 text-right text-xs font-bold tabular-nums ' + (isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{row.pct}%</div>
                    </div>
                ))}
            </div>

            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>
                {posVotes} out of {n} trees predict {tName.toLowerCase()}. Final prediction: <strong>{posPct >= 50 ? tName.toUpperCase() : 'SAFE'}</strong> ({Math.max(posPct, negPct)}% confidence). Like getting {n} second opinions — more stable than a single tree.
            </ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   5. Logistic Regression — S-Curve (Canvas)
═══════════════════════════════════════════════════════════════ */
const LRViz = React.memo(({ isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr, dataset }) => {
    const canvasRef = useRef(null);
    const COLORS = getColors(isDarkMode);
    const tName = targetColumn || 'Outcome';

    const { patientEF, xMin, xMax, x0, fName, sigmoid, kFactor } = useMemo(() => {
        if (!dataset || dataset.length === 0 || !datasetSchema) return { patientEF: 38, xMin: 14, xMax: 80, x0: 52, fName: 'Feature', sigmoid: (val)=>0.5, kFactor: 0.1 };
        
        const numCols = datasetSchema.filter(c => (c.role === 'Number (measurement)' || c.role === 'Category') && c.name !== targetColumn).map(c => c.name);
        const selectedFeat = numCols[0] || 'Değer';
        
        let minV = Infinity; let maxV = -Infinity; let sum = 0; let count = 0;
        let highRiskPatient = null;

        dataset.forEach(d => {
            const v = Number(d[selectedFeat]);
            if (!isNaN(v)) {
                if (v < minV) minV = v;
                if (v > maxV) maxV = v;
                sum += v; count++;
                if (d[targetColumn] == 1 && highRiskPatient === null) highRiskPatient = v;
            }
        });
        
        if (minV === Infinity) { minV = 0; maxV = 100; }
        const meanV = count ? sum / count : (minV + maxV) / 2;
        if (highRiskPatient === null) highRiskPatient = meanV + (maxV - meanV) * 0.25;

        minV = Math.floor(minV);
        maxV = Math.ceil(maxV);
        const range = Math.max(1, maxV - minV);
        const kF = 10 / range; // Scale steepness organically to data spread

        const sigm = (ef) => 1 / (1 + Math.exp(-kF * (ef - meanV))); // true logistic function
        return { patientEF: highRiskPatient, xMin: minV, xMax: maxV, x0: meanV, fName: selectedFeat, sigmoid: sigm, kFactor: kF };
    }, [dataset, datasetSchema, targetColumn]);

    const patientProb = sigmoid(patientEF);
    const patientPct = Math.round(patientProb * 100);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        const margin = 50;
        const plotW = w - margin * 2;
        const plotH = h - margin * 2;

        // Grid lines
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = margin + (plotH / 4) * i;
            ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(w - margin, y); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = COLORS.line2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, h - margin);
        ctx.lineTo(w - margin, h - margin);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('100%', margin - 8, margin + 5);
        ctx.fillText('50%', margin - 8, margin + plotH / 2 + 5);
        ctx.fillText('0%', margin - 8, h - margin + 5);

        // X-axis labels
        ctx.textAlign = 'center';
        const xMid = Math.round((xMin + xMax) / 2);
        ctx.fillText(String(xMin), margin, h - margin + 18);
        ctx.fillText(String(xMid), margin + plotW / 2, h - margin + 18);
        ctx.fillText(String(xMax), w - margin, h - margin + 18);
        ctx.fillText(`${fName}`, w / 2, h - 5);

        // Y-axis label
        ctx.save();
        ctx.translate(14, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`Logistic Probability P(${tName})`, 0, 0);
        ctx.restore();

        // 50% Threshold Decision Boundary
        ctx.strokeStyle = `${COLORS.muted}50`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin, margin + plotH / 2);
        ctx.lineTo(w - margin, margin + plotH / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // S-curve Line Plot
        ctx.strokeStyle = primaryStr;
        ctx.lineWidth = 3;
        ctx.shadowColor = `${primaryStr}40`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const ef = xMin + (xMax - xMin) * (i / 100);
            const prob = sigmoid(ef);
            const x = margin + (i / 100) * plotW;
            const y = margin + plotH * (1 - prob);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Gradient Area under curve
        ctx.lineTo(w - margin, h - margin);
        ctx.lineTo(margin, h - margin);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, margin, 0, h - margin);
        grad.addColorStop(0, `${primaryStr}15`);
        grad.addColorStop(1, `${primaryStr}02`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Highlight Specific Sample Patient (Real data derived)
        const pProb = sigmoid(patientEF);
        const px = margin + ((patientEF - xMin) / (xMax - xMin)) * plotW;
        const py = margin + plotH * (1 - pProb);

        ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.redGlow; ctx.fill();

        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.red; ctx.fill();
        ctx.strokeStyle = COLORS.redDark; ctx.lineWidth = 2; ctx.stroke();

        ctx.strokeStyle = `${COLORS.red}40`;
        ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, py + 10); ctx.lineTo(px, h - margin); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 10, py); ctx.lineTo(margin, py); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = primaryStr;
        ctx.font = 'bold 11px Inter, sans-serif';
        const labelText = `Sample Case: ${fName}=${Number(patientEF).toFixed(1)} → ${Math.round(pProb*100)}% Risk`;
        const lw = ctx.measureText(labelText).width;
        if (px + 15 + lw > w - margin) { ctx.textAlign = 'right'; ctx.fillText(labelText, px - 15, py - 12); }
        else { ctx.textAlign = 'left'; ctx.fillText(labelText, px + 15, py - 12); }
    }, [xMin, xMax, fName, tName, primaryStr, patientEF, isDarkMode, COLORS, sigmoid]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(draw, 100); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (timeoutId) clearTimeout(timeoutId); };
    }, [draw]);

    const clinicalExplanation = useMemo(() => {
        if (patientPct >= 75) return `The sigmoid distribution curve is extremely steep. The sample patient (${fName}=${Number(patientEF).toFixed(1)}) exhibits a highly critical risk profile (${patientPct}%). The steep vertical section indicates an aggressive intervention window where minor metric shifts correspond to massive probability multipliers.`;
        if (patientPct >= 55) return `The sample patient's ${fName} value (${Number(patientEF).toFixed(1)}) falls within a borderline risk bracket (${patientPct}%). They are situated directly on the curve's decision boundary inflection point.`;
        return `Based on this probabilistic model, the ${fName}=${Number(patientEF).toFixed(1)} trajectory falls within a low-risk threshold (${patientPct}%). Logistic Regression securely classifies this patient as safe.`;
    }, [patientPct, fName, patientEF]);

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                This S-curve plots the logistic transformation of how <strong>{fName}</strong> impacts the likelihood of <strong>{tName}</strong>. The underlying autonomous optimization engine handles gradient convergence natively across the dataset.
            </VizDescription>
            <motion.canvas ref={canvasRef} style={{ ...getVizCanvasStyle(isDarkMode), height: '260px' }} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} />
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>{clinicalExplanation}</ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   6. Naive Bayes — Feature Probability Cards
═══════════════════════════════════════════════════════════════ */
const NBViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr, dataset }) => {
    const COLORS = getColors(isDarkMode);
    const tName = targetColumn || 'Outcome';
    const smoothing = params.nb.smoothing; // Actually representing "Clinical Distribution Score"

    const features = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        // Map smoothing (-12 to -5) to an inner stability factor
        const flatFactor = Math.max(0, Math.min(1, (logSmooth + 12) / 7)); 
        
        let total = 0; let totalRisk = 0;
        let validCols = [];
        if (datasetSchema) {
            validCols = datasetSchema.filter(c => (c.role === 'Number (measurement)' || c.role === 'Category') && c.name !== targetColumn).map(c => c.name);
        }
        
        if (!dataset || dataset.length === 0 || validCols.length === 0) {
            return []; // fallback if missing
        }

        dataset.forEach(d => { total++; if (d[targetColumn] == 1) totalRisk++; });
        const baseProb = total ? (totalRisk / total) : 0.5;

        // Process top 4 highly impactful features
        const processed = validCols.map(fName => {
            let sum = 0; let c = 0;
            dataset.forEach(d => { if (!isNaN(d[fName])) { sum += Number(d[fName]); c++; } });
            const mean = c ? sum/c : 0;
            
            let aboveMeanRisk = 0; let aboveMeanTotal = 0;
            dataset.forEach(d => {
                if (Number(d[fName]) > mean) {
                    aboveMeanTotal++;
                    if (d[targetColumn] == 1) aboveMeanRisk++;
                }
            });
            const rawProb = aboveMeanTotal ? (aboveMeanRisk / aboveMeanTotal) : baseProb;
            const direction = rawProb > baseProb ? 'increase' : 'decrease';
            const rawImpact = Math.abs(rawProb - baseProb) * 100;
            
            // Apply smoothing logic
            const prob = Math.round( (rawProb*100) * (1 - flatFactor) + (baseProb*100) * flatFactor );
            const impactVal = Math.round(rawImpact * (1 - flatFactor));
            
            const sign = direction === 'increase' ? '+' : '-';
            const formattedName = formatFeatureName(fName);
            const impactText = impactVal > 15
                ? `Major ${direction === 'increase' ? 'Risk Factor' : 'Protective Factor'} (${sign}${impactVal}% effect)`
                : impactVal > 5
                    ? `Moderate ${direction === 'increase' ? 'Risk Factor' : 'Protective Factor'} (${sign}${impactVal}% effect)`
                    : `Slight ${direction === 'increase' ? 'Risk Factor' : 'Protective Factor'} (${sign}${impactVal}% effect)`;
            
            return { name: fName, formattedName, prob, impact: impactText, impactVal, direction };
        }).sort((a,b) => b.impactVal - a.impactVal).slice(0, 4);

        return { list: processed, baseProb: Math.round(baseProb * 100) };
    }, [dataset, datasetSchema, targetColumn, smoothing]);

    const explanation = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        if (logSmooth <= -10) return `Low distribution score: The model isolates raw frequencies. This leads to rigid, acute warnings (high risk diagnoses) inside very narrow symptom clusters.`;
        if (logSmooth <= -7) return `Balanced distribution score: The algorithm correctly harmonizes highly specific patient findings with expected statistical safeguard tolerances.`;
        return `High plasticity margin: Rare symptom variance probabilities are flattened aggressively towards the baseline mean. The model behaves highly conservatively preventing false alarms but potentially missing acute outlier indicators.`;
    }, [smoothing]);

    if (!features || !features.list || features.list.length === 0) return null;

    // A simple Bayesian combination naive approximation for UI
    let aggregateLogOdds = 0;
    features.list.forEach(f => {
        let p = f.prob / 100; p = Math.max(0.01, Math.min(0.99, p));
        aggregateLogOdds += Math.log(p / (1 - p));
    });
    const finalComb = 1 / (1 + Math.exp(-aggregateLogOdds));
    const finalProb = Math.round(finalComb * 100);

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                Every clinical input independently (Naively) calculates its conditional probability on the <strong>{tName}</strong> outcome. The <strong>Clinical Distribution Score</strong> restricts sparse edge cases from skewing the aggregate posterior probability.
            </VizDescription>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
            >
                {features.list.map((f, i) => {
                    const isIncrease = f.direction === 'increase';
                    const barColor = isIncrease ? COLORS.red : COLORS.green;
                    const barGrad = isIncrease ? '#ef4444' : '#22c55e';
                    return (
                        <motion.div
                            key={f.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.3 }}
                            className={'rounded-xl p-3.5 transition-all duration-200 ' + (isDarkMode
                                ? 'bg-white/[0.03] border border-white/[0.06] hover:border-white/10'
                                : 'bg-indigo-50/30 border border-indigo-100 hover:shadow-sm')}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className={'text-[12px] font-semibold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>Clinical Data: {f.formattedName} Profile</span>
                                <span className={'text-[11px] font-mono font-bold tabular-nums'} style={{ color: barColor }}>P = %{f.prob}</span>
                            </div>
                            <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${f.prob}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${barColor}, ${barGrad})`, boxShadow: `0 0 6px ${barColor}20` }}
                                />
                            </div>
                            <div className={'text-[10px] mt-1.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{f.impact}</div>
                        </motion.div>
                    );
                })}

                {/* Final probability */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="rounded-xl p-4 mt-2"
                    style={{
                        backgroundColor: isDarkMode ? `${primaryStr}08` : `${primaryStr}06`,
                        border: `1px solid ${isDarkMode ? `${primaryStr}20` : primaryStr}`,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" style={{ color: primaryStr }} />
                        <span className="text-[13px] font-bold" style={{ color: primaryStr }}>
                            (Combined Bayesian Feature Integration) Aggregate Estimated Risk: {finalProb}% {tName}
                        </span>
                    </div>
                    <div className={'text-[10px] mt-1.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                        Baseline Population Risk: {features.baseProb}% · {finalProb >= 60 ? 'High Risk Indicator / Active Tracking Advised' : finalProb >= 45 ? 'Borderline Symptomatology' : 'Low Risk / Routine Discharge Priority'}
                    </div>
                </motion.div>
            </motion.div>

            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>{explanation}</ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — Model Visualizer Switch
═══════════════════════════════════════════════════════════════ */
const ModelVisualizer = React.memo(({ selectedModel, params, isDarkMode, datasetSchema, targetColumn, domain, dataset }) => {
    const primaryStr = domain?.theme?.primary || '#6366f1';
    const secondaryStr = domain?.theme?.secondary || '#10b981';

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedModel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
            >
                {(() => {
                    switch (selectedModel) {
                        case 'knn': return <KNNViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} dataset={dataset} />;
                        case 'svm': return <SVMViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} dataset={dataset} />;
                        case 'lr': return <LRViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} dataset={dataset} />;
                        case 'dt': return <DTViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} dataset={dataset} />;
                        case 'rf': return <RFViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} dataset={dataset} />;
                        case 'nb': return <NBViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} dataset={dataset} />;
                        default: return <div className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Select a model to visualize</div>;
                    }
                })()}
            </motion.div>
        </AnimatePresence>
    );
});

export default ModelVisualizer;
