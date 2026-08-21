import { useEffect, useState } from 'react';
import { fmtNum } from '../../lib/format';

/**
 * A text field that behaves like a number field: keeps the raw string while
 * typing and only commits a parsed value on blur, so partial input
 * ("1.", "") is never clobbered mid-keystroke.
 * Committing an empty string yields `''` when `allowEmpty`, else the last value.
 */
export default function NumberInput({
  value,
  onCommit,
  allowEmpty = false,
  placeholder,
  disabled,
  style,
  inputMode = 'decimal',
  ariaLabel,
}) {
  const toText = (v) => (v === '' || v === null || v === undefined ? '' : fmtNum(v));
  const [text, setText] = useState(() => toText(value));

  useEffect(() => { setText(toText(value)); }, [value]);

  const commit = () => {
    if (text.trim() === '') {
      if (allowEmpty) onCommit('');
      else setText(toText(value));
      return;
    }
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 0) onCommit(Math.round(parsed * 10) / 10);
    else setText(toText(value));
  };

  return (
    <input
      value={text}
      aria-label={ariaLabel}
      placeholder={placeholder === undefined || placeholder === null ? '' : fmtNum(placeholder)}
      inputMode={inputMode}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
      onFocus={(e) => e.target.select()}
      style={style}
    />
  );
}
