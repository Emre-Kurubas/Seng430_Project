import React, { useRef, useEffect, useMemo, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   MODEL VISUALIZATIONS — matching the sample HTML design
   Each model has its own visualizer component that renders
   canvas-based or HTML-based visualizations.
═══════════════════════════════════════════════════════════════ */

// ─── Color Palette (matching sample HTML) ─────────────────────
const COLORS = {
    red: '#dc2626',
    redDark: '#991b1b',
    green: '#16a34a',
    greenDark: '#166534',
    navy: '#0D2340',
    teal: '#0E9E8E',
    blue: '#1A6B9A',
    muted: '#7A92A3',
    line: '#DDE4EA',
    line2: '#C8D4DC',
    white: '#FFFFFF',
    offwhite: '#F0F7FB',
    mint: '#E6F7F5',
    good: '#0D7A50',
    goodBg: '#E8F7F0',
    bad: '#991B1B',
    badBg: '#FEF0F0',
    info: '#1A6B9A',
    infoBg: '#E8F4FA',
};

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

// ─── Shared Styles ────────────────────────────────────────────
const vizCanvasStyle = {
    width: '100%',
    height: '280px',
    borderRadius: '14px',
    border: '1px solid #DDE4EA',
    background: '#F0F7FB',
    cursor: 'crosshair',
    display: 'block',
};

const legendStyle = {
    display: 'flex',
    gap: '14px',
    marginTop: '10px',
    flexWrap: 'wrap',
};

const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: COLORS.muted,
};

const bannerStyle = {
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '13px',
    lineHeight: '1.5',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    marginTop: '12px',
    background: COLORS.goodBg,
    border: `1px solid ${COLORS.good}`,
    color: COLORS.good,
};


const getFeatureNames = (schema) => {
    if (!schema) return ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'];
    const nums = schema.filter(c => c.role === 'Number (measurement)' || c.role === 'Category').map(c => c.name);
    while (nums.length < 4) nums.push(`Unknown Feature ${nums.length+1}`);
    return nums;
};

/* ═══════════════════════════════════════════════════════════════
   1. KNN — Scatter Plot with K-Radius
═══════════════════════════════════════════════════════════════ */
const KNNViz = React.memo(({ params, datasetSchema, targetColumn }) => {
    const canvasRef = useRef(null);
    const k = params.knn.k;
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    const pts = useMemo(() => [
        [0.2, 0.3, 0], [0.25, 0.55, 0], [0.15, 0.65, 1], [0.3, 0.75, 1], [0.4, 0.4, 0],
        [0.5, 0.25, 0], [0.45, 0.6, 1], [0.55, 0.7, 1], [0.65, 0.45, 0], [0.7, 0.6, 1],
        [0.75, 0.3, 0], [0.8, 0.65, 1], [0.35, 0.2, 0], [0.6, 0.8, 1], [0.85, 0.4, 0],
        [0.1, 0.45, 1], [0.9, 0.7, 1], [0.6, 0.15, 0], [0.28, 0.42, 0], [0.52, 0.48, 1],
    ], []);

    const newPt = useMemo(() => [0.48, 0.52], []);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        // Calculate distances and find K nearest
        const dists = pts.map(([px, py, c], i) => ({
            i, dist: Math.hypot(px - newPt[0], py - newPt[1]), c
        }));
        dists.sort((a, b) => a.dist - b.dist);
        const neighbors = new Set(dists.slice(0, k).map(d => d.i));
        const kRadius = dists[k - 1].dist;

        // Draw K-radius circle
        ctx.beginPath();
        ctx.arc(newPt[0] * w, newPt[1] * h, kRadius * Math.min(w, h), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(22,163,74,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(22,163,74,0.05)';
        ctx.fill();

        // Draw connecting lines to neighbors
        pts.forEach(([px, py], i) => {
            if (neighbors.has(i)) {
                ctx.beginPath();
                ctx.moveTo(px * w, py * h);
                ctx.lineTo(newPt[0] * w, newPt[1] * h);
                ctx.strokeStyle = 'rgba(22,163,74,0.25)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        });

        // Draw points
        pts.forEach(([px, py, c], i) => {
            ctx.beginPath();
            ctx.arc(px * w, py * h, neighbors.has(i) ? 7 : 5, 0, Math.PI * 2);
            ctx.fillStyle = c === 1
                ? (neighbors.has(i) ? COLORS.red : 'rgba(220,38,38,0.4)')
                : (neighbors.has(i) ? COLORS.green : 'rgba(22,163,74,0.4)');
            ctx.fill();
            if (neighbors.has(i)) {
                ctx.strokeStyle = c === 1 ? COLORS.redDark : COLORS.greenDark;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw new patient star
        const sx = newPt[0] * w, sy = newPt[1] * h, sr = 11;
        ctx.fillStyle = COLORS.navy;
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

        // Axis labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Low ${fNames[0]}`, 10, h - 10);
        ctx.fillText(`High ${fNames[0]}`, w - 65, h - 10);
    }, [k, pts, newPt, fNames]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(draw, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [draw]);

    // Count neighbor classes for the banner
    const neighborInfo = useMemo(() => {
        const dists = pts.map(([px, py, c], i) => ({
            i, dist: Math.hypot(px - newPt[0], py - newPt[1]), c
        }));
        dists.sort((a, b) => a.dist - b.dist);
        const nearest = dists.slice(0, k);
        const readmitted = nearest.filter(d => d.c === 1).length;
        const safe = k - readmitted;
        const pct = Math.round((readmitted / k) * 100);
        return { readmitted, safe, pct };
    }, [k, pts, newPt]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                Each dot is a past patient (2D projection: {fNames[0]} vs. {fNames[1]}). The ★ is a new patient. The{' '}
                <span style={{ color: COLORS.teal, fontWeight: 600 }}>green circle</span> shows the{' '}
                <span>{k}</span> nearest neighbors.
            </p>
            <canvas ref={canvasRef} style={vizCanvasStyle} />
            <div style={legendStyle}>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.red }} /> Readmitted</div>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.green }} /> Not Readmitted</div>
                <div style={legendItemStyle}><div style={{ width: 14, height: 14, background: COLORS.navy, clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }} /> New Patient</div>
                <div style={legendItemStyle}><div style={{ width: 20, height: 2, background: COLORS.teal, borderRadius: '999px' }} /> K-radius</div>
            </div>
            <div style={bannerStyle}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b>Clinical meaning:</b> Of the {k} most similar patients (by {fNames[0].toLowerCase()} and {fNames[1].toLowerCase()}), {neighborInfo.readmitted} were {tName} and {neighborInfo.safe} were not. The model predicts: {neighborInfo.pct >= 50 ? tName : 'safe'} ({neighborInfo.pct}% confidence).</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   2. SVM — Decision Boundary & Support Vectors
═══════════════════════════════════════════════════════════════ */
const SVMViz = React.memo(({ params, datasetSchema, targetColumn }) => {
    const canvasRef = useRef(null);
    const { c, kernel } = params.svm;
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        const isLinear = kernel === 'Linear';

        // Synthetic data
        const redPts = [[0.2, 0.7], [0.25, 0.75], [0.3, 0.8], [0.15, 0.65], [0.35, 0.85], [0.28, 0.72]];
        const greenPts = [[0.7, 0.3], [0.75, 0.25], [0.8, 0.35], [0.65, 0.2], [0.85, 0.4], [0.72, 0.28]];
        const svRed = [0, 3];
        const svGreen = [1, 3];

        // Margin strictness scale: lower C = wider margin, higher C = narrower margin.
        // Base value assumes C around 1.0 (log10(1) = 0 => scale 1.0)
        const marginScale = 1.0 - Math.log10(Math.max(c, 0.1)) * 0.4;

        // Draw margin area
        ctx.fillStyle = 'rgba(14,158,142,0.08)';
        if (isLinear) {
            const marginW = w * 0.25 * marginScale;
            // center is at 0.35 + 0.125 = 0.475
            ctx.fillRect(w * 0.475 - marginW / 2, 0, marginW, h);
        } else {
            ctx.beginPath();
            ctx.ellipse(w * 0.5, h * 0.5, w * 0.28 * marginScale, h * 0.28 * marginScale, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw dashed margin lines
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = COLORS.muted;
        ctx.lineWidth = 1.5;
        if (isLinear) {
            const marginLineW = w * 0.20 * marginScale;
            // center is at 0.48
            ctx.beginPath(); ctx.moveTo(w * 0.48 - marginLineW / 2, 0); ctx.lineTo(w * 0.48 - marginLineW / 2, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w * 0.48 + marginLineW / 2, 0); ctx.lineTo(w * 0.48 + marginLineW / 2, h); ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw decision boundary
        ctx.strokeStyle = COLORS.navy;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isLinear) {
            ctx.moveTo(w * 0.48, 0);
            ctx.lineTo(w * 0.48, h);
        } else {
            ctx.ellipse(w * 0.5, h * 0.5, w * 0.22, h * 0.22, Math.PI / 4, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Draw red points
        redPts.forEach(([x, y], i) => {
            ctx.beginPath();
            ctx.arc(x * w, y * h, svRed.includes(i) ? 8 : 6, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.red;
            ctx.fill();
            if (svRed.includes(i)) {
                ctx.strokeStyle = COLORS.navy;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        });

        // Draw green points
        greenPts.forEach(([x, y], i) => {
            ctx.beginPath();
            ctx.arc(x * w, y * h, svGreen.includes(i) ? 8 : 6, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.green;
            ctx.fill();
            if (svGreen.includes(i)) {
                ctx.strokeStyle = COLORS.navy;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        });

        // Labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Low ${fNames[0]}`, 10, h - 10);
        ctx.fillText(`High ${fNames[0]}`, w - 65, h - 10);
    }, [kernel, c, fNames]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(draw, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [draw]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                SVM draws a strict boundary to keep different groups of patients as far apart as possible. The <b>support vectors</b> (outlined circles) are the "edge cases" sitting right on the fence.
            </p>
            <canvas ref={canvasRef} style={vizCanvasStyle} />
            <div style={legendStyle}>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.red }} /> Readmitted</div>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.green }} /> Not Readmitted</div>
                <div style={legendItemStyle}><div style={{ width: 14, height: 14, borderRadius: '50%', border: `3px solid ${COLORS.navy}`, background: 'transparent' }} /> Support Vector (Edge Case)</div>
                <div style={legendItemStyle}><div style={{ width: 30, height: 2, background: COLORS.navy, borderRadius: '2px' }} /> Decision Boundary</div>
                <div style={legendItemStyle}><div style={{ width: 30, height: 0, borderTop: `2px dashed ${COLORS.muted}` }} /> Safety Margin</div>
            </div>
            <div style={bannerStyle}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b>Clinical meaning:</b> The thick line separates low-risk from high-risk patients. Rather than memorizing every patient, SVM only cares about the trickiest patients (support vectors) who define exactly where the safe zone ends.</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   3. Decision Tree — Clinical Decision Flowchart (SVG)
═══════════════════════════════════════════════════════════════ */
const DTViz = React.memo(({ params, datasetSchema, targetColumn }) => {
    const { maxDepth } = params.dt;
    const svgRef = useRef(null);
    const [dims, setDims] = React.useState({ w: 800, h: 320 });
    const fNames = getFeatureNames(datasetSchema);
    const tName = (targetColumn || 'Risk').substring(0, 7).toUpperCase();

    useEffect(() => {
        const updateDims = () => {
            if (svgRef.current) {
                const rect = svgRef.current.getBoundingClientRect();
                setDims({ w: rect.width || 800, h: rect.height || 320 });
            }
        };
        updateDims();
        let timeoutId = null;
        const handleResize = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(updateDims, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    const w = dims.w;
    const h = dims.h;
    const depth = Math.min(maxDepth, 5);

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
                { x: w / 2, y: 25, label: 'EF < 38%?', isQ: true },
                { x: w / 4, y: 85, label: 'Age > 65?', isQ: true },
                { x: 3 * w / 4, y: 85, label: 'Creatinine > 1.5?', isQ: true },
                { x: w / 8, y: 145, label: 'Smoker?', isQ: true },
                { x: 3 * w / 8, y: 145, label: 'Sodium < 135?', isQ: true },
                { x: 5 * w / 8, y: 145, label: 'READMIT\n72%', color: COLORS.red },
                { x: 7 * w / 8, y: 145, label: 'SAFE\n96%', color: COLORS.green },
                { x: w / 16, y: 205, label: 'BP > 140?', isQ: true },
                { x: 3 * w / 16, y: 205, label: 'READMIT\n88%', color: COLORS.red },
                { x: 5 * w / 16, y: 205, label: 'Time > 4d?', isQ: true },
                { x: 7 * w / 16, y: 205, label: 'SAFE\n65%', color: COLORS.green },
                { x: w / 32, y: 265, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3 * w / 32, y: 265, label: 'READMIT\n94%', color: COLORS.red },
                { x: 9 * w / 32, y: 265, label: 'READMIT\n85%', color: COLORS.red },
                { x: 11 * w / 32, y: 265, label: 'SAFE\n71%', color: COLORS.green },
            ],
            5: [
                { x: w / 2, y: 20, label: 'EF < 38%?', isQ: true },
                { x: w / 4, y: 70, label: 'Age > 65?', isQ: true },
                { x: 3 * w / 4, y: 70, label: 'Creatinine > 1.5?', isQ: true },
                { x: w / 8, y: 120, label: 'Smoker?', isQ: true },
                { x: 3 * w / 8, y: 120, label: 'Sodium < 135?', isQ: true },
                { x: 5 * w / 8, y: 120, label: 'READMIT\n72%', color: COLORS.red },
                { x: 7 * w / 8, y: 120, label: 'SAFE\n96%', color: COLORS.green },
                { x: w / 16, y: 170, label: 'BP > 140?', isQ: true },
                { x: 3 * w / 16, y: 170, label: 'Diabetes?', isQ: true },
                { x: 5 * w / 16, y: 170, label: 'Time > 4d?', isQ: true },
                { x: 7 * w / 16, y: 170, label: 'SAFE\n65%', color: COLORS.green },
                { x: w / 32, y: 220, label: 'Anemia?', isQ: true },
                { x: 3 * w / 32, y: 220, label: 'READMIT\n94%', color: COLORS.red },
                { x: 5 * w / 32, y: 220, label: 'READMIT\n91%', color: COLORS.red },
                { x: 7 * w / 32, y: 220, label: 'SAFE\n68%', color: COLORS.green },
                { x: 9 * w / 32, y: 220, label: 'READMIT\n85%', color: COLORS.red },
                { x: 11 * w / 32, y: 220, label: 'SAFE\n71%', color: COLORS.green },
                { x: w / 64, y: 270, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3 * w / 64, y: 270, label: 'READMIT\n96%', color: COLORS.red },
            ],
        };
        return trees[depth] || trees[3];
    }, [depth, w]);

    const svgStyle = {
        width: '100%',
        height: '320px',
        borderRadius: '14px',
        border: '1px solid #DDE4EA',
        background: '#F0F7FB',
        display: 'block',
    };

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                The tree asks yes/no questions about patient measurements. Follow the path from top to bottom to reach a final decision. Hover over nodes to see details.
            </p>
            <svg ref={svgRef} style={svgStyle} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
                {/* Edges */}
                {treeData.map((node, i) => {
                    const leftChild = 2 * i + 1;
                    const rightChild = 2 * i + 2;
                    return (
                        <g key={`edges-${i}`}>
                            {leftChild < treeData.length && (
                                <line
                                    x1={node.x} y1={node.y + 18}
                                    x2={treeData[leftChild].x} y2={treeData[leftChild].y - 18}
                                    stroke={COLORS.muted} strokeWidth="1.5" fill="none"
                                />
                            )}
                            {rightChild < treeData.length && (
                                <line
                                    x1={node.x} y1={node.y + 18}
                                    x2={treeData[rightChild].x} y2={treeData[rightChild].y - 18}
                                    stroke={COLORS.muted} strokeWidth="1.5" fill="none"
                                />
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
                                width={100} height={36} rx={8}
                                fill={n.color || COLORS.white}
                                stroke={COLORS.navy} strokeWidth="1.5"
                            />
                            <text
                                x={n.x} y={lines.length > 1 ? n.y - 2 : n.y + 5}
                                textAnchor="middle" dominantBaseline="middle"
                                fill={n.color ? '#fff' : '#0D1B2A'}
                                style={{ fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                            >
                                {lines[0]}
                            </text>
                            {lines.length > 1 && (
                                <text
                                    x={n.x} y={n.y + 12}
                                    textAnchor="middle"
                                    fill={n.color ? 'rgba(255,255,255,0.8)' : COLORS.muted}
                                    style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }}
                                >
                                    {lines[1]}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div style={bannerStyle}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b>Clinical meaning:</b> This looks like a clinical guideline flowchart. The first question ({fNames[0]}) is the most important split — the model identified this as the strongest predictor.</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   4. Random Forest — Mini-Tree Voting Cards + Vote Bars
═══════════════════════════════════════════════════════════════ */
const RFViz = React.memo(({ params, datasetSchema, targetColumn }) => {
    const { trees } = params.rf;
    const n = trees;
    const showTrees = Math.min(n, 12);
    const tName = targetColumn || 'Outcome';

    const readmitVotes = Math.round(n * 0.68);
    const safeVotes = n - readmitVotes;
    const readmitPct = Math.round((readmitVotes / n) * 100);
    const safePct = 100 - readmitPct;

    const miniTrees = useMemo(() => {
        return Array.from({ length: showTrees }, (_, i) => ({
            id: i,
            vote: i < Math.round(showTrees * 0.68) ? tName : 'safe',
        }));
    }, [showTrees]);

    const miniTreeStyle = {
        width: '60px',
        height: '80px',
        borderRadius: '10px',
        border: `1px solid ${COLORS.line}`,
        background: COLORS.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        flex: '0 0 auto',
    };

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                Each mini-tree represents one decision tree trained on a random sample of patients. All{' '}
                <span>{n}</span> trees vote, and the majority wins.
            </p>

            {/* Mini Trees */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {miniTrees.map(t => (
                    <div key={t.id} style={miniTreeStyle}>
                        <div style={{ fontSize: '24px' }}>{t.vote === 'readmit' ? '🔴' : '🟢'}</div>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: COLORS.muted }}>Tree {t.id + 1}</div>
                    </div>
                ))}
            </div>

            {/* Vote Bars */}
            <div style={{ marginTop: '10px' }}>
                {/* Readmit Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '100px', fontSize: '12px', color: COLORS.muted, fontWeight: 600 }}>🔴 {tName}</div>
                    <div style={{ flex: 1, height: '28px', borderRadius: '999px', background: COLORS.line, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', borderRadius: '999px',
                            display: 'flex', alignItems: 'center', padding: '0 12px',
                            fontSize: '12px', fontWeight: 700, color: '#fff',
                            background: `linear-gradient(90deg, ${COLORS.bad}, #dc2626)`,
                            width: `${readmitPct}%`,
                            transition: 'width 0.4s ease',
                        }}>{readmitVotes} trees</div>
                    </div>
                    <div style={{ width: '70px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: COLORS.muted }}>{readmitPct}%</div>
                </div>
                {/* Safe Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '100px', fontSize: '12px', color: COLORS.muted, fontWeight: 600 }}>🟢 Safe</div>
                    <div style={{ flex: 1, height: '28px', borderRadius: '999px', background: COLORS.line, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', borderRadius: '999px',
                            display: 'flex', alignItems: 'center', padding: '0 12px',
                            fontSize: '12px', fontWeight: 700, color: '#fff',
                            background: `linear-gradient(90deg, ${COLORS.good}, #22c55e)`,
                            width: `${safePct}%`,
                            transition: 'width 0.4s ease',
                        }}>{safeVotes} trees</div>
                    </div>
                    <div style={{ width: '70px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: COLORS.muted }}>{safePct}%</div>
                </div>
            </div>

            <div style={bannerStyle}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b>Clinical meaning:</b> {readmitVotes} out of {n} trees predict {tName.toLowerCase()}. Final prediction: {tName.toUpperCase()} ({readmitPct}% confidence). This is like getting {n} second opinions — more stable than a single tree.</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   5. Logistic Regression — S-Curve (Canvas)
═══════════════════════════════════════════════════════════════ */
const LRViz = React.memo(({ params, datasetSchema, targetColumn }) => {
    const canvasRef = useRef(null);
    const { c } = params.lr;
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        const margin = 50;
        const plotW = w - margin * 2;
        const plotH = h - margin * 2;

        // Sigmoid function
        const k = c * 0.15;
        const x0 = 38;
        const sigmoid = (ef) => 1 / (1 + Math.exp(-k * (x0 - ef)));

        // Draw axes
        ctx.strokeStyle = COLORS.line2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, h - margin);
        ctx.lineTo(w - margin, h - margin);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('100%', margin - 8, margin + 5);
        ctx.fillText('50%', margin - 8, margin + plotH / 2 + 5);
        ctx.fillText('0%', margin - 8, h - margin + 5);

        // X-axis labels
        ctx.textAlign = 'center';
        ctx.fillText('14', margin, h - margin + 20);
        ctx.fillText('38', margin + plotW / 2, h - margin + 20);
        ctx.fillText('80', w - margin, h - margin + 20);
        ctx.fillText(`${fNames[0]}`, w / 2, h - 10);

        // Y-axis label
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`P(${tName})`, 0, 0);
        ctx.restore();

        // Draw 50% threshold line
        ctx.strokeStyle = 'rgba(122,146,163,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin, margin + plotH / 2);
        ctx.lineTo(w - margin, margin + plotH / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw S-curve
        ctx.strokeStyle = COLORS.navy;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const ef = 14 + (80 - 14) * (i / 100);
            const prob = sigmoid(ef);
            const x = margin + (i / 100) * plotW;
            const y = margin + plotH * (1 - prob);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw current patient point (EF=38%)
        const patientEF = 38;
        const patientProb = sigmoid(patientEF);
        const px = margin + ((patientEF - 14) / (80 - 14)) * plotW;
        const py = margin + plotH * (1 - patientProb);

        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.red;
        ctx.fill();
        ctx.strokeStyle = COLORS.redDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = COLORS.navy;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${fNames[0]}=${patientEF} → ${(patientProb * 100).toFixed(0)}% risk`, px + 15, py - 5);
    }, [c]);

    useEffect(() => {
        draw();
        let timeoutId = null;
        const handleResize = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(draw, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [draw]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                This curve shows how {tName} probability changes as {fNames[0]} drops. The red dot shows your patient&apos;s position on the curve.
            </p>
            <canvas ref={canvasRef} style={{ ...vizCanvasStyle, height: '260px' }} />
            <div style={bannerStyle}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b>Clinical meaning:</b> Patient with {fNames[0]}=38 sits at the steep part of the curve — small changes in this value cause large swings in risk. This is the &quot;tipping point&quot; where intervention matters most.</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   6. Naive Bayes — Feature Probability Bars (HTML)
═══════════════════════════════════════════════════════════════ */
const NBViz = React.memo(({ params, datasetSchema, targetColumn }) => {
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';
    
    const features = [
        { name: `${fNames[0]} = 20 (very low)`, prob: 78, impact: 'INCREASES risk by +45%', direction: 'increase' },
        { name: `${fNames[1]} = 71 (high)`, prob: 54, impact: 'INCREASES risk by +21%', direction: 'increase' },
        { name: `${fNames[2]} = 1.3 (normal)`, prob: 35, impact: 'Slight increase by +2%', direction: 'increase' },
        { name: `${fNames[3]} (lower)`, prob: 28, impact: 'DECREASES risk by -5%', direction: 'decrease' },
    ];

    const probItemStyle = {
        border: `1px solid ${COLORS.line}`,
        borderRadius: '12px',
        padding: '12px',
        background: COLORS.white,
    };

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                Starting from the base rate (33% {tName}), each measurement either increases (red) or decreases (green) the probability independently.
            </p>

            <div style={{ display: 'grid', gap: '12px' }}>
                {features.map(f => (
                    <div key={f.name} style={probItemStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D1B2A' }}>{f.name}</span>
                            <span style={{ fontSize: '11px', color: COLORS.muted }}>P = {f.prob}%</span>
                        </div>
                        <div style={{ height: '10px', background: COLORS.line, borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                borderRadius: '999px',
                                width: `${f.prob}%`,
                                background: f.direction === 'increase'
                                    ? `linear-gradient(90deg, ${COLORS.bad}, #ef4444)`
                                    : `linear-gradient(90deg, ${COLORS.good}, #16a34a)`,
                                transition: 'width 0.3s',
                            }} />
                        </div>
                        <div style={{ fontSize: '10px', color: COLORS.muted, marginTop: '4px' }}>{f.impact}</div>
                    </div>
                ))}

                {/* Final probability */}
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: COLORS.mint,
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.teal}`,
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.info }}>
                        Final combined probability: 68% {tName}
                    </div>
                </div>
            </div>

            <div style={bannerStyle}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b>Clinical meaning:</b> The model treats each measurement independently (&apos;naïve&apos; assumption). In reality, age and kidney function are related, but this simple approach often works well in practice.</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — Model Visualizer Switch
═══════════════════════════════════════════════════════════════ */
const ModelVisualizer = React.memo(({ selectedModel, params, isDarkMode, datasetSchema, targetColumn }) => {
    switch (selectedModel) {
        case 'knn': return <KNNViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} />;
        case 'svm': return <SVMViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} />;
        case 'lr': return <LRViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} />;
        case 'dt': return <DTViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} />;
        case 'rf': return <RFViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} />;
        case 'nb': return <NBViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} />;
        default: return <div style={{ color: COLORS.muted }}>Select a model to visualize</div>;
    }
});

export default ModelVisualizer;
