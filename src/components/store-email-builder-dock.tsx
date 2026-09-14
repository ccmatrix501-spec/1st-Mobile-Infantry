import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { StoreEmailBuilder } from "@/components/store-email-builder";
import { fetchLeadershipStoreOrder } from "@/lib/store-orders-fn";
import type { StoreOrder } from "@/lib/store-orders";

export function StoreEmailBuilderDock() {
  const href = useRouterState({ select: (state) => state.location.href });
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(href, window.location.origin);
    if (url.pathname !== "/leadership-order") {
      setOrder(null);
      setOpen(false);
      return () => {
        cancelled = true;
      };
    }

    const orderId = url.searchParams.get("id")?.trim() || "";
    if (!orderId) {
      setOrder(null);
      return () => {
        cancelled = true;
      };
    }

    void fetchLeadershipStoreOrder({ data: { orderId } })
      .then((value) => {
        if (!cancelled) setOrder(value || null);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      });

    return () => {
      cancelled = true;
    };
  }, [href]);

  if (!order) return null;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[70]">
        <Button
          type="button"
          size="lg"
          onClick={() => setOpen(true)}
          className="shadow-[0_12px_40px_rgba(0,0,0,.55)]"
        >
          <Mail className="h-4 w-4" /> Email Customer
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border-strong bg-bg shadow-[0_30px_100px_rgba(0,0,0,.75)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-black/90 px-4 py-3 backdrop-blur-md sm:px-6">
              <div>
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">Quartermaster email builder</p>
                <p className="mt-1 font-display text-lg font-semibold uppercase text-fg">
                  {order.orderNumber} · {order.customer.email}
                </p>
              </div>
              <Button type="button" size="icon" variant="secondary" onClick={() => setOpen(false)} aria-label="Close email builder">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-3 sm:p-6">
              <StoreEmailBuilder order={order} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
