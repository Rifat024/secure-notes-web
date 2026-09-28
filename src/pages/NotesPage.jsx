import { useState } from 'react';
import { api } from '../api.js';
import { usePaged } from '../usePaged.js';
import { Pager } from '../Pager.jsx';

const EMPTY = { title: '', content: '' };

export function NotesPage() {
  const { data, error, page, setPage, reload } = usePaged('/notes');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState('');

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
      if (editingId) await api(`/notes/${editingId}`, { method: 'PATCH', body: form });
      else await api('/notes', { method: 'POST', body: form });
      setForm(EMPTY);
      setEditingId(null);
    });
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setForm({ title: note.title, content: note.content });
  };

  const remove = (id) => {
    if (window.confirm('Delete this note?')) run(() => api(`/notes/${id}`, { method: 'DELETE' }));
  };

  return (
    <section>
      <h2>My notes</h2>
      <form onSubmit={submit}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <div className="row">
          <button type="submit">{editingId ? 'Save changes' : 'Add note'}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {(error || actionError) && <p className="error">{error || actionError}</p>}
      <table>
        <thead>
          <tr><th>Title</th><th>Content</th><th>Updated</th><th /></tr>
        </thead>
        <tbody>
          {data?.items.map((note) => (
            <tr key={note._id}>
              <td>{note.title}</td>
              <td style={{ whiteSpace: 'pre-wrap' }}>{note.content}</td>
              <td>{new Date(note.updatedAt).toLocaleString()}</td>
              <td>
                <button onClick={() => startEdit(note)}>Edit</button>{' '}
                <button onClick={() => remove(note._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager data={data} page={page} setPage={setPage} />
    </section>
  );
}
