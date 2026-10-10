import fs from "node:fs";

function read(file) {
  return fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

function requireToken(source, token, label) {
  if (!source.includes(token)) {
    throw new Error(`Leadership bot-control smoke failed: missing ${label || token}`);
  }
}

const api = read("src/lib/bot-control-fn.ts");
const route = read("src/routes/leadership-bot-control.tsx");
const leadership = read("src/routes/leadership-control.tsx");
const settingsControl = read("src/components/bot-control-settings.tsx");

for (const token of [
  "requireLocalLeadership",
  "LEADERSHIP_BOT_CONTROL_SECRET",
  "STORE_ORDER_API_SECRET",
  "/website-control/status",
  "/website-control/safety",
  "/website-control/modules",
  "/website-control/role-automation/sync",
  "/website-control/member/",
  "/website-control/audit",
  "/website-control/audit/undo",
  "/website-control/channels",
  "/website-control/tickets",
  "/website-control/operations",
  "/website-control/guild-options",
  "/website-control/settings",
  "/website-control/onboarding/",
  "saveLeadershipBotSettingsSection",
  "resetLeadershipOnboardingMember",
]) {
  requireToken(api, token, token);
}

for (const token of [
  'createFileRoute("/leadership-bot-control")',
  "fetchLocalLeadershipProfile",
  "restartLeadershipBotModule",
  "syncLeadershipAutomaticRoles",
  "fetchLeadershipBotMember",
  "fetchLeadershipBotTickets",
  "closeLeadershipBotTicket",
  "fetchLeadershipBotChannels",
  "createLeadershipBotOperation",
  "cancelLeadershipBotOperation",
  "undoLeadershipBotAudit",
  "Server Safety Dashboard",
  "Bot Modules",
  "Member Profile",
  "Tech Support Tickets",
  "Operation / Event Manager",
  "Leadership Audit + Undo",
  "BotControlSettings",
]) {
  requireToken(route, token, token);
}

for (const token of [
  "Bot Control Centre",
  "Role Mapping",
  "LFT & Recruit Alerts",
  "AAR Control",
  "Onboarding Member Reset",
  "roleAutomation",
  "transfer",
  "onboarding",
  "GIF & Media Stats",
  "/mediastatsrebuild",
]) {
  requireToken(settingsControl, token, token);
}

requireToken(
  leadership,
  'to="/leadership-bot-control"',
  "Leadership Control link to Tech Support Bot Controller",
);

if (api.includes("TOKEN") || api.includes("DISCORD_TOKEN")) {
  throw new Error("Leadership bot-control API must never expose or use Discord bot tokens.");
}

console.log(
  "Leadership Tech Support Bot Controller smoke test passed: leadership auth, server-side secret bridge, status/safety/modules/member/tickets/operations/audit plus whole-bot roles/onboarding/AAR/LFT/automation/transfer controls.",
);

if (/AI Voice AAR|aiVoiceConfigured|Groq ready|ElevenLabs optional/.test(settingsControl + "\n" + api)) {
  throw new Error("Removed AI Voice AAR controls must not be present.");
}
