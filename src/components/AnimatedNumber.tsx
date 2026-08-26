import React, { useState, useEffect, useRef } from 'react';

export function AnimatedNumber({
  value,
  duration = 420,
  formatter
}: {
  value: number;
  duration?: number;
  formatter?: (v: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const startValRef = useRef(value);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    const start = startValRef.current;
    const end = value;
    startValRef.current = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <>{formatter ? formatter(displayValue) : Math.round(displayValue).toLocaleString()}</>;
}
