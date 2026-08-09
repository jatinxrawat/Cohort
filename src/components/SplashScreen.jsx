import React from 'react';
import { LogoIcon } from './Logo';

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-midnight-slate text-white select-none">
      {/* Centered Logo block */}
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Large Logo Icon */}
        <div className="transform hover:scale-105 transition-transform duration-300">
          <LogoIcon className="w-24 h-24" variant="badge" glow={true} />
        </div>
        
        {/* Logo Text "Cohort." */}
        <span className="font-display font-black text-5xl tracking-tight text-white mt-2">
          Cohort<span className="text-vandal-pink">.</span>
        </span>
        
        {/* Vibrant Gradient Tagline */}
        <span className="text-gradient-brand text-sm sm:text-base font-black tracking-widest uppercase mt-3">
          Your campus social media
        </span>
      </div>
      
      {/* Subtle loader line at the bottom */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 h-[4px] bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-vandal-pink via-topic-violet to-acid-cyan rounded-full animate-pulse w-full" />
      </div>
    </div>
  );
};

export default SplashScreen;
