import { C, RADIUS } from '../../theme/tokens';
import { EmptyState, Notice, Spinner } from '../ui';
import { macroLine } from '../../lib/macros';

/**
 * The user's own food library, newest-used first.
 * Tapping logs it straight away; the pencil opens it in the editor first.
 */
export default function QuickAddList({ dishes, loading, onQuickLog, onEdit }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <Spinner />
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <EmptyState
        icon="🥣"
        title="No saved meals yet"
        message="Log a meal once and it shows up here for one-tap re-adding."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Notice>Tap to log again, or use ✎ to adjust the amounts first.</Notice>
      {dishes.map((dish) => (
        <div
          key={dish._id}
          style={{
            background: C.bg,
            borderRadius: RADIUS.md + 2,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            paddingRight: 8,
          }}
        >
          <button
            type="button"
            onClick={() => onQuickLog(dish)}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              padding: '14px 4px 14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              font: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {dish.name}
              </div>
              <div style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>{macroLine(dish)}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.moss, flexShrink: 0 }}>
              {dish.calories} kcal
            </div>
          </button>
          <button
            type="button"
            onClick={() => onEdit(dish)}
            aria-label={`Edit ${dish.name} before logging`}
            style={{
              border: 'none',
              background: 'transparent',
              color: C.stone,
              cursor: 'pointer',
              padding: 8,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✎
          </button>
        </div>
      ))}
    </div>
  );
}
