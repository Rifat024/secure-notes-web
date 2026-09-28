import { useState } from 'react';
import { api } from '../api.js';

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', interests: '' });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, interests: splitList(form.interests) };
      onAuth(await api(`/auth/${mode}`, { method: 'POST', body }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h1>Secure Notes</h1>
      <h2>{mode === 'login' ? 'Log in' : 'Register'}</h2>
      <form onSubmit={submit}>
        {mode === 'register' && <input placeholder="Name" value={form.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={set('password')} required />
        {mode === 'register' && (
          <input placeholder="Interests, comma separated (e.g. chess, reading)" value={form.interests} onChange={set('interests')} />
        )}
        <button type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        {error && <p className="error">{error}</p>}
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
    </section>
  );
}

export const splitList = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
