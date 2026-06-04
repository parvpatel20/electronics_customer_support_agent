import { useEffect } from 'react';
import { API_BASE } from './api.js';

// Pings the backend's /health endpoint on a slow interval while the app is
// mounted in the browser. This is defense-in-depth for the GitHub Actions
// keep-alive workflow — if some user has the deployed frontend open, the
// backend stays warm even between cron runs.
//
// Interval is set high (5 min) so the noise is minimal, and the request
// runs in `no-cors` mode + is fire-and-forget: we never block UI on it,
// never show errors to the user, and never log anything.
const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000;

export default function useKeepAlive(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    if (typeof fetch !== 'function') return undefined;

    let cancelled = false;

    const ping = () => {
      if (cancelled) return;
      // Fire-and-forget. `no-cors` so the request never fails on the
      // client side (an opaque response is fine — we only care that
      // the network packet landed on the server).
      try {
        fetch(`${API_BASE}/health`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    };

    // First ping after a short delay so we don't fight the initial page load.
    const initial = window.setTimeout(ping, 30 * 1000);
    const interval = window.setInterval(ping, KEEPALIVE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [enabled]);
}
