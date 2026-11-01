import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquareShare,
  RadioTower,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipBotChannels,
  type LeadershipDiscordChannel,
} from "@/lib/bot-control-fn";
import { publishLeadershipPollToDiscord } from "@/lib/poll-discord-fn";
import { fetchLeadershipPolls } from "@/lib/polls-fn";
import type { LeadershipPoll } from "@/lib/polls";

const selectClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/70 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function channelLabel(channel: LeadershipDiscordChannel): string {
  const category = channel.parentName?.trim();
  return `${category ? `${category} / ` : ""}#${channel.name}`;
}

function sendableChannel(channel: LeadershipDiscordChannel): boolean {
  return channel.type == null || [0, 5, 15, 16].includes(Number(channel.type));
}

export function PollDiscordDock() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = pathname === "/leadership-polls";
  const [open, setOpen] = useState(false);
  const [polls, setPolls] = useState<LeadershipPoll[]>([]);
  const [channels, setChannels] = useState<LeadershipDiscordChannel[]>([]);
  const [pollId, setPollId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [discordUrl, setDiscordUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    void Promise.all([fetchLeadershipPolls(), fetchLeadershipBotChannels()])
      .then(([loadedPolls, loadedChannels]) => {
        if (cancelled) return;
        setPolls(loadedPolls);
        setChannels(loadedChannels);
        setPollId((current) =>
          loadedPolls.some((poll) => poll.id === current)
            ? current
            : loadedPolls.find((poll) => poll.isOpen)?.id || loadedPolls[0]?.id || "",
        );
        setChannelId((current) =>
          loadedChannels.some((channel) => channel.id === current)
            ? current
            : loadedChannels.find(sendableChannel)?.id || "",
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load Discord publishing options.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [loadedPolls, loadedChannels] = await Promise.all([
        fetchLeadershipPolls(),
        fetchLeadershipBotChannels(),
      ]);
      setPolls(loadedPolls);
      setChannels(loadedChannels);
      if (!loadedPolls.some((poll) => poll.id === pollId)) {
        setPollId(loadedPolls.find((poll) => poll.isOpen)?.id || loadedPolls[0]?.id || "");
      }
      if (!loadedChannels.some((channel) => channel.id === channelId)) {
        setChannelId(loadedChannels.find(sendableChannel)?.id || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh Discord publishing options.");
    } finally {
      setLoading(false);
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
      setError(err instanceof Error ? err.message : "Could not post the poll to Discord.");
    } finally {
      setPublishing(false);
    }
  }

  if (!active) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[80] max-w-[calc(100vw-2.5rem)] print:hidden">
      {open ? (
        <section className="w-[min(28rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl border border-primary/30 bg-[#080b0d]/[0.98] shadow-2xl backdrop-blur-xl">
          <header className="flex items-start justify-between gap-4 border-b border-primary/20 bg-primary/10 px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-black/35 text-primary">
                <RadioTower className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">Discord distribution</p>
                <h2 className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  Post Website Poll
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-primary/50 hover:text-fg"
              aria-label="Close Discord poll publisher"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="space-y-4 p-4">
            <p className="text-xs leading-relaxed text-muted">
              The bot posts the poll summary, answer artwork and a link button. Voting still happens only on the hidden 1stmid.com page, so Discord and the website never split the results.
            </p>

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
                onChange={(event) => {
                  setPollId(event.target.value);
                  setMessage(null);
                  setDiscordUrl("");
                }}
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

            <label className="grid gap-2">
              <span className="stencil text-[8px] tracking-[0.12em] text-primary">Discord destination</span>
              <select
                value={channelId}
                onChange={(event) => {
                  setChannelId(event.target.value);
                  setMessage(null);
                  setDiscordUrl("");
                }}
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

            {selectedPoll ? (
              <div className="rounded-lg border border-border bg-black/30 p-3">
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                  {selectedPoll.title}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {selectedPoll.options.length} answers · {selectedPoll.totalVotes} votes · {selectedPoll.allowAdditions ? "member additions enabled" : "fixed answers"}
                </p>
                <a
                  href={`/poll/${selectedPoll.shareCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Preview voting page <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                disabled={loading || publishing}
                onClick={() => void refresh()}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={loading || publishing || !pollId || !channelId}
                onClick={() => void publish()}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareShare className="h-4 w-4" />}
                {publishing ? "Posting…" : "Post Poll to Discord"}
              </Button>
            </div>

            {discordUrl ? (
              <a
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/15"
              >
                Open Discord Post <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </section>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="h-12 shadow-2xl">
          <MessageSquareShare className="h-4 w-4" /> Post Poll to Discord
        </Button>
      )}
    </div>
  );
}
