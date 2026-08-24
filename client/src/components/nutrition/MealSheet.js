import { useEffect, useState } from 'react';
import { C } from '../../theme/tokens';
import { btnGhost } from '../../theme/styles';
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

/**
 * Logging surface: reuse a saved dish, build one by hand, or let AI estimate it.
 *
 * Today's meals sit at the top — checking what you already ate is the more
 * common reason to open this than logging something new. Picking one to edit
 * takes over the whole sheet, since the log-a-new-meal modes don't apply then.
 */
export default function MealSheet({ open, onClose, meals, onLog, onUpdate, onDelete }) {
  const [mode, setMode] = useState('quick');
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(null); // the logged meal being edited
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const dishes = useAsync(() => mealsApi.dishes({ limit: 20 }), [open], { initial: [], enabled: open });
  const aiStatus = useAsync(() => nutrition.status(), [], { initial: { enabled: false } });

  useEffect(() => {
    if (!open) {
      setMode('quick');
      setDraft(emptyDraft());
      setEditing(null);
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

  /** Reuses a saved dish as the starting point for a new meal. */
  const openInEditor = (dish) => {
    setDraft(draftFromMeal(dish));
    setMode('custom');
  };

  const startEditing = (meal) => {
    setEditing(meal);
    setDraft(draftFromMeal(meal));
    setError(null);
  };

  const cancelEditing = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setError(null);
  };

  const saveEdit = async (final) => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(editing._id, { ...final, name: draft.name.trim() });
      // The server corrects the remembered dish too, so quick-add is stale now.
      await dishes.reload();
      cancelEditing();
    } catch (err) {
      setError(errorMessage(err, 'Could not save that meal'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      if (editing?._id === id) cancelEditing();
    } catch (err) {
      setError(errorMessage(err, 'Could not remove that meal'));
    } finally {
      setDeletingId(null);
    }
  };

  if (editing) {
    return (
      <Sheet open={open} onClose={onClose} title="Edit meal" doneLabel="Close">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: C.stone, minWidth: 0 }}>
            Editing what you logged as <strong style={{ color: C.ink }}>{editing.name}</strong>
          </div>
          <button type="button" onClick={cancelEditing} style={{ ...btnGhost, fontSize: 13, flexShrink: 0 }}>
            Cancel
          </button>
        </div>

        {error && <Notice tone="danger" style={{ marginBottom: 12 }}>{error}</Notice>}

        <MealDraftForm
          draft={draft}
          onChange={setDraft}
          onSubmit={saveEdit}
          saving={saving}
          submitLabel="Save changes"
        />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Meals" doneLabel="Close">
      <LoggedMeals meals={meals} onEdit={startEditing} onDelete={remove} busyId={deletingId} />

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
    </Sheet>
  );
}
