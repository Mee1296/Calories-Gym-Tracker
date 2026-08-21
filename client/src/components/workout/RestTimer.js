import { C, RADIUS } from '../../theme/tokens';
import { Button, Card, Ring } from '../ui';

export default function RestTimer({ remaining, total, onSkip }) {
  if (remaining <= 0) return null;

  return (
    <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
      <Card style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: RADIUS.xl - 4,
        animation: 'slideUp 300ms cubic-bezier(.22,1,.36,1)',
      }}>
        <Ring size={56} stroke={5} pct={remaining / total} color={C.moss}>
          <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{remaining}</span>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Resting</div>
          <div style={{ fontSize: 12, color: C.stone }}>Take a breather — {remaining}s to go</div>
        </div>
        <Button variant="ghost" onClick={onSkip} style={{ width: 'auto', flexShrink: 0 }}>Skip</Button>
      </Card>
    </div>
  );
}
