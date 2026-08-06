import React from 'react';
import { School, Users, Zap } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const steps = [
  {
    number: '01',
    icon: School,
    title: 'Choose Your College',
    desc: 'Sign up with your student email. We verify your institution so only real students join.',
    color: 'from-accent-blue to-accent-purple',
  },
  {
    number: '02',
    icon: Users,
    title: 'Join Communities',
    desc: 'Discover clubs, departments, and interest groups. Join conversations that matter to you.',
    color: 'from-accent-purple to-accent-pink',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Start Connecting',
    desc: 'Post, chat, trade, confess. Build your campus identity and make lasting connections.',
    color: 'from-accent-pink to-accent-amber',
  },
];

export default function HowItWorks() {
  return (
    <section id="about" className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-purple uppercase tracking-widest">How it works</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Three steps to your campus
          </h2>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden lg:block absolute top-16 left-[18%] right-[18%] h-px bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink opacity-20" />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="relative text-center p-8 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift group h-full">
                {/* Step number badge */}
                <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-5xl font-display font-extrabold text-neutral-100 dark:text-neutral-800/50 select-none absolute top-4 right-6">
                  {step.number}
                </span>
                <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
