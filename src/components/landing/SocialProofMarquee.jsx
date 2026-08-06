import React from 'react';
import { School, Users, MessageSquare, MapPin, TrendingUp, BookOpen } from 'lucide-react';

const items = [
  { icon: School, label: '100+ Colleges', color: 'text-accent-blue' },
  { icon: Users, label: '5,000+ Students', color: 'text-accent-purple' },
  { icon: MessageSquare, label: '20,000+ Posts', color: 'text-accent-pink' },
  { icon: MapPin, label: '50+ Cities', color: 'text-accent-cyan' },
  { icon: TrendingUp, label: '500+ Communities', color: 'text-accent-amber' },
  { icon: BookOpen, label: '2,000+ Listings', color: 'text-accent-indigo' },
];

// Double the items for seamless infinite scroll
const doubled = [...items, ...items];

export default function SocialProofMarquee() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="marquee-fade">
        <div className="flex animate-marquee gap-6">
          {doubled.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-sm"
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
