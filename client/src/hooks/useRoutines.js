import { useCallback } from 'react';
import { routines as routinesApi } from '../lib/endpoints';
import useAsync from './useAsync';

export default function useRoutines() {
  const { data, loading, error, reload } = useAsync(() => routinesApi.list(), [], { initial: [] });

  const createRoutine = useCallback(async (routine) => {
    const created = await routinesApi.create(routine);
    await reload();
    return created;
  }, [reload]);

  const updateRoutine = useCallback(async (id, routine) => {
    const saved = await routinesApi.update(id, routine);
    await reload();
    return saved;
  }, [reload]);

  const removeRoutine = useCallback(async (id) => {
    await routinesApi.remove(id);
    await reload();
  }, [reload]);

  return { routines: data ?? [], loading, error, reload, createRoutine, updateRoutine, removeRoutine };
}
