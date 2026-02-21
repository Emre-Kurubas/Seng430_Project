
import React from 'react';
import { BadgeInfo, HeartPulse, Stethoscope, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ClinicalContext = ({ domain, isDarkMode, onNext }) => {
    if (!domain) return null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50, damping: 20 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-7xl mx-auto space-y-8 pb-32"
        >
            {/* Top Section */}
            <motion.div variants={item} className={`flex flex-col md:flex-row justify-between items-start gap-6 backdrop-blur-md p-5 sm:p-8 rounded-3xl border shadow-xl transition-all duration-500 ${isDarkMode ? 'bg-white/5 border-white/10 shadow-black/20' : 'bg-white/80 border-slate-200 shadow-slate-200/50'}`}>
                <div className="space-y-4 sm:space-y-6 max-w-4xl relative">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`backdrop-blur border px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm flex items-center gap-2 ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100'}`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}></span>
                            </span>
                            Step 1 of 7
                        </span>
                        <span className={`text-sm font-medium flex items-center tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-400'}`}></span>
                            ~3 minutes
                        </span>
                    </div>

                    <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        Clinical Context & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Problem Definition</span>
                    </h1>

                    <p className={`text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl font-light ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Before we look at any data, we define the clinical problem. In <strong className={`font-semibold underline decoration-indigo-500/50 decoration-2 underline-offset-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{domain.name}</strong>, we want to predict <strong>{domain.description}</strong>.
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className={`w-full md:w-auto pl-6 sm:pl-8 pr-4 sm:pr-6 py-3 sm:py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center space-x-3 group text-base sm:text-lg shrink-0 border md:min-w-[200px] ${isDarkMode ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-400 border-white/10' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500 border-transparent'}`}
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-emerald-100" />
                </motion.button>
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                {/* Left Column: Clinical Scenario */}
                <motion.div variants={item} className="lg:col-span-5 flex flex-col h-full">
                    <div className={`backdrop-blur-xl rounded-[2rem] p-5 sm:p-8 shadow-xl border relative overflow-hidden h-full transform transition-all duration-500 ${isDarkMode ? 'bg-slate-800/40 shadow-black/20 border-white/5 hover:shadow-2xl hover:shadow-indigo-500/10' : 'bg-white/60 shadow-slate-200/50 border-slate-200 hover:shadow-xl hover:shadow-indigo-100'}`}>
                        {/* Decorative background blobs */}
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-300/20'}`}></div>
                        <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2 ${isDarkMode ? 'bg-rose-500/10' : 'bg-rose-300/20'}`}></div>

                        <div className="relative z-10 space-y-8">
                            <h2 className={`text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className={`p-2 rounded-lg border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><Stethoscope className="w-4 h-4" /></span>
                                <span>Clinical Scenario</span>
                            </h2>

                            <div>
                                <span className={`block text-xs font-bold uppercase mb-2 tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Domain</span>
                                <div className="group flex items-center space-x-3 transition-colors">
                                    <div className={`p-3 rounded-2xl transition-colors border ${isDarkMode ? 'bg-rose-500/10 group-hover:bg-rose-500/20 border-rose-500/20' : 'bg-rose-50 group-hover:bg-rose-100 border-rose-200'}`}>
                                        <HeartPulse className={`w-8 h-8 drop-shadow-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                                    </div>
                                    <span className={`text-2xl md:text-3xl font-black tracking-tight transition-colors ${isDarkMode ? 'text-slate-100 group-hover:text-rose-400' : 'text-slate-800 group-hover:text-rose-600'}`}>{domain.name}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Clinical Question</span>
                                    <div className={`border p-6 rounded-2xl font-medium text-lg leading-relaxed shadow-sm backdrop-blur-sm relative ${isDarkMode ? 'bg-sky-500/10 border-sky-500/20 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
                                        <span className={`absolute -top-3 left-6 text-6xl font-serif leading-none select-none ${isDarkMode ? 'text-sky-500/20' : 'text-sky-200'}`}>"</span>
                                        <p className="relative z-10">{domain.clinicalQuestion}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Why This Matters</span>
                                    <p className={`text-[15px] leading-relaxed font-light ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {domain.whyMatters}
                                    </p>
                                </div>

                                <div className={`border p-5 rounded-2xl flex items-start gap-4 shadow-sm backdrop-blur-sm ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className={`p-2 rounded-full shrink-0 ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                                        <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                                    </div>
                                    <div>
                                        <strong className={`block text-sm mb-1.5 font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>What ML cannot do</strong>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-amber-200/80' : 'text-amber-800/80'}`}>
                                            It cannot replace your clinical judgment. It can flag high-risk patients, but <span className={`underline font-semibold decoration-2 ${isDarkMode ? 'decoration-amber-500/50' : 'decoration-amber-400/50'}`}>you make the final decision</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Process Table */}
                <motion.div variants={item} className="lg:col-span-7 h-full flex flex-col">
                    <div className={`backdrop-blur-xl rounded-[2rem] shadow-xl border overflow-hidden flex flex-col h-full transform transition-all duration-500 ${isDarkMode ? 'bg-slate-800/40 shadow-black/20 border-white/5 hover:shadow-2xl hover:shadow-indigo-500/10' : 'bg-white/80 shadow-slate-200/50 border-slate-200 hover:shadow-xl hover:shadow-indigo-100'}`}>
                        <div className={`p-5 sm:p-8 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
                            <h2 className={`text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className={`p-2 rounded-lg border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><BadgeInfo className="w-4 h-4" /></span>
                                <span>What Will Be Produced In Each Step</span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto grow">
                            <table className="w-full text-left border-collapse">
                                <tbody className={`text-[15px] ${isDarkMode ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}`}>
                                    {[
                                        { id: 1, create: 'Clinical Brief', meaning: 'The problem we are solving, and the safety rules' },
                                        { id: 2, create: 'Data Profile', meaning: 'Understanding your patient dataset — who is in it and what is missing' },
                                        { id: 3, create: 'Preprocessing Recipe', meaning: 'Cleaning and preparing data so the model can learn correctly' },
                                        { id: 4, create: 'Trained Model', meaning: 'A computer programme that has learned patterns from past patients' },
                                        { id: 5, create: 'Evaluation Report', meaning: 'How accurately does the model predict readmission?' },
                                        { id: 6, create: 'Explanation', meaning: 'Why did the model flag a specific patient as high risk?' },
                                        { id: 7, create: 'Ethics Checklist', meaning: 'Is the model fair for all patient groups? Who oversees it?' },
                                    ].map((row, i) => (
                                        <motion.tr
                                            key={row.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            className={`group transition-all duration-300 cursor-default ${row.id === 1 ? (isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50') : 'hover:bg-white/5'}`}
                                        >
                                            <td className="p-5 text-center relative">
                                                {row.id === 1 && <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}></div>}
                                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm ${row.id === 1
                                                    ? `bg-gradient-to-br from-indigo-500 to-indigo-600 text-white ring-4 shadow-indigo-500/40 scale-110 ${isDarkMode ? 'ring-indigo-500/20' : 'ring-indigo-100'}`
                                                    : isDarkMode
                                                        ? 'bg-slate-800 border border-slate-700 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200 group-hover:shadow-md group-hover:scale-105'
                                                        : 'bg-white border border-slate-200 text-slate-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-md group-hover:scale-105'
                                                    }`}>
                                                    {row.id}
                                                </span>
                                            </td>
                                            <td className={`p-5 font-bold tracking-tight ${row.id === 1 ? (isDarkMode ? 'text-white text-lg drop-shadow-md' : 'text-indigo-900 text-lg') : (isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900')}`}>
                                                {row.create}
                                            </td>
                                            <td className={`p-3 sm:p-5 leading-relaxed font-light ${row.id === 1 ? (isDarkMode ? 'text-indigo-100 font-medium' : 'text-indigo-800 font-medium') : (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-700')}`}>
                                                {row.meaning}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Alert */}
            <motion.div
                variants={item}
                whileHover={{ scale: 1.01 }}
                className={`border rounded-3xl p-5 sm:p-8 flex flex-col md:flex-row items-start gap-4 sm:gap-6 shadow-xl backdrop-blur-md relative overflow-hidden group ${isDarkMode ? 'bg-emerald-900/20 border-emerald-500/20 shadow-emerald-500/10' : 'bg-emerald-50 border-emerald-200 shadow-emerald-100'}`}
            >
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/2 transition-colors duration-700 ${isDarkMode ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-emerald-400/20 group-hover:bg-emerald-400/30'}`}></div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-3 shrink-0 shadow-lg shadow-emerald-500/20 mt-1">
                    <CheckCircle2 className="w-8 h-8 text-white relative z-10" />
                </div>
                <div>
                    <h4 className={`font-bold text-xl mb-2 tracking-tight ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Important Reminder</h4>
                    <p className={`text-lg leading-relaxed font-light max-w-3xl ${isDarkMode ? 'text-emerald-200/80' : 'text-emerald-900/80'}`}>
                        A human doctor or nurse must always review the model's suggestions. This tool helps you learn — <span className={`border-b-2 font-semibold ${isDarkMode ? 'border-emerald-500/50 text-emerald-300' : 'border-emerald-600/30 text-emerald-900'}`}>it does not make clinical decisions</span>.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ClinicalContext;
