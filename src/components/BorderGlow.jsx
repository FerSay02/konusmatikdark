import { useRef } from 'react';
import './BorderGlow.css';

function parseHsl(value) {
  const match = value.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  return match ? match.slice(1).map(Number) : [40, 80, 80];
}

export default function BorderGlow({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
}) {
  const cardRef = useRef(null);
  const [h, s, l] = parseHsl(glowColor);
  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edge = Math.min(x, y, rect.width - x, rect.height - y);
    const proximity = Math.max(0, Math.min(100, 100 - (edge / Math.max(1, Math.min(rect.width, rect.height) / 2)) * 100));
    const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2) * (180 / Math.PI) + 90;
    card.style.setProperty('--edge-proximity', proximity.toFixed(2));
    card.style.setProperty('--cursor-angle', `${angle}deg`);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--edge-sensitivity': edgeSensitivity,
        '--cone-spread': coneSpread,
        '--glow-intensity': glowIntensity,
        '--glow-color': `hsl(${h} ${s}% ${l}% / 100%)`,
        '--gradient-one': colors[0],
        '--gradient-two': colors[1],
        '--gradient-three': colors[2],
        '--gradient-base': colors[0],
        '--sweep-animation': animated ? 'border-glow-sweep 2.5s ease-in-out infinite' : 'none',
      }}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
