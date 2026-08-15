import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Clock, Calendar, Share2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { useTheme } from '@/contexts/ThemeContext';
import { Logo } from '@/components/Logo';

export default function UnwrittenRules() {
  const { isDark } = useTheme();
  const [claps, setClaps] = useState(() => {
    const saved = localStorage.getItem('claps_unwritten-rules');
    return saved ? parseInt(saved, 10) : 215;
  });
  const [hasClapped, setHasClapped] = useState(() => {
    return localStorage.getItem('has_clapped_unwritten-rules') === 'true';
  });
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "The Unwritten Hallway Rules We All Silently Agree To",
      "description": "From the library seat reservation etiquette to the polite nod of hallway avoidance — analyzing the funny social contracts of college life.",
      "author": { "@type": "Person", "name": "Kabir Mehta" },
      "publisher": { "@type": "Organization", "name": "Cohort", "url": "https://cohortnow.online" },
      "datePublished": "2026-08-05",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "https://cohortnow.online/uncut/unwritten-rules" }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const handleClap = () => {
    if (hasClapped) return;
    const newClaps = claps + 1;
    setClaps(newClaps);
    setHasClapped(true);
    localStorage.setItem('claps_unwritten-rules', String(newClaps));
    localStorage.setItem('has_clapped_unwritten-rules', 'true');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#faf7f2] text-neutral-900 dark:bg-[#08080C] dark:text-neutral-100 transition-colors duration-300">

      <div className="absolute top-20 left-1/3 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/7 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 right-1/4 w-64 h-64 bg-yellow-500/4 dark:bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

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
        title="The Unwritten Hallway Rules We All Silently Agree To | Cohort Uncut"
        description="From the library seat reservation etiquette to the polite nod of hallway avoidance — analyzing the funny social contracts of college life."
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-500 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
            Campus Vibes
          </span>

          <h1 className="mt-5 text-3xl sm:text-4xl font-black leading-tight text-neutral-900 dark:text-neutral-100">
            The{' '}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Unwritten
            </span>{' '}
            Hallway Rules We All Silently Agree To
          </h1>

          <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-serif">
            From the library seat reservation etiquette to the polite nod of hallway avoidance — analyzing the funny social contracts of college life.
          </p>

          <div className="mt-6 flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-600">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">Kabir Mehta</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> August 5, 2026</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 3 min read</span>
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
            Every university has a student handbook. It tells you how to register for courses, what to wear at convocation, and why you shouldn't plagiarize. But the real rules — the ones that actually govern daily campus life — are never written down anywhere. They are absorbed through osmosis, learned through embarrassing trial and error, and enforced through nothing more than a look.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            <strong>Rule #1: The Library Chair Claim.</strong> If you leave your laptop charger and a notebook on a desk, you have officially claimed that desk for up to 45 minutes of absence. Any longer, and your belongings are fair game to be moved neatly to the side by a desk-hunter. The neatness is crucial — it signals respect for the system, even as you violate the claim.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            <strong>Rule #2: The Hallway Nod.</strong> If you see someone you vaguely know from a group project last semester, you must exchange a fast upward nod if you are friendly, or look intensely at your phone or watch if you want to avoid awkward small talk. Looking at your watch is especially powerful because nobody actually wears watches anymore, making it unmistakably intentional.
          </p>

          <blockquote className="mt-8 border-l-4 border-teal-500 pl-5 italic text-neutral-600 dark:text-neutral-400 text-lg">
            "We might not study them in class, but the unwritten rules are the most important courses in human behavior we will ever take."
          </blockquote>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            <strong>Rule #3: The Mess Queue Hierarchy.</strong> You can cut the mess line only if the person you're cutting in front of is someone you have eaten with at least three times before. This rule is understood perfectly and yet never stated. Violate it with a stranger and feel the weight of thirty silent, judgmental stares.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            <strong>Rule #4: The Shared Notes Covenant.</strong> If someone shares their lecture notes with you before an exam, you are socially obligated to share yours with them at the next exam — or any future exam, indefinitely, until graduation. This is an unbreakable campus bond. It supersedes friendships and survives departmental transfers.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            These tiny behaviors are the social glue that keeps campus from descending into absolute chaos. Nobody teaches them. Nobody enforces them. And yet, everyone follows them — because deep down, we all understand that college is a shared experiment in learning how to be human, and the unwritten rules are where that experiment actually happens.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg font-semibold">
            Study hard. But don't forget to study the hallway too.
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
