import { C, RADIUS } from '../../theme/tokens';
import { btnGhost } from '../../theme/styles';
import { Button, Card } from '../ui';
import SetInput from './SetInput';
import { plural } from '../../lib/format';

const HEADER_CELL = { fontSize: 11, fontWeight: 700, color: C.stone, textAlign: 'center' };

/** One movement inside an active workout: its set rows and controls. */
export default function ExerciseSetCard({
  exercise,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onSwap,
  onRemove,
  previousSet,
}) {
  const doneCount = exercise.rows.filter((r) => r.done).length;
  const complete = exercise.rows.length > 0 && doneCount === exercise.rows.length;

  return (
    <Card style={{
      padding: 18,
      border: complete ? `1.5px solid ${C.moss}` : '1.5px solid transparent',
      transition: 'border-color 300ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{complete ? '✅ ' : ''}{exercise.name}</div>
          <div style={{
            fontSize: 12,
            color: complete ? C.moss : C.stone,
            fontWeight: complete ? 700 : 500,
            marginTop: 2,
          }}>
            {doneCount} of {plural(exercise.rows.length, 'set')} done
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button type="button" onClick={onSwap} title="Swap movement" aria-label={`Swap ${exercise.name}`} style={{ ...btnGhost, padding: '7px 11px', fontSize: 13 }}>↺</button>
          <button type="button" onClick={onRemove} title="Remove movement" aria-label={`Remove ${exercise.name}`} style={{ ...btnGhost, padding: '7px 11px', fontSize: 13, color: C.stone }}>✕</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 2px', marginBottom: 6 }}>
        <div style={{ ...HEADER_CELL, width: 34 }}>SET</div>
        <div style={{ ...HEADER_CELL, flex: 1 }}>KG</div>
        <div style={{ ...HEADER_CELL, flex: 1 }}>REPS</div>
        <div style={{ width: 46 }} />
      </div>
      <div style={{ fontSize: 11, color: C.stone, opacity: 0.75, padding: '0 2px', marginBottom: 6 }}>
        Grey numbers are your last session — log the set to use them, or type your own.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {exercise.rows.map((row, rowIndex) => {
          const previous = previousSet(rowIndex);
          return (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                background: row.done ? C.mossSoft : 'transparent',
                borderRadius: RADIUS.sm + 2,
                padding: 2,
                transition: 'background 250ms ease',
              }}
            >
              <button
                type="button"
                onClick={() => onRemoveSet(rowIndex)}
                title="Remove set"
                aria-label={`Remove set ${rowIndex + 1}`}
                style={{
                  width: 34,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: row.done ? C.moss : C.stone,
                  cursor: 'pointer',
                  font: 'inherit',
                  padding: 0,
                }}
              >
                {rowIndex + 1}
              </button>
              <div style={{ flex: 1 }}>
                <SetInput
                  value={row.weight}
                  placeholder={previous.weight}
                  disabled={row.done}
                  label={`Set ${rowIndex + 1} weight`}
                  onChange={(v) => onUpdateSet(rowIndex, { weight: v })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <SetInput
                  value={row.reps}
                  placeholder={previous.reps}
                  disabled={row.done}
                  label={`Set ${rowIndex + 1} reps`}
                  onChange={(v) => onUpdateSet(rowIndex, { reps: v })}
                />
              </div>
              <button
                type="button"
                onClick={() => onToggleSet(rowIndex)}
                aria-label={row.done ? `Undo set ${rowIndex + 1}` : `Log set ${rowIndex + 1}`}
                aria-pressed={row.done}
                style={{
                  width: 46,
                  height: 40,
                  borderRadius: RADIUS.sm + 2,
                  border: 'none',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 16,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: row.done ? C.moss : C.faint,
                  color: row.done ? '#fff' : C.stone,
                  transition: 'all 200ms ease',
                }}
              >
                ✓
              </button>
            </div>
          );
        })}
      </div>

      <Button variant="ghost" onClick={onAddSet} style={{ width: '100%', marginTop: 10, fontSize: 13, background: C.bg }}>
        + Add set
      </Button>
    </Card>
  );
}
