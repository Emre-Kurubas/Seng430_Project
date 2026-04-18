import React, { useRef, useEffect, useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Lightbulb, ChevronRight, TrendingUp } from 'lucide-react';
import Tooltip from './Tooltip';
import { trainLinearSVM, trainRBFSVM, svmDecisionValues, svmPredict } from '../utils/mlEngine';

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
    const nums = schema.filter(c => c.role === 'Number (measurement)' || c.role === 'Category').map(c => c.name);
    while (nums.length < 4) nums.push(`Unknown Feature ${nums.length+1}`);
    return nums;
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
   2. SVM — Real Data-Driven Decision Boundary & Support Vectors
═══════════════════════════════════════════════════════════════ */
const SVMViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, dataset, primaryStr, secondaryStr }) => {
    const canvasRef = useRef(null);
    const COLORS = getColors(isDarkMode);
    const { c, kernel } = params.svm;
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';
    const isRBF = kernel === 'RBF';

    // ── Extract, normalise, train, and compute grid from real data ──
    const vizData = useMemo(() => {
        if (!dataset || dataset.length === 0 || !datasetSchema) return null;

        // Find first 2 numeric feature columns
        const numCols = datasetSchema
            .filter(col => col.role === 'Number (measurement)' || col.role === 'Category')
            .map(col => col.name)
            .slice(0, 2);
        if (numCols.length < 2) return null;

        // Build target label map
        const targetValues = [...new Set(dataset.map(r => r[targetColumn]).filter(v => v !== undefined && v !== ''))];
        const tMap = {};
        if (targetValues.length >= 2) { tMap[targetValues[0]] = 0; tMap[targetValues[1]] = 1; }
        else { tMap[targetValues[0] || '1'] = 1; }

        // Extract valid 2D points
        const raw = [];
        const labels = [];
        dataset.forEach(row => {
            const x = Number(row[numCols[0]]);
            const y = Number(row[numCols[1]]);
            const label = tMap[row[targetColumn]];
            if (!isNaN(x) && !isNaN(y) && label !== undefined) {
                raw.push([x, y]);
                labels.push(label);
            }
        });
        if (raw.length < 10) return null;

        // Deterministic shuffle + sample
        const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
        let indices = Array.from({ length: raw.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(42 + i) * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const trainIdx = indices.slice(0, Math.min(raw.length, 500));
        const displayIdx = indices.slice(0, Math.min(raw.length, 200));

        // Min-max normalisation with padding
        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        raw.forEach(([x, y]) => { xMin = Math.min(xMin, x); xMax = Math.max(xMax, x); yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); });
        const pad = 0.08;
        const xRange = (xMax - xMin) || 1;
        const yRange = (yMax - yMin) || 1;
        xMin -= xRange * pad; xMax += xRange * pad;
        yMin -= yRange * pad; yMax += yRange * pad;
        const xR = xMax - xMin;
        const yR = yMax - yMin;

        // Normalised training data
        const trainX = trainIdx.map(i => [(raw[i][0] - xMin) / xR, (raw[i][1] - yMin) / yR]);
        const trainY = trainIdx.map(i => labels[i] === 1 ? 1 : -1);

        // Train real SVM
        let model;
        if (isRBF) {
            let totalVar = 0;
            for (let j = 0; j < 2; j++) {
                const mean = trainX.reduce((s, x) => s + x[j], 0) / trainX.length;
                totalVar += trainX.reduce((s, x) => s + (x[j] - mean) ** 2, 0) / trainX.length;
            }
            const gamma = 1 / (2 * (totalVar / 2 + 1e-8));
            model = trainRBFSVM(trainX, trainY, c, gamma, 42);
        } else {
            model = trainLinearSVM(trainX, trainY, c, null, 42);
        }

        // Evaluate decision function on grid
        const gridSize = 45;
        const flatGrid = [];
        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                flatGrid.push([gx / (gridSize - 1), gy / (gridSize - 1)]);
            }
        }
        const gridDecisions = svmDecisionValues(flatGrid, model);
        const gridValues = [];
        let idx = 0;
        for (let gy = 0; gy < gridSize; gy++) {
            const row = [];
            for (let gx = 0; gx < gridSize; gx++) row.push(gridDecisions[idx++]);
            gridValues.push(row);
        }

        // Display points with their decision values
        const displayPts = displayIdx.map(i => ({
            x: (raw[i][0] - xMin) / xR,
            y: (raw[i][1] - yMin) / yR,
            label: labels[i],
        }));
        const displayFeatures = displayPts.map(p => [p.x, p.y]);
        const displayDecisions = svmDecisionValues(displayFeatures, model);
        displayPts.forEach((p, i) => { p.decision = displayDecisions[i]; });

        // Support vectors: points within the margin (|decision| < 1)
        const svIndices = new Set();
        displayPts.forEach((p, i) => { if (Math.abs(p.decision) < 1.0) svIndices.add(i); });

        // Training accuracy
        const trainPred = svmPredict(trainX, model);
        const trainLabels01 = trainY.map(v => v === 1 ? 1 : 0);
        let correct = 0;
        trainPred.forEach((p, i) => { if (p === trainLabels01[i]) correct++; });
        const trainAcc = Math.round((correct / trainPred.length) * 100);

        return { gridValues, gridSize, displayPts, svIndices, featureNames: [numCols[0], numCols[1]], trainAcc, svCount: svIndices.size };
    }, [dataset, datasetSchema, targetColumn, c, kernel, isRBF]);

    // ── Canvas drawing ──
    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result || !vizData) return;
        const { ctx, w, h } = result;
        const { gridValues, gridSize, displayPts, svIndices } = vizData;

        const margin = 30;
        const plotW = w - margin * 2;
        const plotH = h - margin * 2;
        const cellW = plotW / gridSize;
        const cellH = plotH / gridSize;

        // ── Decision boundary heatmap ──
        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                const val = gridValues[gy][gx];
                const intensity = Math.min(1, Math.abs(val) * 0.4);
                ctx.fillStyle = val > 0
                    ? (isDarkMode ? `rgba(248,113,113,${0.04 + intensity * 0.18})` : `rgba(220,38,38,${0.03 + intensity * 0.14})`)
                    : (isDarkMode ? `rgba(74,222,128,${0.04 + intensity * 0.18})` : `rgba(22,163,74,${0.03 + intensity * 0.14})`);
                ctx.fillRect(margin + gx * cellW, margin + gy * cellH, cellW + 0.5, cellH + 0.5);
            }
        }

        // ── Contour helper: draw iso-line at a given threshold ──
        const drawContour = (threshold, strokeStyle, lineWidth, dash) => {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash(dash);
            ctx.beginPath();
            for (let gy = 0; gy < gridSize - 1; gy++) {
                for (let gx = 0; gx < gridSize - 1; gx++) {
                    const v = [
                        gridValues[gy][gx] - threshold,
                        gridValues[gy][gx + 1] - threshold,
                        gridValues[gy + 1][gx + 1] - threshold,
                        gridValues[gy + 1][gx] - threshold,
                    ];
                    const corners = [[gx, gy], [gx + 1, gy], [gx + 1, gy + 1], [gx, gy + 1]];
                    const edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
                    const crossings = [];
                    for (const [a, b] of edges) {
                        if ((v[a] > 0) !== (v[b] > 0)) {
                            const t = v[a] / (v[a] - v[b]);
                            crossings.push([
                                margin + (corners[a][0] + t * (corners[b][0] - corners[a][0])) * cellW,
                                margin + (corners[a][1] + t * (corners[b][1] - corners[a][1])) * cellH,
                            ]);
                        }
                    }
                    if (crossings.length >= 2) { ctx.moveTo(crossings[0][0], crossings[0][1]); ctx.lineTo(crossings[1][0], crossings[1][1]); }
                    if (crossings.length >= 4) { ctx.moveTo(crossings[2][0], crossings[2][1]); ctx.lineTo(crossings[3][0], crossings[3][1]); }
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
        };

        // Margin contours at ±1
        drawContour(1, `${COLORS.muted}50`, 1, [4, 3]);
        drawContour(-1, `${COLORS.muted}50`, 1, [4, 3]);

        // Decision boundary at 0
        ctx.shadowColor = `${primaryStr}50`;
        ctx.shadowBlur = 8;
        drawContour(0, primaryStr, 2.5, []);
        ctx.shadowBlur = 0;

        // ── Data points ──
        displayPts.forEach((pt, i) => {
            const px = margin + pt.x * plotW;
            const py = margin + pt.y * plotH;
            const isSV = svIndices.has(i);
            const r = isSV ? 7 : 4;

            if (isSV) {
                ctx.beginPath();
                ctx.arc(px, py, 13, 0, Math.PI * 2);
                ctx.fillStyle = pt.label === 1 ? COLORS.redGlow : COLORS.greenGlow;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = pt.label === 1
                ? (isSV ? COLORS.red : COLORS.redSoft)
                : (isSV ? COLORS.green : COLORS.greenSoft);
            ctx.fill();
            if (isSV) {
                ctx.strokeStyle = primaryStr;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // ── Axis labels ──
        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${vizData.featureNames[0]} →`, w / 2, h - 4);
        ctx.save();
        ctx.translate(10, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${vizData.featureNames[1]} →`, 0, 0);
        ctx.restore();

        // ── Info label ──
        ctx.fillStyle = primaryStr;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${isRBF ? 'RBF' : 'Linear'} · C=${c.toFixed(1)} · ${vizData.svCount} SVs · ${vizData.trainAcc}% acc`, margin + 4, margin - 8);
    }, [vizData, primaryStr, isDarkMode, COLORS, c, isRBF]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(draw, 100); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (timeoutId) clearTimeout(timeoutId); };
    }, [draw]);

    const explanation = useMemo(() => {
        if (!vizData) return 'Waiting for dataset with at least 2 numeric features…';
        if (c < 1) return `With C=${c.toFixed(1)} (loose), the model tolerates misclassifications for a wider margin. ${vizData.svCount} support vectors within the margin define the boundary. Training accuracy: ${vizData.trainAcc}%.`;
        if (c > 5) return `With C=${c.toFixed(1)} (strict), the model penalises errors heavily — tighter boundary, risk of overfitting. ${vizData.svCount} support vectors. Training accuracy: ${vizData.trainAcc}%.`;
        return `With C=${c.toFixed(1)} (balanced), the model balances margin width and accuracy. ${vizData.svCount} support vectors define the boundary. Training accuracy: ${vizData.trainAcc}%.`;
    }, [c, vizData]);

    if (!vizData) {
        return (
            <div className={'p-6 rounded-2xl text-center ' + (isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500')}>
                <p className="text-sm">SVM requires at least 2 numeric features in the dataset to visualize the decision boundary.</p>
            </div>
        );
    }

    return (
        <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
            <VizDescription isDarkMode={isDarkMode}>
                SVM trained on your dataset ({vizData.featureNames[0]} vs {vizData.featureNames[1]}). The coloured regions show the model's decision, and the <strong style={{ color: primaryStr }}>boundary line</strong> is where confidence = 0. <strong>Support vectors</strong> (outlined) sit inside the margin.
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
                { color: COLORS.red, label: tName },
                { color: COLORS.green, label: `Not ${tName}` },
                { render: <div className="w-3.5 h-3.5 rounded-full border-[2.5px]" style={{ borderColor: primaryStr }} />, label: 'Support Vector' },
                { render: <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: primaryStr }} />, label: 'Decision Boundary' },
                { render: <div className="w-5 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: COLORS.muted }} />, label: 'Margin (±1)' },
            ]} />
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>{explanation}</ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   3. Decision Tree — Clinical Flowchart (SVG)
═══════════════════════════════════════════════════════════════ */
const DTViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const { maxDepth } = params.dt;
    const COLORS = getColors(isDarkMode);
    const svgRef = useRef(null);
    const [dims, setDims] = React.useState({ w: 800, h: 320 });
    const fNames = getFeatureNames(datasetSchema);
    const tName = (targetColumn || 'Risk').substring(0, 7).toUpperCase();

    useEffect(() => {
        const updateDims = () => { if (svgRef.current) { const rect = svgRef.current.getBoundingClientRect(); setDims({ w: rect.width || 800, h: rect.height || 320 }); } };
        updateDims();
        let timeoutId = null;
        const handleResize = () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(updateDims, 150); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (timeoutId) clearTimeout(timeoutId); };
    }, []);

    const w = dims.w;
    const h = dims.h;
    const depth = Math.min(maxDepth, 6);

    const treeData = useMemo(() => {
        const trees = {
            1: [{ x: w / 2, y: 40, label: `${fNames[0]}\n< 38?`, isQ: true },
                { x: w / 4, y: 140, label: `${tName}\n82%`, color: COLORS.red },
                { x: 3 * w / 4, y: 140, label: 'SAFE\n91%', color: COLORS.green }],
            2: [
                { x: w / 2, y: 40, label: `${fNames[0]}\n< 38?`, isQ: true },
                { x: w / 4, y: 120, label: `${fNames[1]}\n> 65?`, isQ: true },
                { x: 3 * w / 4, y: 120, label: `${fNames[2]}\n> 1.5?`, isQ: true },
                { x: w / 8, y: 200, label: `${tName}\n94%`, color: COLORS.red },
                { x: 3 * w / 8, y: 200, label: 'SAFE\n68%', color: COLORS.green },
                { x: 5 * w / 8, y: 200, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7 * w / 8, y: 200, label: 'SAFE\n96%', color: COLORS.green },
            ],
            3: [
                { x: w / 2, y: 30, label: `${fNames[0]}\n< 38?`, isQ: true },
                { x: w / 4, y: 100, label: `${fNames[1]}\n> 65?`, isQ: true },
                { x: 3 * w / 4, y: 100, label: `${fNames[2]}\n> 1.5?`, isQ: true },
                { x: w / 8, y: 170, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3 * w / 8, y: 170, label: `${fNames[0]}\n< 35?`, isQ: true },
                { x: 5 * w / 8, y: 170, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7 * w / 8, y: 170, label: 'SAFE\n96%', color: COLORS.green },
                { x: w / 16, y: 250, label: 'READMIT\n97%', color: COLORS.red },
                { x: 3 * w / 16, y: 250, label: 'READMIT\n88%', color: COLORS.red },
                { x: 5 * w / 16, y: 250, label: 'READMIT\n78%', color: COLORS.red },
                { x: 7 * w / 16, y: 250, label: 'SAFE\n65%', color: COLORS.green },
            ],
            4: [
                { x: w/2, y: 25, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: w/4, y: 85, label: `${fNames[1]}\n> val?`, isQ: true },
                { x: 3*w/4, y: 85, label: `${fNames[2]}\n> val?`, isQ: true },
                { x: w/8, y: 145, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3*w/8, y: 145, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: 5*w/8, y: 145, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7*w/8, y: 145, label: 'SAFE\n96%', color: COLORS.green },
                { x: w/16, y: 205, label: `${fNames[1]||'F4'}\n> val?`, isQ: true },
                { x: 3*w/16, y: 205, label: `${tName}\n88%`, color: COLORS.red },
                { x: 5*w/16, y: 205, label: `${fNames[2]||'F5'}\n> val?`, isQ: true },
                { x: 7*w/16, y: 205, label: 'SAFE\n65%', color: COLORS.green },
                { x: w/32, y: 265, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3*w/32, y: 265, label: 'READMIT\n94%', color: COLORS.red },
                { x: 9*w/32, y: 265, label: 'READMIT\n85%', color: COLORS.red },
                { x: 11*w/32, y: 265, label: 'SAFE\n71%', color: COLORS.green },
            ],
            5: [
                { x: w/2, y: 20, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: w/4, y: 70, label: `${fNames[1]}\n> val?`, isQ: true },
                { x: 3*w/4, y: 70, label: `${fNames[2]}\n> val?`, isQ: true },
                { x: w/8, y: 120, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3*w/8, y: 120, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: 5*w/8, y: 120, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7*w/8, y: 120, label: 'SAFE\n96%', color: COLORS.green },
                { x: w/16, y: 170, label: `${fNames[1]||'F4'}\n> val?`, isQ: true },
                { x: 3*w/16, y: 170, label: `${tName}\n88%`, color: COLORS.red },
                { x: 5*w/16, y: 170, label: `${fNames[2]||'F5'}\n> val?`, isQ: true },
                { x: 7*w/16, y: 170, label: 'SAFE\n65%', color: COLORS.green },
                { x: w/32, y: 220, label: `${fNames[3]||'F6'}\nYes?`, isQ: true },
                { x: 3*w/32, y: 220, label: 'READMIT\n94%', color: COLORS.red },
                { x: 5*w/32, y: 220, label: 'READMIT\n91%', color: COLORS.red },
                { x: 7*w/32, y: 220, label: 'SAFE\n68%', color: COLORS.green },
                { x: 9*w/32, y: 220, label: 'READMIT\n85%', color: COLORS.red },
                { x: 11*w/32, y: 220, label: 'SAFE\n71%', color: COLORS.green },
                { x: w/64, y: 270, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3*w/64, y: 270, label: 'READMIT\n96%', color: COLORS.red },
            ],
            6: [
                { x: w/2, y: 15, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: w/4, y: 55, label: `${fNames[1]}\n> val?`, isQ: true },
                { x: 3*w/4, y: 55, label: `${fNames[2]}\n> val?`, isQ: true },
                { x: w/8, y: 95, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3*w/8, y: 95, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: 5*w/8, y: 95, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7*w/8, y: 95, label: 'SAFE\n96%', color: COLORS.green },
                { x: w/16, y: 135, label: `${fNames[1]||'F4'}\n> val?`, isQ: true },
                { x: 3*w/16, y: 135, label: `${tName}\n88%`, color: COLORS.red },
                { x: 5*w/16, y: 135, label: `${fNames[2]||'F5'}\n> val?`, isQ: true },
                { x: 7*w/16, y: 135, label: 'SAFE\n65%', color: COLORS.green },
                { x: w/32, y: 175, label: `${fNames[3]||'F6'}\nYes?`, isQ: true },
                { x: 3*w/32, y: 175, label: 'READMIT\n94%', color: COLORS.red },
                { x: 5*w/32, y: 175, label: 'READMIT\n91%', color: COLORS.red },
                { x: 7*w/32, y: 175, label: 'SAFE\n68%', color: COLORS.green },
                { x: w/64, y: 215, label: `${fNames[0]||'F1'}\n< val?`, isQ: true },
                { x: 3*w/64, y: 215, label: 'READMIT\n96%', color: COLORS.red },
                { x: w/128, y: 255, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3*w/128, y: 255, label: 'READMIT\n98%', color: COLORS.red },
            ],
        };
        return trees[depth] || trees[3];
    }, [depth, w, fNames, tName, COLORS]);

    const svgStyle = {
        width: '100%', height: '320px', borderRadius: '16px',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #DDE4EA',
        background: isDarkMode ? '#0f172a' : '#F0F7FB',
        display: 'block',
    };

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                The tree asks yes/no questions about patient measurements. Follow the path from top to bottom to reach a final decision.
            </VizDescription>
            <motion.svg
                ref={svgRef} style={svgStyle} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                {/* Edges */}
                {treeData.map((node, i) => {
                    const leftChild = 2 * i + 1;
                    const rightChild = 2 * i + 2;
                    return (
                        <g key={`edges-${i}`}>
                            {leftChild < treeData.length && (
                                <line x1={node.x} y1={node.y + 18} x2={treeData[leftChild].x} y2={treeData[leftChild].y - 18}
                                    stroke={COLORS.muted} strokeWidth="1.5" fill="none" strokeOpacity="0.5" />
                            )}
                            {rightChild < treeData.length && (
                                <line x1={node.x} y1={node.y + 18} x2={treeData[rightChild].x} y2={treeData[rightChild].y - 18}
                                    stroke={COLORS.muted} strokeWidth="1.5" fill="none" strokeOpacity="0.5" />
                            )}
                        </g>
                    );
                })}
                {/* Nodes */}
                {treeData.map((n, i) => {
                    const lines = n.label.split('\n');
                    return (
                        <g key={`node-${i}`} style={{ cursor: 'pointer' }}>
                            <rect
                                x={n.x - 50} y={n.y - 18}
                                width={100} height={36} rx={10}
                                fill={n.color || COLORS.cardBg}
                                stroke={n.isQ ? primaryStr : (n.color || primaryStr)}
                                strokeWidth="1.5"
                                fillOpacity={n.color ? 1 : 0.9}
                            />
                            <text
                                x={n.x} y={lines.length > 1 ? n.y - 2 : n.y + 5}
                                textAnchor="middle" dominantBaseline="middle"
                                fill={n.color ? '#fff' : COLORS.text}
                                style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                            >{lines[0]}</text>
                            {lines.length > 1 && (
                                <text x={n.x} y={n.y + 12} textAnchor="middle"
                                    fill={n.color ? 'rgba(255,255,255,0.8)' : COLORS.muted}
                                    style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }}
                                >{lines[1]}</text>
                            )}
                        </g>
                    );
                })}
            </motion.svg>
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>
                With a depth of {maxDepth}, the model creates {Math.pow(2, Math.min(maxDepth, 4))} decision paths.
                The first split ({fNames[0]}) is the strongest predictor.
                {maxDepth > 5 ? ' High depth might over-specialize on edge-cases.' : ' A balanced depth provides a generalizable guideline.'}
            </ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   4. Random Forest — Mini-Tree Voting Cards + Vote Bars
═══════════════════════════════════════════════════════════════ */
const RFViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const COLORS = getColors(isDarkMode);
    const { trees } = params.rf;
    const n = trees;
    const showTrees = Math.min(n, 12);
    const tName = targetColumn || 'Outcome';

    const voteData = useMemo(() => {
        const seededRandom = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
        const baseRate = 0.65;
        let posVotes = 0;
        const treeVotes = [];
        for (let i = 0; i < n; i++) {
            const noise = (seededRandom(i) - 0.5) * 0.6;
            const vote = (baseRate + noise) > 0.5 ? 1 : 0;
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
                Each card represents one decision tree trained on a random sample. All <strong>{n}</strong> trees vote, and the majority wins.
                {n > showTrees && <span style={{ color: primaryStr }}> (Showing {showTrees} of {n})</span>}
            </VizDescription>

            {/* Mini Trees Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide"
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
                                Tree {t.id + 1}
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
const LRViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const canvasRef = useRef(null);
    const COLORS = getColors(isDarkMode);
    const { iterations } = params.lr;
    
    // Convert iterations (100-5000) to a curve steepness modifier (C-like behavior)
    const c = Math.max(0.5, (iterations / 1000) * 2);
    
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    const patientEF = 38;
    const xMin = 14;
    const xMax = 80;
    const x0 = 52;
    const kFactor = c * 0.2;
    const sigmoid = useCallback((ef) => 1 / (1 + Math.exp(-kFactor * (x0 - ef))), [kFactor]);
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
        ctx.fillText(`${fNames[0]}`, w / 2, h - 5);

        // Y-axis label
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`P(${tName})`, 0, 0);
        ctx.restore();

        // 50% threshold
        ctx.strokeStyle = `${COLORS.muted}50`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin, margin + plotH / 2);
        ctx.lineTo(w - margin, margin + plotH / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // S-curve with gradient fill below
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

        // Fill under curve
        ctx.lineTo(w - margin, h - margin);
        ctx.lineTo(margin, h - margin);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, margin, 0, h - margin);
        grad.addColorStop(0, `${primaryStr}15`);
        grad.addColorStop(1, `${primaryStr}02`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Patient point
        const pProb = sigmoid(patientEF);
        const px = margin + ((patientEF - xMin) / (xMax - xMin)) * plotW;
        const py = margin + plotH * (1 - pProb);
        const pPct = Math.round(pProb * 100);

        // Glow
        ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.redGlow; ctx.fill();

        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.red; ctx.fill();
        ctx.strokeStyle = COLORS.redDark; ctx.lineWidth = 2; ctx.stroke();

        // Dashed reference lines
        ctx.strokeStyle = `${COLORS.red}40`;
        ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, py + 10); ctx.lineTo(px, h - margin); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 10, py); ctx.lineTo(margin, py); ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = primaryStr;
        ctx.font = 'bold 11px Inter, sans-serif';
        const labelText = `${fNames[0]}=${patientEF} → ${pPct}% risk`;
        const lw = ctx.measureText(labelText).width;
        if (px + 15 + lw > w - margin) { ctx.textAlign = 'right'; ctx.fillText(labelText, px - 15, py - 12); }
        else { ctx.textAlign = 'left'; ctx.fillText(labelText, px + 15, py - 12); }
    }, [c, sigmoid, fNames, tName, primaryStr, patientEF, isDarkMode, COLORS]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(draw, 100); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (timeoutId) clearTimeout(timeoutId); };
    }, [draw]);

    const clinicalExplanation = useMemo(() => {
        if (patientPct >= 75) return `Patient with ${fNames[0]}=${patientEF} is in the high-risk zone (${patientPct}%). The steep curve means small changes cause large swings — a critical intervention point.`;
        if (patientPct >= 55) return `Patient with ${fNames[0]}=${patientEF} is on the steep part (${patientPct}% risk). At C=${c.toFixed(0)}, moderately confident — further investigation warranted.`;
        return `Patient with ${fNames[0]}=${patientEF} shows moderate risk (${patientPct}%). With low regularisation (C=${c.toFixed(0)}), the flatter curve reflects a conservative prediction.`;
    }, [patientPct, fNames, c, patientEF]);

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                The S-curve shows how {tName} probability changes with {fNames[0]}. The red dot marks the patient. Adjust <strong>iterations</strong> to see how training length affects the curve steepness.
            </VizDescription>
            <motion.canvas ref={canvasRef} style={{ ...getVizCanvasStyle(isDarkMode), height: '260px' }} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} />
            <ClinicalBanner isDarkMode={isDarkMode} accentColor={secondaryStr}>{clinicalExplanation}</ClinicalBanner>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   6. Naive Bayes — Feature Probability Cards
═══════════════════════════════════════════════════════════════ */
const NBViz = React.memo(({ params, isDarkMode, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const COLORS = getColors(isDarkMode);
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';
    const smoothing = params.nb.smoothing;

    const features = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        const flatFactor = Math.max(0, Math.min(1, (logSmooth + 12) / 7));
        const baseFeatures = [
            { name: fNames[0], rawProb: 82, rawImpact: 48, direction: 'increase' },
            { name: fNames[1], rawProb: 61, rawImpact: 24, direction: 'increase' },
            { name: fNames[2], rawProb: 38, rawImpact: 5,  direction: 'increase' },
            { name: fNames[3], rawProb: 22, rawImpact: 11, direction: 'decrease' },
        ];
        return baseFeatures.map(f => {
            const prob = Math.round(f.rawProb + (50 - f.rawProb) * flatFactor);
            const impact = Math.round(f.rawImpact * (1 - flatFactor * 0.8));
            const sign = f.direction === 'increase' ? '+' : '-';
            const impactText = impact > 15
                ? `STRONGLY ${f.direction === 'increase' ? 'INCREASES' : 'DECREASES'} risk by ${sign}${impact}%`
                : impact > 5
                    ? `${f.direction === 'increase' ? 'INCREASES' : 'DECREASES'} risk by ${sign}${impact}%`
                    : `Slight ${f.direction === 'increase' ? 'increase' : 'decrease'} by ${sign}${impact}%`;
            return { ...f, prob, impact: impactText, impactVal: impact };
        });
    }, [fNames, smoothing]);

    const finalProb = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        const flatFactor = Math.max(0, Math.min(1, (logSmooth + 12) / 7));
        return Math.round(72 + (50 - 72) * flatFactor);
    }, [smoothing]);

    const explanation = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        if (logSmooth <= -10) return `With minimal smoothing (${smoothing.toExponential(0)}), the model uses raw frequency counts — very confident but may overreact to rare combinations. Sharp and decisive.`;
        if (logSmooth <= -7) return `With moderate smoothing (${smoothing.toExponential(0)}), the model balances raw evidence with a safety margin. Prevents zero-probability issues without losing discriminative power.`;
        return `With high smoothing (${smoothing.toExponential(0)}), all probabilities are pulled toward 50%. Very cautious — avoids false alarms but may miss real patterns.`;
    }, [smoothing]);

    return (
        <div>
            <VizDescription isDarkMode={isDarkMode}>
                Each measurement independently changes the {tName} probability. Adjust <strong>Variance Smoothing</strong> to see how it affects confidence levels.
            </VizDescription>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
            >
                {features.map((f, i) => {
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
                                <span className={'text-[12px] font-semibold ' + (isDarkMode ? 'text-slate-200' : 'text-slate-700')}>{f.name}</span>
                                <span className={'text-[11px] font-mono font-bold tabular-nums'} style={{ color: barColor }}>P = {f.prob}%</span>
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
                            Final combined probability: {finalProb}% {tName}
                        </span>
                    </div>
                    <div className={'text-[10px] mt-1.5 ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                        Smoothing: {smoothing.toExponential(1)} · {finalProb >= 60 ? 'High confidence' : finalProb >= 45 ? 'Moderate confidence' : 'Low confidence (high smoothing)'}
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
                        case 'knn': return <KNNViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
                        case 'svm': return <SVMViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} dataset={dataset} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
                        case 'lr': return <LRViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
                        case 'dt': return <DTViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
                        case 'rf': return <RFViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
                        case 'nb': return <NBViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
                        default: return <div className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Select a model to visualize</div>;
                    }
                })()}
            </motion.div>
        </AnimatePresence>
    );
});

export default ModelVisualizer;
