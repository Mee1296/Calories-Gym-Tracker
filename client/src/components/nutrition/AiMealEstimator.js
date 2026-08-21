import { useState } from 'react';
import { C } from '../../theme/tokens';
import { textInput } from '../../theme/styles';
import { Button, Notice } from '../ui';
import { nutrition } from '../../lib/endpoints';
import { errorMessage } from '../../lib/api';
import { draftFromMeal } from '../../lib/macros';

/** Describe a meal in plain language; the estimate opens in the editor for review. */
export default function AiMealEstimator({ enabled, onEstimated }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!enabled) {
    return <Notice>AI estimates aren&apos;t configured on this server. Use Quick add or Custom instead.</Notice>;
  }

  const estimate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await nutrition.estimate(description.trim());
      onEstimated(draftFromMeal(result));
      setDescription('');
    } catch (err) {
      setError(errorMessage(err, 'Could not estimate that meal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Notice>
        Describe what you ate and Stride estimates the macros — you review the numbers before anything is logged.
      </Notice>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. two chicken thighs with rice and a side salad"
        rows={3}
        aria-label="Meal description"
        style={{ ...textInput, resize: 'vertical', lineHeight: 1.45 }}
      />
      {error && <Notice tone="danger">{error}</Notice>}
      <Button onClick={estimate} disabled={!description.trim()} loading={loading}>
        {loading ? 'Estimating…' : 'Estimate macros'}
      </Button>
      <div style={{ fontSize: 12, color: C.stone, textAlign: 'center' }}>
        Estimates are approximate — adjust anything that looks off.
      </div>
    </div>
  );
}
