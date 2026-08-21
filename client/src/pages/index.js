import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { C } from '../theme/tokens';
import { textInput } from '../theme/styles';
import { Button, Card, Notice, SegmentedControl } from '../components/ui';
import AppShell from '../components/layout/AppShell';
import { auth } from '../lib/endpoints';
import { getToken, saveSession } from '../lib/auth';
import { errorMessage } from '../lib/api';

const MODES = [
  { id: 'login', label: 'Sign in' },
  { id: 'register', label: 'Create account' },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  // Single-user deployments close signup; only offer the tab when it is open.
  const [canRegister, setCanRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in? Go straight to the app.
  useEffect(() => {
    if (getToken()) router.replace('/today');
  }, [router]);

  useEffect(() => {
    let live = true;
    auth.config()
      .then((cfg) => { if (live) setCanRegister(Boolean(cfg?.allowRegistration)); })
      .catch(() => {}); // an older API without /auth/config just stays sign-in only
    return () => { live = false; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const credentials = { username: username.trim(), password };
      const session = mode === 'login' ? await auth.login(credentials) : await auth.register(credentials);
      saveSession(session);
      router.replace('/today');
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in'));
      setLoading(false);
    }
  };

  const disabled = !username.trim() || password.length === 0;

  return (
    <AppShell>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 20px',
        gap: 20,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>🌿</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, margin: '8px 0 4px', letterSpacing: -0.5 }}>Stride</h1>
          <p style={{ fontSize: 15, color: C.stone, margin: 0 }}>A calm companion for training and food.</p>
        </div>

        <Card style={{ padding: 24 }}>
          {canRegister && (
            <SegmentedControl
              options={MODES}
              value={mode}
              onChange={(next) => { setMode(next); setError(null); }}
              style={{ marginBottom: 18 }}
            />
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              aria-label="Username"
              autoComplete="username"
              autoCapitalize="none"
              style={textInput}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={textInput}
            />

            {mode === 'register' && (
              <div style={{ fontSize: 12, color: C.stone }}>At least 8 characters.</div>
            )}

            {error && <Notice tone="danger">{error}</Notice>}

            <Button type="submit" disabled={disabled} loading={loading} style={{ marginTop: 4 }}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </Card>

        {canRegister && (
          <p style={{ textAlign: 'center', fontSize: 12, color: C.stone, margin: 0 }}>
            New accounts start with Push, Pull and Leg day routines.
          </p>
        )}
      </div>
    </AppShell>
  );
}
