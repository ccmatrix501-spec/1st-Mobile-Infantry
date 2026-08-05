import { createServerFn } from "@tanstack/react-start";
import { getBugsKilledAt } from "@/lib/bugs-killed";

/** Server clock + shared tally for client clock-offset sync. */
export const fetchBugsKilled = createServerFn({ method: "GET" }).handler(
  async () => {
    const serverTime = Date.now();
    return {
      count: getBugsKilledAt(serverTime),
      serverTime,
    };
  },
);
