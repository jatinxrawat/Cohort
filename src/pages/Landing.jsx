import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Compass,
  X,
  Menu,
  ArrowRight,
  Ghost,
  MessageSquare,
  Users,
  Flame,
  Check,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Landing() {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { isDark, toggleTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      showSuccess('Signed in with Google successfully!');
      navigate('/home');
    } catch (error) {
      console.error(error);
      showError(error.message || 'Google sign in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Motion variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 selection:bg-[#00a6f5] selection:text-white transition-colors duration-300 font-sans overflow-x-hidden">

      {/* Floating Split Oval Header / Navbar */}
      <header className="fixed top-4 left-4 right-4 z-50 max-w-6xl mx-auto flex items-center justify-between gap-3 pointer-events-none">

        {/* Left Oval Box: Collex Brand Logo */}
        <div className="pointer-events-auto bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl rounded-full border border-slate-200/90 dark:border-slate-800 shadow-md px-6 py-3 flex items-center transition-all hover:shadow-lg">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading font-extrabold text-2xl tracking-tight text-[#00a6f5] flex items-center gap-1.5">
              Cohort
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a6f5] animate-ping"></span>
            </span>
          </Link>
        </div>

        {/* Center Oval Box: Navigation Links */}
        <nav className="pointer-events-auto hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl rounded-full border border-slate-200/90 dark:border-slate-800 shadow-md px-8 py-3.5 transition-all hover:shadow-lg">
          <a href="#utility" className="hover:text-[#00a6f5] transition-colors">
            Why I am the goat?
          </a>
          <a href="#how-it-works" className="hover:text-[#00a6f5] transition-colors">
            How are you?
          </a>
          <a href="#traction" className="hover:text-[#00a6f5] transition-colors">
            Traction
          </a>
        </nav>

        {/* Right Oval Box: Theme Toggle & Account Actions */}
        <div className="pointer-events-auto bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl rounded-full border border-slate-200/90 dark:border-slate-800 shadow-md px-4 py-2.5 flex items-center gap-3 transition-all hover:shadow-lg">

          {/* Beautiful Sliding Pill Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-13 h-7 rounded-full bg-slate-200 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 p-1 flex items-center justify-between transition-colors shadow-inner cursor-pointer group"
            aria-label="Toggle Theme"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500 z-10 ml-0.5" />
            <Moon className="w-3.5 h-3.5 text-[#00a6f5] z-10 mr-0.5" />
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute w-5 h-5 rounded-full bg-white dark:bg-[#00a6f5] shadow-md border border-slate-200 dark:border-sky-400 ${isDark ? 'right-1' : 'left-1'
                }`}
            />
          </button>

          {isAuthenticated ? (
            <Link
              to="/home"
              className="bg-[#00a6f5] hover:bg-[#008be0] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> Go to Hub
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-[#00a6f5] hover:text-[#008be0] font-bold text-xs px-3.5 py-1.5 rounded-full transition-colors"
              >
                Login
              </Link>
              <button
                onClick={handleGoogleSignIn}
                className="bg-[#00a6f5] hover:bg-[#008be0] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Join Your Campus
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-600 dark:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="md:hidden bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
            >
              <nav className="flex flex-col gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm">
                <a
                  href="#utility"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Why Collex
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  How It Works
                </a>
                <a
                  href="#traction"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Traction
                </a>
              </nav>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); handleGoogleSignIn(); }}
                      className="w-full bg-[#00a6f5] text-white py-3 rounded-2xl font-bold text-center"
                    >
                      Join Your Campus
                    </button>
                  </>
                ) : (
                  <Link
                    to="/home"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center bg-[#00a6f5] text-white py-3 rounded-2xl font-bold"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section with Grid Pattern Background */}
      <section className="relative pt-36 md:pt-44 pb-20 px-4 md:px-8 max-w-5xl mx-auto text-center overflow-hidden bg-grid-pattern">

        {/* Soft Radial Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#00a6f5]/15 dark:bg-[#00a6f5]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 space-y-8 max-w-4xl mx-auto flex flex-col items-center">

          {/* Top Monospace Indicator Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-[#00a6f5] text-xs font-mono font-bold shadow-xs uppercase tracking-wider"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a6f5] animate-ping"></span>
            AVAILABLE FOR ALL VERIFIED .EDU ACCOUNTS
          </motion.div>

          {/* Massive Ultra-Wide Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl font-heading font-black tracking-tight text-slate-900 dark:text-white leading-[0.98] uppercase"
          >
            Your College. <br />
            <span className="text-[#00a6f5]">Your People.</span> <br />
            <span className="text-slate-400 dark:text-slate-500 font-extrabold">Your Vibe.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium"
          >
            Connect with your campus through confessions, disappearing chats, anonymous posts, group communities, memes, and real conversations.
          </motion.p>

          {/* Exact Pill CTA Buttons from Reference Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6 pt-2 w-full flex flex-col items-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto">
              {/* Primary Pill Button: JOIN YOUR CAMPUS -> */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full sm:w-auto bg-[#00a6f5] hover:bg-[#008be0] text-white font-heading font-extrabold px-9 py-4 rounded-full shadow-lg shadow-[#00a6f5]/30 hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-105 active:scale-95 text-sm uppercase tracking-wider"
              >
                <span>{isGoogleLoading ? 'Connecting...' : 'JOIN YOUR CAMPUS'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Secondary Pill Button: EXPLORE CONFESSIONS */}
              <a
                href="#utility"
                className="w-full sm:w-auto px-9 py-4 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-slate-100 font-heading font-extrabold text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-3 shadow-xs hover:scale-105 text-sm uppercase tracking-wider"
              >
                <Ghost className="w-4 h-4 text-purple-500 stroke-[2.5]" />
                <span>EXPLORE CONFESSIONS</span>
              </a>
            </div>

            {/* Bottom Monospace Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium pt-2">
              <span className="flex items-center gap-1.5"><Ghost className="w-3.5 h-3.5 text-purple-500" /> Anonymous</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-[#00a6f5]" /> Vanish Chat</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-500" /> Communities</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Campus Fun</span>
            </div>
          </motion.div>

        </div>

      </section>

      {/* University Logos Marquee Bar */}
      <section className="py-8 bg-white dark:bg-[#111722] border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">
            ACTIVE VERIFIED SOCIAL CLUSTERS ACROSS TOP CAMPUSES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-slate-600 dark:text-slate-300 font-bold text-sm font-heading">
            <span>Stanford University</span>
            <span>UC Berkeley</span>
            <span>Harvard</span>
            <span>MIT</span>
            <span>NYU</span>
            <span>UT Austin</span>
            <span>IIT Delhi</span>
            <span>Delhi University</span>
          </div>
        </div>
      </section>

      {/* Section 1: Features Grid */}
      <section id="utility" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-left max-w-3xl mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-[#00a6f5] text-xs font-mono font-bold uppercase tracking-wider">
            EVERYTHING CAMPUS SOCIAL
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Everything you need for an unforgettable college social life.
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >

          {/* Card 1: Anonymous Confessions */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#151c28] rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-lg transition-all space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
              <Ghost className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
              Anonymous Confessions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Say what you’ve never been able to say. Every confession automatically disappears after 24 hours.
            </p>
          </motion.div>

          {/* Card 2: Vanish Mode */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#151c28] rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-lg transition-all space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
              Vanish Mode
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Chats automatically disappear after they’re seen. No screenshots. No pressure. Just real conversations.
            </p>
          </motion.div>

          {/* Card 3: Campus Feed */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#151c28] rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-lg transition-all space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-[#00a6f5] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#00a6f5]" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
              Campus Feed
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Discover what’s happening inside your college. Memes, stories, events, opinions, and trending discussions.
            </p>
          </motion.div>

          {/* Card 4: Communities */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#151c28] rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-lg transition-all space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
              Communities
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Create your own groups for clubs, hostels, gaming, coding, sports, anime, music, or anything.
            </p>
          </motion.div>

          {/* Card 5: Group Chats */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#151c28] rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-lg transition-all space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-[#00a6f5] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-[#00a6f5]" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
              Group Chats
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Talk with classmates, seniors, clubs, or friends in real time with private group messaging.
            </p>
          </motion.div>

          {/* Card 6: Campus Trends */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#151c28] rounded-3xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-lg transition-all space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
              Campus Trends
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              See what’s trending inside your college today. Festival moments, polls, late-night hostel stories, and secrets.
            </p>
          </motion.div>

        </motion.div>
      </section>

      {/* Section 2: How It Works ("Three Steps") */}
      <section id="how-it-works" className="py-24 px-4 md:px-8 bg-slate-100/70 dark:bg-[#0e1420] border-t border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 text-[#00a6f5] text-xs font-mono font-bold uppercase tracking-wider">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              Three steps to your private campus social network
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white dark:bg-[#151c28] rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-lg relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-mono font-black text-[#00a6f5]">01</span>
                <ArrowRight className="w-5 h-5 text-[#00a6f5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 font-heading">
                Verify with .edu
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Claim your private school namespace. Authenticated with your official university credentials for 100% student verification.
              </p>
            </div>

            <div className="bg-white dark:bg-[#151c28] rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-lg relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-mono font-black text-[#00a6f5]">02</span>
                <ArrowRight className="w-5 h-5 text-[#00a6f5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 font-heading">
                Find Your Communities
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Instantly get sorted into your actual major feeds, hostel groups, interest clubs, and dorm channels.
              </p>
            </div>

            <div className="bg-white dark:bg-[#151c28] rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-lg relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-mono font-black text-[#00a6f5]">03</span>
                <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 font-heading">
                Express & Connect Freely
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Post anonymous confessions, start Vanish Mode chats, share memes, and build real college friendships.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Section 3: Campus Traction (Dark High-Contrast Metric Banner) */}
      <section id="traction" className="py-24 px-4 md:px-8 bg-[#0c121d] text-white">
        <div className="max-w-7xl mx-auto">

          <div className="grid lg:grid-cols-12 gap-10 items-end mb-16">
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-mono font-bold text-[#00a6f5] uppercase tracking-wider">
                CAMPUS TRACTION
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                By students, purely for student social connections.
              </h2>
            </div>
            <div className="lg:col-span-5 text-xs text-slate-400 leading-relaxed font-medium">
              Our mission is to bypass commercial corporate networks and build a private, student-first social ecosystem where every conversation actually belongs to you.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-[#151c28] p-8 rounded-3xl border border-slate-800 space-y-2">
              <div className="text-4xl md:text-5xl font-black font-heading text-white">
                48,000+
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Verified Classmates
              </div>
            </div>

            <div className="bg-[#151c28] p-8 rounded-3xl border border-slate-800 space-y-2">
              <div className="text-4xl md:text-5xl font-black font-heading text-white">
                110,000+
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Confessions & Posts
              </div>
            </div>

            <div className="bg-[#151c28] p-8 rounded-3xl border border-slate-800 space-y-2">
              <div className="text-4xl md:text-5xl font-black font-heading text-[#00a6f5]">
                500+
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Student Communities
              </div>
            </div>

            <div className="bg-[#151c28] p-8 rounded-3xl border border-slate-800 space-y-2">
              <div className="text-4xl md:text-5xl font-black font-heading text-white">
                98%
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Anonymity Security Rate
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* Section 5: High-Contrast CTA Banner */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-[#0c1b2c] via-[#10243b] to-[#004e80] text-white rounded-[36px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">

            <div className="lg:col-span-8 space-y-4">
              <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-sky-400/30">
                YOUR CAMPUS AWAITS
              </span>
              <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                Your College Already Has Stories. Be Part of Them.
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium max-w-xl">
                Join your campus community, make friends, post anonymously, create communities, and experience college like never before.
              </p>
            </div>

            <div className="lg:col-span-4 text-center lg:text-right space-y-4">
              <div>
                <div className="text-3xl md:text-4xl font-black font-heading text-white">100% PRIVATE</div>
                <div className="text-[10px] text-sky-300 font-mono font-bold uppercase mt-1">
                  EXCLUSIVELY FOR YOUR COLLEGE
                </div>
              </div>
              <button
                onClick={handleGoogleSignIn}
                className="bg-white hover:bg-sky-50 text-[#00a6f5] font-extrabold px-8 py-4 rounded-full shadow-lg transition-all cursor-pointer inline-block"
              >
                Join Collex Today
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b1019] text-slate-400 py-16 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-[#00a6f5] font-extrabold text-2xl font-heading">
              Collex
            </div>
            <p className="text-xs leading-relaxed font-medium text-slate-400">
              The private social network built exclusively for university students. Connect, confess, create communities, and experience campus life together.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-4">PLATFORM</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/home" className="hover:text-[#00a6f5] transition">Campus Feed</Link></li>
              <li><Link to="/anonymous" className="hover:text-[#00a6f5] transition">Anonymous Confessions</Link></li>
              <li><Link to="/messages" className="hover:text-[#00a6f5] transition">Vanish Mode Chats</Link></li>
              <li><Link to="/community" className="hover:text-[#00a6f5] transition">College Communities</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-4">COMPANY</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><a href="#utility" className="hover:text-[#00a6f5] transition">Our Mission</a></li>
              <li><a href="#how-it-works" className="hover:text-[#00a6f5] transition">Student Privacy</a></li>
              <li><a href="#traction" className="hover:text-[#00a6f5] transition">Campus Clusters</a></li>
              <li><a href="#voices" className="hover:text-[#00a6f5] transition">Student Reviews</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-4">RESOURCES</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/privacy" className="hover:text-[#00a6f5] transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#00a6f5] transition">Terms of Service</Link></li>
              <li><Link to="/contact" className="hover:text-[#00a6f5] transition">Support Hub</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-center text-xs text-slate-500 font-semibold">
          © 2026 Collex. All rights reserved. Empowering university students everywhere.
        </div>
      </footer>

    </div>
  );
}
