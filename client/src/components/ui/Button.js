import { btnPrimary, btnGhost, btnSoft, btnDashed, disabledStyle } from '../../theme/styles';
import Spinner from './Spinner';

const VARIANTS = { primary: btnPrimary, ghost: btnGhost, soft: btnSoft, dashed: btnDashed };

export default function Button({
  variant = 'primary',
  children,
  onClick,
  disabled,
  loading,
  type = 'button',
  style,
  ...rest
}) {
  const blocked = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={blocked}
      style={{
        ...VARIANTS[variant],
        ...disabledStyle(!blocked),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      {...rest}
    >
      {loading && <Spinner size={16} color={variant === 'primary' ? '#fff' : undefined} />}
      {children}
    </button>
  );
}
