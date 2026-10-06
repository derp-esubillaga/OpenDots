import { Moon, Sun, SunMoon } from 'lucide-react';
import { nextPreference, useTheme, type ThemePreference } from './theme';

const LABEL: Record<ThemePreference, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};
const ICON = { auto: SunMoon, light: Sun, dark: Moon };

export function ThemeButton({ variant }: { variant: 'rail' | 'nav' }) {
  const { preference, cycle } = useTheme();
  const Icon = ICON[preference];
  const label = `Appearance: ${LABEL[preference].toLowerCase()}. Switch to ${LABEL[nextPreference(preference)].toLowerCase()}`;
  if (variant === 'rail')
    return (
      <button
        className="rail-theme"
        aria-label={label}
        title={label}
        onClick={cycle}
      >
        <Icon size={18} />
      </button>
    );
  return (
    <button className="nav-item" aria-label={label} onClick={cycle}>
      <Icon size={17} />
      <span>Appearance</span>
      <small>{LABEL[preference]}</small>
    </button>
  );
}
