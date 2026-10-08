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
]) {
  requireToken(api, token, token);
}

for (const token of [
  'createFileRoute("/leadership-bot-control")',
  "fetchLocalLeadershipProfile",
  "restartLeadershipBotModule",
  "syncLeadershipAutomaticRoles",
  "fetchLeadershipBotMember",
  "undoLeadershipBotAudit",
  "Server Safety",
  "Bot Modules",
  "Member Lookup",
  "Leadership Audit",
]) {
  requireToken(route, token, token);
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
  "Leadership Tech Support Bot Controller smoke test passed: leadership auth, server-side secret bridge, status/safety/modules/member/audit controls.",
);
