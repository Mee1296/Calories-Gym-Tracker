import { C, FONT, RADIUS } from '../../theme/tokens';

/** Two-or-more tab switcher. `options` is [{ id, label }]. */
export default function SegmentedControl({ options, value, onChange, style }) {
  return (
    <div style={{ display: 'flex', background: C.bg, borderRadius: RADIUS.md, padding: 4, ...style }}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: RADIUS.sm + 1,
              padding: '10px 0',
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: active ? C.card : 'transparent',
              color: active ? C.ink : C.stone,
              boxShadow: active ? '0 1px 4px rgba(27,31,28,0.08)' : 'none',
              transition: 'all 180ms ease',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
