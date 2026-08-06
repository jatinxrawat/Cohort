import { useState, useEffect } from 'react';

export function useScrollProgress(elementRef) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef?.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;
        const rawProgress = (windowHeight - elementTop) / (windowHeight + elementHeight);
        setProgress(Math.max(0, Math.min(1, rawProgress)));
      } else {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [elementRef]);

  return progress;
}
