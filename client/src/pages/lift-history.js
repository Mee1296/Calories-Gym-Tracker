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
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChevronLeft onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }} />
          <h1 className="page-title">Lift History</h1>
        </div>
      </div>

      <button 
        className="btn-primary btn-full" 
        style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={() => router.push('/training')}
      >
        <Plus size={20} /> START TRAINING
      </button>

      <div>
        <h3 className="section-title">Previous Workouts</h3>
        {history.length > 0 ? (
          history.map((workout, index) => (
            <div key={workout._id} className="card history-panel" style={{ marginBottom: '16px' }}>
              <div className="history-header">
                <div className="history-subtext" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  {new Date(workout.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="history-subtext" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  {formatDuration(workout.duration)}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {workout.exercises.map((ex, i) => (
                  <span key={i} className="badge">
                    {ex.movementId?.name || 'Exercise'}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No workouts logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
