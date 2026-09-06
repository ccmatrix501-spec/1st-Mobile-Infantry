import { useEffect, useMemo, useState } from "react";

export type StoreCartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

const CART_KEY = "1mi-store-cart-v1";
const CART_EVENT = "1mi-store-cart-change";

function normalise(lines: StoreCartLine[]): StoreCartLine[] {
  return lines
    .filter((line) => line && line.productId)
    .map((line) => ({
      productId: String(line.productId),
      variantId: String(line.variantId || ""),
      quantity: Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1))),
    }));
}

export function readStoreCart(): StoreCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoreCartLine[];
    return Array.isArray(parsed) ? normalise(parsed) : [];
  } catch {
    return [];
  }
}

export function writeStoreCart(lines: StoreCartLine[]): StoreCartLine[] {
  const clean = normalise(lines);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  }
  return clean;
}

export function addStoreCartItem(productId: string, variantId = "", quantity = 1): StoreCartLine[] {
  const current = readStoreCart();
  const existingIndex = current.findIndex(
    (line) => line.productId === productId && line.variantId === variantId,
  );
  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      quantity: Math.min(99, current[existingIndex].quantity + Math.max(1, quantity)),
    };
  } else {
    current.push({ productId, variantId, quantity: Math.max(1, quantity) });
  }
  return writeStoreCart(current);
}

export function removeStoreCartItem(productId: string, variantId = ""): StoreCartLine[] {
  return writeStoreCart(
    readStoreCart().filter(
      (line) => !(line.productId === productId && line.variantId === variantId),
    ),
  );
}

export function clearStoreCart(): StoreCartLine[] {
  return writeStoreCart([]);
}

export function useStoreCart() {
  const [lines, setLines] = useState<StoreCartLine[]>([]);

  useEffect(() => {
    const sync = () => setLines(readStoreCart());
    sync();
    window.addEventListener(CART_EVENT, sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const count = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  return {
    lines,
    count,
    add(productId: string, variantId = "", quantity = 1) {
      setLines(addStoreCartItem(productId, variantId, quantity));
    },
    setQuantity(productId: string, variantId: string, quantity: number) {
      const next = readStoreCart().map((line) =>
        line.productId === productId && line.variantId === variantId
          ? { ...line, quantity: Math.max(1, Math.min(99, Math.floor(quantity || 1))) }
          : line,
      );
      setLines(writeStoreCart(next));
    },
    remove(productId: string, variantId = "") {
      setLines(removeStoreCartItem(productId, variantId));
    },
    clear() {
      setLines(clearStoreCart());
    },
  };
}
