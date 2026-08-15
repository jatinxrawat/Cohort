import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Clock, Calendar, Share2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { useTheme } from '@/contexts/ThemeContext';
import { Logo } from '@/components/Logo';
import { db } from '@/utils/firebase';
import { doc, onSnapshot, setDoc, getDoc, increment } from 'firebase/firestore';

export default function IntrovertGuide() {
  const { isDark } = useTheme();
  const [claps, setClaps] = useState(98);
  const [hasClapped, setHasClapped] = useState(() => {
    return localStorage.getItem('has_clapped_introvert-guide') === 'true';
  });
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Subscribe to real-time claps from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'uncutClaps', 'introvert-guide'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.count === 'number') {
          setClaps(data.count);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Why We Seek the Quiet: The Reluctant Introvert's Guide to Campus Life",
      "description": "College is loud. Here is an honest perspective on finding peace, recharge spots, and meaningful connections in a world that never stops talking.",
      "author": { "@type": "Person", "name": "Neha Deshmukh" },
      "publisher": { "@type": "Organization", "name": "Cohort", "url": "https://cohortnow.online" },
      "datePublished": "2026-08-08",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "https://cohortnow.online/uncut/introvert-guide" }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const handleClap = async () => {
    if (hasClapped) return;
    setHasClapped(true);
    localStorage.setItem('has_clapped_introvert-guide', 'true');

    try {
      const docRef = doc(db, 'uncutClaps', 'introvert-guide');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await setDoc(docRef, { count: increment(1) }, { merge: true });
      } else {
        await setDoc(docRef, { count: 99 }, { merge: true });
      }
    } catch (err) {
      console.error("Failed to update clap in Firestore:", err);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#faf7f2] text-neutral-900 dark:bg-[#08080C] dark:text-neutral-100 transition-colors duration-300">

      <div className="absolute top-0 right-1/3 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 left-1/4 w-64 h-64 bg-cyan-500/4 dark:bg-cyan-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-[#08080C]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7" />
            <Link
              to="/uncut"
              className="font-unbounded font-black text-xs tracking-wider text-pink-500 dark:text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-md border border-pink-500/20 transition-all"
            >
              UNCUT
            </Link>
          </div>
          <Link
            to="/uncut"
            className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Uncut
          </Link>
        </div>
      </header>

      <SEO
        title="The Reluctant Introvert's Guide to Campus Life | Cohort Uncut"
        description="College is loud. Here is an honest perspective on finding peace, recharge spots, and meaningful connections in a world that never stops talking."
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
            Self & Growth
          </span>

          <h1 className="mt-5 text-3xl sm:text-4xl font-black leading-tight text-neutral-900 dark:text-neutral-100">
            Why We Seek the{' '}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Quiet
            </span>
            : The Reluctant Introvert's Guide to Campus Life
          </h1>

          <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-serif">
            College is loud. Here is an honest perspective on finding peace, recharge spots, and meaningful connections in a world that never stops talking.
          </p>

          <div className="mt-6 flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-600">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">Neha Deshmukh</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> August 8, 2026</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 4 min read</span>
          </div>

          <div className="mt-6 h-px bg-neutral-200 dark:bg-neutral-800" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 max-w-3xl mx-auto font-serif"
        >
          <p className="first-letter:text-5xl first-letter:font-black first-letter:text-pink-500 first-letter:mr-3 first-letter:float-left text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            From orientation week icebreakers to crowded hostel mess halls, college is an extrovert's playground. But for the 40% of us who recharge in silence, it can feel like a marathon with no finish line. The pressure to always be "out there" making friends, going to parties, and being effortlessly social is exhausting. It's a performance, and some of us were never given the script.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            I remember my first week of college. Everyone seemed to know how to do it — walk into a stranger's room and just <em>talk</em>. Exchange numbers. Make weekend plans. I stood in my own doorway watching, genuinely confused about the operating system everyone else seemed to be running. Mine was different. It required quiet to boot up.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            But here's the secret nobody tells you: some of the most profound campus connections happen in the quiet. They happen in the two-person tea stall conversations behind the engineering block at 7 PM. In late-night walks on the running track where words come slower and mean more. In sitting side-by-side in the library reading completely different books and somehow feeling deeply understood.
          </p>

          <blockquote className="mt-8 border-l-4 border-cyan-500 pl-5 italic text-neutral-600 dark:text-neutral-400 text-lg">
            "Introversion isn't about hating people. It's about knowing exactly how much of yourself you can give before you need it back."
          </blockquote>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            Finding your 'quiet hubs' is the introvert's survival skill. Every campus has them — the botanical garden bench that nobody visits after 5 PM, the top floor of the old library building where the wi-fi doesn't reach so nobody bothers, the empty stairwell that gets afternoon sun. These are not hiding spots. They are charging docks.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            The mistake we make is thinking that needing these spaces is a flaw. That we should fix ourselves to become louder, more available, more present. But quiet presence is its own kind of power. The friend who listens instead of talks. The group member who notices what everyone else misses. The roommate who doesn't need constant stimulation to feel at ease with you.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            You don't have to shout to be heard on campus. You don't have to go to every party to belong. Sometimes, surviving college as an introvert means finding the one person who understands your silence — and calling that enough.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg font-semibold">
            That's not less than what the extroverts have. It might actually be more.
          </p>
        </motion.div>

        <div className="mt-12 flex items-center gap-4">
          <button
            onClick={handleClap}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${hasClapped ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400'}`}
          >
            <Heart className={`w-4 h-4 ${hasClapped ? 'fill-white' : ''}`} />
            {claps} claps
          </button>
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-semibold text-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {showShareTooltip && (
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[11px] bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-2.5 py-1 rounded-lg whitespace-nowrap">
                Link copied!
              </span>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <Link to="/uncut" className="text-sm text-pink-500 dark:text-pink-400 hover:underline font-semibold">
            ← Back to Cohort Uncut
          </Link>
          <span className="mx-3 text-neutral-300 dark:text-neutral-700">·</span>
          <Link to="/" className="text-sm text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors">
            Homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
