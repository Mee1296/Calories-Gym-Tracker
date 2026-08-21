import { useEffect, useState } from 'react';
import { C } from '../../theme/tokens';
import { Button, MacroField, Notice, SegmentedControl, Sheet } from '../ui';
import AiGoalCalculator from './AiGoalCalculator';
import useAsync from '../../hooks/useAsync';
import { nutrition } from '../../lib/endpoints';
import { errorMessage } from '../../lib/api';
import { caloriesFromMacros } from '../../lib/macros';
import { num } from '../../lib/format';

const FIELDS = [
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein g', color: C.protein },
  { key: 'carbs', label: 'Carbs g', color: C.carbs },
  { key: 'fat', label: 'Fat g', color: C.fat },
];

const MODES = [
  { id: 'manual', label: 'Set by hand' },
  { id: 'ai', label: 'AI calculator' },
];

const toForm = (goals) => Object.fromEntries(FIELDS.map((f) => [f.key, String(goals[f.key] ?? '')]));

export default function GoalsSheet({ open, onClose, goals, profile, latestWeight, onSave }) {
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(() => toForm(goals));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const aiStatus = useAsync(() => nutrition.status(), [], { initial: { enabled: false } });

  useEffect(() => {
    if (open) {
      setForm(toForm(goals));
      setMode('manual');
      setError(null);
    }
  }, [open, goals]);

  const fromMacros = caloriesFromMacros(form);
  const valid = num(form.calories) > 0;
  const drifted = Math.abs(fromMacros - num(form.calories)) > 50;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        calories: Math.round(num(form.calories)),
        protein: Math.round(num(form.protein)),
        carbs: Math.round(num(form.carbs)),
        fat: Math.round(num(form.fat)),
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save your goals'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Daily goals" doneLabel="Cancel">
      {aiStatus.data?.enabled && (
        <SegmentedControl options={MODES} value={mode} onChange={setMode} style={{ marginBottom: 16 }} />
      )}

      {mode === 'ai' ? (
        <AiGoalCalculator
          profile={profile}
          latestWeight={latestWeight}
          onSuggested={(suggestion) => { setForm(toForm(suggestion)); setMode('manual'); }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {FIELDS.map((field) => (
              <MacroField
                key={field.key}
                label={field.label}
                color={field.color}
                value={form[field.key]}
                onChange={(value) => setForm({ ...form, [field.key]: value })}
              />
            ))}
          </div>

          <Notice>
            Your macros add up to <strong style={{ color: C.ink }}>{fromMacros} kcal</strong>.{' '}
            {drifted ? (
              <button
                type="button"
                onClick={() => setForm({ ...form, calories: String(fromMacros) })}
                style={{
                  border: 'none',
                  background: 'none',
                  color: C.moss,
                  fontWeight: 700,
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Use this as your calorie goal →
              </button>
            ) : (
              'Looks consistent with your calorie goal.'
            )}
          </Notice>

          {error && <Notice tone="danger">{error}</Notice>}

          <Button onClick={save} disabled={!valid} loading={saving}>Save goals</Button>
        </div>
      )}
    </Sheet>
  );
}
