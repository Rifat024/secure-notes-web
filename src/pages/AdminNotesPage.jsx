import { useState } from 'react';
import { usePaged } from '../usePaged.js';
import { Pager } from '../Pager.jsx';

export function AdminNotesPage() {
  const [ownerDraft, setOwnerDraft] = useState('');
  const [owner, setOwner] = useState('');
  const { data, error, page, setPage } = usePaged('/admin/notes', { owner });

  return (
    <section>
      <h2>Everyone's notes</h2>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setOwner(ownerDraft.trim()); }}>
        <input placeholder="Filter by owner user id (optional)" value={ownerDraft} onChange={(e) => setOwnerDraft(e.target.value)} size={30} />
        <button type="submit">Apply</button>
        <button type="button" onClick={() => { setOwnerDraft(''); setOwner(''); }}>Clear</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Owner</th><th>Title</th><th>Content</th><th>Created</th></tr>
        </thead>
        <tbody>
          {data?.items.map((note) => (
            <tr key={note._id}>
              <td>
                {note.owner ? (
                  <button onClick={() => { setOwnerDraft(note.owner._id); setOwner(note.owner._id); }}>
                    {note.owner.name} &lt;{note.owner.email}&gt;
                  </button>
                ) : 'deleted user'}
              </td>
              <td>{note.title}</td>
              <td style={{ whiteSpace: 'pre-wrap' }}>{note.content}</td>
              <td>{new Date(note.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager data={data} page={page} setPage={setPage} />
    </section>
  );
}
