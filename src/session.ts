import { useEffect, useRef, useState } from 'react';
import { tokenSecondsLeft } from './api';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const IDLE_WARNING_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

export type ExpireReason = 'idle' | 'expired' | 'revoked';

interface SessionGuardOptions {
  token: string | null;
  onExpire: (reason: ExpireReason) => void;
  idleMs?: number;
  warnMs?: number;
}

/**
 * Signs the user out after a period of inactivity or when the token expires, and exposes a
 * countdown for the final minute so the user can stay signed in.
 */
export function useSessionGuard({ token, onExpire, idleMs = IDLE_TIMEOUT_MS, warnMs = IDLE_WARNING_MS }: SessionGuardOptions) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    if (!token) return undefined;
    lastActivity.current = Date.now();

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const tick = () => {
      const tokenLeft = tokenSecondsLeft(token);
      if (tokenLeft !== null && tokenLeft <= 0) return expireRef.current('expired');
      const idleLeftMs = idleMs - (Date.now() - lastActivity.current);
      if (idleLeftMs <= 0) return expireRef.current('idle');
      setSecondsLeft(idleLeftMs <= warnMs ? Math.ceil(idleLeftMs / 1000) : null);
    };
    const interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, [token, idleMs, warnMs]);

  const stayActive = () => {
    lastActivity.current = Date.now();
    setSecondsLeft(null);
  };

  return { secondsLeft, stayActive };
}

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'letter', label: 'A letter', test: (p) => /[A-Za-z]/.test(p) },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p) },
];

export const meetsPasswordPolicy = (password: string): boolean => PASSWORD_RULES.every((rule) => rule.test(password));

/** 0–4 strength score used for the meter; the policy only requires the three rules above. */
export function passwordScore(password: string): number {
  if (!password) return 0;
  let score = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  if (score === 3 && password.length >= 12 && /[^A-Za-z0-9]/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password)) score = 4;
  return Math.max(1, score);
}
