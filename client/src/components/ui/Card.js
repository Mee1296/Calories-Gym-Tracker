import { C, RADIUS, SHADOW } from '../../theme/tokens';

export default function Card({ children, style, onClick, as }) {
  const Tag = as || (onClick ? 'button' : 'div');
  const interactive = Boolean(onClick);

  return (
    <Tag
      onClick={onClick}
      type={Tag === 'button' ? 'button' : undefined}
      style={{
        background: C.card,
        borderRadius: RADIUS.xl,
        padding: 20,
        boxShadow: SHADOW.card,
        border: 'none',
        textAlign: 'left',
        width: '100%',
        font: 'inherit',
        color: 'inherit',
        display: 'block',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
