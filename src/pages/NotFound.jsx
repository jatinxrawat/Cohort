import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, HelpCircle, ArrowRight, UserPlus, Info, PhoneCall } from 'lucide-react';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';

/**
 * Enhanced 404 Error Page
 * Features session-aware CTAs, structured public site navigation, and proper search noindexing.
 */
export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-lg relative overflow-hidden bg-white dark:bg-[#08080C] text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      <SEO 
        title="Page Not Found"
        description="The page you are looking for does not exist or has been moved to another location."
        noindex={true}
      />

      {/* Futuristic design background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-primary-500/10 rounded-full blur-[100px] dark:bg-primary-500/5" />
      </div>

      <div className="text-center max-w-xl z-10 w-full">
        {/* Animated 404 Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-8xl md:text-9xl font-heading font-extrabold bg-gradient-to-br from-primary-500 via-primary-400 to-blue-600 bg-clip-text text-transparent select-none filter drop-shadow-sm mb-lg"
        >
          404
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-3xl md:text-4xl font-heading font-bold mb-md"
        >
          Lost on Campus?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 mb-xl max-w-md mx-auto leading-relaxed"
        >
          The lecture hall or link you're looking for doesn't exist, has been removed, or has been relocated to another building.
        </motion.p>

        {/* Primary CTA (Session-Aware) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-md justify-center items-stretch sm:items-center max-w-sm mx-auto mb-3xl"
        >
          {isAuthenticated ? (
            <Link to="/home" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full flex items-center justify-center gap-md shadow-md hover:shadow-lg transition-all">
                <Home className="w-4.5 h-4.5" /> Back to Feed
              </Button>
            </Link>
          ) : (
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full flex items-center justify-center gap-md shadow-md hover:shadow-lg transition-all">
                <Home className="w-4.5 h-4.5" /> Go to Homepage
              </Button>
            </Link>
          )}
          <Link to="/help" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full flex items-center justify-center gap-md">
              <HelpCircle className="w-4.5 h-4.5" /> Help Center
            </Button>
          </Link>
        </motion.div>

        {/* Useful Navigation Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="pt-xl border-t border-neutral-100 dark:border-neutral-800/60 max-w-md mx-auto text-left"
        >
          <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-md text-center">
            Quick Directory
          </p>
          <div className="grid grid-cols-2 gap-sm">
            <Link 
              to="/signup" 
              className="flex items-center gap-sm px-md py-sm bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-150 dark:border-neutral-800/40 rounded-xl text-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-primary-500" />
              <div>
                <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">Join Campus</p>
                <p className="text-[10px] text-neutral-400">Sign Up / Login</p>
              </div>
            </Link>

            <Link 
              to="/about" 
              className="flex items-center gap-sm px-md py-sm bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-150 dark:border-neutral-800/40 rounded-xl text-sm transition-all"
            >
              <Info className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">About Cohort</p>
                <p className="text-[10px] text-neutral-400">Our mission & values</p>
              </div>
            </Link>

            <Link 
              to="/contact" 
              className="flex items-center gap-sm px-md py-sm bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-150 dark:border-neutral-800/40 rounded-xl text-sm transition-all"
            >
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">Support Desk</p>
                <p className="text-[10px] text-neutral-400">Get in touch</p>
              </div>
            </Link>

            <Link 
              to="/privacy" 
              className="flex items-center gap-sm px-md py-sm bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-150 dark:border-neutral-800/40 rounded-xl text-sm transition-all"
            >
              <ArrowRight className="w-4 h-4 text-rose-500" />
              <div>
                <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">Privacy & Terms</p>
                <p className="text-[10px] text-neutral-400">Data protection policy</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
