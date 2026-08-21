import { C, FONT } from '../../theme/tokens';
import { stepBtn } from '../../theme/styles';
import NumberInput from './NumberInput';

/** Big +/- control with a typable value, used for body weight. */
export default function Stepper({ label, value, onChange, step = 1, unit, big = true }) {
  const bump = (delta) => onChange(Math.max(0, Math.round((value + delta) * 10) / 10));

  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: C.stone,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-step)} style={stepBtn}>−</button>
        <div>
          <NumberInput
            value={value}
            onCommit={onChange}
            ariaLabel={label}
            style={{
              width: big ? 92 : 70,
              textAlign: 'center',
              fontSize: big ? 32 : 24,
              fontWeight: 700,
              border: 'none',
              borderBottom: `2px solid ${C.faint}`,
              background: 'transparent',
              fontFamily: FONT,
              color: C.ink,
              outline: 'none',
              padding: '0 0 2px',
            }}
          />
          {unit && <div style={{ fontSize: 12, color: C.stone, marginTop: 4 }}>{unit}</div>}
        </div>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(step)} style={stepBtn}>+</button>
      </div>
      <div style={{ fontSize: 11, color: C.stone, marginTop: 6, opacity: 0.8 }}>tap the number to type</div>
    </div>
  );
}
