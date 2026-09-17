import { useState } from "react";
import { Printer } from "lucide-react";
import { fetchLeadershipStoreOrder } from "@/lib/store-orders-fn";
import { printStoreAddressLabel } from "@/lib/store-address-label";

export function StoreOrderLabelShortcut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const printLabel = async () => {
    const orderId = new URLSearchParams(window.location.search).get("id")?.trim() || "";
    if (!orderId) {
      setError("No order id was found for this order.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const order = await fetchLeadershipStoreOrder({ data: { orderId } });
      if (!order) throw new Error("Order could not be loaded.");
      printStoreAddressLabel(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare the address label.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void printLabel()}
        disabled={loading}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
      >
        <Printer className="h-4 w-4" aria-hidden />
        {loading ? "Loading Label..." : "Print Address Label"}
      </button>
      {error ? <span className="max-w-56 text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
