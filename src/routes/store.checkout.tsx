import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/store/checkout")({
  component: StoreCheckoutRedirectPage,
  head: () => ({ meta: [{ title: "Checkout — 1st M.I. Store" }] }),
});

function StoreCheckoutRedirectPage() {
  useEffect(() => {
    // Checkout is staff-assisted: the order is submitted first, then Website
    // Staff contacts the customer with their selected PayPal/Venmo details.
    // Keep this legacy checkout URL working by forwarding into the live order
    // request flow instead of blocking on an on-site payment provider.
    window.location.replace("/store/order-request");
  }, []);

  return (
    <AppShell>
      <StoreToolbar />
      <PageHero
        kicker="Quartermaster"
        title="Staff-Assisted Checkout"
        body="Your order is submitted to Website Staff first. Staff will then contact you with the external payment details for your selected payment method."
        meta="1ST MI DIV · CHECKOUT"
      />
      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <div className="panel panel-feature p-7 sm:p-9">
          <MessageCircle className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
            Opening checkout…
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            No card payment is required on 1stmid.com. Complete your contact, shipping and payment-method selection, then send the order to Website Staff.
          </p>
          <Button asChild className="mt-6">
            <Link to="/store/order-request">Continue to Staff-Assisted Checkout</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
