import { useState } from 'react';
import { usePaged } from '../usePaged.js';
import { Alert, Avatar, Empty, PageHeader, Pager, Skeletons } from '../ui.jsx';

export function InterestsPage({ onOpenUser }) {
  const [draft, setDraft] = useState('');
  const [interest, setInterest] = useState('');
  const { data, error, loading, page, setPage } = usePaged('/users/interests', { interest }, 6);
  const max = Math.max(1, ...(data?.items.map((g) => g.count) ?? [1]));

  return (
    <div className="page">
      <PageHeader title="Interests" subtitle="Members grouped by what they care about.">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setInterest(draft.trim().toLowerCase());
          }}
        >
          <input className="input" style={{ width: 220 }} placeholder="Filter, e.g. chess" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="btn btn-primary">
            Filter
          </button>
          {interest && (
            <button type="button" className="btn btn-ghost" onClick={() => { setDraft(''); setInterest(''); }}>
              Clear
            </button>
          )}
        </form>
      </PageHeader>

      <p className="hint">
        ⚙ One <code>aggregate()</code> call: <code>$match</code> (index <code>interests_1</code>) → <code>$unwind</code> → <code>$group</code> → <code>$sort</code> → <code>$facet</code>
      </p>

      <Alert>{error}</Alert>

      {loading && !data ? (
        <Skeletons count={6} />
      ) : data?.items.length === 0 ? (
        <div className="card">
          <Empty icon="✦" title={interest ? `Nobody is into “${interest}” yet` : 'No interests yet'}>
            Add interests from your profile page.
          </Empty>
        </div>
      ) : (
        <div className="grid-cards">
          {data?.items.map((group) => (
            <article key={group.interest} className="card interest-card">
              <div className="row">
                <span className="interest-name">{group.interest}</span>
                <span className="spacer" />
                <span className="badge badge-accent">
                  {group.count} member{group.count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="interest-bar">
                <div style={{ width: `${(group.count / max) * 100}%` }} />
              </div>
              <div className="row" style={{ gap: 6 }}>
                {group.users.map((u) => (
                  <button key={u._id} className="member" onClick={() => onOpenUser(u._id)} title={`View ${u.name}'s posts`}>
                    <Avatar name={u.name} seed={u._id} />
                    {u.name}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <Pager data={data} page={page} setPage={setPage} />
    </div>
  );
}
