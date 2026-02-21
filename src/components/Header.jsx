import React, { useState } from 'react';
import { RotateCcw, Sparkles, Activity, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ activeDomain, isDarkMode, toggleTheme, onHelpOpen, onReset }) => {
    const [resetHover, setResetHover] = useState(false);

    return (
        <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
            className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8"
        >
            <div className={`
                max-w-7xl mx-auto h-[56px] sm:h-[62px] flex justify-between items-center
                rounded-2xl px-3 sm:px-5 transition-all duration-500
                ${isDarkMode
                    ? 'bg-[#0C1428]/80 border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(99,102,241,0.1)] backdrop-blur-2xl'
                    : 'bg-white/80 border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl'
                }
            `}>
                {/* ── Logo ── */}
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.08, rotate: 8 }}
                        whileTap={{ scale: 0.92 }}
                        className="relative p-2.5 rounded-xl overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #10b981, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                        <Activity className="relative w-5 h-5 text-white" />
                    </motion.div>

                    <div>
                        <h1 className={`font-black text-[15px] sm:text-[17px] leading-none tracking-[-0.02em] flex items-center gap-1.5 sm:gap-2 font-[Outfit] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            <span className="gradient-text">HEALTH</span>
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>-AI</span>
                            <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.12em] uppercase border ${isDarkMode ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                ML TOOL
                            </span>
                        </h1>
                        <p className={`hidden sm:block text-[9.5px] leading-none mt-0.5 tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Erasmus+ KA220-HED · Healthcare Professionals
                        </p>
                    </div>
                </div>

                {/* ── Right Controls ── */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Active Domain Pill */}
                    <AnimatePresence mode="wait">
                        {activeDomain && (
                            <motion.div
                                key={activeDomain.id}
                                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                transition={{ duration: 0.3 }}
                                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-800/70 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                            >
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                <span className="text-[11px] font-semibold tracking-wide">{activeDomain.name}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`hidden md:block h-5 w-px mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

                    {/* Reset Button */}
                    <motion.button
                        onHoverStart={() => setResetHover(true)}
                        onHoverEnd={() => setResetHover(false)}
                        whileTap={{ scale: 0.9 }}
                        onClick={onReset}
                        className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200 ${isDarkMode ? 'border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800/60' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        title="Reset progress"
                    >
                        <motion.div animate={{ rotate: resetHover ? 360 : 0 }} transition={{ duration: 0.4 }}>
                            <RotateCcw className="w-3.5 h-3.5" />
                        </motion.div>
                        <span className="hidden sm:inline">Reset</span>
                    </motion.button>

                    {/* Theme Toggle */}
                    <motion.button
                        id="theme-toggle"
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        className={`relative p-2 rounded-xl border transition-all duration-200 overflow-hidden ${isDarkMode ? 'border-amber-500/20 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/40' : 'border-indigo-200 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-300'}`}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={isDarkMode ? 'sun' : 'moon'}
                                initial={{ y: -16, opacity: 0, rotate: -90 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: 16, opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>

                    {/* Help Button */}
                    <motion.button
                        id="help-button"
                        onClick={onHelpOpen}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[12px] font-bold text-white overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
                    >
                        <div className="absolute inset-0 shimmer" />
                        <Sparkles className="relative w-3.5 h-3.5 text-amber-300" />
                        <span className="relative hidden sm:inline">? Help</span>
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
