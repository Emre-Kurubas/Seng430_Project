import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Tooltip = ({ children, content, isDarkMode, position = 'top' }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);

    const show = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        let top, left;
        if (position === 'top') {
            top = rect.top + window.scrollY - 8;
            left = rect.left + window.scrollX + rect.width / 2;
        } else if (position === 'bottom') {
            top = rect.bottom + window.scrollY + 8;
            left = rect.left + window.scrollX + rect.width / 2;
        } else if (position === 'right') {
            top = rect.top + window.scrollY + rect.height / 2;
            left = rect.right + window.scrollX + 8;
        } else {
            top = rect.top + window.scrollY + rect.height / 2;
            left = rect.left + window.scrollX - 8;
        }
        setCoords({ top, left });
        setVisible(true);
    };

    const hide = () => setVisible(false);

    const positionStyles = {
        top: { transform: 'translate(-50%, -100%)' },
        bottom: { transform: 'translate(-50%, 0%)' },
        right: { transform: 'translate(0%, -50%)' },
        left: { transform: 'translate(-100%, -50%)' },
    };

    return (
        <>
            <span
                ref={triggerRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className="cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2"
            >
                {children}
            </span>
            {visible && createPortal(
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    className={`fixed z-[9999] max-w-[260px] px-3 py-2 rounded-lg text-xs leading-relaxed shadow-2xl border pointer-events-none
                        ${isDarkMode
                            ? 'bg-slate-800 border-slate-600 text-slate-200'
                            : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/60'
                        }`}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        ...positionStyles[position],
                    }}
                >
                    {content}
                    {/* Arrow */}
                    {position === 'top' && (
                        <div
                            className={`absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${isDarkMode ? 'border-t-slate-800' : 'border-t-white'}`}
                        />
                    )}
                    {position === 'bottom' && (
                        <div
                            className={`absolute left-1/2 -translate-x-1/2 top-[-5px] w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent ${isDarkMode ? 'border-b-slate-800' : 'border-b-white'}`}
                        />
                    )}
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
