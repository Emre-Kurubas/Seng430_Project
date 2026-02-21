import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';
import { specialties } from '../data/specialties';

// ─── Arrow button defined OUTSIDE the component to avoid remount ────────────
const ArrowBtn = ({ onClick, dir, isDarkMode }) => (
    <button
        onClick={onClick}
        type="button"
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${isDarkMode
            ? 'bg-slate-800 border-slate-700/80 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-300 hover:bg-slate-700'
            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
            }`}
    >
        {dir === 'left'
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
        }
    </button>
);

const DomainSelector = ({ activeDomain, onDomainChange, isDarkMode }) => {
    const scrollRef = useRef(null);

    const scrollLeft = () => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
    const scrollRight = () => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

    return (
        <div className="relative w-full">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2.5 pl-1">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                    <Stethoscope className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select Specialty
                </span>
                <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {specialties.length} domains
                </span>
            </div>

            {/* Pill strip with always-visible arrows */}
            <div
                id="domain-selector-bar"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all duration-500 ${isDarkMode
                    ? 'bg-[#0C1428]/60 border-white/[0.06]'
                    : 'bg-white/60 border-slate-200/80 shadow-sm'
                    }`}
                style={{ backdropFilter: 'blur(16px)' }}
            >
                {/* Always-visible left arrow */}
                <ArrowBtn onClick={scrollLeft} dir="left" isDarkMode={isDarkMode} />

                {/* Scrollable pills */}
                <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x flex-1"
                >
                    {specialties.map((domain) => {
                        const isActive = activeDomain?.id === domain.id;
                        return (
                            <motion.button
                                key={domain.id}
                                type="button"
                                onClick={() => onDomainChange(domain)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className={`
                                    relative px-4 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap
                                    outline-none snap-center select-none transition-all duration-200 border
                                    ${isActive
                                        ? 'text-white border-transparent shadow-lg'
                                        : isDarkMode
                                            ? 'text-slate-400 border-white/5 hover:text-slate-200 hover:border-indigo-500/30 hover:bg-indigo-500/8'
                                            : 'text-slate-500 border-slate-100 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/60'
                                    }
                                `}
                                style={isActive ? {
                                    background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                                    boxShadow: '0 4px 16px rgba(99,102,241,0.30)',
                                } : {}}
                            >
                                {/* Animated active background */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-domain"
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)' }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                )}
                                <span className="relative">{domain.name}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Always-visible right arrow */}
                <ArrowBtn onClick={scrollRight} dir="right" isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

export default DomainSelector;
