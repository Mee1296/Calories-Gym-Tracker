import { useCallback } from 'react';
import { workouts as workoutsApi } from '../lib/endpoints';
import useAsync from './useAsync';

export default function useWorkouts(limit = 10) {
  const { data, loading, error, reload } = useAsync(
    () => workoutsApi.history(limit),
    [limit],
    { initial: [] },
  );

  const finishWorkout = useCallback(async (payload) => {
    const result = await workoutsApi.finish(payload);
    await reload();
    return result;
  }, [reload]);

  return { history: data ?? [], loading, error, reload, finishWorkout };
}
