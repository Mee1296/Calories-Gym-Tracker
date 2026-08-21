import { C, FONT, RADIUS } from '../../theme/tokens';

/** Small labelled macro input. Stays a controlled string so "" means "unset". */
export default function MacroField({ label, value, onChange, color, placeholder }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: color || C.stone, marginBottom: 4, textAlign: 'center' }}>
        {label}
      </div>
      <input
        value={value}
        aria-label={label}
        inputMode="decimal"
        placeholder={placeholder || '0'}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        style={{
          width: '100%',
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 600,
          border: `1.5px solid ${C.faint}`,
          borderRadius: RADIUS.sm + 2,
          padding: '10px 4px',
          fontFamily: FONT,
          color: C.ink,
          background: C.bg,
          outline: 'none',
        }}
      />
    </div>
  );
}
