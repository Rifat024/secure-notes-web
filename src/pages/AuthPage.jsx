import { useState } from 'react';
import { api } from '../api.js';
import { Alert } from '../ui.jsx';

const POINTS = [
  { icon: '🛡', title: 'Private by default', text: 'Your notes are visible only to you, and every request is checked against your token.' },
  { icon: '⚡', title: 'Built for speed', text: 'Every list and lookup is served by a purpose-built MongoDB index.' },
  { icon: '✦', title: 'Find your people', text: 'Share posts publicly and discover members who share your interests.' },
];

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', interests: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
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
          <div className="tabs">
            <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Log in
            </button>
            <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
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
              <input className="input" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
            </label>
            {mode === 'register' && (
              <label className="field">
                <span>Interests</span>
                <input className="input" placeholder="chess, reading, travel" value={form.interests} onChange={set('interests')} />
              </label>
            )}
            <Alert>{error}</Alert>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export const splitList = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
