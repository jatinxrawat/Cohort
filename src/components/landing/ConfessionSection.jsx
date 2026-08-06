import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const confessions = [
  {
    text: "I've been pretending to understand quantum physics for 3 semesters now. At this point I'm too afraid to ask questions. 😭",
    gender: 'male',
    likes: 342,
    comments: 67,
    time: '3h ago',
    college: 'IIT Delhi',
  },
  {
    text: "The library's 3rd floor is where I go to cry between exams and somehow I always find someone else doing the same thing 📚",
    gender: 'female',
    likes: 521,
    comments: 89,
    time: '5h ago',
    college: 'DU',
  },
  {
    text: "Accidentally replied-all to the entire department instead of just my friend. The email said 'this prof is so boring'. I'm transferring colleges. 💀",
    gender: 'male',
    likes: 1023,
    comments: 234,
    time: '1d ago',
    college: 'BITS Pilani',
  },
  {
    text: "My crush sits next to me in Data Structures but I can't even sort my feelings, let alone an array 😩",
    gender: 'female',
    likes: 756,
    comments: 145,
    time: '8h ago',
    college: 'KIET',
  },
];

function GenderAvatar({ gender }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      gender === 'male'
        ? 'bg-blue-100 dark:bg-blue-900/30'
        : 'bg-pink-100 dark:bg-pink-900/30'
    }`}>
      <svg className={`w-5 h-5 ${gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`} viewBox="0 0 24 24" fill="currentColor">
        {gender === 'male' ? (
          <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 14c-4.418 0-8 2.239-8 5v1c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-1c0-2.761-3.582-5-8-5z" />
        ) : (
          <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5S14.757 2 12 2zM12 14c-4.418 0-8 2.239-8 5v1c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-1c0-2.761-3.582-5-8-5z" />
        )}
      </svg>
    </div>
  );
}

export default function ConfessionSection() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-accent-purple uppercase tracking-widest">Confessions</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Unfiltered. Anonymous. Real.
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
            Share your thoughts without revealing your identity. Only verified students can post.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {confessions.map((conf, i) => (
          <ScrollReveal key={i} delay={i * 0.1}>
            <div className="group p-5 rounded-3xl bg-white dark:bg-surface-dark-card border border-black/5 dark:border-white/5 hover-lift cursor-default h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <GenderAvatar gender={conf.gender} />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Anonymous
                    </p>
                    <p className="text-xs text-neutral-500">{conf.college} · {conf.time}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                  "{conf.text}"
                </p>
              </div>

              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Heart className="w-4 h-4 text-red-400" /> {conf.likes.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <MessageCircle className="w-4 h-4" /> {conf.comments}
                </span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
