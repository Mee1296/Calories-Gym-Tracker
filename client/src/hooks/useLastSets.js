import { useCallback, useEffect, useState } from 'react';
import { workouts as workoutsApi } from '../lib/endpoints';

/**
 * Last session's sets for the movements currently on screen, keyed by movement id.
 * These become the grey placeholders in the active workout.
 * Ids already fetched are never requested again.
 */
export default function useLastSets(movementIds = []) {
  const [byMovement, setByMovement] = useState({});
  const [fetched, setFetched] = useState(() => new Set());

  const key = movementIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    const missing = [...new Set(movementIds.filter((id) => id && !fetched.has(id)))];
    if (missing.length === 0) return;

    let cancelled = false;
    workoutsApi.lastSets(missing)
      .then((result) => {
        if (cancelled) return;
        setByMovement((prev) => ({ ...prev, ...result }));
        setFetched((prev) => new Set([...prev, ...missing]));
      })
      .catch(() => {
        // No history is not an error — the defaults stand in.
        if (!cancelled) setFetched((prev) => new Set([...prev, ...missing]));
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /** Falls back to the movement's own defaults when nothing was ever logged. */
  const previousSet = useCallback((movementId, setIndex, fallback) => {
    const history = byMovement[movementId]?.sets;
    if (history?.length) return history[Math.min(setIndex, history.length - 1)];
    return fallback;
  }, [byMovement]);

  return { byMovement, previousSet };
}
