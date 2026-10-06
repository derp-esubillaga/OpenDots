import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { nextPreference, resolveTheme } from '../src/client/theme';
import { ThemeButton } from '../src/client/ThemeButton';

describe('theme preference', () => {
  it('cycles auto, light, dark and back', () => {
    expect(nextPreference('auto')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('auto');
  });
  it('follows the system only in auto', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
  it('renders without a DOM and labels the next choice', () => {
    const rail = renderToStaticMarkup(
      createElement(ThemeButton, { variant: 'rail' }),
    );
    expect(rail).toContain('Appearance: auto. Switch to light');
    const nav = renderToStaticMarkup(
      createElement(ThemeButton, { variant: 'nav' }),
    );
    expect(nav).toContain('<small>Auto</small>');
  });
});
