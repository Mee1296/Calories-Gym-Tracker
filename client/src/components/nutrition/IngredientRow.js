import { C, RADIUS } from '../../theme/tokens';
import { btnGhost, textInput } from '../../theme/styles';
import { MacroField } from '../ui';

const FIELDS = [
  { key: 'calories', label: 'kcal' },
  { key: 'protein', label: 'Protein g', color: C.protein },
  { key: 'carbs', label: 'Carbs g', color: C.carbs },
  { key: 'fat', label: 'Fat g', color: C.fat },
];

export default function IngredientRow({ index, ingredient, onChange, onRemove }) {
  return (
    <div style={{ background: C.bg, borderRadius: RADIUS.md + 2, padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          value={ingredient.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder={`Ingredient ${index + 1} — e.g. 150 g beef`}
          aria-label={`Ingredient ${index + 1} name`}
          style={{ ...textInput, background: C.card, padding: '10px 12px', fontSize: 14 }}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ingredient ${index + 1}`}
          style={{ ...btnGhost, padding: '8px 12px', flexShrink: 0, color: C.stone }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {FIELDS.map((field) => (
          <MacroField
            key={field.key}
            label={field.label}
            color={field.color}
            value={ingredient[field.key]}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
      </div>
    </div>
  );
}
