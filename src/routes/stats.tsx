import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CarFront,
  Construction,
  Crosshair,
  Gamepad2,
  HeartPulse,
  RefreshCw,
  Search,
  Shield,
  Skull,
  Trophy,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchHllvPublicStats,
  type HllvPlayerStat,
  type HllvStatsFeed,
} from "@/lib/game-stats-fn";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  head: () => ({
    meta: [{ title: "Player Stats — 1st Mobile Infantry" }],
  }),
});

type GameChoice = "hub" | "hllv" | "ste";
type SortKey = "kills" | "revives" | "kd" | "deaths";

const EMPTY_FEED: HllvStatsFeed = {
  game: "Hell Let Loose: Vietnam",
  available: false,
  trackedPlayers: 0,
  lastPollAt: null,
  fetchedAt: new Date(0).toISOString(),
  players: [],
  error: null,
};

function kd(player: HllvPlayerStat): number {
  if (player.deaths <= 0) return player.kills;
  return player.kills / player.deaths;
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StatsPage() {
  const [game, setGame] = useState<GameChoice>("hub");
  const [feed, setFeed] = useState<HllvStatsFeed>(EMPTY_FEED);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("kills");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  async function loadHllv(manual = false) {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      setFeed(await fetchHllvPublicStats());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (game !== "hllv") return;
    void loadHllv();
    const timer = window.setInterval(() => void loadHllv(), 60_000);
    return () => window.clearInterval(timer);
  }, [game]);

  const players = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? feed.players.filter((player) => player.playerName.toLowerCase().includes(needle))
      : [...feed.players];

    return filtered.sort((a, b) => {
      if (sort === "revives") return b.revives - a.revives || b.kills - a.kills;
      if (sort === "deaths") return b.deaths - a.deaths || b.kills - a.kills;
      if (sort === "kd") return kd(b) - kd(a) || b.kills - a.kills;
      return b.kills - a.kills || b.revives - a.revives;
    });
  }, [feed.players, query, sort]);

  const selectedPlayer = useMemo(
    () => feed.players.find((player) => player.playerId === selectedPlayerId) || null,
    [feed.players, selectedPlayerId],
  );

  return (
    <AppShell>
      <PageHero
        kicker="1st M.I. service records"
        title="Player Stats"
        body="Select a game to view public player statistics recorded by 1st Mobile Infantry game-server systems."
        meta="1ST MI DIV · GAME STATS"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {game === "hub" ? (
          <GameHub onSelect={setGame} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGame("hub")}
                  className="chip hover:border-primary/35 hover:text-fg"
                >
                  All Games
                </button>
                <button
                  type="button"
                  onClick={() => setGame("hllv")}
                  className={`chip transition-colors ${
                    game === "hllv"
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "hover:border-primary/35 hover:text-fg"
                  }`}
                >
                  Hell Let Loose: Vietnam
                </button>
                <button
                  type="button"
                  onClick={() => setGame("ste")}
                  className={`chip transition-colors ${
                    game === "ste"
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "hover:border-primary/35 hover:text-fg"
                  }`}
                >
                  Starship Troopers: Extermination
                </button>
              </div>
            </div>

            {game === "hllv" ? (
              <HllvStats
                feed={feed}
                loading={loading}
                refreshing={refreshing}
                players={players}
                query={query}
                sort={sort}
                selectedPlayer={selectedPlayer}
                onQuery={setQuery}
                onSort={setSort}
                onSelectPlayer={setSelectedPlayerId}
                onRefresh={() => void loadHllv(true)}
              />
            ) : (
              <SteComingSoon />
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function GameHub({ onSelect }: { onSelect: (game: GameChoice) => void }) {
  return (
    <div>
      <div className="mb-6">
        <p className="stencil text-[10px] tracking-[0.14em] text-primary">Select game</p>
        <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
          Service Record Database
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Each game has its own statistics source. Hell Let Loose: Vietnam is connected to the 1st M.I. RCON tracker. Starship Troopers: Extermination is reserved for its own integration when reliable server statistics are available.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("hllv")}
          className="panel panel-lift group p-6 text-left sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Shield className="h-6 w-6" aria-hidden />
            </span>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 stencil text-[9px] tracking-[0.12em] text-emerald-200">
              Live stats
            </span>
          </div>
          <p className="mt-6 stencil text-[10px] tracking-[0.14em] text-primary">Game statistics</p>
          <h3 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-fg sm:text-3xl">
            Hell Let Loose: Vietnam
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Search player records, compare kills, deaths, revives and K/D, and view tracked favourite weapons and vehicles from the 1st M.I. server.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 stencil text-[11px] tracking-[0.12em] text-primary">
            View HLL:V Stats <Activity className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("ste")}
          className="panel panel-lift group p-6 text-left sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-border-strong bg-black/35 text-muted">
              <Gamepad2 className="h-6 w-6" aria-hidden />
            </span>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 stencil text-[9px] tracking-[0.12em] text-amber-100">
              Integration pending
            </span>
          </div>
          <p className="mt-6 stencil text-[10px] tracking-[0.14em] text-primary">Game statistics</p>
          <h3 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-fg sm:text-3xl">
            Starship Troopers: Extermination
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This category is ready for a future STE stats source without mixing its records into the HLL:V database.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 stencil text-[11px] tracking-[0.12em] text-muted">
            View Category <Construction className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </button>
      </div>
    </div>
  );
}

function HllvStats({
  feed,
  loading,
  refreshing,
  players,
  query,
  sort,
  selectedPlayer,
  onQuery,
  onSort,
  onSelectPlayer,
  onRefresh,
}: {
  feed: HllvStatsFeed;
  loading: boolean;
  refreshing: boolean;
  players: HllvPlayerStat[];
  query: string;
  sort: SortKey;
  selectedPlayer: HllvPlayerStat | null;
  onQuery: (value: string) => void;
  onSort: (value: SortKey) => void;
  onSelectPlayer: (value: string | null) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="panel panel-static p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">Hell Let Loose: Vietnam</p>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] ${
                feed.available
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-amber-300/25 bg-amber-300/10 text-amber-100"
              }`}>
                {feed.available ? "RCON FEED ONLINE" : "FEED UNAVAILABLE"}
              </span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
              Server Service Records
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              These are statistics recorded by the 1st M.I. HLL:V server tracker from the point tracking was enabled. They are not global lifetime HLL statistics.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            {refreshing ? "Refreshing…" : "Refresh Stats"}
          </Button>
        </div>
      </div>

      {feed.available ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Tracked Players" value={feed.trackedPlayers.toLocaleString()} icon={<Trophy className="h-5 w-5" />} />
          <SummaryCard label="Records Shown" value={feed.players.length.toLocaleString()} icon={<Activity className="h-5 w-5" />} />
          <SummaryCard label="Last RCON Poll" value={feed.lastPollAt ? formatDate(feed.lastPollAt) : "Waiting for poll"} icon={<RefreshCw className="h-5 w-5" />} compact />
        </div>
      ) : null}

      {loading ? (
        <div className="panel panel-static p-12 text-center text-muted">Loading HLL:V service records…</div>
      ) : !feed.available ? (
        <div className="panel panel-static p-8 text-center sm:p-12">
          <Activity className="mx-auto h-9 w-9 text-amber-200" aria-hidden />
          <h3 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">Stats Feed Offline</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {feed.error || "The HLL:V controller could not provide player statistics right now."}
          </p>
          <Button type="button" className="mt-5" onClick={onRefresh}>Try Again</Button>
        </div>
      ) : (
        <>
          <div className="panel panel-static p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative block flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  placeholder="Search player name…"
                  className="min-h-11 w-full rounded-md border border-border bg-black/30 pl-10 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-primary/60"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <SortButton label="Kills" active={sort === "kills"} onClick={() => onSort("kills")} />
                <SortButton label="Revives" active={sort === "revives"} onClick={() => onSort("revives")} />
                <SortButton label="K/D" active={sort === "kd"} onClick={() => onSort("kd")} />
                <SortButton label="Deaths" active={sort === "deaths"} onClick={() => onSort("deaths")} />
              </div>
            </div>
          </div>

          {selectedPlayer ? (
            <PlayerRecord player={selectedPlayer} onClose={() => onSelectPlayer(null)} />
          ) : null}

          <div className="panel panel-static overflow-hidden">
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">Leaderboard</p>
              <p className="mt-1 text-xs text-muted">{players.length} matching player{players.length === 1 ? "" : "s"}</p>
            </div>

            {players.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted">No player records match that search.</div>
            ) : (
              <div className="divide-y divide-border">
                {players.map((player, index) => (
                  <button
                    key={player.playerId}
                    type="button"
                    onClick={() => onSelectPlayer(player.playerId)}
                    className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)] gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-hover sm:grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_5rem_5rem] sm:items-center sm:px-5"
                  >
                    <span className="font-mono text-xs text-subtle">#{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-semibold uppercase tracking-wide text-fg">{player.playerName}</span>
                      <span className="mt-1 block text-[10px] text-subtle sm:hidden">
                        {player.kills} K · {player.deaths} D · {player.revives} REV · {kd(player).toFixed(2)} K/D
                      </span>
                    </span>
                    <StatCell value={player.kills} label="Kills" />
                    <StatCell value={player.deaths} label="Deaths" />
                    <StatCell value={player.revives} label="Revives" />
                    <StatCell value={kd(player).toFixed(2)} label="K/D" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, compact = false }: { label: string; value: string; icon: React.ReactNode; compact?: boolean }) {
  return (
    <div className="panel panel-static flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="stencil text-[9px] tracking-[0.12em] text-muted">{label}</p>
        <p className={`${compact ? "text-sm" : "text-xl"} mt-1 truncate font-display font-semibold uppercase tracking-wide text-fg`}>{value}</p>
      </div>
    </div>
  );
}

function SortButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip transition-colors ${
        active ? "border-primary/60 bg-primary/15 text-primary" : "hover:border-primary/35 hover:text-fg"
      }`}
    >
      {label}
    </button>
  );
}

function StatCell({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="hidden text-right sm:block">
      <span className="block font-mono text-sm font-semibold text-fg">{value}</span>
      <span className="block text-[9px] uppercase tracking-wide text-subtle">{label}</span>
    </span>
  );
}

function PlayerRecord({ player, onClose }: { player: HllvPlayerStat; onClose: () => void }) {
  return (
    <div className="panel panel-static border-primary/25 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="stencil text-[10px] tracking-[0.14em] text-primary">Trooper service record</p>
          <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">{player.playerName}</h3>
          <p className="mt-1 text-xs text-muted">Last recorded activity: {formatDate(player.lastSeen)}</p>
        </div>
        <Button type="button" variant="secondary" onClick={onClose}>Close Record</Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RecordMetric icon={<Crosshair className="h-5 w-5" />} label="Kills" value={player.kills.toLocaleString()} />
        <RecordMetric icon={<Skull className="h-5 w-5" />} label="Deaths" value={player.deaths.toLocaleString()} />
        <RecordMetric icon={<HeartPulse className="h-5 w-5" />} label="Revives" value={player.revives.toLocaleString()} />
        <RecordMetric icon={<Activity className="h-5 w-5" />} label="K/D" value={kd(player).toFixed(2)} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <FavouriteCard
          icon={<Crosshair className="h-5 w-5" />}
          label="Favourite Weapon"
          name={player.favouriteWeapon?.name || "Not enough data"}
          kills={player.favouriteWeapon?.kills ?? null}
        />
        <FavouriteCard
          icon={<CarFront className="h-5 w-5" />}
          label="Favourite Vehicle"
          name={player.favouriteVehicle?.name || "Not enough data"}
          kills={player.favouriteVehicle?.kills ?? null}
        />
      </div>

      <p className="mt-5 border-t border-border pt-4 font-mono text-[10px] leading-relaxed text-subtle">
        First tracked: {formatDate(player.firstSeen)}. Statistics only include activity recorded by the 1st M.I. server tracker after tracking was enabled.
      </p>
    </div>
  );
}

function RecordMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-black/25 p-4">
      <span className="text-primary">{icon}</span>
      <p className="mt-3 font-mono text-2xl font-semibold text-fg">{value}</p>
      <p className="mt-1 stencil text-[9px] tracking-[0.12em] text-muted">{label}</p>
    </div>
  );
}

function FavouriteCard({ icon, label, name, kills }: { icon: React.ReactNode; label: string; name: string; kills: number | null }) {
  return (
    <div className="rounded-md border border-border bg-black/25 p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <p className="stencil text-[9px] tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-3 font-display text-lg font-semibold uppercase tracking-wide text-fg">{name}</p>
      <p className="mt-1 text-xs text-muted">{kills == null ? "No tracked favourite yet" : `${kills.toLocaleString()} tracked kills`}</p>
    </div>
  );
}

function SteComingSoon() {
  return (
    <div className="panel panel-static p-8 text-center sm:p-12">
      <Construction className="mx-auto h-10 w-10 text-amber-200" aria-hidden />
      <p className="mt-5 stencil text-[10px] tracking-[0.14em] text-primary">Starship Troopers: Extermination</p>
      <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">Stats Integration Pending</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        The STE category is in place, but it will stay separate until we have a reliable server-side source for player statistics. When that source is available, it can be connected here without changing the HLL:V records.
      </p>
    </div>
  );
}
