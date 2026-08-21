import { C } from '../../theme/tokens';

export default function Spinner({ size = 18, color = C.moss, style }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${C.faint}`,
        borderTopColor: color,
        animation: 'spin 700ms linear infinite',
        ...style,
      }}
    />
  );
}
