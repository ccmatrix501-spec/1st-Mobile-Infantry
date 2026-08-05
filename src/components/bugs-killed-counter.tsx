import { useEffect, useRef, useState } from "react";
import { BUGS_KILLED_BASE, getBugsKilledAt } from "@/lib/bugs-killed";
import { fetchBugsKilled } from "@/lib/bugs-killed-fn";
import { connectBugsKilledWs } from "@/lib/bugs-killed-ws-client";

const formatter = new Intl.NumberFormat("en-US");

/**
 * Shared kill tally with WebSocket real-time sync.
 * Display is monotonic: never steps backward.
 */
export function BugsKilledCounter() {
  const [count, setCount] = useState(BUGS_KILLED_BASE);
  const [offsetMs, setOffsetMs] = useState(0);
  const [source, setSource] = useState<"ws" | "fallback">("fallback");
  const [wsConnected, setWsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const highWater = useRef(BUGS_KILLED_BASE);

  function commit(next: number) {
    // Never display a lower value than we already showed this session
    // (guards against brief WS/formula skew without fighting re-anchors forever:
    // high-water only ratchets up within the tab session).
    if (next > highWater.current) highWater.current = next;
    setCount(highWater.current);
  }

  useEffect(() => {
    setMounted(true);
    const n = getBugsKilledAt();
    highWater.current = n;
    setCount(n);
  }, []);

  // WebSocket: use for clock offset + count; never apply a lower count
  useEffect(() => {
    const dispose = connectBugsKilledWs(
      (state) => {
        setOffsetMs(state.offsetMs);
        setSource("ws");
        setWsConnected(true);
        if (state.count >= 0) commit(state.count);
      },
      (connected) => {
        setWsConnected(connected);
        if (!connected) setSource("fallback");
      },
    );
    return dispose;
  }, []);

  // HTTP clock sync fallback
  useEffect(() => {
    let cancelled = false;

    async function syncHttp() {
      if (wsConnected) return;
      try {
        const t0 = Date.now();
        const { serverTime, count: serverCount } = await fetchBugsKilled();
        const t1 = Date.now();
        const clientMid = (t0 + t1) / 2;
        if (!cancelled) {
          setOffsetMs(serverTime - clientMid);
          setSource("fallback");
          commit(serverCount);
        }
      } catch {
        if (!cancelled) {
          setSource("fallback");
          commit(getBugsKilledAt());
        }
      }
    }

    void syncHttp();
    const id = window.setInterval(() => void syncHttp(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [wsConnected]);

  // Local formula ticks — always monotonic via high-water
  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      commit(getBugsKilledAt(Date.now() + offsetMs));
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [offsetMs, mounted]);

  const liveLabel =
    source === "ws" && wsConnected ? "Live · WebSocket" : "Live · world clock";

  const display = mounted ? count : BUGS_KILLED_BASE;

  return (
    <p
      className="metric-value text-3xl text-primary sm:text-4xl"
      data-bugs-killed
      data-sync={source}
      data-ws={wsConnected ? "1" : "0"}
      aria-live="off"
      title={liveLabel}
      suppressHydrationWarning
      style={{
        textShadow: "0 0 28px color-mix(in oklab, var(--color-primary) 55%, transparent)",
      }}
    >
      {formatter.format(display)}
    </p>
  );
}
