import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/Button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-lg relative overflow-hidden bg-white dark:bg-neutral-950">
      {/* Decorative background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] dark:bg-primary-500/5" />
      </div>

      <div className="text-center max-w-lg z-10">
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
          className="text-3xl md:text-4xl font-heading font-bold mb-md text-neutral-900 dark:text-white"
        >
          Lost in Campus?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 mb-3xl max-w-sm mx-auto leading-relaxed"
        >
          The page you are looking for does not exist, has been removed, or was relocated to another lecture hall.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-md justify-center items-stretch sm:items-center max-w-xs sm:max-w-none mx-auto"
        >
          <Link to="/home">
            <Button variant="primary" size="md" className="w-full flex items-center justify-center gap-md shadow-md hover:shadow-lg transition-shadow">
              <Home className="w-4.5 h-4.5" /> Back to Campus Feed
            </Button>
          </Link>
          <Link to="/help">
            <Button variant="secondary" size="md" className="w-full flex items-center justify-center gap-md">
              <HelpCircle className="w-4.5 h-4.5" /> Help Center
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
