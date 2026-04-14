import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  CheckCircle2,
  FileText,
  Zap,
  Users,
  TrendingUp,
  Target,
  GitBranch,
  Play,
  ArrowDown,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Animation Helpers
   ──────────────────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1, transition: { duration: 0.8, delay } },
  viewport: { once: true, margin: '-60px' },
});

/* ────────────────────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────────────────────── */
const pipelineSteps = [
  {
    num: 1, label: 'Choose Specialty', icon: Stethoscope, color: '#6366f1',
    desc: 'Select from 20+ medical domains — Cardiology, Radiology, Oncology, and more. Each comes with a curated clinical dataset.',
  },
  {
    num: 2, label: 'Explore Data', icon: Database, color: '#0ea5e9',
    desc: 'Visualize your patient dataset. Inspect columns, spot missing values, and understand class distribution before training.',
  },
  {
    num: 3, label: 'Prepare Data', icon: Layers, color: '#8b5cf6',
    desc: 'Map column roles, handle missing values, and encode categories. Everything happens in an interactive guided interface.',
  },
  {
    num: 4, label: 'Train Model', icon: Brain, color: '#f59e0b',
    desc: 'Pick from 6 ML algorithms (KNN, SVM, Decision Tree, Random Forest, Logistic Regression, Naive Bayes). Adjust parameters in real time.',
  },
  {
    num: 5, label: 'Evaluate Results', icon: BarChart3, color: '#10b981',
    desc: 'Confusion matrices, ROC curves, accuracy, sensitivity, specificity — all explained in plain clinical language.',
  },
  {
    num: 6, label: 'Explain Predictions', icon: Eye, color: '#ec4899',
    desc: 'Feature importance and per-patient waterfall charts show exactly why the AI reached each prediction.',
  },
  {
    num: 7, label: 'Audit Ethics', icon: Shield, color: '#ef4444',
    desc: 'Subgroup bias detection, fairness metrics, and an EU AI Act risk checklist ensure responsible, compliant AI use.',
  },
];

const features = [
  { icon: Zap, title: 'Zero Setup Needed', desc: 'Open the browser and start. No installations, servers, or API keys — everything runs locally.', color: '#f59e0b' },
  { icon: Lock, title: '100% Private', desc: 'Your patient data never leaves your device. All computation happens client-side in the browser.', color: '#6366f1' },
  { icon: Sparkles, title: 'No Coding', desc: 'Designed for clinicians — point, click, and learn. Zero programming experience required.', color: '#ec4899' },
  { icon: TrendingUp, title: 'Real ML Algorithms', desc: 'Not a simulation. Real KNN, SVM, Decision Trees, Random Forest, Logistic Regression & Naive Bayes.', color: '#10b981' },
  { icon: Target, title: 'Clinical Context', desc: 'Every metric and chart is explained in healthcare language, not computer science jargon.', color: '#0ea5e9' },
  { icon: Shield, title: 'Ethics Built-in', desc: 'Fairness audits and EU AI Act compliance checks are embedded at every step.', color: '#ef4444' },
];

const allSpecialties = [
  'Cardiology', 'Radiology', 'Nephrology', 'Oncology — Breast', 'Neurology',
  'Endocrinology', 'Hepatology', 'Stroke', 'Mental Health', 'Pulmonology',
  'Haematology', 'Dermatology', 'Ophthalmology', 'Orthopaedics', 'ICU / Sepsis',
  'Obstetrics', 'Arrhythmia', 'Oncology — Cervical', 'Thyroid', 'Pharmacy',
];

const typedSpecialties = ['Cardiology', 'Oncology', 'Neurology', 'Radiology', 'Dermatology'];

/* ────────────────────────────────────────────────────────────────
   Animated Gradient Mesh Background
   ──────────────────────────────────────────────────────────────── */
const GradientMesh = ({ isDarkMode }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        x: [0, 30, 0],
        y: [0, -20, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute w-[800px] h-[800px] rounded-full blur-[120px]"
      style={{
        background: isDarkMode
          ? 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)'
          : 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
        top: '-20%', left: '-10%',
      }}
    />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        x: [0, -25, 0],
        y: [0, 30, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
      style={{
        background: isDarkMode
          ? 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)'
          : 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)',
        bottom: '-10%', right: '-5%',
      }}
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        x: [0, 15, 0],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      className="absolute w-[500px] h-[500px] rounded-full blur-[90px]"
      style={{
        background: isDarkMode
          ? 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)'
          : 'radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)',
        top: '40%', right: '10%',
      }}
    />
  </div>
);

/* ────────────────────────────────────────────────────────────────
   Animated Counter
   ──────────────────────────────────────────────────────────────── */
const AnimCounter = ({ value, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};


/* ════════════════════════════════════════════════════════════════
   COMPONENT — WelcomePage
   ════════════════════════════════════════════════════════════════ */
const WelcomePage = ({ isDarkMode, onGetStarted, toggleTheme }) => {
  // Typewriter
  const [typedText, setTypedText] = useState('');
  const [specIndex, setSpecIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = typedSpecialties[specIndex];
    const typingSpeed = isDeleting ? 35 : 90;
    const timeout = setTimeout(() => {
      if (!isDeleting && typedText === currentWord) {
        setTimeout(() => setIsDeleting(true), 2200);
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setSpecIndex((prev) => (prev + 1) % typedSpecialties.length);
      } else {
        setTypedText(isDeleting
          ? currentWord.substring(0, typedText.length - 1)
          : currentWord.substring(0, typedText.length + 1));
      }
    }, typingSpeed);
    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, specIndex]);

  // Scroll-driven background canvas
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const frameCount = 192;
    const images = [];
    let loadedCount = 0;

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(4, '0');
      img.src = `/bg-frames/frame_${frameNum}.jpg`;
      img.onload = () => { loadedCount++; if (i === 0 && loadedCount === 1) drawFrame(0); };
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
        drawWidth = canvas.width; drawHeight = canvas.width / imgRatio;
        offsetX = 0; offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height; drawWidth = canvas.height * imgRatio;
        offsetY = 0; offsetX = (canvas.width - drawWidth) / 2;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.6;
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    let rafId, targetFrame = 0, currentFrame = 0;
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      targetFrame = Math.min(Math.max(window.scrollY / maxScroll, 0), 1) * (frameCount - 1);
    };
    const renderLoop = () => {
      currentFrame += (targetFrame - currentFrame) * 0.1;
      drawFrame(Math.round(currentFrame));
      rafId = requestAnimationFrame(renderLoop);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    renderLoop();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);

  // Palette
  const bg = isDarkMode ? 'bg-[#0a0f1e]' : 'bg-[#f8fafc]';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const textTertiary = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const cardBg = isDarkMode
    ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
    : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-lg';
  const sectionBorder = isDarkMode ? 'border-white/[0.04]' : 'border-slate-100';

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-500 overflow-x-hidden`}>

      {/* ── THEME TOGGLE ──────────────────────────────────────── */}
      <div className="fixed top-6 right-6 lg:right-10 z-50">
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-2xl border transition-all duration-300 shadow-lg backdrop-blur-xl ${
            isDarkMode
              ? 'bg-white/[0.06] border-white/[0.1] text-amber-400 hover:bg-white/[0.1]'
              : 'bg-white/70 border-slate-200 text-indigo-600 hover:bg-white'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* ── SCROLL-DRIVEN BACKGROUND CANVAS ───────────────────── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: isDarkMode ? 0.3 : 0.25, mixBlendMode: isDarkMode ? 'screen' : 'multiply' }}
      />

      {/* ═══════════════════════════════════════════════════════════
         SECTION 1 — HERO
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <GradientMesh isDarkMode={isDarkMode} />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div {...fadeUp(0.1)}>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide uppercase border backdrop-blur-sm ${
              isDarkMode
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              Interactive ML Learning Platform
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            {...fadeUp(0.2)}
            className={`font-[Outfit] text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-[-0.03em] mt-8 mb-6 ${textPrimary}`}
          >
            Understand{' '}
            <span className="relative inline-block">
              <span className="gradient-text">AI in Healthcare</span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.3)}
            className={`text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-4 ${textSecondary}`}
          >
            Train real machine learning models on clinical datasets —
            without writing a single line of code.
          </motion.p>

          {/* Typewriter line */}
          <motion.p
            {...fadeUp(0.35)}
            className={`text-base sm:text-lg mb-10 ${textTertiary}`}
          >
            Currently training for{' '}
            <span className={`font-semibold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
          </motion.p>

          {/* CTA */}
          <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row gap-4 items-center">
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)',
                boxShadow: '0 12px 40px rgba(99,102,241,0.3)',
              }}
            >
              <Play className="w-4.5 h-4.5 fill-current" />
              Start Learning
              <ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
            <a
              href="#how-it-works"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              See how it works
              <ArrowDown className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            {...fadeUp(0.6)}
            className={`flex flex-wrap justify-center gap-x-8 gap-y-3 mt-14 text-[11px] font-semibold tracking-wider uppercase ${textTertiary}`}
          >
            {[
              { icon: Lock, text: 'Runs 100% in browser' },
              { icon: Shield, text: 'GDPR-friendly design' },
              { icon: Sparkles, text: 'No coding needed' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 ${textTertiary}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── BACKGROUND PREVIEW SPACER ─────────────────────────── */}
      <section className="relative z-10 min-h-[100vh] pointer-events-none" aria-hidden="true" />

      {/* ═══════════════════════════════════════════════════════════
         SECTION 2 — WHAT IS THIS TOOL?
         ═══════════════════════════════════════════════════════════ */}
      <section className={`relative z-10 border-t ${sectionBorder} py-24 px-6`}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeIn(0)}>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-6 ${
              isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Stethoscope className="w-3 h-3" /> What is this?
            </span>
            <h2 className={`font-[Outfit] text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-5 ${textPrimary}`}>
              An interactive classroom for{' '}
              <span className="gradient-text">medical AI</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${textSecondary}`}>
              HEALTH-AI lets doctors, nurses, and clinical researchers <strong>experience</strong> machine learning
              hands-on. Upload patient data, train real algorithms, interpret results, and audit fairness —
              all inside a guided 7-step pipeline.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: 20, suffix: '+', label: 'Medical Specialties', color: '#6366f1' },
              { value: 6, suffix: '', label: 'ML Algorithms', color: '#8b5cf6' },
              { value: 7, suffix: '', label: 'Guided Steps', color: '#10b981' },
              { value: 0, suffix: '', label: 'Lines of Code Needed', color: '#f59e0b' },
            ].map(({ value, suffix, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${cardBg}`}
              >
                <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ background: color }} />
                <div className={`text-3xl sm:text-4xl font-[Outfit] font-extrabold tracking-tight mb-1.5`} style={{ color }}>
                  <AnimCounter value={value} suffix={suffix} />
                </div>
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${textTertiary}`}>{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 3 — HOW IT WORKS (Pipeline)
         ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className={`relative z-10 border-t ${sectionBorder} py-24 px-6`}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeIn(0)}>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-6 ${
              isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <GitBranch className="w-3 h-3" /> 7-Step Pipeline
            </span>
            <h2 className={`font-[Outfit] text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-4 ${textPrimary}`}>
              From data to <span className="gradient-text">responsible decisions</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-xl mx-auto ${textSecondary}`}>
              Each step builds on the last. By the end, you'll have trained a model, evaluated it, and checked it for bias.
            </p>
          </motion.div>

          {/* Steps — Alternating layout */}
          <div className="relative">
            {/* Vertical Line */}
            <div className={`absolute left-6 md:left-1/2 top-0 bottom-0 w-px ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />

            {pipelineSteps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative flex items-start gap-6 mb-12 md:mb-16 ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-row`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                      whileInView={{ scale: [0.5, 1.15, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
                        boxShadow: `0 4px 20px ${step.color}30`,
                      }}
                    >
                      <step.icon className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Content card */}
                  <div className={`ml-16 md:ml-0 md:w-[calc(50%-40px)] ${isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                    <div className={`rounded-2xl p-6 border backdrop-blur-sm transition-all duration-300 ${cardBg}`}>
                      <div className={`flex items-center gap-2 mb-2 ${isLeft ? 'md:justify-end' : ''}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: step.color }}>
                          Step {step.num}
                        </span>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${textPrimary}`}>{step.label}</h3>
                      <p className={`text-sm leading-relaxed ${textSecondary}`}>{step.desc}</p>
                    </div>
                  </div>

                  {/* Spacer for other side */}
                  <div className="hidden md:block md:w-[calc(50%-40px)]" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 4 — FEATURES
         ═══════════════════════════════════════════════════════════ */}
      <section className={`relative z-10 border-t ${sectionBorder} py-24 px-6`}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" {...fadeIn(0)}>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-6 ${
              isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'
            }`}>
              <Sparkles className="w-3 h-3" /> Features
            </span>
            <h2 className={`font-[Outfit] text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-4 ${textPrimary}`}>
              Built for clinicians, <span className="gradient-text">by design</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-lg mx-auto ${textSecondary}`}>
              Every feature is crafted to make machine learning transparent, accessible, and clinically meaningful.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className={`group relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${cardBg}`}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-b-full opacity-40 group-hover:opacity-100 transition-opacity duration-300" style={{ background: color }} />

                {/* Background glow */}
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" style={{ background: color }} />

                <div className="relative z-10">
                  <div className="w-11 h-11 flex items-center justify-center rounded-xl mb-4 transition-colors" style={{ backgroundColor: `${color}12` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className={`text-[15px] font-bold mb-2 ${textPrimary}`}>{title}</h3>
                  <p className={`text-[13px] leading-relaxed ${textSecondary}`}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 5 — SPECIALTIES MARQUEE
         ═══════════════════════════════════════════════════════════ */}
      <section className={`relative z-10 border-t ${sectionBorder} py-20 px-0 overflow-hidden`}>
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div {...fadeIn(0)}>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-6 ${
              isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
            }`}>
              <Heart className="w-3 h-3" /> Specialties
            </span>
            <h2 className={`font-[Outfit] text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-3 ${textPrimary}`}>
              <span className="gradient-text">20 Medical Domains</span>
            </h2>
            <p className={`text-base max-w-md mx-auto mb-12 ${textSecondary}`}>
              Each specialty includes a curated clinical dataset and domain-specific context.
            </p>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="relative w-full overflow-hidden py-3">
          <div className="absolute top-0 left-0 w-32 h-full z-10" style={{ background: `linear-gradient(to right, ${isDarkMode ? '#0a0f1e' : '#f8fafc'}, transparent)` }} />
          <div className="absolute top-0 right-0 w-32 h-full z-10" style={{ background: `linear-gradient(to left, ${isDarkMode ? '#0a0f1e' : '#f8fafc'}, transparent)` }} />

          <motion.div
            className="flex min-w-max gap-3 pl-3"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 50 }}
          >
            {[...allSpecialties, ...allSpecialties].map((name, i) => (
              <div
                key={i}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-300 whitespace-nowrap ${
                  isDarkMode
                    ? 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md'
                }`}
              >
                {name}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 6 — WHO IS THIS FOR?
         ═══════════════════════════════════════════════════════════ */}
      <section className={`relative z-10 border-t ${sectionBorder} py-24 px-6`}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" {...fadeIn(0)}>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-6 ${
              isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              <Users className="w-3 h-3" /> Audience
            </span>
            <h2 className={`font-[Outfit] text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-4 ${textPrimary}`}>
              Who is this <span className="gradient-text">for?</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Stethoscope, title: 'Clinicians & Doctors', color: '#6366f1',
                desc: 'Understand what AI models are actually doing with patient data. Build intuition before clinical deployment decisions.',
              },
              {
                icon: Users, title: 'Students & Researchers', color: '#10b981',
                desc: 'Learn ML concepts through hands-on practice with real medical datasets — no programming setup required.',
              },
              {
                icon: Shield, title: 'Ethics Committees', color: '#f59e0b',
                desc: 'Evaluate AI fairness and bias. Built-in EU AI Act compliance checklists and subgroup auditing tools.',
              },
            ].map(({ icon: Icon, title, desc, color }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.5 }}
                className={`group relative p-7 rounded-2xl border transition-all duration-300 text-center overflow-hidden ${cardBg}`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none" style={{ background: color }} />
                <div className="relative z-10">
                  <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl mb-5" style={{ backgroundColor: `${color}10` }}>
                    <Icon className="w-7 h-7" style={{ color }} />
                  </div>
                  <h3 className={`text-[16px] font-bold mb-2 ${textPrimary}`}>{title}</h3>
                  <p className={`text-[13px] leading-relaxed ${textSecondary}`}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 7 — FINAL CTA
         ═══════════════════════════════════════════════════════════ */}
      <section className={`relative z-10 border-t ${sectionBorder} py-28 px-6`}>
        <GradientMesh isDarkMode={isDarkMode} />
        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center"
          {...fadeIn(0)}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 mx-auto mb-8 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              boxShadow: '0 8px 30px rgba(99,102,241,0.3)',
            }}
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className={`font-[Outfit] text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-5 ${textPrimary}`}>
            Ready to explore?
          </h2>
          <p className={`text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed ${textSecondary}`}>
            Pick a specialty, upload your data, train your first model —
            all within the safety of your own browser.
          </p>

          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-[16px] font-bold text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)',
              boxShadow: '0 16px 50px rgba(99,102,241,0.35)',
            }}
          >
            Launch HEALTH-AI
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </motion.button>

          <p className={`text-[11px] mt-6 ${textTertiary}`}>
            No sign up · No installation · 100% free
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className={`relative z-10 border-t ${sectionBorder} py-8 px-6`}>
        <div className={`max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] ${textTertiary}`}>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>HEALTH-AI</span>
            <span>ML Learning Tool</span>
          </div>
          <span>Version 1.0 · 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
