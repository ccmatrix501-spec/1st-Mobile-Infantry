import { Link, useRouterState } from "@tanstack/react-router";
import { PackageSearch, ShoppingCart } from "lucide-react";
import { useStoreCart } from "@/lib/store-cart";
import { cn } from "@/lib/utils";

export function StoreToolbar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cart = useStoreCart();

  return (
    <div className="border-b border-border bg-black/35 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/store"
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 stencil text-[10px] tracking-[0.12em] text-muted transition-colors hover:bg-surface-hover hover:text-fg",
            pathname === "/store" && "bg-primary/10 text-primary",
          )}
        >
          <PackageSearch className="h-4 w-4" />Browse Store
        </Link>
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
  );
}
