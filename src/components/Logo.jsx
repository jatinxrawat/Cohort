import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A beautiful, premium SVG brand icon for Cohort.
 * Features a glowing squircle badge with an interlocking "C" network shape.
 * The "C" is designed using a perfect 270-degree circular arc.
 */
export const LogoIcon = ({ className = "w-8 h-8", size, glow = true, variant = "badge" }) => {
  const style = size ? { width: size, height: size } : {};
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${variant === 'badge' ? 'rounded-[30%] overflow-hidden' : ''} ${glow && variant === 'badge' ? 'brand-logo-icon' : ''}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <defs>
          <linearGradient id="cohort-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2A85" /> {/* vandal-pink */}
            <stop offset="50%" stopColor="#963BFF" /> {/* topic-violet */}
            <stop offset="100%" stopColor="#00F0FF" /> {/* acid-cyan */}
          </linearGradient>
          <linearGradient id="cohort-badge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14141f" />
            <stop offset="100%" stopColor="#09090e" />
          </linearGradient>
        </defs>

        {variant === 'badge' && (
          <rect
            x="1.5"
            y="1.5"
            width="29"
            height="29"
            rx="10"
            fill="url(#cohort-badge-bg)"
            stroke="url(#cohort-logo-grad)"
            strokeWidth="1.8"
          />
        )}

        {/* Stylized interconnected C-shape using perfect 270-degree circular arc */}
        <path
          d="M 21,11 A 7,7 0 1,0 21,21"
          stroke="url(#cohort-logo-grad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Connecting nodes representing community */}
        <circle cx="21" cy="11" r="2.5" fill="#FF2A85" />
        <circle cx="9" cy="16" r="3.2" fill="#963BFF" stroke={variant === 'badge' ? '#08080C' : 'white'} strokeWidth="1" />
        <circle cx="21" cy="21" r="2.5" fill="#00F0FF" />

        {/* Dynamic academia/sparkle badge indicator inside */}
        <path
          d="M 16,14.5 L 17.5,16 L 16,17.5 L 14.5,16 Z"
          fill={variant === 'badge' ? '#FFFFFF' : '#963BFF'}
        />
      </svg>
    </div>
  );
};

/**
 * Text wordmark for Cohort with the signature colored dot.
 */
export const LogoText = ({ 
  className = "font-display font-black tracking-tight", 
  textSize = "text-xl", 
  isLanding = false 
}) => {
  return (
    <span className={`${className} ${textSize} ${isLanding ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
      Cohort<span className="text-vandal-pink">.</span>
    </span>
  );
};

/**
 * Main Logo component wrapping LogoIcon & LogoText with navigation routing.
 */
export const Logo = ({ 
  to = "/", 
  withText = true, 
  iconSize = "w-8 h-8", 
  textSize = "text-xl", 
  variant = "badge", 
  isLanding = false,
  className = "flex items-center gap-2.5 group"
}) => {
  return (
    <Link to={to} className={className}>
      <LogoIcon 
        className={`${iconSize} transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`} 
        variant={variant} 
      />
      {withText && (
        <LogoText 
          textSize={textSize} 
          isLanding={isLanding} 
          className="font-display font-black tracking-tight" 
        />
      )}
    </Link>
  );
};
