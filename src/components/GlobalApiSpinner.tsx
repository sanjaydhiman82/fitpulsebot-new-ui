import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const SPINNER_EVENT = 'fitpulse-api-spinner';

type SpinnerDetail = {
  active: boolean;
  label?: string;
};

export function showGlobalApiSpinner(label = 'Loading data...') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<SpinnerDetail>(SPINNER_EVENT, { detail: { active: true, label } }));
}

export function hideGlobalApiSpinner() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<SpinnerDetail>(SPINNER_EVENT, { detail: { active: false } }));
}

export default function GlobalApiSpinner() {
  const [activeCount, setActiveCount] = useState(0);
  const [label, setLabel] = useState('Loading data...');

  useEffect(() => {
    const onSpinner = (event: Event) => {
      const detail = (event as CustomEvent<SpinnerDetail>).detail;
      if (detail?.active) {
        setLabel(detail.label || 'Loading data...');
        setActiveCount(count => count + 1);
        return;
      }
      setActiveCount(count => Math.max(0, count - 1));
    };

    window.addEventListener(SPINNER_EVENT, onSpinner);
    return () => window.removeEventListener(SPINNER_EVENT, onSpinner);
  }, []);

  if (activeCount <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 12, 24, 0.78)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          transform: 'translateY(-2vh)',
        }}
      >
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: 30,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(145deg, rgba(32, 84, 91, .48), rgba(12, 42, 54, .74))',
            border: '1px solid rgba(75, 210, 181, .34)',
            boxShadow: '0 26px 70px rgba(0, 0, 0, .38), inset 0 0 0 1px rgba(255, 255, 255, .04)',
          }}
        >
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 26,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(4, 22, 34, .58)',
              border: '1px solid rgba(75, 210, 181, .42)',
            }}
          >
            <img
              src="/coach.png"
              alt=""
              style={{ width: 112, height: 112, objectFit: 'contain' }}
              onError={event => {
                event.currentTarget.src = '/logo192.png';
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            color: '#58d9f1',
            fontSize: 18,
            fontWeight: 800,
            textShadow: '0 8px 24px rgba(88, 217, 241, .18)',
          }}
        >
          <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
