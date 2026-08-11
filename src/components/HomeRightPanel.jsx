import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, PenTool, Clock, Sparkles, X, ChevronLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';

const FEATURED_ARTICLES = [
  {
    id: 'college-love',
    title: 'College, Love Stories and the Dilemma',
    excerpt: 'Why falling in love in college feels like choosing between who you are and who you want to become.',
    author: 'Sanya Sahani',
    readTime: '6 min',
    gradient: 'from-pink-500 via-purple-500 to-cyan-400',
    category: 'Love & Heartbreak',
  },
  {
    id: '3am-coffee-club',
    title: 'The 3 AM Coffee Club',
    excerpt: 'A love letter to late-night study rooms and the quiet camaraderie of all-nighters.',
    author: 'Aaditya Sharma',
    readTime: '5 min',
    gradient: 'from-purple-500 via-indigo-500 to-violet-600',
    category: 'Campus Psychology',
  },
  {
    id: 'introvert-guide',
    title: "The Reluctant Introvert's Guide",
    excerpt: 'Finding peace, recharge spots, and meaningful connections when college never stops talking.',
    author: 'Neha Deshmukh',
    readTime: '4 min',
    gradient: 'from-cyan-500 via-sky-500 to-indigo-500',
    category: 'Self & Growth',
  },
  {
    id: 'unwritten-rules',
    title: 'The Unwritten Hallway Rules',
    excerpt: 'Analyzing the funny social contracts and unspoken etiquette of college life.',
    author: 'Kabir Mehta',
    readTime: '3 min',
    gradient: 'from-teal-500 via-emerald-500 to-cyan-500',
    category: 'Campus Vibes',
  },
];

export default function HomeRightPanel() {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('cohort_uncut_panel_hidden') === 'true'; } catch { return false; }
  });

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    try { localStorage.setItem('cohort_uncut_panel_hidden', String(next)); } catch {}
  };

  // Collapsed state — show a small vertical tab to re-open
  if (hidden) {
    return (
      <div className="hidden xl:flex flex-shrink-0 sticky top-[72px] self-start ml-2">
        <button
          onClick={toggle}
          title="Show Cohort Uncut"
          className="group flex flex-col items-center gap-1.5 px-2 py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 hover:border-pink-500/30 shadow-sm hover:shadow-pink-500/10 transition-all duration-200"
        >
          <PanelRightOpen className="w-3.5 h-3.5 text-neutral-400 group-hover:text-pink-500 transition-colors" />
          <span
            className="text-[9px] font-black tracking-wider text-neutral-400 group-hover:text-pink-500 transition-colors"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            UNCUT
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="hidden xl:flex flex-col w-[360px] flex-shrink-0 sticky top-[72px] self-start h-[calc(100vh-88px)] ml-4 gap-3"
    >

      {/* What is Cohort Uncut */}
      <div className="flex-shrink-0 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 p-3.5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
              <PenTool className="w-3.5 h-3.5 text-pink-500" />
            </div>
            <div>
              <h2 className="font-black text-xs sm:text-[13px] tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
                Cohort{' '}
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Uncut
                </span>
              </h2>
              <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-medium leading-tight mt-0.5">
                Student stories & campus chronicles
              </p>
            </div>
          </div>
          {/* Hide panel button */}
          <button
            onClick={toggle}
            title="Hide Cohort Uncut panel"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 dark:hover:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 flex-shrink-0"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-2.5">
          Real stories, raw emotions, and honest reflections from campus lives across India. No filters. Just truth.
        </p>

        <Link
          to="/uncut"
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-pink-500/8 dark:hover:bg-pink-500/10 text-neutral-600 dark:text-neutral-400 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 group"
        >
          <span className="text-[11px] font-semibold">Explore all stories</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      {/* Featured Stories — flex-1 to fill all remaining height dynamically */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 shadow-sm overflow-hidden">
        {/* Header inside card */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2 bg-white dark:bg-neutral-900 flex-shrink-0 border-b border-neutral-100 dark:border-neutral-800/40">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <h2 className="font-bold text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-200 tracking-tight">
              Featured Reads
            </h2>
          </div>
          <Link
            to="/uncut"
            className="text-[11px] font-semibold text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
          >
            See all
          </Link>
        </div>

        {/* Scrollable article list — dynamically stretches to fill remaining height on Mac & Windows */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 overscroll-y-contain"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,128,0.2) transparent', overscrollBehavior: 'contain' }}
        >
          <div className="space-y-0.5">
            {FEATURED_ARTICLES.map((article) => (
              <Link
                key={article.id}
                to={`/uncut/${article.id}`}
                className="group flex gap-2.5 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200 cursor-pointer"
              >
                {/* Gradient accent bar */}
                <div className={`w-0.5 flex-shrink-0 rounded-full bg-gradient-to-b ${article.gradient} opacity-80`} />

                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                    {article.category}
                  </span>
                  <h3 className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 leading-tight mt-0.5 mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-relaxed line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[9px] text-neutral-400 dark:text-neutral-600 font-medium">{article.author}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                    <div className="flex items-center gap-0.5">
                      <Clock className="w-2 h-2 text-neutral-400 dark:text-neutral-600" />
                      <span className="text-[9px] text-neutral-400 dark:text-neutral-600 font-medium">{article.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Fade hint at bottom */}
        <div className="h-3 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent -mt-3 relative z-10 pointer-events-none flex-shrink-0" />
      </div>

      {/* Write for Uncut CTA */}
      <div className="flex-shrink-0 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 p-3.5 shadow-sm relative overflow-hidden">
        {/* Subtle decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/3 to-cyan-500/5 dark:from-pink-500/10 dark:via-purple-500/5 dark:to-cyan-500/10 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            </div>
            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Write your story
            </h3>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-2.5">
            Have a campus story? Submit to Cohort Uncut and reach thousands of students.
          </p>
          <Link
            to="/uncut?submit=true#submit-story-form"
            className="inline-flex items-center gap-2 text-[11px] font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 px-3.5 py-1.5 rounded-xl transition-all duration-200 shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 active:scale-95"
          >
            <PenTool className="w-3 h-3" />
            Submit a story
          </Link>
        </div>
      </div>
    </aside>
  );
}
