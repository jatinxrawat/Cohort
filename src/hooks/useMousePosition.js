import { useState, useEffect, useCallback } from 'react';

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setPosition({ x, y });
  }, []);

  useEffect(() => {
    let rafId;
    let lastX = 0;
    let lastY = 0;

    const throttledHandler = (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        if (Math.abs(x - lastX) > 0.01 || Math.abs(y - lastY) > 0.01) {
          lastX = x;
          lastY = y;
          setPosition({ x, y });
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', throttledHandler, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttledHandler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return position;
}
