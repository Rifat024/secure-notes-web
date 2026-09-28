import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../api.js', () => ({ api: vi.fn() }));

const { api } = await import('../api.js');
const { NotesPage } = await import('../pages/NotesPage.jsx');

const note = { _id: 'n1', title: 'Groceries', content: 'milk', updatedAt: new Date().toISOString() };
const page = (items) => ({ items, page: 1, limit: 9, total: items.length, totalPages: items.length ? 1 : 0 });

describe('NotesPage', () => {
  beforeEach(() => {
    api.mockImplementation(async (path, opts = {}) => (opts.method ? {} : page([note])));
  });

  test('lists the user notes', async () => {
    render(<NotesPage />);
    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('1 private note, visible only to you')).toBeInTheDocument();
  });

  test('shows an empty state', async () => {
    api.mockResolvedValue(page([]));
    render(<NotesPage />);
    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  test('creates a note and reloads the list', async () => {
    render(<NotesPage />);
    await screen.findByText('Groceries');
    await userEvent.type(screen.getByPlaceholderText('Title'), 'New idea');
    await userEvent.type(screen.getByPlaceholderText('Write something…'), 'details');
    await userEvent.click(screen.getByRole('button', { name: '+ Add note' }));

    expect(api).toHaveBeenCalledWith('/notes', { method: 'POST', body: { title: 'New idea', content: 'details' } });
    await waitFor(() => expect(api.mock.calls.filter(([, o]) => !o?.method).length).toBeGreaterThanOrEqual(2));
  });

  test('edits an existing note with PATCH', async () => {
    render(<NotesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const title = screen.getByPlaceholderText('Title');
    expect(title).toHaveValue('Groceries');
    await userEvent.clear(title);
    await userEvent.type(title, 'Shopping');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(api).toHaveBeenCalledWith('/notes/n1', { method: 'PATCH', body: { title: 'Shopping', content: 'milk' } });
  });

  test('deletes after confirmation only', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<NotesPage />);
    const del = await screen.findByRole('button', { name: 'Delete' });
    await userEvent.click(del);
    expect(api).not.toHaveBeenCalledWith('/notes/n1', { method: 'DELETE' });
    await userEvent.click(del);
    expect(api).toHaveBeenCalledWith('/notes/n1', { method: 'DELETE' });
    expect(confirm).toHaveBeenCalledTimes(2);
  });
});
