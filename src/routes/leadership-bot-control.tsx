import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  History,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import {
  cancelLeadershipBotOperation,
  closeLeadershipBotTicket,
  createLeadershipBotOperation,
  fetchLeadershipBotAudit,
  fetchLeadershipBotChannels,
  fetchLeadershipBotMember,
  fetchLeadershipBotModules,
  fetchLeadershipBotOperations,
  fetchLeadershipBotSafety,
  fetchLeadershipBotStatus,
  fetchLeadershipBotTickets,
  restartLeadershipBotModule,
  syncLeadershipAutomaticRoles,
  undoLeadershipBotAudit,
  type BotControlModule,
  type BotControlStatus,
  type BotMemberProfile,
  type BotSafety,
  type LeadershipAuditEntry,
  type LeadershipDiscordChannel,
  type LeadershipOperation,
  type LeadershipTicket,
} from "@/lib/bot-control-fn";

export const Route = createFileRoute("/leadership-bot-control")({
  component: LeadershipBotControlPage,
  head: () => ({
    meta: [{ title: "Tech Support Bot Controller — 1st Mobile Infantry" }],
  }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaClass =
  "min-h-24 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function LeadershipBotControlPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<BotControlStatus | null>(null);
  const [safety, setSafety] = useState<BotSafety | null>(null);
  const [modules, setModules] = useState<BotControlModule[]>([]);
  const [tickets, setTickets] = useState<LeadershipTicket[]>([]);
  const [operations, setOperations] = useState<LeadershipOperation[]>([]);
  const [audit, setAudit] = useState<LeadershipAuditEntry[]>([]);
  const [channels, setChannels] = useState<LeadershipDiscordChannel[]>([]);
  const [memberId, setMemberId] = useState("");
  const [member, setMember] = useState<BotMemberProfile | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [operationDraft, setOperationDraft] = useState({
    channelId: "",
    title: "",
    date: "",
    time: "",
    game: "",
    details: "",
  });

  const loadController = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    setError(null);
    try {
      const profile = await fetchLocalLeadershipProfile();
      if (!profile) {
        window.location.href = "/login?next=/leadership-bot-control";
        return;
      }
      const [
        nextStatus,
        nextSafety,
        nextModules,
        nextTickets,
        nextOperations,
        nextAudit,
        nextChannels,
      ] = await Promise.all([
        fetchLeadershipBotStatus(),
        fetchLeadershipBotSafety(),
        fetchLeadershipBotModules(),
        fetchLeadershipBotTickets(),
        fetchLeadershipBotOperations(),
        fetchLeadershipBotAudit({ data: { limit: 30 } }),
        fetchLeadershipBotChannels(),
      ]);
      setStatus(nextStatus);
      setSafety(nextSafety);
      setModules(nextModules);
      setTickets(nextTickets);
      setOperations(nextOperations);
      setAudit(nextAudit);
      setChannels(nextChannels);
      setOperationDraft((current) => ({
        ...current,
        channelId: current.channelId || nextChannels[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to the Tech Support bot.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadController(true);
  }, [loadController]);

  async function runAction(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await loadController(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function lookupMember() {
    const id = memberId.trim();
    if (!/^\d{16,22}$/.test(id)) {
      setError("Enter the member's numeric Discord user ID.");
      return;
    }
    setBusy("member");
    setError(null);
    setMember(null);
    try {
      setMember(await fetchLeadershipBotMember({ data: { memberId: id } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Member lookup failed.");
    } finally {
      setBusy(null);
    }
  }

  const openTickets = tickets.filter((ticket) => ticket.status === "open");
  const activeOperations = operations.filter((operation) => operation.status === "active");

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center text-muted">
          Loading Tech Support Bot Controller…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Leadership-only infrastructure"
        title="Tech Support Bot Controller"
        body="Live control and monitoring for the 1st M.I. Tech Support bot, protected by the existing Leadership account system."
        meta="1ST MI DIV · SECURE BOT SERVER CONTROL"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/leadership-control">
              <ArrowLeft className="h-4 w-4" />
              Leadership Control
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={refreshing || Boolean(busy)}
            onClick={() => void loadController()}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh Live Data"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={Boolean(busy)}
            onClick={() =>
              void runAction(
                "role-sync",
                () => syncLeadershipAutomaticRoles(),
                "Automatic Add/Remove role sync completed.",
              )
            }
          >
            <Users className="h-4 w-4" />
            Sync Automatic Roles
          </Button>
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            icon={<Bot className="h-5 w-5" />}
            label="Bot status"
            value={status?.botReady ? "ONLINE" : "OFFLINE"}
            detail={status?.botUser?.tag || "Tech Support bot unavailable"}
            good={Boolean(status?.botReady)}
          />
          <StatusCard
            icon={<Activity className="h-5 w-5" />}
            label="Gateway latency"
            value={`${status?.websocketPing ?? 0} ms`}
            detail={status?.guild?.name || "1st M.I. Discord"}
            good={Boolean(status?.botReady && (status?.websocketPing ?? 9999) < 1000)}
          />
          <StatusCard
            icon={<Ticket className="h-5 w-5" />}
            label="Open tickets"
            value={String(openTickets.length)}
            detail={`${tickets.length} stored ticket records`}
            good={true}
          />
          <StatusCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Active operations"
            value={String(activeOperations.length)}
            detail={`${status?.guild?.memberCount ?? "—"} Discord members`}
            good={true}
          />
        </div>

        <ControllerPanel
          kicker="Live infrastructure"
          title="Server Safety Dashboard"
          icon={<ShieldAlert className="h-5 w-5" />}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Health score: <strong className="text-fg">{safety?.score ?? 0}%</strong>
            </p>
            <span className={safety?.ok ? "text-primary" : "text-red-300"}>
              {safety?.ok ? "ALL REVIEWED CHECKS PASS" : "ATTENTION REQUIRED"}
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {(safety?.checks || []).map((check) => (
              <div
                key={check.id}
                className={`rounded-md border p-3 ${
                  check.ok
                    ? "border-primary/20 bg-primary/5"
                    : "border-red-400/25 bg-red-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  )}
                  <div>
                    <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                      {check.label}
                    </p>
                    <p className="mt-1 text-xs text-muted">{check.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ControllerPanel>

        <ControllerPanel
          kicker="Process control"
          title="Bot Modules"
          icon={<Server className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {modules.map((module) => (
              <div
                key={module.id}
                className="grid gap-4 rounded-md border border-border bg-black/20 p-4 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${module.loaded ? "bg-primary" : "bg-red-400"}`} />
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                      {module.label}
                    </h3>
                    <span className="font-mono text-[10px] text-subtle">{module.id}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{module.detail || module.status}</p>
                  {module.lastError ? (
                    <p className="mt-1 text-xs text-red-300">Last error: {module.lastError}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!module.restartable || Boolean(busy)}
                  onClick={() => {
                    if (!window.confirm(`Restart ${module.label}?`)) return;
                    void runAction(
                      `module-${module.id}`,
                      () => restartLeadershipBotModule({ data: { id: module.id } }),
                      `${module.label} recovery requested.`,
                    );
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {module.restartable ? "Restart" : module.restartScope || "Full restart only"}
                </Button>
              </div>
            ))}
          </div>
        </ControllerPanel>

        <div className="grid gap-6 xl:grid-cols-2">
          <ControllerPanel
            kicker="Member management"
            title="Member Profile"
            icon={<Search className="h-5 w-5" />}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className={inputClass}
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                placeholder="Discord user ID"
                inputMode="numeric"
              />
              <Button type="button" disabled={busy === "member"} onClick={() => void lookupMember()}>
                <Search className="h-4 w-4" />
                Lookup
              </Button>
            </div>
            {member ? (
              <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 p-4">
                <div className="flex gap-4">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="font-display text-xl uppercase text-fg">{member.displayName}</h3>
                    <p className="font-mono text-xs text-muted">{member.tag} · {member.id}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Info label="Nickname" value={member.nickname || "None"} />
                  <Info label="Highest role" value={member.highestRole || "None"} />
                  <Info label="Voice" value={member.voiceChannel?.name || "Not connected"} />
                  <Info
                    label="Key permissions"
                    value={member.importantPermissions.length ? member.importantPermissions.join(", ") : "None"}
                  />
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {member.roles.slice(0, 30).map((role) => (
                    <span key={role.id} className="rounded border border-border bg-black/30 px-2 py-1 text-xs text-muted">
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </ControllerPanel>

          <ControllerPanel
            kicker="Support workflow"
            title="Tech Support Tickets"
            icon={<Ticket className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {tickets.slice(0, 20).map((ticket) => (
                <div key={ticket.id} className="flex flex-col gap-3 rounded-md border border-border bg-black/20 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-primary">{ticket.id}</div>
                    <p className="mt-1 text-sm text-fg">Member {ticket.userId} · {ticket.status.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-muted">
                      Created {new Date(ticket.createdAt).toLocaleString()}
                      {ticket.claimedBy ? ` · Claimed by ${ticket.claimedBy}` : ""}
                    </p>
                  </div>
                  {ticket.status === "open" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={Boolean(busy)}
                      onClick={() => {
                        if (!window.confirm("Close this Tech Support ticket?")) return;
                        void runAction(
                          `ticket-${ticket.id}`,
                          () => closeLeadershipBotTicket({ data: { ticketId: ticket.id } }),
                          "Tech Support ticket closed.",
                        );
                      }}
                    >
                      Close Ticket
                    </Button>
                  ) : null}
                </div>
              ))}
              {!tickets.length ? <p className="text-sm text-muted">No ticket records yet.</p> : null}
            </div>
          </ControllerPanel>
        </div>

        <ControllerPanel
          kicker="Operations"
          title="Operation / Event Manager"
          icon={<CalendarDays className="h-5 w-5" />}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-black/20 p-4">
              <h3 className="font-display text-lg font-semibold uppercase text-fg">Publish Event</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted sm:col-span-2">
                  Discord channel
                  <select
                    className={inputClass}
                    value={operationDraft.channelId}
                    onChange={(event) =>
                      setOperationDraft((current) => ({ ...current, channelId: event.target.value }))
                    }
                  >
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.parentName ? `${channel.parentName} / ` : ""}#{channel.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-muted sm:col-span-2">
                  Title
                  <input
                    className={inputClass}
                    value={operationDraft.title}
                    onChange={(event) =>
                      setOperationDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Operation Valaka"
                  />
                </label>
                <label className="text-xs text-muted">
                  Date
                  <input
                    className={inputClass}
                    type="date"
                    value={operationDraft.date}
                    onChange={(event) =>
                      setOperationDraft((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </label>
                <label className="text-xs text-muted">
                  Queensland time
                  <input
                    className={inputClass}
                    type="time"
                    value={operationDraft.time}
                    onChange={(event) =>
                      setOperationDraft((current) => ({ ...current, time: event.target.value }))
                    }
                  />
                </label>
                <label className="text-xs text-muted sm:col-span-2">
                  Game / activity
                  <input
                    className={inputClass}
                    value={operationDraft.game}
                    onChange={(event) =>
                      setOperationDraft((current) => ({ ...current, game: event.target.value }))
                    }
                    placeholder="Hell Let Loose: Vietnam"
                  />
                </label>
                <label className="text-xs text-muted sm:col-span-2">
                  Briefing / details
                  <textarea
                    className={textareaClass}
                    value={operationDraft.details}
                    onChange={(event) =>
                      setOperationDraft((current) => ({ ...current, details: event.target.value }))
                    }
                  />
                </label>
              </div>
              <Button
                className="mt-4"
                disabled={
                  Boolean(busy) ||
                  !operationDraft.channelId ||
                  !operationDraft.title ||
                  !operationDraft.date ||
                  !operationDraft.time
                }
                onClick={() =>
                  void runAction(
                    "operation-create",
                    () => createLeadershipBotOperation({ data: operationDraft }),
                    "Operation/Event published to Discord.",
                  )
                }
              >
                Publish Operation
              </Button>
            </div>

            <div className="space-y-3">
              {operations
                .sort((a, b) => b.targetUnix - a.targetUnix)
                .slice(0, 12)
                .map((operation) => (
                  <div key={operation.id} className="rounded-md border border-border bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display font-semibold uppercase text-fg">{operation.title}</h3>
                      <span className={`font-mono text-[10px] uppercase ${operation.status === "active" ? "text-primary" : "text-red-300"}`}>
                        {operation.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {new Date(operation.targetUnix * 1000).toLocaleString()}
                      {operation.game ? ` · ${operation.game}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-subtle">
                      RSVP: {operation.rsvp?.attending?.length || 0} attending · {operation.rsvp?.maybe?.length || 0} maybe · {operation.rsvp?.unable?.length || 0} unable
                    </p>
                    {operation.status === "active" ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="secondary"
                        disabled={Boolean(busy)}
                        onClick={() => {
                          if (!window.confirm(`Cancel ${operation.title}?`)) return;
                          void runAction(
                            `operation-${operation.id}`,
                            () => cancelLeadershipBotOperation({ data: { operationId: operation.id } }),
                            "Operation/Event cancelled.",
                          );
                        }}
                      >
                        Cancel Event
                      </Button>
                    ) : null}
                  </div>
                ))}
              {!operations.length ? <p className="text-sm text-muted">No operations recorded yet.</p> : null}
            </div>
          </div>
        </ControllerPanel>

        <ControllerPanel
          kicker="Accountability"
          title="Leadership Audit + Undo"
          icon={<History className="h-5 w-5" />}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-black/20 p-3">
            <p className="text-xs text-muted">
              Undo is limited to actions with an explicit safe reversal, such as closing a newly-created ticket or cancelling a newly-created operation.
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={Boolean(busy) || !audit.some((entry) => entry.undo && !entry.undoneAt)}
              onClick={() => {
                const reversible = audit.find((entry) => entry.undo && !entry.undoneAt);
                if (!reversible || !window.confirm(`Undo ${reversible.action}?`)) return;
                void runAction(
                  "audit-undo",
                  () => undoLeadershipBotAudit(),
                  "Newest reversible leadership action undone.",
                );
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Undo Last Reversible
            </Button>
          </div>
          <div className="space-y-3">
            {audit.slice(0, 30).map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-black/20 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">{entry.action}</p>
                  <time className="font-mono text-[10px] text-subtle">{new Date(entry.at).toLocaleString()}</time>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Actor: {entry.actorId || "System"}{entry.undoneAt ? " · Undone" : ""}
                </p>
              </div>
            ))}
          </div>
        </ControllerPanel>

        <div className="mt-6 rounded-md border border-primary/25 bg-primary/5 p-4 text-xs text-muted">
          <strong className="text-primary">Security:</strong> browser clients never receive the bot token or website-to-bot shared secret. Leadership authentication is checked server-side before every controller request.
        </div>
      </section>
    </AppShell>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${
      tone === "error"
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : "border-primary/30 bg-primary/10 text-primary"
    }`}>
      {children}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  detail,
  good,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  good: boolean;
}) {
  return (
    <div className={`panel panel-static p-4 ${good ? "border-primary/25" : "border-red-400/25"}`}>
      <div className={`mb-3 inline-flex rounded-md border p-2 ${good ? "border-primary/30 bg-primary/10 text-primary" : "border-red-400/30 bg-red-500/10 text-red-300"}`}>
        {icon}
      </div>
      <p className="stencil text-[10px] tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function ControllerPanel({
  kicker,
  title,
  icon,
  children,
}: {
  kicker: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 panel panel-feature overflow-hidden">
      <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">{kicker}</p>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">{title}</h2>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="stencil text-[10px] tracking-[0.12em] text-primary">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{value}</dd>
    </div>
  );
}
