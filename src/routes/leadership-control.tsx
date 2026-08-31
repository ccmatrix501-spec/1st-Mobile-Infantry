import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  KeyRound,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  changeLocalLeadershipPassword,
  changeLocalLeadershipUsername,
  fetchLocalLeadershipProfile,
  logoutLeadership,
  type LeadershipLocalProfile,
} from "@/lib/leadership-local-auth-fn";
import {
  fetchLeadershipSiteContent,
  saveSiteContent,
} from "@/lib/site-content-fn";
import {
  mergeSiteContent,
  type SiteContent,
  type SiteContentKey,
} from "@/lib/site-content";
import {
  DEFAULT_SITE_ADMIN_CONFIG,
  type SiteAdminConfig,
} from "@/lib/site-admin-config";
import {
  fetchLeadershipSiteAdminConfig,
  saveLeadershipSiteAdminConfig,
} from "@/lib/site-admin-config-fn";

export const Route = createFileRoute("/leadership-control")({
  component: LeadershipControlPage,
  head: () => ({
    meta: [{ title: "Leadership Control — 1st Mobile Infantry" }],
  }),
});

const homepageFields: Array<{
  key: SiteContentKey;
  label: string;
  help: string;
  multiline?: boolean;
}> = [
  { key: "heroTitleLine1", label: "Hero title — line 1", help: "Main homepage heading." },
  { key: "heroTitleLine2", label: "Hero title — line 2", help: "Highlighted second line." },
  { key: "motto", label: "Primary motto", help: "Large green banner text." },
  { key: "secondaryMotto", label: "Secondary motto", help: "Text directly below the primary motto." },
  { key: "intro", label: "Homepage introduction", help: "Main paragraph beneath the mottos.", multiline: true },
  { key: "established", label: "Established", help: "Established date / Federal Year." },
  { key: "homebase", label: "Home base", help: "Home-base location shown in the hero." },
  { key: "theaterTitle", label: "Theater section title", help: "Heading above active theaters." },
  { key: "theaterBody", label: "Theater section description", help: "Summary shown above the theater cards.", multiline: true },
];

const inputClass = "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const textareaClass = "min-h-24 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function cloneAdminConfig(value: SiteAdminConfig): SiteAdminConfig {
  return JSON.parse(JSON.stringify(value)) as SiteAdminConfig;
}

function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function LeadershipControlPage() {
  const [draft, setDraft] = useState<SiteContent>(() => mergeSiteContent());
  const [adminConfig, setAdminConfig] = useState<SiteAdminConfig>(() => cloneAdminConfig(DEFAULT_SITE_ADMIN_CONFIG));
  const [profile, setProfile] = useState<LeadershipLocalProfile | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchLocalLeadershipProfile(),
      fetchLeadershipSiteContent(),
      fetchLeadershipSiteAdminConfig(),
    ])
      .then(([leadershipProfile, content, managed]) => {
        if (cancelled) return;
        if (!leadershipProfile) {
          window.location.href = "/login";
          return;
        }
        setProfile(leadershipProfile);
        setNewUsername(leadershipProfile.username);
        setDraft(content);
        setAdminConfig(managed);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Your leadership session has expired. Sign in again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  function updateHomepageField(key: SiteContentKey, value: string) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleHomepageSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await saveSiteContent({ data: draft });
      setDraft(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save homepage changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminSave() {
    setAdminSaving(true);
    setAdminSaved(false);
    setError(null);
    try {
      const updated = await saveLeadershipSiteAdminConfig({ data: adminConfig });
      setAdminConfig(updated);
      setAdminSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save site-management changes.");
    } finally {
      setAdminSaving(false);
    }
  }

  async function handleUsernameSave() {
    setAccountSaving(true);
    setAccountMessage(null);
    setError(null);
    try {
      const updated = await changeLocalLeadershipUsername({ data: { username: newUsername } });
      setProfile(updated);
      setNewUsername(updated.username);
      setAccountMessage(`Username changed to ${updated.username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change username.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function handlePasswordSave() {
    setAccountMessage(null);
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Enter your current password and the new password twice.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password confirmation does not match.");
      return;
    }
    setAccountSaving(true);
    try {
      await changeLocalLeadershipPassword({ data: { currentPassword, newPassword } });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountMessage("Password changed successfully. Other old sessions are now invalid.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function handleSignOut() {
    try { await logoutLeadership(); } finally { window.location.href = "/login"; }
  }

  if (loading) {
    return <AppShell><div className="mx-auto max-w-xl px-4 py-20 text-center text-muted">Loading Leadership Control…</div></AppShell>;
  }

  if (!profile) {
    return (
      <AppShell>
        <PageHero kicker="Restricted access" title="Leadership Session Required" body="Your leadership session is not active. Sign in again to continue." meta="1ST MI DIV · WEBSITE CONTROL" />
        <section className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
          {error ? <div className="mb-5 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          <Button asChild size="lg"><Link to="/login">Return to Leadership Sign In</Link></Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Authenticated command access"
        title="Leadership Control"
        body="Manage public site content, companies, command staff, rules, recruiting and visual assets from one control panel."
        meta="1ST MI DIV · WEBSITE CONTROL"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="panel panel-static p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
              <div>
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">Signed in</p>
                <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">{profile.username}</p>
                <p className="mt-1 font-mono text-[10px] text-subtle">Leadership account{profile.isSuperAdmin ? " · Super Admin" : ""}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary" size="lg"><Link to="/"><Eye className="h-4 w-4" />View Public Site</Link></Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => void handleSignOut()}><LogOut className="h-4 w-4" />Sign Out</Button>
          </div>
        </div>

        {error ? <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
        {accountMessage ? <div className="mb-6 rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{accountMessage}</div> : null}

        <EditorPanel kicker="Homepage editor" title="Homepage Text">
          <div className="grid gap-5">
            {homepageFields.map((field) => (
              <Field key={field.key} label={field.label} help={field.help}>
                {field.multiline ? (
                  <textarea value={draft[field.key]} onChange={(event) => updateHomepageField(field.key, event.target.value)} rows={4} className={textareaClass} />
                ) : (
                  <input value={draft[field.key]} onChange={(event) => updateHomepageField(field.key, event.target.value)} className={inputClass} />
                )}
              </Field>
            ))}
            <SaveRow saved={saved} saving={saving} onSave={() => void handleHomepageSave()} label="Save Homepage" />
          </div>
        </EditorPanel>

        <EditorPanel kicker="Appearance" title="Background & Logo">
          <div className="grid gap-6 lg:grid-cols-2">
            <ImageEditor
              label="Website background"
              help="Use a public site path such as /site-bg.png or an HTTPS image URL."
              value={adminConfig.appearance.backgroundImage}
              onChange={(value) => { setAdminSaved(false); setAdminConfig((current) => ({ ...current, appearance: { ...current.appearance, backgroundImage: value } })); }}
            />
            <ImageEditor
              label="Main logo / emblem"
              help="Used in the header and managed emblem locations."
              value={adminConfig.appearance.logoImage}
              onChange={(value) => { setAdminSaved(false); setAdminConfig((current) => ({ ...current, appearance: { ...current.appearance, logoImage: value } })); }}
              square
            />
          </div>
        </EditorPanel>

        <EditorPanel kicker="Order of battle" title="Companies">
          <div className="space-y-5">
            {adminConfig.companies.map((company, index) => (
              <details key={`${company.callsign}-${index}`} className="rounded-md border border-border bg-black/20 p-4" open={index === 0}>
                <summary className="cursor-pointer font-display text-lg font-semibold uppercase tracking-wide text-fg">{company.callsign || `Company ${index + 1}`} · {company.captain || "No captain"}</summary>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <TextInput label="Company name" value={company.callsign} onChange={(value) => updateCompany(index, { callsign: value })} />
                  <TextInput label="Company code" value={company.code} onChange={(value) => updateCompany(index, { code: value })} />
                  <TextInput label="Captain" value={company.captain} onChange={(value) => updateCompany(index, { captain: value })} />
                  <TextInput label="Role" value={company.role} onChange={(value) => updateCompany(index, { role: value })} />
                  <TextInput label="Objective / badge text" value={company.winCon} onChange={(value) => updateCompany(index, { winCon: value })} />
                  <TextInput label="Company logo path / URL" value={company.logo} onChange={(value) => updateCompany(index, { logo: value })} />
                  <div className="sm:col-span-2"><TextInput label="Traits (comma separated)" value={company.traits.join(", ")} onChange={(value) => updateCompany(index, { traits: value.split(",").map((part) => part.trim()).filter(Boolean) })} /></div>
                  <div className="sm:col-span-2"><TextArea label="Company description" value={company.summary} onChange={(value) => updateCompany(index, { summary: value })} /></div>
                  {company.logo ? <div className="sm:col-span-2"><img src={company.logo} alt="Company logo preview" className="h-24 w-24 rounded-md border border-border bg-black object-contain p-2" /></div> : null}
                  <div className="sm:col-span-2"><RemoveButton onClick={() => setAdminConfig((current) => ({ ...current, companies: current.companies.filter((_, i) => i !== index) }))} label="Remove Company" /></div>
                </div>
              </details>
            ))}
            <Button type="button" variant="secondary" onClick={() => setAdminConfig((current) => ({ ...current, companies: [...current.companies, { callsign: "New Company", code: "", role: "", winCon: "", captain: "", logo: "", traits: [], summary: "" }] }))}><Plus className="h-4 w-4" />Add Company</Button>
          </div>
        </EditorPanel>

        <EditorPanel kicker="Chain of command" title="Leadership & Captains">
          <div className="space-y-5">
            {adminConfig.leadership.map((person, index) => (
              <details key={`${person.name}-${index}`} className="rounded-md border border-border bg-black/20 p-4">
                <summary className="cursor-pointer font-display text-lg font-semibold uppercase tracking-wide text-fg">{person.rank} {person.name}</summary>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <TextInput label="Rank" value={person.rank} onChange={(value) => updateLeader(index, { rank: value })} />
                  <TextInput label="Name" value={person.name} onChange={(value) => updateLeader(index, { name: value })} />
                  <TextInput label="Billet / position" value={person.billet} onChange={(value) => updateLeader(index, { billet: value })} />
                  <TextInput label="Company (optional)" value={person.company ?? ""} onChange={(value) => updateLeader(index, { company: value || undefined })} />
                  <Field label="Tier" help="Division command or company captain.">
                    <select value={person.tier} onChange={(event) => updateLeader(index, { tier: event.target.value as "command" | "captain" })} className={inputClass}>
                      <option value="command">Division command</option>
                      <option value="captain">Captain</option>
                    </select>
                  </Field>
                  <TextInput label="Portrait path / URL" value={person.portrait} onChange={(value) => updateLeader(index, { portrait: value })} />
                  <div className="sm:col-span-2"><TextArea label="Leadership description" value={person.note} onChange={(value) => updateLeader(index, { note: value })} /></div>
                  {person.portrait ? <div className="sm:col-span-2"><img src={person.portrait} alt={`${person.name} preview`} className="h-40 w-32 rounded-md border border-border bg-black object-cover object-top" /></div> : null}
                  <div className="sm:col-span-2"><RemoveButton onClick={() => setAdminConfig((current) => ({ ...current, leadership: current.leadership.filter((_, i) => i !== index) }))} label="Remove Leader" /></div>
                </div>
              </details>
            ))}
            <Button type="button" variant="secondary" onClick={() => setAdminConfig((current) => ({ ...current, leadership: [...current.leadership, { rank: "Captain", name: "New Leader", billet: "", note: "", tier: "captain", company: "", portrait: "" }] }))}><Plus className="h-4 w-4" />Add Leader</Button>
          </div>
        </EditorPanel>

        <EditorPanel kicker="Regulations" title="Server Rules">
          <TextArea label="Rules introduction" value={adminConfig.rules.intro} onChange={(value) => setAdminConfig((current) => ({ ...current, rules: { ...current.rules, intro: value } }))} />
          <div className="mt-5 space-y-3">
            {adminConfig.rules.items.map((rule, index) => (
              <div key={`${rule.code}-${index}`} className="grid gap-3 rounded-md border border-border bg-black/20 p-4 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
                <TextInput label="Code" value={rule.code} onChange={(value) => updateRule(index, { code: value })} />
                <TextArea label="Rule" value={rule.text} onChange={(value) => updateRule(index, { text: value })} compact />
                <RemoveButton onClick={() => setAdminConfig((current) => ({ ...current, rules: { ...current.rules, items: current.rules.items.filter((_, i) => i !== index) } }))} />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setAdminConfig((current) => ({ ...current, rules: { ...current.rules, items: [...current.rules.items, { code: String(current.rules.items.length + 1), text: "New rule" }] } }))}><Plus className="h-4 w-4" />Add Rule</Button>
          </div>
          <div className="mt-5"><TextArea label="Rule notes (one per line)" value={adminConfig.rules.notes.join("\n")} onChange={(value) => setAdminConfig((current) => ({ ...current, rules: { ...current.rules, notes: lines(value) } }))} /></div>
        </EditorPanel>

        <EditorPanel kicker="Operations & community" title="Standing Orders">
          <div className="space-y-5">
            {adminConfig.standingOrders.map((order, index) => (
              <details key={`${order.number}-${index}`} className="rounded-md border border-border bg-black/20 p-4">
                <summary className="cursor-pointer font-display text-lg font-semibold uppercase tracking-wide text-fg">{order.number}) {order.title}</summary>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <TextInput label="Number" value={String(order.number)} onChange={(value) => updateOrder(index, { number: Number(value) || index + 1 })} />
                  <TextInput label="Title" value={order.title} onChange={(value) => updateOrder(index, { title: value })} />
                  <div className="sm:col-span-2"><TextArea label="Main body" value={order.body} onChange={(value) => updateOrder(index, { body: value })} /></div>
                  <div className="sm:col-span-2 space-y-3">
                    <p className="stencil text-[10px] tracking-[0.12em] text-primary">Subsections</p>
                    {order.subsections.map((sub, subIndex) => (
                      <div key={`${sub.label}-${subIndex}`} className="grid gap-3 sm:grid-cols-[7rem_1fr_auto] sm:items-end">
                        <TextInput label="Label" value={sub.label} onChange={(value) => updateSubsection(index, subIndex, { label: value })} />
                        <TextArea label="Text" value={sub.text} onChange={(value) => updateSubsection(index, subIndex, { text: value })} compact />
                        <RemoveButton onClick={() => setAdminConfig((current) => ({ ...current, standingOrders: current.standingOrders.map((item, i) => i === index ? { ...item, subsections: item.subsections.filter((_, s) => s !== subIndex) } : item) }))} />
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => setAdminConfig((current) => ({ ...current, standingOrders: current.standingOrders.map((item, i) => i === index ? { ...item, subsections: [...item.subsections, { label: String.fromCharCode(97 + item.subsections.length), text: "" }] } : item) }))}><Plus className="h-4 w-4" />Add Subsection</Button>
                  </div>
                  <div className="sm:col-span-2"><TextArea label="Extra paragraphs (one per line)" value={(order.extra ?? []).join("\n")} onChange={(value) => updateOrder(index, { extra: lines(value) })} /></div>
                  <div className="sm:col-span-2"><RemoveButton label="Remove Standing Order" onClick={() => setAdminConfig((current) => ({ ...current, standingOrders: current.standingOrders.filter((_, i) => i !== index) }))} /></div>
                </div>
              </details>
            ))}
            <Button type="button" variant="secondary" onClick={() => setAdminConfig((current) => ({ ...current, standingOrders: [...current.standingOrders, { number: current.standingOrders.length + 1, title: "New Standing Order", body: "", subsections: [], extra: [] }] }))}><Plus className="h-4 w-4" />Add Standing Order</Button>
          </div>
        </EditorPanel>

        <EditorPanel kicker="Recruiting" title="Join Now Page">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Kicker" value={adminConfig.join.kicker} onChange={(value) => updateJoin({ kicker: value })} />
            <TextInput label="Page title" value={adminConfig.join.title} onChange={(value) => updateJoin({ title: value })} />
            <div className="sm:col-span-2"><TextArea label="Page introduction" value={adminConfig.join.body} onChange={(value) => updateJoin({ body: value })} /></div>
            <TextInput label="Battle cry" value={adminConfig.join.battleCry} onChange={(value) => updateJoin({ battleCry: value })} />
            <TextInput label="Battle cry attribution" value={adminConfig.join.battleCryAttribution} onChange={(value) => updateJoin({ battleCryAttribution: value })} />
            <TextInput label="Discord label" value={adminConfig.join.discordLabel} onChange={(value) => updateJoin({ discordLabel: value })} />
            <TextInput label="Discord invite URL" value={adminConfig.join.discordInvite} onChange={(value) => updateJoin({ discordInvite: value })} />
            <div className="sm:col-span-2"><TextArea label="Discord panel description" value={adminConfig.join.discordBody} onChange={(value) => updateJoin({ discordBody: value })} /></div>
            <div className="sm:col-span-2"><TextArea label="Before you drop (one per line)" value={adminConfig.join.beforeDrop.join("\n")} onChange={(value) => updateJoin({ beforeDrop: lines(value) })} /></div>
          </div>
          <div className="mt-6 space-y-3">
            <p className="stencil text-[10px] tracking-[0.12em] text-primary">Enlistment steps</p>
            {adminConfig.join.steps.map((step, index) => (
              <div key={`${step.step}-${index}`} className="grid gap-3 rounded-md border border-border bg-black/20 p-4 sm:grid-cols-[7rem_1fr_1.5fr_auto] sm:items-end">
                <TextInput label="Stage" value={step.step} onChange={(value) => updateJoinStep(index, { step: value })} />
                <TextInput label="Title" value={step.title} onChange={(value) => updateJoinStep(index, { title: value })} />
                <TextArea label="Description" value={step.body} onChange={(value) => updateJoinStep(index, { body: value })} compact />
                <RemoveButton onClick={() => setAdminConfig((current) => ({ ...current, join: { ...current.join, steps: current.join.steps.filter((_, i) => i !== index) } }))} />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setAdminConfig((current) => ({ ...current, join: { ...current.join, steps: [...current.join.steps, { step: String(current.join.steps.length + 1).padStart(2, "0"), title: "New step", body: "" }] } }))}><Plus className="h-4 w-4" />Add Enlistment Step</Button>
          </div>
        </EditorPanel>

        <div className="sticky bottom-4 z-30 mt-6 rounded-xl border border-primary/35 bg-black/90 p-4 shadow-[0_0_40px_rgba(0,0,0,.65)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">Site Management Changes</p>
              <p className="text-xs text-muted">Companies, leadership, rules, Standing Orders, recruiting and appearance save together.</p>
            </div>
            <div className="flex items-center gap-3">
              {adminSaved ? <span className="inline-flex items-center gap-1.5 text-sm text-primary"><CheckCircle2 className="h-4 w-4" />Saved</span> : null}
              <Button type="button" size="lg" disabled={adminSaving} onClick={() => void handleAdminSave()}><Save className="h-4 w-4" />{adminSaving ? "Saving…" : "Save Site Management"}</Button>
            </div>
          </div>
        </div>

        <EditorPanel kicker="Account & security" title="Leadership Credentials">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-black/20 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">Change Username</h3></div>
              <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} autoComplete="username" className={`${inputClass} font-mono`} />
              <p className="mt-2 text-xs text-muted">3–32 characters. Letters, numbers, dots, underscores and hyphens.</p>
              <Button type="button" variant="secondary" className="mt-4 w-full" disabled={accountSaving || !newUsername.trim() || newUsername.trim().toLowerCase() === profile.username.toLowerCase()} onClick={() => void handleUsernameSave()}>Save Username</Button>
            </div>
            <div className="rounded-md border border-border bg-black/20 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">Change Password</h3></div>
              <div className="grid gap-3">
                <input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} />
                <input type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} />
                <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
              </div>
              <Button type="button" variant="secondary" className="mt-4 w-full" disabled={accountSaving} onClick={() => void handlePasswordSave()}>Change Password</Button>
            </div>
          </div>
        </EditorPanel>
      </section>
    </AppShell>
  );

  function updateCompany(index: number, patch: Partial<SiteAdminConfig["companies"][number]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, companies: current.companies.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  }
  function updateLeader(index: number, patch: Partial<SiteAdminConfig["leadership"][number]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, leadership: current.leadership.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  }
  function updateRule(index: number, patch: Partial<SiteAdminConfig["rules"]["items"][number]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, rules: { ...current.rules, items: current.rules.items.map((item, i) => i === index ? { ...item, ...patch } : item) } }));
  }
  function updateOrder(index: number, patch: Partial<SiteAdminConfig["standingOrders"][number]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, standingOrders: current.standingOrders.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  }
  function updateSubsection(orderIndex: number, subIndex: number, patch: Partial<SiteAdminConfig["standingOrders"][number]["subsections"][number]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, standingOrders: current.standingOrders.map((item, i) => i === orderIndex ? { ...item, subsections: item.subsections.map((sub, s) => s === subIndex ? { ...sub, ...patch } : sub) } : item) }));
  }
  function updateJoin(patch: Partial<SiteAdminConfig["join"]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, join: { ...current.join, ...patch } }));
  }
  function updateJoinStep(index: number, patch: Partial<SiteAdminConfig["join"]["steps"][number]>) {
    setAdminSaved(false);
    setAdminConfig((current) => ({ ...current, join: { ...current.join, steps: current.join.steps.map((item, i) => i === index ? { ...item, ...patch } : item) } }));
  }
}

function EditorPanel({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 panel panel-feature overflow-hidden">
      <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
        <p className="stencil text-[10px] tracking-[0.14em] text-primary">{kicker}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{title}</h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span><span className="block font-display text-sm font-semibold uppercase tracking-wide text-fg">{label}</span>{help ? <span className="mt-0.5 block text-xs text-muted">{help}</span> : null}</span>{children}</label>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></Field>;
}

function TextArea({ label, value, onChange, compact }: { label: string; value: string; onChange: (value: string) => void; compact?: boolean }) {
  return <Field label={label}><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={compact ? 2 : 4} className={`${textareaClass} ${compact ? "min-h-16" : ""}`} /></Field>;
}

function ImageEditor({ label, help, value, onChange, square }: { label: string; help: string; value: string; onChange: (value: string) => void; square?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-black/20 p-4">
      <TextInput label={label} value={value} onChange={onChange} />
      <p className="mt-2 text-xs text-muted">{help}</p>
      {value ? <img src={value} alt={`${label} preview`} className={`mt-4 rounded-md border border-border bg-black object-cover ${square ? "h-36 w-36" : "h-44 w-full"}`} /> : null}
    </div>
  );
}

function RemoveButton({ onClick, label = "Remove" }: { onClick: () => void; label?: string }) {
  return <button type="button" onClick={onClick} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20"><Trash2 className="h-4 w-4" />{label}</button>;
}

function SaveRow({ saved, saving, onSave, label }: { saved: boolean; saving: boolean; onSave: () => void; label: string }) {
  return (
    <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted">Changes save to Neon and do not require a GitHub deployment.</p>
      <div className="flex items-center gap-3">
        {saved ? <span className="inline-flex items-center gap-1.5 text-sm text-primary"><CheckCircle2 className="h-4 w-4" />Saved</span> : null}
        <Button type="button" size="lg" disabled={saving} onClick={onSave}><Save className="h-4 w-4" />{saving ? "Saving…" : label}</Button>
      </div>
    </div>
  );
}
