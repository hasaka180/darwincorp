/**
 * A one-shot signal that the hero's 3D scene has finished loading.
 *
 * The Spline scene is a large download, so the preloader holds until it's
 * ready rather than revealing a half-built hero. Hero calls `markHeroReady()`
 * from Spline's onLoad; Preloader subscribes with `onHeroReady()`.
 *
 * Deliberately module-scope rather than context: the two components are
 * siblings under the page, and this needs no re-render to propagate.
 */

let ready = false;
const waiters = new Set<() => void>();

export function markHeroReady() {
  if (ready) return;
  ready = true;
  for (const fn of waiters) fn();
  waiters.clear();
}

/** Fires immediately if the scene is already in; returns an unsubscribe. */
export function onHeroReady(cb: () => void): () => void {
  if (ready) {
    cb();
    return () => {};
  }
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}
