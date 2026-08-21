import { useEffect } from 'react';

export default function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handler(event);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [ref, handler, active]);
}
