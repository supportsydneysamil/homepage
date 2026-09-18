import { useEffect } from 'react';

const ScrollActivity = () => {
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const root = document.documentElement;

    const handleScroll = () => {
      root.classList.add('is-scrolling');
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => root.classList.remove('is-scrolling'), 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimer) clearTimeout(hideTimer);
      root.classList.remove('is-scrolling');
    };
  }, []);

  return null;
};

export default ScrollActivity;
