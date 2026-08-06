import React from 'react';
import { Users, TrendingUp, Zap } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const communities = [
  { name: 'KIET AI Club', members: 482, tag: 'Technology', color: 'from-accent-blue to-blue-600', activity: 'Very Active', emoji: '🤖' },
  { name: 'Football Fans', members: 1240, tag: 'Sports', color: 'from-green-500 to-emerald-600', activity: 'Active', emoji: '⚽' },
  { name: 'Startup Founders', members: 315, tag: 'Business', color: 'from-accent-purple to-violet-600', activity: 'Very Active', emoji: '🚀' },
  { name: 'Photography', members: 678, tag: 'Creative', color: 'from-accent-pink to-rose-600', activity: 'Active', emoji: '📷' },
  { name: 'Anime Hub', members: 920, tag: 'Entertainment', color: 'from-accent-amber to-orange-500', activity: 'Trending', emoji: '🎌' },
  { name: 'Web Developers', members: 543, tag: 'Technology', color: 'from-accent-cyan to-teal-600', activity: 'Active', emoji: '💻' },
];

export default function CommunityShowcase() {
  return (
    <section id="communities" className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-cyan uppercase tracking-widest">Communities</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Find your people
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
            Hundreds of communities across colleges. Here are some favorites.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {communities.map((comm, i) => (
          <ScrollReveal key={i} delay={i * 0.08}>
            <div className="group relative p-5 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift cursor-default h-full">
              {/* Header gradient strip */}
              <div className={`h-2 rounded-full bg-gradient-to-r ${comm.color} mb-5 group-hover:h-3 transition-all duration-300`} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{comm.emoji}</span>
                  <div>
                    <h3 className="text-base font-display font-bold text-neutral-900 dark:text-white">{comm.name}</h3>
                    <span className="text-xs text-neutral-500">{comm.tag}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{comm.members.toLocaleString()}</span>
                  <span className="text-neutral-400 dark:text-neutral-500">members</span>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  comm.activity === 'Trending'
                    ? 'bg-accent-amber/10 text-accent-amber'
                    : comm.activity === 'Very Active'
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}>
                  {comm.activity === 'Trending' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  {comm.activity === 'Very Active' && <Zap className="w-3 h-3 inline mr-1" />}
                  {comm.activity}
                </span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
