import { useRef, useEffect, useCallback } from 'react';

/**
 * InteractiveDotBackground
 * 
 * A canvas-rendered dot grid where dots respond to mouse proximity:
 *  - Dots near the cursor grow larger and glow brighter
 *  - They shift slightly toward the cursor position
 *  - A soft radial glow follows the cursor
 * 
 * Performant: uses requestAnimationFrame, only redraws on mouse move or resize.
 */
const InteractiveDotBackground = ({ isDarkMode }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const animFrameRef = useRef(null);
    const dotsRef = useRef([]);
    const dimensionsRef = useRef({ w: 0, h: 0 });

    // ── Config ──
    const DOT_SPACING = 28;
    const BASE_RADIUS = isDarkMode ? 1 : 1.2;
    const MAX_RADIUS = 3.5;
    const INFLUENCE_RADIUS = 180;
    const PULL_STRENGTH = 0.12; // how much dots drift toward cursor
    const GLOW_RADIUS = 280; // radial glow around cursor

    // ── Build dot grid ──
    const buildGrid = useCallback((w, h) => {
        const dots = [];
        const cols = Math.ceil(w / DOT_SPACING) + 2;
        const rows = Math.ceil(h / DOT_SPACING) + 2;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                dots.push({
                    homeX: c * DOT_SPACING,
                    homeY: r * DOT_SPACING,
                    x: c * DOT_SPACING,
                    y: r * DOT_SPACING,
                    radius: BASE_RADIUS,
                    alpha: isDarkMode ? 0.07 : 0.28,
                });
            }
        }
        return dots;
    }, [isDarkMode]);

    // ── Draw frame ──
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { w, h } = dimensionsRef.current;
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        ctx.clearRect(0, 0, w, h);

        // Cursor radial glow
        if (mx > -1000) {
            const grad = ctx.createRadialGradient(mx, my, 0, mx, my, GLOW_RADIUS);
            if (isDarkMode) {
                grad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
                grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                grad.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
                grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        const dots = dotsRef.current;
        const baseColor = isDarkMode ? [255, 255, 255] : [71, 85, 105];
        const glowColor = isDarkMode ? [139, 132, 246] : [79, 70, 229];

        for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            const dx = mx - dot.homeX;
            const dy = my - dot.homeY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < INFLUENCE_RADIUS) {
                // Proximity factor: 1 at cursor, 0 at edge of influence
                const t = 1 - dist / INFLUENCE_RADIUS;
                const eased = t * t; // quadratic easing for smoother falloff

                // Grow radius
                const targetRadius = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * eased;
                dot.radius += (targetRadius - dot.radius) * 0.15;

                // Brighten alpha
                const targetAlpha = (isDarkMode ? 0.07 : 0.28) + (isDarkMode ? 0.55 : 0.52) * eased;
                dot.alpha += (targetAlpha - dot.alpha) * 0.15;

                // Pull toward cursor
                const targetX = dot.homeX + dx * PULL_STRENGTH * eased;
                const targetY = dot.homeY + dy * PULL_STRENGTH * eased;
                dot.x += (targetX - dot.x) * 0.1;
                dot.y += (targetY - dot.y) * 0.1;

                // Draw with glow color
                const [cr, cg, cb] = glowColor;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${dot.alpha})`;
                ctx.fill();
            } else {
                // Spring back to home
                dot.radius += (BASE_RADIUS - dot.radius) * 0.08;
                const baseAlpha = isDarkMode ? 0.07 : 0.28;
                dot.alpha += (baseAlpha - dot.alpha) * 0.08;
                dot.x += (dot.homeX - dot.x) * 0.06;
                dot.y += (dot.homeY - dot.y) * 0.06;

                // Draw with base color
                const [cr, cg, cb] = baseColor;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${dot.alpha})`;
                ctx.fill();
            }
        }

        animFrameRef.current = requestAnimationFrame(draw);
    }, [isDarkMode]);

    // ── Setup canvas, grid, listeners ──
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = window.innerWidth;
            const h = document.documentElement.scrollHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            dimensionsRef.current = { w, h };
            dotsRef.current = buildGrid(w, h);
        };

        const onMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
        };

        const onMouseLeave = () => {
            mouseRef.current = { x: -9999, y: -9999 };
        };

        const onScroll = () => {
            // Update Y when scrolling so the glow tracks correctly
            mouseRef.current = {
                ...mouseRef.current,
                y: mouseRef.current.y !== -9999 ? mouseRef.current.y : -9999
            };
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('scroll', onScroll);

        // Start animation loop
        animFrameRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('scroll', onScroll);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [buildGrid, draw]);

    // ── Rebuild grid when theme changes ──
    useEffect(() => {
        const { w, h } = dimensionsRef.current;
        if (w > 0 && h > 0) {
            dotsRef.current = buildGrid(w, h);
        }
    }, [isDarkMode, buildGrid]);

    // Resize observer for content height changes (e.g. accordion, page transition)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let resizeTimer;
        const observer = new MutationObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const dpr = window.devicePixelRatio || 1;
                const w = window.innerWidth;
                const h = document.documentElement.scrollHeight;
                canvas.width = w * dpr;
                canvas.height = h * dpr;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                const ctx = canvas.getContext('2d');
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                dimensionsRef.current = { w, h };
                dotsRef.current = buildGrid(w, h);
            }, 250);
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: false });

        return () => {
            observer.disconnect();
            clearTimeout(resizeTimer);
        };
    }, [buildGrid]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ position: 'absolute', top: 0, left: 0 }}
        />
    );
};

export default InteractiveDotBackground;
