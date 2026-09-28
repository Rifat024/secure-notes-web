export function Pager({ data, page, setPage }) {
  if (!data) return null;
  return (
    <div className="row">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
      <span>
        Page {data.page} of {Math.max(1, data.totalPages)} ({data.total} total)
      </span>
      <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}
