import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/router';
import { ChevronLeft, Plus, Calendar, Clock } from 'lucide-react';

export default function LiftHistoryPage() {
  const [history, setHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/workouts');
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ChevronLeft onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }} />
        <h1 style={{ margin: 0 }}>Lift History</h1>
      </div>

      <button 
        className="btn-primary" 
        style={{ width: '100%', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}
        onClick={() => router.push('/training')}
      >
        <Plus size={20} /> START TRAINING
      </button>

      <div>
        <h3 style={{ marginBottom: '16px' }}>Previous Workouts</h3>
        {history.length > 0 ? (
          history.map((workout, index) => (
            <div key={workout._id} className="card" style={{ marginBottom: '16px', borderLeft: '4px solid #007aff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8e8e93', fontSize: '13px' }}>
                  <Calendar size={14} />
                  {new Date(workout.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8e8e93', fontSize: '13px' }}>
                  <Clock size={14} />
                  {formatDuration(workout.duration)}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {workout.exercises.map((ex, i) => (
                  <span key={i} style={{ 
                    background: '#fff', 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    border: '1px solid #f2f2f7'
                  }}>
                    {ex.movementId?.name || 'Exercise'}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#8e8e93' }}>
            <p>No workouts logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
