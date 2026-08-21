import { C, RADIUS } from '../theme/tokens';
import { screen } from '../theme/styles';
import { Button, Card, EmptyState, Notice, Spinner } from '../components/ui';
import AppLayout from '../components/layout/AppLayout';
import ScreenHeader from '../components/layout/ScreenHeader';
import WeightChart from '../components/weight/WeightChart';
import useSession from '../hooks/useSession';
import useAsync from '../hooks/useAsync';
import useWeights from '../hooks/useWeights';
import { stats as statsApi } from '../lib/endpoints';
import { fmtNum, fmtDate, plural } from '../lib/format';

const WINDOW_DAYS = 28;

/** Every highlight is derived from real history — nothing here is placeholder text. */
const buildHighlights = (stats) => {
  if (!stats) return [];
  const items = [];

  if (stats.weight.delta !== null && stats.weight.entries > 1) {
    const down = stats.weight.delta <= 0;
    items.push({
      icon: '⚖️',
      text: stats.weight.delta === 0
        ? 'Weight holding steady this month'
        : `Weight ${down ? 'down' : 'up'} ${fmtNum(Math.abs(stats.weight.delta))} kg this month`,
    });
  }

  if (stats.latestPR) {
    items.push({
      icon: '🏅',
      text: `Latest PR: ${stats.latestPR.movement} ${stats.latestPR.weight} kg × ${stats.latestPR.reps}`,
      hint: fmtDate(stats.latestPR.date),
    });
  }

  if (stats.workouts.total > 0) {
    items.push({ icon: '✅', text: `${plural(stats.workouts.total, 'workout')} completed` });
  }

  if (stats.workouts.volume > 0) {
    items.push({
      icon: '🏋️',
      text: `${(stats.workouts.volume / 1000).toFixed(1)} t lifted in the last ${WINDOW_DAYS} days`,
    });
  }

  if (stats.nutrition.adherence !== null) {
    items.push({
      icon: '🥗',
      text: `${stats.nutrition.adherence}% of logged days hit your calorie goal`,
      hint: `${plural(stats.nutrition.daysLogged, 'day')} logged`,
    });
  }

  if (stats.workouts.streakWeeks > 0) {
    items.push({ icon: '🔥', text: `${plural(stats.workouts.streakWeeks, 'week')} training streak` });
  }

  return items;
};

export default function ProgressPage() {
  const { ready, user, signOut } = useSession();
  const weight = useWeights(WINDOW_DAYS);
  const { data: stats, loading, error } = useAsync(() => statsApi.overview(WINDOW_DAYS), []);

  if (!ready) return null;

  const highlights = buildHighlights(stats);

  return (
    <AppLayout tab="progress" title="Progress">
      <div style={screen}>
        <ScreenHeader title="Progress" eyebrow={user?.username ? `Signed in as ${user.username}` : undefined} />

        {error && <Notice tone="danger">{error}</Notice>}

        {loading && !stats ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={26} /></div>
        ) : highlights.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="Nothing to show yet"
            message="Log a workout, a meal or a weigh-in and your progress starts building here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {highlights.map((item) => (
              <Card
                key={item.text}
                style={{ padding: '16px 18px', borderRadius: RADIUS.lg, display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{item.text}</div>
                  {item.hint && <div style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>{item.hint}</div>}
                </div>
                <div style={{ color: C.moss, fontWeight: 700, flexShrink: 0 }}>✓</div>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <WeightChart entries={weight.entries} rangeLabel={`${WINDOW_DAYS} days`} />
        </Card>

        <Button variant="ghost" onClick={signOut} style={{ width: '100%', marginTop: 4, padding: 14 }}>
          Sign out
        </Button>
      </div>
    </AppLayout>
  );
}
