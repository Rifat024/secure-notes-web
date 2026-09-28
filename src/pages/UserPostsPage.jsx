import { usePaged } from '../usePaged.js';
import { Alert, Avatar, Empty, Pager, timeAgo } from '../ui.jsx';

export function UserPostsPage({ userId, onBack }) {
  const { data, error, page, setPage } = usePaged(`/users/${userId}/posts`, {}, 5);
  const author = data?.author;

  return (
    <div className="page">
      <div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to posts
        </button>
      </div>

      <div className="card profile-hero">
        <Avatar name={author?.name ?? '…'} seed={author?._id} size="lg" />
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="page-title">{author?.name ?? 'Loading…'}</h1>
          <div className="row">
            <span className="badge badge-accent">{data?.total ?? 0} posts</span>
            {author?.interests?.map((interest) => (
              <span key={interest} className="tag">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="hint">
        ⚙ Served by one aggregation: <code>$match</code> on users → <code>$lookup</code> into posts (index <code>author_1__id_-1</code>)
      </p>

      <Alert>{error}</Alert>

      {data?.items.length === 0 && (
        <div className="card">
          <Empty icon="◈" title="Nothing published yet" />
        </div>
      )}

      <div className="stack">
        {data?.items.map((post) => (
          <article key={post._id} className="card stack" style={{ gap: 6 }}>
            <div className="row">
              <div className="post-title">{post.title}</div>
              <span className="spacer" />
              <span className="cell-sub">{timeAgo(post.createdAt)}</span>
            </div>
            <p className="post-body">{post.body}</p>
          </article>
        ))}
      </div>

      <Pager data={data} page={page} setPage={setPage} />
    </div>
  );
}
