import { C } from '../../theme/tokens';

export default function MacroBar({ label, value, goal, color }) {
  const pct = Math.min(1, value / Math.max(1, goal));

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{label}</span>
        <span style={{ fontSize: 12, color: C.stone, whiteSpace: 'nowrap' }}>
          {Math.round(value)}<span style={{ opacity: 0.7 }}>/{goal}g</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: C.faint, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: 99,
          background: color,
          transition: 'width 700ms cubic-bezier(.22,1,.36,1)',
        }} />
      </div>
    </div>
  );
}
