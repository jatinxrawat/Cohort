import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Clock, Calendar, Users, UserPlus, Sparkles, Share2 } from 'lucide-react';
import SEO from '@/components/SEO';
import BorderGlow from '@/components/BorderGlow';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { db } from '@/utils/firebase';
import { doc, onSnapshot, setDoc, getDoc, increment } from 'firebase/firestore';

export default function SevenDays() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const [claps, setClaps] = useState(412);
  const [hasClapped, setHasClapped] = useState(() => {
    return localStorage.getItem('has_clapped_seven-days-changed-us') === 'true';
  });
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Subscribe to real-time claps from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'uncutClaps', 'seven-days-changed-us'), (docSnap) => {
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
      "headline": "Seven Days that Changed us",
      "description": "Some things teach you more about yourself than anything else ever could. For us, building Cohort has been one of those things.",
      "author": {
        "@type": "Organization",
        "name": "Team Cohort",
        "url": "https://cohortnow.online"
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
      "datePublished": "2026-08-16",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://cohortnow.online/uncut/seven-days-changed-us"
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
    localStorage.setItem('has_clapped_seven-days-changed-us', 'true');

    try {
      const docRef = doc(db, 'uncutClaps', 'seven-days-changed-us');
      await setDoc(docRef, { count: increment(1) }, { merge: true });
    } catch (err) {
      console.error("Failed to update clap in Firestore:", err);
    }
  };

  const handleShare = () => {
    const shareUrl = "https://cohortnow.online" + window.location.pathname + window.location.search;
    navigator.clipboard.writeText(shareUrl);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  return (
    <div className="min-h-screen relative bg-[#faf7f2] dark:bg-[#08080C] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans pb-24 overflow-x-hidden selection:bg-pink-500/20 selection:text-pink-600 dark:selection:text-pink-300">
      <SEO 
        title="Seven Days that Changed us | Cohort Uncut"
        description="Some things teach you more about yourself than anything else ever could. For us, building Cohort has been one of those things. Written by Team Cohort."
        image="https://cohortnow.online/og-image.png"
      />

      {/* Atmospheric Background Blurs (Hidden on Mobile) */}
      <div className="hidden md:dark:block absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="hidden md:dark:block absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-pink-900/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* --- ARTICLE HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#08080C]/70 backdrop-blur-xl border-b border-amber-900/5 dark:border-white/5 pb-4 pt-safe-header px-4 sm:px-6">
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
            <span>Failures & Sacrifices</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-neutral-950 dark:text-white">
            Seven Days <br />
            that <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">Changed</span> us
          </h1>

          <p className="text-lg sm:text-xl font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans max-w-2xl border-l-4 border-pink-500 pl-4 py-1 italic">
            Some things teach you more about yourself than anything else ever could. For us, building Cohort has been one of those things.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-4 text-xs font-semibold text-neutral-450 dark:text-neutral-500 border-t border-amber-900/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <Users className="w-4 h-4 text-pink-500" />
              <span>Team Cohort</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md">Creators, Cohort</span>
            </div>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-800">|</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>August 16, 2026</span>
            </div>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-800">|</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>4 min read</span>
            </div>
          </div>
        </div>

        {/* --- ARTICLE CONTENT (SERIF FORMATTING) --- */}
        <div className="max-w-none text-base sm:text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif space-y-6 pt-6 select-text border-b border-amber-900/5 dark:border-white/5 pb-12">
          
          <p className="first-letter:text-5xl first-letter:font-black first-letter:text-pink-500 first-letter:mr-3 first-letter:float-left">
            Some things teach you more about yourself than anything else ever could. They teach you about your capabilities. Your limits. Your resilience. Your power. For us, building Cohort has been one of those things. We aren't a team of 10 or 20 developers, with one person handling the frontend, another handling the backend, someone else managing databases, another running marketing, and another managing everything else. We're four people. And only two of us are developers. That's it.
          </p>

          <p>
            So yes, we might fail. Maybe Cohort will never become what we imagine it could be. Maybe one day it will simply be remembered as another social platform that tried and didn't make it. Maybe people will call us outdated builders because while everyone was talking about AI, we chose to build something that, at its core, was simply about people and their college lives. We don't know what the future holds.
          </p>

          <p>
            But there is one thing we know with absolute certainty: we know how hard we worked. And if someday a big tech company, an investor, or someone far more experienced than us looks at Cohort and says, "You guys are rookies. You know nothing about building products. You don't know what real hard work looks like." Maybe we'll still be rookies. Maybe we still have a thousand things to learn.
          </p>

          <blockquote className="my-8 pl-6 border-l-4 border-purple-500 italic text-neutral-600 dark:text-neutral-300 font-sans text-base sm:text-lg max-w-2xl bg-purple-500/5 py-4 pr-4 rounded-r-xl">
            "If you think we know nothing about hard work, then you know nothing about how hard we've worked."
          </blockquote>

          <p>
            Because we now know what it means to put your body and your mind on the line for something you believe in. We know what it means to work for 20 hours in a day. We know what it means to spend 15–16 hours without seeing the outside of a room because there was something we desperately wanted to finish. We know what it means to stare at a problem with no money, no team of specialists, and no one coming to rescue you, and still find a solution. We know what it means to find alternatives when you literally have no budget.
          </p>

          <p>
            We know what it means to build, break, rebuild, fail, search, learn, debug, rethink, and try again. And most importantly, we know what it feels like to look at something that didn't exist a week ago and say: "We built this."
          </p>

          <p>
            Maybe our efforts won't make Cohort as big as Instagram or Twitter. Maybe they won't. But they have already made us bigger than we were seven days ago. Seven days ago, we were game addicts with those big round glasses. Today, we are the pillars holding up a vision. A product. A company that, for the first time, feels like something that could actually belong to us.
          </p>

          <p>
            And tonight, at 2:00 AM, when India will be asleep, Cohort will rise to the world. Not as the next Instagram. Not as the next Twitter. Not as some revolutionary AI startup. Just as Cohort. Four people. Two developers. One vision. And a stubborn belief that we deserve to compete for our own little piece of the world.
          </p>

          <p>
            We aren't writing this to attract users. We aren't writing this to sell anything. That's why there is no website link here. No app link. No call to action. This isn't marketing. This is simply us putting into words what the last seven days have meant to us.
          </p>

          <p>
            Whatever happens next, we will remember these seven days. Because Cohort may or may not become big. But we will never again be the same people who started building it. And for that alone, it was worth it.
          </p>

          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg border-t border-amber-900/10 dark:border-white/10 pt-6">
            Thank you.<br />
            — Team Cohort
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
              {hasClapped ? "Thanks for cheering Team Cohort!" : "Show Team Cohort some love!"}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={handleShare}
              className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-neutral-500" />
              <span>Share Story</span>
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
                TC
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display font-black text-lg text-neutral-950 dark:text-white leading-tight">
                      Team Cohort
                    </h4>
                    <p className="text-xs text-neutral-500 font-extrabold uppercase">
                      Creators & Builders, Cohort
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
                  Team Cohort consists of 4 people, including only 2 developers. They build Cohort to create a genuine, unfiltered campus social media platform where college students can connect and build their own communities.
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
    </div>
  );
}
