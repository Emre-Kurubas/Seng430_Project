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
const KNNViz = React.memo(({ params, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const canvasRef = useRef(null);
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
    ], []);

    const newPt = useMemo(() => [0.48, 0.52], []);

    // Distance function based on selected metric
    const distFn = useCallback((px, py, qx, qy) => {
        if (isManhattan) {
            return Math.abs(px - qx) + Math.abs(py - qy);
        }
        return Math.hypot(px - qx, py - qy);
    }, [isManhattan]);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        // Calculate distances using the selected metric and find K nearest
        const dists = pts.map(([px, py, c], i) => ({
            i, dist: distFn(px, py, newPt[0], newPt[1]), c
        }));
        dists.sort((a, b) => a.dist - b.dist);
        // Cap k to the number of available points to prevent crash
        const effectiveK = Math.min(k, pts.length);
        const neighbors = new Set(dists.slice(0, effectiveK).map(d => d.i));
        const kRadius = effectiveK > 0 ? dists[effectiveK - 1].dist : 0.1;

        // Draw K-radius boundary shape
        const cx = newPt[0] * w;
        const cy = newPt[1] * h;
        ctx.strokeStyle = 'rgba(22,163,74,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        if (isManhattan) {
            // Manhattan distance: draw a diamond (rotated square)
            // In Manhattan geometry, the "circle" of equal distance is a diamond
            const rw = kRadius * w;  // radius scaled to canvas width
            const rh = kRadius * h;  // radius scaled to canvas height
            ctx.beginPath();
            ctx.moveTo(cx, cy - rh);       // top
            ctx.lineTo(cx + rw, cy);       // right
            ctx.lineTo(cx, cy + rh);       // bottom
            ctx.lineTo(cx - rw, cy);       // left
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(22,163,74,0.05)';
            ctx.fill();
        } else {
            // Euclidean distance: draw a circle
            ctx.beginPath();
            ctx.arc(cx, cy, kRadius * Math.min(w, h), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(22,163,74,0.05)';
            ctx.fill();
        }

        // Draw connecting lines to neighbors
        pts.forEach(([px, py], i) => {
            if (neighbors.has(i)) {
                ctx.strokeStyle = 'rgba(22,163,74,0.25)';
                ctx.lineWidth = 1.5;
                if (isManhattan) {
                    // Manhattan: draw L-shaped (city-block) lines 
                    // Go horizontal first, then vertical
                    ctx.beginPath();
                    ctx.moveTo(px * w, py * h);
                    ctx.lineTo(newPt[0] * w, py * h);  // horizontal segment
                    ctx.lineTo(newPt[0] * w, newPt[1] * h);  // vertical segment
                    ctx.stroke();
                } else {
                    // Euclidean: straight line
                    ctx.beginPath();
                    ctx.moveTo(px * w, py * h);
                    ctx.lineTo(newPt[0] * w, newPt[1] * h);
                    ctx.stroke();
                }
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
        ctx.fillStyle = primaryStr;
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

        // Distance metric label
        ctx.fillStyle = primaryStr;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(isManhattan ? '◆ Manhattan Distance (city-block)' : '● Euclidean Distance (straight-line)', 10, 18);

        // Axis labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Low ${fNames[0]}`, 10, h - 10);
        ctx.fillText(`High ${fNames[0]}`, w - 65, h - 10);
    }, [k, pts, newPt, fNames, isManhattan, distFn, primaryStr]);

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

    // Count neighbor classes for the banner (uses correct distance metric)
    const neighborInfo = useMemo(() => {
        const dists = pts.map(([px, py, c], i) => ({
            i, dist: distFn(px, py, newPt[0], newPt[1]), c
        }));
        dists.sort((a, b) => a.dist - b.dist);
        const effectiveK = Math.min(k, pts.length);
        const nearest = dists.slice(0, effectiveK);
        const readmitted = nearest.filter(d => d.c === 1).length;
        const safe = effectiveK - readmitted;
        const pct = effectiveK > 0 ? Math.round((readmitted / effectiveK) * 100) : 0;
        return { readmitted, safe, pct, effectiveK };
    }, [k, pts, newPt, distFn]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                Each dot is a past patient (2D projection: {fNames[0]} vs. {fNames[1]}). The ★ is a new patient. The{' '}
                <span style={{ color: COLORS.green, fontWeight: 600 }}>{isManhattan ? 'green dashed diamond' : 'green dashed circle'}</span> shows the{' '}
                <span>{k}</span> nearest neighbors{isManhattan ? ' (Manhattan / city-block distance)' : ' (Euclidean / straight-line distance)'}.
            </p>
            <canvas ref={canvasRef} style={vizCanvasStyle} />
            <div style={legendStyle}>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.red }} /> Readmitted</div>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.green }} /> Not Readmitted</div>
                <div style={legendItemStyle}><div style={{ width: 14, height: 14, background: primaryStr, clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }} /> New Patient</div>
                <div style={legendItemStyle}><div style={{ width: 20, height: 2, background: COLORS.green, borderRadius: '999px', border: '1px dashed #fff' }} /> {isManhattan ? 'K-radius (diamond)' : 'K-radius (circle)'}</div>
            </div>
            <div style={{...bannerStyle, background: `${secondaryStr}15`, borderColor: secondaryStr, color: secondaryStr}}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b style={{color: secondaryStr}}>Clinical meaning:</b> Of the {neighborInfo.effectiveK} most similar patients (by {fNames[0].toLowerCase()} and {fNames[1].toLowerCase()}, using {isManhattan ? 'Manhattan' : 'Euclidean'} distance), {neighborInfo.readmitted} were {tName} and {neighborInfo.safe} were not. The model predicts: {neighborInfo.pct >= 50 ? tName : 'safe'} ({neighborInfo.pct}% confidence).{neighborInfo.effectiveK < k ? ` (K capped from ${k} to ${neighborInfo.effectiveK} — only ${pts.length} data points available)` : ''}</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   2. SVM — Decision Boundary & Support Vectors
   Fully interactive: C controls margin width, point scatter, and
   which points become support vectors. Kernel changes boundary shape.
═══════════════════════════════════════════════════════════════ */
const SVMViz = React.memo(({ params, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const canvasRef = useRef(null);
    const { c, kernel } = params.svm;
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    // Generate points that respond to C parameter
    const { redPts, greenPts, svRedIdx, svGreenIdx, marginScale, svCount } = useMemo(() => {
        const isLinear = kernel === 'Linear';
        // marginScale: lower C = wider margin (more permissive), higher C = narrower margin (strict)
        const ms = Math.max(0.3, 1.0 - Math.log10(Math.max(c, 0.1)) * 0.35);
        
        // Seed-based pseudo-random for deterministic positions per C value
        const seed = Math.round(c * 10);
        const seededRandom = (i) => {
            const x = Math.sin(seed * 9301 + i * 49297 + 233280) * 49297;
            return x - Math.floor(x);
        };

        // Base red points (positive class) — upper-left region
        const baseRed = [
            [0.18, 0.72], [0.22, 0.82], [0.28, 0.68], [0.14, 0.78],
            [0.32, 0.88], [0.25, 0.62], [0.38, 0.75], [0.12, 0.85]
        ];
        // Base green points (negative class) — lower-right region
        const baseGreen = [
            [0.72, 0.28], [0.78, 0.22], [0.68, 0.32], [0.82, 0.18],
            [0.88, 0.38], [0.62, 0.25], [0.75, 0.42], [0.85, 0.12]
        ];

        // With low C: some points drift toward the boundary (margin violations allowed)
        // With high C: points stay well-separated, boundary is tight
        const drift = Math.max(0, (1 - c / 5) * 0.15); // drift toward boundary for low C
        
        const rPts = baseRed.map(([x, y], i) => {
            const dx = drift * (0.5 - x) * (0.5 + seededRandom(i) * 0.5);
            const dy = drift * (0.5 - y) * (0.5 + seededRandom(i + 100) * 0.5);
            return [
                Math.max(0.05, Math.min(0.95, x + dx)),
                Math.max(0.05, Math.min(0.95, y + dy))
            ];
        });
        
        const gPts = baseGreen.map(([x, y], i) => {
            const dx = drift * (0.5 - x) * (0.5 + seededRandom(i + 200) * 0.5);
            const dy = drift * (0.5 - y) * (0.5 + seededRandom(i + 300) * 0.5);
            return [
                Math.max(0.05, Math.min(0.95, x + dx)),
                Math.max(0.05, Math.min(0.95, y + dy))
            ];
        });

        // Determine support vectors: points closest to the boundary
        // For linear: boundary is the diagonal x + y = 1
        // For RBF: boundary is an ellipse centered at (0.5, 0.5)
        const distToBoundary = (x, y) => {
            if (isLinear) {
                return Math.abs(x + y - 1) / Math.sqrt(2);
            } else {
                const dx = (x - 0.5) * Math.cos(Math.PI / 4) + (y - 0.5) * Math.sin(Math.PI / 4);
                const dy = -(x - 0.5) * Math.sin(Math.PI / 4) + (y - 0.5) * Math.cos(Math.PI / 4);
                return Math.abs(Math.sqrt((dx / 0.22) ** 2 + (dy / 0.22) ** 2) - 1) * 0.22;
            }
        };

        // More SVs with lower C (wider margin catches more), fewer with high C
        const svCountVal = Math.max(1, Math.min(4, Math.round(4 - c * 0.3)));
        
        const redDists = rPts.map(([x, y], i) => ({ i, d: distToBoundary(x, y) })).sort((a, b) => a.d - b.d);
        const greenDists = gPts.map(([x, y], i) => ({ i, d: distToBoundary(x, y) })).sort((a, b) => a.d - b.d);
        
        const svR = redDists.slice(0, svCountVal).map(d => d.i);
        const svG = greenDists.slice(0, svCountVal).map(d => d.i);

        return { redPts: rPts, greenPts: gPts, svRedIdx: svR, svGreenIdx: svG, marginScale: ms, svCount: svCountVal };
    }, [c, kernel]);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        const isLinear = kernel === 'Linear';

        // ─── Draw margin area (green tinted zone) ───
        ctx.fillStyle = 'rgba(14,158,142,0.07)';
        if (isLinear) {
            // Rotated margin band along the diagonal
            ctx.save();
            ctx.translate(w * 0.5, h * 0.5);
            ctx.rotate(-Math.PI / 4);
            const bandW = w * 0.28 * marginScale;
            ctx.fillRect(-bandW / 2, -h, bandW, h * 2);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.ellipse(w * 0.5, h * 0.5, w * 0.28 * marginScale, h * 0.28 * marginScale, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // ─── Draw dashed margin lines ───
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = COLORS.muted;
        ctx.lineWidth = 1.5;
        if (isLinear) {
            const offset = 0.14 * marginScale;
            // Upper margin line
            ctx.beginPath();
            ctx.moveTo(0, h * (1 - offset));
            ctx.lineTo(w * (1 - offset), 0);
            ctx.stroke();
            // Lower margin line
            ctx.beginPath();
            ctx.moveTo(w * offset, h);
            ctx.lineTo(w, h * offset);
            ctx.stroke();
        } else {
            // Outer margin ellipse
            ctx.beginPath();
            ctx.ellipse(w * 0.5, h * 0.5, w * (0.22 + 0.06 * marginScale), h * (0.22 + 0.06 * marginScale), Math.PI / 4, 0, Math.PI * 2);
            ctx.stroke();
            // Inner margin ellipse
            if (marginScale > 0.4) {
                ctx.beginPath();
                ctx.ellipse(w * 0.5, h * 0.5, w * Math.max(0.08, 0.22 - 0.06 * marginScale), h * Math.max(0.08, 0.22 - 0.06 * marginScale), Math.PI / 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // ─── Draw decision boundary ───
        ctx.strokeStyle = primaryStr;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isLinear) {
            // Diagonal boundary: x + y = 1 in normalized coords
            ctx.moveTo(0, h);
            ctx.lineTo(w, 0);
        } else {
            ctx.ellipse(w * 0.5, h * 0.5, w * 0.22, h * 0.22, Math.PI / 4, 0, Math.PI * 2);
        }
        ctx.stroke();

        // ─── Draw connecting lines from SVs to boundary ───
        const svRedSet = new Set(svRedIdx);
        const svGreenSet = new Set(svGreenIdx);
        
        ctx.strokeStyle = `${primaryStr}40`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        redPts.forEach(([px, py], i) => {
            if (svRedSet.has(i)) {
                // Draw line to nearest point on boundary
                if (isLinear) {
                    const nearX = (px + py) / 2;
                    const nearY = 1 - nearX;
                    ctx.beginPath();
                    ctx.moveTo(px * w, py * h);
                    ctx.lineTo(nearX * w, nearY * h);
                    ctx.stroke();
                }
            }
        });
        
        greenPts.forEach(([px, py], i) => {
            if (svGreenSet.has(i)) {
                if (isLinear) {
                    const nearX = (px + py) / 2;
                    const nearY = 1 - nearX;
                    ctx.beginPath();
                    ctx.moveTo(px * w, py * h);
                    ctx.lineTo(nearX * w, nearY * h);
                    ctx.stroke();
                }
            }
        });
        ctx.setLineDash([]);

        // ─── Draw red points (positive class) ───
        redPts.forEach(([x, y], i) => {
            const isSV = svRedSet.has(i);
            const r = isSV ? 9 : 6;
            
            // Glow around support vectors
            if (isSV) {
                ctx.beginPath();
                ctx.arc(x * w, y * h, 14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(220,38,38,0.12)';
                ctx.fill();
            }
            
            ctx.beginPath();
            ctx.arc(x * w, y * h, r, 0, Math.PI * 2);
            ctx.fillStyle = isSV ? COLORS.red : 'rgba(220,38,38,0.55)';
            ctx.fill();
            if (isSV) {
                ctx.strokeStyle = primaryStr;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        });

        // ─── Draw green points (negative class) ───
        greenPts.forEach(([x, y], i) => {
            const isSV = svGreenSet.has(i);
            const r = isSV ? 9 : 6;
            
            if (isSV) {
                ctx.beginPath();
                ctx.arc(x * w, y * h, 14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(22,163,74,0.12)';
                ctx.fill();
            }
            
            ctx.beginPath();
            ctx.arc(x * w, y * h, r, 0, Math.PI * 2);
            ctx.fillStyle = isSV ? COLORS.green : 'rgba(22,163,74,0.55)';
            ctx.fill();
            if (isSV) {
                ctx.strokeStyle = primaryStr;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        });

        // ─── Axis labels ───
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Low ${fNames[0]}`, 10, h - 10);
        ctx.textAlign = 'right';
        ctx.fillText(`High ${fNames[0]}`, w - 10, h - 10);
        ctx.textAlign = 'left';

        // ─── C value indicator ───
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = primaryStr;
        ctx.fillText(`C = ${c.toFixed(1)} · Margin: ${marginScale > 0.7 ? 'Wide' : marginScale > 0.4 ? 'Medium' : 'Narrow'}`, 10, 18);
    }, [kernel, c, fNames, redPts, greenPts, svRedIdx, svGreenIdx, marginScale, primaryStr]);

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

    // Dynamic clinical explanation
    const explanation = useMemo(() => {
        if (c < 1) return `With C=${c.toFixed(1)} (loose), the model allows some patients to fall inside the margin. This is more forgiving — it prioritises a wider safety buffer over perfect separation. ${svCount} support vectors define the boundary.`;
        if (c > 5) return `With C=${c.toFixed(1)} (strict), the model forces a very tight margin and tries to classify every patient correctly. It's more precise but might overfit to noisy data. ${svCount} edge-case patients anchor the boundary.`;
        return `With C=${c.toFixed(1)} (balanced), the model balances margin width with accuracy. ${svCount} support vectors — the hardest-to-classify patients — define exactly where the boundary sits.`;
    }, [c, svCount]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                SVM draws a strict boundary to keep different groups of patients as far apart as possible. The <b>support vectors</b> (outlined circles) are the "edge cases" sitting right on the fence. Drag the <b>C slider</b> to see how strictness changes the margin and patient positions.
            </p>
            <canvas ref={canvasRef} style={vizCanvasStyle} />
            <div style={legendStyle}>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.red }} /> {tName}</div>
                <div style={legendItemStyle}><div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.green }} /> Not {tName}</div>
                <div style={legendItemStyle}><div style={{ width: 14, height: 14, borderRadius: '50%', border: `3px solid ${primaryStr}`, background: 'transparent' }} /> Support Vector (Edge Case)</div>
                <div style={legendItemStyle}><div style={{ width: 30, height: 2, background: primaryStr, borderRadius: '2px' }} /> Decision Boundary</div>
                <div style={legendItemStyle}><div style={{ width: 30, height: 0, borderTop: `2px dashed ${COLORS.muted}` }} /> Safety Margin</div>
            </div>
            <div style={{ ...bannerStyle, background: `${secondaryStr}15`, borderColor: secondaryStr, color: secondaryStr }}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b style={{color: secondaryStr}}>Clinical meaning:</b> {explanation}</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   3. Decision Tree — Clinical Decision Flowchart (SVG)
═══════════════════════════════════════════════════════════════ */
const DTViz = React.memo(({ params, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
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
                { x: w / 2, y: 25, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: w / 4, y: 85, label: `${fNames[1]}\n> val?`, isQ: true },
                { x: 3 * w / 4, y: 85, label: `${fNames[2]}\n> val?`, isQ: true },
                { x: w / 8, y: 145, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3 * w / 8, y: 145, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: 5 * w / 8, y: 145, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7 * w / 8, y: 145, label: 'SAFE\n96%', color: COLORS.green },
                { x: w / 16, y: 205, label: `${fNames[1] || 'F4'}\n> val?`, isQ: true },
                { x: 3 * w / 16, y: 205, label: `${tName}\n88%`, color: COLORS.red },
                { x: 5 * w / 16, y: 205, label: `${fNames[2] || 'F5'}\n> val?`, isQ: true },
                { x: 7 * w / 16, y: 205, label: 'SAFE\n65%', color: COLORS.green },
                { x: w / 32, y: 265, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3 * w / 32, y: 265, label: 'READMIT\n94%', color: COLORS.red },
                { x: 9 * w / 32, y: 265, label: 'READMIT\n85%', color: COLORS.red },
                { x: 11 * w / 32, y: 265, label: 'SAFE\n71%', color: COLORS.green },
            ],
            5: [
                { x: w / 2, y: 20, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: w / 4, y: 70, label: `${fNames[1]}\n> val?`, isQ: true },
                { x: 3 * w / 4, y: 70, label: `${fNames[2]}\n> val?`, isQ: true },
                { x: w / 8, y: 120, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3 * w / 8, y: 120, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: 5 * w / 8, y: 120, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7 * w / 8, y: 120, label: 'SAFE\n96%', color: COLORS.green },
                { x: w / 16, y: 170, label: `${fNames[1] || 'F4'}\n> val?`, isQ: true },
                { x: 3 * w / 16, y: 170, label: `${tName}\n88%`, color: COLORS.red },
                { x: 5 * w / 16, y: 170, label: `${fNames[2] || 'F5'}\n> val?`, isQ: true },
                { x: 7 * w / 16, y: 170, label: 'SAFE\n65%', color: COLORS.green },
                { x: w / 32, y: 220, label: `${fNames[3] || 'F6'}\nYes?`, isQ: true },
                { x: 3 * w / 32, y: 220, label: 'READMIT\n94%', color: COLORS.red },
                { x: 5 * w / 32, y: 220, label: 'READMIT\n91%', color: COLORS.red },
                { x: 7 * w / 32, y: 220, label: 'SAFE\n68%', color: COLORS.green },
                { x: 9 * w / 32, y: 220, label: 'READMIT\n85%', color: COLORS.red },
                { x: 11 * w / 32, y: 220, label: 'SAFE\n71%', color: COLORS.green },
                { x: w / 64, y: 270, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3 * w / 64, y: 270, label: 'READMIT\n96%', color: COLORS.red },
            ],
            6: [
                { x: w / 2, y: 15, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: w / 4, y: 55, label: `${fNames[1]}\n> val?`, isQ: true },
                { x: 3 * w / 4, y: 55, label: `${fNames[2]}\n> val?`, isQ: true },
                { x: w / 8, y: 95, label: `${fNames[3]}\nYes?`, isQ: true },
                { x: 3 * w / 8, y: 95, label: `${fNames[0]}\n< val?`, isQ: true },
                { x: 5 * w / 8, y: 95, label: `${tName}\n72%`, color: COLORS.red },
                { x: 7 * w / 8, y: 95, label: 'SAFE\n96%', color: COLORS.green },
                { x: w / 16, y: 135, label: `${fNames[1] || 'F4'}\n> val?`, isQ: true },
                { x: 3 * w / 16, y: 135, label: `${tName}\n88%`, color: COLORS.red },
                { x: 5 * w / 16, y: 135, label: `${fNames[2] || 'F5'}\n> val?`, isQ: true },
                { x: 7 * w / 16, y: 135, label: 'SAFE\n65%', color: COLORS.green },
                { x: w / 32, y: 175, label: `${fNames[3] || 'F6'}\nYes?`, isQ: true },
                { x: 3 * w / 32, y: 175, label: 'READMIT\n94%', color: COLORS.red },
                { x: 5 * w / 32, y: 175, label: 'READMIT\n91%', color: COLORS.red },
                { x: 7 * w / 32, y: 175, label: 'SAFE\n68%', color: COLORS.green },
                { x: w / 64, y: 215, label: `${fNames[0] || 'F1'}\n< val?`, isQ: true },
                { x: 3 * w / 64, y: 215, label: 'READMIT\n96%', color: COLORS.red },
                { x: w / 128, y: 255, label: 'READMIT\n99%', color: COLORS.red },
                { x: 3 * w / 128, y: 255, label: 'READMIT\n98%', color: COLORS.red },
            ],
        };
        return trees[depth] || trees[3];
    }, [depth, w, fNames, tName]);

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
                                stroke={primaryStr} strokeWidth="1.5"
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
            <div style={{ ...bannerStyle, background: `${secondaryStr}15`, borderColor: secondaryStr, color: secondaryStr }}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b style={{color: secondaryStr}}>Clinical meaning:</b> With a depth of {maxDepth}, the model creates {Math.pow(2, Math.min(maxDepth, 4))} individual decision paths. The first split ({fNames[0]}) remains the most critical clinical indicator. {maxDepth > 5 ? 'A high depth might over-specialize on historical edge-cases.' : 'A balanced depth provides a generalizable clinical guideline.'}</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   4. Random Forest — Mini-Tree Voting Cards + Vote Bars
   Fixed: vote ratio now varies with tree count, display capped
   at 12 mini-trees to prevent lag, voting is seeded per-tree.
═══════════════════════════════════════════════════════════════ */
const RFViz = React.memo(({ params, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const { trees } = params.rf;
    const n = trees;
    const showTrees = Math.min(n, 12);
    const tName = targetColumn || 'Outcome';

    // Seeded pseudo-random vote per tree — changes with tree count
    const voteData = useMemo(() => {
        const seededRandom = (i) => {
            const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
            return x - Math.floor(x);
        };

        // Each tree has a "confidence" based on its random sample
        // More trees → more stable majority emerges
        // Base positive rate ~65%, individual trees deviate from this
        const baseRate = 0.65;
        let posVotes = 0;
        const treeVotes = [];
        
        for (let i = 0; i < n; i++) {
            // Each tree's vote: bias toward positive but with randomness
            // Variance decreases slightly as n grows (ensemble stabilization)
            const noise = (seededRandom(i) - 0.5) * 0.6;
            const vote = (baseRate + noise) > 0.5 ? 1 : 0;
            treeVotes.push(vote);
            if (vote === 1) posVotes++;
        }

        const negVotes = n - posVotes;
        const posPct = Math.round((posVotes / n) * 100);
        const negPct = 100 - posPct;

        // Get display trees (first 12 only)
        const displayTrees = treeVotes.slice(0, showTrees).map((vote, i) => ({
            id: i,
            vote: vote === 1 ? 'positive' : 'negative',
        }));

        return { posVotes, negVotes, posPct, negPct, displayTrees };
    }, [n, showTrees]);

    const { posVotes, negVotes, posPct, negPct, displayTrees } = voteData;

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
                <b>{n}</b> trees vote, and the majority wins.
                {n > showTrees && <span style={{ color: primaryStr }}> (Showing {showTrees} of {n} trees)</span>}
            </p>

            {/* Mini Trees */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {displayTrees.map(t => (
                    <div key={t.id} style={miniTreeStyle}>
                        <div style={{ fontSize: '24px' }}>{t.vote === 'positive' ? '🔴' : '🟢'}</div>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: COLORS.muted }}>Tree {t.id + 1}</div>
                    </div>
                ))}
            </div>

            {/* Vote Bars */}
            <div style={{ marginTop: '10px' }}>
                {/* Positive Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '100px', fontSize: '12px', color: COLORS.muted, fontWeight: 600 }}>🔴 {tName}</div>
                    <div style={{ flex: 1, height: '28px', borderRadius: '999px', background: COLORS.line, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', borderRadius: '999px',
                            display: 'flex', alignItems: 'center', padding: '0 12px',
                            fontSize: '12px', fontWeight: 700, color: '#fff',
                            background: `linear-gradient(90deg, ${COLORS.bad}, #dc2626)`,
                            width: `${posPct}%`,
                            transition: 'width 0.4s ease',
                        }}>{posVotes} trees</div>
                    </div>
                    <div style={{ width: '70px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: COLORS.muted }}>{posPct}%</div>
                </div>
                {/* Negative Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '100px', fontSize: '12px', color: COLORS.muted, fontWeight: 600 }}>🟢 Safe</div>
                    <div style={{ flex: 1, height: '28px', borderRadius: '999px', background: COLORS.line, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', borderRadius: '999px',
                            display: 'flex', alignItems: 'center', padding: '0 12px',
                            fontSize: '12px', fontWeight: 700, color: '#fff',
                            background: `linear-gradient(90deg, ${COLORS.good}, #22c55e)`,
                            width: `${negPct}%`,
                            transition: 'width 0.4s ease',
                        }}>{negVotes} trees</div>
                    </div>
                    <div style={{ width: '70px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: COLORS.muted }}>{negPct}%</div>
                </div>
            </div>

            <div style={{ ...bannerStyle, background: `${secondaryStr}15`, borderColor: secondaryStr, color: secondaryStr }}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b style={{color: secondaryStr}}>Clinical meaning:</b> {posVotes} out of {n} trees predict {tName.toLowerCase()}. Final prediction: {posPct >= 50 ? tName.toUpperCase() : 'SAFE'} ({Math.max(posPct, negPct)}% confidence). This is like getting {n} second opinions — more stable than a single tree.</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   5. Logistic Regression — S-Curve (Canvas)
   Fixed: sigmoid midpoint offset from patient position so
   probability varies meaningfully with C parameter.
═══════════════════════════════════════════════════════════════ */
const LRViz = React.memo(({ params, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const canvasRef = useRef(null);
    const { c } = params.lr;
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';

    // Compute patient probability outside draw so we can use it in JSX
    const patientEF = 38;
    const xMin = 14;
    const xMax = 80;
    // Sigmoid midpoint at 52 — patient at 38 is well into the high-risk zone
    const x0 = 52;
    const k = c * 0.2;
    const sigmoid = useCallback((ef) => 1 / (1 + Math.exp(-k * (x0 - ef))), [k]);
    const patientProb = sigmoid(patientEF);
    const patientPct = Math.round(patientProb * 100);

    const draw = useCallback(() => {
        const result = setupCanvas(canvasRef.current);
        if (!result) return;
        const { ctx, w, h } = result;

        const margin = 50;
        const plotW = w - margin * 2;
        const plotH = h - margin * 2;

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
        const xMid = Math.round((xMin + xMax) / 2);
        ctx.fillText(String(xMin), margin, h - margin + 20);
        ctx.fillText(String(xMid), margin + plotW / 2, h - margin + 20);
        ctx.fillText(String(xMax), w - margin, h - margin + 20);
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
        ctx.strokeStyle = primaryStr;
        ctx.lineWidth = 3;
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

        // Draw current patient point
        const pProb = sigmoid(patientEF);
        const px = margin + ((patientEF - xMin) / (xMax - xMin)) * plotW;
        const py = margin + plotH * (1 - pProb);
        const pPct = Math.round(pProb * 100);

        // Glow around patient dot
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,38,38,0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.red;
        ctx.fill();
        ctx.strokeStyle = COLORS.redDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dashed line from patient dot to axes for clarity
        ctx.strokeStyle = 'rgba(220,38,38,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        // Vertical line down to x-axis
        ctx.beginPath();
        ctx.moveTo(px, py + 10);
        ctx.lineTo(px, h - margin);
        ctx.stroke();
        // Horizontal line left to y-axis
        ctx.beginPath();
        ctx.moveTo(px - 10, py);
        ctx.lineTo(margin, py);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label — position dynamically to avoid clipping
        ctx.fillStyle = primaryStr;
        ctx.font = 'bold 11px Inter, sans-serif';
        const labelText = `${fNames[0]}=${patientEF} → ${pPct}% risk`;
        const labelWidth = ctx.measureText(labelText).width;
        // If the dot is in the right half, place the label to the left
        if (px + 15 + labelWidth > w - margin) {
            ctx.textAlign = 'right';
            ctx.fillText(labelText, px - 15, py - 10);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(labelText, px + 15, py - 10);
        }
    }, [c, sigmoid, fNames, tName, primaryStr, patientEF]);

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

    // Dynamic clinical explanation based on actual probability
    const clinicalExplanation = useMemo(() => {
        if (patientPct >= 75) {
            return `Patient with ${fNames[0]}=${patientEF} is in the high-risk zone (${patientPct}% probability). With C=${c.toFixed(2)}, the steep curve means small changes in ${fNames[0]} cause large swings in risk — this is a critical intervention point.`;
        }
        if (patientPct >= 55) {
            return `Patient with ${fNames[0]}=${patientEF} sits on the steep part of the curve (${patientPct}% risk). At C=${c.toFixed(2)}, the model is moderately confident — further investigation is warranted.`;
        }
        return `Patient with ${fNames[0]}=${patientEF} shows moderate risk (${patientPct}%). With low regularisation (C=${c.toFixed(2)}), the flatter curve reflects a more conservative, generalised prediction.`;
    }, [patientPct, fNames, c, patientEF]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                This curve shows how {tName} probability changes as {fNames[0]} changes. The red dot shows your patient&apos;s position on the curve. Adjust <b>C</b> to see how regularisation changes the curve steepness and risk estimate.
            </p>
            <canvas ref={canvasRef} style={{ ...vizCanvasStyle, height: '260px' }} />
            <div style={{ ...bannerStyle, background: `${secondaryStr}15`, borderColor: secondaryStr, color: secondaryStr }}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b style={{color: secondaryStr}}>Clinical meaning:</b> {clinicalExplanation}</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   6. Naive Bayes — Feature Probability Bars (HTML)
   Fixed: probabilities now respond to the smoothing parameter.
   Higher smoothing → flatter/more uniform probabilities.
   Lower smoothing → sharper/more confident individual priors.
═══════════════════════════════════════════════════════════════ */
const NBViz = React.memo(({ params, datasetSchema, targetColumn, primaryStr, secondaryStr }) => {
    const fNames = getFeatureNames(datasetSchema);
    const tName = targetColumn || 'Outcome';
    const smoothing = params.nb.smoothing;

    // Smoothing effect: higher smoothing pulls probabilities toward 50% (less confident)
    // Lower smoothing allows sharper, more extreme probability estimates
    const features = useMemo(() => {
        // Log scale factor: smoothing ranges from 1e-12 to 1e-5
        // Map to a 0-1 scale where 0=sharp, 1=flat
        const logSmooth = Math.log10(smoothing);
        // logSmooth ranges from -12 to -5 → map to 0..1
        const flatFactor = Math.max(0, Math.min(1, (logSmooth + 12) / 7));

        // Base probabilities (without smoothing) — these are the "raw" Bayesian estimates
        const baseFeatures = [
            { name: fNames[0], rawProb: 82, rawImpact: 48, direction: 'increase' },
            { name: fNames[1], rawProb: 61, rawImpact: 24, direction: 'increase' },
            { name: fNames[2], rawProb: 38, rawImpact: 5,  direction: 'increase' },
            { name: fNames[3], rawProb: 22, rawImpact: 11, direction: 'decrease' },
        ];

        return baseFeatures.map(f => {
            // Smoothing pulls probability toward 50%
            const prob = Math.round(f.rawProb + (50 - f.rawProb) * flatFactor);
            // Smoothing reduces impact magnitude
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

    // Final combined probability
    const finalProb = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        const flatFactor = Math.max(0, Math.min(1, (logSmooth + 12) / 7));
        // Base combined probability starts at 72%, smoothing pulls toward 50%
        return Math.round(72 + (50 - 72) * flatFactor);
    }, [smoothing]);

    const probItemStyle = {
        border: `1px solid ${COLORS.line}`,
        borderRadius: '12px',
        padding: '12px',
        background: COLORS.white,
    };

    // Dynamic explanation based on smoothing level
    const explanation = useMemo(() => {
        const logSmooth = Math.log10(smoothing);
        if (logSmooth <= -10) {
            return `With minimal smoothing (${smoothing.toExponential(0)}), the model uses raw frequency counts — it's very confident but may overreact to rare combinations in the training data. Each feature's independent probability is sharp and decisive.`;
        }
        if (logSmooth <= -7) {
            return `With moderate smoothing (${smoothing.toExponential(0)}), the model balances raw evidence with a safety margin. This prevents zero-probability issues without losing too much discriminative power.`;
        }
        return `With high smoothing (${smoothing.toExponential(0)}), all probabilities are pulled toward 50% (maximum uncertainty). The model is very cautious — it won't make strong claims even with clear evidence. Good for avoiding false alarms, but may miss real patterns.`;
    }, [smoothing]);

    return (
        <div>
            <p style={{ fontSize: '12px', color: COLORS.muted, marginBottom: '10px' }}>
                Starting from the base rate, each measurement either increases (red) or decreases (green) the {tName} probability independently. Adjust <b>Variance Smoothing</b> to see how it affects confidence.
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
                    background: `${primaryStr}15`,
                    borderRadius: '12px',
                    border: `1px solid ${primaryStr}`,
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: primaryStr }}>
                        Final combined probability: {finalProb}% {tName}
                    </div>
                    <div style={{ fontSize: '10px', color: COLORS.muted, marginTop: '4px' }}>
                        Smoothing: {smoothing.toExponential(1)} · {finalProb >= 60 ? 'High confidence prediction' : finalProb >= 45 ? 'Moderate confidence' : 'Low confidence (high smoothing)'}
                    </div>
                </div>
            </div>

            <div style={{ ...bannerStyle, background: `${secondaryStr}15`, borderColor: secondaryStr, color: secondaryStr }}>
                <span style={{ fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>✅</span>
                <div><b style={{color: secondaryStr}}>Clinical meaning:</b> {explanation}</div>
            </div>
        </div>
    );
});


/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — Model Visualizer Switch
═══════════════════════════════════════════════════════════════ */
const ModelVisualizer = React.memo(({ selectedModel, params, isDarkMode, datasetSchema, targetColumn, domain }) => {
    const primaryStr = domain?.theme?.primary || COLORS.teal;
    const secondaryStr = domain?.theme?.secondary || COLORS.info;

    switch (selectedModel) {
        case 'knn': return <KNNViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
        case 'svm': return <SVMViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
        case 'lr': return <LRViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
        case 'dt': return <DTViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
        case 'rf': return <RFViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
        case 'nb': return <NBViz params={params} isDarkMode={isDarkMode} datasetSchema={datasetSchema} targetColumn={targetColumn} primaryStr={primaryStr} secondaryStr={secondaryStr} />;
        default: return <div style={{ color: COLORS.muted }}>Select a model to visualize</div>;
    }
});

export default ModelVisualizer;
