import { useEffect, useState } from 'react';
import './SiteLoader.css';

const MINIMUM_DISPLAY_TIME = 1250;

export default function SiteLoader() {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startedAt = performance.now();
    let loaded = document.readyState === 'complete';
    let timer;
    let frame;

    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener('load', onLoad, { once: true });

    const tick = () => {
      if (loaded && performance.now() - startedAt >= MINIMUM_DISPLAY_TIME) {
        timer = window.setTimeout(() => setIsExiting(true), 180);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('load', onLoad);
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isExiting) return undefined;
    const timer = window.setTimeout(() => setIsVisible(false), 520);
    return () => window.clearTimeout(timer);
  }, [isExiting]);

  if (!isVisible) return null;

  return (
    <div className={`site-loader${isExiting ? ' site-loader--exit' : ''}`} role="status" aria-live="polite" aria-label="Konuşmatik yükleniyor">
      <div className="site-loader-glow" aria-hidden="true" />
      <div className="site-loader-content">
        <div className="site-loader-logo" aria-label="Konuşmatik">
          <img src="/images/logo-new.png" alt="" aria-hidden="true" />
          <span>Konuşmatik</span>
        </div>
        <div className="site-loader-progress" aria-hidden="true">
          <span className="site-loader-progress-ring" />
        </div>
      </div>
    </div>
  );
}
