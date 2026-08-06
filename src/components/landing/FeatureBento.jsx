import React from 'react';
import { Users, Compass, Ghost, ShoppingBag, MessageCircle, Globe, UserCircle, TrendingUp } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    icon: Users,
    title: 'College Communities',
    desc: 'Join clubs, departments, and interest groups within your campus. Find your tribe.',
    color: 'from-accent-blue/20 to-accent-blue/5',
    iconColor: 'text-accent-blue',
    glowClass: 'glow-border-blue',
    span: 'md:col-span-2',
  },
  {
    icon: Compass,
    title: 'Campus Feed',
    desc: 'See what\'s happening across your campus. Posts, events, polls, and trending topics.',
    color: 'from-accent-purple/20 to-accent-purple/5',
    iconColor: 'text-accent-purple',
    glowClass: 'glow-border-purple',
    span: '',
  },
  {
    icon: Ghost,
    title: 'Anonymous Confessions',
    desc: 'Share your thoughts without revealing your identity. Verified students only.',
    color: 'from-accent-pink/20 to-accent-pink/5',
    iconColor: 'text-accent-pink',
    glowClass: 'glow-border-pink',
    span: '',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    desc: 'Buy and sell textbooks, electronics, and dorm essentials with fellow students.',
    color: 'from-accent-amber/20 to-accent-amber/5',
    iconColor: 'text-accent-amber',
    glowClass: 'glow-border-cyan',
    span: '',
  },
  {
    icon: MessageCircle,
    title: 'Direct Messaging',
    desc: 'Real-time chat with classmates. Share files, react with emojis, and stay connected.',
    color: 'from-accent-cyan/20 to-accent-cyan/5',
    iconColor: 'text-accent-cyan',
    glowClass: 'glow-border-cyan',
    span: '',
  },
  {
    icon: Globe,
    title: 'Cross-College Groups',
    desc: 'Connect with students from other universities. Build networks beyond your campus.',
    color: 'from-accent-indigo/20 to-accent-indigo/5',
    iconColor: 'text-accent-indigo',
    glowClass: 'glow-border-purple',
    span: 'md:col-span-2',
  },
  {
    icon: UserCircle,
    title: 'Student Profiles',
    desc: 'Showcase your campus identity — your communities, posts, interests, and badges.',
    color: 'from-accent-blue/20 to-accent-blue/5',
    iconColor: 'text-accent-blue',
    glowClass: 'glow-border-blue',
    span: '',
  },
  {
    icon: TrendingUp,
    title: 'Trending Discussions',
    desc: 'Discover what everyone\'s talking about. Trending topics updated in real-time.',
    color: 'from-accent-pink/20 to-accent-pink/5',
    iconColor: 'text-accent-pink',
    glowClass: 'glow-border-pink',
    span: '',
  },
];

export default function FeatureBento() {
  return (
    <section id="features" className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-blue uppercase tracking-widest">Features</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Everything your campus needs
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
            Built for how students actually connect, share, and collaborate.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div
                className={`${feature.span} group relative p-6 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift ${feature.glowClass} cursor-default h-full`}
              >
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
