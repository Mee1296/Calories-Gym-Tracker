import { C, FONT, RADIUS } from './tokens';

export const btnPrimary = {
  border: 'none',
  background: C.moss,
  color: '#fff',
  fontFamily: FONT,
  fontSize: 17,
  fontWeight: 600,
  padding: 16,
  borderRadius: RADIUS.lg,
  cursor: 'pointer',
  width: '100%',
  transition: 'transform 120ms ease, opacity 150ms ease',
};

export const btnGhost = {
  border: 'none',
  background: C.faint,
  color: C.ink,
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: RADIUS.pill,
  cursor: 'pointer',
};

export const btnSoft = { ...btnGhost, background: C.mossSoft, color: C.moss, fontSize: 13 };

export const btnDashed = {
  border: `2px dashed ${C.faint}`,
  background: 'transparent',
  borderRadius: RADIUS.xl,
  padding: 18,
  fontFamily: FONT,
  fontSize: 15,
  fontWeight: 700,
  color: C.moss,
  cursor: 'pointer',
  width: '100%',
};

export const textInput = {
  width: '100%',
  border: `1.5px solid ${C.faint}`,
  borderRadius: RADIUS.md,
  padding: '13px 14px',
  fontSize: 15,
  fontFamily: FONT,
  color: C.ink,
  background: C.bg,
  outline: 'none',
};

export const stepBtn = {
  width: 48,
  height: 48,
  borderRadius: 16,
  border: 'none',
  background: C.faint,
  fontSize: 24,
  fontWeight: 600,
  color: C.ink,
  cursor: 'pointer',
  fontFamily: FONT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export const screen = {
  padding: '24px 20px 110px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

export const pageTitle = { fontSize: 28, fontWeight: 700, margin: 0 };

export const sectionLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: C.stone,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

/** Applies a disabled look without changing the caller's other styles. */
export const disabledStyle = (enabled) => ({
  opacity: enabled ? 1 : 0.4,
  cursor: enabled ? 'pointer' : 'default',
});
