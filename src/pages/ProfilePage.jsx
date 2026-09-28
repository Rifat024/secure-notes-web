import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Avatar, PageHeader, RoleBadge } from '../ui.jsx';
import { splitList } from './AuthPage.jsx';

export function ProfilePage({ user, onUpdated }) {
  const [form, setForm] = useState({ name: user.name, interests: user.interests.join(', '), password: '' });
  const [message, setMessage] = useState({ kind: 'success', text: '' });

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ kind: 'success', text: '' });
    try {
      const body = { name: form.name, interests: splitList(form.interests) };
      if (form.password) body.password = form.password;
      const updated = await api('/auth/me', { method: 'PATCH', body });
      onUpdated(updated);
      setForm({ ...form, password: '' });
      setMessage({ kind: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    }
  };

  return (
    <div className="page">
      <PageHeader title="Profile" subtitle="Manage how other members see you." />

      <div className="split">
        <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <Avatar name={user.name} seed={user._id} size="lg" />
          <h2>{user.name}</h2>
          <p className="cell-sub">{user.email}</p>
          <RoleBadge role={user.role} />
          <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
            {user.interests.map((interest) => (
              <span key={interest} className="tag">
                {interest}
              </span>
            ))}
          </div>
        </div>

        <form className="card stack" onSubmit={submit}>
          <div className="card-title">Edit details</div>
          <label className="field">
            <span>Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>Interests (comma separated)</span>
            <input className="input" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="chess, reading" />
          </label>
          <label className="field">
            <span>New password</span>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />
          </label>
          <Alert kind={message.kind}>{message.text}</Alert>
          <div className="row row-end">
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
