import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoIcon, LogoText } from '@/components/Logo';

export const SplashIntro = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [stage, setStage] = useState(1); // 1: logo, 2: text, 3: reveal

  useEffect(() => {
    // Check session storage skip logic
    const hasSeenIntro = sessionStorage.getItem('hasSeenSplashIntro');
    if (hasSeenIntro) {
      onComplete();
      return;
    }

    // Sequence timing
    const t1 = setTimeout(() => setStage(2), 1200);
    const t2 = setTimeout(() => setStage(3), 2800);
    const t3 = setTimeout(() => {
      setIsFadingOut(true);
      sessionStorage.setItem('hasSeenSplashIntro', 'true');
      setTimeout(onComplete, 800);
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // Particle Starfield & Cyber Grid Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      color: ['#FF2A85', '#963BFF', '#00F0FF', '#ffffff'][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.7 + 0.3
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > width) p.speedX *= -1;
        if (p.y < 0 || p.y > height) p.speedY *= -1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 110) * 0.25;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isFadingOut ? 0 : 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="fixed inset-0 z-[99999] bg-[#08080C] overflow-hidden flex flex-col items-center justify-center pointer-events-none select-none"
      >
        {/* Animated Background Glowing Orbs (Cohort Colors) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.6, 0.35]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-15%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-[#963BFF]/20 blur-[130px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.65, 0.4]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#FF2A85]/20 blur-[140px]"
          />
          <motion.div
            animate={{
              scale: [0.9, 1.15, 0.9],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[30%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-[#00F0FF]/15 blur-[120px]"
          />
        </div>

        {/* Video Overlay Layer (If present) */}
        <video
          ref={videoRef}
          src="/assets/intro.mp4"
          muted
          playsInline
          autoPlay
          controls={false}
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen pointer-events-none z-0"
        />

        {/* Particle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080C]/80 via-transparent to-[#08080C]/90 z-20 pointer-events-none" />

        {/* Animated Cohort Intro Content */}
        <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 max-w-4xl">
          
          {/* Glowing Official Cohort Logo Badge */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8"
          >
            {/* Pulsing Neon Ring Aura */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.95, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#FF2A85] via-[#963BFF] to-[#00F0FF] blur-2xl opacity-80"
            />

            {/* Official Website Logo Icon */}
            <div className="relative flex items-center justify-center p-2 rounded-3xl bg-[#08080C]/90 border border-white/20 shadow-2xl backdrop-blur-md">
              <LogoIcon className="w-20 h-20 sm:w-28 sm:h-28" glow={true} variant="badge" />
            </div>
          </motion.div>

          {/* Official Website Logo Text Wordmark */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center mb-6"
          >
            <LogoText textSize="text-5xl sm:text-7xl" isLanding={true} />
          </motion.div>

          {/* College Chaotic Headline with Brand Gradient */}
          <AnimatePresence>
            {stage >= 2 && (
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="space-y-3"
              >
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight font-display">
                  COLLEGE IS CHAOTIC<br />
                  <span className="bg-gradient-to-r from-[#FF2A85] via-[#963BFF] to-[#00F0FF] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,42,133,0.4)]">
                    DON'T SCROLL IT ALL ALONE
                  </span>
                </h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs sm:text-sm font-mono text-neutral-400 tracking-wider uppercase mt-4 flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
                  The private campus lounge you've been missing
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
