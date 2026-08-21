import { useCallback, useMemo } from 'react';
import { movements as movementsApi } from '../lib/endpoints';
import useAsync from './useAsync';

const GROUP_ORDER = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
const GROUP_LABELS = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', legs: 'Legs', core: 'Core',
};

/** The movement library, grouped for the picker and indexed by id for lookups. */
export default function useMovements() {
  const { data, loading, error, reload } = useAsync(() => movementsApi.list(), [], { initial: [] });

  const list = useMemo(() => data ?? [], [data]);

  const groups = useMemo(() => {
    const buckets = new Map();
    for (const movement of list) {
      if (!buckets.has(movement.group)) buckets.set(movement.group, []);
      buckets.get(movement.group).push(movement);
    }
    return GROUP_ORDER
      .filter((group) => buckets.has(group))
      .map((group) => ({ group, label: GROUP_LABELS[group], moves: buckets.get(group) }));
  }, [list]);

  const byId = useMemo(() => new Map(list.map((m) => [m._id, m])), [list]);

  /** Creates a movement and refreshes the library so it shows up. */
  const create = useCallback(async (draft) => {
    const created = await movementsApi.create(draft);
    await reload();
    return created;
  }, [reload]);

  const update = useCallback(async (id, patch) => {
    const saved = await movementsApi.update(id, patch);
    await reload();
    return saved;
  }, [reload]);

  /** Deleting can also touch routines, so callers usually reload those too. */
  const remove = useCallback(async (id) => {
    const result = await movementsApi.remove(id);
    await reload();
    return result;
  }, [reload]);

  return { movements: list, groups, byId, loading, error, reload, create, update, remove };
}

export { GROUP_LABELS };
