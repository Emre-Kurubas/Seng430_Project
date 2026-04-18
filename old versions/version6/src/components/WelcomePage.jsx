import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Brain,
  Shield,
  BarChart3,
  Database,
  Sparkles,
  Stethoscope,
  ChevronDown,
  Lock,
  Eye,
  Layers,
  Heart,
  Microscope,
  Pill,
  Syringe,
  Scan,
  HeartPulse,
  Sun,
  Moon,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Shared animation helpers
   ──────────────────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.09 } },
};

/* ────────────────────────────────────────────────────────────────
   Data Collections 
   ──────────────────────────────────────────────────────────────── */
const features = [
  { icon: Database, title: 'Interactive Data Upload', desc: 'Import CSV datasets or use built-in clinical examples. Privacy-first — all processing stays in your browser.', color: '#6366f1' },
  { icon: Brain, title: 'Six ML Algorithms', desc: 'From K-Nearest Neighbors to Random Forest — train, tune, and compare models with real-time feedback.', color: '#8b5cf6' },
  { icon: BarChart3, title: 'Visual Results', desc: 'Confusion matrices, ROC curves, and performance metrics explained in plain clinical language.', color: '#0ea5e9' },
  { icon: Eye, title: 'Explainability', desc: 'Feature importance charts and per-patient waterfall plots reveal why the AI made each prediction.', color: '#10b981' },
  { icon: Shield, title: 'Ethics & Fairness', desc: 'Subgroup bias audits and an EU AI Act compliance checklist ensure responsible AI use.', color: '#f59e0b' },
  { icon: Sparkles, title: 'No Coding Required', desc: 'Designed for doctors, nurses, and clinical researchers — zero programming experience needed.', color: '#ec4899' },
];

const pipelineSteps = [
  { num: 1, label: 'Clinical Context', icon: Stethoscope },
  { num: 2, label: 'Data Exploration', icon: Database },
  { num: 3, label: 'Data Preparation', icon: Layers },
  { num: 4, label: 'Model & Parameters', icon: Brain },
  { num: 5, label: 'Results', icon: BarChart3 },
  { num: 6, label: 'Explainability', icon: Eye },
  { num: 7, label: 'Ethics & Bias', icon: Shield },
];

const floatingIcons = [
  { Icon: Heart, x: '8%', y: '18%', delay: 0, size: 28 },
  { Icon: Microscope, x: '85%', y: '12%', delay: 0.4, size: 24 },
  { Icon: Pill, x: '78%', y: '72%', delay: 0.8, size: 22 },
  { Icon: Syringe, x: '12%', y: '75%', delay: 1.2, size: 20 },
  { Icon: Scan, x: '92%', y: '45%', delay: 0.6, size: 26 },
  { Icon: HeartPulse, x: '5%', y: '48%', delay: 1.0, size: 22 },
];

const allSpecialties = [
  'Cardiology', 'Radiology', 'Nephrology', 'Oncology – Breast', 'Neurology',
  'Endocrinology', 'Hepatology', 'Stroke', 'Mental Health', 'Pulmonology',
  'Haematology', 'Dermatology', 'Ophthalmology', 'Orthopaedics', 'ICU / Sepsis',
  'Obstetrics', 'Arrhythmia', 'Oncology – Cervical', 'Thyroid', 'Pharmacy',
];

const typedSpecialties = ['Cardiology', 'Oncology', 'Neurology', 'Dermatology'];

/* ════════════════════════════════════════════════════════════════
   COMPONENT — WelcomePage
   ════════════════════════════════════════════════════════════════ */
const WelcomePage = ({ isDarkMode, onGetStarted, toggleTheme }) => {
  const [scrollY, setScrollY] = useState(0);
  const canvasRef = React.useRef(null);

  // Typed Text State
  const [typedText, setTypedText] = useState('');
  const [specIndex, setSpecIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const currentWord = typedSpecialties[specIndex];
    const typingSpeed = isDeleting ? 40 : 100;
    
    const timeout = setTimeout(() => {
      if (!isDeleting && typedText === currentWord) {
        setTimeout(() => setIsDeleting(true), 2500);
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setSpecIndex((prev) => (prev + 1) % typedSpecialties.length);
      } else {
        const nextText = isDeleting 
          ? currentWord.substring(0, typedText.length - 1)
          : currentWord.substring(0, typedText.length + 1);
        setTypedText(nextText);
      }
    }, typingSpeed);
    
    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, specIndex]);

  // Overall Scroll Tracking
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-driven canvas frame rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const frameCount = 192; // Total extracted frames
    const images = [];
    let loadedCount = 0;

    // Preload frames
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(4, '0');
      img.src = `/bg-frames/frame_${frameNum}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (i === 0 && loadedCount === 1) drawFrame(0);
      };
      images.push(img);
    }

    const drawFrame = (index) => {
      if (!images[index] || !images[index].complete) return;
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
         canvas.width = window.innerWidth;
         canvas.height = window.innerHeight;
      }
      
      const img = images[index];
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetY = 0;
        offsetX = (canvas.width - drawWidth) / 2;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.8;
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    let rafId;
    let targetFrame = 0;
    let currentFrame = 0;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const fraction = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      targetFrame = fraction * (frameCount - 1);
    };

    const renderLoop = () => {
      currentFrame += (targetFrame - currentFrame) * 0.1;
      const frameIndex = Math.round(currentFrame);
      drawFrame(frameIndex);
      rafId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    renderLoop();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Shared palette
  const bg = isDarkMode ? 'bg-slate-900' : 'bg-[#f8fafc]';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const textTertiary = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const cardBg = isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200';
  const divider = isDarkMode ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300 overflow-x-hidden`}>

      {/* ── THEME TOGGLE ──────────────────────────────────────── */}
      <div className="absolute top-6 right-6 lg:right-10 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full border transition-all duration-300 shadow-lg backdrop-blur-md ${
            isDarkMode 
              ? 'bg-slate-800/60 border-slate-700 text-yellow-400 hover:bg-slate-700/80 hover:shadow-yellow-400/10' 
              : 'bg-white/60 border-white text-indigo-600 hover:bg-white/80 hover:shadow-indigo-500/10'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* ── SCROLL-DRIVEN BACKGROUND CANVAS ───────────────────── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen"
        style={{ opacity: isDarkMode ? 0.5 : 0.4 }}
      />

      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{
              background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
              top: '-10%', left: '-10%', transform: `translateY(${scrollY * 0.08}px)`,
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
              bottom: '-5%', right: '-8%', transform: `translateY(${-scrollY * 0.05}px)`,
            }}
          />
        </div>

        {/* Floating medical icons */}
        {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none hidden lg:block"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
            animate={{ opacity: isDarkMode ? 0.25 : 0.2, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.6 + delay, ease: 'easeOut' }}
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}>
              <div className={`p-3 rounded-2xl backdrop-blur-sm ${isDarkMode ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-indigo-500/[0.04] border border-indigo-500/[0.08]'}`}>
                <Icon size={size + 6} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} strokeWidth={1.5} />
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Hero content */}
        <motion.div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center w-full" variants={stagger} initial="initial" animate="animate">
          {/* Subtle opposing-color backdrop for readability */}
          <div className={`w-full max-w-2xl px-6 py-12 sm:p-14 rounded-[2.5rem] border ${isDarkMode ? 'bg-white/[0.04] border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.03)]' : 'bg-slate-900/[0.04] border-slate-900/10 shadow-[0_0_40px_rgba(0,0,0,0.03)]'}`}>
            
            {/* Badge */}
            <motion.div {...fadeUp(0)}>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border mb-8 ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                <Activity className="w-3 h-3" />
                ML Visualization Tool
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 {...fadeUp(0.1)} className={`font-[Outfit] text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-[-0.03em] mb-4 ${textPrimary}`}>
              Understand AI <br />
              <span className="gradient-text">in Healthcare</span>
            </motion.h1>

            {/* Subtitle - Typewriter */}
            <motion.p {...fadeUp(0.2)} className={`text-base sm:text-lg mb-10 h-6 ${textSecondary}`}>
               Train predictive medical models for{' '}
               <span className={`font-semibold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                 {typedText}
                 <span className="animate-pulse">|</span>
               </span>
            </motion.p>

            {/* CTA buttons */}
            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={onGetStarted} className="group relative flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div {...fadeUp(0.45)} className={`flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10 text-[11px] font-medium tracking-wide uppercase ${textTertiary}`}>
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> 100% Client-Side</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> GDPR Friendly</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> No Coding Needed</span>
            </motion.div>

          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 ${textTertiary}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}>
          <span className="text-[10px] font-medium tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ChevronDown className="w-4 h-4" /></motion.div>
        </motion.div>
      </section>

      {/* ── BACKGROUND PREVIEW SPACER ─────────────────────────── */}
      <section className="relative z-10 min-h-[120vh] pointer-events-none" aria-hidden="true" />

      {/* ── PIPELINE PREVIEW ──────────────────────────────────── */}
      <section className={`relative z-10 border-t ${divider} py-20 px-6`}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" {...fadeUp(0)} viewport={{ once: true, margin: '-80px' }} whileInView="animate" initial="initial">
            <h2 className={`font-[Outfit] text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-3 ${textPrimary}`}>Seven Guided Steps</h2>
            <p className={`text-sm sm:text-base max-w-lg mx-auto ${textSecondary}`}>From choosing a medical specialty to auditing model fairness — each step builds on the last.</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {pipelineSteps.map(({ num, label, icon: Icon }, idx) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                whileHover={{ y: -6, scale: 1.05 }}
                className={`interactive-card group relative flex flex-col items-center gap-2.5 w-[120px] sm:w-[130px] py-5 px-3 rounded-2xl border transition-colors duration-200 cursor-default ${cardBg}`}
              >
                <span className={`absolute -top-2.5 -right-2 w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-full ring-2 ${isDarkMode ? 'bg-indigo-600 text-white ring-slate-900' : 'bg-indigo-600 text-white ring-[#f8fafc]'}`}>
                  {num}
                </span>
                <div className={`p-2.5 rounded-xl transition-colors duration-200 ${isDarkMode ? 'bg-slate-700/60 group-hover:bg-indigo-500/20' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                  <Icon className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <span className={`text-[12px] font-semibold text-center leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────── */}
      <section className={`relative z-10 border-t ${divider} py-20 px-6`}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" {...fadeUp(0)} viewport={{ once: true, margin: '-80px' }} whileInView="animate" initial="initial">
            <h2 className={`font-[Outfit] text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-3 ${textPrimary}`}>Built for Clinicians, by Design</h2>
            <p className={`text-sm sm:text-base max-w-lg mx-auto ${textSecondary}`}>Every feature is crafted to make machine learning transparent, accessible, and clinically meaningful.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`interactive-card group relative p-6 rounded-2xl border transition-colors duration-200 cursor-pointer ${cardBg} overflow-hidden`}
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" style={{ backgroundColor: color }} />
                
                <div className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full opacity-50 group-hover:opacity-100 transition-opacity duration-300" style={{ background: color }} />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl mb-4" style={{ backgroundColor: `${color}12` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className={`text-[15px] font-bold mb-1.5 ${textPrimary}`}>{title}</h3>
                <p className={`text-[13px] leading-relaxed ${textSecondary}`}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES STRIP (ENDLESS MARQUEE) ───────────────── */}
      <section className={`relative z-10 border-t ${divider} py-16 px-0 overflow-hidden`}>
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div {...fadeUp(0)} viewport={{ once: true, margin: '-60px' }} whileInView="animate" initial="initial">
            <h2 className={`font-[Outfit] text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-3 ${textPrimary}`}>20 Medical Specialties</h2>
            <p className={`text-sm sm:text-base max-w-md mx-auto mb-10 ${textSecondary}`}>Cardiology, Oncology, Neurology, Dermatology, and more — each with curated datasets and clinical context.</p>
          </motion.div>
        </div>

        {/* Endless Marquee Strip */}
        <div className="relative w-full overflow-hidden py-4">
          {/* Subtle fade edges to blend into background */}
          <div className="absolute top-0 left-0 w-24 h-full z-10" style={{ background: `linear-gradient(to right, ${isDarkMode ? '#0f172a' : '#f8fafc'}, transparent)` }} />
          <div className="absolute top-0 right-0 w-24 h-full z-10" style={{ background: `linear-gradient(to left, ${isDarkMode ? '#0f172a' : '#f8fafc'}, transparent)` }} />

          <motion.div
             className="flex min-w-max gap-3 pl-3"
             animate={{ x: ["0%", "-50%"] }}
             transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
          >
             {[...allSpecialties, ...allSpecialties].map((name, i) => (
                <div
                  key={i}
                  className={`interactive-card px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg'
                  }`}
                >
                  {name}
                </div>
             ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className={`relative z-10 border-t ${divider} py-20 px-6`}>
        <motion.div className="max-w-2xl mx-auto text-center" {...fadeUp(0)} viewport={{ once: true, margin: '-60px' }} whileInView="animate" initial="initial">
          <h2 className={`font-[Outfit] text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-4 ${textPrimary}`}>Ready to Explore?</h2>
          <p className={`text-sm sm:text-base max-w-md mx-auto mb-8 ${textSecondary}`}>Pick a specialty, upload your data, and train your first model — all within your browser.</p>
          <button onClick={onGetStarted} className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
            Launch the Tool
            <ArrowRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className={`relative z-10 border-t ${divider} py-8 px-6`}>
        <div className={`max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] ${textTertiary}`}>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>HEALTH-AI</span>
            <span>ML Tool</span>
          </div>
          <span>Version 1.0 · March 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
