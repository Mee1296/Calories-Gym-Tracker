import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/');
    setRole(localStorage.getItem('role'));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gym Tracker</h1>
          <p className="page-subtitle">Track your progress effortlessly</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => router.push('/lift-history')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}>
          <h3>Lift Track</h3>
          <p>Log sets, reps, and PRs</p>
        </div>

        <div className="dashboard-card" onClick={() => router.push('/calories')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #7c2d12 0%, #31111b 100%)' }}>
          <h3>Calories Track</h3>
          <p>Log meals and track macros</p>
        </div>

        <div className="dashboard-card" onClick={() => router.push('/weight')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)' }}>
          <h3>Weight Track</h3>
          <p>Track your body weight progress</p>
        </div>
      </div>

      <button className="btn-outline btn-full" style={{ marginTop: 'auto' }} onClick={() => {
        localStorage.clear();
        router.push('/');
      }}>Logout</button>
    </div>
  );
}
