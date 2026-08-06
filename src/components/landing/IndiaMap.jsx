import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const cities = [
  { name: 'Delhi', colleges: 'DU, JNU, NSUT, DTU', students: '1,200+', x: 53, y: 22 },
  { name: 'Mumbai', colleges: 'IIT-B, VJTI, SPIT', students: '800+', x: 38, y: 55 },
  { name: 'Bangalore', colleges: 'IISc, RVCE, PES', students: '650+', x: 44, y: 72 },
  { name: 'Chennai', colleges: 'IIT-M, Anna Univ', students: '400+', x: 50, y: 78 },
  { name: 'Kolkata', colleges: 'Jadavpur, IIT-KGP', students: '350+', x: 72, y: 38 },
  { name: 'Pune', colleges: 'COEP, Symbiosis', students: '500+', x: 38, y: 58 },
  { name: 'Hyderabad', colleges: 'IIIT-H, BITS', students: '450+', x: 48, y: 62 },
  { name: 'Jaipur', colleges: 'MNIT, LNMIIT', students: '200+', x: 43, y: 30 },
  { name: 'Ghaziabad', colleges: 'KIET, ABES, IMS', students: '300+', x: 55, y: 24 },
  { name: 'Lucknow', colleges: 'IIT-L, BBAU', students: '250+', x: 58, y: 28 },
  { name: 'Chandigarh', colleges: 'PEC, PU', students: '180+', x: 48, y: 15 },
  { name: 'Vellore', colleges: 'VIT', students: '600+', x: 47, y: 74 },
  { name: 'Pilani', colleges: 'BITS Pilani', students: '280+', x: 43, y: 26 },
];

export default function IndiaMap() {
  const [hoveredCity, setHoveredCity] = useState(null);

  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-indigo uppercase tracking-widest">Network</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Growing across India
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
            Active in 50+ cities and counting. Find your campus on the map.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="relative max-w-2xl mx-auto">
          {/* Simplified India outline */}
          <div className="relative w-full aspect-[3/4] rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 overflow-hidden p-8">
            {/* Subtle grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />

            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {cities.slice(0, 6).map((city, i) => {
                const next = cities[(i + 1) % 6];
                return (
                  <line
                    key={i}
                    x1={`${city.x}%`}
                    y1={`${city.y}%`}
                    x2={`${next.x}%`}
                    y2={`${next.y}%`}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-accent-blue/10 dark:text-accent-blue/20"
                  />
                );
              })}
            </svg>

            {/* City dots */}
            {cities.map((city, i) => (
              <div
                key={i}
                className="absolute z-10 group cursor-pointer"
                style={{ left: `${city.x}%`, top: `${city.y}%`, transform: 'translate(-50%, -50%)' }}
                onMouseEnter={() => setHoveredCity(i)}
                onMouseLeave={() => setHoveredCity(null)}
              >
                {/* Pulse ring */}
                <div className="absolute inset-0 w-4 h-4 -m-2 rounded-full bg-accent-blue/20 animate-ping" style={{ animationDelay: `${i * 0.3}s`, animationDuration: '3s' }} />

                {/* Dot */}
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  hoveredCity === i
                    ? 'bg-accent-blue scale-150 shadow-glow-blue'
                    : 'bg-accent-blue/60 dark:bg-accent-blue/80'
                }`} />

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredCity === i && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 rounded-2xl bg-white dark:bg-surface-dark-elevated border border-black/5 dark:border-white/10 shadow-glass-lg whitespace-nowrap z-50"
                    >
                      <p className="text-sm font-display font-bold text-neutral-900 dark:text-white">{city.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{city.colleges}</p>
                      <p className="text-xs font-semibold text-accent-blue mt-1">{city.students} students</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-surface-dark-elevated border-r border-b border-black/5 dark:border-white/10 rotate-45 -mt-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
