import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/router';
import { ChevronLeft, Plus, Zap, Settings, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

export default function CaloriesPage() {
  const [data, setData] = useState({ meals: [], goals: { calories: 2000, protein: 150, carbs: 200, fat: 70 } });
  const [savedDishes, setSavedDishes] = useState([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [showAiCalculator, setShowAiCalculator] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const suggestionRef = useRef(null);
  const router = useRouter();

  // Form states
  const [manualMeal, setManualMeal] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [aiDish, setAiDish] = useState('');
  const [tempGoals, setTempGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 70 });
  
  // AI Metrics states
  const [metrics, setMetrics] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    bodyFat: '',
    activityLevel: 'moderately active',
    goal: 'maintain'
  });

  useEffect(() => {
    fetchDailyData();
    fetchSavedDishes();

    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDailyData = async () => {
    try {
      const res = await api.get('/meals');
      if (res.data && res.data.meals) {
        setData(res.data);
        if (res.data.goals) {
          setTempGoals(res.data.goals);
        }
      }
    } catch (err) { 
      console.error('fetchDailyData error:', err); 
      if (err.response?.status === 401) {
        router.push('/');
      }
    }
  };

  const fetchSavedDishes = async () => {
    try {
      const res = await api.get('/meals/dishes');
      setSavedDishes(res.data);
    } catch (err) { console.error('fetchSavedDishes error:', err); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/meals/log', manualMeal);
      setManualMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      fetchDailyData();
      fetchSavedDishes(); // Refresh suggestions
    } catch (err) { alert(err.response?.data || err.message); }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiDish) return;
    setLoading(true);
    try {
      await api.post('/meals/ai', { dishName: aiDish });
      setAiDish('');
      fetchDailyData();
      fetchSavedDishes(); // Refresh suggestions
    } catch (err) { 
      alert(err.response?.data || err.message); 
    } finally {
      setLoading(false);
    }
  };

  const selectDish = (dish) => {
    setManualMeal({
      name: dish.name,
      calories: dish.calories,
      protein: dish.protein,
      carbs: dish.carbs,
      fat: dish.fat
    });
    setShowSuggestions(false);
  };

  const filteredDishes = savedDishes.filter(d => 
    manualMeal.name && d.name.toLowerCase().includes(manualMeal.name.toLowerCase()) && d.name.toLowerCase() !== manualMeal.name.toLowerCase()
  ).slice(0, 5);

  const handleAiSuggestGoals = async () => {
    if (!metrics.weight || !metrics.height || !metrics.age) {
      alert("Please fill in Weight, Height, and Age");
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/meals/suggest-goals', metrics);
      setTempGoals(res.data);
      setShowAiCalculator(false);
    } catch (err) {
      alert(err.response?.data || err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateGoals = async () => {
    try {
      await api.put('/meals/goals', tempGoals);
      setIsEditingGoals(false);
      fetchDailyData();
    } catch (err) { alert(err.response?.data || err.message); }
  };

  const [expandedDays, setExpandedDays] = useState({});

  const toggleDay = (dateStr) => {
    setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const groupedMeals = data.meals.reduce((acc, meal) => {
    const date = new Date(meal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {});

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todayMeals = groupedMeals[todayStr] || [];
  const historyDates = Object.keys(groupedMeals).filter(date => date !== todayStr).sort((a, b) => new Date(b) - new Date(a));

  const totals = todayMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const chartData = [
    { name: 'Consumed', value: totals.calories, color: '#007aff' },
    { name: 'Remaining', value: Math.max(0, data.goals.calories - totals.calories), color: '#ff3b30' }
  ];

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChevronLeft onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }} />
          <h1 className="page-title">Calorie Track</h1>
        </div>
        <Settings size={20} onClick={() => setIsEditingGoals(!isEditingGoals)} style={{ cursor: 'pointer', color: isEditingGoals ? 'var(--primary)' : '#64748b' }} />
      </div>

      {isEditingGoals && (
        <div className="card card-soft" style={{ gap: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {showAiCalculator ? (
              <ChevronLeft 
                onClick={() => setShowAiCalculator(false)} 
                style={{ cursor: 'pointer', color: 'var(--text)' }} 
                size={24}
              />
            ) : null}
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: 0 }}>
              {showAiCalculator ? 'AI Goal Calculator' : 'Edit Daily Goals'}
            </h3>
            {!showAiCalculator && (
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 14px', fontSize: '12px', marginLeft: 'auto' }}
                onClick={() => setShowAiCalculator(true)}
              >
                AI Calculator
              </button>
            )}
          </div>

          {showAiCalculator ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
              <div className="form-row" style={{ gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px' }}>Weight (kg)</label>
                  <input type="number" value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})} placeholder="70" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px' }}>Height (cm)</label>
                  <input type="number" value={metrics.height} onChange={e => setMetrics({...metrics, height: e.target.value})} placeholder="175" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px' }}>Age</label>
                  <input type="number" value={metrics.age} onChange={e => setMetrics({...metrics, age: e.target.value})} placeholder="25" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px' }}>Gender</label>
                  <select value={metrics.gender} onChange={e => setMetrics({...metrics, gender: e.target.value})}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px' }}>Activity Level</label>
                  <select value={metrics.activityLevel} onChange={e => setMetrics({...metrics, activityLevel: e.target.value})}>
                    <option value="sedentary">Sedentary</option>
                    <option value="lightly active">Lightly Active</option>
                    <option value="moderately active">Moderately Active</option>
                    <option value="very active">Very Active</option>
                    <option value="extra active">Extra Active</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px' }}>Goal</label>
                  <select value={metrics.goal} onChange={e => setMetrics({...metrics, goal: e.target.value})}>
                    <option value="lose weight">Lose Weight</option>
                    <option value="maintain">Maintain</option>
                    <option value="gain muscle">Gain Muscle</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px' }}>Body Fat % (Optional)</label>
                <input type="number" value={metrics.bodyFat} onChange={e => setMetrics({...metrics, bodyFat: e.target.value})} placeholder="e.g. 15" />
              </div>

              <button 
                className="btn-secondary btn-full" 
                onClick={handleAiSuggestGoals}
                disabled={aiLoading}
                style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Zap size={16} /> {aiLoading ? 'Calculating...' : 'Calculate suggested goals'}
              </button>
            </div>
          ) : (
            <>
              <div className="form-row" style={{ gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)' }}>TDEE (kcal)</label>
                  <input type="number" value={tempGoals.calories} onChange={e => setTempGoals({...tempGoals, calories: parseInt(e.target.value)})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Protein (g)</label>
                  <input type="number" value={tempGoals.protein} onChange={e => setTempGoals({...tempGoals, protein: parseInt(e.target.value)})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Carbs (g)</label>
                  <input type="number" value={tempGoals.carbs} onChange={e => setTempGoals({...tempGoals, carbs: parseInt(e.target.value)})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Fat (g)</label>
                  <input type="number" value={tempGoals.fat} onChange={e => setTempGoals({...tempGoals, fat: parseInt(e.target.value)})} />
                </div>
              </div>
              <button className="btn-primary btn-full" onClick={handleUpdateGoals} style={{ padding: '16px' }}>Save Goals</button>
            </>
          )}
        </div>
      )}

      {/* Nutritional Dashboard */}
      <div className="card chart-card">
        <div style={{ width: '100%', height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label 
                  value={`${totals.calories}`} 
                  position="center" 
                  style={{ fontSize: '24px', fontWeight: '800', fill: '#fff' }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend" style={{ marginTop: '10px' }}>
          <span style={{ color: '#fff' }}><span className="dot" style={{ background: '#007aff' }} /> Consumed</span>
          <span style={{ color: '#fff' }}><span className="dot" style={{ background: '#ff3b30' }} /> Remaining</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Goal: {data.goals.calories} kcal</div>
      </div>

      {/* Macro Breakdown */}
      <div className="stats-grid">
        {[
          { label: 'PROTEIN', current: totals.protein, goal: data.goals.protein, color: '#7c3aed' },
          { label: 'CARB', current: totals.carbs, goal: data.goals.carbs, color: '#f97316' },
          { label: 'FAT', current: totals.fat, goal: data.goals.fat, color: '#10b981' }
        ].map(macro => (
          <div key={macro.label} className="stat-card">
            <div className="stats-label">{macro.label}</div>
            <div className="stats-value">{macro.current}g</div>
            <div className="stats-meta">of {macro.goal}g</div>
            <div className="macro-bar">
              <div className="macro-fill" style={{ width: `${Math.min(100, (macro.current / macro.goal) * 100)}%`, background: macro.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Logging Section */}
      <div className="card section-card" style={{ marginTop: '16px', padding: '32px 24px' }}>
        <div className="tab-row" style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
            style={{ flex: 1, padding: '14px' }}
          >
            Manual
          </button>
          <button 
            type="button"
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
            style={{ flex: 1, padding: '14px' }}
          >
            AI Parse
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="form-row-full" style={{ gap: '32px' }}>
            <div ref={suggestionRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--primary)', marginLeft: '4px' }}>MEAL NAME</label>
              <input 
                placeholder="e.g. Chicken Salad" 
                value={manualMeal.name} 
                onChange={e => {
                  setManualMeal({...manualMeal, name: e.target.value});
                  setShowSuggestions(true);
                }} 
                onFocus={() => setShowSuggestions(true)}
                required 
              />
              {showSuggestions && filteredDishes.length > 0 && (
                <div className="dropdown-card" style={{ top: '100%', marginTop: '8px', zIndex: 100 }}>
                  {filteredDishes.map((dish, i) => (
                    <div 
                      key={i} 
                      className="dropdown-item" 
                      onClick={() => selectDish(dish)}
                      style={{ borderBottom: i === filteredDishes.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)', padding: '14px' }}
                    >
                      <div style={{ fontWeight: '600', color: '#fff' }}>{dish.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        {dish.calories} kcal • P:{dish.protein}g C:{dish.carbs}g F:{dish.fat}g
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--primary)', marginLeft: '4px' }}>MACRONUTRIENTS</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>Calories (kcal)</label>
                  <input type="number" placeholder="0" value={manualMeal.calories} onChange={e => setManualMeal({...manualMeal, calories: parseInt(e.target.value)})} required />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>Protein (g)</label>
                  <input type="number" placeholder="0" value={manualMeal.protein} onChange={e => setManualMeal({...manualMeal, protein: parseInt(e.target.value)})} required />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>Carbs (g)</label>
                  <input type="number" placeholder="0" value={manualMeal.carbs} onChange={e => setManualMeal({...manualMeal, carbs: parseInt(e.target.value)})} required />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>Fat (g)</label>
                  <input type="number" placeholder="0" value={manualMeal.fat} onChange={e => setManualMeal({...manualMeal, fat: parseInt(e.target.value)})} required />
                </div>
              </div>
            </div>
            
            <button className="btn-primary btn-full" type="submit" style={{ marginTop: '8px', padding: '18px' }}>Log Meal</button>
          </form>
        ) : (
          <form onSubmit={handleAiSubmit} className="form-row-full" style={{ gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--secondary)', marginLeft: '4px' }}>DESCRIBE YOUR MEAL</label>
              <div style={{ position: 'relative' }}>
                <input 
                  placeholder="e.g. 200g Grilled Salmon with rice" 
                  value={aiDish} 
                  onChange={e => setAiDish(e.target.value)} 
                  required 
                  className="input-inline"
                  style={{ paddingRight: '44px', fontSize: '15px' }}
                  disabled={loading}
                />
                <Zap size={20} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5ac8fa' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                <Info size={14} /> Gemini AI will estimate macros
              </p>
            </div>
            
            <button 
              className="btn-secondary btn-full" 
              type="submit" 
              disabled={loading}
              style={{ marginTop: '8px', padding: '18px' }}
            >
              {loading ? 'AI is thinking...' : 'Analyze & Save'}
            </button>
          </form>
        )}
      </div>

      {/* History */}
      <div style={{ marginTop: '24px' }}>
        <h3 className="section-title">Today's Meals</h3>
        <div style={{ marginTop: '16px' }}>
          {todayMeals.length > 0 ? todayMeals.map((meal, i) => (
            <div key={i} className="card meal-card">
              <div className="meal-header">
                <span style={{ fontWeight: '700', fontSize: '15px' }}>{meal.name}</span>
                <span style={{ fontWeight: '800', color: '#3b82f6' }}>{meal.calories} kcal</span>
              </div>
              <div className="meal-meta">
                P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
              </div>
            </div>
          )) : (
            <div className="empty-state">No meals logged yet today</div>
          )}
        </div>

        {historyDates.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h3 className="section-title">Past History</h3>
            {historyDates.map(date => {
              const dayMeals = groupedMeals[date];
              const dayTotal = dayMeals.reduce((sum, m) => sum + m.calories, 0);
              const isExpanded = expandedDays[date];

              return (
                <div key={date} style={{ marginBottom: '12px' }}>
                  <div 
                    className="card history-panel" 
                    onClick={() => toggleDay(date)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer', 
                      marginBottom: 0,
                      borderColor: isExpanded ? 'rgba(15, 23, 42, 0.12)' : 'transparent'
                    }}
                  >
                    <div>
                      <span className="history-title">{date}</span>
                      <div className="history-subtext">{dayMeals.length} meals</div>
                    </div>
                    <span style={{ fontWeight: '800', color: '#64748b' }}>{dayTotal} kcal</span>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '12px 8px 0 14px', borderLeft: '2px solid rgba(15, 23, 42, 0.12)', marginTop: '10px' }}>
                      {dayMeals.map((meal, idx) => (
                        <div key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid #f2f2f7', paddingBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ fontWeight: '600' }}>{meal.name}</span>
                            <span style={{ fontWeight: '700' }}>{meal.calories} kcal</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
