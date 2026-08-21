import { useEffect, useRef } from 'react';

/** setInterval that survives re-renders and pauses when `delay` is null. */
export default function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; }, [callback]);

  useEffect(() => {
    if (delay === null || delay === undefined) return undefined;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
