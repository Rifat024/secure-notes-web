import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'secure-notes-appearance';

export type Mode = 'light' | 'system' | 'dark';
export type Accent = 'violet' | 'ocean' | 'emerald' | 'sunset';

export const MODES: readonly { value: Mode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'system', label: 'System', icon: '◐' },
  { value: 'dark', label: 'Dark', icon: '☾' },
];

export const ACCENTS: readonly { value: Accent; label: string; colors: readonly [string, string] }[] = [
  { value: 'violet', label: 'Violet', colors: ['#7c5cff', '#22d3ee'] },
  { value: 'ocean', label: 'Ocean', colors: ['#3b82f6', '#2dd4bf'] },
  { value: 'emerald', label: 'Emerald', colors: ['#10b981', '#a3e635'] },
  { value: 'sunset', label: 'Sunset', colors: ['#f97316', '#ec4899'] },
];

interface Prefs {
  mode: Mode;
  accent: Accent;
}

interface AppearanceValue extends Prefs {
  setMode: (mode: Mode) => void;
  setAccent: (accent: Accent) => void;
}

const DEFAULTS: Prefs = { mode: 'system', accent: 'violet' };

function readPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

function applyPrefs({ mode, accent }: Prefs): void {
  const root = document.documentElement;
  if (mode === 'system') delete root.dataset.theme;
  else root.dataset.theme = mode;
  root.dataset.accent = accent;
}

const AppearanceContext = createContext<AppearanceValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
  }, [prefs]);

  const setMode = useCallback((mode: Mode) => setPrefs((p) => ({ ...p, mode })), []);
  const setAccent = useCallback((accent: Accent) => setPrefs((p) => ({ ...p, accent })), []);
  const value = useMemo(() => ({ ...prefs, setMode, setAccent }), [prefs, setMode, setAccent]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return value;
}

export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useAppearance();
  return (
    <div className={`segmented ${compact ? 'segmented-compact' : ''}`} role="group" aria-label="Colour mode">
      {MODES.map((m) => (
        <button key={m.value} type="button" aria-pressed={mode === m.value} title={`${m.label} mode`} onClick={() => setMode(m.value)}>
          <span aria-hidden="true">{m.icon}</span>
          {!compact && m.label}
        </button>
      ))}
    </div>
  );
}

export function AccentPicker() {
  const { accent, setAccent } = useAppearance();
  return (
    <div className="swatches" role="group" aria-label="Accent colour">
      {ACCENTS.map((a) => (
        <button
          key={a.value}
          type="button"
          className="swatch"
          aria-pressed={accent === a.value}
          aria-label={`${a.label} theme`}
          title={a.label}
          style={{ background: `linear-gradient(135deg, ${a.colors[0]}, ${a.colors[1]})` }}
          onClick={() => setAccent(a.value)}
        />
      ))}
    </div>
  );
}
