import { useSyncExternalStore } from 'react';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';
export interface ThemeSnapshot {
  preference: ThemePreference;
  effective: EffectiveTheme;
}

/** Stores 'light' or 'dark'; the key is removed for 'auto'. */
export const THEME_STORAGE_KEY = 'opendots:theme';
const ORDER: ThemePreference[] = ['auto', 'light', 'dark'];
const META_COLORS: Record<EffectiveTheme, string> = {
  light: '#ffffff',
  dark: '#1a1b20',
};
const QUERY = '(prefers-color-scheme: dark)';

export function nextPreference(preference: ThemePreference): ThemePreference {
  return ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): EffectiveTheme {
  if (preference === 'auto') return systemDark ? 'dark' : 'light';
  return preference;
}

export function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function writePreference(preference: ThemePreference) {
  try {
    if (preference === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
}

function systemDark(): boolean {
  try {
    return window.matchMedia(QUERY).matches;
  } catch {
    return false;
  }
}

export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === 'auto') delete root.dataset.theme;
  else root.dataset.theme = preference;
  const effective = resolveTheme(preference, systemDark());
  // A manual override should also recolor mobile browser chrome.
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    meta.content =
      preference === 'auto'
        ? META_COLORS[meta.media.includes('dark') ? 'dark' : 'light']
        : META_COLORS[effective];
  }
}

export function initTheme() {
  applyTheme(readPreference());
}

const serverSnapshot: ThemeSnapshot = {
  preference: 'auto',
  effective: 'light',
};
let snapshot: ThemeSnapshot | undefined;
const listeners = new Set<() => void>();
let detach: (() => void) | undefined;

function compute(): ThemeSnapshot {
  const preference = readPreference();
  return { preference, effective: resolveTheme(preference, systemDark()) };
}

function refresh() {
  const next = compute();
  if (
    snapshot &&
    snapshot.preference === next.preference &&
    snapshot.effective === next.effective
  )
    return;
  snapshot = next;
  applyTheme(next.preference);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!detach) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) refresh();
    };
    let media: MediaQueryList | undefined;
    try {
      media = window.matchMedia(QUERY);
      media.addEventListener('change', refresh);
    } catch {
      media = undefined;
    }
    window.addEventListener('storage', onStorage);
    detach = () => {
      media?.removeEventListener('change', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      detach?.();
      detach = undefined;
    }
  };
}

function getSnapshot(): ThemeSnapshot {
  return (snapshot ??= compute());
}

function setPreference(preference: ThemePreference) {
  writePreference(preference);
  refresh();
}

export function useTheme() {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );
  return {
    ...current,
    cycle: () => setPreference(nextPreference(current.preference)),
  };
}
