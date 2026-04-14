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
      <h1 style={{ marginBottom: '8px' }}>Gym Tracker</h1>
      <p style={{ color: '#8e8e93', marginBottom: '32px', fontSize: '17px' }}>Track your progress effortlessly</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="card" onClick={() => router.push('/training')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)', color: '#fff' }}>
          <h3 style={{ marginBottom: '4px' }}>Lift Track</h3>
          <p style={{ opacity: 0.9, fontSize: '15px' }}>Log sets, reps, and PRs</p>
          <div style={{ marginTop: '16px', fontWeight: '700', fontSize: '15px' }}>Start Training →</div>
        </div>

        <div className="card" style={{ opacity: 0.6 }}>
          <h3 style={{ marginBottom: '4px' }}>Calories Track</h3>
          <p style={{ color: '#8e8e93', fontSize: '15px' }}>Coming soon</p>
        </div>

        <div className="card" style={{ opacity: 0.6 }}>
          <h3 style={{ marginBottom: '4px' }}>Weight Tracking</h3>
          <p style={{ color: '#8e8e93', fontSize: '15px' }}>Coming soon</p>
        </div>
      </div>

      <button className="btn-outline" style={{ width: '100%', marginTop: '40px', color: '#ff3b30' }} onClick={() => {
        localStorage.clear();
        router.push('/');
      }}>Logout</button>
    </div>
  );
}
