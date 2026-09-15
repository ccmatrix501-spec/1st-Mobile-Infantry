import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLeadershipStoreOrder } from "@/lib/store-orders-fn";
import type { StoreOrder } from "@/lib/store-orders";
import { printStoreAddressLabel } from "@/lib/store-address-label";

export function StoreAddressLabelButton() {
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname !== "/leadership-order") {
      setOrder(null);
      return;
    }

    const orderId = new URLSearchParams(window.location.search).get("id")?.trim() || "";
    if (!orderId) return;

    let active = true;
    setLoading(true);
    setError(null);
    void fetchLeadershipStoreOrder({ data: { orderId } })
      .then((value) => {
        if (active) setOrder(value || null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load label details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (typeof window === "undefined" || window.location.pathname !== "/leadership-order") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-2 print:hidden">
      {error ? (
        <div className="max-w-sm rounded-lg border border-red-400/30 bg-black/95 px-3 py-2 text-xs text-red-100 shadow-xl">
          {error}
        </div>
      ) : null}
      <Button
        type="button"
        disabled={loading || !order}
        onClick={() => {
          if (!order) return;
          try {
            printStoreAddressLabel(order);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not open the address label.");
          }
        }}
        className="h-12 shadow-2xl"
      >
        <Printer className="h-4 w-4" />
        {loading ? "Loading Label…" : "Print Address Label"}
      </Button>
    </div>
  );
}
