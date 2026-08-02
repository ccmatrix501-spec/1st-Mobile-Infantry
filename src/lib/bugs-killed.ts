/**
 * Shared bugs-killed tally.
 *
 * Time-based and deterministic: every visitor (and the server) compute the same
 * number from wall-clock time. The total keeps climbing even when no one has
 * the page open — nothing needs to "run" in the background.
 */

/**
 * Moment the shared tally begins.
 * Set near “now” so the public starting figure stays close to BUGS_KILLED_BASE.
 */
export const BUGS_KILLED_EPOCH_MS = Date.UTC(2026, 7, 2, 3, 0, 0); // 2026-08-02 03:00 UTC

/** Public starting count at the epoch. */
export const BUGS_KILLED_BASE = 2_345_870;

/** Steady kills per second (shared world rate). */
export const BUGS_KILLS_PER_SEC = 73;

/**
 * Extra kills every N seconds — still deterministic, adds a little shape so the
 * feed doesn't look perfectly linear.
 */
const BURST_EVERY_SEC = 11;
const BURST_SIZE = 180;

/** Authoritative count at a given instant (ms since epoch). */
export function getBugsKilledAt(nowMs: number = Date.now()): number {
  const elapsedMs = Math.max(0, nowMs - BUGS_KILLED_EPOCH_MS);
  const elapsedSec = elapsedMs / 1000;
  const steady = Math.floor(elapsedSec * BUGS_KILLS_PER_SEC);
  const bursts = Math.floor(elapsedSec / BURST_EVERY_SEC) * BURST_SIZE;
  // Sub-second ticks so the UI can animate between whole seconds without inventing kills
  const sub = Math.floor((elapsedMs % 1000) / 40); // ~0–24 per second of "micro" kills
  return BUGS_KILLED_BASE + steady + bursts + sub;
}
