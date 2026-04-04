import React, { useState } from 'react';
import { RotateCcw, Activity, Sun, Moon, HelpCircle, Home } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ activeDomain, isDarkMode, toggleTheme, onHelpOpen, onReset, resetPending, onHome }) => {
    const primaryStr = activeDomain?.theme?.primary || '#6366f1';
    const [resetHover, setResetHover] = useState(false);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-700/80 shadow-sm' : 'bg-white border-slate-200'}`}
        >
            <div className={`
                w-full h-[56px] sm:h-[62px] flex justify-between items-center
                px-4 sm:px-6 lg:px-8
            `}>
                {/* ── Logo ── */}
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onHome}
                        className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        style={{ backgroundColor: `${primaryStr}15` }}
                        title="Back to Welcome"
                    >
                        <img src="/logo.png" alt="Health-AI" className="w-5 h-5 rounded-sm object-contain" />
                    </motion.button>

                    <div>
                        <h1 className={`font-bold text-[15px] sm:text-[17px] leading-none tracking-[-0.02em] flex items-center gap-1.5 sm:gap-2 font-[Outfit] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            <span style={{ color: primaryStr }}>HEALTH</span>
                            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>-AI</span>
                            <span className={`hidden sm:inline px-2 py-0.5 rounded-md text-[9px] font-bold tracking-[0.12em] uppercase border ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                ML TOOL
                            </span>
                        </h1>

                    </div>
                </div>

                {/* ── Right Controls ── */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Reset Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onMouseEnter={() => setResetHover(true)}
                        onMouseLeave={() => setResetHover(false)}
                        onClick={onReset}
                        className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors duration-200
                            ${resetPending
                                ? 'border-red-300 text-red-600 bg-red-50'
                                : isDarkMode
                                    ? 'border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                                    : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        title={resetPending ? 'Click again to confirm reset' : 'Reset progress'}
                    >
                        <RotateCcw className={`w-3.5 h-3.5 transition-transform duration-300 ${resetHover || resetPending ? 'rotate-180' : ''}`} />
                        <span className="hidden sm:inline">{resetPending ? 'Sure?' : 'Reset'}</span>
                    </motion.button>

                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        id="theme-toggle"
                        onClick={toggleTheme}
                        className={`relative p-2 rounded-md border transition-colors duration-200 ${isDarkMode ? 'border-slate-600 text-amber-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </motion.button>

                    {/* Help Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        id="help-button"
                        onClick={onHelpOpen}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-[12px] font-semibold border transition-colors duration-200
                            ${isDarkMode
                                ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
                                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Help</span>
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
