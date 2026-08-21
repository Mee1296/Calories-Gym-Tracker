import { useCallback } from 'react';
import { weights as weightsApi } from '../lib/endpoints';
import useAsync from './useAsync';

/** Body-weight history, oldest first — the shape WeightChart expects. */
export default function useWeights(days) {
  const { data, loading, error, reload } = useAsync(
    () => weightsApi.history(days),
    [days],
    { initial: [] },
  );

  const logWeight = useCallback(async (kg, date) => {
    await weightsApi.log(kg, date);
    await reload();
  }, [reload]);

  const entries = data ?? [];
  const latest = entries.length ? entries[entries.length - 1].kg : null;

  return { entries, latest, loading, error, reload, logWeight };
}
