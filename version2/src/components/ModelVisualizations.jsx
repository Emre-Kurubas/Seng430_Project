import React, { useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
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
const KNN_CENTER = { x: 200, y: 150 };

const KNNViz = ({ params }) => {
    const { k, metric } = params.knn;

    // Generate seeded patients
    const points = useMemo(() => {
        let pts = generatePoints(40, 123);
        // Calculate distances from center
        pts.forEach(p => {
            if (metric === 'Euclidean') {
                p.dist = Math.sqrt(Math.pow(p.x - KNN_CENTER.x, 2) + Math.pow(p.y - KNN_CENTER.y, 2));
            } else {
                p.dist = Math.abs(p.x - KNN_CENTER.x) + Math.abs(p.y - KNN_CENTER.y);
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
                cx={KNN_CENTER.x} cy={KNN_CENTER.y}
                className="fill-[url(#knn-glow)] stroke-indigo-400"
                strokeWidth="1.5" strokeDasharray="6 6"
                animate={{ r: maxRadius }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
                filter="url(#glow)"
            />
            {/* Pulsing Radar Ring */}
            <motion.circle
                cx={KNN_CENTER.x} cy={KNN_CENTER.y}
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
                        x1={KNN_CENTER.x} y1={KNN_CENTER.y}
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
                cx={KNN_CENTER.x} cy={KNN_CENTER.y} r={8}
                className="fill-white stroke-[4px] stroke-indigo-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                filter="url(#strong-glow)"
            />
            <motion.circle
                cx={KNN_CENTER.x} cy={KNN_CENTER.y} r={4}
                className="fill-indigo-400"
            />
            <text x={KNN_CENTER.x + 15} y={KNN_CENTER.y - 15} className="text-[12px] font-mono font-bold fill-indigo-300 drop-shadow-md">
                TARGET MATCHING...
            </text>
        </svg>
    );
};


// 2. Support Vector Machine (SVM)
const SVMViz = ({ params, isDarkMode }) => {
    const { c, kernel } = params.svm;

    // Strictness C goes from 0.1 to 10. Margin width adjusts based on this.
    // In strict mode (10), margin is very small. In loose mode (0.1), margin is wide.
    const marginScale = Math.max(0.1, 1.5 / c);

    return (
        <svg viewBox="0 0 600 300" className="w-full h-full">
            <defs>
                <filter id="svm-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={0.15} />
                </filter>
            </defs>

            {/* Labels inside chart */}
            <text x="20" y="280" className={`text-[10px] font-semibold ${isDarkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>Low EF%</text>
            <text x="580" y="280" textAnchor="end" className={`text-[10px] font-semibold ${isDarkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>High EF%</text>

            <g transform="translate(40, -10)">
                {/* RBF Visualization (curved boundary) */}
                {kernel === 'RBF' && (
                    <g>
                        {/* Margin Blob */}
                        <ellipse
                            cx="320" cy="180"
                            rx={40 + 40 * marginScale} ry={155 + 20 * marginScale}
                            transform="rotate(-40 320 180)"
                            className={`${isDarkMode ? 'fill-teal-900/20' : 'fill-teal-800/10'} transition-all duration-500`}
                        />

                        {/* Decision Boundary Line */}
                        <ellipse
                            cx="320" cy="180"
                            rx="40" ry="155"
                            transform="rotate(-40 320 180)"
                            className="fill-none stroke-[3px]"
                            stroke={isDarkMode ? '#cbd5e1' : '#1e293b'}
                        />

                        {/* Red Dots (Readmitted) */}
                        <g className="fill-red-600">
                            {/* Normal red dots */}
                            <circle cx="210" cy="240" r="5" />
                            <circle cx="230" cy="250" r="5" />
                            <circle cx="260" cy="265" r="5" />
                            <circle cx="280" cy="255" r="5" />
                            <circle cx="310" cy="275" r="5" />

                            {/* Support Vectors (Red) */}
                            <g stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5">
                                <circle cx="150" cy="225" r="6" />
                                <circle cx="180" cy="235" r="6" />
                            </g>
                        </g>

                        {/* Green Dots (Not Readmitted) */}
                        <g className="fill-green-600">
                            {/* Normal green dots */}
                            <circle cx="430" cy="140" r="5" />
                            <circle cx="450" cy="135" r="5" />
                            <circle cx="510" cy="155" r="5" />
                            <circle cx="540" cy="170" r="5" />

                            {/* Support Vectors (Green) */}
                            <g stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5">
                                <circle cx="380" cy="115" r="6" />
                                <circle cx="460" cy="125" r="6" />
                            </g>
                        </g>
                    </g>
                )}

                {kernel === 'Linear' && (
                    <g>
                        {/* Linear Margin */}
                        <polygon
                            points={`-50,${200 - 60 * marginScale} 600,${100 - 60 * marginScale} 600,${100 + 60 * marginScale} -50,${200 + 60 * marginScale}`}
                            className={`${isDarkMode ? 'fill-teal-900/20' : 'fill-teal-800/10'} transition-all duration-500`}
                        />
                        {/* Linear Boundary */}
                        <line x1="-50" y1="200" x2="600" y2="100" stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="3" />

                        {/* Red Dots */}
                        <g className="fill-red-600">
                            <circle cx="100" cy="230" r="5" />
                            <circle cx="150" cy="220" r="5" />
                            <circle cx="200" cy="260" r="5" />
                            <circle cx="300" cy="240" r="5" />
                            <g stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5">
                                <circle cx="250" cy="180" r="6" />
                                <circle cx="350" cy="155" r="6" />
                            </g>
                        </g>

                        {/* Green Dots */}
                        <g className="fill-green-600">
                            <circle cx="250" cy="60" r="5" />
                            <circle cx="400" cy="80" r="5" />
                            <circle cx="450" cy="50" r="5" />
                            <circle cx="500" cy="100" r="5" />
                            <g stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5">
                                <circle cx="300" cy="130" r="6" />
                                <circle cx="200" cy="110" r="6" />
                            </g>
                        </g>
                    </g>
                )}

                {kernel === 'Poly' && (
                    <g>
                        {/* Poly Margin */}
                        <path
                            d={`M -50 ${240 - 50 * marginScale} Q 300 ${300 - 50 * marginScale} 600 ${80 - 50 * marginScale} L 600 ${80 + 50 * marginScale} Q 300 ${300 + 50 * marginScale} -50 ${240 + 50 * marginScale} Z`}
                            className={`${isDarkMode ? 'fill-teal-900/20' : 'fill-teal-800/10'} transition-all duration-500`}
                        />
                        {/* Poly Boundary */}
                        <path d="M -50 240 Q 300 300 600 80" fill="none" stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="3" />

                        <g className="fill-red-600">
                            <circle cx="100" cy="280" r="5" />
                            <circle cx="150" cy="290" r="5" />
                            <circle cx="300" cy="260" r="5" />
                            <circle cx="250" cy="270" r="5" />
                            <g stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5">
                                <circle cx="400" cy="185" r="6" />
                            </g>
                        </g>

                        <g className="fill-green-600">
                            <circle cx="100" cy="150" r="5" />
                            <circle cx="200" cy="180" r="5" />
                            <circle cx="450" cy="80" r="5" />
                            <circle cx="500" cy="100" r="5" />
                            <g stroke={isDarkMode ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5">
                                <circle cx="300" cy="205" r="6" />
                            </g>
                        </g>
                    </g>
                )}
            </g>
        </svg>
    );
};


// 3. Logistic Regression (LR)
const LRViz = ({ params }) => {
    const { c } = params.lr;

    // C controls slope steepness
    const slope = Math.max(10, c * 60);

    const sigmoidPath = `M 20 280 C 180 280, ${200 - slope} 280, 200 150 C ${200 + slope} 20, 220 20, 380 20`;

    // Spread points along x axis
    const points = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => {
            const staticRandVal1 = Math.abs(Math.sin((i + 1) * 7.89));
            const staticRandVal2 = Math.abs(Math.cos((i + 1) * 3.45));
            const x = 30 + (i * 340 / 40) + ((staticRandVal1 * 10) - 5);
            // Probability logic
            const prob = 1 / (1 + Math.exp(-0.05 * (x - 200)));
            const isPositive = staticRandVal2 < prob;
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
                        cx={p.x} cy={p.isPositive ? 20 + Math.abs(Math.sin(p.id * 8.1)) * 20 : 260 + Math.abs(Math.cos(p.id * 9.2)) * 20} r={4.5}
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

    const getQuestion = (level, xPos) => {
        if (level === 1) return "EF < 38%?";
        if (level === 2 && xPos < 200) return "Age > 70?";
        if (level === 2 && xPos > 200) return "Creatinine > 1.2?";
        if (level === 3) return "BP > 140/90?";
        if (level === 4) return "Diabetes?";
        return "Med. History?";
    };

    const drawDepth = Math.min(maxDepth, 5);

    const renderTreeLevel = (level, x, y, width) => {
        if (level > drawDepth) return null;

        const childY = y + 55;
        const offset = width / 2;
        const leftX = x - offset;
        const rightX = x + offset;

        const question = getQuestion(level, x);

        return (
            <g key={`level-${level}-${x}`}>
                {level < drawDepth && (
                    <>
                        <motion.line
                            x1={x} y1={y + 12} x2={leftX} y2={childY - 12}
                            className={`stroke-[1.5px] ${isDarkMode ? 'stroke-slate-600' : 'stroke-slate-300'}`}
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: level * 0.15 }}
                        />
                        <motion.line
                            x1={x} y1={y + 12} x2={rightX} y2={childY - 12}
                            className={`stroke-[1.5px] ${isDarkMode ? 'stroke-slate-600' : 'stroke-slate-300'}`}
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: level * 0.15 }}
                        />
                    </>
                )}

                {level < drawDepth && renderTreeLevel(level + 1, leftX, childY, width / 2.2)}
                {level < drawDepth && renderTreeLevel(level + 1, rightX, childY, width / 2.2)}

                <motion.rect
                    x={x - 40} y={y - 14} width="80" height="28" rx="6"
                    className={`stroke-[1.5px] ${isDarkMode ? 'fill-slate-800 stroke-slate-500' : 'fill-white stroke-slate-800'}`}
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.05))" }}
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: (level - 1) * 0.15 }}
                />

                <motion.text
                    x={x} y={y + 4} textAnchor="middle"
                    className={`text-[10px] font-semibold ${isDarkMode ? 'fill-slate-300' : 'fill-slate-800'}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: (level - 1) * 0.15 + 0.1 }}
                >
                    {question}
                </motion.text>
            </g>
        );
    };

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full">
            <g transform="translate(0, 40)">
                {renderTreeLevel(1, 200, 20, 160)}
            </g>
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
        const radiusRand = Math.abs(Math.sin((i + 1) * 11.1));
        const voteRand = Math.abs(Math.cos((i + 1) * 22.2));
        const radius = 90 + radiusRand * 30;
        return {
            id: i,
            x: 200 + Math.cos(angle) * radius,
            y: 150 + Math.sin(angle) * (radius * 0.6), // ellipse
            vote: voteRand > 0.4 ? 'pos' : 'neg', // bias positive
            delay: (i % 10) * 0.2
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
const NBViz = ({ params }) => {
    // smoothing parameter adjusts curve fatness
    const { smoothing } = params.nb;
    // Map log scale to visual spread width 
    const spread = Math.max(20, Math.min(100, 50 - (Math.log10(smoothing) + 9) * 15));

    const generateGaussian = (cx, cy, width) => {
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
const ModelVisualizer = React.memo(({ selectedModel, params, isDarkMode }) => {
    switch (selectedModel) {
        case 'knn': return <KNNViz params={params} isDarkMode={isDarkMode} />;
        case 'svm': return <SVMViz params={params} isDarkMode={isDarkMode} />;
        case 'lr': return <LRViz params={params} isDarkMode={isDarkMode} />;
        case 'dt': return <DTViz params={params} isDarkMode={isDarkMode} />;
        case 'rf': return <RFViz params={params} isDarkMode={isDarkMode} />;
        case 'nb': return <NBViz params={params} isDarkMode={isDarkMode} />;
        default: return <div className="text-slate-500">Select a model to visualize</div>;
    }
});

export default ModelVisualizer;
