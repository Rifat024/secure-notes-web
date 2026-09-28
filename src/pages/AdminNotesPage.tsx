import { useState } from 'react';
import { usePaged } from '../usePaged';
import { Alert, Avatar, Empty, PageHeader, Pager, timeAgo } from '../ui';
import type { AdminNote, UserSummary } from '../types';

export function AdminNotesPage() {
  const [owner, setOwner] = useState<UserSummary | null>(null);
  const { data, error, page, setPage } = usePaged<AdminNote>('/admin/notes', { owner: owner?._id });

  return (
    <div className="page">
      <PageHeader title="All notes" subtitle={data ? `${data.total} notes${owner ? ` by ${owner.name}` : ' across every member'}` : 'Loading…'}>
        {owner && (
          <span className="member" onClick={() => setOwner(null)} role="button" title="Clear filter">
            <Avatar name={owner.name} seed={owner._id} />
            {owner.name} ✕
          </span>
        )}
      </PageHeader>

      <p className="hint">Click an owner to filter by them. That query uses the <code>owner_1__id_-1</code> index.</p>

      <Alert>{error}</Alert>

      <div className="card">
        {data?.items.length === 0 ? (
          <Empty icon="▤" title="No notes found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((note) => (
                  <tr key={note._id}>
                    <td>
                      {note.owner ? (
                        <button className="member" onClick={() => setOwner(note.owner)}>
                          <Avatar name={note.owner.name} seed={note.owner._id} />
                          {note.owner.name}
                        </button>
                      ) : (
                        <span className="cell-sub">deleted user</span>
                      )}
                    </td>
                    <td>{note.title}</td>
                    <td className="cell-clip">{note.content}</td>
                    <td className="cell-sub">{timeAgo(note.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Pager data={data} page={page} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
