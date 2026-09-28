import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../api.js', () => ({
  api: vi.fn(),
  tokenStore: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
}));

const { api, tokenStore } = await import('../api.js');
const { App } = await import('../App.jsx');

const emptyPage = { items: [], page: 1, limit: 9, total: 0, totalPages: 0 };

function mockSession(user) {
  tokenStore.get.mockReturnValue('token');
  api.mockImplementation(async (path) => (path === '/auth/me' ? user : emptyPage));
}

describe('App', () => {
  test('shows the login screen without a token', () => {
    tokenStore.get.mockReturnValue(null);
    render(<App />);
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  test('hides admin navigation from regular users', async () => {
    mockSession({ _id: 'u1', name: 'Alice', role: 'user', interests: [] });
    render(<App />);
    expect(await screen.findByTitle('My notes')).toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Users')).not.toBeInTheDocument();
  });

  test('shows admin navigation to admins', async () => {
    mockSession({ _id: 'a1', name: 'Admin', role: 'admin', interests: [] });
    render(<App />);
    expect(await screen.findByText('Administration')).toBeInTheDocument();
    expect(screen.getByTitle('Users')).toBeInTheDocument();
    expect(screen.getByTitle('All notes')).toBeInTheDocument();
  });

  test('drops an invalid stored session', async () => {
    tokenStore.get.mockReturnValue('stale');
    api.mockRejectedValue(new Error('Invalid or expired token'));
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(tokenStore.clear).toHaveBeenCalled();
  });
});
