import { useState } from 'react';
import { screen, btnGhost } from '../theme/styles';
import { Button, EmptyState, Notice, Spinner } from '../components/ui';
import AppLayout from '../components/layout/AppLayout';
import ScreenHeader from '../components/layout/ScreenHeader';
import RoutineCard from '../components/workout/RoutineCard';
import RoutineBuilder from '../components/workout/RoutineBuilder';
import ActiveWorkout from '../components/workout/ActiveWorkout';
import Celebration from '../components/workout/Celebration';
import WorkoutHistoryList from '../components/workout/WorkoutHistoryList';
import MovementLibrary from '../components/workout/MovementLibrary';
import useSession from '../hooks/useSession';
import useRoutines from '../hooks/useRoutines';
import useWorkouts from '../hooks/useWorkouts';
import useMovements from '../hooks/useMovements';

export default function WorkoutPage() {
  const { ready } = useSession();
  const { routines, loading, error, reload: reloadRoutines, createRoutine, removeRoutine } = useRoutines();
  const { history, finishWorkout } = useWorkouts(3);
  const library = useMovements();

  const [active, setActive] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [movementOpen, setMovementOpen] = useState(false);

  if (!ready) return null;

  const finish = async (payload) => {
    const { workout, prs } = await finishWorkout(payload);
    setActive(null);
    setCelebration({ summary: workout, prs });
  };

  const remove = async (routine) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete “${routine.name}”?`)) return;
    await removeRoutine(routine._id);
  };

  return (
    <AppLayout
      tab="workout"
      title="Workout"
      sheets={(
        <>
          <RoutineBuilder
            open={builderOpen}
            onClose={() => setBuilderOpen(false)}
            onSave={createRoutine}
            library={library}
          />
          <MovementLibrary
            open={movementOpen}
            onClose={() => setMovementOpen(false)}
            groups={library.groups}
            loading={library.loading}
            onCreate={library.create}
            onUpdate={library.update}
            // Deleting can drop the movement from routines, so refresh those too.
            onRemove={async (id) => { await library.remove(id); await reloadRoutines(); }}
          />
        </>
      )}
      overlay={(
        <>
          {active && (
            <ActiveWorkout
              source={active.routine}
              onFinish={finish}
              onCancel={() => setActive(null)}
              library={library}
            />
          )}
          {celebration && (
            <Celebration
              summary={celebration.summary}
              prs={celebration.prs}
              onClose={() => setCelebration(null)}
            />
          )}
        </>
      )}
    >
      <div style={screen}>
        <ScreenHeader title="Workout" />

        <Button
          onClick={() => setActive({ routine: null })}
          style={{ padding: 20, fontSize: 18, borderRadius: 24, boxShadow: '0 8px 24px rgba(47,125,91,0.25)' }}
        >
          ⚡ Quick start — pick your movements
        </Button>

        <button
          type="button"
          onClick={() => setMovementOpen(true)}
          style={{ ...btnGhost, alignSelf: 'center', marginTop: -4 }}
        >
          Manage movements
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 4px -6px' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Your routines</div>
          <Button variant="soft" onClick={() => setBuilderOpen(true)} style={{ width: 'auto' }}>
            + New routine
          </Button>
        </div>

        {error && <Notice tone="danger">{error}</Notice>}

        {loading && routines.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : routines.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No routines yet"
            message="Build one to start a session with your movements already lined up."
          />
        ) : (
          routines.map((routine) => (
            <RoutineCard
              key={routine._id}
              routine={routine}
              onStart={() => setActive({ routine })}
              onDelete={() => remove(routine)}
            />
          ))
        )}

        <WorkoutHistoryList workouts={history} />
      </div>
    </AppLayout>
  );
}
