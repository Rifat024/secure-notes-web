import { useState } from 'react';
import { api } from '../api.js';
import { usePaged } from '../usePaged.js';
import { Alert, Avatar, Empty, PageHeader, Pager, timeAgo } from '../ui.jsx';

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
    <div className="page">
      <PageHeader title="Community posts" subtitle="Posts are public and visible to every member.">
        <button className="btn" onClick={() => onOpenUser(currentUser._id)}>
          My posts →
        </button>
      </PageHeader>

      <form className="card stack" onSubmit={submit}>
        <div className="post">
          <Avatar name={currentUser.name} seed={currentUser._id} />
          <div className="post-content">
            <input className="input" placeholder="Give your post a title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="textarea" placeholder="What's on your mind?" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            <div className="row row-end">
              <button type="submit" className="btn btn-primary">
                Publish
              </button>
            </div>
          </div>
        </div>
      </form>

      <Alert>{error || actionError}</Alert>

      {data?.items.length === 0 && (
        <div className="card">
          <Empty icon="◈" title="No posts yet">Be the first to share something.</Empty>
        </div>
      )}

      <div className="stack">
        {data?.items.map((post) => (
          <article key={post._id} className="card post">
            <Avatar name={post.author?.name ?? '?'} seed={post.author?._id} />
            <div className="post-content">
              <div className="post-head">
                {post.author ? (
                  <button className="link" onClick={() => onOpenUser(post.author._id)}>
                    {post.author.name}
                  </button>
                ) : (
                  <span className="cell-sub">deleted user</span>
                )}
                <span className="cell-sub">· {timeAgo(post.createdAt)}</span>
                <span className="spacer" />
                {canDelete(post) && (
                  <button className="btn btn-sm btn-danger" onClick={() => run(() => api(`/posts/${post._id}`, { method: 'DELETE' }))}>
                    Delete
                  </button>
                )}
              </div>
              <div className="post-title">{post.title}</div>
              <p className="post-body">{post.body}</p>
            </div>
          </article>
        ))}
      </div>

      <Pager data={data} page={page} setPage={setPage} />
    </div>
  );
}
