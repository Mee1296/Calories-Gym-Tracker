import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { X, Plus } from 'lucide-react';
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
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/');
    setIsAdmin(localStorage.getItem('role') === 'admin');
    fetchMovements();
    startSession();
  }, []);

  let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);

  const fetchMovements = async () => {
    try {
      const res = await axios.get(`${API_URL}/movements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
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
      const res = await axios.get(`${API_URL}/workouts/last/${movementId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      prevSession = res.data;
    } catch (err) { console.error(err); }

    setSession([...session, {
      movementId,
      name: movement.name,
      category: movement.category,
      plane: movement.plane,
      sets: [{ weight: '', reps: '' }], // Start with one set
      prevSets: prevSession ? prevSession.sets : []
    }]);
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
      await axios.post(`${API_URL}/movements`, newMovement, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
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
      const res = await axios.post(`${API_URL}/workouts/finish`, {
        startTime,
        endTime,
        exercises: session
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSummary(res.data);
    } catch (err) { alert(err.response?.data || err.message); }
  };

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

      {/* Modal Mockup */}
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
                {['frontal plane', 'saggital plane', 'transverse plane'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
              <button className="btn-primary" onClick={saveNewMovement}>Save Movement</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <select onChange={(e) => addExercise(e.target.value)} defaultValue="" style={{ background: '#f2f2f7', border: '1px solid #d1d1d6' }}>
          <option value="" disabled>+ Add Exercise</option>
          {movements.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
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
