import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Clock, Calendar, User, UserPlus, Sparkles, BookOpen, Coffee, Share2 } from 'lucide-react';
import SEO from '@/components/SEO';
import BorderGlow from '@/components/BorderGlow';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { db } from '@/utils/firebase';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import ShareModal from '@/components/ShareModal';

export default function CollegeLove() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const [claps, setClaps] = useState(320);
  const [hasClapped, setHasClapped] = useState(() => {
    return localStorage.getItem('has_clapped_college-love') === 'true';
  });
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Subscribe to real-time claps from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'uncutClaps', 'college-love'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.count === 'number') {
          setClaps(data.count);
        }
      }
    });
    return () => unsub();
  }, []);

  // Inject Google Article Schema JSON-LD for search engines
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "College, Love Stories and the Dilemma",
      "description": "Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you.",
      "author": {
        "@type": "Person",
        "name": "Sanya Sahani",
        "jobTitle": "Writer, Cohort"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cohort",
        "url": "https://cohortnow.online",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cohortnow.online/og-image.png"
        }
      },
      "datePublished": "2026-08-11",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://cohortnow.online/uncut/college-love"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleClap = async () => {
    if (hasClapped) return;
    setHasClapped(true);
    localStorage.setItem('has_clapped_college-love', 'true');

    try {
      const docRef = doc(db, 'uncutClaps', 'college-love');
      await setDoc(docRef, { count: increment(1) }, { merge: true });
    } catch (err) {
      console.error("Failed to update clap in Firestore:", err);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <div className="min-h-screen relative bg-[#faf7f2] dark:bg-[#08080C] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans pb-24 overflow-x-hidden selection:bg-pink-500/20 selection:text-pink-600 dark:selection:text-pink-300">
      <SEO 
        title="College, Love Stories and the Dilemma | Cohort Uncut"
        description="Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you. Written by Sanya Sahani."
        image="https://cohortnow.online/og-image.png"
        type="article"
      />

      {/* Atmospheric Background Blurs (Hidden on Mobile) */}
      <div className="hidden md:dark:block absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="hidden md:dark:block absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-pink-900/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* --- ARTICLE HEADER --- */}
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
            <Link 
              to="/uncut" 
              className="font-unbounded font-black text-xs tracking-wider text-pink-500 dark:text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-md border border-pink-500/20 transition-all"
            >
              UNCUT
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/uncut" 
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

      {/* --- HERO META SECTION --- */}
      <article className="max-w-3xl mx-auto px-4 pt-12 sm:pt-16 space-y-8">
        
        {/* Article Breadcrumb & Metadata */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] font-black tracking-widest uppercase text-pink-600 dark:text-pink-400">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Love & Heartbreak</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-neutral-950 dark:text-white">
            College, Love Stories <br />
            and the <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">Dilemma</span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl border-l-4 border-pink-500 pl-4 py-1 italic">
            Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-4 text-xs font-semibold text-neutral-450 dark:text-neutral-500 border-t border-amber-900/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <User className="w-4 h-4 text-pink-500" />
              <span>Sanya Sahani</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md">Writer, Cohort</span>
            </div>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-800">|</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>August 11, 2026</span>
            </div>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-800">|</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>6 min read</span>
            </div>
          </div>
        </div>

        {/* --- ARTICLE CONTENT (SERIF FORMATTING) --- */}
        <div className="max-w-none text-base sm:text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif space-y-6 pt-6 select-text border-b border-amber-900/5 dark:border-white/5 pb-12">
          
          <p className="first-letter:text-5xl first-letter:font-black first-letter:text-pink-500 first-letter:mr-3 first-letter:float-left">
            It starts simply enough. Orientation week. You are standing in a crowded seminar hall, clutching a campus map you are too proud to look at, surrounded by sensory overload and the dizzying scent of fresh independence. Everyone is a stranger, and every glance holds the promise of a beginning. And then, you see them.
          </p>

          <p>
            The orientation crush is a unique, fleeting phenomenon. It is built on pure potential, unburdened by the weight of coursework or hostel schedules. Often, it remains just that—a glance exchanged in the canteen, a silent agreement to sit nearby in introductory lectures, which slowly fades into a polite hallway nod by mid-semester. But sometimes, it doesn’t fade. Sometimes, the noise of campus life quietens down, and you find yourself in the middle of the first college love story.
          </p>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-950 dark:text-white mt-10 mb-4 leading-tight font-sans">
            The Modern Purgatory of the Situationship
          </h3>

          <p>
            But we don't call it love right away. That would be too heavy. Instead, college has popularized a comfortable, torturous middle ground: the situationship. It has all the components of a relationship—the shared late-night messages, the canteen lunch dates, the mutual jealousy—but none of the emotional security.
          </p>

          <p>
            We tell ourselves it is practical. "We are busy. Placements are coming up. I need to focus on my CGPA." We treat our emotions like a project we can shelf when exams approach. But situationships are rarely practical. They are a constant negotiation of boundaries, a game of chicken where the first person to catch feelings loses. We choose the vagueness because the alternative—admitting that we want someone beside us—means admitting we are vulnerable to them.
          </p>

          <blockquote className="my-8 pl-6 border-l-4 border-purple-500 italic text-neutral-600 dark:text-neutral-300 font-sans text-base sm:text-lg max-w-2xl bg-purple-500/5 py-4 pr-4 rounded-r-xl">
            "We are all quietly terrified that wanting someone to stay will get in the way of where we need to go."
          </blockquote>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-950 dark:text-white mt-10 mb-4 leading-tight font-sans">
            The Quiet Turn
          </h3>

          <p>
            Then there are the friendships. The ones built quietly over shared library desks, midnight tea runs during exam weeks, and borrowing lab coats. For semesters, they are just the person you call when you need notes or a canteen partner. 
          </p>

          <p>
            And then, one day, the context shifts. The way they laugh at a stupid joke feels warmer than usual. You realize you aren’t looking around the library to find an empty chair; you are looking to see if their laptop is on their usual desk. It’s a quiet transition, almost imperceptible, until you realize that they have quietly become your entire college world.
          </p>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-950 dark:text-white mt-10 mb-4 leading-tight font-sans">
            The Dilemma of the Future
          </h3>

          <p>
            This is where the dilemma takes root. College is a high-pressure transition state. On one hand, you are told to "live in the moment," to experience the raw romance of hostel curfews and holding hands behind the academic block. On the other hand, the pressure of placements and careers hangs over every conversation like a ticking clock.
          </p>

          <p>
            You watch your peers solving LeetCode problems in the canteen, and you feel a wave of guilt for spending the last two hours talking about nothing with someone. You look at your CGPA, your internship applications, and you wonder: <em>Am I losing my focus? Am I prioritizing a feeling that might not exist in two years over a career that will define the rest of my life?</em>
          </p>

          <p>
            It is a brutal calculus. You are forced to weigh the weight of a placement package against the comfort of a text message saying, "Did you reach your hostel?"
          </p>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-950 dark:text-white mt-10 mb-4 leading-tight font-sans">
            The Graduation Cliff and Ex-Etiquette
          </h3>

          <p>
            And then, graduation arrives. The ultimate cliff. 
          </p>

          <p>
            Suddenly, your relationship is no longer about hostel curfews; it is about geographical coordinates. One job offer is in Bangalore, the other is in Noida. A grad school acceptance letter points to Germany, another to Boston. 
          </p>

          <p>
            The dilemma reaches its peak: Do you ask them to stay? Do you compromise on your dream company to be in the same city? Or do you decide to let go, choosing to protect the future at the cost of the present? Long-distance relationships after graduation are a testament to endurance, but they are also a constant reminder of distance. You are dating a screen, living in different time zones, trying to keep a college feeling alive in a corporate cubicle.
          </p>

          <p>
            And if you choose to break up, campus doesn't make it easy. The weirdness of seeing an ex every single day is a specific campus curse. The person who knew your childhood stories and exam panics is now just another student waiting in line at the Nescafe stall. You have to navigate the silent negotiation of who gets to hang out at which tea spot, and who gets to sit on which library floor.
          </p>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-neutral-950 dark:text-white mt-10 mb-4 leading-tight font-sans">
            Are We in Love, or Just in Love with the Version of Ourselves?
          </h3>

          <p>
            Ultimately, college love forces a question we are rarely brave enough to ask: <em>Are we actually in love with them, or are we just in love with the version of ourselves we become around them?</em>
          </p>

          <p>
            College is a time of self-invention. Around them, you are funny, you are caring, you are passionate. They are the mirror reflecting the person you want to be. When we lose a college love, we often aren't just mourning the person; we are mourning the loss of the student who sat in that canteen, unburdened by corporate responsibilities, believing that a feeling could conquer a placement schedule.
          </p>

          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg border-t border-amber-900/10 dark:border-white/10 pt-6">
            Maybe college isn’t the place where you find the person you’ll spend your life with. Maybe it’s the place where you first discover what it feels like to want someone to.
          </p>

        </div>

        {/* --- DYNAMIC ENGAGEMENT WIDGET (CLAPS & SHARE) --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-b border-amber-900/5 dark:border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClap}
              disabled={hasClapped}
              className={`p-4 rounded-full flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                hasClapped
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-500 font-bold'
                  : 'bg-white dark:bg-neutral-900 border-neutral-250 dark:border-neutral-850 hover:border-pink-500/30 hover:text-pink-500 cursor-pointer'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasClapped ? 'fill-pink-500' : ''}`} />
              <span className="text-sm font-extrabold">{claps} Claps</span>
            </button>
            <span className="text-xs text-neutral-400 font-bold">
              {hasClapped ? "Thanks for cheering Sanya!" : "Show Sanya some love!"}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={handleShare}
              className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-neutral-500" />
              <span>Share Article</span>
            </button>

            {showShareTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-3 py-1 rounded-md shadow-md whitespace-nowrap">
                Link copied to clipboard! 📋
              </div>
            )}
          </div>
        </div>

        {/* --- AUTHOR FOOTER CARD --- */}
        <div className="pt-8">
          <BorderGlow
            borderRadius={24}
            backgroundColor={isDark ? '#0f0e16' : '#fffdfc'}
            glowColor="325 80 60"
            glowRadius={40}
            glowIntensity={1.0}
            coneSpread={30}
            animated={false}
            colors={['#FF2A85', '#963BFF']}
            className="w-full"
          >
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                SS
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display font-black text-lg text-neutral-950 dark:text-white leading-tight">
                      Sanya Sahani
                    </h4>
                    <p className="text-xs text-neutral-500 font-extrabold uppercase">
                      Writer, Cohort
                    </p>
                  </div>

                  <Link
                    to="/uncut"
                    className="text-xs font-bold text-pink-500 hover:underline flex items-center gap-1"
                  >
                    <span>More Stories</span>
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </Link>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                  Sanya Sahani writes about the messy, beautiful, and unspoken transitions of college life. She focuses on student behavior, campus culture, and late-night thoughts that never make it to the lecture rooms.
                </p>
              </div>
            </div>
          </BorderGlow>
        </div>

      </article>

      {/* --- ARTICLE FOOTER --- */}
      <footer className="max-w-3xl mx-auto px-4 mt-20 pt-8 border-t border-amber-900/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-neutral-500">
        <span>Cohort Uncut © 2026. Real campus stories, written by peers.</span>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:underline">Homepage</Link>
          <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />
          <Link to="/uncut" className="hover:underline">Uncut Home</Link>
          <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-800" />
          <a href="mailto:cohortnow.online@gmail.com" className="hover:underline">Write for Us</a>
        </div>
      </footer>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{
          id: 'college-love',
          title: 'College, Love Stories and the Dilemma',
          content: 'Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you. Written by Sanya Sahani.',
          text: 'Why falling in love in college feels like choosing between who you are, who you want to become, and who you want beside you. Written by Sanya Sahani.',
          author: { name: 'Sanya Sahani' },
          authorName: 'Sanya Sahani',
          image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop'
        }}
        shareUrl="https://cohortnow.online/uncut/college-love"
        title="College, Love Stories and the Dilemma | Cohort Uncut"
      />
    </div>
  );
}
