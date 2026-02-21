import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Functions ---
const generatePoints = (count, seed) => {
    // Sudo-random generator for consistent layouts
    let s = seed;
    const random = () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: random() * 320 + 40,
        y: random() * 220 + 40,
        isPositive: random() > 0.5
    }));
};

// --- Model specific visualizers ---

// 1. K-Nearest Neighbors (KNN)
const KNNViz = ({ params, isDarkMode }) => {
    const { k, metric } = params.knn;
    const center = { x: 200, y: 150 };

    // Generate seeded patients
    const points = useMemo(() => {
        let pts = generatePoints(40, 123);
        // Calculate distances from center
        pts.forEach(p => {
            if (metric === 'Euclidean') {
                p.dist = Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2));
            } else {
                p.dist = Math.abs(p.x - center.x) + Math.abs(p.y - center.y);
            }
        });
        // Sort by distance
        return pts.sort((a, b) => a.dist - b.dist);
    }, [metric]);

    const kNearest = points.slice(0, k);
    const maxRadius = kNearest.length > 0 ? kNearest[kNearest.length - 1].dist + 5 : 20;

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Futuristic Grid Background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-indigo-500/10" strokeWidth="1" />
            </pattern>
            <rect width="400" height="300" fill="url(#grid)" />

            <defs>
                <radialGradient id="knn-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#6366f1" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="strong-glow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Radar area */}
            <motion.circle
                cx={center.x} cy={center.y}
                className="fill-[url(#knn-glow)] stroke-indigo-400"
                strokeWidth="1.5" strokeDasharray="6 6"
                animate={{ r: maxRadius }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
                filter="url(#glow)"
            />
            {/* Pulsing Radar Ring */}
            <motion.circle
                cx={center.x} cy={center.y}
                className="fill-none stroke-indigo-400"
                strokeWidth="2"
                initial={{ r: 0, opacity: 0.8 }}
                animate={{ r: maxRadius * 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />

            {/* Connections */}
            <AnimatePresence>
                {kNearest.map((p, i) => (
                    <motion.line
                        key={`conn-${p.id}`}
                        x1={center.x} y1={center.y}
                        x2={p.x} y2={p.y}
                        className={`stroke-[1.5px] ${p.isPositive ? 'stroke-rose-500/60' : 'stroke-emerald-400/60'}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.03 }}
                        strokeDasharray={metric === 'Manhattan' ? "4 4" : "none"}
                    />
                ))}
            </AnimatePresence>

            {/* All Points */}
            {
                points.map(p => {
                    const isActive = kNearest.find(k => k.id === p.id);
                    return (
                        <motion.circle
                            key={p.id}
                            cx={p.x} cy={p.y} r={isActive ? 5 : 3}
                            className={`${p.isPositive ? 'fill-rose-500' : 'fill-emerald-400'} transition-all duration-300`}
                            style={{ opacity: isActive ? 1 : 0.25 }}
                            filter={isActive ? "url(#glow)" : "none"}
                        />
                    );
                })
            }

            {/* Target Patient */}
            <motion.circle
                cx={center.x} cy={center.y} r={8}
                className="fill-white stroke-[4px] stroke-indigo-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                filter="url(#strong-glow)"
            />
            <motion.circle
                cx={center.x} cy={center.y} r={4}
                className="fill-indigo-400"
            />
            <text x={center.x + 15} y={center.y - 15} className="text-[12px] font-mono font-bold fill-indigo-300 drop-shadow-md">
                TARGET MATCHING...
            </text>
        </svg>
    );
};


// 2. Support Vector Machine (SVM)
const SVMViz = ({ params, isDarkMode }) => {
    const { c, kernel } = params.svm;

    // Smoothness / strictness factor mapping C to a visual margin width
    const margin = Math.max(10, 80 / c);

    const boundaryPath = useMemo(() => {
        if (kernel === 'Linear') return "M 40 260 L 360 40";
        if (kernel === 'Poly') return "M 40 180 Q 200 280 360 40";
        // RBF
        return "M 40 200 C 150 50, 250 50, 360 200";
    }, [kernel]);

    const upperMarginPath = useMemo(() => {
        if (kernel === 'Linear') return `M 40 ${260 - margin} L 360 ${40 - margin}`;
        if (kernel === 'Poly') return `M 40 ${180 - margin} Q 200 ${280 - margin} 360 ${40 - margin}`;
        return `M 40 ${200 - margin} C 150 ${50 - margin}, 250 ${50 - margin}, 360 ${200 - margin}`;
    }, [kernel, margin]);

    const lowerMarginPath = useMemo(() => {
        if (kernel === 'Linear') return `M 40 ${260 + margin} L 360 ${40 + margin}`;
        if (kernel === 'Poly') return `M 40 ${180 + margin} Q 200 ${280 + margin} 360 ${40 + margin}`;
        return `M 40 ${200 + margin} C 150 ${50 + margin}, 250 ${50 + margin}, 360 ${200 + margin}`;
    }, [kernel, margin]);

    const points = useMemo(() => generatePoints(35, 456), []);

    // Determine side of boundary (mock logic for visual effect)
    const categorizedPoints = points.map(p => {
        let val;
        if (kernel === 'Linear') val = (p.x - 40) * (40 - 260) - (p.y - 260) * (360 - 40);
        else if (kernel === 'Poly') val = (p.y - (180 + (p.x - 40) * (100 / 320))); // rough approx
        else val = (p.y - (200 - 150 * Math.sin(p.x * Math.PI / 400))); // RBF approx 

        const isUpper = val > 0;
        // within margin?
        const isSupport = Math.abs(val) < (margin * 100);

        return { ...p, isUpper, isSupport };
    });

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Background Grid */}
            <pattern id="grid-svm" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" className="fill-slate-500/20" />
            </pattern>
            <rect width="400" height="300" fill="url(#grid-svm)" />

            <defs>
                <filter id="svm-glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="boundaryGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
            </defs>

            {/* Mathematical Equation Overlay */}
            <text x="20" y="30" className="text-[10px] font-mono fill-slate-500 tracking-widest opacity-60">
                f(x) = sign( Σ α_i y_i K(x_i, x) + b )
            </text>

            {/* Boundary */}
            <motion.path
                d={boundaryPath} fill="none"
                className="stroke-[4px]" stroke="url(#boundaryGradient)"
                animate={{ d: boundaryPath }}
                transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                filter="url(#svm-glow)"
            />
            {/* Margins */}
            <motion.path
                d={upperMarginPath} fill="none"
                className="stroke-[2px] stroke-indigo-400/80" strokeDasharray="4 8"
                animate={{ d: upperMarginPath }}
                transition={{ type: "spring", bounce: 0, duration: 0.6 }}
            />
            <motion.path
                d={lowerMarginPath} fill="none"
                className="stroke-[2px] stroke-indigo-400/80" strokeDasharray="4 8"
                animate={{ d: lowerMarginPath }}
                transition={{ type: "spring", bounce: 0, duration: 0.6 }}
            />

            {/* Support Vector Connections */}
            {categorizedPoints.filter(p => p.isSupport).slice(0, 5).map((p, i) => (
                <motion.line
                    key={`sv-${p.id}`}
                    x1={p.x} y1={p.y}
                    x2={p.x} y2={p.isUpper ? p.y + margin / 2 : p.y - margin / 2}
                    className="stroke-cyan-400 stroke-[2px]"
                    strokeDasharray="2 2"
                    initial={{ strokeDashoffset: 10 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            ))}

            {/* Glowing Points */}
            {categorizedPoints.map(p => (
                <g key={p.id}>
                    {p.isSupport && (
                        <motion.circle
                            cx={p.x} cy={p.y} r={10}
                            className="fill-amber-400/10 stroke-amber-400/50 stroke-[2px]"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                    <motion.circle
                        cx={p.x} cy={p.y} r={p.isSupport ? 5 : 3.5}
                        className={`${p.isUpper ? 'fill-emerald-400' : 'fill-rose-500'} transition-all`}
                        style={{
                            opacity: p.isSupport ? 1 : 0.3,
                            stroke: p.isSupport ? '#fff' : 'transparent',
                            strokeWidth: p.isSupport ? 1.5 : 0
                        }}
                        filter={p.isSupport ? "url(#svm-glow)" : "none"}
                    />
                </g>
            ))}
        </svg>
    );
};


// 3. Logistic Regression (LR)
const LRViz = ({ params, isDarkMode }) => {
    const { c } = params.lr;

    // C controls slope steepness
    const slope = Math.max(10, c * 60);

    const sigmoidPath = `M 20 280 C 180 280, ${200 - slope} 280, 200 150 C ${200 + slope} 20, 220 20, 380 20`;

    // Spread points along x axis
    const points = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => {
            const x = 30 + (i * 340 / 40) + (Math.random() * 10 - 5);
            // Probability logic
            const prob = 1 / (1 + Math.exp(-0.05 * (x - 200)));
            const isPositive = Math.random() < prob;
            return { id: i, x, isPositive, prob };
        });
    }, []);

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Holographic grid */}
            <pattern id="grid-lr" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" className="stroke-slate-400/5 dark:stroke-slate-600/10" strokeWidth="1" />
            </pattern>
            <rect width="400" height="300" fill="url(#grid-lr)" />

            <defs>
                <linearGradient id="prob-grad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                    <stop offset="40%" stopColor="#10b981" stopOpacity="0.0" />
                    <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.0" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
                </linearGradient>
                <filter id="lr-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Formula Overlay */}
            <text x="375" y="30" textAnchor="end" className="text-[12px] font-mono fill-indigo-400/50">
                P(y=1|x) = 1 / (1 + e^-z)
            </text>

            {/* Axes */}
            <line x1="20" y1="280" x2="380" y2="280" className="stroke-emerald-400/40" strokeWidth="2" />
            <line x1="20" y1="20" x2="380" y2="20" className="stroke-rose-400/40" strokeWidth="2" />
            <line x1="20" y1="20" x2="20" y2="280" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />
            <text x="25" y="30" className="text-[10px] fill-rose-400 font-mono font-bold font-mono">1.0 Risk</text>
            <text x="25" y="275" className="text-[10px] fill-emerald-400 font-mono font-bold font-mono">0.0 Safe</text>

            <path d="M 20 280 L 380 280 L 380 20 L 20 20 Z" fill="url(#prob-grad)" />

            {/* Threshold Line at 0.5 (y=150) */}
            <motion.line
                x1="20" y1="150" x2="380" y2="150"
                className="stroke-amber-400/60" strokeWidth="1.5" strokeDasharray="5 5"
                animate={{ strokeDashoffset: [10, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <text x="375" y="145" textAnchor="end" className="text-[10px] fill-amber-500 font-bold font-mono">
                DECISION THRESHOLD = 0.5
            </text>

            {/* Sigmoid Curve */}
            <motion.path
                d={sigmoidPath} fill="none"
                className="stroke-[5px] stroke-indigo-400"
                animate={{ d: sigmoidPath }}
                transition={{ type: "spring", bounce: 0 }}
                filter="url(#lr-glow)"
            />

            {/* Data Points on top and bottom */}
            {points.map(p => (
                <g key={p.id}>
                    {/* Laser link to curve */}
                    <motion.line
                        x1={p.x} y1={p.isPositive ? 20 + (p.id % 10) * 2 : 270 - (p.id % 10) * 2}
                        x2={p.x} y2={280 - (p.prob * 260)}
                        className={`stroke-[1px] ${p.isPositive ? 'stroke-rose-500/20' : 'stroke-emerald-400/20'}`}
                        strokeDasharray="2 2"
                    />
                    <motion.circle
                        cx={p.x} cy={p.isPositive ? 20 + Math.random() * 20 : 260 + Math.random() * 20} r={4.5}
                        className={p.isPositive ? 'fill-rose-500' : 'fill-emerald-400'}
                        initial={{ opacity: 0, y: 150 }}
                        animate={{ opacity: 0.9, y: p.isPositive ? 20 + (p.id % 10) * 2 : 270 - (p.id % 10) * 2 }}
                        transition={{ delay: p.id * 0.02 }}
                        style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}
                    />
                </g>
            ))}

            {/* Intersection glow points */}
            <motion.circle
                cx="200" cy="150" r="6"
                className="fill-amber-400 stroke-[3px] stroke-indigo-900"
                animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                filter="url(#lr-glow)"
            />
        </svg>
    );
};


// 4. Decision Tree (DT)
const DTViz = ({ params, isDarkMode }) => {
    const { maxDepth } = params.dt;

    // Calculate nodes based on depth limit (cap at 4 for drawing limits)
    const drawDepth = Math.min(maxDepth, 4);

    const renderTreeLevel = (level, x, y, width, isLeft = true) => {
        if (level > drawDepth) return null;

        const childY = y + 50;
        const offset = width / 2;
        const leftX = x - offset;
        const rightX = x + offset;

        return (
            <g key={`level-${level}-${x}`}>
                <motion.line
                    x1={x} y1={y} x2={x} y2={y}
                    className="stroke-[2px] stroke-slate-300 dark:stroke-slate-600"
                    animate={{ x2: leftX, y2: childY }}
                    transition={{ duration: 0.4, delay: level * 0.15 }}
                />
                <motion.line
                    x1={x} y1={y} x2={x} y2={y}
                    className="stroke-[2px] stroke-slate-300 dark:stroke-slate-600"
                    animate={{ x2: rightX, y2: childY }}
                    transition={{ duration: 0.4, delay: level * 0.15 }}
                />

                {/* Recursion */}
                {renderTreeLevel(level + 1, leftX, childY, width / 2, true)}
                {renderTreeLevel(level + 1, rightX, childY, width / 2, false)}

                {/* Node */}
                <motion.rect
                    x={x - 12} y={y - 10} width="24" height="20" rx="4"
                    className={`stroke-[1.5px] ${isDarkMode ? 'fill-slate-800 stroke-slate-600' : 'fill-white stroke-slate-300'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: (level - 1) * 0.15 }}
                />

                {/* End Leaf coloring */}
                {level === drawDepth && (
                    <motion.circle
                        cx={x} cy={y} r="5"
                        className={Math.random() > 0.5 ? 'fill-emerald-400' : 'fill-rose-500'}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: level * 0.15 + 0.2 }}
                    />
                )}
            </g>
        );
    };

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            <g transform="translate(0, 30)">
                {/* Root Node */}
                <motion.rect
                    x={200 - 30} y={10 - 15} width="60" height="30" rx="6"
                    className={`stroke-[2px] ${isDarkMode ? 'fill-indigo-900/40 stroke-indigo-500' : 'fill-indigo-50 stroke-indigo-500'}`}
                    style={{ filter: "drop-shadow(0 4px 6px rgba(99,102,241,0.3))" }}
                />
                <text x="200" y="15" textAnchor="middle" className="text-[12px] font-bold fill-indigo-500">Root</text>

                {renderTreeLevel(1, 200, 25, 100)}
            </g>

            {/* Depth Indicator */}
            {maxDepth > 4 && (
                <text x="200" y="280" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono animate-pulse">
                    ... and {maxDepth - 4} more levels depth
                </text>
            )}
        </svg>
    );
};


// 5. Random Forest (RF)
const RFViz = ({ params, isDarkMode }) => {
    const { trees } = params.rf;
    const treeCount = Math.min(trees, 200);
    // Determine how many visual dots to show (max 60 to prevent lag)
    const visualDots = Math.min(treeCount, 60);

    const dots = useMemo(() => Array.from({ length: visualDots }).map((_, i) => {
        const angle = (i / visualDots) * Math.PI * 2;
        const radius = 90 + Math.random() * 30;
        return {
            id: i,
            x: 200 + Math.cos(angle) * radius,
            y: 150 + Math.sin(angle) * (radius * 0.6), // ellipse
            vote: Math.random() > 0.4 ? 'pos' : 'neg', // bias positive
            delay: Math.random() * 2
        };
    }), [visualDots]);

    const posVotes = dots.filter(d => d.vote === 'pos').length;
    const negVotes = dots.length - posVotes;
    const finalDecision = posVotes >= negVotes ? 'pos' : 'neg';

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            <defs>
                <filter id="rf-glow">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Connecting laser beams */}
            {dots.map(d => (
                <motion.line
                    key={`beam-${d.id}`}
                    x1={d.x} y1={d.y} x2={200} y2={150}
                    className={d.vote === 'pos' ? 'stroke-emerald-400/30' : 'stroke-rose-500/30'}
                    strokeWidth="1.5" strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [20, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: d.delay }}
                />
            ))}

            {/* Mini Trees (Dots) */}
            {dots.map(d => (
                <g key={`tree-${d.id}`}>
                    <circle cx={d.x} cy={d.y} r="4" className={d.vote === 'pos' ? 'fill-emerald-500' : 'fill-rose-500'} />
                    <circle cx={d.x} cy={d.y} r="8" className={d.vote === 'pos' ? 'fill-emerald-500/20' : 'fill-rose-500/20'} />
                </g>
            ))}

            {/* Center Aggregator (Ensemble) */}
            <motion.rect
                x="140" y="110" width="120" height="80" rx="12"
                className={`stroke-[3px] shadow-2xl ${finalDecision === 'pos'
                    ? 'fill-emerald-900/30 stroke-emerald-500'
                    : 'fill-rose-900/30 stroke-rose-500'
                    } backdrop-blur-md`}
                filter="url(#rf-glow)"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <text x="200" y="135" textAnchor="middle" className={`text-[12px] font-bold ${isDarkMode ? 'fill-white' : 'fill-slate-900'}`}>ENSEMBLE</text>
            <text x="200" y="155" textAnchor="middle" className="text-[10px] fill-emerald-400 font-mono">Yes: {Math.round(posVotes / visualDots * 100)}%</text>
            <text x="200" y="170" textAnchor="middle" className="text-[10px] fill-rose-400 font-mono">No: {Math.round(negVotes / visualDots * 100)}%</text>

            <text x="200" y="30" textAnchor="middle" className="text-[12px] font-bold fill-slate-400 tracking-widest">{treeCount} TREES VOTING</text>
        </svg>
    );
};


// 6. Naive Bayes (NB)
const NBViz = ({ params, isDarkMode }) => {
    // smoothing parameter adjusts curve fatness
    const { smoothing } = params.nb;
    // Map log scale to visual spread width 
    const spread = Math.max(20, Math.min(100, 50 - (Math.log10(smoothing) + 9) * 15));

    const generateGaussian = (cx, cy, width, height) => {
        return `M ${cx - width * 2} 250 ` +
            `C ${cx - width} 250, ${cx - width * 0.5} ${cy}, ${cx} ${cy} ` +
            `C ${cx + width * 0.5} ${cy}, ${cx + width} 250, ${cx + width * 2} 250`;
    };

    const d1 = generateGaussian(150, 80, spread, 170);
    const d2 = generateGaussian(250, 100, spread * 1.2, 150);

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Axis */}
            <line x1="20" y1="250" x2="380" y2="250" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />

            {/* Dist 1 */}
            <motion.path
                d={d1}
                className="fill-emerald-500/20 stroke-[3px] stroke-emerald-500"
                animate={{ d: d1 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                style={{ filter: "drop-shadow(0px 0px 10px rgba(16,185,129,0.3))" }}
            />
            {/* Dist 2 */}
            <motion.path
                d={d2}
                className="fill-rose-500/20 stroke-[3px] stroke-rose-500"
                animate={{ d: d2 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                style={{ filter: "drop-shadow(0px 0px 10px rgba(244,63,94,0.3))" }}
            />

            {/* Overlap highlights */}
            <motion.line
                x1="200" y1="250" x2="200" y2="150"
                className="stroke-amber-400 stroke-[2px]" strokeDasharray="4 4"
                animate={{ y2: 250 - spread }} // rough interaction binding
            />
            <circle cx="200" cy={250 - spread} r="5" className="fill-amber-400" />

            <text x="210" y={240 - spread} className="text-[10px] font-bold fill-amber-500">Overlap Area (Prior Prob.)</text>

            <text x="150" y="60" textAnchor="middle" className="text-[12px] font-bold fill-emerald-500">Condition A</text>
            <text x="250" y="80" textAnchor="middle" className="text-[12px] font-bold fill-rose-500">Condition B</text>
        </svg>
    );
};

// --- Main Export ---
const ModelVisualizer = ({ selectedModel, params, isDarkMode }) => {
    switch (selectedModel) {
        case 'knn': return <KNNViz params={params} isDarkMode={isDarkMode} />;
        case 'svm': return <SVMViz params={params} isDarkMode={isDarkMode} />;
        case 'lr': return <LRViz params={params} isDarkMode={isDarkMode} />;
        case 'dt': return <DTViz params={params} isDarkMode={isDarkMode} />;
        case 'rf': return <RFViz params={params} isDarkMode={isDarkMode} />;
        case 'nb': return <NBViz params={params} isDarkMode={isDarkMode} />;
        default: return <div className="text-slate-500">Select a model to visualize</div>;
    }
};

export default ModelVisualizer;
