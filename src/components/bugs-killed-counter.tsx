import { useEffect, useRef, useState } from "react";
import { BUGS_KILLED_BASE, getBugsKilledAt } from "@/lib/bugs-killed";
import { fetchBugsKilled } from "@/lib/bugs-killed-fn";
import { connectBugsKilledWs } from "@/lib/bugs-killed-ws-client";

const formatter = new Intl.NumberFormat("en-US");

/**
 * Shared kill tally with WebSocket real-time sync.
 * Climbs slowly from the shared world-clock formula.
 */
export function BugsKilledCounter() {
  const [count, setCount] = useState(BUGS_KILLED_BASE);
  const [offsetMs, setOffsetMs] = useState(0);
  const [source, setSource] = useState<"ws" | "fallback">("fallback");
  const [wsConnected, setWsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastWsCount = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setCount(getBugsKilledAt());
  }, []);

  useEffect(() => {
    const dispose = connectBugsKilledWs(
      (state) => {
        if (state.count >= 0) {
          lastWsCount.current = state.count;
          setCount(state.count);
        }
        setOffsetMs(state.offsetMs);
        setSource("ws");
        setWsConnected(true);
      },
      (connected) => {
        setWsConnected(connected);
        if (!connected) setSource("fallback");
      },
    );
    return dispose;
  }, []);

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
          setCount(serverCount);
          setSource("fallback");
        }
      } catch {
        if (!cancelled) {
          setCount(getBugsKilledAt());
          setSource("fallback");
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

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      if (wsConnected && lastWsCount.current !== null) {
        const formula = getBugsKilledAt(Date.now() + offsetMs);
        setCount(Math.max(lastWsCount.current, formula));
        return;
      }
      setCount(getBugsKilledAt(Date.now() + offsetMs));
    };
    tick();
    // Match the slower climb — no need for 40ms thrash
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [offsetMs, wsConnected, mounted]);

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
