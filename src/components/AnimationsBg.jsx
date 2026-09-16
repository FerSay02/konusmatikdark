export function AnimationsBg() {
  const bars = Array.from({ length: 56 }, (_, i) => {
    const base = 30 + (Math.sin(i * 0.55) + 1) * 22;
    const accent = (i % 7) * 2.2;
    return Math.min(92, Math.round(base + accent));
  });

  return (
    <div className="animations-bg">
      <div className="sound-bars" aria-hidden="true">
        {bars.map((height, i) => (
          <div
            key={`bar-${i}`}
            className={`bar ${i % 8 === 0 ? 'pulse' : ''}`}
            style={{
              '--bar-height': `${height}%`,
              animationDelay: `${(i % 9) * 0.08}s`,
              animationDuration: `${1 + (i % 5) * 0.18}s`,
            }}
          />
        ))}
      </div>

      <div className="wave-wrapper">
        <svg className="wave-path" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.09)" />
          <path d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" transform="translate(1200, 0)" fill="rgba(255,255,255,0.09)" />
        </svg>
      </div>

      <div className="wave-wrapper wave-path-2">
        <svg className="wave-path" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,82 C200,24 400,108 600,82 C800,24 1000,108 1200,82 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.07)" />
          <path d="M0,82 C200,24 400,108 600,82 C800,24 1000,108 1200,82 L1200,120 L0,120 Z" transform="translate(1200, 0)" fill="rgba(255,255,255,0.07)" />
        </svg>
      </div>
    </div>
  );
}
