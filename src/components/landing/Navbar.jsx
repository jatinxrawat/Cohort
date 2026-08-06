import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Communities', href: '#communities' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-white font-display font-extrabold text-sm">C</span>
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white">
              Cohort
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/home"
                className="magnetic-btn hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40 transition-all duration-300"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="magnetic-btn hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40 transition-all duration-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-surface-dark-secondary border-l border-black/5 dark:border-white/5 p-6 pt-20"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent-blue to-accent-purple"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/home"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent-blue to-accent-purple"
                  >
                    Open App
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
