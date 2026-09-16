import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react';
import './ShinyText.css';

export default function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = '#6c3ce9',
  shineColor = '#f472b6',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  delay = 0,
}) {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const directionRef = useRef(direction === 'left' ? 1 : -1);
  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame((time) => {
    if (disabled || isPaused) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += delta;
    const cycleDuration = animationDuration + delayDuration;
    const cycleLength = yoyo ? cycleDuration * 2 : cycleDuration;
    const cycleTime = elapsedRef.current % cycleLength;
    const forwardTime = cycleTime < cycleDuration ? cycleTime : cycleLength - cycleTime;
    const p = forwardTime < animationDuration ? (forwardTime / animationDuration) * 100 : 100;
    progress.set(directionRef.current === 1 ? p : 100 - p);
  });

  useEffect(() => {
    directionRef.current = direction === 'left' ? 1 : -1;
    elapsedRef.current = 0;
    progress.set(0);
  }, [direction, progress]);

  const backgroundPosition = useTransform(progress, (value) => `${150 - value * 2}% center`);
  const handleMouseEnter = useCallback(() => { if (pauseOnHover) setIsPaused(true); }, [pauseOnHover]);
  const handleMouseLeave = useCallback(() => { if (pauseOnHover) setIsPaused(false); }, [pauseOnHover]);

  return (
    <motion.span
      className={`shiny-text ${className}`}
      style={{ backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 28%, #6c3ce9 42%, ${shineColor} 50%, #d21784 58%, #38bdf8 64%, ${color} 76%, ${color} 100%)`, backgroundSize: '220% auto', backgroundPosition, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >{text}</motion.span>
  );
}
