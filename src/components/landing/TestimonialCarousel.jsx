import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  { quote: "Cohort replaced 5 different apps for me. One place for my study groups, marketplace deals, and confessions. It's genius.", name: 'Rahul Joshi', college: 'KIET Ghaziabad', dept: 'CS', avatar: 'RJ', color: 'from-accent-blue to-accent-purple' },
  { quote: "Finally a platform where I don't have to deal with random strangers. Everyone is verified from my campus.", name: 'Sneha Kapoor', college: 'Delhi University', dept: 'English', avatar: 'SK', color: 'from-accent-pink to-rose-500' },
  { quote: "Sold my old textbooks in 2 hours. The marketplace is so much better when it's only students from nearby colleges.", name: 'Arjun Patel', college: 'BITS Pilani', dept: 'ECE', avatar: 'AP', color: 'from-accent-cyan to-teal-500' },
  { quote: "The confession section is dangerously addictive. Real campus tea without the drama of knowing who posted it.", name: 'Meera Singh', college: 'IIT Bombay', dept: 'ME', avatar: 'MS', color: 'from-accent-amber to-orange-500' },
  { quote: "Cross-college communities opened up so many networking opportunities. Met my hackathon team through Cohort!", name: 'Kunal Dev', college: 'NSUT Delhi', dept: 'IT', avatar: 'KD', color: 'from-accent-indigo to-violet-500' },
  { quote: "The DM system is so clean. File sharing during group projects has never been this seamless.", name: 'Priya Mehta', college: 'VIT Vellore', dept: 'CSE', avatar: 'PM', color: 'from-green-500 to-emerald-500' },
];

// Double for infinite scroll
const doubled = [...testimonials, ...testimonials];

export default function TestimonialCarousel() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold text-accent-amber uppercase tracking-widest">Testimonials</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Loved by students
          </h2>
        </div>
      </div>

      {/* Scrolling row */}
      <div className="marquee-fade">
        <div className="flex animate-marquee gap-6 pb-4">
          {doubled.map((t, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[360px] p-6 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift cursor-default"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-accent-amber text-accent-amber" />
                ))}
              </div>

              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.dept} · {t.college}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
