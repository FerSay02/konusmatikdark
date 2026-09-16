import { useState } from 'react';
import './ElasticSlider.css';

export default function ElasticSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 10,
  className = '',
  leftIcon = '−',
  rightIcon = '+',
}) {
  const [internalValue, setInternalValue] = useState(value ?? 70);
  const currentValue = value ?? internalValue;

  const updateValue = (nextValue) => {
    const next = Math.min(max, Math.max(min, nextValue));
    setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div className={`elastic-slider ${className}`}>
      <button type="button" className="elastic-slider-button" onClick={() => updateValue(currentValue - step)} aria-label="Sesi azalt">
        {leftIcon}
      </button>
      <label className="elastic-slider-control">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(event) => updateValue(Number(event.target.value))}
          aria-label="Ses seviyesi"
        />
        <span className="elastic-slider-track" aria-hidden="true">
          <span className="elastic-slider-range" style={{ width: `${((currentValue - min) / (max - min)) * 100}%` }} />
        </span>
      </label>
      <button type="button" className="elastic-slider-button" onClick={() => updateValue(currentValue + step)} aria-label="Sesi artır">
        {rightIcon}
      </button>
      <output className="elastic-slider-value">{currentValue}%</output>
    </div>
  );
}
