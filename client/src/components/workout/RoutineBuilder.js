import { useEffect, useState } from 'react';
import { C, RADIUS } from '../../theme/tokens';
import { btnGhost, stepBtn, textInput } from '../../theme/styles';
import { Button, Notice, Sheet } from '../ui';
import ExercisePicker from './ExercisePicker';
import { GROUP_LABELS } from '../../hooks/useMovements';
import { errorMessage } from '../../lib/api';
import { plural } from '../../lib/format';

const MAX_SETS = 20;

const NUDGE = {
  width: 26,
  height: 19,
  border: 'none',
  borderRadius: 6,
  background: C.card,
  color: C.stone,
  font: 'inherit',
  fontSize: 12,
  lineHeight: 1,
  padding: 0,
};

/**
 * Builds a routine, or edits one in place when `routine` is given.
 *
 * A routine's exercises carry no muscle group, so it is read back from the
 * library by id — that is only used for the caption under each name.
 */
export default function RoutineBuilder({ open, onClose, onSave, library, routine = null }) {
  const { groups, byId, loading, create: createMovement } = library;
  const editing = Boolean(routine);

  const [name, setName] = useState('');
  const [moves, setMoves] = useState([]);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reloads the form whenever the sheet opens on a different routine.
  useEffect(() => {
    if (!open) return;
    setName(routine?.name ?? '');
    setMoves((routine?.exercises ?? []).map((e) => ({
      movementId: e.movementId,
      name: e.name,
      group: byId.get(e.movementId)?.group,
      sets: e.sets,
      weight: e.weight,
      reps: e.reps,
    })));
    setError(null);
  }, [open, routine, byId]);

  const close = () => {
    setPicking(false);
    setError(null);
    onClose();
  };

  const canSave = name.trim().length > 0 && moves.length > 0;

  const bumpSets = (index, delta) => setMoves((list) => list.map((move, i) => (
    i === index ? { ...move, sets: Math.min(MAX_SETS, Math.max(1, move.sets + delta)) } : move
  )));

  /** Swaps a movement with its neighbour. `delta` is -1 for up, +1 for down. */
  const move = (index, delta) => setMoves((list) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        exercises: moves.map((m) => ({
          movementId: m.movementId,
          sets: m.sets,
          weight: m.weight,
          reps: m.reps,
        })),
      });
      close();
    } catch (err) {
      setError(errorMessage(err, 'Could not save that routine'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open} onClose={close} title={editing ? 'Edit routine' : 'New routine'} doneLabel="Cancel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Routine name — e.g. Upper Body A"
            aria-label="Routine name"
            style={textInput}
          />

          {moves.length === 0 ? (
            <Notice>Add the movements for this routine — you can set how many sets each one gets.</Notice>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {moves.map((entry, index) => (
                <div
                  key={`${entry.movementId}-${index}`}
                  style={{
                    background: C.bg,
                    borderRadius: RADIUS.md + 2,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                    <button
                      type="button"
                      aria-label={`Move ${entry.name} earlier`}
                      title="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      style={{ ...NUDGE, opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'default' : 'pointer' }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${entry.name} later`}
                      title="Move down"
                      disabled={index === moves.length - 1}
                      onClick={() => move(index, 1)}
                      style={{
                        ...NUDGE,
                        opacity: index === moves.length - 1 ? 0.3 : 1,
                        cursor: index === moves.length - 1 ? 'default' : 'pointer',
                      }}
                    >
                      ↓
                    </button>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.name}
                    </div>
                    <div style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>
                      {GROUP_LABELS[entry.group] || 'Custom'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      aria-label={`One less set of ${entry.name}`}
                      onClick={() => bumpSets(index, -1)}
                      style={{ ...stepBtn, width: 34, height: 34, borderRadius: 10, fontSize: 18, background: C.card }}
                    >
                      −
                    </button>
                    <div style={{ width: 52, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                      {plural(entry.sets, 'set')}
                    </div>
                    <button
                      type="button"
                      aria-label={`One more set of ${entry.name}`}
                      onClick={() => bumpSets(index, 1)}
                      style={{ ...stepBtn, width: 34, height: 34, borderRadius: 10, fontSize: 18, background: C.card }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.name}`}
                    onClick={() => setMoves(moves.filter((_, i) => i !== index))}
                    style={{ ...btnGhost, background: C.card, padding: '7px 11px', fontSize: 13, color: C.stone, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button variant="dashed" onClick={() => setPicking(true)} style={{ padding: 14, fontSize: 15, borderRadius: 18 }}>
            + Add movement
          </Button>

          {error && <Notice tone="danger">{error}</Notice>}

          <Button onClick={save} disabled={!canSave} loading={saving}>
            {editing ? 'Save changes' : 'Save routine'}
            {moves.length > 0 ? ` · ${plural(moves.length, 'movement')}` : ''}
          </Button>
        </div>
      </Sheet>

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        groups={groups}
        loading={loading}
        onCreate={createMovement}
        title="Add a movement"
        onPick={(movement) => {
          setMoves((list) => [...list, {
            movementId: movement._id,
            name: movement.name,
            group: movement.group,
            sets: 3,
            weight: movement.defaultWeight,
            reps: movement.defaultReps,
          }]);
          setPicking(false);
        }}
      />
    </>
  );
}
