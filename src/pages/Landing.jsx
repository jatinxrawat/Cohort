import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Send,
  Heart,
  MessageCircle,
  Calendar,
  ChevronRight,
  Sparkles,
  Flame,
  Compass,
  Zap,
  Users,
  ShoppingBag,
  Briefcase,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  X,
  Layers,
  BarChart3,
  Check,
  Download,
  Smartphone,
  Bell,
  Apple
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LogoIcon, LogoText } from '@/components/Logo';
import Carousel from '@/components/Carousel';
import Topography from '@/components/Topography';
import Aurora from '@/components/Aurora';
import { COLLEGES } from '@/utils/colleges';
import SEO from '@/components/SEO';
import SpecularButton from '@/components/SpecularButton';
import BorderGlow from '@/components/BorderGlow';

// --- MOCK UNIVERSITY DATA ---
// Static COLLEGES data imported from utils/colleges

// Measures its container and passes the width down to Carousel so it fills the full card
function CarouselCard() {
  const wrapRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(400);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setCardWidth(entry.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} id="feature-carousel-section" style={{ width: '100%', height: '100%', minHeight: 420 }}>
      <Carousel
        autoplay={true}
        autoplayDelay={3000}
        pauseOnHover={true}
        loop={true}
        round={false}
        baseWidth={cardWidth}
      />
    </div>
  );
}


const VIBE_TAGS = [
  { label: 'CONFESSION', icon: Flame, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/20' },
  { label: 'CRUSH', icon: Heart, iconColor: 'text-rose-400', iconBg: 'bg-rose-500/20' },
  { label: 'LOST & FOUND', icon: Sparkles, iconColor: 'text-amber-400', iconBg: 'bg-amber-500/20' },
  { label: 'STORY TIME', icon: MessageCircle, iconColor: 'text-sky-400', iconBg: 'bg-sky-500/20' },
  { label: 'PSA', icon: Zap, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
  { label: 'FIT CHECK', icon: Users, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
  { label: 'DM ME', icon: Send, iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/20' },
  { label: 'EVENTS', icon: Calendar, iconColor: 'text-pink-400', iconBg: 'bg-pink-500/20' },
  { label: 'CAREER', icon: Briefcase, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
  { label: 'MARKETPLACE', icon: ShoppingBag, iconColor: 'text-teal-400', iconBg: 'bg-teal-500/20' },
];

const AndroidIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.6 9.48l1.65-2.86c.12-.2.05-.46-.15-.57-.2-.12-.46-.05-.57.15l-1.68 2.9C15.22 8.43 13.67 8 12 8s-3.22.43-4.85 1.1l-1.68-2.9c-.11-.2-.37-.27-.57-.15-.2.11-.27.37-.15.57L6.4 9.48C3.9 10.96 2.18 13.49 2 16.5h20c-.18-3.01-1.9-5.54-4.4-7.02zM8 13.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();



  // --- STATE MANAGEMENT ---
  const [selectedVibe, setSelectedVibe] = useState('CONFESSION');
  const [isAllFeaturesModalOpen, setIsAllFeaturesModalOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [notifyLaunch, setNotifyLaunch] = useState(true);

  const isModalOpen = showDownloadModal || isAllFeaturesModalOpen;

  // Confession state
  const [localConfessions] = useState([
    { text: "I've been using ChatGPT to write all my weekly email check-ins to my advisor and today he told me my writing style is 'deeply poetic'. 😭", likes: 89, time: 'Just now', user: 'Anonymous Coping' }
  ]);

  // Poll state (interactive toggle)
  const [selectedPollIndex, setSelectedPollIndex] = useState(null);
  const [pollVotes, setPollVotes] = useState([
    { label: 'Only if there is free double shot espresso', count: 84 },
    { label: 'Yes, sleep is for the weak', count: 36 },
    { label: 'I study CS. The sun is a myth.', count: 80 }
  ]);

  const totalPollVotes = pollVotes.reduce((acc, curr) => acc + curr.count, 0);

  // Handle Poll Vote Toggle
  const handleTogglePollVote = (index) => {
    setPollVotes(prev => {
      return prev.map((opt, i) => {
        if (i === index) {
          const isRemoving = selectedPollIndex === index;
          return { ...opt, count: isRemoving ? Math.max(0, opt.count - 1) : opt.count + 1 };
        } else if (selectedPollIndex === i) {
          return { ...opt, count: Math.max(0, opt.count - 1) };
        }
        return opt;
      });
    });

    setSelectedPollIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-3 sm:p-5 md:p-7 space-y-5 selection:bg-purple-500/30 selection:text-purple-300">
      <SEO
        title="Cohort - Your Campus Social Media"
        description="The social media for campus and college students. Join Cohort to connect with campus communities, events, confessions, gossip, making friends, anonymous talks, and unfiltered takes."
      />

      {/* Centered Responsive Container with max-width constraint */}
      <div className="w-full max-w-[1440px] mx-auto space-y-5 sm:space-y-6">

        {/* --- FIZZ-STYLE HERO BANNER CONTAINER (AURORA EFFECT - FULL SCREEN DESKTOP HERO) --- */}
        <div className="relative rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-neutral-950 border border-neutral-800 p-5 sm:p-8 lg:p-10 xl:p-12 text-white shadow-2xl overflow-hidden flex flex-col justify-between min-h-[calc(100vh-2.5rem)]">

          {/* Mobile Static Glow (Ultra Fast, Zero GPU Shader Overhead) */}
          <div className="md:hidden absolute inset-0 pointer-events-none opacity-60 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/50 via-neutral-950 to-neutral-950" />

          {/* Desktop WebGL Aurora Background Layer (Hidden on Mobile) */}
          <div className="hidden md:block absolute inset-0 pointer-events-none opacity-65 z-0 overflow-hidden">
            <Aurora
              colorStops={["#7c3aed", "#c084fc", "#ec4899"]}
              blend={0.6}
              amplitude={1.2}
              speed={0.6}
              paused={isModalOpen}
            />
          </div>

          {/* --- HEADER NAVBAR INSIDE HERO CARD --- */}
          <header className="relative z-20 flex items-center justify-between gap-2 mb-4 lg:mb-6">
            <Link to="/" className="flex items-center gap-2 sm:gap-3.5 group flex-shrink-0">
              <LogoIcon className="w-8 h-8 sm:w-12 sm:h-12 transform group-hover:scale-105 transition-transform drop-shadow-md" variant="badge" glow={true} />
              <span className="font-display font-black text-lg sm:text-2xl lg:text-3xl tracking-tight text-white whitespace-nowrap">
                Cohort<span className="text-pink-500">.</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 bg-neutral-950/90 backdrop-blur-2xl border border-neutral-800 px-6 xl:px-8 py-3 rounded-full text-sm xl:text-base font-black shadow-2xl">
              <a href="#vibe-hubs" className="text-neutral-200 hover:text-white transition-colors">Vibe Hubs</a>
              <a href="#feature-wheel-section" className="text-neutral-200 hover:text-white transition-colors">Features Wheel</a>
              <a href="#features-deck" className="text-neutral-200 hover:text-white transition-colors">What's Inside</a>
              <Link to="/uncut" className="text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5 group/nav">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                <span className="group-hover/nav:text-pink-400 transition-colors">Cohort Uncut</span>
              </Link>
            </nav>

            {/* Action Button */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {isAuthenticated ? (
                <SpecularButton
                  onClick={() => navigate('/home')}
                  size="md"
                  radius={999}
                  tint="#9333ea"
                  tintOpacity={0.9}
                  textColor="#ffffff"
                  lineColor="#c084fc"
                  baseColor="#6b21a8"
                  autoAnimate={true}
                  paused={isModalOpen}
                >
                  <span className="whitespace-nowrap">Enter App</span>
                </SpecularButton>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-neutral-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Log In
                  </button>
                  <SpecularButton
                    onClick={() => navigate('/signup')}
                    size="md"
                    radius={999}
                    tint="#9333ea"
                    tintOpacity={0.9}
                    textColor="#ffffff"
                    lineColor="#c084fc"
                    baseColor="#6b21a8"
                    autoAnimate={true}
                    paused={isModalOpen}
                  >
                    <span className="whitespace-nowrap">Sign Up Free</span>
                  </SpecularButton>
                </div>
              )}
            </div>
          </header>

          {/* --- HERO CONTENT GRID --- */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-center my-auto">

            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 backdrop-blur-md text-xs font-bold tracking-wider uppercase text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>FIRST DIGITAL CAMPUS APP</span>
              </div>

              <div className="space-y-2">
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-white drop-shadow-md">
                  Cohort<span className="text-pink-500">.</span>
                </h1>

                <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight tracking-tight drop-shadow-md text-white">
                  Your Campus <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">  Social Media</span>
                </h2>
              </div>

              <p className="text-neutral-300 text-sm sm:text-base lg:text-lg max-w-xl font-medium leading-relaxed">
                Join real, unfiltered conversations, anonymous confessions, campus marketplace listings, and vibe matching at your university.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
                <SpecularButton
                  onClick={() => navigate('/signup')}
                  size="lg"
                  radius={999}
                  tint="#9333ea"
                  tintOpacity={0.95}
                  textColor="#ffffff"
                  lineColor="#f472b6"
                  baseColor="#7e22ce"
                  autoAnimate={true}
                  shineSize={15}
                  className="w-full sm:w-auto justify-center"
                  paused={isModalOpen}
                >
                  <span className="whitespace-nowrap">Sign Up Free</span>
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </SpecularButton>
                <SpecularButton
                  onClick={() => setShowDownloadModal(true)}
                  size="lg"
                  radius={999}
                  tint="#171717"
                  tintOpacity={0.8}
                  textColor="#e5e5e5"
                  lineColor="#a855f7"
                  baseColor="#262626"
                  autoAnimate={false}
                  className="w-full sm:w-auto justify-center active:scale-95 transition-transform"
                  paused={isModalOpen}
                >
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Download App</span>
                  </div>
                </SpecularButton>
              </div>
            </div>

            {/* Right Column: Floating 3D Interactive Mockup Cards (Hidden on Mobile) */}
            <div className="hidden lg:block lg:col-span-5 relative space-y-3 sm:space-y-3.5">

              {/* Live Confession Card Preview */}
              <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl text-left transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Anonymous Confession
                  </span>
                  <span className="text-[11px] text-neutral-400">2m ago</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                  "{localConfessions[0].text}"
                </p>
                <div className="flex items-center gap-4 mt-2.5 text-xs text-neutral-400 font-bold">
                  <span className="flex items-center gap-1 text-pink-400">
                    <Heart className="w-3.5 h-3.5 fill-pink-400" /> {localConfessions[0].likes + 12}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> 24 replies
                  </span>
                </div>
              </div>

              {/* Live Campus Poll Preview */}
              <div className="bg-neutral-900/90 backdrop-blur-2xl border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(147,51,234,0.2)] text-left hover:border-purple-500/50 transition-all duration-300 relative group overflow-hidden">
                {/* Subtle gradient top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-80" />

                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black text-purple-400 tracking-wider uppercase flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <span>Daily Campus Poll</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-extrabold px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 font-mono">
                    {totalPollVotes} votes
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-extrabold text-white mb-2.5 tracking-tight leading-snug">
                  Can you survive a 9 AM Monday lecture?
                </p>

                <div className="space-y-2">
                  {pollVotes.map((opt, idx) => {
                    const isSelected = selectedPollIndex === idx;
                    const pct = totalPollVotes > 0 ? Math.round((opt.count / totalPollVotes) * 100) : 0;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTogglePollVote(idx)}
                        className={`w-full text-left relative overflow-hidden rounded-xl sm:rounded-2xl py-2 px-3 text-xs font-bold transition-all duration-300 flex items-center justify-between cursor-pointer border ${isSelected
                          ? 'bg-purple-950/40 border-purple-500/80 ring-2 ring-purple-500/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                          : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600'
                          }`}
                      >
                        {/* Animated Progress Bar Fill */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${isSelected
                            ? 'bg-gradient-to-r from-purple-600/50 via-pink-600/40 to-purple-500/40'
                            : selectedPollIndex !== null
                              ? 'bg-neutral-700/40'
                              : 'bg-transparent'
                            }`}
                          style={{ width: `${selectedPollIndex !== null ? pct : 0}%` }}
                        />

                        {/* Label & Toggle Check Indicator */}
                        <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-purple-500 border-purple-400 text-white shadow-xs' : 'border-neutral-500 bg-neutral-900/60'
                            }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="truncate">{opt.label}</span>
                        </div>

                        {/* Vote Count / Percentage Pill */}
                        <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
                          {selectedPollIndex !== null ? (
                            <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-purple-500 text-white shadow-xs' : 'bg-neutral-900/80 text-neutral-300'
                              }`}>
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-neutral-900/80 text-purple-300 border border-purple-500/30 group-hover:border-purple-400 transition-colors">
                              Vote
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* --- MID-SECTION 2 LARGE FIZZ ROUNDED CARDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch" id="vibe-hubs">

          {/* LEFT CARD: YOUR IRL COMMUNITY & VIBE TAGS */}
          <BorderGlow
            borderRadius={36}
            backgroundColor="#120F17"
            glowColor="270 85 75"
            glowRadius={50}
            glowIntensity={1.2}
            coneSpread={30}
            animated={false}
            disableGlow={true}
            colors={['#c084fc', '#f472b6', '#38bdf8']}
            className="h-full"
          >
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 text-left h-full">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  NEARBY VIBES
                </div>
                <h2 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
                  Your IRL community
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                  See what's happening in your campus world
                </p>
              </div>

              {/* Vibe Pills Floating Grid */}
              <div className="flex flex-wrap gap-2.5 py-4">
                {VIBE_TAGS.map((tag, idx) => {
                  const IconComp = tag.icon;
                  const isSelected = selectedVibe === tag.label;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedVibe(tag.label)}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-extrabold tracking-wide flex items-center gap-2 transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-neutral-900/90 text-white border-purple-500/60 ring-1 ring-purple-500/40 shadow-md scale-[1.03]'
                        : 'bg-neutral-900/60 text-neutral-300 border-white/10 hover:bg-neutral-800/80 hover:text-white hover:border-white/20'
                        }`}
                    >
                      <span className={`p-1 rounded-full flex items-center justify-center ${tag.iconBg} ${tag.iconColor}`}>
                        <IconComp className="w-3.5 h-3.5 stroke-[2.2]" />
                      </span>
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedVibe === 'CONFESSION') {
                    navigate(isAuthenticated ? '/confessions' : '/signup');
                  } else if (selectedVibe === 'MARKETPLACE') {
                    navigate(isAuthenticated ? '/marketplace' : '/signup');
                  } else {
                    navigate(isAuthenticated ? '/anonymous' : '/signup', { state: { selectedCategory: selectedVibe } });
                  }
                }}
                className="p-4 rounded-2xl bg-neutral-950/90 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/50 text-xs text-neutral-300 flex items-center justify-between transition-all cursor-pointer group w-full text-left active:scale-[0.99]"
              >
                <span className="font-semibold">Showing active posts tagged <strong className="text-purple-400 group-hover:underline">#{selectedVibe}</strong></span>
                <div className="flex items-center gap-1.5 text-purple-400 font-extrabold group-hover:translate-x-1 transition-transform">
                  <span>View Feed</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </BorderGlow>

          {/* RIGHT CARD: FEATURE CAROUSEL (Hidden on Mobile) */}
          <div className="hidden lg:block h-full bg-[#120F17] border border-neutral-800 rounded-[36px] overflow-hidden">
            <CarouselCard />
          </div>

        </div>

        {/* --- FEATURES DECK GRID (WHAT'S INSIDE COHORT.) --- */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] sm:rounded-[36px] p-6 sm:p-10 space-y-8 text-left" id="features-deck">
          <div>
            <span className="text-xs font-mono uppercase bg-purple-500/20 text-purple-300 px-3.5 py-1.5 rounded-full border border-purple-500/30 font-bold">
              Inside Cohort
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl mt-4 text-white">
              Everything happening in your world
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">Anonymous Confessions</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Share real, unfiltered campus thoughts with 100% identity privacy and vanish mode.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">Campus Community</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Discover college clubs, academic branch groups, interest hubs, and live chat rooms.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">Campus Marketplace</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Buy and sell textbooks, dorm gadgets, and gear directly with verified peers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">Make a Friend</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Match with college peers based on tech stacks, branch, and shared hobbies.
              </p>
            </div>

          </div>
        </div>

        {/* --- COHORT UNCUT PROMOTIONAL SECTION --- */}
        <div className="relative w-full max-w-[1440px] mx-auto py-2">
          <BorderGlow
            borderRadius={36}
            backgroundColor="#0e0c15"
            glowColor="325 90 70"
            glowRadius={60}
            glowIntensity={1.3}
            coneSpread={35}
            animated={true}
            colors={['#FF2A85', '#963BFF', '#00F0FF']}
            className="w-full"
          >
            <div className="p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 text-left relative overflow-hidden">
              {/* Background elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

              {/* Left Content */}
              <div className="space-y-5 max-w-2xl z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 backdrop-blur-md text-[10px] font-black tracking-wider uppercase text-pink-400 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>NEW STORY CORNER</span>
                </div>
                <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-white leading-tight">
                  Read campus stories on <br />
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">Cohort Uncut</span>
                </h2>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-medium">
                  No boring articles or stuffy journals here. Dive into fresh, engaging college stories about love, late-night campus trauma, heartbreak, sacrifice, exam failure, and all the unwritten rules we silently live by.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to="/uncut"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-pink-500/40 text-pink-400 hover:text-pink-300 text-xs font-extrabold shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>Publish your campus story</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-500 stroke-[2.5]" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400">
                    #LateNightThoughts
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400">
                    #CampusPsychology
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400">
                    #DormRoomVibes
                  </span>
                </div>
              </div>

              {/* Right Card / Visual Teaser */}
              <div className="w-full lg:w-96 flex-shrink-0 z-10">
                <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/80 rounded-3xl p-6 shadow-2xl text-left hover:border-pink-500/40 transition-all duration-300 relative group overflow-hidden">
                  {/* Glow bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500" />

                  <span className="text-[10px] font-bold text-pink-400 tracking-widest uppercase">
                    Featured Story
                  </span>

                  <h3 className="font-display font-black text-base text-white mt-2 mb-3 leading-snug group-hover:text-pink-400 transition-colors">
                    Seven Days that Changed us
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-3 mb-4 leading-relaxed">
                    Some things teach you more about yourself than anything else ever could. For us, building Cohort has been one of those things.
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold border-t border-neutral-800/85 pt-3">
                    <span>4 min read</span>
                    <div className="flex items-center gap-1.5 text-pink-400">
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Cover Link to /uncut/seven-days-changed-us */}
                  <Link to="/uncut/seven-days-changed-us" className="absolute inset-0 z-20 cursor-pointer" aria-label="Read full article" />
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* --- BOTTOM CALL-TO-ACTION FIZZ PURPLE CARD --- */}
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] p-8 sm:p-14 text-center text-white shadow-2xl relative overflow-hidden border border-white/20 space-y-6">
          <div className="flex justify-center mb-2">
            <LogoIcon className="w-14 h-14 drop-shadow-xl" variant="badge" glow={true} />
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight">
            Join your campus community today
          </h2>

          <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Connect with verified students at your college. Sign up in seconds with your student email.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <SpecularButton
              onClick={() => navigate('/signup')}
              size="lg"
              radius={999}
              tint="#ffffff"
              tintOpacity={1}
              textColor="#581c87"
              lineColor="#ffffff"
              baseColor="#e9d5ff"
              autoAnimate={true}
              shineSize={20}
              paused={isModalOpen}
            >
              <div className="flex items-center gap-1">
                <span>Sign Up Free</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </div>
            </SpecularButton>

            <SpecularButton
              onClick={() => setShowDownloadModal(true)}
              size="lg"
              radius={999}
              tint="#000000"
              tintOpacity={0.4}
              textColor="#ffffff"
              lineColor="#f472b6"
              baseColor="#3b0764"
              autoAnimate={false}
              className="active:scale-95 transition-transform"
              paused={isModalOpen}
            >
              <div className="flex items-center gap-2">
                <Download className="w-4.5 h-4.5 text-purple-200" />
                <span>Download App</span>
              </div>
            </SpecularButton>
          </div>

          {/* Footer links */}
          <div className="pt-8 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-white/80">
            <span>Cohort Social Corp. © 2026</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="hover:underline flex items-center gap-1 text-white font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download App
              </button>
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="hover:underline">Terms of Service</Link>
              <Link to="/contact" className="hover:underline">Support</Link>
            </div>
          </div>
        </div>

        {/* --- ALL FEATURES OVERLAY MODAL --- */}
        {isAllFeaturesModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <Layers className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-extrabold text-white">
                      All Cohort Features
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Complete list of campus features & tools
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAllFeaturesModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Grid */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURE_ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-purple-500/50 transition-all flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/20 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-extrabold text-neutral-100">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-950/80 border-t border-neutral-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsAllFeaturesModalOpen(false)}
                  className="py-2.5 px-6 rounded-xl border border-neutral-700 text-xs font-bold text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Close Features Window
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Download App Modal Popup */}
        <AnimatePresence>
          {showDownloadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative w-full max-w-sm bg-neutral-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-5 overflow-hidden"
              >
                {/* Glow Ambient Highlights */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Top Header Row with Live Status Pill */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    <span>App Download Live</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDownloadModal(false)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Central Icon Badge */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 border border-white/20">
                  <Smartphone className="w-8 h-8" />
                </div>

                {/* Main Title & Description (No Emojis) */}
                <div className="space-y-2">
                  <h3 className="text-xl font-heading font-extrabold text-white tracking-tight">
                    Get Cohort on Mobile
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-xs mx-auto font-medium">
                    Experience instant campus notifications, zero-latency chats, and exclusive mobile features directly from your phone.
                  </p>
                </div>

                {/* Download Options */}
                <div className="space-y-3 pt-2">
                  {/* Android Download Option */}
                  <div className="space-y-1">
                    <a
                      href="/cohort.apk"
                      download="cohort.apk"
                      onClick={() => setShowDownloadModal(false)}
                      className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <AndroidIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Download Android APK</span>
                    </a>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      Latest Build · APK format (direct install)
                    </p>
                  </div>

                  {/* iOS Option (Coming Soon) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-neutral-800/80 border border-neutral-800 text-neutral-500 font-extrabold text-sm select-none">
                      <Apple className="w-5 h-5 flex-shrink-0" />
                      <span>iOS App (TestFlight Soon)</span>
                    </div>
                  </div>
                </div>

                {/* Cool Interactive Notification Switch Toggle */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${notifyLaunch ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-800 text-neutral-500'
                      }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-white truncate">App Update Alerts</h5>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {notifyLaunch ? "You'll be notified of new releases" : "Alerts disabled"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifyLaunch(!notifyLaunch)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer ${notifyLaunch ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm' : 'bg-neutral-800'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${notifyLaunch ? 'translate-x-5' : 'translate-x-0'
                      }`}>
                      {notifyLaunch && <Check className="w-3 h-3 text-purple-600 stroke-[3]" />}
                    </div>
                  </button>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(false)}
                  className="w-full py-2.5 px-4 rounded-2xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
