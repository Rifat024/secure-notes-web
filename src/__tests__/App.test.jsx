import { describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../api.js', () => ({
  api: vi.fn(),
  tokenStore: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
  tokenSecondsLeft: () => 3600,
  SESSION_EXPIRED_EVENT: 'secure-notes:session-expired',
}));

const { api, tokenStore } = await import('../api.js');
const { App } = await import('../App.jsx');
const { AppearanceProvider } = await import('../appearance.jsx');

const renderApp = () => render(<AppearanceProvider><App /></AppearanceProvider>);

const emptyPage = { items: [], page: 1, limit: 9, total: 0, totalPages: 0 };

function mockSession(user) {
  tokenStore.get.mockReturnValue('token');
  api.mockImplementation(async (path) => (path === '/auth/me' ? user : emptyPage));
}

describe('App', () => {
  test('shows the login screen without a token', () => {
    tokenStore.get.mockReturnValue(null);
    renderApp();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  test('hides admin navigation from regular users', async () => {
    mockSession({ _id: 'u1', name: 'Alice', role: 'user', interests: [] });
    renderApp();
    expect(await screen.findByTitle('My notes')).toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Users')).not.toBeInTheDocument();
  });

  test('shows admin navigation to admins', async () => {
    mockSession({ _id: 'a1', name: 'Admin', role: 'admin', interests: [] });
    renderApp();
    expect(await screen.findByText('Administration')).toBeInTheDocument();
    expect(screen.getByTitle('Users')).toBeInTheDocument();
    expect(screen.getByTitle('All notes')).toBeInTheDocument();
  });

  test('logout revokes the session on the server', async () => {
    mockSession({ _id: 'u1', name: 'Alice', role: 'user', interests: [] });
    renderApp();
    await userEvent.click(await screen.findByTitle('Log out'));
    expect(api).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
    expect(tokenStore.clear).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  test('a revoked token elsewhere returns the user to the login screen with a notice', async () => {
    mockSession({ _id: 'u1', name: 'Alice', role: 'user', interests: [] });
    renderApp();
    await screen.findByTitle('My notes');
    act(() => window.dispatchEvent(new Event('secure-notes:session-expired')));
    expect(await screen.findByText('Your session ended. Please sign in again.')).toBeInTheDocument();
  });

  test('drops an invalid stored session', async () => {
    tokenStore.get.mockReturnValue('stale');
    api.mockRejectedValue(new Error('Invalid or expired token'));
    renderApp();
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(tokenStore.clear).toHaveBeenCalled();
  });
});
