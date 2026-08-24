import { C } from '../../theme/tokens';
import { btnGhost } from '../../theme/styles';
import { Card } from '../ui';
import { plural } from '../../lib/format';

/** Stops a control inside the card from also starting the routine. */
const intercept = (fn) => ({
  onClick: (e) => { e.stopPropagation(); fn(); },
  onKeyDown: (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); }
  },
});

export default function RoutineCard({ routine, onStart, onEdit, onDelete }) {
  return (
    <Card onClick={onStart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{routine.name}</div>
        <div style={{ fontSize: 13, color: C.stone, marginTop: 2 }}>
          {routine.note} · {plural(routine.exercises.length, 'exercise')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          role="button"
          tabIndex={0}
          title="Edit routine"
          aria-label={`Edit ${routine.name}`}
          {...intercept(onEdit)}
          style={{ ...btnGhost, padding: '8px 12px', fontSize: 13, color: C.stone, display: 'inline-block' }}
        >
          Edit
        </span>
        <span
          role="button"
          tabIndex={0}
          title="Delete routine"
          aria-label={`Delete ${routine.name}`}
          {...intercept(onDelete)}
          style={{ ...btnGhost, padding: '8px 12px', fontSize: 13, color: C.stone, display: 'inline-block' }}
        >
          ✕
        </span>
        <span style={{
          width: 42,
          height: 42,
          borderRadius: 99,
          background: C.mossSoft,
          color: C.moss,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
        }}>
          ›
        </span>
      </div>
    </Card>
  );
}
