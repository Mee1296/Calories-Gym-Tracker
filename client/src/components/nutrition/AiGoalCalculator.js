import { useState } from 'react';
import { C } from '../../theme/tokens';
import { textInput } from '../../theme/styles';
import { Button, Notice } from '../ui';
import { nutrition } from '../../lib/endpoints';
import { errorMessage } from '../../lib/api';

const ACTIVITY = ['sedentary', 'lightly active', 'moderately active', 'very active', 'extra active'];
const GOALS = ['lose weight', 'maintain', 'gain muscle'];
const GENDERS = ['male', 'female', 'other'];

const Field = ({ label, children }) => (
  <label style={{ flex: 1, minWidth: 0, display: 'block' }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: C.stone, display: 'block', marginBottom: 4 }}>{label}</span>
    {children}
  </label>
);

const inputStyle = { ...textInput, padding: '10px 12px', fontSize: 14 };

/** Estimates calorie and macro targets from body metrics. */
export default function AiGoalCalculator({ profile, latestWeight, onSuggested }) {
  const [metrics, setMetrics] = useState(() => ({
    weightKg: latestWeight ? String(latestWeight) : '',
    heightCm: profile?.heightCm ? String(profile.heightCm) : '',
    age: profile?.age ? String(profile.age) : '',
    gender: profile?.gender || 'male',
    bodyFat: profile?.bodyFat ? String(profile.bodyFat) : '',
    activityLevel: profile?.activityLevel || 'moderately active',
    goal: profile?.goal || 'maintain',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setMetrics({ ...metrics, [key]: e.target.value });
  const ready = metrics.weightKg && metrics.heightCm && metrics.age;

  const suggest = async () => {
    setLoading(true);
    setError(null);
    try {
      onSuggested(await nutrition.suggestGoals(metrics));
    } catch (err) {
      setError(errorMessage(err, 'Could not calculate goals'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Notice>
        These metrics stay on your account so the calculator remembers them next time.
      </Notice>

      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Weight (kg)">
          <input value={metrics.weightKg} onChange={set('weightKg')} inputMode="decimal" placeholder="78" style={inputStyle} />
        </Field>
        <Field label="Height (cm)">
          <input value={metrics.heightCm} onChange={set('heightCm')} inputMode="decimal" placeholder="178" style={inputStyle} />
        </Field>
        <Field label="Age">
          <input value={metrics.age} onChange={set('age')} inputMode="numeric" placeholder="30" style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Gender">
          <select value={metrics.gender} onChange={set('gender')} style={inputStyle}>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Body fat % (optional)">
          <input value={metrics.bodyFat} onChange={set('bodyFat')} inputMode="decimal" placeholder="18" style={inputStyle} />
        </Field>
      </div>

      <Field label="Activity level">
        <select value={metrics.activityLevel} onChange={set('activityLevel')} style={inputStyle}>
          {ACTIVITY.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>

      <Field label="Goal">
        <select value={metrics.goal} onChange={set('goal')} style={inputStyle}>
          {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Field>

      {error && <Notice tone="danger">{error}</Notice>}

      <Button onClick={suggest} disabled={!ready} loading={loading}>
        {loading ? 'Calculating…' : 'Calculate my goals'}
      </Button>
    </div>
  );
}
