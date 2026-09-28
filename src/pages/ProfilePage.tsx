import { useState } from 'react';
import { api, errorMessage } from '../api';
import { AccentPicker, ModeToggle } from '../appearance';
import { meetsPasswordPolicy } from '../session';
import { Alert, Avatar, PageHeader, RoleBadge } from '../ui';
import { splitList } from './AuthPage';
import type { FormEvent } from 'react';
import type { User } from '../types';

interface ProfilePageProps {
  user: User;
  onUpdated: (user: User) => void;
  onTokenRefreshed: (token: string) => void;
  onSignOutEverywhere: () => void;
}

export function ProfilePage({ user, onUpdated, onTokenRefreshed, onSignOutEverywhere }: ProfilePageProps) {
  const [form, setForm] = useState({ name: user.name, interests: user.interests.join(', '), password: '' });
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string }>({ kind: 'success', text: '' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ kind: 'success', text: '' });
    if (form.password && !meetsPasswordPolicy(form.password)) {
      setMessage({ kind: 'error', text: 'New password needs at least 8 characters, including a letter and a number.' });
      return;
    }
    try {
      const body: { name: string; interests: string[]; password?: string } = { name: form.name, interests: splitList(form.interests) };
      if (form.password) body.password = form.password;
      const res = await api<{ user: User; token?: string }>('/auth/me', { method: 'PATCH', body });
      if (res.token) onTokenRefreshed(res.token);
      onUpdated(res.user);
      setForm({ ...form, password: '' });
      setMessage({ kind: 'success', text: res.token ? 'Saved. Other devices have been signed out.' : 'Profile saved.' });
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div className="page">
      <PageHeader title="Profile" subtitle="Manage how other members see you and how the app looks." />

      <div className="split">
        <div className="stack">
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

          <div className="card stack">
            <div className="card-title" style={{ marginBottom: 0 }}>Appearance</div>
            <div className="field">
              <span>Mode</span>
              <ModeToggle />
            </div>
            <div className="field">
              <span>Theme</span>
              <AccentPicker />
            </div>
          </div>
        </div>

        <div className="stack">
          <form className="card stack" onSubmit={submit}>
            <div className="card-title">Edit details</div>
            <label className="field">
              <span>Name</span>
              <input className="input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>Interests (comma separated)</span>
              <input className="input" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="chess, reading" />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                maxLength={72}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank to keep current"
              />
            </label>
            <Alert kind={message.kind}>{message.text}</Alert>
            <div className="row row-end">
              <button type="submit" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </form>

          <div className="card stack">
            <div className="card-title" style={{ marginBottom: 0 }}>Security</div>
            <p className="cell-sub">
              Sessions end after 30 minutes of inactivity. After 5 wrong passwords an account is locked for 15 minutes, and repeated failures from one network block it for 30 minutes.
            </p>
            <div className="row row-end">
              <button type="button" className="btn btn-danger" onClick={onSignOutEverywhere}>
                Sign out of all devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
