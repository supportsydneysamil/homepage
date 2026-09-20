import { useEffect, useRef } from 'react';

export type ToastTone = 'success' | 'error';

export type ToastMessage = {
  // A counter rather than the text, so repeating the same message restarts the timer.
  id: number;
  text: string;
  tone: ToastTone;
};

// Failures stay long enough to read twice; confirmations get out of the way.
const DISMISS_MS: Record<ToastTone, number> = { success: 4000, error: 8000 };

type ToastProps = {
  message: ToastMessage | null;
  closeLabel: string;
  onDismiss: () => void;
};

const Toast = ({ message, closeLabel, onDismiss }: ToastProps) => {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const id = message ? message.id : null;
  const tone = message ? message.tone : null;

  useEffect(() => {
    if (id === null || !tone) return;
    const timer = setTimeout(() => dismissRef.current(), DISMISS_MS[tone]);
    return () => clearTimeout(timer);
  }, [id, tone]);

  if (!message) return null;

  const isError = message.tone === 'error';

  return (
    <div
      className={isError ? 'site-toast site-toast--error' : 'site-toast'}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <p className="site-toast__text">{message.text}</p>
      <button type="button" className="site-toast__close" onClick={onDismiss} aria-label={closeLabel}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
};

export default Toast;
