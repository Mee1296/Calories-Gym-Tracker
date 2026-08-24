import { useMemo, useState } from 'react';
import { C } from '../../theme/tokens';
import { btnGhost, btnDashed } from '../../theme/styles';
import { Button, EmptyState, Notice } from '../ui';
import ExerciseSetCard from './ExerciseSetCard';
import ExercisePicker from './ExercisePicker';
import RestTimer from './RestTimer';
import useActiveWorkout, { REST_SECONDS } from '../../hooks/useActiveWorkout';
import useLastSets from '../../hooks/useLastSets';
import { errorMessage } from '../../lib/api';
import { fmtTime } from '../../lib/format';

/** Full-screen workout session. `source` is a routine, or null for a quick start. */
export default function ActiveWorkout({ source, onFinish, onCancel, library }) {
  const workout = useActiveWorkout(source);
  const { groups, loading: movementsLoading, create: createMovement } = library;
  const [picker, setPicker] = useState(null); // null | 'add' | exercise index being swapped
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const movementIds = useMemo(() => workout.exercises.map((ex) => ex.movementId), [workout.exercises]);
  const { previousSet } = useLastSets(movementIds);

  const finish = async () => {
    if (workout.stats.doneCount === 0) { onCancel(); return; }
    setSaving(true);
    setError(null);
    try {
      await onFinish(workout.buildPayload());
    } catch (err) {
      setError(errorMessage(err, 'Could not save this workout'));
      setSaving(false);
    }
  };

  const handlePick = (movement) => {
    if (typeof picker === 'number') workout.swapExercise(picker, movement);
    else workout.addExercise(movement);
    setPicker(null);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 40,
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 250ms ease',
    }}>
      <header style={{
        padding: '18px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.stone, fontWeight: 600 }}>Volume</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {workout.stats.volume.toLocaleString()} kg
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontSize: 12,
            color: C.stone,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {source?.name || 'Quick Workout'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {fmtTime(workout.elapsed)}
          </div>
        </div>
        <button
          type="button"
          onClick={finish}
          disabled={saving}
          style={{
            ...btnGhost,
            fontSize: 13,
            flexShrink: 0,
            background: workout.stats.doneCount > 0 ? C.mossSoft : C.faint,
            color: workout.stats.doneCount > 0 ? C.moss : C.ink,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {workout.stats.doneCount > 0 ? 'Finish' : 'End'}
        </button>
      </header>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {error && <Notice tone="danger">{error}</Notice>}

        {workout.exercises.length === 0 && (
          <EmptyState
            icon="🏋️"
            title="Build your workout"
            message="Add your first movement below."
          />
        )}

        {workout.exercises.map((exercise, index) => (
          <ExerciseSetCard
            key={exercise.uid}
            exercise={exercise}
            previousSet={(rowIndex) => previousSet(
              exercise.movementId,
              rowIndex,
              { weight: exercise.defaultWeight, reps: exercise.defaultReps },
            )}
            onUpdateSet={(rowIndex, patch) => workout.updateRow(index, rowIndex, patch)}
            onToggleSet={(rowIndex) => workout.toggleRow(
              index,
              rowIndex,
              previousSet(exercise.movementId, rowIndex, { weight: exercise.defaultWeight, reps: exercise.defaultReps }),
            )}
            onAddSet={() => workout.addSet(index)}
            onRemoveSet={(rowIndex) => workout.removeSet(index, rowIndex)}
            onSwap={() => setPicker(index)}
            onRemove={() => workout.removeExercise(index)}
            onMoveUp={() => workout.moveExercise(index, -1)}
            onMoveDown={() => workout.moveExercise(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < workout.exercises.length - 1}
          />
        ))}

        <button type="button" onClick={() => setPicker('add')} style={btnDashed}>
          + Add movement
        </button>

        {workout.stats.allDone && (
          <Button onClick={finish} loading={saving} style={{ padding: 18, fontSize: 17, boxShadow: '0 8px 24px rgba(47,125,91,0.3)' }}>
            Finish workout 🎉
          </Button>
        )}
      </div>

      <RestTimer remaining={workout.rest} total={REST_SECONDS} onSkip={workout.skipRest} />

      <ExercisePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onPick={handlePick}
        groups={groups}
        loading={movementsLoading}
        onCreate={createMovement}
        title={typeof picker === 'number' ? 'Swap movement' : 'Add a movement'}
      />
    </div>
  );
}
