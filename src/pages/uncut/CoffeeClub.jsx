import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Clock, Calendar, Share2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { useTheme } from '@/contexts/ThemeContext';
import { Logo } from '@/components/Logo';
import { db } from '@/utils/firebase';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import ShareModal from '@/components/ShareModal';

export default function CoffeeClub() {
  const { isDark } = useTheme();
  const [claps, setClaps] = useState(142);
  const [hasClapped, setHasClapped] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Subscribe to real-time claps from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'uncutClaps', '3am-coffee-club'), (docSnap) => {
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
      "headline": "The 3 AM Coffee Club: A Love Letter to Late-Night Study Rooms",
      "description": "Why do we study better under the hum of fluorescent lights, drinking lukewarm brew, surrounded by strangers sharing the exact same existential dread?",
      "author": { "@type": "Person", "name": "Aaditya Sharma" },
      "publisher": { "@type": "Organization", "name": "Cohort", "url": "https://cohortnow.online" },
      "datePublished": "2026-08-10",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "https://cohortnow.online/uncut/3am-coffee-club" }
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
    localStorage.setItem('has_clapped_3am-coffee-club', 'true');

    try {
      const docRef = doc(db, 'uncutClaps', '3am-coffee-club');
      await setDoc(docRef, { count: increment(1) }, { merge: true });
    } catch (err) {
      console.error("Failed to update clap in Firestore:", err);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#faf7f2] text-neutral-900 dark:bg-[#08080C] dark:text-neutral-100 transition-colors duration-300">

      {/* Atmospheric glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-1/4 w-64 h-64 bg-pink-500/5 dark:bg-pink-500/6 rounded-full blur-3xl pointer-events-none" />

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
        title="The 3 AM Coffee Club | Cohort Uncut"
        description="You know the feeling. It's 2:47 AM, the campus is dead silent, but Room 402 in the library is humming with life. A soft buzz of laptops, the rhythmic clicking of keyboards, and the quiet hiss of the coffee machine..."
        image="https://cohortnow.online/og-image.png"
        type="article"
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Category + meta */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">
            Campus Psychology
          </span>

          <h1 className="mt-5 text-3xl sm:text-4xl font-black leading-tight text-neutral-900 dark:text-neutral-100">
            The{' '}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              3 AM Coffee Club
            </span>
            : A Love Letter to Late-Night Study Rooms
          </h1>

          <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-serif">
            Why do we study better under the hum of fluorescent lights, drinking lukewarm brew, surrounded by strangers sharing the exact same existential dread?
          </p>

          <div className="mt-6 flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-600">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">Aaditya Sharma</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> August 10, 2026</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 min read</span>
          </div>

          <div className="mt-6 h-px bg-neutral-200 dark:bg-neutral-800" />
        </motion.div>

        {/* Article body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 max-w-3xl mx-auto font-serif"
        >
          <p className="first-letter:text-5xl first-letter:font-black first-letter:text-pink-500 first-letter:mr-3 first-letter:float-left text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            You know the feeling. It's 2:47 AM, the campus is dead silent, but Room 402 in the library is humming with life. A soft buzz of laptops, the rhythmic clicking of keyboards, and the quiet hiss of the coffee machine. Nobody is talking, yet everyone is speaking the same silent language: "We have an exam in eight hours, and we are in this together."
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            Why is it that we find solace in the shared misery of all-nighters? Psychologists call it <em>social facilitation</em>—the tendency to perform better when others are around. But on campus, it's something more human. It's the silent support of a stranger typing their history paper next to your coding assignment. It's the shared nod when the coffee pot runs empty.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            There's a strange intimacy to the 3 AM library. Walls come down when everyone is exhausted enough to stop pretending. The competitive facade of the classroom dissolves into something far more honest. The student who usually sits in the front row with their hand always raised is now slumped over their laptop, surrounded by empty energy drink cans, looking just as lost as the rest of us.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            The coffee itself becomes ritualistic. It doesn't matter that it's lukewarm. It doesn't matter that the vending machine coffee tastes vaguely of regret. The act of getting up, walking to the machine, and returning with a cup is a kind of pilgrimage. A five-minute escape. A signal to your exhausted brain: <em>we are still in this. We are still going.</em>
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            And then there are the conversations that only happen at 3 AM. The whispered debates about whether the universe has a purpose. Whether the professor actually reads the essays or just skims them. Whether any of this matters in ten years. These conversations happen in hushed tones, so as not to disturb the others, but they're the most honest discussions campus ever hosts.
          </p>

          <blockquote className="mt-8 border-l-4 border-pink-500 pl-5 italic text-neutral-600 dark:text-neutral-400 text-lg">
            "The late-night library doesn't just host students — it hosts a version of us that doesn't exist anywhere else."
          </blockquote>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            We might not remember the formulas we memorized in those sessions. We might not even remember what exam it was for. But we will always remember the quiet solidarity of people who chose to sit together in the dark, caffeinating themselves back to consciousness, because the alternative — giving up and going to sleep — felt like a betrayal of something larger than any single exam.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg">
            Here's to the late-night warriors, the lukewarm coffee, and the quiet spaces where we grow up. The 3 AM Coffee Club doesn't have a membership card. You join it the moment you look up from your notes, catch a stranger's eye across the silent room, and both look away without saying a word — because nothing needed to be said.
          </p>

          <p className="mt-6 text-neutral-800 dark:text-neutral-200 leading-relaxed text-base sm:text-lg font-semibold">
            We were there. We got through it. That's enough.
          </p>
        </motion.div>

        {/* Clap + Share */}
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

        {/* Back link */}
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{
          id: '3am-coffee-club',
          title: 'The 3 AM Coffee Club: A Love Letter to Late-Night Study Rooms',
          content: 'Why do we study better under the hum of fluorescent lights, drinking lukewarm brew, surrounded by strangers sharing the exact same existential dread?',
          text: 'Why do we study better under the hum of fluorescent lights, drinking lukewarm brew, surrounded by strangers sharing the exact same existential dread?',
          author: { name: 'Aaditya Sharma' },
          authorName: 'Aaditya Sharma',
          image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop'
        }}
        shareUrl="https://cohortnow.online/uncut/3am-coffee-club"
        title="The 3 AM Coffee Club | Cohort Uncut"
      />
    </div>
  );
}
