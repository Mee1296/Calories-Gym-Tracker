import { useCallback } from 'react';
import { meals as mealsApi, goals as goalsApi } from '../lib/endpoints';
import { dayKey } from '../lib/format';
import useAsync from './useAsync';

const EMPTY = {
  meals: [],
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  goals: { calories: 2400, protein: 160, carbs: 250, fat: 75 },
};

/** Today's meals, totals and goals — the Today screen's whole data source. */
export default function useToday(date = dayKey()) {
  const { data, loading, error, reload } = useAsync(
    () => mealsApi.day(date),
    [date],
    { initial: EMPTY },
  );

  const logMeal = useCallback(async (meal) => {
    await mealsApi.log({ ...meal, date });
    await reload();
  }, [date, reload]);

  const removeMeal = useCallback(async (id) => {
    await mealsApi.remove(id);
    await reload();
  }, [reload]);

  const saveGoals = useCallback(async (values) => {
    await goalsApi.update(values);
    await reload();
  }, [reload]);

  return {
    meals: data?.meals ?? EMPTY.meals,
    totals: data?.totals ?? EMPTY.totals,
    goals: data?.goals ?? EMPTY.goals,
    loading,
    error,
    reload,
    logMeal,
    removeMeal,
    saveGoals,
  };
}
