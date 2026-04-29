import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Brain,
  Shield,
  BarChart3,
  Database,
  Sparkles,
  Stethoscope,
  Eye,
  Layers,
  Sun,
  Moon,
  Play,
  Heart,
  Cpu,
  CheckCircle2,
  Lock,
  Target,
  Users,
  FileText,
  AlertTriangle,
  Scale,
  FlaskConical,
  Microscope,
  TrendingUp,
  Thermometer,
  Pill,
  Syringe,
  ActivitySquare,
  QrCode
} from 'lucide-react';
import { DetailedDoctor } from './ProgressThermometer';
import ProgressThermometer from './ProgressThermometer';

/* ────────────────────────────────────────────────────────────────
   Feature Steps (the 7 scroll-driven views)
   ──────────────────────────────────────────────────────────────── */
const featureSteps = [
  {
    id: 'specialty',
    icon: Stethoscope,
    heading: 'CHOOSE YOUR\nSPECIALTY',
    description:
      'Select from 20+ clinical domains — Cardiology, Oncology, Neurology, and more. Each specialty includes a curated patient dataset and real clinical context so you can learn ML through cases that matter.',
    cta: 'Start Learning',
    color: '#facc15',
    images: ['/each_step/step1.png']
  },
  {
    id: 'explore',
    icon: Database,
    heading: 'EXPLORE\nYOUR DATA',
    description:
      'Visualize your dataset column by column. Spot missing values, understand distributions, and inspect class balance — all before touching a model. Interactive charts let you build intuition about the data.',
    cta: 'Start Learning',
    color: '#0ea5e9',
    images: ['/each_step/step2.png']
  },
  {
    id: 'prepare',
    icon: Layers,
    heading: 'PREPARE\n& CLEAN',
    description:
      'Map column roles — features vs. target vs. drop. Handle missing values with mean, median, or mode. Encode categorical variables. Normalize scales. Everything happens interactively, just point and click.',
    cta: 'Start Learning',
    color: '#8b5cf6',
    images: ['/each_step/step3.png']
  },
  {
    id: 'train',
    icon: Brain,
    heading: 'TRAIN\nML MODELS',
    description:
      'Choose from 6 real machine learning algorithms — KNN, Decision Tree, Random Forest, SVM, Logistic Regression, and Naive Bayes. Adjust hyperparameters with live sliders and train directly in your browser.',
    cta: 'Start Learning',
    color: '#f59e0b',
    images: ['/each_step/step4.png']
  },
  {
    id: 'evaluate',
    icon: BarChart3,
    heading: 'EVALUATE\nRESULTS',
    description:
      'Confusion matrices, ROC curves, precision, recall, F1 score — all explained in plain clinical language. Compare multiple models side by side and understand exactly what each metric means for patient care.',
    cta: 'Start Learning',
    color: '#10b981',
    images: ['/each_step/step5.png']
  },
  {
    id: 'explain',
    icon: Eye,
    heading: 'EXPLAIN\nPREDICTIONS',
    description:
      'Feature importance charts and per-patient waterfall plots show exactly why the model reached each prediction. Understand which clinical variables drive the AI — no black boxes allowed.',
    cta: 'Start Learning',
    color: '#ec4899',
    images: ['/each_step/step6.png']
  },
  {
    id: 'ethics',
    icon: Shield,
    heading: 'AUDIT\nFOR BIAS',
    description:
      'Subgroup fairness metrics, demographic bias detection, and an EU AI Act compliance checklist ensure your model is safe for real-world use. Responsible AI is built in, not bolted on.',
    cta: 'Start Learning',
    color: '#ef4444',
    images: ['/each_step/step7.png']
  },
];

/* ────────────────────────────────────────────────────────────────
   Preview Card Components
   ──────────────────────────────────────────────────────────────── */

/* Legacy preview components removed in favor of image assets */

/* ════════════════════════════════════════════════════════════════
   COMPONENT — StepBackgrounds
   ════════════════════════════════════════════════════════════════ */
const StepBackgrounds = ({ activeStep }) => {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      borderRadius: '32px'
    }}>
      <AnimatePresence>
        {activeStep === 0 && (
          <motion.div
            key="bg-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '15%', left: '0%', width: '50%', height: '80%' }}
          >
            {/* Heartrate ECG - Moved to the left/center behind text */}
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
              <motion.path
                d="M 0 100 L 100 100 L 120 70 L 140 180 L 170 20 L 190 100 L 500 100"
                fill="none"
                stroke="#ef4444"
                strokeWidth="8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </motion.div>
        )}

        {activeStep === 1 && (
          <motion.div
            key="bg-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '10%', left: '40%', width: '300px', height: '300px' }}
          >
            {/* Magnifying Glass Searching */}
            <motion.svg
              viewBox="0 0 24 24"
              fill="none" stroke="#0ea5e9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              animate={{
                x: [0, -150, -50, 100, 0],
                y: [0, 80, -50, -20, 0],
                rotate: [0, -25, 10, -5, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </motion.svg>
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div
            key="bg-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '15%', left: '30%', width: '60%', height: '70%' }}
          >
            {/* Line Graph - Smooth glowing data curve */}
            <svg viewBox="0 0 500 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid lines */}
              <path d="M 50 250 L 450 250 M 50 200 L 450 200 M 50 150 L 450 150 M 50 100 L 450 100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {/* Line Graph Path */}
              <motion.path
                d="M 50 250 C 100 250, 150 150, 200 120 C 250 90, 300 180, 350 100 C 400 20, 420 50, 450 40"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              />
              {/* Data Points */}
              {[
                { cx: 50, cy: 250 }, { cx: 200, cy: 120 }, { cx: 350, cy: 100 }, { cx: 450, cy: 40 }
              ].map((pt, i) => (
                <motion.circle
                  key={i} cx={pt.cx} cy={pt.cy} r="6" fill="#fff"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.6, duration: 0.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 1.5 }}
                />
              ))}
            </svg>
          </motion.div>
        )}

        {activeStep === 3 && (
          <motion.div
            key="bg-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '5%', left: '15%', width: '30%', height: '70%' }}
          >
            {/* Floating Book providing info - Moved to the left slightly */}
            <motion.svg
              viewBox="0 0 24 24"
              fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              {/* Animated Pages/Information floating out */}
              <motion.path d="M14 8h4" strokeWidth="0.5" initial={{ opacity: 0, x: -5 }} animate={{ opacity: [0, 1, 0], x: 5 }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
              <motion.path d="M14 12h4" strokeWidth="0.5" initial={{ opacity: 0, x: -5 }} animate={{ opacity: [0, 1, 0], x: 5 }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
              <motion.path d="M14 16h4" strokeWidth="0.5" initial={{ opacity: 0, x: -5 }} animate={{ opacity: [0, 1, 0], x: 5 }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
            </motion.svg>
          </motion.div>
        )}

        {activeStep === 4 && (
          <motion.div
            key="bg-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '15%', left: '35%', width: '400px', height: '400px' }}
          >
            {/* Target / Radar pulses representing Evaluation */}
            <motion.svg viewBox="0 0 100 100" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="25" strokeDasharray="4 4" />
              <circle cx="50" cy="50" r="40" opacity="0.5" />
              <motion.circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="1"
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} />
              {/* Radar Sweeping line */}
              <motion.line x1="50" y1="50" x2="50" y2="10" stroke="#10b981" strokeWidth="1.5"
                initial={{ rotate: 0, originX: "50px", originY: "50px" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
            </motion.svg>
          </motion.div>
        )}

        {activeStep === 5 && (
          <motion.div
            key="bg-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '25%', left: '40%', width: '40%', height: '50%' }}
          >
            {/* Outline of a Brain / Network Nodes for Explanation */}
            <svg viewBox="0 0 200 200" fill="none" stroke="#ec4899" strokeWidth="2">
              <path d="M 60,60 C 20,40 20,120 60,140 C 50,180 150,180 140,140 C 180,120 180,40 140,60 C 120,20 80,20 60,60" />
              {[
                {cx: 60, cy: 60}, {cx: 140, cy: 60}, {cx: 60, cy: 140}, {cx: 140, cy: 140}, {cx: 100, cy: 100}
              ].map((node, i) => (
                <motion.circle key={i} cx={node.cx} cy={node.cy} r="5" fill="#ec4899"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }} />
              ))}
              <motion.line x1="60" y1="60" x2="100" y2="100" strokeDasharray="4" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <motion.line x1="140" y1="60" x2="100" y2="100" strokeDasharray="4" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }} />
              <motion.line x1="60" y1="140" x2="100" y2="100" strokeDasharray="4" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, delay: 1, repeat: Infinity }} />
              <motion.line x1="140" y1="140" x2="100" y2="100" strokeDasharray="4" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, delay: 1.5, repeat: Infinity }} />
            </svg>
          </motion.div>
        )}

        {activeStep === 6 && (
          <motion.div
            key="bg-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', top: '10%', left: '42%', width: '350px', height: '400px' }}
          >
            {/* Shield with Scanning line for Bias Auditing */}
            <svg viewBox="0 0 100 120" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M 50 10 L 10 30 L 10 70 C 10 95 35 110 50 115 C 65 110 90 95 90 70 L 90 30 Z" />
              <motion.line x1="10" y1="50" x2="90" y2="50" stroke="#ef4444" strokeWidth="3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: [20, 100, 20], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
              <path d="M 35 60 L 45 70 L 70 40" strokeWidth="4" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   COMPONENT — WelcomePage
   ════════════════════════════════════════════════════════════════ */
const WelcomePage = ({ isDarkMode, onGetStarted, toggleTheme }) => {
  const showcaseScrollRef = useRef(null);
  const heroRef = useRef(null);
  const transitionRef = useRef(null);
  const totalSteps = featureSteps.length;
  const [activeStep, setActiveStep] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1);

  // ── Section snap scrolling ──────────────────────────────────────
  const isSnappingRef = useRef(false);
  const scrollAccumRef = useRef(0);
  const SCROLL_THRESHOLD = 200;
  const SNAP_COOLDOWN = 2000;

  React.useEffect(() => {
    const sectionRefs = [heroRef, transitionRef, showcaseScrollRef];

    const getCurrentSectionIndex = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (let i = sectionRefs.length - 1; i >= 0; i--) {
        const el = sectionRefs[i].current;
        if (el && scrollY >= el.offsetTop) return i;
      }
      return 0;
    };

    // Custom smooth scroll with easing for a slow, buttery glide
    const smoothScrollTo = (targetY, duration = 1400) => {
      const startY = window.scrollY;
      const diff = targetY - startY;
      let startTime = null;

      const easeInOutCubic = (t) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        window.scrollTo(0, startY + diff * eased);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => {
            isSnappingRef.current = false;
            scrollAccumRef.current = 0;
          }, 400);
        }
      };

      requestAnimationFrame(step);
    };

    const snapToSection = (index) => {
      const el = sectionRefs[index]?.current;
      if (!el) return;
      isSnappingRef.current = true;
      scrollAccumRef.current = 0;
      smoothScrollTo(el.offsetTop, 1400);
    };

    const handleWheel = (e) => {
      // While an auto-scroll is playing, block all native scrolling
      if (isSnappingRef.current) {
        e.preventDefault();
        return;
      }

      // Check if we're inside the showcase section — let its own scroll logic work
      const showcaseEl = showcaseScrollRef.current;
      if (showcaseEl) {
        const rect = showcaseEl.getBoundingClientRect();
        const insideShowcase = rect.top <= 10 && rect.bottom > window.innerHeight;
        if (insideShowcase) {
          scrollAccumRef.current = 0;
          return; // allow native scroll for the showcase step logic
        }
      }

      // Block native scroll for hero/transition sections
      e.preventDefault();

      scrollAccumRef.current += e.deltaY;

      if (Math.abs(scrollAccumRef.current) > SCROLL_THRESHOLD) {
        const currentIdx = getCurrentSectionIndex();
        const dir = scrollAccumRef.current > 0 ? 1 : -1;
        const nextIdx = Math.max(0, Math.min(sectionRefs.length - 1, currentIdx + dir));

        if (nextIdx !== currentIdx) {
          snapToSection(nextIdx);
        } else {
          scrollAccumRef.current = 0;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Measure the scroll progress *only* within the showcase section
  const { scrollYProgress } = useScroll({
    target: showcaseScrollRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    let step = Math.floor(latest * totalSteps);
    if (step >= totalSteps) step = totalSteps - 1;
    if (step < 0) step = 0;

    if (step !== activeStep) {
      setScrollDirection(step > activeStep ? 1 : -1);
      setActiveStep(step);
    }
  });

  // Custom slow scrolling function taking duration in ms
  const slowScrollTo = (targetY, duration = 1500) => {
    const startY = window.pageYOffset;
    const difference = targetY - startY;
    let startTime = null;

    const easeInOutCubic = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t * t + b;
      t -= 2;
      return (c / 2) * (t * t * t + 2) + b;
    };

    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const nextY = easeInOutCubic(timeElapsed, startY, difference, duration);
      window.scrollTo(0, nextY);
      if (timeElapsed < duration) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
      }
    };

    window.requestAnimationFrame(step);
  };

  const handleIconClick = (index) => {
    if (!showcaseScrollRef.current) return;
    const targetProgress = index / totalSteps;
    const yPx = showcaseScrollRef.current.offsetTop + (targetProgress * (showcaseScrollRef.current.offsetHeight - window.innerHeight));

    slowScrollTo(yPx + 10, 1000); // 1-second comfortable scroll for icon taps
  };

  const current = featureSteps[activeStep];



  return (
    <div className="landing-wrapper">
      {/* ────────────────────────────────────────────────────────────────
          HERO SECTION (Takes up first 100vh)
          ──────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-badge"
          >
            INTERACTIVE MEDICAL AI
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="hero-heading"
          >
            THE MODERN WAY<br />TO LEARN ML
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onClick={() => {
              slowScrollTo(window.innerHeight, 1600); // 1.6s cinematic scroll down
            }}
            className="hero-start-btn"
          >
            Explore the pipeline
          </motion.button>
        </div>

        {/* Abstract shapes / elements floating around */}
        <div className="hero-background-elements">
          <div className="hero-mockup-positioner">
            {/* Main Floating Wrapper */}
            <motion.div
              className="hero-mockup-wrapper"
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            >
              {/* Pixel art doctor peeking left */}
              <motion.div
                className="hero-peek-doctor"
                animate={{ y: [0, 10, 0], rotate: [-20, -15, -20] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              >
                <DetailedDoctor color="#facc15" pixelSize={10} />
              </motion.div>

              {/* QR Code flying backward top right */}
              <motion.div
                className="hero-peek-qr"
                animate={{ y: [0, -20, 0], rotate: [12, 18, 12] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
              >
                <QrCode size={70} color="#000" />
              </motion.div>

              <motion.img
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                src="/hero-mockup.png"
                alt="Dashboard Preview"
                className="hero-main-mockup"
              />
              {/* The shiny screen protector effect */}
              <div className="hero-mockup-glare"></div>
            </motion.div>
          </div>

          <div className="hero-shape hero-starburst"></div>
          <div className="hero-shape hero-circle hero-circle-1"><Thermometer size={34} color="#fff" opacity={0.5} /></div>
          <div className="hero-shape hero-circle hero-circle-2"><ActivitySquare size={24} color="#fff" opacity={0.6} /></div>
          <div className="hero-shape hero-circle hero-circle-3"><Syringe size={40} color="#fff" opacity={0.4} /></div>
          <div className="hero-shape hero-circle hero-circle-4"><Pill size={20} color="#fff" opacity={0.7} /></div>
        </div>
      </section>

      {/* Diagonal Scrolling Marquee (Yellow Stripe) - Placed below the fold */}
      <div className="hero-marquee-container">
        <div className="hero-marquee">
          <div className="hero-marquee-track">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="hero-marquee-content">
                <span>INTERACTIVE ML</span><span className="bullet">•</span>
                <span>NO CODING REQUIRED</span><span className="bullet">•</span>
                <span>RUNS IN BROWSER</span><span className="bullet">•</span>
                <span>20 CLINICAL DOMAINS</span><span className="bullet">•</span>
                <span>BIAS & ETHICS AUDITING</span><span className="bullet">•</span>
                <span>EXPLAINABLE AI</span><span className="bullet">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          TRANSITION SECTION (Reveals on scroll)
          ──────────────────────────────────────────────────────────────── */}
      <section ref={transitionRef} className="transition-hero-section">
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="transition-heading"
        >
          ALL THE ML PIPELINE TOOLS<br />YOU NEED IN ONE PLACE
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="transition-subheading"
        >
          Everything you need to seamlessly understand medical AI.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          onClick={() => {
            if (showcaseScrollRef.current) {
              slowScrollTo(showcaseScrollRef.current.offsetTop, 1600); // 1.6s cinematic scroll into the showcase
            }
          }}
          className="hero-start-btn transition-btn"
        >
          Begin Exploration
        </motion.button>
      </section>

      {/* ────────────────────────────────────────────────────────────────
          SHOWCASE SECTION (Tall container for native scrolling)
          ──────────────────────────────────────────────────────────────── */}
      <section ref={showcaseScrollRef} className="showcase-scroll-container" style={{ height: `${totalSteps * 40}vh` }}>

        {/* This inner div sticks to the top as we scroll down the showcase section */}
        <div className="sticky-showcase-view">

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 140, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="landing-card"
          >

            {/* Background Animations Layer */}
            <StepBackgrounds activeStep={activeStep} />

            {/* ── Vertical Icon Sidebar ────────────────────────── */}
            <div className="landing-sidebar">
              {featureSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => handleIconClick(i)}
                    className={`landing-icon-btn ${isActive ? 'active' : ''}`}
                    whileHover={{ scale: 1.12, zIndex: 20 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      '--icon-color': '#fff',
                      background: isActive ? '#fff' : '#1a1b21',
                      color: isActive ? '#111' : 'rgba(255,255,255,0.4)',
                      boxShadow: isActive ? '0 4px 20px rgba(255,255,255,0.25)' : '0 4px 12px rgba(0,0,0,0.4)',
                      zIndex: isActive ? 10 : 1,
                    }}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                  </motion.button>
                );
              })}
            </div>

            {/* ── Content Area ─────────────────────────────────── */}
            <div className="landing-content-area">
              <AnimatePresence mode="wait" custom={scrollDirection}>
                <motion.div
                  key={activeStep}
                  className="landing-content-inner"
                  initial="enter"
                  animate="center"
                  exit="exit"
                  custom={scrollDirection}
                >
                  {/* Left — text */}
                  <motion.div
                    className="landing-text-section"
                    style={{ zIndex: 1 }}
                    variants={{
                      enter: (dir) => ({ opacity: 0, y: dir > 0 ? 60 : -60, scale: 0.92, filter: 'blur(8px)' }),
                      center: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
                      exit: (dir) => ({ opacity: 0, y: dir > 0 ? -60 : 60, scale: 0.92, filter: 'blur(8px)' }),
                    }}
                    custom={scrollDirection}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="landing-step-indicator" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <current.icon size={14} />
                      <span>Step {activeStep + 1} of {totalSteps}</span>
                    </div>

                    <h1 className="landing-heading">
                      {current.heading.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < current.heading.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </h1>

                    <p className="landing-description">{current.description}</p>

                    <motion.button
                      onClick={onGetStarted}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="landing-cta-btn"
                      style={{ background: '#fff', color: '#111', boxShadow: '0 8px 30px rgba(255,255,255,0.15)' }}
                    >
                      <Play size={16} style={{ fill: 'currentColor' }} />
                      {current.cta}
                      <ArrowRight size={16} />
                    </motion.button>
                  </motion.div>

                  {/* Right — photos */}
                  <motion.div
                    className="landing-preview-section"
                    style={{ zIndex: 15 }}
                    variants={{
                      enter: { opacity: 0, x: 600, rotateY: 25 },
                      center: { opacity: 1, x: 0, rotateY: 0 },
                      exit: { opacity: 0, x: 600, rotateY: -25 },
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className={`preview-images-container ${current.images.length === 1 ? 'layout-single' : `layout-step-${activeStep + 1}`}`}>
                      {current.images.map((imgSrc, j) => (
                        <div
                          key={`${current.id}-${j}`}
                          className={`preview-img-wrapper preview-img-${j}`}
                          style={{ transform: 'rotateY(-15deg) rotateX(6deg)' }}
                        >
                          <img src={imgSrc} alt={`${current.heading} preview ${j}`} className="preview-img" />
                          <div className="preview-glare"></div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>

        </div>

      </section>

    </div>
  );
};

export default WelcomePage;
