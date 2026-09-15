import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

export function StoreOrderInvoiceShortcut() {
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const readOrderId = () => {
      const value = new URLSearchParams(window.location.search).get("id")?.trim() || "";
      setOrderId(value);
    };
    readOrderId();
    window.addEventListener("popstate", readOrderId);
    return () => window.removeEventListener("popstate", readOrderId);
  }, []);

  if (!orderId) return null;

  return (
    <a
      href={`/leadership-store/invoice?orderId=${encodeURIComponent(orderId)}`}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-primary/90"
    >
      <FileText className="h-4 w-4" aria-hidden />
      Make Invoice
    </a>
  );
}
