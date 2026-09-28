import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppearanceProvider, ModeToggle, AccentPicker } from '../appearance.jsx';

const renderControls = () =>
  render(
    <AppearanceProvider>
      <ModeToggle />
      <AccentPicker />
    </AppearanceProvider>,
  );

describe('appearance', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.accent;
  });

  test('defaults to following the system mode with the violet theme', () => {
    renderControls();
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(screen.getByTitle('System mode')).toHaveAttribute('aria-pressed', 'true');
  });

  test('switches between light, dark, and system mode', async () => {
    renderControls();
    await userEvent.click(screen.getByTitle('Dark mode'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    await userEvent.click(screen.getByTitle('Light mode'));
    expect(document.documentElement.dataset.theme).toBe('light');
    await userEvent.click(screen.getByTitle('System mode'));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('changes the accent theme', async () => {
    renderControls();
    await userEvent.click(screen.getByLabelText('Sunset theme'));
    expect(document.documentElement.dataset.accent).toBe('sunset');
    expect(screen.getByLabelText('Sunset theme')).toHaveAttribute('aria-pressed', 'true');
  });

  test('remembers the choice across visits', async () => {
    const { unmount } = renderControls();
    await userEvent.click(screen.getByTitle('Light mode'));
    await userEvent.click(screen.getByLabelText('Ocean theme'));
    unmount();
    delete document.documentElement.dataset.theme;

    renderControls();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.accent).toBe('ocean');
  });
});
