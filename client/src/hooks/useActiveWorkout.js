import { useCallback, useMemo, useRef, useState } from 'react';
import useInterval from './useInterval';
import { num } from '../lib/format';

export const REST_SECONDS = 90;

const emptyRow = () => ({ weight: '', reps: '', done: false });

/** A routine entry or a picked movement becomes an in-session exercise. */
const toExercise = (movement, setCount = 1) => ({
  movementId: movement.movementId || movement._id,
  name: movement.name,
  defaultWeight: movement.weight ?? movement.defaultWeight ?? 0,
  defaultReps: movement.reps ?? movement.defaultReps ?? 10,
  rows: Array.from({ length: Math.max(1, setCount) }, emptyRow),
});

/**
 * Owns everything about a workout in progress: the exercises, the elapsed
 * clock and the rest timer. The screen just renders what this returns.
 */
export default function useActiveWorkout(source) {
  const startedAt = useRef(new Date());
  const [exercises, setExercises] = useState(() =>
    (source?.exercises || []).map((entry) => toExercise(entry, entry.sets)));
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);

  useInterval(() => setElapsed((s) => s + 1), 1000);
  useInterval(() => setRest((r) => Math.max(0, r - 1)), rest > 0 ? 1000 : null);

  const mapExercise = (index, fn) =>
    setExercises((list) => list.map((ex, i) => (i === index ? fn(ex) : ex)));

  const updateRow = useCallback((exerciseIndex, rowIndex, patch) => {
    mapExercise(exerciseIndex, (ex) => ({
      ...ex,
      rows: ex.rows.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row)),
    }));
  }, []);

  /**
   * Logging a set with blank inputs adopts last session's numbers, which is
   * why `previousSet` is passed in rather than read from a hook here.
   */
  const toggleRow = useCallback((exerciseIndex, rowIndex, previous) => {
    setExercises((list) => list.map((ex, i) => {
      if (i !== exerciseIndex) return ex;
      return {
        ...ex,
        rows: ex.rows.map((row, r) => {
          if (r !== rowIndex) return row;
          if (row.done) return { ...row, done: false };
          return {
            done: true,
            weight: row.weight === '' ? previous.weight : row.weight,
            reps: row.reps === '' ? previous.reps : row.reps,
          };
        }),
      };
    }));
    setRest((current) => (current > 0 ? current : REST_SECONDS));
  }, []);

  const addSet = useCallback((exerciseIndex) => {
    mapExercise(exerciseIndex, (ex) => {
      const last = ex.rows[ex.rows.length - 1];
      return { ...ex, rows: [...ex.rows, { weight: last?.weight ?? '', reps: last?.reps ?? '', done: false }] };
    });
  }, []);

  const removeSet = useCallback((exerciseIndex, rowIndex) => {
    mapExercise(exerciseIndex, (ex) => (
      ex.rows.length <= 1 ? ex : { ...ex, rows: ex.rows.filter((_, i) => i !== rowIndex) }
    ));
  }, []);

  const addExercise = useCallback((movement) => {
    setExercises((list) => [...list, toExercise(movement)]);
  }, []);

  const swapExercise = useCallback((index, movement) => {
    setExercises((list) => list.map((ex, i) => (i === index ? toExercise(movement) : ex)));
  }, []);

  const removeExercise = useCallback((index) => {
    setExercises((list) => list.filter((_, i) => i !== index));
  }, []);

  const skipRest = useCallback(() => setRest(0), []);

  const stats = useMemo(() => {
    const doneRows = exercises.flatMap((ex) => ex.rows).filter((row) => row.done);
    const totalRows = exercises.reduce((acc, ex) => acc + ex.rows.length, 0);
    return {
      doneCount: doneRows.length,
      totalRows,
      allDone: totalRows > 0 && doneRows.length === totalRows,
      volume: Math.round(doneRows.reduce((acc, row) => acc + num(row.weight) * num(row.reps), 0)),
    };
  }, [exercises]);

  /** Only logged sets are saved — half-filled rows are ignored. */
  const buildPayload = useCallback(() => ({
    name: source?.name || 'Quick Workout',
    routineId: source?._id || null,
    startedAt: startedAt.current.toISOString(),
    endedAt: new Date().toISOString(),
    duration: elapsed,
    exercises: exercises
      .map((ex) => ({
        movementId: ex.movementId,
        sets: ex.rows.filter((row) => row.done).map((row) => ({ weight: num(row.weight), reps: num(row.reps) })),
      }))
      .filter((ex) => ex.sets.length > 0),
  }), [exercises, elapsed, source]);

  return {
    exercises,
    elapsed,
    rest,
    stats,
    updateRow,
    toggleRow,
    addSet,
    removeSet,
    addExercise,
    swapExercise,
    removeExercise,
    skipRest,
    buildPayload,
  };
}
