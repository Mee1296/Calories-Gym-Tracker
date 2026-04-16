import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/router';
import { ChevronLeft, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightPage() {
  const [weight, setWeight] = useState('');
  const [history, setHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/weights');
      const formattedData = res.data.map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));
      setHistory(formattedData);
    } catch (err) { console.error(err); }
  };

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!weight) return;
    try {
      await api.post('/weights', { weight: parseFloat(weight) });
      setWeight('');
      fetchHistory();
    } catch (err) { alert(err.response?.data || err.message); }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <ChevronLeft onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }} />
        <h1 style={{ margin: 0 }}>Weight Tracking</h1>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Log Today's Weight</h3>
        <form onSubmit={handleLogWeight} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="number" 
            step="0.1" 
            placeholder="Weight in kg" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)}
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              fontSize: '18px', 
              fontWeight: '600',
              padding: '12px'
            }}
          />
          <button className="btn-primary" type="submit" style={{ width: '100%', fontSize: '14px', letterSpacing: '0.5px', background: '#5ac8fa' }}>
            ENTER
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="card" style={{ height: '280px', padding: '20px 10px 10px 0', background: '#000', color: '#fff' }}>
          <h3 style={{ marginLeft: '20px', marginBottom: '10px', fontSize: '16px' }}>Progress</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#8e8e93' }} 
              />
              <YAxis 
                hide 
                domain={['dataMin - 1', 'dataMax + 1']} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', background: '#1c1c1e', color: '#fff' }}
                itemStyle={{ color: '#5ac8fa' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#5ac8fa" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#5ac8fa', strokeWidth: 1, stroke: '#000' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3>History</h3>
        <div style={{ marginTop: '16px' }}>
          {[...history].reverse().slice(0, 5).map((item, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>{item.displayDate}</span>
              <span style={{ fontWeight: '800', color: '#007aff' }}>{item.weight} kg</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
