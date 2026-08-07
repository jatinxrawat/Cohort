import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashIntro = ({ onComplete }) => {
  const videoRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    // Check session storage skip logic
    const hasSeenIntro = sessionStorage.getItem('hasSeenSplashIntro');
    if (hasSeenIntro) {
      onComplete();
      return;
    }
  }, [onComplete]);

  const handleVideoEnded = () => {
    // Start smooth fade out (800ms)
    setIsFadingOut(true);
    sessionStorage.setItem('hasSeenSplashIntro', 'true');
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  const handleVideoCanPlay = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback if autoplay fails
        handleVideoEnded();
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isFadingOut ? 0 : 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="fixed inset-0 z-[99999] bg-black overflow-hidden flex items-center justify-center pointer-events-none select-none"
      >
        {/* Background Dark Overlay for Premium Look */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10 pointer-events-none" />

        {/* Video Element */}
        <video
          ref={videoRef}
          src="/assets/intro.mp4"
          muted
          playsInline
          autoPlay
          controls={false}
          onCanPlay={handleVideoCanPlay}
          onEnded={handleVideoEnded}
          className={`w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.div>
    </AnimatePresence>
  );
};
