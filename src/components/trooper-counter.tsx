import { useEffect, useState } from "react";
import { fetchDropshipStats } from "@/lib/dropship-stats-fn";

const formatter = new Intl.NumberFormat("en-US");

/**
 * Live total troopers (Discord server member count) from the AAR bot /stats API.
 */
export function TrooperCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "offline" | "unconfigured">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const data = await fetchDropshipStats();
        if (cancelled) return;
        if (data.source === "unconfigured") {
          setStatus("unconfigured");
          return;
        }
        if (data.ok && data.totalMembers != null) {
          setCount(data.totalMembers);
          setStatus("live");
        } else {
          setStatus("offline");
        }
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    void pull();
    const id = window.setInterval(() => void pull(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label =
    status === "live"
      ? "Live from Discord AAR"
      : status === "unconfigured"
        ? "Connect bot API"
        : status === "offline"
          ? "Bot offline"
          : "Syncing…";

  return (
    <div>
      <p
        className="metric-value text-3xl text-primary sm:text-4xl"
        data-troopers
        data-status={status}
        title={label}
        style={{
          textShadow: "0 0 28px color-mix(in oklab, var(--color-primary) 55%, transparent)",
        }}
      >
        {count === null ? "—" : formatter.format(count)}
      </p>
      <p className="badge-live mt-2 stencil text-[10px] tracking-[0.12em] text-primary">
        {status === "live" ? "Live · Discord bot" : label}
      </p>
    </div>
  );
}
