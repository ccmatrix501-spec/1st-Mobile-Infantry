/**
 * Shared bugs-killed tally.
 *
 * Time-based and deterministic: every visitor (and the server) compute the same
 * number from wall-clock time. The total keeps climbing even when no one has
 * the page open — nothing needs to "run" in the background.
 *
 * Formula is strictly monotonic (never decreases as time advances).
 */

/**
 * Moment the shared tally begins (must stay in the past).
 * Re-anchored so the public figure starts at BUGS_KILLED_BASE.
 */
export const BUGS_KILLED_EPOCH_MS = Date.UTC(2026, 7, 5, 4, 38, 0); // 2026-08-05 04:38 UTC

/** Public starting count at the epoch. */
export const BUGS_KILLED_BASE = 2_778_110;

/** Steady kills per second (exact target rate). */
export const BUGS_KILLS_PER_SEC = 5;

/**
 * Authoritative count at a given instant (ms since epoch).
 * Pure floor of continuous rate — always non-decreasing with time.
 */
export function getBugsKilledAt(nowMs: number = Date.now()): number {
  const elapsedMs = Math.max(0, nowMs - BUGS_KILLED_EPOCH_MS);
  return BUGS_KILLED_BASE + Math.floor((elapsedMs * BUGS_KILLS_PER_SEC) / 1000);
}
