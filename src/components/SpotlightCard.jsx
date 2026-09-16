import { useRef } from 'react';
import './SpotlightCard.css';

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(255, 255, 255, 0.25)' }) {
  const cardRef = useRef(null);

  const handleMouseMove = (event) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    cardRef.current.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    cardRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return <div ref={cardRef} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`}>{children}</div>;
}
