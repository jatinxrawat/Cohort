import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, GraduationCap, ChevronDown, Check } from 'lucide-react';

export function FeedToggle({ activeFeed, onChangeFeed, userCollege, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const collegeDisplayName = userCollege || 'My College';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (feed) => {
    onChangeFeed(feed);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block mb-4 ${className}`} ref={dropdownRef}>
      {/* Compact Trigger Button with Small Arrow */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm hover:shadow-md text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-all cursor-pointer select-none group"
      >
        <span className="p-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
          {activeFeed === 'public' ? (
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </span>

        <span className="tracking-tight max-w-[160px] sm:max-w-[220px] truncate">
          {activeFeed === 'public' ? 'Public Feed' : `${collegeDisplayName}`}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : 'group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-1.5 z-40 w-56 sm:w-64 p-1.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800/90 shadow-xl shadow-black/10 dark:shadow-black/40 space-y-1"
          >
            <div className="px-3 py-1.5 text-[10px] uppercase font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500">
              Select Feed
            </div>

            {/* Option 1: Public Feed */}
            <button
              type="button"
              onClick={() => handleSelect('public')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeFeed === 'public'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeFeed === 'public' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-neutral-900 dark:text-neutral-100">Public Feed</div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Posts from all colleges</div>
              </div>
              {activeFeed === 'public' && (
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              )}
            </button>

            {/* Option 2: My College Feed */}
            <button
              type="button"
              onClick={() => handleSelect('college')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeFeed === 'college'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeFeed === 'college' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{collegeDisplayName}</div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500">My campus feed only</div>
              </div>
              {activeFeed === 'college' && (
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FeedToggle;
