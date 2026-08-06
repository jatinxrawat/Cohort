const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode surfaces
        'surface-dark': '#0A0A0F',
        'surface-dark-secondary': '#12131A',
        'surface-dark-card': '#181922',
        'surface-dark-elevated': '#1E1F2B',

        // Light mode surfaces
        'surface-light': '#FFFFFF',
        'surface-light-secondary': '#F8F9FA',
        'surface-light-card': '#FFFFFF',

        // Accent palette
        'accent-blue': '#5B7FFF',
        'accent-purple': '#8B5CF6',
        'accent-cyan': '#06D6A0',
        'accent-pink': '#FF6B9D',
        'accent-amber': '#F59E0B',
        'accent-indigo': '#6366F1',

        // Brand Palette (Redesign)
        'midnight-slate': '#08080C',
        'neon-indigo': '#4D26FF',
        'acid-cyan': '#00F0FF',
        'vandal-pink': '#FF2A85',
        'topic-violet': '#963BFF',

        // Neutral extensions
        'neutral-850': '#1A1A2E',
      },
      fontFamily: {
        sans: ['Space Grotesque', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['Outfit', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.16)',
        'glow-blue': '0 0 30px rgba(91, 127, 255, 0.3)',
        'glow-purple': '0 0 30px rgba(139, 92, 246, 0.3)',
        'glow-pink': '0 0 30px rgba(255, 107, 157, 0.3)',
        'glow-cyan': '0 0 30px rgba(6, 214, 160, 0.3)',
        'card-hover': '0 20px 60px -12px rgba(0, 0, 0, 0.25)',
        'card-hover-light': '0 20px 60px -12px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
        'float-1': 'float1 6s ease-in-out infinite',
        'float-2': 'float2 8s ease-in-out infinite',
        'float-3': 'float3 7s ease-in-out infinite',
        'float-4': 'float4 9s ease-in-out infinite',
        'float-5': 'float5 5s ease-in-out infinite',
        'blob-1': 'blobDrift 20s ease-in-out infinite',
        'blob-2': 'blobDrift 25s ease-in-out infinite 2s',
        'blob-3': 'blobDrift 22s ease-in-out infinite 4s',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'count-up': 'countUp 0.5s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float1: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        float2: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-1.5deg)' },
        },
        float3: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-25px) rotate(1deg)' },
        },
        float4: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(-2deg)' },
        },
        float5: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(1.5deg)' },
        },
        blobDrift: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
};
