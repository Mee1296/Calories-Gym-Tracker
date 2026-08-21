import { C } from '../../theme/tokens';
import { textInput } from '../../theme/styles';
import { Button, MacroField, Notice } from '../ui';
import IngredientRow from './IngredientRow';
import { caloriesFromMacros, emptyIngredient, macroLine, resolveDraft } from '../../lib/macros';
import { num, plural } from '../../lib/format';

const TOTAL_FIELDS = [
  { key: 'calories', label: 'kcal', placeholder: 'auto' },
  { key: 'protein', label: 'Protein g', color: C.protein },
  { key: 'carbs', label: 'Carbs g', color: C.carbs },
  { key: 'fat', label: 'Fat g', color: C.fat },
];

/** Name + optional ingredient breakdown + totals. Used for custom and AI-reviewed meals. */
export default function MealDraftForm({ draft, onChange, onSubmit, saving, submitLabel = 'Log meal' }) {
  const final = resolveDraft(draft);
  const canSave = draft.name.trim().length > 0 && final.calories > 0;

  const setIngredient = (index, key, value) => onChange({
    ...draft,
    ingredients: draft.ingredients.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
  });

  const macroTotal = num(draft.totals.protein) + num(draft.totals.carbs) + num(draft.totals.fat);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        placeholder="Meal name — e.g. Beef stir-fry"
        aria-label="Meal name"
        style={textInput}
      />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            Ingredients <span style={{ color: C.stone, fontWeight: 500 }}>(optional)</span>
          </div>
          <Button
            variant="soft"
            onClick={() => onChange({ ...draft, ingredients: [...draft.ingredients, emptyIngredient()] })}
            style={{ width: 'auto' }}
          >
            + Add
          </Button>
        </div>

        {draft.ingredients.length === 0 ? (
          <Notice>Add ingredients to build the meal, or just enter the totals below.</Notice>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {draft.ingredients.map((ingredient, index) => (
              <IngredientRow
                key={index}
                index={index}
                ingredient={ingredient}
                onChange={(key, value) => setIngredient(index, key, value)}
                onRemove={() => onChange({
                  ...draft,
                  ingredients: draft.ingredients.filter((_, i) => i !== index),
                })}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Totals</div>
        {final.fromIngredients ? (
          <Notice tone="moss" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600 }}>From {plural(draft.ingredients.length, 'ingredient')}</span>
            <span style={{ fontWeight: 700, color: C.ink }}>
              {final.calories} kcal · {macroLine(final)}
            </span>
          </Notice>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {TOTAL_FIELDS.map((field) => (
                <MacroField
                  key={field.key}
                  label={field.label}
                  color={field.color}
                  placeholder={field.placeholder}
                  value={draft.totals[field.key]}
                  onChange={(value) => onChange({ ...draft, totals: { ...draft.totals, [field.key]: value } })}
                />
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.stone, marginTop: 6 }}>
              Leave kcal empty and it&apos;s calculated from your macros
              {draft.totals.calories === '' && macroTotal > 0
                ? ` — currently ${caloriesFromMacros(draft.totals)} kcal`
                : ''}.
            </div>
          </>
        )}
      </div>

      <Button onClick={() => onSubmit(final)} disabled={!canSave} loading={saving}>
        {submitLabel}{canSave ? ` · ${final.calories} kcal` : ''}
      </Button>
    </div>
  );
}
