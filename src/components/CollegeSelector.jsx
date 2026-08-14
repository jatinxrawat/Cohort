import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ChevronDown, Check, Search, X } from 'lucide-react';
import { INDIAN_COLLEGES } from '@/utils/indianColleges';

export function CollegeSelector({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search input display with selected value when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [isOpen, value]);

  // Filter colleges based on user search term
  const filteredColleges = useMemo(() => {
    if (!searchTerm.trim()) return INDIAN_COLLEGES;
    const term = searchTerm.toLowerCase().trim();
    return INDIAN_COLLEGES.filter(c => c.toLowerCase().includes(term));
  }, [searchTerm]);

  const handleSelect = (collegeName) => {
    onChange(collegeName);
    setSearchTerm(collegeName);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      <label className="block font-semibold text-sm text-neutral-700 dark:text-neutral-300">
        College / University
      </label>

      {/* Clean Input Field */}
      <div className="relative">
        <GraduationCap className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        
        <input
          type="text"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          placeholder="Select or search college..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
        />

        {searchTerm ? (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 pointer-events-none ${
              isOpen ? 'rotate-180 text-purple-500' : ''
            }`}
          />
        )}
      </div>

      {/* Floating Dropdown List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-black/10 dark:shadow-black/40 divide-y divide-neutral-100 dark:divide-neutral-800/60"
          >
            {filteredColleges.length > 0 ? (
              filteredColleges.map((college, idx) => {
                const isSelected = value?.toLowerCase().trim() === college.toLowerCase().trim();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(college)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 font-medium'
                    }`}
                  >
                    <span className="truncate pr-2">{college}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3.5 py-3 text-xs text-neutral-400 dark:text-neutral-500 text-center">
                Press enter to use "{searchTerm}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CollegeSelector;
