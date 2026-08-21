import { useEffect, useState } from 'react';
import { Notice, SegmentedControl, Sheet } from '../ui';
import QuickAddList from './QuickAddList';
import MealDraftForm from './MealDraftForm';
import AiMealEstimator from './AiMealEstimator';
import LoggedMeals from './LoggedMeals';
import useAsync from '../../hooks/useAsync';
import { meals as mealsApi, nutrition } from '../../lib/endpoints';
import { errorMessage } from '../../lib/api';
import { draftFromMeal, emptyDraft } from '../../lib/macros';

const MODES = [
  { id: 'quick', label: 'Quick add' },
  { id: 'custom', label: 'Custom' },
  { id: 'ai', label: 'AI' },
];

/** Logging surface: reuse a saved dish, build one by hand, or let AI estimate it. */
export default function MealSheet({ open, onClose, meals, onLog, onDelete }) {
  const [mode, setMode] = useState('quick');
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const dishes = useAsync(() => mealsApi.dishes({ limit: 20 }), [open], { initial: [], enabled: open });
  const aiStatus = useAsync(() => nutrition.status(), [], { initial: { enabled: false } });

  useEffect(() => {
    if (!open) {
      setMode('quick');
      setDraft(emptyDraft());
      setError(null);
    }
  }, [open]);

  const submit = async (meal, source) => {
    setSaving(true);
    setError(null);
    try {
      await onLog({ ...meal, name: meal.name ?? draft.name.trim(), source });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not log that meal'));
    } finally {
      setSaving(false);
    }
  };

  const openInEditor = (meal) => {
    setDraft(draftFromMeal(meal));
    setMode('custom');
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      setError(errorMessage(err, 'Could not remove that meal'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Meals" doneLabel="Close">
      <SegmentedControl options={MODES} value={mode} onChange={setMode} style={{ marginBottom: 16 }} />

      {error && <Notice tone="danger" style={{ marginBottom: 12 }}>{error}</Notice>}

      {mode === 'quick' && (
        <QuickAddList
          dishes={dishes.data ?? []}
          loading={dishes.loading}
          onQuickLog={(dish) => submit(
            {
              name: dish.name,
              calories: dish.calories,
              protein: dish.protein,
              carbs: dish.carbs,
              fat: dish.fat,
            },
            'quick',
          )}
          onEdit={openInEditor}
        />
      )}

      {mode === 'custom' && (
        <MealDraftForm
          draft={draft}
          onChange={setDraft}
          onSubmit={(final) => submit({ ...final, name: draft.name.trim() }, 'manual')}
          saving={saving}
        />
      )}

      {mode === 'ai' && (
        <AiMealEstimator
          enabled={aiStatus.data?.enabled}
          onEstimated={(next) => { setDraft(next); setMode('custom'); }}
        />
      )}

      <LoggedMeals meals={meals} onDelete={remove} busyId={deletingId} />
    </Sheet>
  );
}
