import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      // Robust URL normalization
      let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // 1. Ensure it has a protocol (default to https for production)
      if (!envUrl.startsWith('http')) envUrl = `https://${envUrl}`;
      
      // 2. Remove trailing slash
      if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
      
      // 3. Ensure it ends with /api (since your backend prefixes all routes with /api)
      if (!envUrl.endsWith('/api')) envUrl = `${envUrl}/api`;
      
      const res = await axios.post(`${envUrl}/login`, {
        username, password, role
      });
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        router.push('/dashboard');
      } else {
        setIsLogin(true);
      }
    } catch (err) {
      alert('Auth failed: ' + err.response?.data || err.message);
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Gym Tracker</h1>
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        {!isLogin && (
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button className="btn-primary" type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button className="btn-outline" style={{ border: 'none' }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
}
