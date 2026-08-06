import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      {/* Gradient blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-blob-1 opacity-20 dark:opacity-15 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(91,127,255,0.5) 0%, transparent 70%)',
          top: '5%',
          left: '10%',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-blob-2 opacity-20 dark:opacity-15 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
          top: '30%',
          right: '5%',
        }}
      />
      <div
        className="absolute w-[550px] h-[550px] rounded-full animate-blob-3 opacity-15 dark:opacity-10 blur-[110px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,157,0.4) 0%, transparent 70%)',
          bottom: '10%',
          left: '25%',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-blob-1 opacity-10 dark:opacity-8 blur-[80px]"
        style={{
          background: 'radial-gradient(circle, rgba(6,214,160,0.4) 0%, transparent 70%)',
          top: '60%',
          right: '20%',
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay" />
    </div>
  );
}
