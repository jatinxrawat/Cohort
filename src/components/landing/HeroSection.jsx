import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Heart, MessageCircle, Ghost, ShoppingBag, Bell, Users, BookOpen, Verified } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';

// Floating card components for the hero collage
function FloatingCard({ children, className = '', delay = 0, duration = 6, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSection() {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center pt-16 pb-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left — Text content */}
        <div className="relative z-10 max-w-xl">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 dark:bg-accent-blue/10 border border-accent-blue/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
              <span className="text-xs font-semibold text-accent-blue">Now open for early access</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.05] tracking-tight text-neutral-900 dark:text-white mb-6">
              Your College,{' '}
              <span className="text-gradient-primary">One App.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-10 max-w-md">
              The social platform where college students connect, trade, confess, and build communities. Verified. Safe. Exclusively yours.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="magnetic-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold text-sm shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="magnetic-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 font-semibold text-sm border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                Explore Features
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className="mt-12 flex items-center gap-6">
              {/* Overlapping avatars */}
              <div className="flex -space-x-3">
                {['bg-accent-blue', 'bg-accent-purple', 'bg-accent-pink', 'bg-accent-cyan'].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full ${bg} border-2 border-white dark:border-surface-dark flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {['AS', 'PK', 'RJ', 'MN'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">5,000+ students</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">joined across 100+ colleges</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Right — Floating card collage */}
        <div className="relative h-[500px] sm:h-[580px] lg:h-[620px] hidden md:block">
          {/* Community card */}
          <FloatingCard
            className="animate-float-1 z-20"
            delay={0.5}
            style={{
              top: '5%',
              right: '10%',
              transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
            }}
          >
            <div className="w-56 glass-card-light rounded-2xl p-4 shadow-glass hover-lift cursor-default">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">AI/ML Club</p>
                  <p className="text-xs text-neutral-500">328 members</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-accent-blue/10 text-accent-blue text-[10px] font-medium">tech</span>
                <span className="px-2 py-0.5 rounded-md bg-accent-purple/10 text-accent-purple text-[10px] font-medium">active</span>
              </div>
            </div>
          </FloatingCard>

          {/* Post card */}
          <FloatingCard
            className="animate-float-2 z-30"
            delay={0.7}
            style={{
              top: '28%',
              left: '0%',
              transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -20}px)`,
            }}
          >
            <div className="w-64 glass-card-light rounded-2xl p-4 shadow-glass-lg hover-lift cursor-default">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent-pink flex items-center justify-center text-white text-xs font-bold">SK</div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                    Sneha K. <Verified className="w-3 h-3 text-accent-blue" />
                  </p>
                  <p className="text-[10px] text-neutral-500">Delhi University · 2h ago</p>
                </div>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                Just aced my Data Structures midterm! 🎉 Study group was a lifesaver.
              </p>
              <div className="flex items-center gap-4 text-neutral-500">
                <span className="flex items-center gap-1 text-[10px]"><Heart className="w-3 h-3 text-red-400 fill-red-400" /> 42</span>
                <span className="flex items-center gap-1 text-[10px]"><MessageCircle className="w-3 h-3" /> 12</span>
              </div>
            </div>
          </FloatingCard>

          {/* Confession card */}
          <FloatingCard
            className="animate-float-3 z-10"
            delay={0.9}
            style={{
              top: '55%',
              right: '5%',
              transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -25}px)`,
            }}
          >
            <div className="w-52 glass-card-light rounded-2xl p-4 shadow-glass hover-lift cursor-default">
              <div className="flex items-center gap-2 mb-2">
                <Ghost className="w-4 h-4 text-accent-purple" />
                <span className="text-[10px] font-medium text-accent-purple">Anonymous</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
                "The library's 3rd floor is the best secret study spot 📚"
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-500">
                <Heart className="w-3 h-3" /> 89
              </div>
            </div>
          </FloatingCard>

          {/* Marketplace card */}
          <FloatingCard
            className="animate-float-4 z-20"
            delay={1.1}
            style={{
              bottom: '10%',
              left: '5%',
              transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -12}px)`,
            }}
          >
            <div className="w-48 glass-card-light rounded-2xl p-3 shadow-glass hover-lift cursor-default">
              <div className="h-20 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center mb-2">
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">Physics Textbook</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-accent-blue">₹350</span>
                <span className="text-[9px] text-neutral-500">KIET</span>
              </div>
            </div>
          </FloatingCard>

          {/* Notification toast */}
          <FloatingCard
            className="animate-float-5 z-40"
            delay={1.3}
            style={{
              top: '12%',
              left: '15%',
              transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -8}px)`,
            }}
          >
            <div className="glass-card-light rounded-xl px-4 py-2.5 shadow-glass flex items-center gap-3 hover-lift cursor-default">
              <div className="w-7 h-7 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-accent-cyan" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-neutral-900 dark:text-white">New community invite</p>
                <p className="text-[9px] text-neutral-500">Photography Club</p>
              </div>
            </div>
          </FloatingCard>

          {/* Chat bubble */}
          <FloatingCard
            className="animate-float-2 z-10"
            delay={1.5}
            style={{
              bottom: '25%',
              right: '20%',
              transform: `translate(${mousePos.x * -18}px, ${mousePos.y * -22}px)`,
            }}
          >
            <div className="glass-card-light rounded-2xl rounded-br-sm px-4 py-3 shadow-glass hover-lift cursor-default max-w-[180px]">
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300">Hey! Are you going to the hackathon this weekend? 🚀</p>
              <p className="text-[9px] text-neutral-400 mt-1 text-right">just now</p>
            </div>
          </FloatingCard>

          {/* Profile chip */}
          <FloatingCard
            className="animate-float-4 z-30"
            delay={1.0}
            style={{
              top: '42%',
              right: '35%',
              transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -18}px)`,
            }}
          >
            <div className="glass-card-light rounded-full px-3 py-1.5 shadow-glass flex items-center gap-2 hover-lift cursor-default">
              <div className="w-6 h-6 rounded-full bg-accent-amber flex items-center justify-center text-white text-[9px] font-bold">RJ</div>
              <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Rahul J.</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}
