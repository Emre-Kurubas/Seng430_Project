
import React from 'react';
import * as LucideIcons from 'lucide-react';
const { BadgeInfo, Stethoscope, AlertTriangle, ArrowRight, CheckCircle2 } = LucideIcons;
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const ClinicalContext = ({ domain, isDarkMode, onNext }) => {
    if (!domain) return null;
    const DomainIcon = LucideIcons[domain.icon || 'Activity'] || LucideIcons.Activity;
    const primaryStr = domain.theme?.primary || '#6366f1';
    const secondaryStr = domain.theme?.secondary || '#10b981';

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 12, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-7xl mx-auto space-y-6 pb-32"
        >
            {/* Top Reminder Alert */}
            <motion.div
                variants={item}
                className={`border rounded-lg p-3 sm:p-4 flex items-start gap-3 transition-colors duration-300 ${isDarkMode ? 'bg-emerald-900/10 border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200/50'}`}
            >
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`} />
                <div>
                    <h4 className={`font-semibold text-sm mb-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Important Reminder</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-emerald-300/80' : 'text-emerald-900/80'}`}>
                        A human doctor or nurse must always review the model's suggestions. This tool helps you learn — <span className="font-semibold underline">it does not make clinical decisions</span>.
                    </p>
                </div>
            </motion.div>
            {/* Top Section */}
            <motion.div variants={item} className="mb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] tracking-[0.15em] font-bold uppercase px-2 py-1 rounded-md ${isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-100'}`}>
                            Step 1 of 7
                        </span>
                        <span className={`text-[11px] font-semibold tracking-wide flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></span>
                            ~3 minutes
                        </span>
                    </div>

                    <button
                        onClick={onNext}
                        style={{ backgroundColor: primaryStr }}
                        className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors text-white`}
                    >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <button
                        onClick={onNext}
                        style={{ backgroundColor: primaryStr }}
                        className={`md:hidden flex items-center justify-center gap-2 w-full py-3 rounded-md text-sm font-semibold transition-colors text-white mt-4`}
                    >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    <h1 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        Clinical Scenario & <span style={{ color: primaryStr }}>Problem Definition</span>
                    </h1>

                    <p className={`text-sm md:text-base font-light ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Before we look at any data, we define the clinical problem. In <strong className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{domain.name}</strong>, we want to predict <strong>{domain.description}</strong>.
                    </p>
                </div>
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* Left Column: Clinical Scenario */}
                <motion.div variants={item} className="lg:col-span-5 flex flex-col h-full">
                    <div className={`rounded-xl p-5 sm:p-8 backdrop-blur-md transition-all duration-300 h-full ${isDarkMode ? 'bg-slate-800/80 border border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)]' : 'bg-white/95 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                        <div className="space-y-8">
                            <h2 className={`text-[10px] uppercase tracking-[0.25em] font-semibold mb-6 flex items-center gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className={`p-2 rounded-md ${isDarkMode ? 'bg-slate-800 text-indigo-400 shadow-inner ring-1 ring-inset ring-slate-700' : 'bg-indigo-50 text-indigo-600 shadow-inner ring-1 ring-inset ring-indigo-100/50'}`}><Stethoscope className="w-4 h-4" /></span>
                                <span>Clinical Scenario</span>
                            </h2>

                            <div>
                                <span className={`block text-xs font-bold uppercase mb-2 tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Domain</span>
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 rounded-lg border" style={{ backgroundColor: `${primaryStr}10`, borderColor: `${primaryStr}30` }}>
                                        <DomainIcon className="w-8 h-8" style={{ color: primaryStr }} />
                                    </div>
                                    <span className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: primaryStr }}>{domain.name}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Clinical Question</span>
                                    <div className={`border p-5 rounded-lg text-base leading-relaxed ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                        <p>{domain.clinicalQuestion}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Why This Matters</span>
                                    <p className={`text-[15px] leading-relaxed font-light ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {domain.whyMatters}
                                    </p>
                                </div>

                                <div className={`border p-5 rounded-lg flex items-start gap-4 ${isDarkMode ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className={`p-2 rounded-full shrink-0 ${isDarkMode ? 'bg-amber-800/40' : 'bg-amber-100'}`}>
                                        <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                                    </div>
                                    <div>
                                        <strong className={`block text-sm mb-1.5 font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>What ML cannot do</strong>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-amber-200/80' : 'text-amber-800/80'}`}>
                                            It cannot replace your clinical judgment. It can flag high-risk patients, but <span className="font-semibold underline">you make the final decision</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Process Table */}
                <motion.div variants={item} className="lg:col-span-7 h-full flex flex-col">
                    <div className={`rounded-xl overflow-hidden flex flex-col h-full backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-slate-800/80 border border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)]' : 'bg-white/95 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                        <div className={`p-5 sm:p-8 border-b ${isDarkMode ? 'border-slate-700/60 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                            <h2 className={`text-[10px] uppercase tracking-[0.25em] font-semibold flex items-center gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className={`p-2 rounded-md ${isDarkMode ? 'bg-slate-800 text-indigo-400 shadow-inner ring-1 ring-inset ring-slate-700' : 'bg-indigo-50 text-indigo-600 shadow-inner ring-1 ring-inset ring-indigo-100/50'}`}><BadgeInfo className="w-4 h-4" /></span>
                                <span>What Will Be Produced In Each Step</span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto grow">
                            <table className="w-full text-left border-collapse">
                                <tbody className={`text-[15px] border-none divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100/50'}`}>
                                    {[
                                        { id: 1, create: 'Clinical Brief', meaning: 'The problem we are solving, and the safety rules' },
                                        { id: 2, create: 'Data Profile', meaning: 'Understanding your patient dataset — who is in it and what is missing' },
                                        { id: 3, create: 'Preprocessing Recipe', meaning: 'Cleaning and preparing data so the model can learn correctly' },
                                        { id: 4, create: 'Trained Model', meaning: 'A computer programme that has learned patterns from past patients' },
                                        { id: 5, create: 'Evaluation Report', meaning: 'How accurately does the model predict readmission?' },
                                        { id: 6, create: 'Explanation', meaning: 'Why did the model flag a specific patient as high risk?' },
                                        { id: 7, create: 'Ethics Checklist', meaning: 'Is the model fair for all patient groups? Who oversees it?' },
                                    ].map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`group transition-colors duration-150 ${row.id === 1 ? (isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50') : isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="p-5 text-center relative">
                                                {row.id === 1 && <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}></div>}
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold ${row.id === 1
                                                    ? 'bg-indigo-600 text-white'
                                                    : isDarkMode
                                                        ? 'bg-slate-700 border border-slate-600 text-slate-400'
                                                        : 'bg-white border border-slate-200 text-slate-500'
                                                    }`}>
                                                    {row.id}
                                                </span>
                                            </td>
                                            <td className={`p-5 font-bold tracking-tight ${row.id === 1 ? (isDarkMode ? 'text-white' : 'text-indigo-900') : (isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900')}`}>
                                                {row.create}
                                            </td>
                                            <td className={`p-3 sm:p-5 leading-relaxed font-light ${row.id === 1 ? (isDarkMode ? 'text-indigo-200' : 'text-indigo-700') : (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-700')}`}>
                                                {row.meaning}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            </div>

        </motion.div>
    );
};

export default ClinicalContext;
