import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { fetchSiteContent } from "@/lib/site-content-fn";
import type { SiteContent } from "@/lib/site-content";

function setText(selector: string, value: string) {
  const node = document.querySelector<HTMLElement>(selector);
  if (node) node.textContent = value;
}

function applyHomepageContent(content: SiteContent) {
  const title = document.querySelector<HTMLElement>("main .hero-title");
  if (title) {
    title.replaceChildren();
    title.append(document.createTextNode(content.heroTitleLine1));
    title.append(document.createElement("br"));
    const second = document.createElement("span");
    second.className = "text-primary";
    second.textContent = content.heroTitleLine2;
    title.append(second);
  }

  setText("main .motto-banner", content.motto);
  setText("main .motto-banner + p", content.secondaryMotto);
  setText("main .motto-banner + p + p", content.intro);

  const heroFacts = document.querySelectorAll<HTMLElement>(
    "main section:first-of-type dl dd",
  );
  if (heroFacts[0]) heroFacts[0].textContent = content.established;
  if (heroFacts[1]) heroFacts[1].textContent = content.homebase;

  setText("#theaters h2", content.theaterTitle);
  setText("#theaters h2 + p", content.theaterBody);

  // The command plate repeats the public motto beneath the emblem.
  const commandMotto = document.querySelector<HTMLElement>(
    "main .emblem-id img[alt='1st Mobile Infantry emblem'] + div",
  )?.parentElement?.parentElement?.querySelector<HTMLElement>("p:last-child");
  if (commandMotto) commandMotto.textContent = content.motto;
}

/**
 * Applies leadership-managed database content to the public homepage. Existing
 * source copy remains the SSR/failure fallback, so the public site never becomes
 * blank if the content API is unavailable.
 */
export function LiveSiteContent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (pathname !== "/") return;
    let cancelled = false;

    void fetchSiteContent()
      .then((content) => {
        if (cancelled) return;
        // Let the newly navigated route commit its DOM before applying values.
        window.requestAnimationFrame(() => {
          if (!cancelled) applyHomepageContent(content);
        });
      })
      .catch(() => {
        // Static source content remains visible as the safe fallback.
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
