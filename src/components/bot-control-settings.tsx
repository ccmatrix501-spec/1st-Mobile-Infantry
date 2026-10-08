import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Settings2, Trash2, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipBotGuildOptions,
  fetchLeadershipBotSettings,
  resetLeadershipOnboardingMember,
  saveLeadershipBotSettingsSection,
  type BotGuildChannelOption,
  type BotGuildRoleOption,
  type LeadershipBotSettings,
} from "@/lib/bot-control-fn";

type Obj = Record<string, any>;

const inputClass =
  "h-10 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaClass =
  "min-h-72 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 font-mono text-xs text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function record(value: unknown): Obj {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : {};
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getPath(root: Obj, path: string): any {
  return path.split(".").reduce<any>((value, key) => (value == null ? undefined : value[key]), root);
}

function setPath(root: Obj, path: string, value: any): Obj {
  const next = clone(root);
  const parts = path.split(".");
  let cursor: Obj = next;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!record(cursor[key]) || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

const ROLE_FIELDS: Array<[string, string]> = [
  ["recruit", "Recruit"],
  ["member", "Member"],
  ["alpha", "Alpha / STE member"],
  ["meritsAwards", "Merits & Awards"],
  ["paths.starship", "Path · Starship Troopers"],
  ["paths.hllv", "Path · HLL:V"],
  ["paths.combined", "Path · Combined"],
  ["paths.ambassador", "Path · Ambassador"],
  ["paths.returning", "Path · Returning"],
  ["regions.america", "Region · America"],
  ["regions.europe", "Region · Europe"],
  ["regions.asia", "Region · Asia"],
  ["regions.africa", "Region · Africa"],
  ["regions.oceania", "Region · Oceania"],
  ["platforms.pc", "Platform · PC"],
  ["platforms.xbox", "Platform · Xbox"],
  ["platforms.playstation", "Platform · PlayStation"],
  ["experience.starship.new", "STE Experience · New"],
  ["experience.starship.some", "STE Experience · Some"],
  ["experience.starship.veteran", "STE Experience · Veteran"],
  ["experience.starship.expert", "STE Experience · Expert"],
  ["experience.hllv.new", "HLL:V Experience · New"],
  ["experience.hllv.some", "HLL:V Experience · Some"],
  ["experience.hllv.veteran", "HLL:V Experience · Veteran"],
  ["experience.hllv.expert", "HLL:V Experience · Expert"],
  ["companies.demon", "Company · Demon"],
  ["companies.nightmare", "Company · Nightmare"],
  ["companies.cerberus", "Company · Cerberus"],
  ["companies.hellfire", "Company · Hellfire"],
  ["hllRoles.infantry", "HLL:V Role · Infantry"],
  ["hllRoles.support", "HLL:V Role · Support"],
  ["hllRoles.leadership", "HLL:V Role · Leadership"],
  ["hllRoles.armor", "HLL:V Role · Armor"],
  ["hllRoles.recon", "HLL:V Role · Recon"],
  ["ranks.squad_member", "Returning · Squad Member"],
  ["ranks.squad_lead", "Returning · Squad Lead"],
  ["ranks.platoon_lead", "Returning · Platoon Lead"],
  ["ranks.nco", "Returning · NCO"],
  ["ranks.officer", "Returning · Officer / Staff"],
];

const ADVANCED_SECTIONS = [
  "onboarding",
  "roleAutomation",
  "transfer",
  "modules",
  "nickname",
  "emojis",
  "steCompanyMerge",
  "companies",
  "branding",
  "stats",
  "specializationQuestions",
] as const;

export function BotControlSettings() {
  const [settings, setSettings] = useState<LeadershipBotSettings | null>(null);
  const [roles, setRoles] = useState<BotGuildRoleOption[]>([]);
  const [channels, setChannels] = useState<BotGuildChannelOption[]>([]);
  const [completionCount, setCompletionCount] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetMemberId, setResetMemberId] = useState("");

  const refresh = useCallback(async () => {
    setBusy("refresh");
    setError(null);
    try {
      const [settingsResult, guildResult] = await Promise.all([
        fetchLeadershipBotSettings(),
        fetchLeadershipBotGuildOptions(),
      ]);
      setSettings(settingsResult.settings);
      setRoles(guildResult.roles);
      setChannels(guildResult.channels);
      setCompletionCount(settingsResult.onboardingCompletionCount);
      const nextDrafts: Record<string, string> = {};
      for (const section of ADVANCED_SECTIONS) {
        nextDrafts[section] = JSON.stringify(
          (settingsResult.settings as Obj)[section] ?? {},
          null,
          2,
        );
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bot configuration.");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSection = useCallback(
    async (section: string, value: unknown, success: string) => {
      setBusy(section);
      setError(null);
      setNotice(null);
      try {
        const result = await saveLeadershipBotSettingsSection({ data: { section, value } });
        setSettings(result.settings);
        setDrafts((current) => ({
          ...current,
          [section]: JSON.stringify((result.settings as Obj)[section] ?? {}, null, 2),
        }));
        setNotice(success);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save settings.");
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const settingsObj = record(settings);
  const roleSettings = record(settingsObj.roles);
  const lft = record(settingsObj.lft);
  const aar = record(settingsObj.aar);

  const textChannels = useMemo(() => channels.filter((channel) => channel.textBased), [channels]);
  const voiceChannels = useMemo(() => channels.filter((channel) => channel.voiceBased), [channels]);

  if (!settings) {
    return (
      <section className="mt-6 panel panel-feature p-6">
        <p className="text-sm text-muted">Loading full bot configuration…</p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="panel panel-feature overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-primary/25 bg-primary/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Whole-bot configuration</p>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Bot Control Centre
            </h2>
            <p className="mt-1 text-sm text-muted">
              Configure live Discord roles, onboarding, AAR, LFT/recruit, automation and other bot systems.
            </p>
          </div>
          <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            Reload Config
          </Button>
        </div>
        <div className="p-5 sm:p-6">
          {error ? <Notice tone="error">{error}</Notice> : null}
          {notice ? <Notice tone="success">{notice}</Notice> : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Discord roles" value={String(roles.length)} />
            <MiniStat label="Discord channels" value={String(channels.length)} />
            <MiniStat label="Onboarding completed" value={String(completionCount)} />
          </div>
        </div>
      </div>

      <ConfigPanel title="Role Mapping" description="Select the real Discord roles used across onboarding and other bot features.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLE_FIELDS.map(([path, label]) => (
            <label key={path} className="text-xs text-muted">
              {label}
              <RoleSelect
                roles={roles}
                value={String(getPath(roleSettings, path) || "")}
                onChange={(value) => {
                  const nextRoles = setPath(roleSettings, path, value);
                  setSettings((current) => ({ ...record(current), roles: nextRoles }));
                }}
              />
            </label>
          ))}
        </div>
        <Button
          className="mt-5"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void saveSection("roles", roleSettings, "Discord role mappings saved.")}
        >
          <Save className="h-4 w-4" />
          Save Role Mapping
        </Button>
      </ConfigPanel>

      <ConfigPanel title="LFT & Recruit Alerts" description="Live scheduler, role and channel controls used by Looking For Troopers and recruit alerts.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ToggleField
            label="LFT enabled"
            checked={lft.enabled !== false}
            onChange={(checked) => setSettings((current) => ({ ...record(current), lft: { ...lft, enabled: checked } }))}
          />
          <ToggleField
            label="Recruit alerts enabled"
            checked={lft.recruitAlertsEnabled !== false}
            onChange={(checked) =>
              setSettings((current) => ({ ...record(current), lft: { ...lft, recruitAlertsEnabled: checked } }))
            }
          />
          <NumberField
            label="LFT interval (minutes)"
            value={Number(lft.intervalMinutes || 30)}
            min={1}
            max={1440}
            onChange={(value) => setSettings((current) => ({ ...record(current), lft: { ...lft, intervalMinutes: value } }))}
          />
          <NumberField
            label="Recruit alert interval (minutes)"
            value={Number(lft.recruitAlertMinutes || 15)}
            min={1}
            max={1440}
            onChange={(value) =>
              setSettings((current) => ({ ...record(current), lft: { ...lft, recruitAlertMinutes: value } }))
            }
          />
          <NumberField
            label="Dropship size"
            value={Number(lft.dropShipSize || 16)}
            min={1}
            max={99}
            onChange={(value) => setSettings((current) => ({ ...record(current), lft: { ...lft, dropShipSize: value } }))}
          />
          <label className="text-xs text-muted">
            LFT ping role
            <RoleSelect
              roles={roles}
              value={String(lft.lftRoleId || "")}
              onChange={(value) => setSettings((current) => ({ ...record(current), lft: { ...lft, lftRoleId: value } }))}
            />
          </label>
          <ChannelField
            label="Waiting voice channel"
            channels={voiceChannels}
            value={String(lft.waitingVoiceChannelId || "")}
            onChange={(value) =>
              setSettings((current) => ({ ...record(current), lft: { ...lft, waitingVoiceChannelId: value } }))
            }
          />
          <ChannelField
            label="LFT post channel"
            channels={textChannels}
            value={String(lft.lftChannelId || "")}
            onChange={(value) => setSettings((current) => ({ ...record(current), lft: { ...lft, lftChannelId: value } }))}
          />
          <ChannelField
            label="Recruit alert channel"
            channels={textChannels}
            value={String(lft.recruitAlertChannelId || "")}
            onChange={(value) =>
              setSettings((current) => ({ ...record(current), lft: { ...lft, recruitAlertChannelId: value } }))
            }
          />
          <ChannelField
            label="Onboarding voice channel"
            channels={voiceChannels}
            value={String(lft.onboardingVoiceChannelId || "")}
            onChange={(value) =>
              setSettings((current) => ({ ...record(current), lft: { ...lft, onboardingVoiceChannelId: value } }))
            }
          />
          <ChannelField
            label="NCO notification channel"
            channels={textChannels}
            value={String(lft.ncoNotificationChannelId || "")}
            onChange={(value) =>
              setSettings((current) => ({ ...record(current), lft: { ...lft, ncoNotificationChannelId: value } }))
            }
          />
        </div>
        <Button
          className="mt-5"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void saveSection("lft", lft, "LFT and recruit settings saved and rescheduled.")}
        >
          <Save className="h-4 w-4" />
          Save LFT / Recruit
        </Button>
      </ConfigPanel>

      <AarEditor
        aar={aar}
        textChannels={textChannels}
        voiceChannels={voiceChannels}
        busy={Boolean(busy)}
        onChange={(value) => setSettings((current) => ({ ...record(current), aar: value }))}
        onSave={() => void saveSection("aar", aar, "AAR settings saved. New panels and reminders now use this configuration.")}
      />

      <ConfigPanel
        title="Onboarding Member Reset"
        description="Clear a member's completed-onboarding record so they can run onboarding again."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={inputClass}
            value={resetMemberId}
            inputMode="numeric"
            placeholder="Discord member ID"
            onChange={(event) => setResetMemberId(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={Boolean(busy) || !/^\d{15,22}$/.test(resetMemberId.trim())}
            onClick={async () => {
              setBusy("onboarding-reset");
              setError(null);
              try {
                await resetLeadershipOnboardingMember({ data: { memberId: resetMemberId.trim() } });
                setNotice(`Onboarding reset for ${resetMemberId.trim()}.`);
                setCompletionCount((value) => Math.max(0, value - 1));
                setResetMemberId("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not reset onboarding.");
              } finally {
                setBusy(null);
              }
            }}
          >
            <UserRoundX className="h-4 w-4" />
            Reset Onboarding
          </Button>
        </div>
      </ConfigPanel>

      <ConfigPanel
        title="Onboarding, Automation & Advanced"
        description="Edit deeper bot sections directly. Saves are validated by the bot before they are written; unsupported onboarding option values are rejected."
      >
        <div className="space-y-5">
          {ADVANCED_SECTIONS.map((section) => (
            <JsonSectionEditor
              key={section}
              section={section}
              value={drafts[section] ?? JSON.stringify(settingsObj[section] ?? {}, null, 2)}
              busy={busy === section}
              onChange={(value) => setDrafts((current) => ({ ...current, [section]: value }))}
              onSave={() => {
                try {
                  const parsed = JSON.parse(drafts[section] ?? "{}");
                  void saveSection(section, parsed, `${titleCase(section)} settings saved.`);
                } catch {
                  setError(`${titleCase(section)} contains invalid JSON.`);
                }
              }}
            />
          ))}
        </div>
      </ConfigPanel>
    </section>
  );
}

function AarEditor({
  aar,
  textChannels,
  voiceChannels,
  busy,
  onChange,
  onSave,
}: {
  aar: Obj;
  textChannels: BotGuildChannelOption[];
  voiceChannels: BotGuildChannelOption[];
  busy: boolean;
  onChange: (value: Obj) => void;
  onSave: () => void;
}) {
  const modes = Array.isArray(aar.gameModes) ? aar.gameModes : [];
  const maps = Array.isArray(aar.maps) ? aar.maps : [];
  const reminders = Array.isArray(aar.reminderVoiceChannels) ? aar.reminderVoiceChannels : [];

  const updateList = (key: string, rows: any[]) => onChange({ ...aar, [key]: rows });

  return (
    <ConfigPanel
      title="AAR Control"
      description="Change AAR panel/report channels, modes, maps, result art and automatic voice-room reminders."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField
          label="AAR enabled"
          checked={aar.enabled !== false}
          onChange={(checked) => onChange({ ...aar, enabled: checked })}
        />
        <div />
        <ChannelField
          label="AAR panel channel"
          channels={textChannels}
          value={String(aar.panelChannelId || "")}
          onChange={(value) => onChange({ ...aar, panelChannelId: value })}
        />
        <ChannelField
          label="AAR report channel"
          channels={textChannels}
          value={String(aar.reportChannelId || "")}
          onChange={(value) => onChange({ ...aar, reportChannelId: value })}
        />
        <label className="text-xs text-muted">
          Victory / extraction image URL
          <input
            className={inputClass}
            value={String(aar.victoryImage || "")}
            onChange={(event) => onChange({ ...aar, victoryImage: event.target.value })}
          />
        </label>
        <label className="text-xs text-muted">
          Defeat / no-extraction image URL
          <input
            className={inputClass}
            value={String(aar.defeatImage || "")}
            onChange={(event) => onChange({ ...aar, defeatImage: event.target.value })}
          />
        </label>
      </div>

      <EditableNamedList
        title="Game Modes"
        rows={modes}
        prefix="mode_"
        max={5}
        onChange={(rows) => updateList("gameModes", rows)}
      />
      <EditableNamedList
        title="Maps"
        rows={maps}
        prefix="map_"
        max={5}
        onChange={(rows) => updateList("maps", rows)}
      />

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-lg font-semibold uppercase text-fg">Voice Reminder Rooms</h4>
            <p className="text-xs text-muted">Choose the rooms watched for AAR text/audio reminders and their member threshold.</p>
          </div>
          <Button
            size="sm"
            type="button"
            variant="secondary"
            disabled={reminders.length >= 25}
            onClick={() =>
              updateList("reminderVoiceChannels", [
                ...reminders,
                { id: voiceChannels[0]?.id || "", name: voiceChannels[0]?.name || "Voice room", minMembers: 1, text: true, audio: false },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        </div>
        <div className="space-y-3">
          {reminders.map((row: Obj, index: number) => (
            <div key={`${row.id || "new"}-${index}`} className="grid gap-3 rounded-md border border-border bg-black/20 p-3 lg:grid-cols-[2fr_1.3fr_110px_auto_auto_auto] lg:items-end">
              <ChannelField
                label="Voice channel"
                channels={voiceChannels}
                value={String(row.id || "")}
                onChange={(value) => {
                  const channel = voiceChannels.find((item) => item.id === value);
                  const next = reminders.map((item: Obj, i: number) =>
                    i === index ? { ...item, id: value, name: channel?.name || item.name || value } : item,
                  );
                  updateList("reminderVoiceChannels", next);
                }}
              />
              <label className="text-xs text-muted">
                Display name
                <input
                  className={inputClass}
                  value={String(row.name || "")}
                  onChange={(event) => {
                    const next = reminders.map((item: Obj, i: number) =>
                      i === index ? { ...item, name: event.target.value } : item,
                    );
                    updateList("reminderVoiceChannels", next);
                  }}
                />
              </label>
              <NumberField
                label="Minimum"
                value={Number(row.minMembers || 1)}
                min={1}
                max={99}
                onChange={(value) => {
                  const next = reminders.map((item: Obj, i: number) =>
                    i === index ? { ...item, minMembers: value } : item,
                  );
                  updateList("reminderVoiceChannels", next);
                }}
              />
              <ToggleField
                label="Text"
                checked={row.text !== false}
                onChange={(checked) => {
                  const next = reminders.map((item: Obj, i: number) =>
                    i === index ? { ...item, text: checked } : item,
                  );
                  updateList("reminderVoiceChannels", next);
                }}
              />
              <ToggleField
                label="Audio"
                checked={row.audio === true}
                onChange={(checked) => {
                  const next = reminders.map((item: Obj, i: number) =>
                    i === index ? { ...item, audio: checked } : item,
                  );
                  updateList("reminderVoiceChannels", next);
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => updateList("reminderVoiceChannels", reminders.filter((_: unknown, i: number) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button className="mt-5" type="button" disabled={busy} onClick={onSave}>
        <Save className="h-4 w-4" />
        Save AAR Settings
      </Button>
    </ConfigPanel>
  );
}

function EditableNamedList({
  title,
  rows,
  prefix,
  max,
  onChange,
}: {
  title: string;
  rows: Obj[];
  prefix: string;
  max: number;
  onChange: (rows: Obj[]) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-display text-lg font-semibold uppercase text-fg">{title}</h4>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={rows.length >= max}
          onClick={() =>
            onChange([
              ...rows,
              { id: `${prefix}custom_${rows.length + 1}`, label: `Custom ${rows.length + 1}` },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.id || "row"}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
            <input
              className={inputClass}
              value={String(row.id || "")}
              placeholder={`${prefix}id`}
              onChange={(event) =>
                onChange(rows.map((item, i) => (i === index ? { ...item, id: event.target.value } : item)))
              }
            />
            <input
              className={inputClass}
              value={String(row.label || "")}
              placeholder="Button label"
              onChange={(event) =>
                onChange(rows.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))
              }
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonSectionEditor({
  section,
  value,
  busy,
  onChange,
  onSave,
}: {
  section: string;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(section === "onboarding" || section === "roleAutomation");
  return (
    <div className="rounded-md border border-border bg-black/20">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <span className="font-display text-base font-semibold uppercase text-fg">{titleCase(section)}</span>
          <span className="ml-2 font-mono text-[10px] text-subtle">{section}</span>
        </span>
        <Settings2 className="h-4 w-4 text-primary" />
      </button>
      {open ? (
        <div className="border-t border-border p-4">
          <textarea className={textareaClass} value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
          <Button className="mt-3" type="button" size="sm" disabled={busy} onClick={onSave}>
            <Save className="h-4 w-4" />
            Save {titleCase(section)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ConfigPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel panel-feature overflow-hidden">
      <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
        <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">{title}</h3>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function RoleSelect({
  roles,
  value,
  onChange,
}: {
  roles: BotGuildRoleOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Not set</option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}{role.botCanManage ? "" : role.managed ? " · managed" : " · above bot"}
        </option>
      ))}
    </select>
  );
}

function ChannelField({
  label,
  channels,
  value,
  onChange,
}: {
  label: string;
  channels: BotGuildChannelOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Not set</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.parentName ? `${channel.parentName} / ` : ""}{channel.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <input
        className={inputClass}
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : min}
        onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))}
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-black/20 px-3 text-xs text-muted">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-black/20 p-3">
      <p className="stencil text-[9px] tracking-[0.12em] text-primary">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-fg">{value}</p>
    </div>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={`mb-4 rounded-md border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-400/30 bg-red-500/10 text-red-200"
          : "border-primary/30 bg-primary/10 text-primary"
      }`}
    >
      {children}
    </div>
  );
}
