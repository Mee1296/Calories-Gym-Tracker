import { C, RADIUS } from '../../theme/tokens';

const TONES = {
  neutral: { background: C.bg, color: C.stone },
  moss: { background: C.mossSoft, color: C.moss },
  gold: { background: C.goldSoft, color: '#9A7415' },
  danger: { background: '#FBECEA', color: C.danger },
};

/** Inline hint / empty state / error strip. */
export default function Notice({ tone = 'neutral', children, style }) {
  return (
    <div style={{
      ...TONES[tone],
      borderRadius: RADIUS.md,
      padding: '12px 14px',
      fontSize: 13,
      lineHeight: 1.45,
      ...style,
    }}>
      {children}
    </div>
  );
}
