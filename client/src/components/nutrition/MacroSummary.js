import { C, MACROS } from '../../theme/tokens';
import { btnGhost } from '../../theme/styles';
import { Button, Card, MacroBar, Ring } from '../ui';
import { fmtKcal } from '../../lib/format';

/** The calorie ring plus the three macro bars. */
export default function MacroSummary({ totals, goals, onLogMeal, onEditGoals }) {
  const remaining = Math.max(0, goals.calories - totals.calories);
  const over = totals.calories - goals.calories;

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
        <button type="button" onClick={onEditGoals} style={{ ...btnGhost, fontSize: 12, padding: '6px 12px', color: C.stone }}>
          Edit goals
        </button>
      </div>

      <Ring
        size={190}
        stroke={14}
        pct={totals.calories / Math.max(1, goals.calories)}
        color={over > 0 ? C.carbs : C.moss}
      >
        <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
          {over > 0 ? fmtKcal(over) : fmtKcal(remaining)}
        </div>
        <div style={{ fontSize: 13, color: C.stone, fontWeight: 500, marginTop: 4 }}>
          {over > 0 ? 'kcal over' : 'kcal remaining'}
        </div>
        <div style={{ fontSize: 11, color: C.stone, marginTop: 2, opacity: 0.8 }}>
          of {fmtKcal(goals.calories)}
        </div>
      </Ring>

      <div style={{ display: 'flex', gap: 18, width: '100%', marginTop: 22 }}>
        {MACROS.map((macro) => (
          <MacroBar
            key={macro.key}
            label={macro.label}
            value={totals[macro.key]}
            goal={goals[macro.key]}
            color={macro.color}
          />
        ))}
      </div>

      <Button onClick={onLogMeal} style={{ marginTop: 20 }}>Log a meal</Button>
    </Card>
  );
}
