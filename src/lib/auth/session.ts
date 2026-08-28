/**
 * Shared constants for the inactivity-timeout mechanism used across both
 * the CRM and blog dashboards. This file holds no logic — it's the single
 * definition of the timeout window and cookie name so the three
 * enforcement points below can't drift out of sync with each other.
 */

// Inactivity timeout for the admin / dashboard areas. After this long with no
// interaction the session is dropped and the user has to sign in again.
// Enforced in three places that all read the same window:
//   - IdleTimeout.tsx  — client timer, reacts while the user just sits there
//   - proxy.ts         — server backstop on every gated page load
//   - requireAdmin()   — server actions refuse (and slide) on each mutation
export const IDLE_TIMEOUT_MINUTES = 30;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

// Rolling "last seen" timestamp (epoch ms, as a string). Session-scoped like
// the Supabase auth cookies, so it also clears when the browser closes.
export const ACTIVITY_COOKIE = "tp_seen";
