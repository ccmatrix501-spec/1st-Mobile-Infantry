import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Radio,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  EMPTY_DISCORD_EVENT_FEED,
  type DiscordWebsiteEvent,
  type DiscordWebsiteEventFeed,
} from "@/lib/discord-events";
import { fetchDiscordWebsiteEvents } from "@/lib/discord-events-fn";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({
    meta: [{ title: "Events — 1st Mobile Infantry" }],
  }),
});

function parseTime(value: string | null): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function formatDateTime(value: string | null): string {
  const time = parseTime(value);
  if (time == null) return "Time not set";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(time));
}

function relativeStart(event: DiscordWebsiteEvent, now: number): string {
  if (event.status === "active") return "LIVE NOW";
  const start = parseTime(event.scheduledStartAt);
  if (start == null) return "Schedule pending";
  const diff = start - now;
  const abs = Math.abs(diff);
  const minutes = Math.max(1, Math.round(abs / 60_000));
  if (diff <= 0) return "Started";
  if (minutes < 60) return `Starts in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Starts in ${hours}h`;
  return `Starts in ${Math.round(hours / 24)}d`;
}

function statusLabel(event: DiscordWebsiteEvent): string {
  if (event.status === "active") return "LIVE";
  if (event.status === "cancelled") return "CANCELLED";
  if (event.status === "completed") return "COMPLETE";
  return "UPCOMING";
}

function EventsPage() {
  const [feed, setFeed] = useState<DiscordWebsiteEventFeed>(EMPTY_DISCORD_EVENT_FEED);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [now, setNow] = useState(() => Date.now());

  async function loadEvents(manual = false) {
    if (manual) setRefreshing(true);
    try {
      setFeed(await fetchDiscordWebsiteEvents());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadEvents();
    const refreshTimer = window.setInterval(() => void loadEvents(), 2 * 60 * 1000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const visible = useMemo(
    () =>
      feed.events.filter(
        (event) => selectedCategory === "all" || event.categoryId === selectedCategory,
      ),
    [feed.events, selectedCategory],
  );

  const groups = useMemo(() => {
    const live: DiscordWebsiteEvent[] = [];
    const upcoming: DiscordWebsiteEvent[] = [];
    const past: DiscordWebsiteEvent[] = [];

    for (const event of visible) {
      const start = parseTime(event.scheduledStartAt);
      const end = parseTime(event.scheduledEndAt);
      const effectivelyLive =
        event.status === "active" ||
        (event.status === "scheduled" && start != null && start <= now && end != null && end > now);

      if (effectivelyLive) {
        live.push(event);
      } else if (
        event.status === "completed" ||
        event.status === "cancelled" ||
        (end != null && end <= now) ||
        (start != null && start < now && event.status !== "scheduled")
      ) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    }

    const byStart = (a: DiscordWebsiteEvent, b: DiscordWebsiteEvent) =>
      (parseTime(a.scheduledStartAt) ?? Number.MAX_SAFE_INTEGER) -
      (parseTime(b.scheduledStartAt) ?? Number.MAX_SAFE_INTEGER);
    live.sort(byStart);
    upcoming.sort(byStart);
    past.sort((a, b) => -byStart(a, b));
    return { live, upcoming, past };
  }, [visible, now]);

  return (
    <AppShell>
      <PageHero
        kicker="Discord operations feed"
        title="Events"
        body="Live and upcoming 1st Mobile Infantry Discord Scheduled Events from approved operations categories. Times are displayed in your local timezone."
        meta="1ST MI DIV · LIVE DISCORD FEED"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="panel panel-static mb-6 flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">
              Watched Discord categories
            </p>
            <p className="mt-1 text-sm text-muted">
              Events appear automatically when their Discord voice or stage channel is inside an approved category.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={refreshing}
            onClick={() => void loadEvents(true)}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            {refreshing ? "Refreshing…" : "Refresh Events"}
          </Button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`chip transition-colors ${
              selectedCategory === "all"
                ? "border-primary/60 bg-primary/15 text-primary"
                : "hover:border-primary/35 hover:text-fg"
            }`}
          >
            All Events · {feed.events.length}
          </button>
          {feed.categories.map((category) => {
            const count = feed.events.filter((event) => event.categoryId === category.id).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`chip transition-colors ${
                  selectedCategory === category.id
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "hover:border-primary/35 hover:text-fg"
                }`}
              >
                {category.name} · {count}
              </button>
            );
          })}
        </div>

        {feed.error ? (
          <div className="mb-6 rounded-md border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            The Discord event feed is temporarily unavailable. {feed.events.length > 0
              ? "Showing the last cached event data."
              : "No cached events are available yet."}
          </div>
        ) : null}

        {loading ? (
          <div className="panel panel-static p-10 text-center text-muted">Loading Discord events…</div>
        ) : visible.length === 0 ? (
          <div className="panel panel-static p-8 text-center sm:p-12">
            <CalendarDays className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              No Events Scheduled
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
              There are currently no Discord Scheduled Events in the selected watched category. New events will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.live.length > 0 ? (
              <EventGroup title="Live Now" kicker="Active operation" events={groups.live} now={now} />
            ) : null}
            {groups.upcoming.length > 0 ? (
              <EventGroup title="Upcoming Events" kicker="Scheduled operations" events={groups.upcoming} now={now} />
            ) : null}
            {groups.past.length > 0 ? (
              <EventGroup title="Past Events" kicker="Recently concluded" events={groups.past} now={now} />
            ) : null}
          </div>
        )}

        <div className="mt-10 border-t border-border pt-5 font-mono text-[10px] leading-relaxed text-subtle">
          {feed.updatedAt ? `Discord feed updated ${formatDateTime(feed.updatedAt)}.` : "Waiting for first Discord event sync."}
          {feed.stale ? " Feed may be stale while the Discord bot reconnects." : ""}
        </div>
      </section>
    </AppShell>
  );
}

function EventGroup({
  title,
  kicker,
  events,
  now,
}: {
  title: string;
  kicker: string;
  events: DiscordWebsiteEvent[];
  now: number;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-primary/20 pb-4">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
            {title}
          </h2>
        </div>
        <span className="font-mono text-xs text-muted">{events.length} event{events.length === 1 ? "" : "s"}</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} now={now} />
        ))}
      </div>
    </section>
  );
}

function EventCard({ event, now }: { event: DiscordWebsiteEvent; now: number }) {
  const live = event.status === "active" || relativeStart(event, now) === "LIVE NOW";
  return (
    <article className={`panel panel-lift overflow-hidden ${live ? "panel-feature" : ""}`}>
      {event.imageUrl ? (
        <div className="relative aspect-[16/7] overflow-hidden border-b border-border bg-black">
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-sm border border-primary/35 bg-primary/10 px-2.5 py-1 stencil text-[10px] tracking-[0.1em] text-primary">
            {event.categoryName || "Discord Event"}
          </span>
          <span
            className={`rounded-sm border px-2.5 py-1 stencil text-[10px] tracking-[0.1em] ${
              live
                ? "border-primary bg-primary text-black"
                : event.status === "cancelled"
                  ? "border-red-400/35 bg-red-500/10 text-red-200"
                  : "border-border-strong bg-black/35 text-muted"
            }`}
          >
            {live ? "LIVE" : statusLabel(event)}
          </span>
        </div>

        <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-fg sm:text-3xl">
          {event.name}
        </h3>
        {event.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
            {event.description}
          </p>
        ) : null}

        <dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <EventFact icon={CalendarDays} label="Start" value={formatDateTime(event.scheduledStartAt)} />
          <EventFact icon={Clock3} label="Countdown" value={relativeStart(event, now)} />
          <EventFact
            icon={MapPin}
            label="Location"
            value={event.location || event.channelName || "Discord"}
          />
          <EventFact
            icon={UsersRound}
            label="Interested"
            value={event.interestedCount == null ? "Discord count unavailable" : String(event.interestedCount)}
          />
        </dl>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
            <Radio className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">
              {event.channelName ? `#${event.channelName}` : "Discord scheduled event"}
            </span>
          </div>
          <a
            href={event.discordUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary/45 bg-primary/10 px-4 font-display text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-black"
          >
            Open in Discord
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}

function EventFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-primary/25 bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="stencil text-[9px] tracking-[0.12em] text-subtle">{label}</dt>
        <dd className="mt-0.5 text-sm text-fg">{value}</dd>
      </div>
    </div>
  );
}
