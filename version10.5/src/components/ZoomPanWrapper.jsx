import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ZoomPanWrapper({ children, isDarkMode }) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            // Scale
            const delta = e.deltaY * -0.002;
            setScale((prevScale) => {
                const newScale = prevScale + delta;
                return Math.min(Math.max(0.3, newScale), 3);
            });
            // Note: More complex mouse-centered zoom could be added here
        };

        // passive: false is required to preventDefault
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const handleMouseDown = useCallback((e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing';
        }
    }, [pan]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
        }
    }, []);

    // Center button
    const handleReset = () => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div 
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: '400px', 
                overflow: 'hidden',
                borderRadius: '16px',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                background: isDarkMode ? '#0f172a' : '#F8FAFC'
            }}
        >
            {/* Toolbar */}
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50, display: 'flex', gap: 6 }}>
                <button 
                    onClick={handleReset}
                    className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase transition-colors ${
                        isDarkMode ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-black/5 hover:bg-black/10 text-slate-600'
                    }`}
                >
                    Reset
                </button>
            </div>

            {/* Viewport */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Transform Layer */}
                <div
                    ref={contentRef}
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        willChange: 'transform'
                    }}
                >
                    {children}
                </div>
            </div>
            
            <div style={{ 
                position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none',
                fontSize: '10px', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
                Scroll to Zoom • Drag to Pan
            </div>
        </div>
    );
}
