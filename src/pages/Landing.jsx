import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Send, 
  Heart, 
  MessageCircle, 
  Calendar, 
  ChevronRight, 
  Verified, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Flame, 
  EyeOff, 
  Compass, 
  Zap, 
  Users, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

// --- MOCK UNIVERSITY DATA ---
const COLLEGES = [
  {
    id: 'general',
    name: 'Select Campus (Global View)',
    short: 'Global',
    color: '#00F0FF', // Acid Cyan
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
    color: '#FF2A4B', // BU Crimson/Scarlet
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
    color: '#A329FF', // NYU Violet
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
    color: '#CC0000', // Stanford Red
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
    color: '#FF6B00', // IIT Orange
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

// --- VANISH MODE TEXT COMPONENT ---
function VanishText({ text }) {
  const [hovered, setHovered] = useState(false);
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (!hovered) {
      setDisplayedText(text);
      return;
    }
    let interval;
    let progress = 0;
    const chars = "░▒▓█_/?!@#$%^&*()";
    interval = setInterval(() => {
      progress += 8;
      if (progress >= 100) {
        setDisplayedText(text.split('').map(() => ' ').join(''));
        clearInterval(interval);
        return;
      }
      const next = text.split('').map((char, index) => {
        const threshold = (index / text.length) * 100;
        if (progress > threshold) {
          return Math.random() > 0.4 ? chars[Math.floor(Math.random() * chars.length)] : ' ';
        }
        return char;
      }).join('');
      setDisplayedText(next);
    }, 45);
    return () => clearInterval(interval);
  }, [hovered, text]);

  return (
    <span 
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      className="font-mono text-vandal-pink cursor-pointer select-none transition-all duration-300 relative group"
    >
      <span className="relative z-10">{displayedText}</span>
      <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-vandal-pink/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
    </span>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(COLLEGES[0]);
  const [switchboardTab, setSwitchboardTab] = useState('campus'); // 'campus' | 'public'
  const [activeTopic, setActiveTopic] = useState('memes');
  
  // Confession state
  const [localConfessions, setLocalConfessions] = useState([
    { text: "I've been using ChatGPT to write all my weekly email check-ins to my advisor and today he told me my writing style is 'deeply poetic'. 😭", likes: 89, time: 'Just now', user: 'Anonymous Coping' }
  ]);
  const [newConfessionText, setNewConfessionText] = useState('');
  
  // Poll state
  const [pollVoted, setPollVoted] = useState(false);
  const [pollChoice, setPollChoice] = useState(null);
  const [pollVotes, setPollVotes] = useState([
    { label: 'Only if there is free double shot espresso', pct: 42, count: 84 },
    { label: 'Yes, sleep is for the weak', pct: 18, count: 36 },
    { label: 'I study CS. The sun is a myth.', pct: 40, count: 80 }
  ]);

  // Live chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Alexa.cs', text: 'who has notes for the quiz?', time: '14:02', college: 'BU' },
    { sender: 'Kabir_04', text: 'discrete math is on chapter 4, easy', time: '14:03', college: 'IITD' },
    { sender: 'nyu_grind', text: 'anyone study at bobst now? get coffee', time: '14:05', college: 'NYU' }
  ]);

  // Handle Confession submission
  const handleConfessionSubmit = (e) => {
    e.preventDefault();
    if (!newConfessionText.trim()) return;
    const newConf = {
      text: newConfessionText,
      likes: 1,
      time: 'Just now',
      user: 'SecretStudent'
    };
    setLocalConfessions([newConf, ...localConfessions]);
    setNewConfessionText('');
  };

  // Handle Poll Vote
  const handleVote = (index) => {
    if (pollVoted) return;
    const newVotes = [...pollVotes];
    newVotes[index].count += 1;
    const total = newVotes.reduce((acc, curr) => acc + curr.count, 0);
    newVotes.forEach(v => {
      v.pct = Math.round((v.count / total) * 100);
    });
    setPollVotes(newVotes);
    setPollChoice(index);
    setPollVoted(true);
  };

  // Simulating live chat scrolling ticker
  useEffect(() => {
    const handleTicker = setInterval(() => {
      const texts = [
        "Is the cafeteria chicken safe today?",
        "Need a valorant duo partner, iron to gold idc",
        "Wait, is the library actually open till 3am?",
        "To the girl in red hoodie: u dropped ur airpods",
        "internship season is brutal, 120 rejections...",
        "does anybody have microeconomics past papers?"
      ];
      const colleges = ["BU", "NYU", "Stanford", "IITD", "Global"];
      const senders = ["RohanX", "terrier_life", "bobst_camper", "cardinal_09", "anon_strobe"];
      
      const newMsg = {
        sender: senders[Math.floor(Math.random() * senders.length)],
        text: texts[Math.floor(Math.random() * texts.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        college: colleges[Math.floor(Math.random() * colleges.length)]
      };
      setChatMessages(prev => [...prev.slice(1), newMsg]);
    }, 4500);

    return () => clearInterval(handleTicker);
  }, []);

  return (
    <div className="relative min-h-screen bg-midnight-slate text-neutral-100 overflow-x-hidden selection:bg-vandal-pink/20 selection:text-vandal-pink flex flex-col justify-between">
      
      {/* --- FLOATING AMBIENT GLOW ORBS --- */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-neon-indigo/5 blur-[120px] animate-blob-1" />
        <div className="absolute top-[25%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-topic-violet/5 blur-[130px] animate-blob-2" />
        <div className="absolute bottom-[20%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-vandal-pink/5 blur-[120px] animate-blob-3" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.12]" />
      </div>

      {/* --- SCROLLABLE HEADER (NOT FIXED) --- */}
      <header className="relative z-50 border-b border-white/10 bg-midnight-slate/90 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo isLanding={true} iconSize="w-9 h-9" />

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
            <a href="#features-deck" className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
              What's Inside
            </a>
            <a href="#switchboard" className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
              Hubs
            </a>
            <a href="#dual-split" className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
              How It Works
            </a>
          </nav>

          {/* Log In & Sign Up buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/home"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-vandal-pink to-topic-violet text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Enter App
              </Link>
            ) : (
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-vandal-pink via-topic-violet to-acid-cyan text-white text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Sign Up
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-midnight-slate border-l border-white/10 p-6 pt-24 space-y-6"
            >
              <nav className="flex flex-col gap-2">
                <a href="#features-deck" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-base font-semibold text-neutral-400 hover:bg-white/5">
                  What's Inside
                </a>
                <a href="#switchboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-base font-semibold text-neutral-400 hover:bg-white/5">
                  Hubs
                </a>
                <a href="#dual-split" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-base font-semibold text-neutral-400 hover:bg-white/5">
                  How It Works
                </a>
              </nav>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-vandal-pink via-topic-violet to-acid-cyan"
                >
                  Sign Up
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-grow">
        
        {/* --- HERO SECTION (Fits fully on load without scrolling) --- */}
        <section className="relative z-10 pt-4 pb-6 md:pt-8 md:pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center animate-pulse-slow">
          
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vandal-pink/15 text-vandal-pink border border-vandal-pink/20 text-[11px] font-semibold mb-3.5">
            <Sparkles className="w-3 h-3 text-vandal-pink animate-pulse-slow" />
            The private campus lounge you've been missing
          </div>

          {/* Corrected header: Compact size, normal word spacing and applied cross-browser gradient */}
          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl leading-[1.1] mb-4 max-w-4xl select-none">
            <span className="text-gradient-brand">
              COLLEGE IS CHAOTIC<br />
              DON'T SCROLL IT<br />
              ALL ALONE
            </span>
          </h1>

          {/* Explanation Box */}
          <div className="max-w-xl mx-auto bg-white/[0.03] border border-white/10 rounded-3xl p-4 sm:p-5 mb-5 shadow-xl relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-vandal-pink via-topic-violet to-acid-cyan" />
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-semibold">
              Cohort connects your college life. Lock in your verified student email to access your campus's secret confessions, local chat rooms, and student events—while chatting globally about career grind, gaming lobbies, and relationships with peers from any college.
            </p>
          </div>

          {/* Side-by-side high-contrast CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center w-full max-w-sm mx-auto mb-6">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-vandal-pink via-topic-violet to-acid-cyan text-white text-sm font-black shadow-lg shadow-vandal-pink/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign Up Free
              <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href="#switchboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/20 hover:border-acid-cyan/50 hover:bg-white/5 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-neutral-900/50 backdrop-blur-sm"
            >
              Explore Hubs
            </a>
          </div>

          {/* Custom channel tag widgets SHIFTED BELOW CTAS */}
          <div className="flex flex-wrap justify-center gap-3.5 max-w-3xl mx-auto select-none border-t border-white/5 pt-8 w-full">
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/95 text-xs font-mono font-bold flex items-center gap-2 shadow-lg hover:border-vandal-pink/30 hover:bg-white/[0.08] transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/40 font-semibold">#</span>
              <span>vanish-gossip</span>
              <span className="px-1.5 py-0.5 rounded bg-vandal-pink/20 text-[9px] text-vandal-pink uppercase font-mono font-black">Vanish Mode</span>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/95 text-xs font-mono font-bold flex items-center gap-2 shadow-lg hover:border-acid-cyan/30 hover:bg-white/[0.08] transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/40 font-semibold">#</span>
              <span>internships-coping</span>
              <span className="text-[10px] text-acid-cyan font-mono font-bold">84 active</span>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/95 text-xs font-mono font-bold flex items-center gap-2 shadow-lg hover:border-topic-violet/30 hover:bg-white/[0.08] transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-white/40 font-semibold">#</span>
              <span>relationships</span>
              <span className="text-[10px] text-topic-violet font-mono font-bold">19 online</span>
            </div>
          </div>

        </section>

        {/* --- DEDICATED FEATURES SHOWCASE SECTION (Brand color gradient headings, distinct color cards) --- */}
        <section id="features-deck" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-midnight-slate text-white text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase bg-vandal-pink/20 text-vandal-pink px-3.5 py-1.5 rounded-full border border-vandal-pink/30 font-bold">
              Inside Cohort
            </span>
            {/* Added color gradient to section title */}
            <h2 className="font-display font-black text-3xl sm:text-5xl mt-5 mb-4 text-white">
              WHAT MAKES <span className="text-gradient-brand">COHORT VIBE</span>
            </h2>
            <p className="text-neutral-400 text-lg">
              No academic stress, no professional resumes. Just a fun, digital hangout built for the chaos of college life.
            </p>
          </div>

          {/* Three Feature Pillars - Permanent colored borders & background hues */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Feature 1 - Vandal Pink Theme */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-vandal-pink/30 hover:border-vandal-pink/60 hover:bg-vandal-pink/[0.02] hover:shadow-lg hover:shadow-vandal-pink/5 transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-vandal-pink scale-x-100 transition-transform origin-left duration-300" />
              <div>
                <div className="w-10 h-10 rounded-2xl bg-vandal-pink/15 text-vandal-pink flex items-center justify-center mb-4 font-bold shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-vandal-pink">Campus-Only Circles</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Log in with your university ID to unlock admissions secrets, exam study sessions, event trackers, and anonymous campus confessions. Fully protected, students only.
                </p>
              </div>
            </div>

            {/* Feature 2 - Acid Cyan Theme */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-acid-cyan/30 hover:border-acid-cyan/60 hover:bg-acid-cyan/[0.02] hover:shadow-lg hover:shadow-acid-cyan/5 transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-acid-cyan scale-x-100 transition-transform origin-left duration-300" />
              <div>
                <div className="w-10 h-10 rounded-2xl bg-acid-cyan/15 text-acid-cyan flex items-center justify-center mb-4 font-bold shadow-md">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-acid-cyan">Global Public Wall</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Hop onto the public wall to chat and banter with students nationwide. Explore topic forums for internship grind, relationship advice, gaming duos, and college memes.
                </p>
              </div>
            </div>

            {/* Feature 3 - Topic Violet Theme */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-topic-violet/30 hover:border-topic-violet/60 hover:bg-topic-violet/[0.02] hover:shadow-lg hover:shadow-topic-violet/5 transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-topic-violet scale-x-100 transition-transform origin-left duration-300" />
              <div>
                <div className="w-10 h-10 rounded-2xl bg-topic-violet/15 text-topic-violet flex items-center justify-center mb-4 font-bold shadow-md">
                  <EyeOff className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-topic-violet">Disappearing Feeds</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  What happens in the lounge stays in the lounge. Toggle vanish mode to send gossips, chat leaks, or jokes that dissolve and pixelate away after reading.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE ELEMENT: THE CAMPUS SWITCHBOARD (Color accents, glowing backdrop) --- */}
        <section id="switchboard" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/10 bg-midnight-slate">
          <div className="text-center max-w-3xl mx-auto mb-12">
            {/* Added color gradient to section title */}
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white mb-4">
              CHOOSE YOUR CAMPUS <span className="text-gradient-brand">AND LOCK IT IN</span>
            </h2>
            <p className="text-neutral-400 text-lg">
              Select a university below to see the app dynamically shift content, stories, and theme colors.
            </p>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap justify-center gap-2.5 mt-8">
              {COLLEGES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCollege(c)}
                  style={{
                    borderColor: selectedCollege.id === c.id ? c.color : 'rgba(255,255,255,0.15)',
                    backgroundColor: selectedCollege.id === c.id ? `${c.color}15` : 'transparent',
                    color: selectedCollege.id === c.id ? '#FFF' : 'rgba(255,255,255,0.6)'
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold border hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {c.short}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Phone / App Console Mockup */}
          <div 
            style={{ 
              '--college-accent': selectedCollege.color,
              boxShadow: `0 20px 60px -10px ${selectedCollege.color}30` // Accent backlight glow shadow!
            }}
            className="max-w-4xl mx-auto rounded-3xl border border-white/15 bg-neutral-900/80 backdrop-blur-sm p-4 sm:p-6 overflow-hidden transition-all duration-700 glow-border"
          >
            {/* Top Panel bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              
              {/* Custom campus banner */}
              <div className="text-xs font-mono px-3 py-1 rounded bg-white/5 text-white/60 flex items-center gap-2">
                <Verified className="w-3.5 h-3.5 text-[var(--college-accent)] animate-pulse" />
                {selectedCollege.name} ({selectedCollege.short})
              </div>

              <div className="flex gap-2">
                <div className="w-4 h-4 rounded bg-white/10" />
              </div>
            </div>

            {/* Double-Layer Switchboard Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setSwitchboardTab('campus')}
                className={`py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  switchboardTab === 'campus' 
                    ? 'bg-gradient-to-r from-vandal-pink to-topic-violet text-white shadow-xl border-transparent' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Campus Layer</span>
              </button>
              
              <button
                onClick={() => setSwitchboardTab('public')}
                className={`py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  switchboardTab === 'public' 
                    ? 'bg-gradient-to-r from-vandal-pink to-topic-violet text-white shadow-xl border-transparent' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                }`}
              >
                <Compass className="w-4.5 h-4.5" />
                <span>Public Wall</span>
              </button>
            </div>

            {/* Switchboard Content Box */}
            <div className="min-h-[300px]">
              {switchboardTab === 'campus' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Left Side: Campus Confessions */}
                  <div className="space-y-3.5 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-vandal-pink/20 text-vandal-pink px-2.5 py-1 rounded-full border border-vandal-pink/30 flex items-center gap-1 font-bold">
                        <EyeOff className="w-3 h-3" /> Anonymous Confessions
                      </span>
                      <span className="text-[10px] font-mono text-white/40">Verified Students Only</span>
                    </div>
                    
                    {selectedCollege.confessions.map((conf, index) => (
                      <div key={index} className="bg-white/5 border border-white/5 hover:border-[var(--college-accent)] transition-colors p-3.5 rounded-xl text-xs space-y-2">
                        <p className="text-white/80 leading-relaxed italic">
                          "{conf.text}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                          <span className="flex items-center gap-1 hover:text-red-400 cursor-pointer">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {conf.likes}
                          </span>
                          <span>{conf.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Side: Local Events & Announcement Hub */}
                  <div className="space-y-3.5 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase bg-[var(--college-accent)]/20 text-[var(--college-accent)] px-2.5 py-1 rounded-full border border-[var(--college-accent)]/30 flex items-center gap-1 font-bold font-black">
                          <Calendar className="w-3 h-3" /> Campus Events
                        </span>
                        <span className="text-[10px] font-mono text-white/40">Local Board</span>
                      </div>

                      {selectedCollege.events.map((ev, index) => (
                        <div key={index} className="bg-white/5 border border-white/5 p-3.5 rounded-xl text-xs flex justify-between items-center hover:border-acid-cyan transition-colors">
                          <div>
                            <h4 className="font-bold text-white mb-0.5">{ev.name}</h4>
                            <p className="text-[10px] text-white/40">{ev.time}</p>
                          </div>
                          <span className="text-[10px] font-mono bg-white/5 text-[var(--college-accent)] px-2 py-1 rounded border border-white/10 font-bold">
                            {ev.RSVPs} Going
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick student quote */}
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] text-white/50 leading-relaxed italic text-center font-mono mt-4">
                      "{selectedCollege.tagline}"
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Horizontal Topic selector */}
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
                    {['memes', 'internships-coping', 'relationships', 'gaming'].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setActiveTopic(topic)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          activeTopic === topic
                            ? 'bg-topic-violet text-white font-bold'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        #{topic}
                      </button>
                    ))}
                  </div>

                  {/* Topic Feed preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTopic === 'memes' && (
                      <>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-vandal-pink/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">grind_never_stops</span>
                            <span className="text-[10px] text-vandal-pink font-bold">Stanford</span>
                          </div>
                          <p className="text-white/80">Me saying "it is what it is" after studying 12 mins for a 3-hour midterm exam</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 1.2k</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-vandal-pink/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">terrier_bob</span>
                            <span className="text-[10px] text-vandal-pink font-bold">BU</span>
                          </div>
                          <p className="text-white/80">Vibe check: dining hall food vs eating paper</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 980</span>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTopic === 'internships-coping' && (
                      <>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-acid-cyan/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">du_student_01</span>
                            <span className="text-[10px] text-acid-cyan font-bold">DU</span>
                          </div>
                          <p className="text-white/80">Is it normal to receive a rejection email 4 minutes after submitting the application? Automated screening got hands.</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 512</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-acid-cyan/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">swe_dreamer</span>
                            <span className="text-[10px] text-acid-cyan font-bold">Stanford</span>
                          </div>
                          <p className="text-white/80">Got my Google SWE offer letter today! Spent the last 30 minutes staring at the PDF to verify it isn't phishing.</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 2.1k</span>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTopic === 'relationships' && (
                      <>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-topic-violet/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">nyu_lover</span>
                            <span className="text-[10px] text-topic-violet font-bold font-mono">NYU</span>
                          </div>
                          <p className="text-white/80">Crush asked if I wanted to study together. Turns out they wanted me to teach them Java so they could pass their homework for someone else. Sad hours.</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 740</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-topic-violet/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">bitsian_boy</span>
                            <span className="text-[10px] text-topic-violet font-bold font-mono">BITS</span>
                          </div>
                          <p className="text-white/80">She didn't know the difference between bubble sort and quicksort, so I sorted her out of my chat history.</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 312</span>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTopic === 'gaming' && (
                      <>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-acid-cyan/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">valorant_fan</span>
                            <span className="text-[10px] text-acid-cyan font-bold">IITD</span>
                          </div>
                          <p className="text-white/80">Need 2 players for hostel tournament tonight. Pls no toxic duelists, we just want to play while crying about assignments.</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 189</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-acid-cyan/35 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">warcraft_3</span>
                            <span className="text-[10px] text-acid-cyan font-bold">NYU</span>
                          </div>
                          <p className="text-white/80">Any classic strategy gamers on campus? Let's hook up a lobby in the dorm common room.</p>
                          <div className="flex items-center gap-3 text-white/40 text-[10px]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 95</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* --- THE BENTO WALL OF CHAOS (Colored Borders & Backgrounds Directly Applied) --- */}
        <section id="bento-features" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/10 bg-midnight-slate">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase bg-vandal-pink/20 text-vandal-pink px-3.5 py-1.5 rounded-full border border-vandal-pink/30 font-bold">
              Interactive Widgets
            </span>
            {/* Added color gradient to section title */}
            <h2 className="font-display font-black text-4xl sm:text-6xl text-white mt-5 mb-4">
              BENTO WALL OF <span className="text-gradient-brand">CAMPUS CHAOS</span>
            </h2>
            <p className="text-neutral-400 text-lg">
              Cohort functions exactly like your real dorm lounge: messy, dynamic, fun, and completely unfiltered. Try the interactive widgets below.
            </p>
          </div>

          {/* Bento Grid (Fluid Heights to prevent Mobile Overflow) */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5">
            
            {/* Card 1: Vanish Mode Widget - Vandal Pink Theme */}
            <div className="col-span-1 md:col-span-3 lg:col-span-4 rounded-3xl bg-white/5 border border-vandal-pink/30 p-6 flex flex-col justify-between text-white hover:shadow-lg hover:shadow-vandal-pink/10 hover:border-vandal-pink/60 transition-all space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono bg-vandal-pink/10 text-vandal-pink border border-vandal-pink/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                    <EyeOff className="w-3.5 h-3.5" /> Vanish Mode
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">Disappearing Posts</span>
                </div>
                <h3 className="font-display font-bold text-xl mb-3 text-vandal-pink">Hover to Melt the Gossip</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Our disappear protocol ensures that what happens in the dorm room stays in the dorm room.
                </p>
              </div>
              
              {/* The Interactive Vanishing Box */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center select-none shadow-inner shadow-black/50">
                <p className="text-xs font-mono leading-relaxed mb-1 text-white">
                  "The dean of students was seen sneaking pizza at <VanishText text="3:00 AM in the girls dorm lobby" /> last night"
                </p>
                <span className="text-[10px] text-vandal-pink/80 font-mono font-bold flex items-center justify-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-vandal-pink animate-pulse" />
                  vanish mode active
                </span>
              </div>
            </div>

            {/* Card 2: Live Poll Card - Acid Cyan Theme */}
            <div className="col-span-1 md:col-span-3 lg:col-span-4 rounded-3xl bg-white/5 border border-acid-cyan/30 p-6 flex flex-col justify-between text-white hover:shadow-lg hover:shadow-acid-cyan/10 hover:border-acid-cyan/60 transition-all space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono bg-acid-cyan/10 text-acid-cyan border border-acid-cyan/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                    <BarChart3 className="w-3.5 h-3.5" /> Active Polls
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">Live Stats</span>
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-acid-cyan">Is studying for 8am exams humanly possible?</h3>
              </div>

              {/* Poll Vote list */}
              <div className="space-y-2.5 my-4">
                {pollVotes.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleVote(idx)}
                    disabled={pollVoted}
                    className={`relative w-full py-2.5 px-4 rounded-xl border text-left text-xs transition-all overflow-hidden cursor-pointer ${
                      pollVoted
                        ? pollChoice === idx
                          ? 'border-acid-cyan text-white'
                          : 'border-white/5 text-white/40'
                        : 'border-white/10 hover:bg-white/5 text-white/80'
                    }`}
                  >
                    {/* Progress background bar */}
                    {pollVoted && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${v.pct}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-vandal-pink/20 to-acid-cyan/20"
                      />
                    )}
                    
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="truncate pr-4">{v.label}</span>
                      {pollVoted && <span className="font-mono text-acid-cyan font-bold">{v.pct}%</span>}
                    </div>
                  </button>
                ))}
              </div>

              {/* Ticker status */}
              <div className="text-[10px] text-white/40 font-mono text-center">
                {pollVoted ? "Vote registered! Live updates." : "1,240 student votes cast this week"}
              </div>
            </div>

            {/* Card 3: Live Chat ticker widget - Topic Violet Theme */}
            <div className="col-span-1 md:col-span-6 lg:col-span-4 rounded-3xl bg-white/5 border border-topic-violet/30 p-6 flex flex-col justify-between text-white hover:shadow-lg hover:shadow-topic-violet/10 hover:border-topic-violet/60 transition-all space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono bg-neon-indigo/20 text-neon-indigo border border-neon-indigo/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                    <MessageCircle className="w-3.5 h-3.5" /> Campus Chat
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">Live ticker</span>
                </div>
                <h3 className="font-display font-bold text-xl mb-3 text-topic-violet font-display">Campus & Public Rooms</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Dorm room chatter, assignment helpers, exam prep. Live chat rooms that cut across universities.
                </p>
              </div>

              {/* Simulated chat message streams */}
              <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/5 overflow-hidden max-h-[140px] flex flex-col justify-end">
                <AnimatePresence initial={false}>
                  {chatMessages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 120 }}
                      className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-lg border border-white/5"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-acid-cyan font-mono">{msg.sender}</span>
                        <span className="text-white/70 truncate max-w-[150px] sm:max-w-[200px]">{msg.text}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-vandal-pink/20 text-vandal-pink font-bold border border-vandal-pink/30">
                        {msg.college}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Card 4: Anonymous Confession Submission - Vandal Pink Theme */}
            <div className="col-span-1 md:col-span-6 lg:col-span-7 rounded-3xl bg-white/5 border border-vandal-pink/30 p-6 flex flex-col justify-between text-white hover:shadow-lg hover:shadow-vandal-pink/10 hover:border-vandal-pink/60 transition-all space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono bg-vandal-pink/10 text-vandal-pink border border-vandal-pink/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                    <Flame className="w-3.5 h-3.5" /> Confession Booth
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">100% Anonymous</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  
                  {/* Left side: Write Form */}
                  <form onSubmit={handleConfessionSubmit} className="space-y-2 flex flex-col justify-between">
                    <h4 className="font-display font-bold text-lg text-vandal-pink">Write a Secret</h4>
                    <textarea
                      rows={3}
                      placeholder="Accidentally slept through midterms..."
                      value={newConfessionText}
                      onChange={(e) => setNewConfessionText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-vandal-pink rounded-xl p-3 text-xs focus:outline-none text-white transition-colors placeholder:text-white/20 resize-none font-medium"
                    />
                    <button 
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vandal-pink to-topic-violet text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" /> Shoot Secret
                    </button>
                  </form>

                  {/* Right side: Local confessions stack list */}
                  <div className="bg-white/5 rounded-2xl border border-white/5 p-3.5 max-h-[160px] overflow-y-auto space-y-2">
                    <AnimatePresence>
                      {localConfessions.map((c, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white/5 p-2 rounded-lg border border-white/10 text-[10px] hover:border-vandal-pink/30 transition-colors"
                        >
                          <p className="text-white/80 leading-relaxed italic mb-1">
                            "{c.text}"
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-white/30">
                            <span>{c.user}</span>
                            <span>{c.time}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
              
              {/* Clean student-focused text */}
              <div className="text-[10px] text-white/40 font-mono text-center pt-2 border-t border-white/5">
                Verified student credentials required. 100% anonymous & secure.
              </div>
            </div>

            {/* Card 5: Gamified Profiles & Achievement Stickers - Topic Violet Theme */}
            <div className="col-span-1 md:col-span-6 lg:col-span-5 rounded-3xl bg-white/5 border border-topic-violet/30 p-6 flex flex-col justify-between text-white hover:shadow-lg hover:shadow-topic-violet/10 hover:border-topic-violet/60 transition-all space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono bg-topic-violet/20 text-topic-violet border border-topic-violet/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Identity & Rep
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">Gamified Profiles</span>
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-topic-violet">Claim Your Campus Legacy</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Gain reputation score (+Rep) by posting helpful study guides, hosting quad activities, or submitting confessions. Lock in stickers.
                </p>
              </div>

              {/* Sticker grid display */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center space-y-1 hover:border-topic-violet/40">
                  <span className="text-2xl">🦉</span>
                  <span className="text-[8px] font-bold font-mono tracking-tighter text-topic-violet">NIGHT OWL</span>
                  <span className="text-[7px] text-white/40">Active 3AM-6AM</span>
                </div>
                
                <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center space-y-1 hover:border-vandal-pink/40">
                  <span className="text-2xl">🔥</span>
                  <span className="text-[8px] font-bold font-mono tracking-tighter text-vandal-pink">CONFESSION KING</span>
                  <span className="text-[7px] text-white/40">10+ secrets</span>
                </div>
                
                <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center space-y-1 hover:border-acid-cyan/40">
                  <span className="text-2xl">⚡</span>
                  <span className="text-[8px] font-bold font-mono tracking-tighter text-acid-cyan">CHAT LEGEND</span>
                  <span className="text-[7px] text-white/40">10k+ messages</span>
                </div>
              </div>

              <div className="text-[10px] text-white/40 font-mono text-center">
                Your profile achievements cut across both campus layers and public topic forums.
              </div>
            </div>

          </div>
        </section>

        {/* --- DUAL LAYER EXPLANATION (CAMPUS VS PUBLIC STRUCTURE) (Fluid heights, brand header gradients) --- */}
        <section id="dual-split" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/10 bg-midnight-slate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Poster Card Side */}
            <div className="space-y-6 text-center lg:text-left">
              <span className="text-xs font-mono uppercase bg-neon-indigo/10 text-neon-indigo border border-neon-indigo/20 px-3.5 py-1.5 rounded-full font-bold">
                The Blueprint
              </span>
              {/* Added color gradient to section title */}
              <h2 className="font-display font-black text-4xl sm:text-6xl text-white leading-[0.9] text-center lg:text-left">
                TWO LAYERS <span className="text-gradient-brand">ONE UNIFIED SPACE</span>
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed">
                Why divide your college life into ten different messaging apps and forums? Cohort integrates your private campus bubble with the public student universe.
              </p>

              {/* List of 10 Required Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
                {[
                  { name: "Campus Communities", desc: "Private hub for your school" },
                  { name: "Anonymous Confessions", desc: "Share secrets anonymously" },
                  { name: "Vanish Mode", desc: "Self-destructing text feeds" },
                  { name: "Topic Communities", desc: "Forums for coding, gaming, life" },
                  { name: "Public Wall", desc: "Chat with students anywhere" },
                  { name: "Campus & Public Chat", desc: "Direct messaging & chat rooms" },
                  { name: "Trending Discussions", desc: "See what is popular right now" },
                  { name: "Events Board", desc: "Host events and track RSVPs" },
                  { name: "Live Polls & Q&A", desc: "Vote on student questions" },
                  { name: "Profiles & Achievements", desc: "Earn stickers for reputation" }
                ].map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-5 h-5 rounded bg-acid-cyan/15 text-acid-cyan flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold font-black">✓</div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{f.name}</h4>
                      <p className="text-[10px] text-neutral-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split Screen Concept (Fluid flex heights and custom colored borders) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-full">
              
              {/* Layer 1 Card - Neon Indigo Accent */}
              <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neon-indigo/5 to-topic-violet/5 border border-neon-indigo/40 hover:border-neon-indigo/70 hover:bg-neon-indigo/[0.02] transition-all flex flex-col justify-between text-white space-y-6">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-neon-indigo/15 text-neon-indigo flex items-center justify-center mb-4 font-bold shadow-md border border-neon-indigo/25">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-black text-2xl mb-2 text-white">1. THE INNER CIRCLE</h3>
                  <h4 className="text-xs font-mono text-neon-indigo uppercase tracking-wider mb-4 font-bold">Your Verified Campus Hub</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Sign in with your student email to unlock your campus feed. Gossip anonymously, coordinate club signups, RSVP to quad laser tag, and chat in private rooms. Fully protected, students only.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 text-xs">Requires .edu verification</span>
              </div>

              {/* Layer 2 Card - Vandal Pink Accent */}
              <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-vandal-pink/5 to-acid-cyan/5 border border-vandal-pink/40 hover:border-vandal-pink/70 hover:bg-vandal-pink/[0.02] transition-all flex flex-col justify-between text-white space-y-6">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-vandal-pink/15 text-vandal-pink flex items-center justify-center mb-4 font-bold shadow-md border border-vandal-pink/25">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-black text-2xl mb-2 text-white">2. THE OUTER RING</h3>
                  <h4 className="text-xs font-mono text-vandal-pink uppercase tracking-wider mb-4 font-bold">The Student Universe</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    A public wall connecting college students worldwide. Dive into global topic spaces for SWE internships, dating advice, gaming duos, and college memes. Meet peers outside your university limits.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 text-xs">Open to all verified college students</span>
              </div>

            </div>

          </div>
        </section>

        {/* --- SCROLLING CTA MARQUEE --- */}
        <section className="bg-neutral-950 py-6 border-y border-white/10 relative z-10 overflow-hidden select-none">
          <div className="flex whitespace-nowrap animate-marquee font-display font-black uppercase text-xl sm:text-2xl text-white/20">
            <span className="mx-4">DON'T SCROLL ALONE • JOIN THE COHORT</span>
            <span className="mx-4 text-acid-cyan">BU VERIFIED</span>
            <span className="mx-4">DON'T SCROLL ALONE • SECURE YOUR ID</span>
            <span className="mx-4 text-vandal-pink">NYU ACTIVE</span>
            <span className="mx-4 font-mono">10,000+ COHORTS</span>
            <span className="mx-4">DON'T SCROLL ALONE • JOIN THE COHORT</span>
            <span className="mx-4 text-acid-cyan">STANFORD LIVE</span>
            <span className="mx-4">DON'T SCROLL ALONE • SECURE YOUR ID</span>
            <span className="mx-4 text-vandal-pink">IITD CODING</span>
            <span className="mx-4 font-mono">100% STUDENT ONLY</span>
          </div>
        </section>

        {/* --- THE FOMO REGISTRATION HUB (FINAL CTA) --- */}
        <section id="cta" className="py-12 md:py-20 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-midnight-slate">
          <div className="max-w-4xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-white/10 p-6 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            
            {/* Subtle glow in CTA */}
            <div className="absolute top-[-50%] left-[-50%] w-[100vw] h-[100vw] rounded-full bg-neon-indigo/5 blur-[120px] pointer-events-none" />
            
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60 mb-6 font-semibold">
              <Lock className="w-3.5 h-3.5 text-acid-cyan" /> Secure student registration protocol
            </span>
            
            {/* Added color gradient to section title */}
            <h2 className="font-display font-black text-4xl sm:text-6xl text-white leading-tight mb-6">
              STOP THE FOMO<br />
              <span className="text-gradient-brand">JOIN COHORT NOW</span>
            </h2>
            
            <p className="text-white/60 max-w-xl mx-auto text-base sm:text-lg mb-10">
              Dorm board gossip, exams coping, secret crushes, and public gaming channels. Your classmates are already posting. Join now.
            </p>

            <div className="max-w-md mx-auto">
              <button
                onClick={() => navigate('/signup')}
                className="w-full px-8 py-4.5 rounded-2xl bg-gradient-to-r from-vandal-pink via-topic-violet to-acid-cyan text-white text-base font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-vandal-pink/20 cursor-pointer flex items-center justify-center gap-2"
              >
                Sign Up & Claim Your Spot
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex justify-center gap-6 mt-4 text-[10px] font-mono text-white/40">
                <span>✓ Instant unlock</span>
                <span>✓ 100% Student-Only verification</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 py-12 bg-midnight-slate relative z-10 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-vandal-pink to-topic-violet flex items-center justify-center text-white text-[10px] font-black">C</div>
            <span className="font-bold text-white">Cohort © 2026</span>
          </div>
          
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/help" className="hover:text-white">Help Center</Link>
          </div>
          
          <div className="font-mono text-[10px] text-neutral-500">
            Cohort is built by students, for students. Not affiliated with any university.
          </div>
        </div>
      </footer>
    </div>
  );
}
