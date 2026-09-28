import { usePaged } from '../usePaged.js';
import { Pager } from '../Pager.jsx';

export function UserPostsPage({ userId }) {
  const { data, error, page, setPage } = usePaged(`/users/${userId}/posts`, {}, 5);

  return (
    <section>
      <h2>Posts by {data?.author.name ?? '…'}</h2>
      {data?.author.interests?.length > 0 && <p>Interests: {data.author.interests.join(', ')}</p>}
      <p><small>Served by one aggregation pipeline: $match on users → $lookup into posts.</small></p>
      {error && <p className="error">{error}</p>}
      {data?.items.length === 0 && <p>No posts yet.</p>}
      {data?.items.map((post) => (
        <article key={post._id}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <small>{new Date(post.createdAt).toLocaleString()}</small>
          <hr />
        </article>
      ))}
      <Pager data={data} page={page} setPage={setPage} />
    </section>
  );
}
