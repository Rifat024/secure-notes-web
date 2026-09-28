import { describe, expect, test, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { meetsPasswordPolicy, passwordScore, useSessionGuard } from '../src/session';

const tokenExpiringIn = (seconds: number) => `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.s`;

describe('password policy', () => {
  test.each([
    ['short1', false],
    ['onlyletters', false],
    ['12345678', false],
    ['letters123', true],
  ])('%s meets policy: %s', (password, expected) => {
    expect(meetsPasswordPolicy(password)).toBe(expected);
  });

  test('scores strength from 0 to 4', () => {
    expect(passwordScore('')).toBe(0);
    expect(passwordScore('abc')).toBe(1);
    expect(passwordScore('letters123')).toBe(3);
    expect(passwordScore('Longer-Pass-123')).toBe(4);
  });
});

describe('useSessionGuard', () => {
  afterEach(() => vi.useRealTimers());

  test('warns during the final minute and signs out when idle', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const token = tokenExpiringIn(3600);
    const { result } = renderHook(() => useSessionGuard({ token, onExpire, idleMs: 5000, warnMs: 2000 }));

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBeNull();
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBeLessThanOrEqual(2);
    act(() => vi.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalledWith('idle');
  });

  test('activity resets the idle timer', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const token = tokenExpiringIn(3600);
    const { result } = renderHook(() => useSessionGuard({ token, onExpire, idleMs: 5000, warnMs: 2000 }));

    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.stayActive());
    act(() => vi.advanceTimersByTime(4000));
    expect(onExpire).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(new Event('keydown')));
    act(() => vi.advanceTimersByTime(4000));
    expect(onExpire).not.toHaveBeenCalled();
  });

  test('signs out when the token itself expires', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const token = tokenExpiringIn(2);
    renderHook(() => useSessionGuard({ token, onExpire }));
    act(() => vi.advanceTimersByTime(4000));
    expect(onExpire).toHaveBeenCalledWith('expired');
  });

  test('does nothing without a session', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    renderHook(() => useSessionGuard({ token: null, onExpire, idleMs: 1000 }));
    act(() => vi.advanceTimersByTime(5000));
    expect(onExpire).not.toHaveBeenCalled();
  });
});
