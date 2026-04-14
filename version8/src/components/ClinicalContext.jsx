import React from 'react';
import * as LucideIcons from 'lucide-react';
const { BadgeInfo, Stethoscope, AlertTriangle, ArrowRight, ArrowDown, CheckCircle2, Activity, ShieldCheck, Database, BrainCircuit, LineChart, FileText } = LucideIcons;
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FloatingParticles, containerAnim, itemAnim } from './StepShared';



/* ═══════════════════════════════════════════════════════════════
   Clinical Context - Step 1
═══════════════════════════════════════════════════════════════ */
const ClinicalContext = ({ domain, isDarkMode, onNext }) => {
    if (!domain) return null;
    const DomainIcon = LucideIcons[domain.icon || 'Activity'] || LucideIcons.Activity;
    const primaryStr = domain.theme?.primary || '#6366f1';
    const secondaryStr = domain.theme?.secondary || '#10b981';

    const steps = [
        { id: 1, title: 'Clinical Brief', desc: 'Define problem & safety rules', icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        { id: 2, title: 'Data Profile', desc: 'Understand the patient dataset', icon: Database, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 3, title: 'Preprocessing', desc: 'Clean and prepare the data', icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' },
        { id: 4, title: 'Trained Model', desc: 'Algorithm learns from past cases', icon: BrainCircuit, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200' },
        { id: 5, title: 'Evaluation', desc: 'Measure predictive accuracy', icon: LineChart, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200' },
        { id: 6, title: 'Explanation', desc: 'Why did the AI flag a patient?', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
        { id: 7, title: 'Ethics & Bias', desc: 'Ensure fairness for all groups', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    ];

    return (
        <motion.div variants={containerAnim} initial="hidden" animate="show" className="relative w-full pb-32">
            <FloatingParticles isDarkMode={isDarkMode} primaryStr={primaryStr} count={15} />


            <div className="relative z-10 w-full lg:max-w-6xl mx-auto space-y-8">
                
                {/* ═══════════════ HEADER ═══════════════ */}
                <motion.div variants={itemAnim} className="mb-2 w-full">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                                className={'w-10 h-10 rounded-2xl flex items-center justify-center ' + (isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100/80')}
                                style={{ boxShadow: `0 0 20px ${primaryStr}15` }}
                            >
                                <Stethoscope className="w-5 h-5" style={{ color: primaryStr }} />
                            </motion.div>
                            <span className={`text-[10px] tracking-[0.15em] font-bold uppercase ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Starting Point
                            </span>
                        </div>
                        <motion.button
                            onClick={onNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all duration-300"
                            style={{ backgroundColor: primaryStr, boxShadow: `0 8px 30px ${primaryStr}35` }}
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                    <motion.h2
                        className={'text-4xl sm:text-5xl font-extrabold tracking-tight ' + (isDarkMode ? 'text-white' : 'text-slate-900')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        Start With the{' '}<span style={{ background: `linear-gradient(135deg, ${primaryStr}, ${secondaryStr})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Clinical Question
                        </span>
                    </motion.h2>
                    <motion.p
                        className={'text-sm mt-3 max-w-xl leading-relaxed ' + (isDarkMode ? 'text-slate-400' : 'text-slate-600')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Every ML project in healthcare starts here — what exactly do we want to predict, and why does it matter for <strong>{domain.name}</strong>?
                    </motion.p>
                </motion.div>

                {/* ═══════════════ TOP REMINDER ═══════════════ */}
                <motion.div variants={itemAnim}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={'flex items-start gap-4 p-5 rounded-3xl border-2 transition-colors duration-300 shadow-sm ' 
                        + (isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200')}
                >
                    <div className={'p-2 rounded-xl shrink-0 ' + (isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100')}>
                        <CheckCircle2 className={'w-6 h-6 ' + (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')} />
                    </div>
                    <div className="mt-0.5">
                        <h4 className={'font-bold text-base mb-1 ' + (isDarkMode ? 'text-emerald-300' : 'text-emerald-800')}>Important Reminder</h4>
                        <p className={'text-sm leading-relaxed ' + (isDarkMode ? 'text-emerald-400/80' : 'text-emerald-900/80')}>
                            A human doctor or nurse must always review the model's suggestions. This tool helps you learn — <span className="font-semibold underline underline-offset-2">it does not make clinical decisions</span>.
                        </p>
                    </div>
                </motion.div>

                {/* ═══════════════ TWO COLUMN LAYOUT ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                    
                    {/* Left Col: Clinical Brief Card */}
                    <motion.div variants={itemAnim} className="lg:col-span-7 flex flex-col h-full">
                        <div className={'h-full rounded-[2rem] p-8 md:p-10 transition-all duration-300 flex flex-col relative overflow-hidden backdrop-blur-xl shadow-lg ' 
                            + (isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-blue-50/80 border border-blue-100')}>
                            
                            {/* Decorative background blob */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-40" style={{ background: primaryStr }} />

                            <div className="relative z-10 flex-grow pt-2">
                                {/* Domain Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${primaryStr}30` }}>
                                        <DomainIcon className="w-8 h-8" style={{ color: primaryStr }} />
                                    </div>
                                    <div>
                                        <div className={'text-[10px] font-bold uppercase tracking-widest mb-1 ' + (isDarkMode ? 'text-slate-400' : 'text-blue-500')}>Domain Focus</div>
                                        <h3 className="text-3xl font-black tracking-tight" style={{ color: primaryStr }}>{domain.name}</h3>
                                    </div>
                                </div>

                                {/* Question & Impact */}
                                <div className="space-y-6">
                                    <div className={'p-6 rounded-2xl border shadow-sm ' 
                                        + (isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-blue-100')}>
                                        <div className={'text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ' + (isDarkMode ? 'text-slate-400' : 'text-blue-500')}>
                                            <BadgeInfo className="w-4 h-4" /> Clinical Question
                                        </div>
                                        <p className={'text-base md:text-lg font-medium leading-relaxed ' + (isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                                            {domain.clinicalQuestion}
                                        </p>
                                    </div>

                                    <div className={'p-6 rounded-2xl border shadow-sm ' 
                                        + (isDarkMode ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100')}>
                                        <div className={'text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ' + (isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>
                                            <Activity className="w-4 h-4" /> Why This Matters
                                        </div>
                                        <p className={'text-[15px] font-light leading-relaxed ' + (isDarkMode ? 'text-indigo-200/90' : 'text-indigo-900/80')}>
                                            {domain.whyMatters}
                                        </p>
                                    </div>

                                    <div className={'p-6 rounded-2xl border shadow-sm flex items-start gap-4 ' 
                                        + (isDarkMode ? 'bg-amber-900/10 border-amber-500/30' : 'bg-amber-50 border-amber-200')}>
                                        <div className={'p-2 rounded-xl shrink-0 mt-0.5 ' + (isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100')}>
                                            <AlertTriangle className={'w-5 h-5 ' + (isDarkMode ? 'text-amber-400' : 'text-amber-600')} />
                                        </div>
                                        <div>
                                            <div className={'text-xs font-bold uppercase tracking-widest mb-1.5 ' + (isDarkMode ? 'text-amber-400' : 'text-amber-700')}>
                                                Boundary: What ML cannot do
                                            </div>
                                            <p className={'text-sm leading-relaxed ' + (isDarkMode ? 'text-amber-200/80' : 'text-amber-800/90')}>
                                                It cannot replace clinical judgment. It acts only as a supportive warning system by flagging high-risk patient patterns. You make the final decision.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Col: Timeline/Steps tracker */}
                    <motion.div variants={itemAnim} className="lg:col-span-5 h-full flex flex-col">
                        <div className={'h-full rounded-[2rem] p-8 transition-all duration-300 flex flex-col backdrop-blur-xl shadow-lg ' 
                            + (isDarkMode ? 'bg-slate-800/60 border border-slate-700' : 'bg-indigo-50/50 border border-indigo-100')}>
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className={'text-xs font-bold uppercase tracking-[0.2em] ' + (isDarkMode ? 'text-slate-400' : 'text-indigo-500/80')}>
                                    Pipeline Journey
                                </h3>
                            </div>
                            
                            <div className="flex-grow space-y-0 relative">
                                {/* Connecting line */}
                                <div className={'absolute top-6 bottom-8 left-[1.15rem] w-px ' + (isDarkMode ? 'bg-slate-700' : 'bg-indigo-200')} />

                                {steps.map((step, i) => {
                                    const Icn = step.icon;
                                    const isActive = step.id === 1;
                                    const isPast = false; // We are on step 1

                                    return (
                                        <motion.div 
                                            key={step.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + (i * 0.08) }}
                                            className="relative z-10 flex flex-col gap-3 pb-6 last:pb-0"
                                        >
                                            <div className="flex items-start gap-4 group">
                                                {/* Icon Node */}
                                                <div className={'w-[2.3rem] h-[2.3rem] rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ' +
                                                    (isActive 
                                                        ? `bg-white ${primaryStr ? 'shadow-[0_0_15px_rgba(99,102,241,0.4)]' : ''}` 
                                                        : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                                                    )}
                                                    style={{ borderColor: isActive ? primaryStr : undefined }}
                                                >
                                                    {isActive ? (
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryStr, boxShadow: `0 0 10px ${primaryStr}` }} />
                                                    ) : (
                                                        <span className={'text-xs font-bold ' + (isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{step.id}</span>
                                                    )}
                                                </div>

                                                {/* Content Card */}
                                                <div className={'flex-grow rounded-2xl p-4 transition-all duration-300 border ' 
                                                    + (isActive 
                                                        ? (isDarkMode ? 'bg-slate-800 border-slate-600 shadow-lg' : 'bg-white border-indigo-100 shadow-md') 
                                                        : (isDarkMode ? 'bg-white/[0.02] border-transparent hover:bg-slate-800 hover:border-slate-700' : 'bg-transparent border-transparent hover:bg-white/60 hover:border-indigo-100/50')
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icn className={'w-4 h-4 ' + (isActive ? (isDarkMode ? 'text-slate-200' : 'text-indigo-600') : (isDarkMode ? 'text-slate-500' : 'text-slate-400'))} />
                                                        <h4 className={'font-bold text-sm ' + (isActive ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-600'))}>
                                                            {step.title}
                                                        </h4>
                                                        {isActive && (
                                                            <span className="ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={'text-xs leading-relaxed ' + (isActive ? (isDarkMode ? 'text-slate-300' : 'text-slate-600') : (isDarkMode ? 'text-slate-500' : 'text-slate-500'))}>
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default ClinicalContext;
