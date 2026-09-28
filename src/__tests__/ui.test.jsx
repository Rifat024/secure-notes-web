import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar, Pager, RoleBadge, Alert, timeAgo } from '../ui.jsx';
import { splitList } from '../pages/AuthPage.jsx';

describe('Avatar', () => {
  test('shows up to two initials', () => {
    render(<Avatar name="Ada King Lovelace" />);
    expect(screen.getByText('AK')).toBeInTheDocument();
  });

  test('uses a stable colour for the same seed', () => {
    const { container: a } = render(<Avatar name="X" seed="user-1" />);
    const { container: b } = render(<Avatar name="Y" seed="user-1" />);
    expect(a.firstChild.style.background).toBe(b.firstChild.style.background);
  });
});

describe('RoleBadge', () => {
  test('highlights admins', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('★ admin')).toHaveClass('badge-admin');
  });
});

describe('Alert', () => {
  test('renders nothing without content', () => {
    const { container } = render(<Alert />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Pager', () => {
  const data = { page: 2, limit: 10, total: 45, totalPages: 5 };

  test('shows the visible range and total', () => {
    render(<Pager data={data} page={2} setPage={() => {}} />);
    expect(screen.getByText('11–20')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  test('navigates with prev, next and numbered buttons', async () => {
    const setPage = vi.fn();
    render(<Pager data={data} page={2} setPage={setPage} />);
    await userEvent.click(screen.getByText('← Prev'));
    await userEvent.click(screen.getByText('Next →'));
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    expect(setPage.mock.calls).toEqual([[1], [3], [4]]);
  });

  test('disables prev on the first page and next on the last', () => {
    render(<Pager data={{ ...data, page: 5 }} page={5} setPage={() => {}} />);
    expect(screen.getByText('Next →')).toBeDisabled();
    expect(screen.getByText('← Prev')).toBeEnabled();
  });

  test('is hidden when there are no results', () => {
    const { container } = render(<Pager data={{ page: 1, limit: 10, total: 0, totalPages: 0 }} page={1} setPage={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('helpers', () => {
  test('timeAgo formats relative times', () => {
    expect(timeAgo(new Date())).toBe('just now');
    expect(timeAgo(new Date(Date.now() - 5 * 60 * 1000))).toBe('5 minutes ago');
    expect(timeAgo(new Date(Date.now() - 2 * 86400 * 1000))).toBe('2 days ago');
  });

  test('splitList trims and drops blanks', () => {
    expect(splitList(' chess, , reading ,')).toEqual(['chess', 'reading']);
  });
});
