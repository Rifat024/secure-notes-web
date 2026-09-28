import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../api.js', () => ({ api: vi.fn() }));

const { api } = await import('../api.js');
const { AuthPage: Page } = await import('../pages/AuthPage.jsx');
const { AppearanceProvider } = await import('../appearance.jsx');
const { ApiError } = await vi.importActual('../api.js');

const AuthPage = (props) => (
  <AppearanceProvider>
    <Page {...props} />
  </AppearanceProvider>
);

describe('AuthPage', () => {
  test('logs in with email and password', async () => {
    const session = { token: 't', user: { name: 'Ada' } };
    api.mockResolvedValue(session);
    const onAuth = vi.fn();
    render(<AuthPage onAuth={onAuth} />);

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(api).toHaveBeenCalledWith('/auth/login', { method: 'POST', body: { email: 'ada@example.com', password: 'Password123' } });
    expect(onAuth).toHaveBeenCalledWith(session);
  });

  test('registers with name and parsed interests', async () => {
    api.mockResolvedValue({ token: 't', user: {} });
    render(<AuthPage onAuth={() => {}} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Create account' }));
    await userEvent.type(screen.getByPlaceholderText('Ada Lovelace'), 'Ada');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'Password123');
    await userEvent.type(screen.getByPlaceholderText('chess, reading, travel'), 'Chess, reading');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(api).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { name: 'Ada', email: 'ada@example.com', password: 'Password123', interests: ['Chess', 'reading'] },
    });
  });

  test('keeps register disabled until the password meets the policy', async () => {
    render(<AuthPage onAuth={() => {}} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Create account' }));
    const password = screen.getByPlaceholderText('At least 8 characters');
    await userEvent.type(password, 'letters');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
    expect(screen.getByText(/A number/)).not.toHaveClass('met');
    await userEvent.type(password, '123');
    expect(screen.getByText(/A number/)).toHaveClass('met');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  test('shows a countdown and disables sign-in while locked out', async () => {
    api.mockRejectedValue(new ApiError('Too many failed sign-in attempts. Please try again later.', 429, 900));
    render(<AuthPage onAuth={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'wrong-password1');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText(/You can try again in 15 min/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Locked/ })).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'x');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
    expect(screen.queryByText(/You can try again/)).not.toBeInTheDocument();
  });

  test('shows why the user was signed out', () => {
    render(<AuthPage onAuth={() => {}} notice="You were signed out after 30 minutes of inactivity." />);
    expect(screen.getByText('You were signed out after 30 minutes of inactivity.')).toBeInTheDocument();
  });

  test('shows the server error on failure', async () => {
    api.mockRejectedValue(new Error('Invalid email or password'));
    const onAuth = vi.fn();
    render(<AuthPage onAuth={onAuth} />);

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(onAuth).not.toHaveBeenCalled();
  });
});
