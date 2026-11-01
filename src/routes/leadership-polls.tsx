import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Link2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Vote,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { MediaUploadField } from "@/components/media-upload-field";
import { Button } from "@/components/ui/button";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import { listLeadershipMedia, type LeadershipMediaItem } from "@/lib/media-fn";
import {
  deleteLeadershipPoll,
  fetchLeadershipPolls,
  saveLeadershipPoll,
} from "@/lib/polls-fn";
import type { LeadershipPoll, PollOptionInput } from "@/lib/polls";

export const Route = createFileRoute("/leadership-polls")({
  component: LeadershipPollsPage,
  head: () => ({
    meta: [
      { title: "Poll Command — 1st Mobile Infantry" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const textareaClass =
  "min-h-24 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-primary/70";

const emojiPresets = ["👍", "👎", "✅", "❌", "⭐", "🔥", "🎮", "🪖", "🏆", "⚔️", "🛡️", "🚁"];

type DraftOption = {
  id: string;
  label: string;
  emoji: string;
  imageUrl: string;
  votes: number;
  isUserAdded: boolean;
};

type DraftPoll = {
  id?: string;
  shareCode?: string;
  title: string;
  description: string;
  allowAdditions: boolean;
  isOpen: boolean;
  maxSelections: number;
  totalVotes: number;
  options: DraftOption[];
};

function draftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `draft-${crypto.randomUUID()}`
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function blankOption(index: number): DraftOption {
  return {
    id: draftId(),
    label: `Option ${index + 1}`,
    emoji: "",
    imageUrl: "",
    votes: 0,
    isUserAdded: false,
  };
}

function blankPoll(): DraftPoll {
  return {
    title: "New Community Poll",
    description: "",
    allowAdditions: false,
    isOpen: true,
    maxSelections: 2,
    totalVotes: 0,
    options: [blankOption(0), blankOption(1)],
  };
}

function pollToDraft(poll: LeadershipPoll): DraftPoll {
  return {
    id: poll.id,
    shareCode: poll.shareCode,
    title: poll.title,
    description: poll.description,
    allowAdditions: poll.allowAdditions,
    isOpen: poll.isOpen,
    maxSelections: poll.maxSelections,
    totalVotes: poll.totalVotes,
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      emoji: option.emoji,
      imageUrl: option.imageUrl,
      votes: option.votes,
      isUserAdded: option.isUserAdded,
    })),
  };
}

function LeadershipPollsPage() {
  const [polls, setPolls] = useState<LeadershipPoll[]>([]);
  const [media, setMedia] = useState<LeadershipMediaItem[]>([]);
  const [draft, setDraft] = useState<DraftPoll>(() => blankPoll());
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = draft.shareCode && origin ? `${origin}/poll/${draft.shareCode}` : "";

  const sortedPolls = useMemo(
    () => [...polls].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [polls],
  );

  useEffect(() => {
    let cancelled = false;
    setOrigin(window.location.origin);
    setLoading(true);
    setError(null);
    void Promise.all([
      fetchLocalLeadershipProfile(),
      fetchLeadershipPolls(),
      listLeadershipMedia(),
    ])
      .then(([profile, loadedPolls, loadedMedia]) => {
        if (cancelled) return;
        if (!profile) {
          window.location.href = "/login?next=%2Fleadership-polls";
          return;
        }
        setPolls(loadedPolls);
        setMedia(loadedMedia);
        setDraft(loadedPolls[0] ? pollToDraft(loadedPolls[0]) : blankPoll());
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load Poll Command.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshPolls(selectId?: string) {
    setRefreshing(true);
    setError(null);
    try {
      const loaded = await fetchLeadershipPolls();
      setPolls(loaded);
      const selected = loaded.find((poll) => poll.id === (selectId || draft.id));
      if (selected) setDraft(pollToDraft(selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh polls.");
    } finally {
      setRefreshing(false);
    }
  }

  function updateOption(index: number, patch: Partial<DraftOption>) {
    setMessage(null);
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }));
  }

  function removeOption(index: number) {
    if (draft.options.length <= 2) {
      setError("A poll needs at least two answers.");
      return;
    }
    const option = draft.options[index];
    if (option.votes > 0 && !window.confirm(`Hide “${option.label}” and its ${option.votes} vote${option.votes === 1 ? "" : "s"} from the poll?`)) {
      return;
    }
    setDraft((current) => {
      const options = current.options.filter((_, optionIndex) => optionIndex !== index);
      return {
        ...current,
        options,
        maxSelections: Math.min(current.maxSelections, options.length),
      };
    });
  }

  async function savePoll() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const options: PollOptionInput[] = draft.options.map((option) => ({
        id: option.id,
        label: option.label,
        emoji: option.emoji,
        imageUrl: option.imageUrl,
      }));
      const saved = await saveLeadershipPoll({
        data: {
          id: draft.id,
          title: draft.title,
          description: draft.description,
          allowAdditions: draft.allowAdditions,
          isOpen: draft.isOpen,
          maxSelections: draft.maxSelections,
          options,
        },
      });
      setDraft(pollToDraft(saved));
      setPolls((current) => {
        const found = current.some((poll) => poll.id === saved.id);
        return found
          ? current.map((poll) => (poll.id === saved.id ? saved : poll))
          : [saved, ...current];
      });
      setMessage(draft.id ? "Poll changes saved." : "Poll created. Copy the private link when you are ready to share it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the poll.");
    } finally {
      setSaving(false);
    }
  }

  async function removePoll() {
    if (!draft.id) {
      setDraft(blankPoll());
      return;
    }
    if (!window.confirm(`Permanently delete “${draft.title}” and all of its votes?`)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await deleteLeadershipPoll({ data: { id: draft.id } });
      const remaining = polls.filter((poll) => poll.id !== draft.id);
      setPolls(remaining);
      setDraft(remaining[0] ? pollToDraft(remaining[0]) : blankPoll());
      setMessage("Poll deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the poll.");
    } finally {
      setSaving(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the poll link. Select it manually instead.");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-20 text-center text-muted">
          Loading Poll Command…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Leadership community tools"
        title="Poll Command"
        body="Create unlisted link-only polls, set how many answers each person may choose, attach images or icons, and optionally let voters add answers you missed."
        meta="1ST MI DIV · POLL SYSTEM v1.1"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary">
            <Link to="/leadership-control"><ShieldCheck className="h-4 w-4" /> Leadership Control</Link>
          </Button>
          <Button type="button" variant="secondary" disabled={refreshing} onClick={() => void refreshPolls()}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh Results
          </Button>
          <Button type="button" onClick={() => { setDraft(blankPoll()); setMessage(null); setError(null); }}>
            <Plus className="h-4 w-4" /> New Poll
          </Button>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}
        {message ? (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <Check className="h-4 w-4" /> {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[19rem_1fr]">
          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <section className="panel panel-static p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="stencil text-[9px] tracking-[0.14em] text-primary">Poll archive</p>
                  <h2 className="mt-1 font-display text-xl font-semibold uppercase text-fg">{polls.length} Polls</h2>
                </div>
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                {sortedPolls.length ? sortedPolls.map((poll) => (
                  <button
                    key={poll.id}
                    type="button"
                    onClick={() => { setDraft(pollToDraft(poll)); setMessage(null); setError(null); }}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${draft.id === poll.id ? "border-primary bg-primary/10" : "border-border bg-black/25 hover:border-primary/40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-display text-sm font-semibold uppercase tracking-wide text-fg">{poll.title}</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] uppercase ${poll.isOpen ? "border-primary/30 text-primary" : "border-amber-300/30 text-amber-100"}`}>
                        {poll.isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {poll.totalVotes} votes · {poll.options.length} answers · up to {poll.maxSelections} choice{poll.maxSelections === 1 ? "" : "s"}
                    </p>
                  </button>
                )) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">No saved polls yet.</p>
                )}
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="stencil text-[9px] tracking-[0.14em] text-primary">Unlisted access</p>
                  <h2 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
                    {draft.id ? "Edit Poll" : "Create Poll"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    Public polls are not placed in the website navigation and are marked no-index. Anyone with the generated link can vote.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={saving} onClick={() => void savePoll()}>
                    <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Poll"}
                  </Button>
                  <Button type="button" variant="secondary" disabled={saving} onClick={() => void removePoll()} className="border-red-400/30 text-red-200 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" /> {draft.id ? "Delete" : "Reset"}
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Poll title" className="sm:col-span-2">
                  <input className={inputClass} value={draft.title} maxLength={160} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea className={textareaClass} rows={4} value={draft.description} maxLength={4000} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
                </Field>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-black/25 p-4">
                  <input type="checkbox" checked={draft.isOpen} onChange={(event) => setDraft((current) => ({ ...current, isOpen: event.target.checked }))} className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]" />
                  <span>
                    <span className="block font-display text-base font-semibold uppercase text-fg">Voting open</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">Turn this off to freeze voting while keeping results visible.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-black/25 p-4">
                  <input type="checkbox" checked={draft.allowAdditions} onChange={(event) => setDraft((current) => ({ ...current, allowAdditions: event.target.checked }))} className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]" />
                  <span>
                    <span className="block font-display text-base font-semibold uppercase text-fg">Allow added answers</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">Voters can add a missing text/emoji answer and immediately vote for it.</span>
                  </span>
                </label>
                <Field
                  label="Answers allowed per person"
                  help="Set 1 for a normal single-choice poll, or a higher number to let each person select several answers."
                  className="sm:col-span-2"
                >
                  <div className="grid gap-3 rounded-lg border border-primary/25 bg-primary/10 p-4 sm:grid-cols-[10rem_1fr] sm:items-center">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, draft.options.length)}
                      value={draft.maxSelections}
                      onChange={(event) => {
                        const value = Math.max(1, Math.min(draft.options.length, Math.floor(Number(event.target.value) || 1)));
                        setDraft((current) => ({ ...current, maxSelections: value }));
                      }}
                      className={inputClass}
                    />
                    <p className="text-sm leading-relaxed text-muted">
                      {draft.maxSelections === 1
                        ? "Members can select one answer. Choosing another replaces the first selection."
                        : `Members can select up to ${draft.maxSelections} answers before submitting or updating their vote.`}
                    </p>
                  </div>
                </Field>
              </div>

              {draft.id && shareUrl ? (
                <div className="mt-5 rounded-lg border border-primary/25 bg-primary/10 p-4">
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-primary" />
                    <p className="stencil text-[9px] tracking-[0.12em] text-primary">Private share link</p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 lg:flex-row">
                    <input readOnly value={shareUrl} className={`${inputClass} min-w-0 flex-1 font-mono text-xs`} />
                    <Button type="button" variant="secondary" onClick={() => void copyShareLink()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy Link"}
                    </Button>
                    <a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-strong bg-black/30 px-4 font-display text-sm font-semibold uppercase tracking-[0.08em] text-fg hover:border-primary/50">
                      Open Poll <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
                  <Link2 className="h-5 w-5 text-primary" /> Save this poll to generate its unlisted share link.
                </div>
              )}
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="stencil text-[9px] tracking-[0.14em] text-primary">Answer builder</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">Poll Answers</h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDraft((current) => ({
                    ...current,
                    options: [...current.options, blankOption(current.options.length)],
                  }))}
                >
                  <Plus className="h-4 w-4" /> Add Answer
                </Button>
              </div>

              <div className="mt-6 space-y-5">
                {draft.options.map((option, index) => {
                  const percentage = draft.totalVotes > 0 ? Math.round((option.votes / draft.totalVotes) * 100) : 0;
                  return (
                    <details key={option.id} className="rounded-xl border border-border bg-black/25 p-4 sm:p-5" open={index === 0}>
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            {option.imageUrl ? <img src={option.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-md border border-border object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-black/40 text-2xl">{option.emoji || index + 1}</span>}
                            <div className="min-w-0">
                              <p className="truncate font-display text-lg font-semibold uppercase text-fg">{option.label || `Answer ${index + 1}`}</p>
                              <p className="mt-1 text-xs text-muted">{option.votes} votes · {percentage}%{option.isUserAdded ? " · Community added" : ""}</p>
                            </div>
                          </div>
                          <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
                        </div>
                      </summary>

                      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_19rem]">
                        <div className="space-y-4">
                          <Field label="Answer text">
                            <input className={inputClass} value={option.label} maxLength={100} onChange={(event) => updateOption(index, { label: event.target.value })} />
                          </Field>
                          <Field label="Emoji or compact icon text" help="Optional. Paste an emoji or a very short symbol.">
                            <input className={inputClass} value={option.emoji} maxLength={24} placeholder="e.g. 🪖" onChange={(event) => updateOption(index, { emoji: event.target.value })} />
                          </Field>
                          <div className="flex flex-wrap gap-2">
                            {emojiPresets.map((emoji) => (
                              <button key={emoji} type="button" onClick={() => updateOption(index, { emoji })} className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-black/30 text-xl transition-colors hover:border-primary/50" title={`Use ${emoji}`}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <MediaUploadField
                            label="Answer image / icon"
                            help="Upload a JPG, PNG or WebP, paste a Media Library path, or select an existing image below."
                            value={option.imageUrl}
                            onChange={(value) => updateOption(index, { imageUrl: value })}
                            square
                            compact
                          />
                          <MediaPicker items={media} selected={option.imageUrl} onSelect={(url) => updateOption(index, { imageUrl: url })} />
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-lg border border-border bg-black/30 p-4">
                            <p className="stencil text-[8px] tracking-[0.12em] text-primary">Current result</p>
                            <p className="mt-2 font-display text-3xl font-semibold text-primary">{percentage}%</p>
                            <p className="mt-1 text-sm text-muted">{option.votes} vote{option.votes === 1 ? "" : "s"}</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                          <Button type="button" variant="secondary" onClick={() => removeOption(index)} className="w-full border-red-400/30 text-red-200 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" /> Remove Answer
                          </Button>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="stencil text-[9px] tracking-[0.14em] text-primary">Live totals</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{draft.totalVotes} Votes Recorded</h2>
                </div>
                <Button type="button" disabled={saving} onClick={() => void savePoll()}>
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Poll"}
                </Button>
              </div>
            </section>
          </main>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, help, className, children }: { label: string; help?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`grid gap-2 ${className || ""}`}>
      <span className="stencil text-[8px] tracking-[0.12em] text-primary">{label}</span>
      {help ? <span className="text-xs leading-relaxed text-muted">{help}</span> : null}
      {children}
    </label>
  );
}

function MediaPicker({ items, selected, onSelect }: { items: LeadershipMediaItem[]; selected: string; onSelect: (url: string) => void }) {
  return (
    <details className="rounded-lg border border-border bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-fg">
        <ImageIcon className="h-4 w-4 text-primary" /> Select from Media Library
      </summary>
      {items.length ? (
        <div className="mt-4 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5">
          {items.slice(0, 100).map((item) => (
            <button key={item.id} type="button" onClick={() => onSelect(item.url)} className={`overflow-hidden rounded-md border bg-black/40 transition-colors ${selected === item.url ? "border-primary" : "border-border hover:border-primary/50"}`} title={`Use ${item.fileName}`}>
              <img src={item.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">The Media Library is empty. Upload an image above first.</p>
      )}
    </details>
  );
}
