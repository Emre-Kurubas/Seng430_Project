import React, { useState } from 'react';
import { motion } from 'framer-motion';

const STEP_LABELS = ['Context', 'Explore', 'Prepare', 'Model', 'Results', 'Explain', 'Ethics'];
const PX = 4; // pixel size for the doctor sprite

const ProgressThermometer = ({ currentStep, totalSteps = 7, color = '#007aff', isDarkMode }) => {
  const fillPercent = (currentStep / totalSteps) * 100;

  const glassBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';
  const glassBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        right: 40,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        pointerEvents: 'auto',
      }}
    >
      {/* Step labels — left of the tube */}
      <div
        style={{
          height: 500,
          display: 'flex',
          flexDirection: 'column-reverse',
          justifyContent: 'space-between',
          paddingBottom: 14,
          paddingTop: 10,
        }}
      >
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCurrent = currentStep === stepNum;
          const isPast = currentStep > stepNum;
          return (
            <motion.div
              key={stepNum}
              initial={false}
              animate={{
                opacity: isHovered ? (isCurrent ? 1 : isPast ? 0.55 : 0.18) : 0,
                x: isHovered ? (isCurrent ? 0 : 4) : 20,
                scale: isCurrent && isHovered ? 1.08 : 1,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                fontSize: isCurrent ? '0.6rem' : '0.5rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? color : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'),
                whiteSpace: 'nowrap',
                textAlign: 'right',
                letterSpacing: '-0.01em',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                pointerEvents: isHovered ? 'auto' : 'none'
              }}
            >
              <span style={{
                fontSize: '0.5rem',
                fontWeight: 600,
                opacity: isCurrent ? 0.8 : 0.5,
                minWidth: 10,
                textAlign: 'right',
              }}>
                {stepNum}
              </span>
              {label}
              {isCurrent && (
                <motion.div
                  layoutId="thermo-active"
                  style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}80`,
                    marginLeft: 1,
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* The tube column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* ─── Detailed Pixel Art Doctor ─── */}
        <div style={{ position: 'relative', width: 42, height: 48, marginBottom: -4, zIndex: 5 }}>
          <DetailedDoctor color={color} />

          {/* Left Leg */}
          <motion.div
            animate={{ rotate: [-20, 25, -20] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: -10,
              left: 10,
              width: 5, height: 16,
              background: '#2c5ea8',
              transformOrigin: 'top center',
              borderRadius: '0 0 2px 2px',
            }}
          >
            <div style={{
              position: 'absolute', bottom: 0, left: -2, width: 9, height: 4,
              background: '#222', borderRadius: '0 0 2px 2px',
            }} />
          </motion.div>

          {/* Right Leg */}
          <motion.div
            animate={{ rotate: [25, -20, 25] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: -10,
              left: 27,
              width: 5, height: 16,
              background: '#2c5ea8',
              transformOrigin: 'top center',
              borderRadius: '0 0 2px 2px',
            }}
          >
            <div style={{
              position: 'absolute', bottom: 0, left: -2, width: 9, height: 4,
              background: '#222', borderRadius: '0 0 2px 2px',
            }} />
          </motion.div>
        </div>

        {/* Glass tube */}
        <div
          style={{
            position: 'relative',
            width: 34,
            height: 500,
            borderRadius: 20,
            background: glassBg,
            border: `1.5px solid ${glassBorder}`,
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isDarkMode
              ? 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 8px 40px rgba(0,0,0,0.25)'
              : 'inset 0 0 0 1px rgba(255,255,255,0.5), 0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          {/* Tick marks — left */}
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                bottom: `${((i + 1) / totalSteps) * 100}%`,
                width: 10,
                height: 1,
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            />
          ))}

          {/* Tick marks — right */}
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={`r${i}`}
              style={{
                position: 'absolute',
                right: 0,
                bottom: `${((i + 1) / totalSteps) * 100}%`,
                width: 6,
                height: 1,
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              }}
            />
          ))}

          {/* Liquid fill */}
          <motion.div
            initial={false}
            animate={{ height: `${fillPercent}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              borderRadius: '0 0 18px 18px',
              background: `linear-gradient(0deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
              boxShadow: `0 -8px 30px ${color}30`,
            }}
          >
            {/* Meniscus */}
            <motion.div
              animate={{ scaleX: [1, 1.25, 0.8, 1.15, 1], y: [0, -2.5, 1, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: -5, left: -2, right: -2,
                height: 10, borderRadius: '50%',
                background: color, filter: 'brightness(1.35)',
              }}
            />

            {/* Bubbles */}
            {[0.12, 0.4, 0.65, 0.85].map((pos, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -22, -12, -35, 0],
                  opacity: [0, 0.6, 0.3, 0.08, 0],
                }}
                transition={{
                  duration: 3.5 + i * 0.6,
                  repeat: Infinity,
                  delay: i * 1.2,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  bottom: `${pos * 100}%`,
                  left: `${20 + i * 18}%`,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </motion.div>

          {/* Glass highlight */}
          <div
            style={{
              position: 'absolute', top: 10, left: 4,
              width: 6, height: '80%', borderRadius: 6,
              background: isDarkMode
                ? 'linear-gradient(180deg, rgba(255,255,255,0.07), transparent 50%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent 50%)',
            }}
          />
        </div>

        {/* Bulb */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 50, height: 50,
            borderRadius: '50%',
            marginTop: -10,
            background: `radial-gradient(circle at 35% 35%, ${color}ee, ${color})`,
            border: `1.5px solid ${glassBorder}`,
            boxShadow: `0 8px 28px ${color}50, inset 0 -3px 8px rgba(0,0,0,0.15)`,
            position: 'relative', zIndex: 1,
          }}
        >
          <div style={{
            position: 'absolute', top: 10, left: 12,
            width: 10, height: 6, borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
          }} />
        </motion.div>
      </div>
    </div>
  );
};

// ─── SVG Pixel Art Generator ───
// Converts a 14x16 character map into crisp SVG rects.
const DetailedDoctor = ({ color, pixelSize = 3 }) => {
  const width = 14 * pixelSize; 
  const height = 16 * pixelSize;

  // H: Hair (Brown)
  // S: Skin
  // E: Eyes / dark parts
  // W: White coat
  // A: Accent color (Stethoscope)
  const palette = {
    'H': '#4a2b16',
    'S': '#ffcd94',
    'E': '#1a1a1a',
    'W': '#ffffff',
    'A': color,
  };

  const sprite = [
    "     HHHH     ",
    "   HHHHHHHH   ",
    "  HHSSSSSSHH  ",
    "  HSSESSSESH  ",
    "  HHSSSSSSHH  ",
    "    SSSSSS    ",
    "   WWWWWWWW   ",
    "  WWWAWWWAWW  ",
    "  WWWEWWWEWW  ",
    "  WWWEWWWEWW  ",
    " SSWWEWWWEWSS ",
    " SSSWWEWEWWSS ",
    " SS WWWEEEWSS ",
    "  S WWWWWWWS  ",
    "    WWWWWWWW  ",
    "    WWW  WWW  "
  ];

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {sprite.map((row, y) => 
        row.split('').map((char, x) => {
          if (char === ' ') return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={palette[char]}
            />
          );
        })
      )}
    </svg>
  );
};

export { DetailedDoctor };
export default ProgressThermometer;
