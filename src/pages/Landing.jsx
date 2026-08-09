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
  ChevronUp,
  ChevronDown,
  X,
  Layers,
  BarChart3,
  Check,
  Download,
  Smartphone,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LogoIcon, LogoText } from '@/components/Logo';
import OptionWheel from '@/components/OptionWheel';
import Topography from '@/components/Topography';
import Aurora from '@/components/Aurora';
import SpecularButton from '@/components/SpecularButton';
import BorderGlow from '@/components/BorderGlow';

// --- MOCK UNIVERSITY DATA ---
const COLLEGES = [
  {
    id: 'general',
    name: 'Select Campus (Global View)',
    short: 'Global',
    color: '#00F0FF',
    tagline: 'Connect across the student universe.',
    confessions: [
      { text: "Accidentally replied-all to the entire department instead of my friend. The email said 'this prof is so boring'. Transferring colleges ASAP. 💀", likes: 1024, comments: 45, time: '2m ago' },
      { text: "My crush sits next to me in Data Structures but I can't even sort my feelings, let alone an array. 😩", likes: 756, comments: 121, time: '15m ago' }
    ],
    events: [
      { name: "Late Night Laser Tag in the Quad", time: "Tonight at 10 PM", RSVPs: 142 },
      { name: "Free Pizza & Club Signups", time: "Friday at 5 PM", RSVPs: 89 }
    ]
  },
  {
    id: 'bu',
    name: 'Boston University',
    short: 'BU',
    color: '#FF2A4B',
    tagline: 'Terrier Nation is active.',
    confessions: [
      { text: "To the person who took the last hashbrown at Marciano dining hall... sleep with one eye open. I am watching you. 🍪", likes: 322, comments: 19, time: '5m ago' },
      { text: "Spent the entire night studying in Mugar and I think the ghosts on the 5th floor took my roommate's sanity.", likes: 145, comments: 8, time: '1h ago' }
    ],
    events: [
      { name: "Commonwealth Ave Pub Crawl", time: "Saturday at 8 PM", RSVPs: 310 },
      { name: "Mugar Library Exam Crying Session", time: "Tonight at 11 PM", RSVPs: 512 }
    ]
  },
  {
    id: 'nyu',
    name: 'New York University',
    short: 'NYU',
    color: '#A329FF',
    tagline: 'Washington Square Park chatter is live.',
    confessions: [
      { text: "To the guy playing acoustic guitar under the WSP arch at 3 AM: I have a chemistry midterm at 8 AM. Please stop playing Wonderwall.", likes: 452, comments: 34, time: '12m ago' },
      { text: "Bobst library is not a library, it is a high-fashion runway. Why is everyone wearing runway designer clothes to study computer science?", likes: 612, comments: 55, time: '3h ago' }
    ],
    events: [
      { name: "WSP Arch Skate Meetup & Pizza", time: "Friday at 4 PM", RSVPs: 195 },
      { name: "Bobst LL1 Sunset Cram Session", time: "Tomorrow at 6 PM", RSVPs: 120 }
    ]
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    short: 'Stanford',
    color: '#CC0000',
    tagline: 'Silicon Valley grind is on.',
    confessions: [
      { text: "Paying $100/hr to anyone who can explain CS224N attention mechanisms to me before 9 AM tomorrow. I am begging.", likes: 219, comments: 40, time: '1h ago' },
      { text: "Lost my bike for the 4th time this quarter. Checked the fountain, checked the palm trees, nothing. Who keeps stealing red Huffys?", likes: 340, comments: 22, time: '2h ago' }
    ],
    events: [
      { name: "Fountain Hopping Night Run", time: "Friday at 10 PM", RSVPs: 450 },
      { name: "Coho Coffee Hackathon Prep", time: "Tonight at 8 PM", RSVPs: 95 }
    ]
  },
  {
    id: 'iitd',
    name: 'IIT Delhi',
    short: 'IITD',
    color: '#FF6B00',
    tagline: 'LHC lobby is buzzing.',
    confessions: [
      { text: "Spent 10 hours debugging my BTech project just to find a missing semicolon. I want to hug a tree. 🌲", likes: 890, comments: 76, time: '4m ago' },
      { text: "The wind tunnel near the civil block literally blew my assignment papers away. Prof didn't believe me and marked me zero.", likes: 432, comments: 28, time: '4h ago' }
    ],
    events: [
      { name: "SDA Market Chai Session", time: "Tonight at 9 PM", RSVPs: 220 },
      { name: "LHC Coding Battle", time: "Saturday at 2 PM", RSVPs: 180 }
    ]
  }
];

const FEATURE_ITEMS = [
  'Anonymous Confessions',
  'Campus Community',
  'Campus Marketplace',
  'Make a Friend',
  'Vanish Gossip Mode',
  'Student Vibe Match',
  'Campus Polls & News',
  'Verified Peer Circles'
];

const VIBE_TAGS = [
  { label: 'CONFESSION', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: Flame },
  { label: 'CRUSH', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40', icon: Heart },
  { label: 'LOST & FOUND', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Sparkles },
  { label: 'STORY TIME', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: MessageCircle },
  { label: 'PSA', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Zap },
  { label: 'FIT CHECK', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Users },
  { label: 'DM ME', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Send },
  { label: 'EVENTS', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: Calendar },
  { label: 'CAREER', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40', icon: Briefcase },
  { label: 'MARKETPLACE', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: ShoppingBag },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const optionWheelRef = useRef(null);

  // --- STATE MANAGEMENT ---
  const [selectedVibe, setSelectedVibe] = useState('CONFESSION');
  const [isAllFeaturesModalOpen, setIsAllFeaturesModalOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [notifyLaunch, setNotifyLaunch] = useState(true);
  
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
      
      {/* --- FIZZ-STYLE HERO BANNER CONTAINER (AURORA EFFECT) --- */}
      <div className="relative rounded-[32px] sm:rounded-[40px] bg-neutral-950 border border-neutral-800 p-5 sm:p-10 lg:p-14 text-white shadow-2xl overflow-hidden">
        
        {/* React Bits Aurora WebGL Background Effect Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-65 z-0 overflow-hidden">
          <Aurora
            colorStops={["#7c3aed", "#c084fc", "#ec4899"]}
            blend={0.6}
            amplitude={1.2}
            speed={0.6}
          />
        </div>

        {/* --- HEADER NAVBAR INSIDE HERO CARD --- */}
        <header className="relative z-20 flex items-center justify-between mb-8 sm:mb-14">
          <Link to="/" className="flex items-center gap-3.5 group">
            <LogoIcon className="w-12 h-12 transform group-hover:scale-105 transition-transform drop-shadow-md" variant="badge" glow={true} />
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
              Cohort<span className="text-pink-500">.</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 bg-neutral-950/90 backdrop-blur-2xl border border-neutral-800 px-10 py-4 rounded-full text-base sm:text-lg font-black shadow-2xl">
            <a href="#vibe-hubs" className="text-neutral-200 hover:text-white transition-colors">Vibe Hubs</a>
            <a href="#feature-wheel-section" className="text-neutral-200 hover:text-white transition-colors">Features Wheel</a>
            <a href="#features-deck" className="text-neutral-200 hover:text-white transition-colors">What's Inside</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
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
              >
                Enter App
              </SpecularButton>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-neutral-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
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
                >
                  Sign Up Free
                </SpecularButton>
              </div>
            )}
          </div>
        </header>

        {/* --- HERO CONTENT GRID --- */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 backdrop-blur-md text-xs font-bold tracking-wider uppercase text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>FIRST DIGITAL CAMPUS APP</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight drop-shadow-md text-white">
              Your Campus. <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">Social Media.</span>
            </h1>

            <p className="text-neutral-300 text-sm sm:text-lg max-w-xl font-medium leading-relaxed">
              Join real, unfiltered conversations, anonymous confessions, campus marketplace listings, and vibe matching at your university.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
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
              >
                <span>Sign Up Free</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </SpecularButton>
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="cursor-pointer border-none bg-transparent p-0 active:scale-95 transition-transform"
              >
                <SpecularButton
                  size="lg"
                  radius={999}
                  tint="#171717"
                  tintOpacity={0.8}
                  textColor="#e5e5e5"
                  lineColor="#a855f7"
                  baseColor="#262626"
                  autoAnimate={false}
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Download App</span>
                  </div>
                </SpecularButton>
              </button>
            </div>
          </div>

          {/* Right Column: Floating 3D Interactive Mockup Cards */}
          <div className="lg:col-span-5 relative space-y-4">
            
            {/* Live Confession Card Preview */}
            <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl text-left transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Anonymous Confession
                </span>
                <span className="text-[11px] text-neutral-400">2m ago</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                "{localConfessions[0].text}"
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 font-bold">
                <span className="flex items-center gap-1 text-pink-400">
                  <Heart className="w-3.5 h-3.5 fill-pink-400" /> {localConfessions[0].likes + 12}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> 24 replies
                </span>
              </div>
            </div>

            {/* Live Campus Poll Preview */}
            <div className="bg-neutral-900/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(147,51,234,0.2)] text-left hover:border-purple-500/50 transition-all duration-300 relative group overflow-hidden">
              {/* Subtle gradient top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-80" />

              <div className="flex items-center justify-between mb-3">
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

              <p className="text-sm font-extrabold text-white mb-3 tracking-tight leading-snug">
                Can you survive a 9 AM Monday lecture?
              </p>

              <div className="space-y-2.5">
                {pollVotes.map((opt, idx) => {
                  const isSelected = selectedPollIndex === idx;
                  const pct = totalPollVotes > 0 ? Math.round((opt.count / totalPollVotes) * 100) : 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTogglePollVote(idx)}
                      className={`w-full text-left relative overflow-hidden rounded-2xl p-3 text-xs font-bold transition-all duration-300 flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/80 ring-2 ring-purple-500/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                          : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      {/* Animated Progress Bar Fill */}
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600/50 via-pink-600/40 to-purple-500/40'
                            : selectedPollIndex !== null
                            ? 'bg-neutral-700/40'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${selectedPollIndex !== null ? pct : 0}%` }}
                      />

                      {/* Label & Toggle Check Indicator */}
                      <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-purple-500 border-purple-400 text-white shadow-xs' : 'border-neutral-500 bg-neutral-900/60'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{opt.label}</span>
                      </div>

                      {/* Vote Count / Percentage Pill */}
                      <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
                        {selectedPollIndex !== null ? (
                          <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-purple-500 text-white shadow-xs' : 'bg-neutral-900/80 text-neutral-300'
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
          animated={true}
          colors={['#c084fc', '#f472b6', '#38bdf8']}
          className="h-full"
        >
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 text-left h-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
                    className={`px-4 py-2 rounded-full border text-xs font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
                      tag.color
                    } ${isSelected ? 'scale-105 shadow-md ring-2 ring-white/30' : 'hover:scale-105'}`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
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

        {/* RIGHT CARD: 3D FEATURE OPTION WHEEL */}
        <BorderGlow
          borderRadius={36}
          backgroundColor="#120F17"
          glowColor="310 85 75"
          glowRadius={50}
          glowIntensity={1.2}
          coneSpread={30}
          animated={true}
          colors={['#f472b6', '#c084fc', '#eab308']}
          className="h-full"
        >
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4 text-left min-h-[420px] sm:min-h-[460px] relative overflow-hidden h-full" id="feature-wheel-section">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold mb-2.5">
                ✦ FEATURE WHEEL
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                Explore Cohort Features
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-0.5">
                Use controls or scroll to discover features
              </p>
            </div>

            {/* Full Card 3D OptionWheel Container */}
            <div className="relative h-72 sm:h-80 bg-neutral-950/90 border border-neutral-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center p-2">
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none z-10" />
              
              {/* Step Controls (Up / Down Arrows) */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => optionWheelRef.current?.stepPrev()}
                  className="w-9 h-9 rounded-full bg-neutral-900/90 hover:bg-purple-600 border border-neutral-700 hover:border-purple-400 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
                  aria-label="Previous feature"
                  title="Previous feature"
                >
                  <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => optionWheelRef.current?.stepNext()}
                  className="w-9 h-9 rounded-full bg-neutral-900/90 hover:bg-purple-600 border border-neutral-700 hover:border-purple-400 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
                  aria-label="Next feature"
                  title="Next feature"
                >
                  <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <OptionWheel
                ref={optionWheelRef}
                items={FEATURE_ITEMS}
                defaultSelected={0}
                textColor="#737373"
                activeColor="#c084fc"
                side="left"
                fontSize={1.75}
                spacing={1.65}
                curve={1.1}
                tilt={9}
                blur={0}
                fade={0.35}
                smoothing={200}
                inset={32}
                loop={true}
                draggable={true}
              />
            </div>
          </div>
        </BorderGlow>

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
          >
            <div className="flex items-center gap-1">
              <span>Sign Up Free</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </div>
          </SpecularButton>

          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="cursor-pointer border-none bg-transparent p-0 active:scale-95 transition-transform"
          >
            <SpecularButton
              size="lg"
              radius={999}
              tint="#000000"
              tintOpacity={0.4}
              textColor="#ffffff"
              lineColor="#f472b6"
              baseColor="#3b0764"
              autoAnimate={false}
            >
              <div className="flex items-center gap-2">
                <Download className="w-4.5 h-4.5 text-purple-200" />
                <span>Download App</span>
              </div>
            </SpecularButton>
          </button>
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

      {/* Download App Launching Soon Modal Popup */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative w-full max-w-sm bg-neutral-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-5 overflow-hidden"
            >
              {/* Glow Ambient Highlights */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Top Header Row with Live Status Pill */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  <span>Cohort Team Hard At Work</span>
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
                  Native Mobile App Launching Soon
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-xs mx-auto font-medium">
                  The Cohort engineering team is actively building ultra-fast native iOS and Android apps. Experience instant campus notifications, zero-latency chats, and exclusive mobile vibes.
                </p>
              </div>

              {/* Cool Interactive Notification Switch Toggle */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    notifyLaunch ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-white truncate">Early Access Alert</h5>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {notifyLaunch ? "You'll be notified first on release" : "Alerts disabled"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNotifyLaunch(!notifyLaunch)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer ${
                    notifyLaunch ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm' : 'bg-neutral-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                    notifyLaunch ? 'translate-x-5' : 'translate-x-0'
                  }`}>
                    {notifyLaunch && <Check className="w-3 h-3 text-purple-600 stroke-[3]" />}
                  </div>
                </button>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
              >
                Got It, Thanks
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
