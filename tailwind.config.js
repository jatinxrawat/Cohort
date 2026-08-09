const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
          950: '#082f49',
        },
        // Neutral colors
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Accent colors
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',

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
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
        '4xl': '4rem',
        '5xl': '5rem',
      },
      backdropBlur: {
        'base': '8px',
      },
      fontFamily: {
        sans: ['Space Grotesque', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['Outfit', 'Inter', ...defaultTheme.fontFamily.sans],
        unbounded: ['Unbounded', 'Outfit', ...defaultTheme.fontFamily.sans],
        jakarta: ['Plus Jakarta Sans', 'Inter', ...defaultTheme.fontFamily.sans],
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
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(10px, -15px) rotate(3deg)' },
        },
        float2: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(-12px, -20px) rotate(-4deg)' },
        },
        float3: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(15px, -10px) rotate(2deg)' },
        },
        float4: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(-8px, -25px) rotate(-3deg)' },
        },
        float5: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(12px, -12px) rotate(4deg)' },
        },
        blobDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
