import { Plus } from 'lucide-react';

export default function ExerciseCard({ exercise, exerciseIndex, onAddSet, onUpdateSet }) {
  const isLastSetComplete = () => {
    if (exercise.sets.length === 0) return true;
    const lastSet = exercise.sets[exercise.sets.length - 1];
    return lastSet.weight !== '' && lastSet.reps !== '' && lastSet.weight > 0 && lastSet.reps > 0;
  };

  return (
    <div className="card exercise-card">
      <div style={{ marginBottom: '8px' }}>
        <h3 style={{ margin: 0 }}>{exercise.name}</h3>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.12em', marginTop: '6px' }}>
          {exercise.category} • {exercise.plane}
        </div>
      </div>
      
      <div style={{ display: 'flex', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', marginTop: '12px', paddingLeft: '30px' }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>WEIGHT</div>
        <div style={{ flex: '1 1 0', minWidth: 0, marginLeft: '8px' }}>REPS</div>
      </div>

      {exercise.sets.map((set, setIndex) => (
        <div key={setIndex} style={{ marginBottom: '14px' }}>
          <div className="exercise-row">
            <span style={{ minWidth: '22px', fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>{setIndex + 1}</span>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <input
                type="number"
                placeholder="0"
                value={set.weight}
                onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                className="input-inline"
                style={{ textAlign: 'center' }}
              />
            </div>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <input
                type="number"
                placeholder="0"
                value={set.reps}
                onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                className="input-inline"
                style={{ textAlign: 'center' }}
              />
            </div>
          </div>
          <div className="exercise-note">
            PREV: {exercise.prevSets[setIndex] ? `${exercise.prevSets[setIndex].weight}kg × ${exercise.prevSets[setIndex].reps}` : '—'}
          </div>
        </div>
      ))}
      
      <button 
        className="btn-outline btn-full" 
        disabled={!isLastSetComplete()}
        style={{ marginTop: '8px', gap: '4px', opacity: isLastSetComplete() ? 1 : 0.5 }} 
        onClick={() => onAddSet(exerciseIndex)}
      >
        <Plus size={16} /> Add Set
      </button>
      {!isLastSetComplete() && exercise.sets.length > 0 && (
        <div style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', marginTop: '6px' }}>
          Fill weight and reps to add more sets
        </div>
      )}
    </div>
  );
}
