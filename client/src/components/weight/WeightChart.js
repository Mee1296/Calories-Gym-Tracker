import { C } from '../../theme/tokens';
import { EmptyState } from '../ui';
import { fmtNum } from '../../lib/format';

const W = 320;
const H = 110;
const PAD = 8;

/** Sparkline of body weight over time. Expects entries oldest-first. */
export default function WeightChart({ entries, subtitle, rangeLabel }) {
  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon="⚖️"
        title="No weigh-ins yet"
        message="Log your weight to start seeing the trend."
      />
    );
  }

  const values = entries.map((e) => e.kg);
  const last = values[values.length - 1];
  const delta = Math.round((last - values[0]) * 10) / 10;

  // A flat line would divide by zero, so keep a minimum span.
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const span = Math.max(0.1, max - min);

  const points = entries.map((entry, i) => {
    const x = PAD + (i / Math.max(1, entries.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (entry.kg - min) / span) * (H - PAD * 2);
    return [x, y];
  });

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const [lastX, lastY] = points[points.length - 1];
  const single = entries.length === 1;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Body weight</div>
          {subtitle && <div style={{ fontSize: 12, color: C.moss, fontWeight: 600, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {fmtNum(last)} <span style={{ fontSize: 13, color: C.stone, fontWeight: 500 }}>kg</span>
          </div>
          {!single && (
            <div style={{ fontSize: 12, color: delta <= 0 ? C.moss : C.stone, fontWeight: 700 }}>
              {delta === 0 ? '—' : `${delta < 0 ? '↓' : '↑'} ${fmtNum(Math.abs(delta))} kg`}
            </div>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} aria-hidden="true">
        {!single && (
          <>
            <path d={`${path} L${lastX},${H} L${points[0][0]},${H} Z`} fill={C.mossSoft} opacity="0.7" />
            <path d={path} fill="none" stroke={C.moss} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        <circle cx={single ? W / 2 : lastX} cy={single ? H / 2 : lastY} r="4.5" fill={C.moss} />
      </svg>

      {!single && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.stone, marginTop: 4 }}>
          <span>{rangeLabel || `${entries.length} entries`}</span>
          <span>today</span>
        </div>
      )}
    </>
  );
}
