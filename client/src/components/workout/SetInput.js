import { C, FONT } from '../../theme/tokens';
import { NumberInput } from '../ui';

/** Compact weight/reps cell. Empty shows last session's number in grey. */
export default function SetInput({ value, placeholder, onChange, disabled, label }) {
  return (
    <NumberInput
      value={value}
      onCommit={onChange}
      allowEmpty
      placeholder={placeholder}
      disabled={disabled}
      ariaLabel={label}
      style={{
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 700,
        border: 'none',
        borderRadius: 10,
        padding: '10px 2px',
        fontFamily: FONT,
        color: disabled ? C.stone : C.ink,
        background: disabled ? 'transparent' : C.bg,
        outline: 'none',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}
