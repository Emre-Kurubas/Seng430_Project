import React, { useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';
import { specialties } from '../data/specialties';

const ArrowBtn = ({ onClick, dir, isDarkMode }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        type="button"
        className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${isDarkMode
            ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm'
            }`}
    >
        {dir === 'left'
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
        }
    </motion.button>
);

const DomainSelector = ({ activeDomain, onDomainChange, isDarkMode }) => {
    const primaryStr = activeDomain?.theme?.primary || '#10b981';
    const scrollRef = useRef(null);

    const scrollLeft = () => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
    const scrollRight = () => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

    return (
        <div className="relative w-full">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2.5 pl-1">
                <div className={`p-1.5 rounded-md w-7 h-7 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <Stethoscope className={`w-3.5 h-3.5`} style={{ color: primaryStr }} />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select Specialty
                </span>

            </div>

            {/* Pill strip */}
            <div
                id="domain-selector-bar"
                className="flex lg:flex-col items-center lg:items-start gap-2 py-1 w-full transition-colors duration-300"
            >
                <div className="lg:hidden shrink-0">
                    <ArrowBtn onClick={scrollLeft} dir="left" isDarkMode={isDarkMode} />
                </div>

                {/* Scrollable pills */}
                <div
                    ref={scrollRef}
                    className="flex lg:flex-col gap-1.5 lg:gap-0.5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-visible no-scrollbar scroll-smooth snap-x lg:snap-none flex-1 lg:flex-none w-full"
                >
                    {specialties.map((domain) => {
                        const isActive = activeDomain?.id === domain.id;
                        return (
                            <motion.button
                                whileHover={!isActive ? { x: 4 } : {}}
                                whileTap={{ scale: 0.98 }}
                                key={domain.id}
                                type="button"
                                onClick={() => onDomainChange(domain)}
                                className={`
                                    relative flex items-center gap-2.5 px-3 sm:px-3.5 py-1.5 lg:py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap lg:whitespace-normal lg:text-left
                                    outline-none snap-center lg:snap-none select-none transition-all duration-200 lg:w-full
                                    ${isActive
                                        ? 'text-white shadow-sm'
                                        : isDarkMode
                                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }
                                `}
                                style={isActive ? {
                                    backgroundColor: domain.theme?.primary || '#6366f1',
                                    boxShadow: `0 2px 8px ${(domain.theme?.primary || '#6366f1')}30`,
                                } : {}}
                            >
                                {/* Emoji icon */}
                                <span className={`text-[14px] leading-none shrink-0 ${isActive ? '' : 'grayscale-[30%]'}`} style={{ filter: isActive ? 'none' : undefined }}>
                                    {domain.emoji || '🩺'}
                                </span>
                                <span className="truncate">{domain.name}</span>
                                {/* Active indicator dot (mobile/tablet) */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-domain-dot"
                                        className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 h-4 rounded-full"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                <div className="lg:hidden shrink-0">
                    <ArrowBtn onClick={scrollRight} dir="right" isDarkMode={isDarkMode} />
                </div>
            </div>
        </div>
    );
};

export default DomainSelector;
