import { useState, useEffect } from "react";

export function useCountUp(target: number, duration = 700) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return count;
}
