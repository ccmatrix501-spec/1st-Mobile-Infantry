import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  CirclePlus,
  LockKeyhole,
  Send,
  Users,
  Vote,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  addPublicPollOption,
  fetchPublicPoll,
  votePublicPoll,
} from "@/lib/polls-fn";
import type { PublicPoll } from "@/lib/polls";

export const Route = createFileRoute("/poll/$shareCode")({
  component: HiddenPollPage,
  head: () => ({
    meta: [
      { title: "Community Poll — 1st Mobile Infantry" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
});

const VOTER_STORAGE_KEY = "1stmi.poll.voter-key";

function getBrowserVoterKey(): string {
  const existing = window.localStorage.getItem(VOTER_STORAGE_KEY)?.trim() || "";
  if (/^[a-z0-9_-]{16,160}$/i.test(existing)) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VOTER_STORAGE_KEY, next);
  return next;
}

function HiddenPollPage() {
  const { shareCode } = Route.useParams();
  const [poll, setPoll] = useState<PublicPoll | null>(null);
  const [voterKey, setVoterKey] = useState("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [otherLabel, setOtherLabel] = useState("");
  const [otherEmoji, setOtherEmoji] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = getBrowserVoterKey();
    setVoterKey(key);
    setLoading(true);
    setError(null);
    void fetchPublicPoll({ data: { shareCode, voterKey: key } })
      .then((value) => {
        if (cancelled) return;
        setPoll(value);
        setSelectedOptionIds(value?.selectedOptionIds || (value?.selectedOptionId ? [value.selectedOptionId] : []));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this poll.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareCode]);

  const winningVotes = useMemo(
    () => Math.max(0, ...(poll?.options.map((option) => option.votes) || [0])),
    [poll],
  );

  function toggleOption(optionId: string) {
    if (!poll || !poll.isOpen || working) return;
    setMessage(null);
    setError(null);
    setSelectedOptionIds((current) => {
      if (current.includes(optionId)) return current.filter((id) => id !== optionId);
      if (poll.maxSelections === 1) return [optionId];
      if (current.length >= poll.maxSelections) {
        setError(`You can select up to ${poll.maxSelections} answers in this poll.`);
        return current;
      }
      return [...current, optionId];
    });
  }

  async function submitVote() {
    if (!poll || !voterKey || !selectedOptionIds.length) {
      setError("Choose at least one answer before submitting your vote.");
      return;
    }
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await votePublicPoll({
        data: { shareCode: poll.shareCode, optionIds: selectedOptionIds, voterKey },
      });
      setPoll(updated);
      setSelectedOptionIds(updated.selectedOptionIds || []);
      setMessage(
        updated.selectedOptionIds.length === 1
          ? "Your vote has been recorded. You can change it while the poll is open."
          : `Your ${updated.selectedOptionIds.length} selections have been recorded. You can change them while the poll is open.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your vote.");
    } finally {
      setWorking(false);
    }
  }

  async function addAnswerAndVote() {
    if (!poll || !voterKey) return;
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await addPublicPollOption({
        data: {
          shareCode: poll.shareCode,
          label: otherLabel,
          emoji: otherEmoji,
          voterKey,
        },
      });
      setPoll(updated);
      setSelectedOptionIds(updated.selectedOptionIds || []);
      setOtherLabel("");
      setOtherEmoji("");
      setMessage("Your answer was added and included in your vote.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that answer.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 py-20 text-center text-muted">
          Loading secure poll link…
        </div>
      </AppShell>
    );
  }

  if (!poll) {
    return (
      <AppShell>
        <PageHero
          kicker="Link-only community poll"
          title="Poll Not Available"
          body="This private poll link is invalid, expired, or no longer available."
          meta="1ST MI DIV · UNLISTED PAGE"
        />
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <LockKeyhole className="mx-auto h-12 w-12 text-primary" />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Ask the poll organiser for the current link.
          </p>
          {error ? (
            <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </section>
      </AppShell>
    );
  }

  const selectionInstruction = poll.maxSelections === 1
    ? "Select one answer. Choosing another replaces your current selection."
    : `Select up to ${poll.maxSelections} answers, then submit them together.`;

  return (
    <AppShell>
      <PageHero
        kicker="Link-only community poll"
        title={poll.title}
        body={poll.description || "Cast your vote below."}
        meta={`1ST MI DIV · ${poll.isOpen ? "VOTING OPEN" : "VOTING CLOSED"}`}
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard icon={<Users className="h-5 w-5" />} label="Votes" value={String(poll.totalVotes)} />
          <StatusCard icon={<Vote className="h-5 w-5" />} label="Answers" value={String(poll.options.length)} />
          <StatusCard icon={<CheckCircle2 className="h-5 w-5" />} label="Choices" value={`Up to ${poll.maxSelections}`} />
          <StatusCard icon={<LockKeyhole className="h-5 w-5" />} label="Access" value="Link only" />
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        ) : null}
        {!poll.isOpen ? (
          <div className="mb-5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Voting is closed. Final results remain visible below.
          </div>
        ) : null}

        {poll.isOpen ? (
          <div className="mb-5 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-fg">
            {selectionInstruction} You currently have <strong>{selectedOptionIds.length}</strong> selected.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {poll.options.map((option) => {
            const selected = selectedOptionIds.includes(option.id);
            const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
            const leading = poll.totalVotes > 0 && option.votes === winningVotes;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!poll.isOpen || working}
                aria-pressed={selected}
                onClick={() => toggleOption(option.id)}
                className={`group overflow-hidden rounded-xl border text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]"
                    : "border-border bg-black/35 hover:border-primary/45"
                } disabled:cursor-default disabled:opacity-90`}
              >
                {option.imageUrl ? (
                  <div className="aspect-[16/8] overflow-hidden border-b border-border bg-black/50">
                    <img
                      src={option.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border ${poll.maxSelections > 1 ? "rounded-md" : "rounded-full"} ${selected ? "border-primary bg-primary text-black" : "border-border-strong"}`}>
                      {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </span>
                    {option.emoji ? <span className="text-2xl leading-none" aria-hidden>{option.emoji}</span> : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                          {option.label}
                        </h2>
                        {option.isUserAdded ? (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-wide text-muted">
                            Community added
                          </span>
                        ) : null}
                        {leading ? (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                            Leading
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted">
                        <span>{option.votes} vote{option.votes === 1 ? "" : "s"}</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {poll.isOpen ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              One saved response per browser. Your response may contain up to {poll.maxSelections} selected answer{poll.maxSelections === 1 ? "" : "s"}.
            </p>
            <Button type="button" size="lg" disabled={working || !selectedOptionIds.length} onClick={() => void submitVote()}>
              <Send className="h-4 w-4" /> {working ? "Submitting…" : poll.selectedOptionIds.length ? "Update Vote" : "Submit Vote"}
            </Button>
          </div>
        ) : null}

        {poll.isOpen && poll.allowAdditions ? (
          <section className="panel panel-static mt-8 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <CirclePlus className="h-5 w-5" />
              </span>
              <div>
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">Missing an option?</p>
                <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                  Add Another Answer
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Add a concise answer that is not already listed. It will be added to the poll and included in your saved selections, provided you have not reached the selection limit.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[7rem_1fr_auto]">
              <input
                value={otherEmoji}
                onChange={(event) => setOtherEmoji(event.target.value)}
                maxLength={24}
                placeholder="Emoji/icon"
                className="h-11 rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none focus:border-primary/70"
              />
              <input
                value={otherLabel}
                onChange={(event) => setOtherLabel(event.target.value)}
                maxLength={100}
                placeholder="New answer"
                className="h-11 rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none focus:border-primary/70"
              />
              <Button type="button" disabled={working || otherLabel.trim().length < 2} onClick={() => void addAnswerAndVote()}>
                <CirclePlus className="h-4 w-4" /> Add & Vote
              </Button>
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}

function StatusCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel panel-static flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="stencil text-[8px] tracking-[0.12em] text-primary">{label}</p>
        <p className="mt-1 font-display text-xl font-semibold uppercase text-fg">{value}</p>
      </div>
    </div>
  );
}
