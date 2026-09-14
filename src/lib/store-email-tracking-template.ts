import type { StoreOrder } from "@/lib/store-orders";
import {
  buildStoreEmailHtml,
  storeEmailPlainText,
  storeEmailSubject,
  type StoreEmailExtras,
} from "@/lib/store-email-template";

export type TrackedStoreEmailExtras = StoreEmailExtras & {
  trackingUrl?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function trackedStoreEmailSubject(
  order: StoreOrder,
  extras: TrackedStoreEmailExtras,
): string {
  return storeEmailSubject(order, extras);
}

export function trackedStoreEmailPlainText(
  order: StoreOrder,
  extras: TrackedStoreEmailExtras,
): string {
  const base = storeEmailPlainText(order, extras);
  const url = String(extras.trackingUrl || "").trim();
  if (!url) return base;
  return `${base}\n\nTrack your order progress:\n${url}`;
}

export function buildTrackedStoreEmailHtml(
  order: StoreOrder,
  extras: TrackedStoreEmailExtras,
): string {
  const base = buildStoreEmailHtml(order, extras);
  const url = String(extras.trackingUrl || "").trim();
  if (!/^https:\/\//i.test(url)) return base;

  const safeUrl = escapeHtml(url);
  const tracked = base.replace(
    /<a href="https:\/\/www\.1stmid\.com\/store"([^>]*)>Visit 1st M\.I\. Store →<\/a>/,
    `<a href="${safeUrl}"$1>Track Order Progress →</a>`,
  );

  return tracked;
}
