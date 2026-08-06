import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, ShoppingBag, School, FileText } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started, startOnView]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, ref };
}

const stats = [
  { icon: Users, label: 'Communities', value: 500, suffix: '+', color: 'text-accent-blue' },
  { icon: MessageSquare, label: 'Messages Sent', value: 120, suffix: 'K+', color: 'text-accent-purple' },
  { icon: ShoppingBag, label: 'Marketplace Listings', value: 2000, suffix: '+', color: 'text-accent-pink' },
  { icon: School, label: 'Colleges', value: 100, suffix: '+', color: 'text-accent-cyan' },
  { icon: FileText, label: 'Posts Created', value: 20, suffix: 'K+', color: 'text-accent-amber' },
];

export default function StatsCounter() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 p-8 sm:p-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const { count, ref } = useCountUp(stat.value, 2000 + i * 200);
              return (
                <div key={i} ref={ref} className="text-center">
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                  <p className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-900 dark:text-white">
                    {count.toLocaleString()}{stat.suffix}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
