import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MessageSquareShare,
  RefreshCw,
  Save,
  Settings2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipBotChannels,
  type LeadershipDiscordChannel,
} from "@/lib/bot-control-fn";
import { publishLeadershipPollToDiscord } from "@/lib/poll-discord-fn";
import {
  fetchLeadershipPolls,
  updateLeadershipPollAccess,
} from "@/lib/polls-fn";
import type { LeadershipPoll } from "@/lib/polls";

const selectClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/70 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/70 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function channelLabel(channel: LeadershipDiscordChannel): string {
  const category = channel.parentName?.trim();
  return `${category ? `${category} / ` : ""}#${channel.name}`;
}

function sendableChannel(channel: LeadershipDiscordChannel): boolean {
  return channel.type == null || [0, 5, 15, 16].includes(Number(channel.type));
}

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Choose a valid closing date and time.");
  return date.toISOString();
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PollToolsDock() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = pathname === "/leadership-polls";
  const [open, setOpen] = useState(false);
  const [polls, setPolls] = useState<LeadershipPoll[]>([]);
  const [channels, setChannels] = useState<LeadershipDiscordChannel[]>([]);
  const [pollId, setPollId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [requireDiscordName, setRequireDiscordName] = useState(false);
  const [closesLocal, setClosesLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [discordUrl, setDiscordUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [botError, setBotError] = useState<string | null>(null);

  const visibleChannels = useMemo(
    () => channels.filter(sendableChannel),
    [channels],
  );
  const selectedPoll = useMemo(
    () => polls.find((poll) => poll.id === pollId) || null,
    [pollId, polls],
  );

  useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBotError(null);

    void fetchLeadershipPolls()
      .then((loadedPolls) => {
        if (cancelled) return;
        setPolls(loadedPolls);
        setPollId((current) =>
          loadedPolls.some((poll) => poll.id === current)
            ? current
            : loadedPolls.find((poll) => poll.isOpen)?.id || loadedPolls[0]?.id || "",
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load poll tools.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    void fetchLeadershipBotChannels()
      .then((loadedChannels) => {
        if (cancelled) return;
        setChannels(loadedChannels);
        setChannelId((current) =>
          loadedChannels.some((channel) => channel.id === current)
            ? current
            : loadedChannels.find(sendableChannel)?.id || "",
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setBotError(
            err instanceof Error
              ? err.message
              : "Could not load Discord channels from the Tech Support bot.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!selectedPoll) return;
    setRequireDiscordName(selectedPoll.requireDiscordName);
    setClosesLocal(toLocalDateTime(selectedPoll.closesAt));
    setMessage(null);
    setDiscordUrl("");
  }, [selectedPoll?.id, selectedPoll?.requireDiscordName, selectedPoll?.closesAt]);

  async function refresh() {
    setLoading(true);
    setError(null);
    setBotError(null);
    try {
      const loadedPolls = await fetchLeadershipPolls();
      setPolls(loadedPolls);
      if (!loadedPolls.some((poll) => poll.id === pollId)) {
        setPollId(loadedPolls.find((poll) => poll.isOpen)?.id || loadedPolls[0]?.id || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh polls.");
    }

    try {
      const loadedChannels = await fetchLeadershipBotChannels();
      setChannels(loadedChannels);
      if (!loadedChannels.some((channel) => channel.id === channelId)) {
        setChannelId(loadedChannels.find(sendableChannel)?.id || "");
      }
    } catch (err) {
      setBotError(
        err instanceof Error
          ? err.message
          : "Could not refresh Discord channels from the Tech Support bot.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveAccessSettings() {
    if (!pollId) {
      setError("Save a poll before setting its voting requirements.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await updateLeadershipPollAccess({
        data: {
          pollId,
          requireDiscordName,
          closesAt: toIsoDateTime(closesLocal),
        },
      });
      setPolls((current) => current.map((poll) => (poll.id === saved.id ? saved : poll)));
      setMessage("Voting requirements and closing timer saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save poll requirements.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!pollId || !channelId) {
      setError("Select a saved poll and a Discord channel first.");
      return;
    }
    setPublishing(true);
    setError(null);
    setMessage(null);
    setDiscordUrl("");
    try {
      const result = await publishLeadershipPollToDiscord({
        data: { pollId, channelId },
      });
      setDiscordUrl(result.url || "");
      setMessage(`Posted “${selectedPoll?.title || "Poll"}” in #${result.channelName}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the poll panel to Discord.");
    } finally {
      setPublishing(false);
    }
  }

  if (!active) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[80] max-w-[calc(100vw-2.5rem)] print:hidden">
      {open ? (
        <section className="max-h-[calc(100vh-2.5rem)] w-[min(31rem,calc(100vw-2.5rem))] overflow-y-auto rounded-xl border border-primary/30 bg-[#080b0d]/[0.98] shadow-2xl backdrop-blur-xl">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-primary/20 bg-[#0b1012]/[0.98] px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Settings2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">Poll management</p>
                <h2 className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  Requirements & Discord Panel
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-primary/50 hover:text-fg"
              aria-label="Close poll tools"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="space-y-5 p-4">
            {error ? (
              <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {message}
                </span>
              </div>
            ) : null}

            <label className="grid gap-2">
              <span className="stencil text-[8px] tracking-[0.12em] text-primary">Saved website poll</span>
              <select
                value={pollId}
                onChange={(event) => setPollId(event.target.value)}
                className={selectClass}
                disabled={loading || !polls.length}
              >
                {!polls.length ? <option value="">No saved polls</option> : null}
                {polls.map((poll) => (
                  <option key={poll.id} value={poll.id}>
                    {poll.isOpen ? "[Open]" : "[Closed]"} {poll.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedPoll ? (
              <div className="rounded-lg border border-border bg-black/30 p-3">
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                  {selectedPoll.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {selectedPoll.totalVoters} voter{selectedPoll.totalVoters === 1 ? "" : "s"} · {selectedPoll.totalVotes} selections · up to {selectedPoll.maxSelections} choices
                </p>
                <a
                  href={`/poll/${selectedPoll.shareCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Open voting page <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}

            <section className="rounded-lg border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                    Discord-name requirement
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    When enabled, voters must enter a Discord username or server display name. Names are only shown to leadership.
                  </p>
                </div>
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-md border border-border bg-black/25 p-3">
                <input
                  type="checkbox"
                  checked={requireDiscordName}
                  onChange={(event) => setRequireDiscordName(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                <span className="text-sm font-semibold text-fg">Require Discord name before voting</span>
              </label>
            </section>

            <section className="rounded-lg border border-border bg-black/25 p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                    Automatic closing timer
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Leave blank for manual closing. The website blocks new or changed votes once this time is reached.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="datetime-local"
                  value={closesLocal}
                  onChange={(event) => setClosesLocal(event.target.value)}
                  className={inputClass}
                />
                <Button type="button" variant="secondary" onClick={() => setClosesLocal("")}>
                  Clear
                </Button>
              </div>
              {selectedPoll?.closesAt ? (
                <p className="mt-2 text-xs text-muted">
                  Current deadline: {formatDateTime(selectedPoll.closesAt)}
                </p>
              ) : null}
            </section>

            <Button
              type="button"
              className="w-full"
              disabled={saving || loading || !pollId}
              onClick={() => void saveAccessSettings()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Requirements & Timer"}
            </Button>

            {selectedPoll ? (
              <details className="rounded-lg border border-border bg-black/25 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-fg">
                  <Users className="h-4 w-4 text-primary" /> Recorded Voters ({selectedPoll.voters.length})
                </summary>
                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {selectedPoll.voters.length ? (
                    selectedPoll.voters.slice(0, 100).map((voter, index) => (
                      <div key={`${voter.updatedAt}-${index}`} className="rounded-md border border-border bg-black/30 p-3">
                        <p className="text-sm font-semibold text-fg">
                          {voter.discordName || "Discord name not provided"}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {voter.selectedLabels.join(", ") || "No active selections"}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-subtle">
                          Updated {formatDateTime(voter.updatedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted">No votes have been recorded yet.</p>
                  )}
                </div>
              </details>
            ) : null}

            <section className="border-t border-border pt-5">
              <div className="flex items-start gap-3">
                <MessageSquareShare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                    Discord voting panel
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    The Tech Support bot posts the poll details, answer artwork, deadline and a button that opens the official website vote. Discord does not create a second set of votes.
                  </p>
                </div>
              </div>

              {botError ? (
                <div className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                  {botError}
                </div>
              ) : null}

              <label className="mt-4 grid gap-2">
                <span className="stencil text-[8px] tracking-[0.12em] text-primary">Discord destination</span>
                <select
                  value={channelId}
                  onChange={(event) => setChannelId(event.target.value)}
                  className={selectClass}
                  disabled={loading || !visibleChannels.length}
                >
                  {!visibleChannels.length ? <option value="">No sendable channels found</option> : null}
                  {visibleChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channelLabel(channel)}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type="button"
                className="mt-3 w-full"
                disabled={loading || publishing || !pollId || !channelId}
                onClick={() => void publish()}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareShare className="h-4 w-4" />}
                {publishing ? "Posting…" : "Post Discord Poll Panel"}
              </Button>

              {discordUrl ? (
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/15"
                >
                  Open Discord Post <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </section>

            <Button type="button" variant="secondary" className="w-full" disabled={loading || saving || publishing} onClick={() => void refresh()}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Poll Tools
            </Button>
          </div>
        </section>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="h-12 shadow-2xl">
          <Settings2 className="h-4 w-4" /> Poll Tools
        </Button>
      )}
    </div>
  );
}
