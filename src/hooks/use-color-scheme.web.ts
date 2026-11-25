import { useSyncExternalStore } from 'react';

// On the web the page is first rendered on the server, which can't know the
// visitor's light/dark preference. Reporting "light" for that first render
// (the server snapshot) and the real preference right after hydration keeps
// every screen on the same theme instead of a light/dark mix.
const query = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const getSnapshot = () => (window.matchMedia(query).matches ? 'dark' : 'light');
const getServerSnapshot = () => 'light' as const;

export function useColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
