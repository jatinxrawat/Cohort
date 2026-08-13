import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Send, 
  Coffee, 
  Compass, 
  PenTool, 
  Clock, 
  User, 
  UserPlus,
  Calendar,
  CheckCircle,
  MessageCircle,
  Bookmark
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import BorderGlow from '@/components/BorderGlow';
import SEO from '@/components/SEO';
import { db } from '@/utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MOCK_ARTICLES = [
  {
    id: 'college-love',
    title: 'College, Love Stories and the Dilemma',
    excerpt: 'Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you.',
    category: 'Love & Heartbreak',
    readTime: '6 min read',
    date: 'August 11, 2026',
    author: 'Sanya Sahani',
    claps: 320,
    gradient: 'from-pink-500 via-purple-500 to-cyan-400',
    tags: ['CollegeLove', 'Heartbreak', 'CampusLife', 'CareerDilemma'],
    content: `Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you.`
  },
  {
    id: '3am-coffee-club',
    title: 'The 3 AM Coffee Club: A Love Letter to Late-Night Study Rooms',
    excerpt: 'Why do we study better under the hum of fluorescent lights, drinking lukewarm brew, surrounded by strangers sharing the exact same existential dread?',
    category: 'Campus Psychology',
    readTime: '5 min read',
    date: 'August 10, 2026',
    author: 'Aaditya Sharma',
    claps: 142,
    gradient: 'from-pink-500 via-purple-600 to-indigo-600',
    tags: ['LateNightVibes', 'Relatable', 'Productivity'],
    content: `You know the feeling. It's 2:47 AM, the campus is dead silent, but Room 402 in the library is humming with life. A soft buzz of laptops, the rhythmic clicking of keyboards, and the quiet hiss of the coffee machine. Nobody is talking, yet everyone is speaking the same silent language: "We have an exam in eight hours, and we are in this together."

Why is it that we find solace in the shared misery of all-nighters? Psychologists call it 'social facilitation'—the tendency to perform better when others are around. But on campus, it's something more human. It's the silent support of a stranger typing their history paper next to your coding assignment. It's the shared nod when the coffee pot runs empty. 

Here's to the late-night warriors, the lukewarm coffee, and the quiet spaces where we grow up. We might not remember the formulas we memorized, but we will always remember the silent camaraderie of the 3 AM Coffee Club.`
  },
  {
    id: 'introvert-guide',
    title: 'Why We Seek the Quiet: The Reluctant Introvert’s Guide to Campus Life',
    excerpt: 'College is loud. Here is an honest perspective on finding peace, recharge spots, and meaningful connections in a world that never stops talking.',
    category: 'Student Behavior',
    readTime: '4 min read',
    date: 'August 08, 2026',
    author: 'Neha Deshmukh',
    claps: 98,
    gradient: 'from-purple-500 via-indigo-500 to-cyan-500',
    tags: ['SelfCare', 'MentalHealth', 'IntrovertLife'],
    content: `From orientation week icebreakers to crowded hostel mess halls, college is an extrovert's playground. But for the 40% of us who recharge in silence, it can feel like a marathon with no finish line. The pressure to always be "out there" making friends is exhausting. 

But here's the secret: some of the most profound campus connections happen in the quiet. It's the two-person tea stall conversations behind the engineering block, the late-night walks on the running track, or simply reading books side-by-side. 

Finding your 'quiet hubs'—whether it's the botanical garden bench or the top floor of the old library building—isn't running away. It's how we survive, recharge, and bring our best selves back to the crowd. You don't have to shout to be heard on campus; sometimes, quiet presence is the most powerful vibe of all.`
  },
  {
    id: 'unwritten-rules',
    title: 'The Unwritten Hallway Rules We All Silently Agree To',
    excerpt: 'From the library seat reservation etiquette to the polite nod of hallway avoidance—analyzing the funny social contracts of college life.',
    category: 'Campus Vibes',
    readTime: '3 min read',
    date: 'August 05, 2026',
    author: 'Kabir Mehta',
    claps: 215,
    gradient: 'from-cyan-500 via-teal-500 to-yellow-500',
    tags: ['Comedy', 'CampusCulture', 'SocialHabits'],
    content: `Every university has a student handbook, but the real rules are never written down. They are the unspoken social contracts we learn by trial and error. 

Rule #1: The Library Chair Claim. If you leave your laptop charger and a notebook on a desk, you have officially claimed that desk for up to 45 minutes of absence. Any longer, and your belongings are fair game to be moved neatly to the side by a desk-hunter.

Rule #2: The Hallway Nod. If you see someone you vaguely know from a group project last semester, you must exchange a fast upward nod if you are friendly, or look intensely at your phone/watch if you want to avoid awkward small talk.

These tiny behaviors are the social glue that keeps campus from descending into absolute chaos. We might not study them in class, but they are the most important courses in human behavior we will ever take.`
  }
];

export default function Uncut() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [clappedArticles, setClappedArticles] = useState({});
  
  // Community draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('Campus Psychology');
  const [draftContent, setDraftContent] = useState('');
  const [userStories, setUserStories] = useState([]);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New form configuration states
  const [submissionType, setSubmissionType] = useState('short'); // 'short' or 'long'
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authorName, setAuthorName] = useState('');

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Handle claps
  const handleClap = (id, e) => {
    e.stopPropagation();
    
    // Prevent excessive clapping or track locally
    const currentClaps = clappedArticles[id] || 0;
    if (currentClaps >= 10) return; // Cap at 10 claps per session

    setClappedArticles(prev => ({
      ...prev,
      [id]: currentClaps + 1
    }));

    setArticles(prev => prev.map(art => {
      if (art.id === id) {
        return { ...art, claps: art.claps + 1 };
      }
      return art;
    }));

    // Local user stories clap support
    setUserStories(prev => prev.map(art => {
      if (art.id === id) {
        return { ...art, claps: art.claps + 1 };
      }
      return art;
    }));
  };

  // Submit anonymous story
  const handleSubmitStory = async (e) => {
    e.preventDefault();
    if (!draftTitle || !draftContent) return;

    setIsSubmittingStory(true);
    
    try {
      // 1. Log submission to database
      const submissionData = {
        title: draftTitle,
        category: draftCategory,
        content: draftContent,
        format: submissionType,
        isAnonymous: isAnonymous,
        author: isAnonymous ? 'Anonymous' : authorName,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'uncutSubmissions'), submissionData);
      
      // 2. Send email in the background via Formsubmit AJAX endpoint (Zero setup, no key required)
      try {
        await fetch('https://formsubmit.co/ajax/cohortnow.online@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `Cohort Uncut Draft: ${draftTitle}`,
            Title: draftTitle,
            Category: draftCategory,
            Format: submissionType === 'short' ? 'Short Story / Vibe Message' : 'Full Article / Long Story',
            Author: isAnonymous ? 'Anonymous' : authorName,
            Content: draftContent
          })
        });
      } catch (mailErr) {
        console.error("Email dispatch error:", mailErr);
      }

      setIsSubmittingStory(false);
      setSubmitSuccess(true);
      setDraftTitle('');
      setDraftContent('');
      setAuthorName('');
      setIsAnonymous(true);
      setSubmissionType('short');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 7000);
    } catch (err) {
      console.error("Error submitting uncut draft:", err);
      setIsSubmittingStory(false);
    }
  };

  // Subscribe to newsletter
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen relative bg-[#fffdfa] dark:bg-[#08080C] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans pb-20 overflow-x-hidden selection:bg-pink-500/20 selection:text-pink-600 dark:selection:text-pink-300">
      <SEO 
        title="Cohort Uncut | Relatable Campus Stories & Student Vibes"
        description="Read unfiltered student stories, college behavior analyses, and funny campus psychology articles on Cohort Uncut. Relatable campus lives, written by peers."
      />

      {/* Atmospheric Background Blurs (Only dark mode, hidden on mobile) */}
      <div className="hidden md:dark:block absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="hidden md:dark:block absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* --- HEARTFELT HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#08080C]/70 backdrop-blur-xl border-b border-amber-900/5 dark:border-white/5 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo 
              isLanding={false} 
              iconSize="w-9 h-9" 
              textSize="text-xl" 
              textClassName="hidden sm:inline font-display font-black tracking-tight" 
            />
            <span className="h-5 w-px bg-amber-900/10 dark:bg-white/10" />
            <span className="font-unbounded font-black text-xs tracking-wider text-pink-500 dark:text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/20">
              UNCUT
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 rounded-xl shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            <Link
              to={isAuthenticated ? "/home" : "/signup"}
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-pink-500 dark:text-pink-400 bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/30 transition-all px-3.5 py-2 rounded-xl shadow-xs hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer"
            >
              {isAuthenticated ? (
                <ArrowRight className="w-3.5 h-3.5" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>{isAuthenticated ? "Enter App" : "Join Cohort"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO DIARY SECTIONS --- */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[10px] font-black tracking-widest uppercase text-pink-500 dark:text-pink-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Campus Chronicles & Stories</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-[1.1] text-neutral-950 dark:text-white">
          Welcome to the hallways <br />
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">That shape our life</span>
        </h1>

        <p className="max-w-2xl mx-auto text-neutral-600 dark:text-neutral-300 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
          This is a safe, warm space for all the unsaid things. A quiet corner to share the stories of late-night tea talks, the heartbreak of exam failures, orientation crushes, and the secret sacrifices that define our college days. Here, your emotions are heard, and your experiences are shared without judgement.
        </p>

        {/* Small decorative paper line */}
        <div className="flex justify-center items-center gap-2 pt-2">
          <span className="h-0.5 w-10 bg-amber-900/10 dark:bg-white/10 rounded-full" />
          <Coffee className="w-4 h-4 text-pink-500/50" />
          <span className="h-0.5 w-10 bg-amber-900/10 dark:bg-white/10 rounded-full" />
        </div>
      </section>

      {/* --- MAIN CONTENT ARTICLES --- */}
      <main className="max-w-4xl mx-auto px-4 space-y-8">
        
        <div className="flex items-center justify-between border-b border-amber-900/10 dark:border-white/10 pb-4">
          <h2 className="font-display font-black text-xl tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-500" />
            <span>Featured Stories</span>
          </h2>
          <span className="text-xs font-semibold text-neutral-500">{articles.length} entries</span>
        </div>

        {/* Grid of articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article, idx) => (
            <motion.div
              key={article.id}
              onClick={() => {
                if (article.id === 'college-love') {
                  navigate('/uncut/college-love');
                } else {
                  setSelectedArticle(article);
                }
              }}
              className="group cursor-pointer bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-amber-900/5 dark:border-white/5 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              whileHover={{ y: -4 }}
            >
              {/* Highlight bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${article.gradient}`} />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                  <span className="bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-lg sm:text-xl text-neutral-950 dark:text-white group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium line-clamp-3">
                  {article.excerpt}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-amber-900/5 dark:border-white/5 mt-6 pt-4 text-xs font-semibold text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-900/10 dark:bg-white/10 flex items-center justify-center text-pink-500 text-[10px] font-black">
                    {article.author.charAt(0)}
                  </div>
                  <span>{article.author}</span>
                </div>

                <button
                  onClick={(e) => handleClap(article.id, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/5 dark:bg-white/5 hover:bg-pink-500/10 hover:text-pink-500 dark:hover:text-pink-400 rounded-full transition-all border border-transparent hover:border-pink-500/20 active:scale-90"
                  aria-label="Clap for this story"
                  title="Clap for this story"
                >
                  <Heart className={`w-3.5 h-3.5 ${clappedArticles[article.id] ? 'fill-pink-500 text-pink-500 animate-bounce' : ''}`} />
                  <span>{article.claps}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- INTERACTIVE STORY WRITING CORNER --- */}
        <section className="pt-12 w-full">
          <BorderGlow
            borderRadius={32}
            backgroundColor={isDark ? '#0f0e16' : '#fffdfa'}
            glowColor="325 80 60"
            glowRadius={50}
            glowIntensity={1.1}
            coneSpread={30}
            animated={true}
            colors={['#FF2A85', '#963BFF']}
            className="w-full"
          >
            <div className="p-6 sm:p-10 text-left relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[9px] font-black uppercase text-purple-500 dark:text-purple-400">
                    <PenTool className="w-3 h-3" /> Anonymous submission
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 dark:text-white">
                    Spill your campus stories.
                  </h3>
                </div>
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
                  Have a funny behavior observation or psychological insight about college? Type it down here. Keep it real, keep it anonymous.
                </span>
              </div>

              <form onSubmit={handleSubmitStory} className="space-y-5">
                {/* Title and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="story-title" className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Story Title</label>
                    <input
                      id="story-title"
                      type="text"
                      required
                      placeholder="e.g. The Psychology of the Back Row Students"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="story-category" className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Vibe/Category</label>
                    <select
                      id="story-category"
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors cursor-pointer"
                    >
                      <option value="Campus Psychology">Campus Psychology</option>
                      <option value="Student Behavior">Student Behavior</option>
                      <option value="Late Night Thoughts">Late Night Thoughts</option>
                      <option value="Love & Heartbreak">Love & Heartbreak</option>
                      <option value="Failures & Sacrifices">Failures & Sacrifices</option>
                      <option value="Campus Gossip & Vibes">Campus Gossip & Vibes</option>
                      <option value="Dorm Room Secrets">Dorm Room Secrets</option>
                    </select>
                  </div>
                </div>

                {/* Submission Type & Identity Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Submission Type */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">Format Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSubmissionType('short')}
                        className={`py-2 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border cursor-pointer ${
                          submissionType === 'short'
                            ? 'bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400 font-black'
                            : 'bg-white dark:bg-neutral-950 border-neutral-250 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-55 dark:hover:bg-neutral-900'
                        }`}
                      >
                        Short Story / Vibe Message
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionType('long')}
                        className={`py-2 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border cursor-pointer ${
                          submissionType === 'long'
                            ? 'bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400 font-black'
                            : 'bg-white dark:bg-neutral-950 border-neutral-250 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-55 dark:hover:bg-neutral-900'
                        }`}
                      >
                        Full Article / Long Story
                      </button>
                    </div>
                  </div>

                  {/* Identity settings */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">Byline Credit</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(true)}
                        className={`py-2 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border cursor-pointer ${
                          isAnonymous
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400 font-black'
                            : 'bg-white dark:bg-neutral-950 border-neutral-250 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-55 dark:hover:bg-neutral-900'
                        }`}
                      >
                        Keep Anonymous
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(false)}
                        className={`py-2 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border cursor-pointer ${
                          !isAnonymous
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400 font-black'
                            : 'bg-white dark:bg-neutral-950 border-neutral-250 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-55 dark:hover:bg-neutral-900'
                        }`}
                      >
                        Publish Under Name
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Name Input (Only shown if NOT anonymous) */}
                <AnimatePresence>
                  {!isAnonymous && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="space-y-1"
                    >
                      <label htmlFor="author-name" className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Display Name / Pen Name</label>
                      <input
                        id="author-name"
                        type="text"
                        required={!isAnonymous}
                        placeholder="e.g. Kabir Mehta or The Reluctant Poet"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="space-y-1">
                  <label htmlFor="story-content" className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    {submissionType === 'short' ? 'Content (Short Message)' : 'Content (Full Narrative)'}
                  </label>
                  <textarea
                    id="story-content"
                    rows={submissionType === 'short' ? 4 : 8}
                    required
                    placeholder={
                      submissionType === 'short'
                        ? 'Start typing your short message or vibe observation here...'
                        : 'Write your full-fledged campus article, detailed narrative, or story here...'
                    }
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-[10px] font-bold text-neutral-450 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isAnonymous ? 'Submitting Anonymously' : `Submitting as ${authorName || 'Anonymous'}`}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingStory}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-pink-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingStory ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Story</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Submission feedback */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Story submitted successfully! Your submission has been received and will be live on the page once approved by our editorial team. 📬</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BorderGlow>
        </section>

        {/* --- NEWSLETTER SUBSCRIPTION --- */}
        <section className="pt-12 max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h3 className="font-display font-black text-xl text-neutral-900 dark:text-white">
              Get notified when a new story drops.
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              We post story updates every Tuesday. Enter your student email to stay in the loop.
            </p>
          </div>

          {subscribed ? (
            <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-600 dark:text-pink-400 animate-bounce">
              Welcome to the Uncut Club! 💌 Check your inbox soon.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 p-1.5 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm max-w-md mx-auto focus-within:border-pink-500 transition-colors">
              <input
                type="email"
                required
                placeholder="Enter your student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          )}
        </section>

      </main>

      {/* --- IMMERSIVE DIARY EXPANSION OVERLAY --- */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-neutral-900 border border-amber-900/10 dark:border-white/5 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
            >
              
              {/* Highlight bar */}
              <div className={`h-2 bg-gradient-to-r ${selectedArticle.gradient}`} />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 rounded-full transition-all cursor-pointer shadow-xs active:scale-90"
                aria-label="Close story"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3.5]" />
              </button>

              {/* Story Header */}
              <div className="p-6 sm:p-8 pb-4 border-b border-amber-900/5 dark:border-white/5 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-neutral-400">
                  <span className="bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedArticle.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedArticle.date}
                  </span>
                </div>

                <h3 className="font-display font-black text-xl sm:text-3xl text-neutral-950 dark:text-white leading-tight">
                  {selectedArticle.title}
                </h3>

                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-amber-900/10 dark:bg-white/10 flex items-center justify-center text-pink-500 text-[10px] font-black">
                      {selectedArticle.author.charAt(0)}
                    </div>
                    <span>Written by {selectedArticle.author}</span>
                  </div>

                  <button
                    onClick={(e) => handleClap(selectedArticle.id, e)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full border border-pink-500/20 active:scale-95 transition-all"
                  >
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                    <span>{selectedArticle.claps} Hearts</span>
                  </button>
                </div>
              </div>

              {/* Story Content Body (Serif-style reading layout) */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-300 font-jakarta font-medium select-text font-serif">
                {selectedArticle.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}

                {/* Relatable tags */}
                <div className="flex flex-wrap gap-2 pt-6 border-t border-amber-900/5 dark:border-white/5">
                  {selectedArticle.tags.map((tag) => (
                    <span key={tag} className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Story Footer */}
              <div className="p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-950/80 border-t border-amber-900/5 dark:border-white/5 flex items-center justify-between gap-4">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Done Reading
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hidden sm:inline">Loved this story?</span>
                  <button
                    onClick={(e) => handleClap(selectedArticle.id, e)}
                    className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white rounded-2xl shadow-md shadow-pink-500/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                    title="Send claps"
                  >
                    <Heart className="w-5 h-5 fill-white stroke-[2.5]" />
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEARTFELT FOOTER --- */}
      <footer className="max-w-4xl mx-auto px-4 mt-20 pt-8 border-t border-amber-900/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-neutral-500">
        <span>Cohort Uncut © 2026. Real stories, honest vibes.</span>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:underline">Homepage</Link>
          <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />
          <a href="mailto:cohortnow.online@gmail.com" className="hover:underline">Contact Editors</a>
        </div>
      </footer>

    </div>
  );
}
