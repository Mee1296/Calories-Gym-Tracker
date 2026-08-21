import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../lib/api';

/**
 * Runs `loader` on mount and exposes { data, loading, error, reload, setData }.
 * `setData` lets callers apply an optimistic update without a round trip.
 */
export default function useAsync(loader, deps = [], { initial = null, enabled = true } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const run = useCallback(async () => {
    if (!enabled) return undefined;
    setLoading(true);
    try {
      const result = await loader();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err) {
      if (mounted.current) setError(errorMessage(err));
      return undefined;
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, reload: run, setData };
}
