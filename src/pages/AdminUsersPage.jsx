import { useState } from 'react';
import { api } from '../api.js';
import { usePaged } from '../usePaged.js';
import { Alert, Avatar, PageHeader, Pager, RoleBadge } from '../ui.jsx';
import { splitList } from './AuthPage.jsx';

const EMPTY = { name: '', email: '', password: '', role: 'user', interests: '' };

export function AdminUsersPage({ currentUser, onOpenUser }) {
  const { data, error, page, setPage, reload } = usePaged('/admin/users');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const run = async (fn) => {
    setActionError('');
    try {
      await fn();
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const body = { name: form.name, email: form.email, role: form.role, interests: splitList(form.interests) };
      if (form.password) body.password = form.password;
      if (editingId) await api(`/admin/users/${editingId}`, { method: 'PATCH', body });
      else await api('/admin/users', { method: 'POST', body });
      reset();
    });
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, interests: u.interests.join(', ') });
  };

  const remove = (u) => {
    if (window.confirm(`Delete ${u.email} and all of their notes and posts?`)) {
      run(() => api(`/admin/users/${u._id}`, { method: 'DELETE' }));
    }
  };

  return (
    <div className="page">
      <PageHeader title="Users" subtitle={data ? `${data.total} registered members` : 'Loading…'} />

      <div className="split">
        <form className="card stack" onSubmit={submit}>
          <div className="card-title">
            {editingId ? 'Edit user' : 'Add user'}
            {editingId && <span className="badge badge-accent">editing</span>}
          </div>
          <label className="field">
            <span>Name</span>
            <input className="input" value={form.name} onChange={set('name')} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className="field">
            <span>{editingId ? 'New password (optional)' : 'Password'}</span>
            <input className="input" type="password" value={form.password} onChange={set('password')} required={!editingId} />
          </label>
          <label className="field">
            <span>Role</span>
            <select className="select" value={form.role} onChange={set('role')}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="field">
            <span>Interests</span>
            <input className="input" placeholder="chess, reading" value={form.interests} onChange={set('interests')} />
          </label>
          <div className="row row-end">
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save' : '+ Create user'}
            </button>
          </div>
        </form>

        <div className="card stack">
          <Alert>{error || actionError}</Alert>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Interests</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="cell-user">
                        <Avatar name={u.name} seed={u._id} />
                        <div>
                          <div>{u.name}</div>
                          <div className="cell-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {u.interests.map((interest) => (
                          <span key={interest} className="tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4, flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(u)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => onOpenUser(u._id)}>
                          Posts
                        </button>
                        {u._id !== currentUser._id && (
                          <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager data={data} page={page} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
