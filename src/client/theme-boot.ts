// Listed before main.tsx in index.html, so this runs before React renders.
// Vite folds both entry scripts into one 'self' bundle, which the CSP allows;
// an inline script would be blocked. Auto (the default) needs no script: the
// prefers-color-scheme rule in style.css covers the first paint.
import { initTheme } from './theme';

initTheme();
