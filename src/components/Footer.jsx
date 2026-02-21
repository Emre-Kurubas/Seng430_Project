import React from 'react';
import { ArrowRight, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <motion.footer
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 100 }}
            className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none z-50"
        >
            <div className="max-w-5xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 pl-6 pr-2 rounded-full shadow-2xl shadow-slate-900/40 flex justify-between items-center text-white pointer-events-auto ring-1 ring-white/20">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase drop-shadow-sm">Step 1 / 7</span>
                    <span className="text-sm font-bold text-slate-100 tracking-wide">Clinical Context</span>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-3 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <ChevronUp className="w-5 h-5" />
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-emerald-50 transition-colors flex items-center space-x-2 shadow-lg shadow-white/10 group"
                    >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform text-emerald-600" />
                    </motion.button>
                </div>
            </div>
        </motion.footer>
    );
};

export default Footer;
