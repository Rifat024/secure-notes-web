import { useState } from 'react';
import { api } from '../api.js';
import { splitList } from './AuthPage.jsx';

export function ProfilePage({ user, onUpdated }) {
  const [form, setForm] = useState({ name: user.name, interests: user.interests.join(', '), password: '' });
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const body = { name: form.name, interests: splitList(form.interests) };
      if (form.password) body.password = form.password;
      const updated = await api('/auth/me', { method: 'PATCH', body });
      onUpdated(updated);
      setForm({ ...form, password: '' });
      setMessage('Saved.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      <h2>Profile</h2>
      <p>{user.email} · role: {user.role}</p>
      <form onSubmit={submit}>
        <label>Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Interests (comma separated) <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} /></label>
        <label>New password (optional) <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button type="submit">Save</button>
        {message && <p>{message}</p>}
      </form>
    </section>
  );
}
