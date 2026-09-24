import { useEffect, useState } from 'react';
import { shouldDockSettingsActions } from '../../lib/settingsDraft';

export const useSettingsActionsDocking = () => {
  const [settingsPage, setSettingsPage] = useState<HTMLElement | null>(null);
  const [actionsDocked, setActionsDocked] = useState(false);

  useEffect(() => {
    if (!settingsPage) return;
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setActionsDocked(
          shouldDockSettingsActions(
            settingsPage.getBoundingClientRect().bottom,
            window.innerHeight
          )
        );
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(settingsPage);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [settingsPage]);

  return {
    settingsPageRef: setSettingsPage,
    actionsDocked,
  };
};
