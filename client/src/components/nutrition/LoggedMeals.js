import { C, RADIUS } from '../../theme/tokens';
import { btnGhost } from '../../theme/styles';
import { macroLine } from '../../lib/macros';

export default function LoggedMeals({ meals, onDelete, busyId }) {
  if (meals.length === 0) return null;

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Logged today</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {meals.map((meal) => (
          <div key={meal._id} style={{ background: C.bg, borderRadius: RADIUS.md, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{meal.name}</div>
                <div style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>
                  {meal.calories} kcal · {macroLine(meal)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(meal._id)}
                disabled={busyId === meal._id}
                style={{
                  ...btnGhost,
                  background: C.card,
                  padding: '6px 12px',
                  fontSize: 13,
                  color: C.stone,
                  flexShrink: 0,
                  opacity: busyId === meal._id ? 0.5 : 1,
                }}
              >
                Remove
              </button>
            </div>
            {meal.ingredients?.length > 0 && (
              <div style={{ fontSize: 12, color: C.stone, marginTop: 6 }}>
                {meal.ingredients.map((i) => i.name || i).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
