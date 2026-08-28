/**
 * A signal for "the preloader is out of the way and the page is visible".
 *
 * The home-page preloader can hold for up to ~10s while the 3D hero loads, so
 * anything that wants to appear a set time "after the page loads" — the promo
 * popup — has to count from here, not from mount, or it opens behind the
 * preloader's overlay.
 *
 * Same module-scope shape as `heroLoad`: the components are siblings and this
 * needs no re-render to propagate.
 */

// Starts true: only the home page has a preloader, and it flips this to false
// as it mounts (its effect runs before the layout-level overlays subscribe).
// Every other route is visible the moment it renders.
let revealed = true;
const waiters = new Set<() => void>();

/** The preloader is on screen again (it replays on every mount of `/`). */
export function markPageCovered() {
  revealed = false;
}

export function markPageRevealed() {
  if (revealed) return;
  revealed = true;
  for (const fn of waiters) fn();
  waiters.clear();
}

/** Fires immediately if the page is already visible; returns an unsubscribe. */
export function onPageRevealed(cb: () => void): () => void {
  if (revealed) {
    cb();
    return () => {};
  }
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}
