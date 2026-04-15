import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/router';
import { X, Plus, Search, ChevronDown } from 'lucide-react';
import Timer from '../components/Timer';
import ExerciseCard from '../components/ExerciseCard';

export default function TrainingPage() {
  const [startTime, setStartTime] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [movements, setMovements] = useState([]);
  const [session, setSession] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMovement, setNewMovement] = useState({ name: '', category: 'chest', plane: 'frontal plane' });
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);
  const searchContainerRef = useRef(null);
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/');
    setIsAdmin(localStorage.getItem('role') === 'admin');
    fetchMovements();
    startSession();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMovements = async () => {
    try {
      const res = await api.get('/movements');
      setMovements(res.data);
    } catch (err) { console.error(err); }
  };

  const startSession = () => {
    setStartTime(new Date());
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const isCurrentExerciseComplete = () => {
    if (session.length === 0) return true;
    const lastEx = session[session.length - 1];
    if (lastEx.sets.length === 0) return false;
    return lastEx.sets.every(set => set.weight !== '' && set.reps !== '' && set.weight > 0 && set.reps > 0);
  };

  const addExercise = async (movementId) => {
    if (!isCurrentExerciseComplete()) {
      alert("Please finish all sets for the current exercise first!");
      return;
    }
    const movement = movements.find(m => m._id === movementId);
    let prevSession = null;
    try {
      const res = await api.get(`/workouts/last/${movementId}`);
      prevSession = res.data;
    } catch (err) { console.error(err); }

    setSession([...session, {
      movementId,
      name: movement.name,
      category: movement.category,
      plane: movement.plane,
      sets: [{ weight: '', reps: '' }],
      prevSets: prevSession ? prevSession.sets : []
    }]);
    setSearchQuery('');
    setShowSearchList(false);
  };

  const addSet = (index) => {
    const newSession = [...session];
    newSession[index].sets.push({ weight: '', reps: '' });
    setSession(newSession);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newSession = [...session];
    newSession[exerciseIndex].sets[setIndex][field] = value;
    setSession(newSession);
  };

  const saveNewMovement = async () => {
    if (!newMovement.name) return;
    try {
      await api.post('/movements', newMovement);
      setNewMovement({ name: '', category: 'chest', plane: 'frontal plane' });
      setShowAddModal(false);
      fetchMovements();
    } catch (err) { alert(err.response?.data || err.message); }
  };

  const finishSession = async () => {
    if (session.length === 0) {
      alert("Add at least one exercise!");
      return;
    }
    if (!isCurrentExerciseComplete()) {
      alert("Please finish all sets before finishing the workout!");
      return;
    }
    clearInterval(timerRef.current);
    const endTime = new Date();
    try {
      const res = await api.post('/workouts/finish', {
        startTime,
        endTime,
        exercises: session
      });
      setSummary(res.data);
    } catch (err) { alert(err.response?.data || err.message); }
  };

  const filteredMovements = movements.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (summary) {
    return (
      <div className="container">
        <h1>Workout Summary</h1>
        <div className="card" style={{ marginTop: '20px' }}>
          <p><strong>Duration:</strong> {Math.floor(summary.duration / 60)}m {summary.duration % 60}s</p>
          <p><strong>Exercises:</strong> {summary.exercises.length}</p>
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>Done</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Timer seconds={seconds} />
        <button className="btn-success" onClick={finishSession} style={{ padding: '8px 16px' }}>Finish</button>
      </div>

      {isAdmin && (
        <button 
          className="btn-secondary" 
          style={{ width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} /> Add New Movement
        </button>
      )}

      {showAddModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ background: '#fff', width: '100%', maxWidth: '300px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>New Movement</h3>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Name (e.g. Bench Press)" value={newMovement.name} onChange={e => setNewMovement({ ...newMovement, name: e.target.value })} />
              <select value={newMovement.category} onChange={e => setNewMovement({ ...newMovement, category: e.target.value })}>
                {['chest', 'back', 'arm', 'delts', 'legs', 'abs'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
              <select value={newMovement.plane} onChange={e => setNewMovement({ ...newMovement, plane: e.target.value })}>
                {['frontal plane', 'saggital plane', 'transverse plane', '-'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
              <button className="btn-primary" onClick={saveNewMovement}>Save Movement</button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Searchable Dropdown */}
      <div ref={searchContainerRef} style={{ marginBottom: '24px', position: 'relative' }}>
        <div style={{ position: 'relative' }} onClick={() => setShowSearchList(!showSearchList)}>
          <input 
            placeholder="+ Add Exercise" 
            value={searchQuery} 
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchList(true);
            }}
            onFocus={() => setShowSearchList(true)}
            style={{ 
              paddingRight: '40px', 
              background: '#f2f2f7', 
              border: '1px solid #d1d1d6', 
              borderRadius: '12px',
              cursor: 'text',
              fontWeight: '600',
              caretColor: '#007aff'
            }}
          />
          <ChevronDown 
            size={20} 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#8e8e93',
              pointerEvents: 'none',
              transition: 'transform 0.2s ease',
              transform: `translateY(-50%) ${showSearchList ? 'rotate(180deg)' : ''}`
            }} 
          />
        </div>
        
        {showSearchList && (
          <div className="card" style={{ 
            position: 'absolute', 
            top: '55px', 
            left: 0, 
            right: 0, 
            zIndex: 50, 
            maxHeight: '300px', 
            overflowY: 'auto',
            background: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '4px',
            border: '1px solid #d1d1d6',
            borderRadius: '14px'
          }}>
            {filteredMovements.length > 0 ? (
              filteredMovements.map(m => (
                <div 
                  key={m._id} 
                  onClick={() => addExercise(m._id)}
                  style={{ 
                    padding: '14px 12px', 
                    borderBottom: '1px solid #f2f2f7', 
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f2f2f7'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#1c1c1e' }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#8e8e93', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
                    {m.category} • {m.plane}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', color: '#8e8e93', textAlign: 'center', fontSize: '14px' }}>
                No exercises found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ paddingBottom: '100px' }}>
        {session.map((exercise, exerciseIndex) => (
          <ExerciseCard
            key={exerciseIndex}
            exercise={exercise}
            exerciseIndex={exerciseIndex}
            onAddSet={addSet}
            onUpdateSet={updateSet}
          />
        ))}
      </div>
    </div>
  );
}
