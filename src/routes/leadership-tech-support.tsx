import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  CalendarDays,
  History,
  RefreshCw,
  RotateCcw,
  Search,
  ServerCog,
  ShieldCheck,
  Ticket,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import {
  cancelTechSupportOperation,
  closeTechSupportTicket,
  createTechSupportOperation,
  fetchTechSupportMemberProfile,
  fetchTechSupportOverview,
  restartTechSupportModule,
  syncTechSupportRoleAutomation,
  undoTechSupportAuditAction,
  type MemberProfile,
  type TechSupportOverview,
} from "@/lib/tech-support-control-fn";

export const Route = createFileRoute("/leadership-tech-support")({
  component: LeadershipTechSupportPage,
  head: () => ({
    meta: [{ title: "Tech Support Control — 1st Mobile Infantry" }],
  }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const textareaClass =
  "min-h-24 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function fmtDuration(seconds?: number) {
  const total = Math.max(0, Number(seconds || 0));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return `${days ? `${days}d ` : ""}${hours ? `${hours}h ` : ""}${mins}m`;
}

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function LeadershipTechSupportPage() {
  const [overview, setOverview] = useState<TechSupportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [member, setMember] = useState<MemberProfile | null>(null);

  const [operation, setOperation] = useState({
    channelId: "",
    title: "",
    date: "",
    time: "",
    game: "",
    details: "",
  });

  async function loadOverview() {
    setError(null);
    setMessage(null);
    try {
      const data = await fetchTechSupportOverview();
      setOverview(data);
      if (!operation.channelId && data.channels[0]?.id) {
        setOperation((current) => ({ ...current, channelId: data.channels[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Tech Support control.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchLocalLeadershipProfile()
      .then(async (profile) => {
        if (cancelled) return;
        if (!profile) {
          window.location.href = "/login";
          return;
        }
        await loadOverview();
      })
      .catch(() => {
        if (!cancelled) window.location.href = "/login";
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openTickets = useMemo(
    () => (overview?.tickets || []).filter((ticket) => ticket.status === "open"),
    [overview],
  );
  const activeOperations = useMemo(
    () => (overview?.operations || []).filter((item) => item.status === "active"),
    [overview],
  );

  async function runAction(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function lookupMember() {
    setBusy("member");
    setError(null);
    setMessage(null);
    setMember(null);
    try {
      setMember(await fetchTechSupportMemberProfile({ data: { memberId } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Member lookup failed.");
    } finally {
      setBusy(null);
    }
  }

  async function createOperation() {
    await runAction(
      "operation-create",
      () => createTechSupportOperation({ data: operation }),
      "Operation/event published to Discord.",
    );
    setOperation((current) => ({
      ...current,
      title: "",
      date: "",
      time: "",
      game: "",
      details: "",
    }));
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center text-muted">
          Loading Tech Support Control…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Leadership only"
        title="Tech Support Bot Control"
        body="Live server health, member inspection, support tickets, operations, modules and leadership audit controls for the 1st M.I. Tech Support bot."
        meta="1ST M.I. · SECURE WEBSITE-TO-BOT CONTROL"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => void loadOverview()}
            disabled={Boolean(busy)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Live Data
          </Button>
          <Button asChild variant="secondary">
            <Link to="/leadership-control">Website Control</Link>
          </Button>
          <Button
            variant="secondary"
            disabled={Boolean(busy)}
            onClick={() =>
              void runAction(
                "role-sync",
                () => syncTechSupportRoleAutomation(),
                "Automatic role assignment sync completed.",
              )
            }
          >
            <Users className="mr-2 h-4 w-4" />
            Sync Automatic Roles
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}
        {overview?.errors.length ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            Some live sections could not be loaded: {overview.errors.join(" · ")}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={<Activity className="h-5 w-5" />}
            label="Bot"
            value={overview?.status?.botReady ? "ONLINE" : "OFFLINE"}
            detail={overview?.status?.botUser?.tag || "Tech Support"}
          />
          <Metric
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Safety"
            value={overview?.safety ? `${overview.safety.score}%` : "—"}
            detail={
              overview?.safety?.ok
                ? "All reviewed checks passing"
                : "Review attention items below"
            }
          />
          <Metric
            icon={<Ticket className="h-5 w-5" />}
            label="Open Tickets"
            value={String(openTickets.length)}
            detail={`${overview?.tickets.length || 0} stored tickets`}
          />
          <Metric
            icon={<CalendarDays className="h-5 w-5" />}
            label="Active Operations"
            value={String(activeOperations.length)}
            detail={
              overview?.status?.uptimeSeconds
                ? `Bot uptime ${fmtDuration(overview.status.uptimeSeconds)}`
                : "Operation/Event Manager"
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <Panel
            title="Server Safety Dashboard"
            subtitle="Read-only checks against the live Discord server and bot configuration."
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <div className="space-y-2">
              {(overview?.safety?.checks || []).map((check) => (
                <div
                  key={check.id}
                  className="flex gap-3 rounded-md border border-border bg-black/25 p-3 text-sm"
                >
                  <span className={check.ok ? "text-emerald-400" : "text-red-400"}>
                    {check.ok ? "●" : "●"}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-fg">{check.label}</div>
                    <div className="text-muted">{check.detail}</div>
                  </div>
                </div>
              ))}
              {!overview?.safety?.checks.length ? (
                <p className="text-sm text-muted">No safety data returned.</p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Bot Modules"
            subtitle="Live module state. Only modules marked restartable can be recovered in place."
            icon={<ServerCog className="h-5 w-5" />}
          >
            <div className="space-y-2">
              {(overview?.modules || []).map((module) => (
                <div
                  key={module.id}
                  className="flex flex-col gap-3 rounded-md border border-border bg-black/25 p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          module.status === "RUNNING"
                            ? "text-emerald-400"
                            : module.status === "DEGRADED"
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        ●
                      </span>
                      <strong>{module.label}</strong>
                      <span className="font-mono text-[10px] text-muted">{module.id}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{module.detail}</p>
                  </div>
                  {module.restartable ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={Boolean(busy)}
                      onClick={() => {
                        if (!window.confirm(`Restart ${module.label}?`)) return;
                        void runAction(
                          `module-${module.id}`,
                          () => restartTechSupportModule({ data: { moduleId: module.id } }),
                          `${module.label} recovery requested.`,
                        );
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">{module.restartScope}</span>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          title="Member Management / Profile"
          subtitle="Look up a member by Discord user ID. This view is read-only."
          icon={<UserRoundSearch className="h-5 w-5" />}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className={inputClass}
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              placeholder="Discord member ID"
              inputMode="numeric"
            />
            <Button
              onClick={() => void lookupMember()}
              disabled={busy === "member" || !memberId.trim()}
            >
              <Search className="mr-2 h-4 w-4" />
              Look Up Member
            </Button>
          </div>

          {member ? (
            <div className="mt-4 grid gap-4 rounded-md border border-primary/25 bg-primary/5 p-4 md:grid-cols-[auto_1fr]">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt=""
                  className="h-20 w-20 rounded-md object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <h3 className="font-display text-xl uppercase text-fg">{member.displayName}</h3>
                <p className="font-mono text-xs text-muted">
                  {member.tag} · {member.id}
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Fact label="Nickname" value={member.nickname || "None"} />
                  <Fact label="Highest role" value={member.highestRole || "None"} />
                  <Fact label="Voice" value={member.voiceChannel?.name || "Not connected"} />
                  <Fact
                    label="Joined"
                    value={
                      member.joinedTimestamp
                        ? new Date(member.joinedTimestamp).toLocaleDateString()
                        : "Unknown"
                    }
                  />
                </div>
                <div className="mt-3 text-sm text-muted">
                  <strong className="text-fg">Key permissions:</strong>{" "}
                  {member.importantPermissions.length
                    ? member.importantPermissions.join(", ")
                    : "None"}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.roles.slice(0, 30).map((role) => (
                    <span
                      key={role.id}
                      className="rounded border border-border bg-black/35 px-2 py-1 text-xs text-muted"
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="Tech Support Tickets"
            subtitle="Open and recent private Tech Support tickets."
            icon={<Ticket className="h-5 w-5" />}
          >
            <div className="space-y-2">
              {(overview?.tickets || []).slice(0, 20).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-2 rounded-md border border-border bg-black/25 p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-primary">{ticket.id}</div>
                    <div className="text-sm text-fg">
                      Member {ticket.userId} · {ticket.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted">
                      Created {when(ticket.createdAt)}
                      {ticket.claimedBy ? ` · Claimed by ${ticket.claimedBy}` : ""}
                    </div>
                  </div>
                  {ticket.status === "open" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={Boolean(busy)}
                      onClick={() => {
                        if (!window.confirm("Close this Tech Support ticket?")) return;
                        void runAction(
                          `ticket-${ticket.id}`,
                          () => closeTechSupportTicket({ data: { ticketId: ticket.id } }),
                          "Ticket closed.",
                        );
                      }}
                    >
                      Close
                    </Button>
                  ) : null}
                </div>
              ))}
              {!overview?.tickets.length ? (
                <p className="text-sm text-muted">No tickets recorded.</p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Operation / Event Manager"
            subtitle="Publish an RSVP event directly into a Discord text channel."
            icon={<CalendarDays className="h-5 w-5" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted sm:col-span-2">
                Discord channel
                <select
                  className={inputClass}
                  value={operation.channelId}
                  onChange={(event) =>
                    setOperation((current) => ({
                      ...current,
                      channelId: event.target.value,
                    }))
                  }
                >
                  {(overview?.channels || []).map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.parentName ? `${channel.parentName} / ` : ""}
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted sm:col-span-2">
                Title
                <input
                  className={inputClass}
                  value={operation.title}
                  onChange={(event) =>
                    setOperation((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Operation Valaka"
                />
              </label>
              <label className="text-xs text-muted">
                Date
                <input
                  className={inputClass}
                  type="date"
                  value={operation.date}
                  onChange={(event) =>
                    setOperation((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </label>
              <label className="text-xs text-muted">
                Queensland time
                <input
                  className={inputClass}
                  type="time"
                  value={operation.time}
                  onChange={(event) =>
                    setOperation((current) => ({ ...current, time: event.target.value }))
                  }
                />
              </label>
              <label className="text-xs text-muted sm:col-span-2">
                Game / activity
                <input
                  className={inputClass}
                  value={operation.game}
                  onChange={(event) =>
                    setOperation((current) => ({ ...current, game: event.target.value }))
                  }
                  placeholder="Hell Let Loose: Vietnam"
                />
              </label>
              <label className="text-xs text-muted sm:col-span-2">
                Briefing / details
                <textarea
                  className={textareaClass}
                  value={operation.details}
                  onChange={(event) =>
                    setOperation((current) => ({ ...current, details: event.target.value }))
                  }
                />
              </label>
            </div>
            <Button
              className="mt-3"
              disabled={
                Boolean(busy) ||
                !operation.channelId ||
                !operation.title ||
                !operation.date ||
                !operation.time
              }
              onClick={() => void createOperation()}
            >
              Publish Operation
            </Button>

            <div className="mt-5 space-y-2">
              {activeOperations.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-md border border-border bg-black/25 p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <strong>{item.title}</strong>
                    <div className="text-xs text-muted">
                      {new Date(item.targetUnix * 1000).toLocaleString()} ·{" "}
                      {item.game || "No game specified"} · RSVP{" "}
                      {(item.rsvp?.attending?.length || 0) +
                        (item.rsvp?.maybe?.length || 0) +
                        (item.rsvp?.unable?.length || 0)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      if (!window.confirm(`Cancel ${item.title}?`)) return;
                      void runAction(
                        `operation-${item.id}`,
                        () =>
                          cancelTechSupportOperation({
                            data: { operationId: item.id },
                          }),
                        "Operation cancelled.",
                      );
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          title="Leadership Audit + Undo"
          subtitle="Newest leadership and website controller actions first."
          icon={<History className="h-5 w-5" />}
          action={
            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(busy)}
              onClick={() => {
                if (!window.confirm("Undo the newest reversible leadership action?")) return;
                void runAction(
                  "audit-undo",
                  () => undoTechSupportAuditAction(),
                  "Newest reversible leadership action undone.",
                );
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Undo Last Reversible
            </Button>
          }
        >
          <div className="space-y-2">
            {(overview?.audit || []).map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-border bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <strong>{entry.action}</strong>
                  {entry.undoneAt ? (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                      UNDONE
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 font-mono text-xs text-muted">
                  {when(entry.at)} · {entry.actorId || "System"} · {entry.id}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="panel panel-static p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="stencil text-[10px] tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl uppercase text-fg">{value}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel panel-static p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="mt-0.5 text-primary">{icon}</div>
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide text-fg">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stencil text-[9px] tracking-[0.1em] text-primary">{label}</div>
      <div className="mt-1 truncate text-fg">{value}</div>
    </div>
  );
}
