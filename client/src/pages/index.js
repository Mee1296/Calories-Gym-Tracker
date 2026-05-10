import { useState } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    try {
      const res = await api.post(endpoint, {
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
      alert('Auth failed: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="container">
      <div className="page-header centered">
        <h1 className="page-title">Gym Tracker</h1>
        <p className="page-subtitle">still under construction</p>
      </div>
      
      <form onSubmit={handleAuth} className="form-row-full">
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        {!isLogin && (
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button className="btn-primary btn-full" type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <div className="switch-action">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button className="btn-outline" type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Register' : 'Login'}
        </button>
      </div>
    </div>
  );
}
