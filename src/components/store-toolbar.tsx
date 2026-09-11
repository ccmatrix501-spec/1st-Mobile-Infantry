import { Link, useRouterState } from "@tanstack/react-router";
import { Coins, PackageSearch, Send, ShoppingCart, Tags } from "lucide-react";
import { useStoreCart } from "@/lib/store-cart";
import {
  STORE_DISPLAY_CURRENCIES,
  useStoreCurrency,
} from "@/lib/store-currency";
import { cn } from "@/lib/utils";

export function StoreToolbar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cart = useStoreCart();
  const fx = useStoreCurrency();

  return (
    <div className="border-b border-border bg-black/35 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/store"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 stencil text-[10px] tracking-[0.12em] text-muted transition-colors hover:bg-surface-hover hover:text-fg",
              pathname === "/store" && "bg-primary/10 text-primary",
            )}
          >
            <PackageSearch className="h-4 w-4" />Browse Store
          </Link>

          <a
            href="/store/categories"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 stencil text-[10px] tracking-[0.12em] text-muted transition-colors hover:bg-surface-hover hover:text-fg",
              (pathname === "/store/categories" || pathname.startsWith("/store/category/")) && "bg-primary/10 text-primary",
            )}
          >
            <Tags className="h-4 w-4" />Categories
          </a>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 rounded-md border border-border-strong bg-black/30 px-2.5 py-1.5">
            <Coins className="h-4 w-4 text-primary" />
            <span className="hidden stencil text-[9px] tracking-[0.12em] text-muted sm:inline">Currency</span>
            <select
              value={fx.currency}
              onChange={(event) => fx.setCurrency(event.target.value)}
              aria-label="Display currency"
              className="h-8 max-w-[11rem] rounded border border-border bg-black/55 px-2 text-xs text-fg outline-none focus:border-primary/70"
            >
              {STORE_DISPLAY_CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.label}
                </option>
              ))}
            </select>
          </label>

          {cart.count > 0 ? (
            <Link
              to="/store/order-request"
              className={cn(
                "inline-flex items-center gap-2 rounded-md border border-primary/45 bg-primary/10 px-3 py-2 stencil text-[10px] tracking-[0.12em] text-primary transition-colors hover:bg-primary/20",
                pathname.startsWith("/store/order-request") && "border-primary bg-primary/20",
              )}
            >
              <Send className="h-4 w-4" />Place Order
            </Link>
          ) : null}

          <Link
            to="/store/cart"
            className={cn(
              "inline-flex items-center gap-2 rounded-md border border-border-strong bg-black/30 px-3 py-2 stencil text-[10px] tracking-[0.12em] text-fg transition-colors hover:border-primary/50 hover:text-primary",
              pathname.startsWith("/store/cart") && "border-primary/50 text-primary",
            )}
          >
            <ShoppingCart className="h-4 w-4" />Cart
            <span className="min-w-6 rounded-full bg-primary/15 px-1.5 py-0.5 text-center font-mono text-[10px] text-primary">
              {cart.count}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
