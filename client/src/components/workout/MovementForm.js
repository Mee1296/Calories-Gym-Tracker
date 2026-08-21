import { useState } from 'react';
import { C, FONT, RADIUS } from '../../theme/tokens';
import { btnGhost, sectionLabel, textInput } from '../../theme/styles';
import { Button, Notice, NumberInput } from '../ui';
import { GROUP_LABELS } from '../../hooks/useMovements';
import { errorMessage } from '../../lib/api';

const GROUPS = Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label }));

const chip = (active) => ({
  border: `1.5px solid ${active ? C.moss : C.faint}`,
  background: active ? C.mossSoft : 'transparent',
  color: active ? C.moss : C.stone,
  borderRadius: RADIUS.md,
  padding: '9px 14px',
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 160ms ease',
});

/**
 * Creates or edits a movement. Pass `movement` to edit; `onSubmit` receives the
 * draft and the saved movement is handed back through `onSaved`.
 */
export default function MovementForm({
  movement = null,
  initialName = '',
  onSubmit,
  onSaved,
  onCancel,
  submitLabel,
}) {
  const [name, setName] = useState(movement?.name ?? initialName);
  const [group, setGroup] = useState(movement?.group ?? 'chest');
  const [weight, setWeight] = useState(movement?.defaultWeight ?? 0);
  const [reps, setReps] = useState(movement?.defaultReps ?? 10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await onSubmit({
        name: name.trim(),
        group,
        defaultWeight: weight === '' ? 0 : weight,
        defaultReps: reps === '' ? 10 : reps,
      });
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err, 'Could not save this movement'));
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bulgarian Split Squat"
          aria-label="Movement name"
          autoFocus
          style={textInput}
        />
      </div>

      <div>
        <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>Muscle group</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GROUPS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setGroup(option.id)}
              aria-pressed={group === option.id}
              style={chip(group === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>Starting numbers</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <NumberInput
            value={weight}
            onCommit={setWeight}
            allowEmpty
            placeholder="0"
            ariaLabel="Default weight in kilograms"
            style={{ ...textInput, textAlign: 'center' }}
          />
          <NumberInput
            value={reps}
            onCommit={setReps}
            allowEmpty
            placeholder="10"
            inputMode="numeric"
            ariaLabel="Default reps"
            style={{ ...textInput, textAlign: 'center' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: C.stone }}>kg</div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: C.stone }}>reps</div>
        </div>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancel</button>
        <Button
          onClick={submit}
          disabled={name.trim().length === 0}
          loading={saving}
          style={{ flex: 1 }}
        >
          {submitLabel ?? (movement ? 'Save changes' : 'Save movement')}
        </Button>
      </div>
    </div>
  );
}
