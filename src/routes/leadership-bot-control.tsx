import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import {
  fetchLeadershipBotAudit,
  fetchLeadershipBotMember,
  fetchLeadershipBotModules,
  fetchLeadershipBotOperations,
  fetchLeadershipBotSafety,
  fetchLeadershipBotStatus,
  restartLeadershipBotModule,
  syncLeadershipAutomaticRoles,
  undoLeadershipBotAudit,
  type BotControlModule,
  type BotControlStatus,
  type BotMemberProfile,
  type BotSafety,
  type LeadershipAuditEntry,
  type LeadershipOperation,
} from "@/lib/bot-control-fn";

export const Route = createFileRoute("/leadership-bot-control")({
  component: LeadershipBotControlPage,
  head: () => ({
    meta: [{ title: "Tech Support Bot Controller — 1st Mobile Infantry" }],
  }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 font-mono text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function LeadershipBotControlPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<BotControlStatus | null>(null);
  const [safety, setSafety] = useState<BotSafety | null>(null);
  const [modules, setModules] = useState<BotControlModule[]>([]);
  const [audit, setAudit] = useState<LeadershipAuditEntry[]>([]);
  const [operations, setOperations] = useState<LeadershipOperation[]>([]);
  const [memberId, setMemberId] = useState("");
  const [member, setMember] = useState<BotMemberProfile | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [busyModule, setBusyModule] = useState<string | null>(null);
  const [roleSyncing, setRoleSyncing] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadController = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    setError(null);
    try {
      const profile = await fetchLocalLeadershipProfile();
      if (!profile) {
        window.location.href = "/login?next=/leadership-bot-control";
        return;
      }

      const [nextStatus, nextSafety, nextModules, nextAudit, nextOperations] =
        await Promise.all([
          fetchLeadershipBotStatus(),
          fetchLeadershipBotSafety(),
          fetchLeadershipBotModules(),
          fetchLeadershipBotAudit({ data: { limit: 20 } }),
          fetchLeadershipBotOperations(),
        ]);

      setStatus(nextStatus);
      setSafety(nextSafety);
      setModules(nextModules);
      setAudit(nextAudit);
      setOperations(nextOperations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the 1st M.I. Tech Support bot.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadController(true);
  }, [loadController]);

  async function restartModule(module: BotControlModule) {
    if (!module.restartable) return;
    const confirmed = window.confirm(
      module.id === "discord-core"
        ? "Restart the full 1st M.I. Tech Support bot? Persistent state will be flushed first."
        : `Restart ${module.label}?`,
    );
    if (!confirmed) return;

    setBusyModule(module.id);
    setMessage(null);
    setError(null);
    try {
      const result = await restartLeadershipBotModule({ data: { id: module.id } });
      setMessage(
        String(
          (result as { message?: unknown }).message ||
            `${module.label} restart requested.`,
        ),
      );
      window.setTimeout(() => void loadController(true), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restart module.");
    } finally {
      setBusyModule(null);
    }
  }

  async function syncRoles() {
    setRoleSyncing(true);
    setMessage(null);
    setError(null);
    try {
      const response = await syncLeadershipAutomaticRoles();
      const result =
        response && typeof response === "object" && "result" in response
          ? (response as { result?: Record<string, unknown> }).result
          : undefined;
      setMessage(
        `Automatic role sync finished. Members changed: ${Number(result?.changedMembers || 0)}, roles added: ${Number(result?.grantedRoles || 0)}, roles removed: ${Number(result?.removedRoles || 0)}.`,
      );
      await loadController(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Automatic role sync failed.");
    } finally {
      setRoleSyncing(false);
    }
  }

  async function undoLastAuditAction() {
    const reversible = audit.find((entry) => entry.undo && !entry.undoneAt);
    if (!reversible) {
      setError("There is no reversible leadership action available.");
      return;
    }
    if (!window.confirm(`Undo the newest reversible action: ${reversible.action}?`)) {
      return;
    }
    setUndoing(true);
    setMessage(null);
    setError(null);
    try {
      const result = await undoLeadershipBotAudit();
      setMessage(`Undid ${result.undone.action}.`);
      await loadController(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not undo the leadership action.");
    } finally {
      setUndoing(false);
    }
  }

  async function lookupMember() {
    const id = memberId.trim();
    if (!/^\d{16,22}$/.test(id)) {
      setError("Enter the member's numeric Discord user ID.");
      return;
    }
    setMemberLoading(true);
    setMember(null);
    setMessage(null);
    setError(null);
    try {
      setMember(await fetchLeadershipBotMember({ data: { memberId: id } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Member lookup failed.");
    } finally {
      setMemberLoading(false);
    }
  }

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
        body="Monitor and control the 1st M.I. Tech Support bot from the secure Leadership area."
        meta="1ST MI DIV · BOT SERVER CONTROL"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="secondary">
            <Link to="/leadership-control">
              <ArrowLeft className="h-4 w-4" />
              Leadership Control
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={refreshing}
            onClick={() => void loadController()}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh Controller"}
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-6 rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {message}
          </div>
        ) : null}

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
            icon={<Users className="h-5 w-5" />}
            label="Discord members"
            value={String(status?.guild?.memberCount ?? "—")}
            detail="Current guild member count"
            good={Boolean(status?.guild)}
          />
          <StatusCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Safety score"
            value={safety ? `${safety.score}%` : "—"}
            detail={
              safety
                ? `${safety.checks.filter((check) => !check.ok).length} item(s) need attention`
                : "Safety check unavailable"
            }
            good={Boolean(safety?.ok)}
          />
        </div>

        <ControllerPanel
          kicker="Live infrastructure"
          title="Server Safety"
          icon={<ShieldAlert className="h-5 w-5" />}
        >
          {safety ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {safety.checks.map((check) => (
                <div
                  key={check.id}
                  className={`rounded-md border p-3 ${check.ok ? "border-primary/20 bg-primary/5" : "border-red-400/25 bg-red-500/10"}`}
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
          ) : (
            <p className="text-sm text-muted">No safety result available.</p>
          )}
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
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${module.loaded ? "bg-primary" : "bg-red-400"}`}
                    />
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                      {module.label}
                    </h3>
                    <span className="font-mono text-[10px] text-subtle">{module.id}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {module.detail || (module.loaded ? "Loaded" : "Not loaded")}
                  </p>
                  {module.lastError ? (
                    <p className="mt-1 text-xs text-red-300">Last error: {module.lastError}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!module.restartable || busyModule === module.id}
                  onClick={() => void restartModule(module)}
                >
                  <RotateCcw className="h-4 w-4" />
                  {busyModule === module.id
                    ? "Restarting…"
                    : module.restartable
                      ? "Restart"
                      : "Restart via Full Bot"}
                </Button>
              </div>
            ))}
          </div>
        </ControllerPanel>

        <div className="grid gap-6 xl:grid-cols-2">
          <ControllerPanel
            kicker="Discord automation"
            title="Quick Controls"
            icon={<Wrench className="h-5 w-5" />}
          >
            <div className="rounded-md border border-border bg-black/20 p-4">
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                Automatic Role Sync
              </h3>
              <p className="mt-2 text-sm text-muted">
                Re-run all saved automatic Add/Remove role rules against existing members.
              </p>
              <Button
                type="button"
                className="mt-4"
                disabled={roleSyncing}
                onClick={() => void syncRoles()}
              >
                <RefreshCw className={`h-4 w-4 ${roleSyncing ? "animate-spin" : ""}`} />
                {roleSyncing ? "Syncing…" : "Sync Existing Members"}
              </Button>
            </div>
          </ControllerPanel>

          <ControllerPanel
            kicker="Member administration"
            title="Member Lookup"
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
              <Button
                type="button"
                disabled={memberLoading}
                onClick={() => void lookupMember()}
              >
                <Search className="h-4 w-4" />
                {memberLoading ? "Looking…" : "Lookup"}
              </Button>
            </div>

            {member ? (
              <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-full border border-primary/30 object-cover"
                  />
                  <div>
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                      {member.displayName}
                    </h3>
                    <p className="font-mono text-xs text-muted">{member.id}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Nickname" value={member.nickname || "None"} />
                  <Info label="Highest role" value={member.highestRole || "None"} />
                  <Info label="Voice" value={member.voiceChannel?.name || "Not connected"} />
                  <Info
                    label="Key permissions"
                    value={member.importantPermissions.join(", ") || "None"}
                  />
                </dl>
                <div className="mt-4">
                  <p className="stencil text-[10px] tracking-[0.12em] text-primary">
                    Roles ({member.roles.length})
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {member.roles.map((role) => role.name).join(" · ") || "No roles"}
                  </p>
                </div>
              </div>
            ) : null}
          </ControllerPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ControllerPanel
            kicker="Upcoming activity"
            title="Operations"
            icon={<Clock3 className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {operations.length ? (
                operations
                  .slice()
                  .sort((a, b) => b.targetUnix - a.targetUnix)
                  .slice(0, 10)
                  .map((operation) => (
                    <div
                      key={operation.id}
                      className="rounded-md border border-border bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display font-semibold uppercase tracking-wide text-fg">
                          {operation.title}
                        </h3>
                        <span
                          className={`font-mono text-[10px] uppercase ${operation.status === "active" ? "text-primary" : "text-red-300"}`}
                        >
                          {operation.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {new Date(operation.targetUnix * 1000).toLocaleString()}
                        {operation.game ? ` · ${operation.game}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-subtle">
                        RSVP: {operation.rsvp?.attending?.length || 0} attending ·{" "}
                        {operation.rsvp?.maybe?.length || 0} maybe ·{" "}
                        {operation.rsvp?.unable?.length || 0} unable
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted">
                  No operations have been created through the new event manager yet.
                </p>
              )}
            </div>
          </ControllerPanel>

          <ControllerPanel
            kicker="Accountability"
            title="Leadership Audit"
            icon={<Activity className="h-5 w-5" />}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-black/20 p-3">
              <p className="text-xs text-muted">
                Undo is limited to actions with an explicit safe reversal, such as closing a newly-created ticket or cancelling a newly-created operation.
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={undoing || !audit.some((entry) => entry.undo && !entry.undoneAt)}
                onClick={() => void undoLastAuditAction()}
              >
                <RotateCcw className="h-4 w-4" />
                {undoing ? "Undoing…" : "Undo Last Reversible"}
              </Button>
            </div>
            <div className="space-y-3">
              {audit.length ? (
                audit.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-border bg-black/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                        {entry.action}
                      </p>
                      <time className="font-mono text-[10px] text-subtle">
                        {new Date(entry.at).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Actor: {entry.actorId || "System"}
                      {entry.undoneAt ? " · Undone" : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No leadership audit entries yet.</p>
              )}
            </div>
          </ControllerPanel>
        </div>
      </section>
    </AppShell>
  );
}

function StatusCard({
  icon,
  label,
  value,
  detail,
  good,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  good: boolean;
}) {
  return (
    <div
      className={`panel panel-static p-4 ${good ? "border-primary/25" : "border-red-400/25"}`}
    >
      <div className={`mb-3 inline-flex rounded-md border p-2 ${good ? "border-primary/30 bg-primary/10 text-primary" : "border-red-400/30 bg-red-500/10 text-red-300"}`}>
        {icon}
      </div>
      <p className="stencil text-[10px] tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
        {value}
      </p>
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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 panel panel-feature overflow-hidden">
      <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">
              {kicker}
            </p>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              {title}
            </h2>
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
