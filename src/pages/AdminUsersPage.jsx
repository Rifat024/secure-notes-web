import { useState } from 'react';
import { api } from '../api.js';
import { usePaged } from '../usePaged.js';
import { Pager } from '../Pager.jsx';
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

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const body = { name: form.name, email: form.email, role: form.role, interests: splitList(form.interests) };
      if (form.password) body.password = form.password;
      if (editingId) await api(`/admin/users/${editingId}`, { method: 'PATCH', body });
      else await api('/admin/users', { method: 'POST', body });
      setForm(EMPTY);
      setEditingId(null);
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
    <section>
      <h2>Manage users</h2>
      <form onSubmit={submit}>
        <strong>{editingId ? 'Edit user' : 'Add user'}</strong>
        <input placeholder="Name" value={form.name} onChange={set('name')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder={editingId ? 'New password (optional)' : 'Password'} value={form.password} onChange={set('password')} required={!editingId} />
        <select value={form.role} onChange={set('role')}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <input placeholder="Interests, comma separated" value={form.interests} onChange={set('interests')} />
        <div className="row">
          <button type="submit">{editingId ? 'Save' : 'Create user'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>
      {(error || actionError) && <p className="error">{error || actionError}</p>}
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Interests</th><th /></tr>
        </thead>
        <tbody>
          {data?.items.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.interests.join(', ')}</td>
              <td>
                <button onClick={() => startEdit(u)}>Edit</button>{' '}
                <button onClick={() => onOpenUser(u._id)}>Posts</button>{' '}
                {u._id !== currentUser._id && <button onClick={() => remove(u)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager data={data} page={page} setPage={setPage} />
    </section>
  );
}
