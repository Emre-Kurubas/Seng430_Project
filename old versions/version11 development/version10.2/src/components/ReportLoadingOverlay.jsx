import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   PIXEL DOCTOR — Large detailed 24×25 sprite, 5 expressive poses
   ═══════════════════════════════════════════════════════════════ */
const BigDoctor = ({ color, pose = 'idle' }) => {
  const S = 6;
  const palette = {
    'H':'#3d2310','h':'#5a3a1e','S':'#ffcd94','s':'#e8b878',
    'E':'#1a1a1a','P':'#ffffff','W':'#ffffff','G':'#e8e8e8',
    'g':'#d0d0d0','A':color,'R':'#e85d5d','T':'#d63031',
    'M':'#c4956b','N':'#88bbff','C':'#bbbbbb','B':'#2c5ea8',
    'b':'#1e4a8a','K':'#1a1a1a','k':'#333333','O':'#ff9f43',
  };
  const poses = {
    idle: [
      "        HhHHhH          ",
      "      HHHhHhHHHHH       ",
      "     HHhSSSSSSShHH      ",
      "     HHSSSSSSSSSSHH     ",
      "     HPEsSSSSSsEPH      ",
      "     HHSSsSsSSSsHH      ",
      "      HsSRRRRSSsH       ",
      "       sSSMMMSSs        ",
      "        sSSSSSs         ",
      "         sSSs           ",
      "       WWWTWWWWW        ",
      "      WWWTTWWWWWW       ",
      "     GWWNAWWWWWWWG      ",
      "    sGWWAAWWWWWWWGs     ",
      "   ssGWWWAWAWWWWWGss    ",
      "   ssGWWWCWWCWWWWGss    ",
      "   ss gWWWWWWWWWg ss    ",
      "   ss  WWWWWWWWW  ss    ",
      "   ss  gWWWWWWWg  ss    ",
      "    s   WWWWWWW   s     ",
      "        BBBBBBB         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "       KkKK KkKK        ",
    ],
    tap: [
      "        HhHHhH          ",
      "      HHHhHhHHHHH       ",
      "     HHhSSSSSSShHH      ",
      "     HHSSSSSSSSSSHH     ",
      "     HPEsSSSSSsEPH      ",
      "     HHSSsSsSSSsHH      ",
      "      HsSRRRRSSsH       ",
      "       sSSMMMSSs        ",
      "        sSSSSSs         ",
      "         sSSs           ",
      "       WWWTWWWWW        ",
      "      WWWTTWWWWWW       ",
      "     GWWNAWWWWWWWG      ",
      "    sGWWAAWWWWWWWGssssss",
      "   ssGWWWAWAWWWWWG sssss",
      "   ssGWWWCWWCWWWWGss    ",
      "   ss gWWWWWWWWWg ss    ",
      "   ss  WWWWWWWWW  s     ",
      "   ss  gWWWWWWWg        ",
      "    s   WWWWWWW         ",
      "        BBBBBBB         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "       KkKK KkKK        ",
    ],
    watch: [
      "        HhHHhH          ",
      "      HHHhHhHHHHH       ",
      "     HHhSSSSSSShHH      ",
      "     HHSSSSSSSSSSHH     ",
      "     HPsSSSSSSEPHH      ",
      "     HHSSsSsSSSsHH      ",
      "      HsSRRRRSSsH       ",
      "       sSSSMSSs         ",
      "        sSSSSSs         ",
      "         sSSs           ",
      "       WWWTWWWWW        ",
      "      WWWTTWWWWWW       ",
      "     GWWNAWWWWWWWG      ",
      "    sGWWAAWWWWWWWGs     ",
      "   ssGWWWAWAWWWWWGss    ",
      "   ssGWWWCWWCWWWWGss    ",
      "   ssgWWWWWWWWWWWgss    ",
      "   ss gWWWWWWWWWg ss    ",
      "   ss  gWWWWWWWg  ss    ",
      "    s   WWWWWWW   s     ",
      "        BBBBBBB         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "       KkKK KkKK        ",
    ],
    worried: [
      "        HhHHhH          ",
      "      HHHhHhHHHHH       ",
      "     HHhSSSSSSShHH      ",
      "     HHSSSSSSSSSSHH     ",
      "     HPEsSSSSSsEPH      ",
      "     HHSSsSsSSSsHH      ",
      "      HsSRRRRSSsH       ",
      "       sSSOMOSSSs       ",
      "       ssSSSSSss        ",
      "       GssSSsSsWG       ",
      "      GWWsTTWsWWWG      ",
      "     GWWWTTTTWWWWWG     ",
      "     GWWNAWWWWWWWG      ",
      "    sGWWAAWWWWWWWGs     ",
      "   ssGWWWAWAWWWWWGss    ",
      "   ssGWWWCWWCWWWWGss    ",
      "   ssgWWWWWWWWWWWgss    ",
      "   ssgWWWWWWWWWWWgss    ",
      "   ss  gWWWWWWWg  ss    ",
      "    s   WWWWWWW   s     ",
      "        BBBBBBB         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "       KkKK KkKK        ",
    ],
    celebrate: [
      "        HhHHhH          ",
      "      HHHhHhHHHHH       ",
      "     HHhSSSSSSShHH      ",
      "     HHSSSSSSSSSSHH     ",
      "     HPEsSSSSSsEPH      ",
      "     HHSSsSsSSSsHH      ",
      "      HsSRRRRSSsH       ",
      "       sSSSMSSSs        ",
      "        sSSSSSs         ",
      "         sSSs           ",
      " s     WWWTWWWWW     s  ",
      " ss   WWWTTWWWWWW   ss  ",
      " ss  GWWNAWWWWWWWG  ss  ",
      "  ss sGWWAAWWWWWGs ss   ",
      "   sssGWWWAWAWWWGsss    ",
      "      GWWWCWWCWWWG      ",
      "       gWWWWWWWWWg      ",
      "        WWWWWWWWW       ",
      "       gWWWWWWWg        ",
      "        WWWWWWW         ",
      "        BBBBBBB         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "        bBB BBb         ",
      "       KkKK KkKK        ",
    ],
  };
  const sprite = poses[pose] || poses.idle;
  const W = 24, H = sprite.length;
  return (
    <svg width={W*S} height={H*S} viewBox={`0 0 ${W*S} ${H*S}`}>
      {sprite.map((row,y)=>row.split('').map((c,x)=>
        c!==' '?<rect key={`${x}-${y}`} x={x*S} y={y*S} width={S} height={S} fill={palette[c]||'#888'}/>:null
      ))}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FLASK LIQUID - draws a path that perfectly follows flask walls
   with an animated wavy surface
   ═══════════════════════════════════════════════════════════════ */
const FlaskLiquid = ({ color, fillPct, wavePhase = 0 }) => {
  // Flask interior geometry (matching flask path, inset by 3px)
  // Flask: M42 12 L42 42 L12 105 L108 105 L78 42 L78 12
  // Interior bottom = y:103, Interior body starts y:43
  const btm = 103;
  const bodyTop = 43;
  const maxH = btm - bodyTop; // 60

  if (fillPct <= 0) return null;

  const fillH = Math.min(fillPct, 100) / 100 * maxH;
  const liquidY = btm - fillH;

  // At any y between bodyTop(43) and btm(103):
  // leftX = 43 - (43-14)*(y-43)/(103-43) = 43 - 29*(y-43)/60
  // rightX = 77 + (106-77)*(y-43)/(103-43) = 77 + 29*(y-43)/60
  const leftAt = (y) => 43 - 29*(y-43)/60;
  const rightAt = (y) => 77 + 29*(y-43)/60;

  // If liquid is above flask body (into neck area)
  const surfY = Math.max(liquidY, bodyTop);
  const lx = leftAt(surfY);
  const rx = rightAt(surfY);
  const blx = leftAt(btm);
  const brx = rightAt(btm);

  // Wave amplitude
  const amp = Math.min(4, fillPct * 0.08);
  const mid = (lx + rx) / 2;
  const q1x = lx + (rx - lx) * 0.25;
  const q2x = lx + (rx - lx) * 0.75;

  // Wobble the surface with sine wave via wavePhase
  const w1 = Math.sin(wavePhase) * amp;
  const w2 = Math.sin(wavePhase + 2) * amp;
  const w3 = Math.sin(wavePhase + 4) * amp;

  const d = `
    M ${blx} ${btm}
    L ${brx} ${btm}
    L ${rx} ${surfY}
    C ${q2x} ${surfY + w3}, ${q2x} ${surfY + w2}, ${mid} ${surfY + w1}
    C ${q1x} ${surfY - w2}, ${q1x} ${surfY - w1}, ${lx} ${surfY + w3}
    Z
  `;

  return (
    <>
      <path d={d} fill={color} opacity={0.8} />
      {/* Surface highlight */}
      <path
        d={`M ${lx+2} ${surfY + w3 + 1}
            C ${q1x} ${surfY - w2 + 1}, ${q2x} ${surfY + w2 + 1}, ${rx-2} ${surfY + w3 + 1}`}
        stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none"
      />
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TUBE LIQUID - draws liquid inside the test tube shape
   ═══════════════════════════════════════════════════════════════ */
const TubeLiquid = ({ color, fillPct, wavePhase = 0 }) => {
  // Tube interior: rect from x=9 y=12 w=12 h=68, then circle at cx=15 cy=92 r=11
  const tubeTop = 12;
  const tubeBot = 80; // where rect meets circle
  const circleBot = 103; // bottom of circle
  const totalH = circleBot - tubeTop; // 91

  if (fillPct <= 0) return null;

  const fillH = Math.min(fillPct, 100) / 100 * totalH;
  const surfY = circleBot - fillH;

  const amp = Math.min(2, fillPct * 0.04);
  const w = Math.sin(wavePhase) * amp;

  let d;
  if (surfY >= tubeBot) {
    // Liquid only in the circle/bulb area
    // Approximate circle section
    const cy = 92, r = 11;
    const dy = surfY - cy;
    const halfW = Math.sqrt(Math.max(0, r*r - dy*dy));
    d = `
      M ${15-halfW} ${surfY}
      Q ${15} ${surfY + w*2}, ${15+halfW} ${surfY}
      A ${r} ${r} 0 0 1 ${15-halfW} ${surfY}
      Z
    `;
    // Just fill from surfY to bottom of circle
    const botHalfW = Math.sqrt(Math.max(0, r*r - (circleBot-2-cy)*(circleBot-2-cy)));
    d = `
      M ${15-halfW} ${surfY}
      C ${15} ${surfY + w}, ${15} ${surfY + w}, ${15+halfW} ${surfY}
      L ${15+11} ${92}
      A 11 11 0 0 1 ${15-11} ${92}
      L ${15-halfW} ${surfY}
      Z
    `;
  } else {
    // Liquid in both tube and bulb
    d = `
      M 9 ${surfY}
      C 12 ${surfY + w}, 18 ${surfY - w}, 21 ${surfY}
      L 21 ${tubeBot}
      L 26 ${92}
      A 11 11 0 0 1 4 ${92}
      L 9 ${tubeBot}
      Z
    `;
  }

  return <path d={d} fill={color} opacity={0.8} />;
};

/* ═══════════════════════════════════════════════════════════════
   REAL LIQUID STREAM - uses metaball goo effect for realistic pouring
   ═══════════════════════════════════════════════════════════════ */
const RealLiquidStream = ({ color }) => {
  return (
    <svg width="24" height="60" style={{ display: 'block', overflow: 'visible', marginLeft: -4 }}>
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="
            1 0 0 0 0  
            0 1 0 0 0  
            0 0 1 0 0  
            0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
      
      {/* Liquid body with metaball filter for merging drops */}
      <g filter="url(#goo)" fill={color}>
        {/* Core stream - thin and slightly pulsing in width */}
        <motion.rect x="10.5" y="-10" width="3" height="80" rx="1.5"
           animate={{ scaleX: [1, 0.4, 1.3, 0.7, 1] }}
           transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
           style={{ transformOrigin: "center" }}
        />
        
        {/* Fast large blob chunks simulating varying pour thickness */}
        {[0, 1, 2].map(i => (
          <motion.ellipse key={`b${i}`} cx="12" cy="0" rx="4" ry="12"
             initial={{ cy: -30 }}
             animate={{ cy: 90 }}
             transition={{ duration: 0.45, delay: i * 0.18, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* Small droplets racing down to create pinch-offs */}
        {[0, 1, 2, 3].map(i => (
          <motion.ellipse key={`s${i}`} cx={12 + (i%2===0?-0.5:0.5)} cy="0" rx="2.5" ry="6"
             initial={{ cy: -20 }}
             animate={{ cy: 90 }}
             transition={{ duration: 0.35, delay: i * 0.12 + 0.05, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </g>
      
      {/* Light specular core to give it a 3D glass/liquid shine */}
      <g filter="url(#goo)">
        <motion.rect x="11.5" y="-10" width="1" height="80" rx="0.5" fill="rgba(255,255,255,0.4)"
           animate={{ scaleX: [1, 0.5, 1.5, 0.8, 1] }}
           transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
           style={{ transformOrigin: "center" }}
        />
        {[0, 1].map(i => (
          <motion.ellipse key={`bs${i}`} cx="12" cy="0" rx="1.5" ry="6" fill="rgba(255,255,255,0.5)"
             initial={{ cy: -30 }}
             animate={{ cy: 90 }}
             transition={{ duration: 0.45, delay: i * 0.25, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </g>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WAVE ANIMATOR - runs a continuous wave phase
   ═══════════════════════════════════════════════════════════════ */
const useWavePhase = (speed = 3) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf;
    let start = performance.now();
    const tick = (t) => {
      setPhase(((t - start) / 1000) * speed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);
  return phase;
};

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER
   ═══════════════════════════════════════════════════════════════ */
const Typewriter = ({ text, color }) => {
  const [d, setD] = useState('');
  useEffect(() => {
    setD(''); let i=0;
    const iv = setInterval(()=>{ i++; setD(text.slice(0,i)); if(i>=text.length) clearInterval(iv); }, 28);
    return ()=>clearInterval(iv);
  }, [text]);
  return <span>{d}<motion.span animate={{opacity:[1,0]}} transition={{duration:0.5,repeat:Infinity}} style={{color}}>|</motion.span></span>;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN OVERLAY
   ═══════════════════════════════════════════════════════════════ */
const ReportLoadingOverlay = ({ isVisible, color, onFinished }) => {
  const [phase, setPhase] = useState(0);
  const [tubeFill, setTubeFill] = useState(75);
  const [flaskFill, setFlaskFill] = useState(0);
  const wavePhase = useWavePhase(phase >= 4 ? 8 : 3); // faster waves during reaction

  useEffect(() => {
    if (!isVisible) { setPhase(0); setTubeFill(75); setFlaskFill(0); return; }
    const t = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => { setPhase(3); }, 2600),
    ];
    return () => t.forEach(clearTimeout);
  }, [isVisible]);

  // Gradual liquid transfer during pour phase
  useEffect(() => {
    if (phase !== 3) return;
    let frame;
    const start = performance.now();
    const duration = 2500;
    const tick = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      setTubeFill(75 - pct * 70); // drain from 75 to 5
      setFlaskFill(pct * 60);     // fill to 60
      if (pct < 1) frame = requestAnimationFrame(tick);
      else {
        // Move to next phases after pouring completes
        setTimeout(() => setPhase(4), 300);
        setTimeout(() => setPhase(5), 1300);
        setTimeout(() => setPhase(6), 2100);
        setTimeout(() => setPhase(7), 2700);
        setTimeout(() => { setPhase(8); onFinished?.(); }, 3900);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const boom = useMemo(() => Array.from({length:80},(_,i)=>({
    ang:(i/80)*360+(Math.random()-.5)*20, dist:60+Math.random()*300,
    sz:3+Math.random()*14, dl:Math.random()*0.2, dur:0.6+Math.random()*0.8,
    kind:i%5===0?'glass':i%4===0?'spark':i%7===0?'ring':'drop',
  })), []);

  const confetti = useMemo(()=>Array.from({length:80},(_,i)=>({
    x:(Math.random()-.5)*900, dl:Math.random()*0.8, dur:2.5+Math.random()*2,
    col:['#ff6b6b','#ffd93d','#6bcb77','#4d96ff',color,'#ff9ff3','#54a0ff','#feca57','#ee5a24','#0abde3'][i%10],
    w:4+Math.random()*10, h:2+Math.random()*6,
    rot:Math.random()*1440, shape:i%3===0?'circle':i%5===0?'ribbon':'rect',
    wobble:Math.random()*40-20,
  })),[color]);

  const msg=['Setting up the lab...','Tapping the reagent...','Positioning test tube...','Pouring data samples...','Reaction in progress...','⚠️ Critical pressure!','','💥 BOOM!','✅ Download complete!'][Math.min(phase,8)];

  if (!isVisible) return null;

  return createPortal(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}}
      style={{position:'fixed',inset:0,zIndex:999999,background:'rgba(6,6,10,0.97)',backdropFilter:'blur(24px)',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>

      {/* Flash */}
      <AnimatePresence>
        {phase===6&&(
          <motion.div initial={{opacity:1}} animate={{opacity:0}} transition={{duration:0.5}}
            style={{position:'absolute',inset:0,zIndex:200,
              background:`radial-gradient(circle at 50% 65%, white, ${color}80 30%, transparent 70%)`}}/>
        )}
      </AnimatePresence>

      {/* Screen shake */}
      <motion.div
        animate={
          phase===5?{x:[0,-6,7,-9,6,-7,8,-5,6,0],y:[0,4,-6,5,-7,4,-5,6,-3,0]}
          :phase===6?{x:[0,-14,16,-18,14,-12,0],y:[0,10,-14,10,-16,12,0]}
          :{}
        }
        transition={phase===5?{duration:0.4,repeat:Infinity}:{duration:0.3}}
        style={{position:'relative',width:520,height:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      >
        {/* ═══════ LAB TABLE ═══════ */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:phase>=6?0:0.5,y:0}}
          transition={{duration:0.6,delay:0.2}}
          style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',
            width:320,height:5,borderRadius:3,zIndex:2,
            background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.2), rgba(255,255,255,0.12), transparent)'}}/>

        {/* ═══════ DOCTOR ═══════ */}
        <motion.div
          initial={{x:-350,opacity:0}}
          animate={{
            x: phase>=2 ? -170 : -160,
            y: phase>=4 ? [0,-3,0] : phase>=3 ? [0,-2,0,-1,0] : [0,-4,0],
            opacity: phase>=6 && phase<7 ? 0 : 1,
            rotate: phase===5 ? [0,-2,2,-2,2,0] : 0,
          }}
          transition={{
            x:{duration:0.8,ease:[0.22,1,0.36,1]},
            y:{duration: phase>=4 ? 0.3 : 2, repeat:Infinity, ease:'easeInOut'},
            opacity:{duration:0.3},
            rotate: phase===5 ? {duration:0.3,repeat:Infinity} : {},
          }}
          style={{position:'absolute',bottom:24,zIndex:10}}>
          <BigDoctor
            color={color}
            pose={
              phase>=7 ? 'celebrate'
              : phase>=4 ? 'worried'
              : phase>=3 ? 'watch'
              : phase>=1 && phase<3 ? 'tap'
              : 'idle'
            }
          />
        </motion.div>

        {/* ═══════ TEST TUBE ═══════ */}
        <motion.div
          initial={{opacity:0,y:30}}
          animate={{
            x: phase>=2?0:-90,
            y: phase>=2?-230:-8,
            rotate: phase>=2?180:0,
            opacity: phase>=6?0:1,
            scale: phase===1?[1,1.06,0.96,1.04,1]:1,
          }}
          transition={{
            x:{duration:0.7,ease:[0.22,1,0.36,1]},
            y:{duration:0.7,ease:[0.22,1,0.36,1]},
            rotate:{duration:0.7,ease:[0.22,1,0.36,1]},
            scale:phase===1?{duration:0.3,repeat:2}:{},
            opacity:{duration:0.3},
          }}
          style={{position:'absolute',bottom:28,zIndex:8,transformOrigin:'center bottom'}}>
          <svg width="30" height="110" viewBox="0 0 30 110">
            {/* Tube body */}
            <rect x="7" y="10" width="16" height="70" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
            {/* Bulb */}
            <circle cx="15" cy="92" r="13" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
            {/* Cork — flies off when pouring */}
            <motion.g
              animate={{opacity:phase>=2?0:1, y:phase>=2?-30:0, x:phase>=2?20:0, rotate:phase>=2?-45:0}}
              transition={{duration:0.4,ease:'easeOut'}}
            >
              <rect x="5" y="4" width="20" height="8" rx="3" fill="#8B7355" stroke="#6B5B45" strokeWidth="1"/>
            </motion.g>
            {/* Liquid — proper path-based */}
            <TubeLiquid color={color} fillPct={tubeFill} wavePhase={wavePhase}/>
            {/* Glass shine */}
            <rect x="10" y="14" width="3" height="55" rx="1.5" fill="rgba(255,255,255,0.1)"/>
            <ellipse cx="11" cy="88" rx="3" ry="2.5" fill="rgba(255,255,255,0.08)"/>
          </svg>
        </motion.div>

        {/* ═══════ POUR STREAM ═══════ */}
        <AnimatePresence>
          {phase>=3 && phase<6 && (
            <>
              {/* Main stream with true liquid physics */}
              <motion.div
                initial={{scaleY:0,opacity:0}} animate={{scaleY:1,opacity:1}} exit={{scaleY:0,opacity:0}}
                transition={{duration:0.3}}
                style={{position:'absolute',bottom:110,left:'50%',marginLeft:-8,
                  width:16,height:48,zIndex:4,transformOrigin:'top center'}}
              >
                <RealLiquidStream color={color} />
              </motion.div>

              {/* Drip drops with wobble */}
              {[0,1,2,3,4].map(i=>(
                <motion.div key={`d-${i}`}
                  animate={{y:[0,50],opacity:[0,0.9,0],scaleY:[0.7,1.4,0.5],x:[0,(i%2?3:-3),0]}}
                  transition={{duration:0.6,delay:i*0.12,repeat:Infinity,ease:'easeIn'}}
                  style={{position:'absolute',bottom:112,left:`calc(50% + ${(i-2)*2}px)`,
                    width:4,height:7,borderRadius:'50% 50% 50% 50%/60% 60% 40% 40%',
                    background:color,boxShadow:`0 0 5px ${color}60`,zIndex:7}}/>
              ))}

              {/* Splash at flask rim */}
              {[0,1,2,3].map(i=>(
                <motion.div key={`sp${i}`}
                  animate={{y:[0,-10-i*5],x:[(i-1.5)*5,(i-1.5)*18],opacity:[0.7,0],scale:[1,0.2]}}
                  transition={{duration:0.35,delay:i*0.08,repeat:Infinity}}
                  style={{position:'absolute',bottom:118,left:'50%',zIndex:9,
                    width:3,height:3,borderRadius:'50%',background:color}}/>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ═══════ ERLENMEYER FLASK ═══════ */}
        <motion.div
          initial={{opacity:0,y:30}}
          animate={{
            y:phase===5?[0,-8,10,-12,8,-10,12,-6,8,0]:0,
            rotate:phase===5?[0,-4,5,-6,4,-5,6,-3,4,0]:0,
            scale:phase>=6?[1,1.5,0]:1,
            opacity:phase>=7?0:1,
          }}
          transition={phase===5?{duration:0.35,repeat:Infinity}:{duration:0.3}}
          style={{position:'absolute',bottom:18,zIndex:5}}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Flask body */}
            <path d="M42 12 L42 42 L12 105 L108 105 L78 42 L78 12 Z"
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeLinejoin="round"/>
            {/* Rim */}
            <rect x="38" y="6" width="44" height="8" rx="3" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
            {/* Marks */}
            {[35,52,68,84].map((y,i)=>(
              <line key={i} x1={16+(4-i)*2} y1={y} x2={28+(4-i)*2} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            ))}

            {/* LIQUID — path-based, follows flask walls perfectly */}
            <FlaskLiquid color={color} fillPct={flaskFill} wavePhase={wavePhase}/>

            {/* Bubbles during reaction */}
            {phase>=4 && phase<6 && Array.from({length:8}).map((_,i)=>(
              <motion.circle key={`b${i}`}
                cx={30+(i%5)*14} r={2+(i%3)}
                animate={{cy:[95,45+(i%3)*8,38],opacity:[0,0.6,0]}}
                transition={{duration:0.8+(i%3)*0.3,delay:i*0.12,repeat:Infinity}}
                fill="rgba(255,255,255,0.4)"/>
            ))}

            {/* Glass shine */}
            <path d="M46 16 L46 44 L22 92" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" fill="none"/>
          </svg>

          {/* Steam */}
          {phase>=4 && phase<6 && (
            <div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)'}}>
              {[0,1,2,3].map(i=>(
                <motion.div key={`st${i}`}
                  animate={{y:[-5,-55],x:[0,(i-1.5)*18],opacity:[0.3,0],scale:[0.5,2]}}
                  transition={{duration:1.6,delay:i*0.3,repeat:Infinity,ease:'easeOut'}}
                  style={{position:'absolute',width:14,height:14,borderRadius:'50%',
                    background:'rgba(255,255,255,0.1)',filter:'blur(4px)'}}/>
              ))}
            </div>
          )}

          {/* Under glow */}
          {phase>=4 && phase<6 && (
            <motion.div animate={{opacity:[0.2,0.7,0.2],scale:[0.9,1.2,0.9]}}
              transition={{duration:0.5,repeat:Infinity}}
              style={{position:'absolute',bottom:-12,left:'50%',transform:'translateX(-50%)',
                width:90,height:24,borderRadius:'50%',
                background:`radial-gradient(ellipse, ${color}50, transparent)`,filter:'blur(8px)'}}/>
          )}
        </motion.div>

        {/* ═══════ EXPLOSION ═══════ */}
        <AnimatePresence>
          {phase>=6 && phase<8 && (
            <>
              {/* Central energy burst — bigger */}
              <motion.div initial={{scale:0,opacity:1}} animate={{scale:[0,5,12],opacity:[1,0.6,0]}} transition={{duration:1.1}}
                style={{position:'absolute',bottom:80,width:80,height:80,borderRadius:'50%',
                  background:`radial-gradient(circle, white 10%, ${color} 40%, transparent 70%)`,zIndex:20}}/>
              {/* Shockwave 1 */}
              <motion.div initial={{scale:0,opacity:1}} animate={{scale:14,opacity:0}} transition={{duration:1.0}}
                style={{position:'absolute',bottom:75,width:50,height:50,borderRadius:'50%',border:`3px solid ${color}`,zIndex:19}}/>
              {/* Shockwave 2 */}
              <motion.div initial={{scale:0,opacity:0.7}} animate={{scale:10,opacity:0}} transition={{duration:0.8,delay:0.08}}
                style={{position:'absolute',bottom:75,width:40,height:40,borderRadius:'50%',border:`2px solid rgba(255,255,255,0.5)`,zIndex:19}}/>
              {/* Shockwave 3 */}
              <motion.div initial={{scale:0,opacity:0.4}} animate={{scale:8,opacity:0}} transition={{duration:0.6,delay:0.15}}
                style={{position:'absolute',bottom:75,width:35,height:35,borderRadius:'50%',border:`2px solid ${color}60`,zIndex:19}}/>

              {/* Debris particles */}
              {boom.map((p,i)=>(
                <motion.div key={`x${i}`}
                  initial={{x:0,y:0,scale:1,opacity:1}}
                  animate={{
                    x:Math.cos(p.ang*Math.PI/180)*p.dist,
                    y:Math.sin(p.ang*Math.PI/180)*p.dist-50+(p.kind==='glass'?60:0),
                    scale:0,opacity:0,rotate:p.kind==='glass'?540:p.kind==='spark'?360:0,
                  }}
                  transition={{duration:p.dur,delay:p.dl,ease:[0.22,1,0.36,1]}}
                  style={{position:'absolute',bottom:80,zIndex:22,
                    width:p.kind==='glass'?p.sz*1.8:p.kind==='spark'?2:p.kind==='ring'?p.sz:p.sz,
                    height:p.kind==='spark'?p.sz*2:p.kind==='ring'?p.sz:p.sz,
                    borderRadius:p.kind==='glass'?2:p.kind==='ring'?'50%':p.kind==='spark'?1:'50%',
                    background:p.kind==='spark'?'#fff':p.kind==='glass'?'rgba(255,255,255,0.35)':p.kind==='ring'?'transparent':color,
                    border:p.kind==='ring'?`2px solid ${color}`:'none',
                    boxShadow:p.kind==='spark'?`0 0 12px #fff, 0 0 24px ${color}`:p.kind==='ring'?`0 0 8px ${color}`:`0 0 6px ${color}40`}}/>
              ))}

              {/* Liquid splashes with gravity arc */}
              {Array.from({length:24}).map((_,i)=>(
                <motion.div key={`sl${i}`}
                  initial={{y:0,opacity:1}}
                  animate={{x:(Math.random()-.5)*400,y:[0,-140-Math.random()*100,350],opacity:[1,0.9,0]}}
                  transition={{duration:1.4+Math.random()*0.5,delay:Math.random()*0.2,ease:'easeOut'}}
                  style={{position:'absolute',bottom:80,zIndex:21,
                    width:4+Math.random()*6,height:6+Math.random()*8,
                    borderRadius:'50% 50% 50% 50%/60% 60% 40% 40%',
                    background:color,filter:`drop-shadow(0 0 6px ${color})`}}/>
              ))}

              {/* Ember glow trails */}
              {Array.from({length:12}).map((_,i)=>(
                <motion.div key={`em${i}`}
                  initial={{scale:1,opacity:0.8}}
                  animate={{
                    x:Math.cos((i/12)*360*Math.PI/180)*180,
                    y:Math.sin((i/12)*360*Math.PI/180)*180-40,
                    scale:0,opacity:0,
                  }}
                  transition={{duration:1.2,delay:0.1+i*0.03,ease:'easeOut'}}
                  style={{position:'absolute',bottom:80,zIndex:20,
                    width:3,height:3,borderRadius:'50%',background:'#fff',
                    boxShadow:`0 0 6px #fff, 0 0 12px ${color}, 0 0 20px ${color}`}}/>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ═══════ CONFETTI ═══════ */}
        <AnimatePresence>
          {phase>=7 && confetti.map((c,i)=>(
            <motion.div key={`c${i}`}
              initial={{y:-200,x:c.x,opacity:0,rotate:0,scale:0}}
              animate={{
                y:500,
                opacity:[0,1,1,1,0.6,0],
                rotate:c.rot,
                scale:[0,1.2,1,1,0.8],
                x:c.x+c.wobble,
              }}
              transition={{duration:c.dur,delay:c.dl,ease:[0.22,1,0.36,1]}}
              style={{
                position:'absolute',top:0,zIndex:25,
                width:c.w, height:c.h,
                borderRadius:c.shape==='circle'?'50%':c.shape==='ribbon'?'1px':2,
                background:c.col,
                boxShadow:`0 0 4px ${c.col}60`,
              }}/>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ─── Text ─── */}
      <motion.div key={phase} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
        style={{textAlign:'center',zIndex:30,marginTop:8}}>
        <p style={{color:'#fff',fontSize:phase>=6?'1.5rem':'1.05rem',fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 6px'}}>
          <Typewriter text={msg} color={color}/>
        </p>
        <p style={{color:'rgba(255,255,255,0.3)',fontSize:'0.75rem',margin:0}}>
          {phase<6?'Generating ML Pipeline Summary Certificate...':phase<8?'Data successfully synthesized!':'PDF saved to downloads'}
        </p>
      </motion.div>

      {/* ─── Progress bar ─── */}
      {phase<6&&(
        <div style={{width:240,height:3,borderRadius:999,background:'rgba(255,255,255,0.06)',marginTop:18,overflow:'hidden'}}>
          <motion.div animate={{width:`${Math.min((phase/5)*100,100)}%`}} transition={{duration:0.8,ease:'easeInOut'}}
            style={{height:'100%',borderRadius:999,background:`linear-gradient(90deg,${color},${color}cc)`,boxShadow:`0 0 12px ${color}40`}}/>
        </div>
      )}

      {/* ─── Checkmark ─── */}
      <AnimatePresence>
        {phase>=7&&(
          <motion.div initial={{scale:0}} animate={{scale:1}}
            transition={{type:'spring',damping:12,stiffness:200,delay:0.3}}
            style={{marginTop:14,width:52,height:52,borderRadius:'50%',
              background:`linear-gradient(135deg,${color},${color}cc)`,
              display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 8px 28px ${color}40`}}>
            <motion.svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M5 13 L10 18 L20 6" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:0.4,delay:0.5}}/>
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
};

export default ReportLoadingOverlay;
