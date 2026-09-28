import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ModeToggle } from '../appearance.jsx';
import { PASSWORD_RULES, meetsPasswordPolicy, passwordScore } from '../session.js';
import { Alert } from '../ui.jsx';

const POINTS = [
  { icon: '🛡', title: 'Private by default', text: 'Your notes are visible only to you, and every request is checked against your token.' },
  { icon: '⚡', title: 'Built for speed', text: 'Every list and lookup is served by a purpose-built MongoDB index.' },
  { icon: '✦', title: 'Find your people', text: 'Share posts publicly and discover members who share your interests.' },
];

export function AuthPage({ onAuth, notice }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', interests: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockedFor, setLockedFor] = useState(0);

  useEffect(() => {
    if (lockedFor <= 0) return undefined;
    const timer = setTimeout(() => setLockedFor((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [lockedFor]);

  const weakPassword = mode === 'register' && !meetsPasswordPolicy(form.password);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    // Account lockouts are per email; an IP block is re-applied by the server on the next attempt.
    if (key === 'email' && lockedFor > 0) {
      setLockedFor(0);
      setError('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, interests: splitList(form.interests) };
      onAuth(await api(`/auth/${mode}`, { method: 'POST', body }));
    } catch (err) {
      setError(err.message);
      if (err.status === 429) setLockedFor(err.retryAfter ?? 60);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="theme-corner">
        <ModeToggle />
      </div>
      <section className="auth-hero">
        <div className="brand">
          <span className="brand-mark">🔐</span>
          <span>Secure Notes</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>
            Your thoughts,
            <br />
            <span className="gradient-text">locked and organised.</span>
          </h1>
          <div className="auth-points">
            {POINTS.map((point) => (
              <div key={point.title} className="auth-point">
                <div className="auth-point-icon">{point.icon}</div>
                <div>
                  <b>{point.title}</b>
                  {point.text}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="hint" style={{ position: 'relative', zIndex: 1 }}>JWT · bcrypt · MongoDB</p>
      </section>

      <section className="auth-panel">
        <div className="card auth-card">
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Log in
            </button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
              Create account
            </button>
          </div>
          <form className="stack" onSubmit={submit}>
            {mode === 'register' && (
              <label className="field">
                <span>Name</span>
                <input className="input" placeholder="Ada Lovelace" value={form.name} onChange={set('name')} required />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                placeholder="At least 8 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                maxLength={72}
                value={form.password}
                onChange={set('password')}
                required
              />
            </label>
            {mode === 'register' && form.password && (
              <div className="stack" style={{ gap: 6 }}>
                <div className="strength" data-score={passwordScore(form.password)} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <ul className="rules">
                  {PASSWORD_RULES.map((rule) => (
                    <li key={rule.id} className={rule.test(form.password) ? 'met' : ''}>
                      {rule.test(form.password) ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mode === 'register' && (
              <label className="field">
                <span>Interests</span>
                <input className="input" placeholder="chess, reading, travel" value={form.interests} onChange={set('interests')} />
              </label>
            )}
            <Alert kind="success">{!error && notice}</Alert>
            <Alert>{lockedFor > 0 ? `${error} You can try again in ${formatWait(lockedFor)}.` : error}</Alert>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy || lockedFor > 0 || weakPassword}>
              {busy ? 'Please wait…' : lockedFor > 0 ? `Locked · ${formatWait(lockedFor)}` : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

const formatWait = (seconds) => (seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds}s`);

export const splitList = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
