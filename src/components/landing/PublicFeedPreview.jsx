import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, TrendingUp, BarChart3, Image, Verified } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const trendingTags = ['#PlacementSeason', '#HostelLife', '#MidtermPanic', '#CampusFest', '#StudyBuddy'];

export default function PublicFeedPreview() {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(234);
  const [saved, setSaved] = useState(false);
  const [pollVoted, setPollVoted] = useState(false);
  const [pollChoice, setPollChoice] = useState(null);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handlePollVote = (choice) => {
    if (pollVoted) return;
    setPollVoted(true);
    setPollChoice(choice);
  };

  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-pink uppercase tracking-widest">Live Feed</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            See what's happening
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
            Real posts. Real students. Real campus life.
          </p>
        </div>
      </ScrollReveal>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Trending tags */}
        <ScrollReveal>
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {trendingTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent-blue/5 dark:bg-accent-blue/10 text-accent-blue border border-accent-blue/10 hover:bg-accent-blue/10 dark:hover:bg-accent-blue/20 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </ScrollReveal>

        {/* Post 1 — Text + Image */}
        <ScrollReveal>
          <div className="p-5 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-sm font-bold">
                AS
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                  Aman Singh <Verified className="w-3.5 h-3.5 text-accent-blue" />
                </p>
                <p className="text-xs text-neutral-500">Computer Science · KIET · 2h ago</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trending
              </span>
            </div>

            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              The new library wing is finally open! Perfect study spot with great natural lighting. Already claimed my corner seat 📚✨ #CampusLife
            </p>

            {/* Image placeholder */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 h-48 flex items-center justify-center mb-4 overflow-hidden">
              <div className="text-center">
                <Image className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-blue-500 font-medium">New Library Wing</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-5">
                <button onClick={handleLike} className="flex items-center gap-1.5 text-sm cursor-pointer group">
                  <Heart className={`w-4.5 h-4.5 transition-all ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-neutral-400 group-hover:text-red-400'}`} />
                  <span className={`font-medium ${liked ? 'text-red-500' : 'text-neutral-500'}`}>{likeCount}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-accent-blue transition-colors cursor-pointer">
                  <MessageCircle className="w-4.5 h-4.5" />
                  <span className="font-medium">48</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-accent-cyan transition-colors cursor-pointer">
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              </div>
              <button onClick={() => setSaved(!saved)} className="cursor-pointer">
                <Bookmark className={`w-4.5 h-4.5 transition-all ${saved ? 'fill-accent-amber text-accent-amber' : 'text-neutral-400 hover:text-accent-amber'}`} />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Post 2 — Poll */}
        <ScrollReveal delay={0.1}>
          <div className="p-5 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-pink to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                PK
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Pooja Kapoor</p>
                <p className="text-xs text-neutral-500">BioTech · DU · 4h ago</p>
              </div>
            </div>

            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent-purple" />
              Best study spot on campus?
            </p>

            <div className="space-y-2">
              {[
                { label: 'Library 3rd Floor', pct: 45 },
                { label: 'Coffee Shop', pct: 30 },
                { label: 'Hostel Common Room', pct: 25 },
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handlePollVote(i)}
                  className={`relative w-full h-11 rounded-xl border px-4 flex items-center justify-between overflow-hidden cursor-pointer transition-all ${
                    pollVoted
                      ? pollChoice === i
                        ? 'border-accent-blue bg-accent-blue/5'
                        : 'border-black/5 dark:border-white/5'
                      : 'border-black/5 dark:border-white/5 hover:border-accent-blue/30 hover:bg-accent-blue/5'
                  }`}
                >
                  {pollVoted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${opt.pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute inset-y-0 left-0 bg-accent-blue/10 dark:bg-accent-blue/15"
                    />
                  )}
                  <span className="relative z-10 text-sm font-medium text-neutral-700 dark:text-neutral-300">{opt.label}</span>
                  {pollVoted && (
                    <span className="relative z-10 text-sm font-bold text-accent-blue">{opt.pct}%</span>
                  )}
                </button>
              ))}
            </div>
            {pollVoted && (
              <p className="text-xs text-neutral-500 mt-3">156 votes · 2h remaining</p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
