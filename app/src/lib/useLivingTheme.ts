import { useEffect } from 'react';
import {
  computeLivingTarget,
  LIVING_TRANSITION_MS,
  LIVING_UPDATE_MS,
  resolveLivingTone,
  type LivingTone,
} from './livingTheme';

export const LIVING_PROPERTIES = [
  '--living-hue',
  '--living-sat',
  '--living-dark',
  '--living-flip',
] as const;

type LivingStyle = {
  setProperty: (name: string, value: string) => void;
  removeProperty: (name: string) => string;
};

export const applyLivingTone = (style: LivingStyle, tone: LivingTone) => {
  style.setProperty('--living-hue', tone.hue.toFixed(3));
  style.setProperty('--living-sat', tone.sat.toFixed(3));
  style.setProperty('--living-dark', tone.dark.toFixed(4));
  style.setProperty('--living-flip', String(tone.flip));
};

export const clearLivingTone = (style: LivingStyle) => {
  LIVING_PROPERTIES.forEach((property) => {
    style.removeProperty(property);
  });
};

export const useLivingTheme = (active: boolean) => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const style = document.body.style;
    if (!active) {
      clearLivingTone(style);
      return;
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    let currentSide: 0 | 1 | null = null;
    let interval: number | null = null;
    let animationFrame: number | null = null;

    const stopAnimation = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const stopInterval = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };

    const applyCurrentPole = () => {
      stopAnimation();
      const target = computeLivingTarget(new Date(), reducedMotion);
      currentSide = target.side;
      applyLivingTone(style, resolveLivingTone(target));
    };

    const update = () => {
      const target = computeLivingTarget(new Date(), reducedMotion);
      if (currentSide === null || currentSide === target.side) {
        currentSide = target.side;
        applyLivingTone(style, resolveLivingTone(target));
        return;
      }

      stopAnimation();
      currentSide = target.side;
      const startedAt = window.performance.now();
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / LIVING_TRANSITION_MS);
        applyLivingTone(style, resolveLivingTone(target, progress));
        if (progress < 1 && document.visibilityState !== 'hidden') {
          animationFrame = window.requestAnimationFrame(animate);
        } else {
          animationFrame = null;
        }
      };
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startInterval = () => {
      stopInterval();
      interval = window.setInterval(update, LIVING_UPDATE_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopInterval();
        stopAnimation();
        return;
      }
      applyCurrentPole();
      startInterval();
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      applyCurrentPole();
    };

    applyCurrentPole();
    if (document.visibilityState !== 'hidden') startInterval();
    document.addEventListener('visibilitychange', handleVisibility);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      stopInterval();
      stopAnimation();
      document.removeEventListener('visibilitychange', handleVisibility);
      motionQuery.removeEventListener('change', handleMotionChange);
      clearLivingTone(style);
    };
  }, [active]);
};
