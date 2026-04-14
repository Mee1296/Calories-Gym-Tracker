import { Plus } from 'lucide-react';

export default function ExerciseCard({ exercise, exerciseIndex, onAddSet, onUpdateSet }) {
  const isLastSetComplete = () => {
    if (exercise.sets.length === 0) return true;
    const lastSet = exercise.sets[exercise.sets.length - 1];
    return lastSet.weight !== '' && lastSet.reps !== '' && lastSet.weight > 0 && lastSet.reps > 0;
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '4px' }}>
        <h3 style={{ margin: 0 }}>{exercise.name}</h3>
        <div style={{ fontSize: '10px', color: '#8e8e93', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
          {exercise.category} • {exercise.plane}
        </div>
      </div>
      
      <div style={{ display: 'flex', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '8px', marginTop: '12px', paddingLeft: '30px' }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>WEIGHT</div>
        <div style={{ flex: '1 1 0', minWidth: 0, marginLeft: '8px' }}>REPS</div>
      </div>

      {exercise.sets.map((set, setIndex) => (
        <div key={setIndex} style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ minWidth: '22px', fontSize: '13px', fontWeight: '700', color: '#c7c7cc' }}>{setIndex + 1}</span>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <input
                type="number"
                placeholder="0"
                value={set.weight}
                onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                style={{ width: '100%', padding: '10px', textAlign: 'center' }}
              />
            </div>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <input
                type="number"
                placeholder="0"
                value={set.reps}
                onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                style={{ width: '100%', padding: '10px', textAlign: 'center' }}
              />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#007aff', fontWeight: '600', marginTop: '4px', paddingLeft: '30px' }}>
            PREV: {exercise.prevSets[setIndex] ? `${exercise.prevSets[setIndex].weight}kg × ${exercise.prevSets[setIndex].reps}` : '—'}
          </div>
        </div>
      ))}
      
      <button 
        className="btn-outline" 
        disabled={!isLastSetComplete()}
        style={{ 
          width: '100%', 
          marginTop: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '4px', 
          background: '#fff',
          opacity: isLastSetComplete() ? 1 : 0.5
        }} 
        onClick={() => onAddSet(exerciseIndex)}
      >
        <Plus size={16} /> Add Set
      </button>
      {!isLastSetComplete() && exercise.sets.length > 0 && (
        <div style={{ fontSize: '10px', color: '#ff3b30', textAlign: 'center', marginTop: '4px' }}>
          Fill weight and reps to add more sets
        </div>
      )}
    </div>
  );
}
