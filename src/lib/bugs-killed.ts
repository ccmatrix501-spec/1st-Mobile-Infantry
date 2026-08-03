/**
 * Shared bugs-killed tally.
 *
 * Time-based and deterministic: every visitor (and the server) compute the same
 * number from wall-clock time. The total keeps climbing even when no one has
 * the page open — nothing needs to "run" in the background.
 */

/**
 * Moment the shared tally begins (must stay in the past).
 * Near “now” so the public figure stays close to BUGS_KILLED_BASE.
 */
export const BUGS_KILLED_EPOCH_MS = Date.UTC(2026, 7, 3, 1, 0, 0); // 2026-08-03 01:00 UTC

/** Public starting count at the epoch. */
export const BUGS_KILLED_BASE = 2_345_870;

/**
 * Steady kills per second — kept low so the counter ticks slowly.
 * (~2.2 / sec ≈ 130 / min)
 */
export const BUGS_KILLS_PER_SEC = 2.2;

/** Occasional small bumps — still deterministic, not a rapid race. */
const BURST_EVERY_SEC = 48;
const BURST_SIZE = 6;

/** Authoritative count at a given instant (ms since epoch). */
export function getBugsKilledAt(nowMs: number = Date.now()): number {
  const elapsedMs = Math.max(0, nowMs - BUGS_KILLED_EPOCH_MS);
  const elapsedSec = elapsedMs / 1000;
  const steady = Math.floor(elapsedSec * BUGS_KILLS_PER_SEC);
  const bursts = Math.floor(elapsedSec / BURST_EVERY_SEC) * BURST_SIZE;
  // Slow sub-second crawl: +1 about twice per second max
  const sub = Math.floor((elapsedMs % 1000) / 500);
  return BUGS_KILLED_BASE + steady + bursts + sub;
}
