import { C, RADIUS } from '../../theme/tokens';
import { Card } from '../ui';
import { fmtDate, fmtTime, plural } from '../../lib/format';

export default function WorkoutHistoryList({ workouts }) {
  if (workouts.length === 0) return null;

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 700, margin: '6px 4px -6px' }}>Recent</div>
      {workouts.map((workout) => (
        <Card
          key={workout._id}
          style={{
            padding: '14px 18px',
            borderRadius: RADIUS.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{workout.name}</div>
            <div style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>
              {fmtDate(workout.startedAt)} · {plural(workout.totalSets, 'set')} · {workout.volume.toLocaleString()} kg · {fmtTime(workout.duration)}
            </div>
          </div>
          <div style={{ fontSize: 20, flexShrink: 0 }}>✅</div>
        </Card>
      ))}
    </>
  );
}
