import { useState } from 'react';
import { usePaged } from '../usePaged.js';
import { Pager } from '../Pager.jsx';

export function InterestsPage({ onOpenUser }) {
  const [draft, setDraft] = useState('');
  const [interest, setInterest] = useState('');
  const { data, error, page, setPage } = usePaged('/users/interests', { interest }, 5);

  return (
    <section>
      <h2>Users grouped by interest</h2>
      <p><small>Served by a single aggregate() call: $match → $unwind → $group → $sort → $facet.</small></p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setInterest(draft.trim().toLowerCase()); }}>
        <input placeholder="Filter by one interest (optional)" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit">Apply</button>
        <button type="button" onClick={() => { setDraft(''); setInterest(''); }}>Clear</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Interest</th><th>Users</th><th>Members</th></tr>
        </thead>
        <tbody>
          {data?.items.map((group) => (
            <tr key={group.interest}>
              <td>{group.interest}</td>
              <td>{group.count}</td>
              <td>
                {group.users.map((u) => (
                  <button key={u._id} onClick={() => onOpenUser(u._id)} style={{ margin: 2 }}>
                    {u.name}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager data={data} page={page} setPage={setPage} />
    </section>
  );
}
