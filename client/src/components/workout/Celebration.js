import { C, RADIUS } from '../../theme/tokens';
import { Button, Card } from '../ui';
import { fmtTime, plural } from '../../lib/format';

/** Post-workout summary. `prs` come from the server, which knows the real history. */
export default function Celebration({ summary, prs = [], onClose }) {
  const tiles = [
    [summary.totalSets, 'sets'],
    [`${(summary.volume / 1000).toFixed(1)}t`, 'volume'],
    [fmtTime(summary.duration), 'time'],
  ];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 60,
      background: 'rgba(27,31,28,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      animation: 'fadeIn 250ms ease',
    }}>
      <Card style={{ width: '100%', textAlign: 'center', padding: 32, animation: 'popIn 420ms cubic-bezier(.22,1.4,.36,1)' }}>
        <div style={{ fontSize: 54 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '10px 0 4px' }}>Workout complete</h2>
        <p style={{ fontSize: 14, color: C.stone, margin: '0 0 20px' }}>Great session — see you next time.</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 26, marginBottom: 24 }}>
          {tiles.map(([value, label]) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 12, color: C.stone }}>{label}</div>
            </div>
          ))}
        </div>

        {prs.length > 0 && (
          <div style={{
            background: C.goldSoft,
            borderRadius: RADIUS.md + 2,
            padding: 12,
            fontSize: 14,
            fontWeight: 700,
            color: '#9A7415',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div>🏅 {plural(prs.length, 'new PR')}</div>
            {prs.map((pr) => (
              <div key={pr.movement} style={{ fontWeight: 600 }}>
                {pr.movement} — {pr.weight} kg × {pr.reps}
              </div>
            ))}
          </div>
        )}

        <Button onClick={onClose}>Nice!</Button>
      </Card>
    </div>
  );
}
