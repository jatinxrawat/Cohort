import React from 'react';
import { MapPin } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const listings = [
  { name: 'Engineering Mathematics', price: '₹350', category: 'Books', condition: 'Good', college: 'KIET', emoji: '📚', bg: 'from-blue-100 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10' },
  { name: 'Hero Sprint Cycle', price: '₹3,500', category: 'Transport', condition: 'Like New', college: 'DU', emoji: '🚲', bg: 'from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10' },
  { name: 'Dell Inspiron 15', price: '₹28,000', category: 'Electronics', condition: 'Good', college: 'BITS', emoji: '💻', bg: 'from-purple-100 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10' },
  { name: 'Casio fx-991EX', price: '₹750', category: 'Tools', condition: 'New', college: 'IIT-D', emoji: '🧮', bg: 'from-amber-100 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10' },
  { name: 'Study Desk + Chair', price: '₹2,200', category: 'Furniture', condition: 'Good', college: 'NSUT', emoji: '🪑', bg: 'from-rose-100 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10' },
  { name: 'PS5 Controller', price: '₹4,500', category: 'Gaming', condition: 'Like New', college: 'VIT', emoji: '🎮', bg: 'from-cyan-100 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/10' },
];

export default function MarketplaceSection() {
  return (
    <section id="marketplace" className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-amber uppercase tracking-widest">Marketplace</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Campus deals, no middlemen
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
            Buy and sell directly with verified students from your college.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {listings.map((item, i) => (
          <ScrollReveal key={i} delay={i * 0.08}>
            <div className="group p-4 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift cursor-default h-full flex flex-col">
              {/* Image area */}
              <div className={`h-36 rounded-2xl bg-gradient-to-br ${item.bg} flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform duration-300`}>
                <span className="text-4xl">{item.emoji}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-display font-bold text-neutral-900 dark:text-white">{item.name}</h3>
                    <span className="text-xs text-neutral-500">{item.category}</span>
                  </div>
                  <span className="text-lg font-display font-extrabold text-accent-blue">{item.price}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="w-3 h-3" /> {item.college}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  item.condition === 'New'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : item.condition === 'Like New'
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}>
                  {item.condition}
                </span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
