import { useState } from 'react';
import { C } from '../theme/tokens';
import { screen } from '../theme/styles';
import { Button, Card, Notice, Spinner } from '../components/ui';
import AppLayout from '../components/layout/AppLayout';
import ScreenHeader from '../components/layout/ScreenHeader';
import MacroSummary from '../components/nutrition/MacroSummary';
import MealSheet from '../components/nutrition/MealSheet';
import GoalsSheet from '../components/nutrition/GoalsSheet';
import WeightChart from '../components/weight/WeightChart';
import WeightSheet from '../components/weight/WeightSheet';
import useSession from '../hooks/useSession';
import useToday from '../hooks/useToday';
import useWeights from '../hooks/useWeights';
import { greeting } from '../lib/format';

export default function TodayPage() {
  const { user, ready } = useSession();
  const today = useToday();
  const weight = useWeights(30);
  const [sheet, setSheet] = useState(null); // 'meal' | 'goals' | 'weight'

  if (!ready) return null;

  const close = () => setSheet(null);

  return (
    <AppLayout
      tab="today"
      title="Today"
      sheets={(
        <>
          <MealSheet
            open={sheet === 'meal'}
            onClose={close}
            meals={today.meals}
            onLog={today.logMeal}
            onUpdate={today.updateMeal}
            onDelete={today.removeMeal}
          />
          <GoalsSheet
            open={sheet === 'goals'}
            onClose={close}
            goals={today.goals}
            profile={user?.profile}
            latestWeight={weight.latest}
            onSave={today.saveGoals}
          />
          <WeightSheet
            open={sheet === 'weight'}
            onClose={close}
            latest={weight.latest}
            onSave={weight.logWeight}
          />
        </>
      )}
    >
      <div style={screen}>
        <ScreenHeader eyebrow={greeting()} title="Today" />

        {today.error && <Notice tone="danger">{today.error}</Notice>}

        {today.loading && today.meals.length === 0 ? (
          <Card style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size={26} />
          </Card>
        ) : (
          <MacroSummary
            totals={today.totals}
            goals={today.goals}
            onLogMeal={() => setSheet('meal')}
            onEditGoals={() => setSheet('goals')}
          />
        )}

        <Card>
          <WeightChart entries={weight.entries} rangeLabel="30 days" />
          <Button
            variant="soft"
            onClick={() => setSheet('weight')}
            style={{ width: '100%', marginTop: 14, padding: 16, fontSize: 15, borderRadius: 18 }}
          >
            Log today&apos;s weight
          </Button>
        </Card>

        {today.meals.length === 0 && !today.loading && (
          <p style={{ textAlign: 'center', fontSize: 13, color: C.stone, margin: '2px 0 0' }}>
            Nothing logged yet today. 🌱
          </p>
        )}
      </div>
    </AppLayout>
  );
}
