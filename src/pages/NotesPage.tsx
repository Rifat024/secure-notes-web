import { useState } from 'react';
import { api, errorMessage } from '../api';
import { usePaged } from '../usePaged';
import { Alert, Empty, PageHeader, Pager, Skeletons, timeAgo } from '../ui';
import type { FormEvent } from 'react';
import type { Note } from '../types';

const EMPTY = { title: '', content: '' };

export function NotesPage() {
  const { data, error, loading, page, setPage, reload } = usePaged<Note>('/notes', {}, 9);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setActionError('');
    try {
      await fn();
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (editingId) await api(`/notes/${editingId}`, { method: 'PATCH', body: form });
      else await api('/notes', { method: 'POST', body: form });
      reset();
    });
  };

  const startEdit = (note: Note) => {
    setEditingId(note._id);
    setForm({ title: note.title, content: note.content });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = (id: string) => {
    if (window.confirm('Delete this note? This cannot be undone.')) run(() => api(`/notes/${id}`, { method: 'DELETE' }));
  };

  return (
    <div className="page">
      <PageHeader title="My notes" subtitle={data ? `${data.total} private note${data.total === 1 ? '' : 's'}, visible only to you` : 'Loading…'} />

      <form className="card stack" onSubmit={submit}>
        <div className="card-title" style={{ marginBottom: 0 }}>
          {editingId ? 'Edit note' : 'New note'}
          {editingId && <span className="badge badge-accent">editing</span>}
        </div>
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="textarea" placeholder="Write something…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <div className="row row-end">
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Save changes' : '+ Add note'}
          </button>
        </div>
      </form>

      <Alert>{error || actionError}</Alert>

      {loading && !data ? (
        <Skeletons count={6} />
      ) : data?.items.length === 0 ? (
        <div className="card">
          <Empty icon="✎" title="No notes yet">Your first note is one click away.</Empty>
        </div>
      ) : (
        <div className="grid-cards">
          {data?.items.map((note) => (
            <article key={note._id} className={`card note-card ${editingId === note._id ? 'editing' : ''}`}>
              <h3>{note.title}</h3>
              <p className="note-body">{note.content || <em>No content</em>}</p>
              <div className="row">
                <span className="note-meta">Updated {timeAgo(note.updatedAt)}</span>
                <span className="spacer" />
                <button className="btn btn-sm btn-ghost" onClick={() => startEdit(note)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(note._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pager data={data} page={page} setPage={setPage} />
    </div>
  );
}
