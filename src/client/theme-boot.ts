// Loaded as its own module entry before main.tsx so the saved theme applies
// before the app bundle arrives, without an inline script (CSP is 'self').
import { initTheme } from './theme';

initTheme();
