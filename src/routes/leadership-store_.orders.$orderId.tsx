import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/leadership-store_/orders/$orderId")({
  component: LegacyStoreOrderRedirect,
  head: () => ({ meta: [{ title: "Opening Order — 1st Mobile Infantry" }] }),
});

function LegacyStoreOrderRedirect() {
  const { orderId } = Route.useParams();

  useEffect(() => {
    const target = `/leadership-order?id=${encodeURIComponent(orderId)}`;
    window.location.replace(target);
  }, [orderId]);

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-4 py-20 text-center text-muted">
        Opening full order details…
      </div>
    </AppShell>
  );
}
