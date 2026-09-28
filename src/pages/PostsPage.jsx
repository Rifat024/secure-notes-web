import { useState } from 'react';
import { api } from '../api.js';
import { usePaged } from '../usePaged.js';
import { Pager } from '../Pager.jsx';

export function PostsPage({ currentUser, onOpenUser }) {
  const { data, error, page, setPage, reload } = usePaged('/posts');
  const [form, setForm] = useState({ title: '', body: '' });
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
      await api('/posts', { method: 'POST', body: form });
      setForm({ title: '', body: '' });
    });
  };

  const canDelete = (post) => currentUser.role === 'admin' || post.author?._id === currentUser._id;

  return (
    <section>
      <h2>Posts (public)</h2>
      <form onSubmit={submit}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        <button type="submit">Publish post</button>
      </form>
      <p>
        <button onClick={() => onOpenUser(currentUser._id)}>View my posts ($lookup)</button>
      </p>
      {(error || actionError) && <p className="error">{error || actionError}</p>}
      <table>
        <thead>
          <tr><th>Title</th><th>Body</th><th>Author</th><th /></tr>
        </thead>
        <tbody>
          {data?.items.map((post) => (
            <tr key={post._id}>
              <td>{post.title}</td>
              <td>{post.body}</td>
              <td>
                {post.author ? <button onClick={() => onOpenUser(post.author._id)}>{post.author.name}</button> : 'deleted user'}
              </td>
              <td>
                {canDelete(post) && (
                  <button onClick={() => run(() => api(`/posts/${post._id}`, { method: 'DELETE' }))}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager data={data} page={page} setPage={setPage} />
    </section>
  );
}
