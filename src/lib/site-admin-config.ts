import {
  companies as baseCompanies,
  enlistSteps,
  roster,
  serverRules,
  standingOrders,
  unit,
} from "@/data/unit";

export type ManagedCompany = {
  callsign: string;
  code: string;
  role: string;
  winCon: string;
  captain: string;
  logo: string;
  traits: string[];
  summary: string;
};

export type ManagedLeader = {
  rank: string;
  name: string;
  billet: string;
  note: string;
  tier: "command" | "captain";
  company?: string;
  portrait: string;
};

export type ManagedRule = { code: string; text: string };
export type ManagedStandingOrder = {
  number: number;
  title: string;
  body: string;
  subsections: Array<{ label: string; text: string }>;
  extra?: string[];
};

export type ManagedJoinStep = { step: string; title: string; body: string };

export type SiteAdminConfig = {
  appearance: {
    backgroundImage: string;
    logoImage: string;
  };
  companies: ManagedCompany[];
  leadership: ManagedLeader[];
  rules: {
    intro: string;
    items: ManagedRule[];
    notes: string[];
  };
  standingOrders: ManagedStandingOrder[];
  join: {
    kicker: string;
    title: string;
    body: string;
    battleCry: string;
    battleCryAttribution: string;
    discordLabel: string;
    discordInvite: string;
    discordBody: string;
    beforeDrop: string[];
    steps: ManagedJoinStep[];
  };
};

const hellHoundsBattalion: ManagedCompany = {
  callsign: "Hell Hounds Battalion",
  code: "Fifth Battalion",
  role: "Flexible line battalion",
  winCon: "Hold the line",
  captain: "General Hatchet",
  logo: "/hell-hounds-battalion-v5.webp",
  traits: ["Flexible tasking", "Line operations", "Combined arms", "Rapid support"],
  summary:
    "Hell Hounds Battalion is the fifth formation of the 1st Mobile Infantry, reinforcing the line wherever Division Command needs additional combat power.",
};

const temporaryHellHoundsCaptain: ManagedLeader = {
  rank: "General · Temporary Captain",
  name: "Hatchet",
  billet: "Hell Hounds Battalion · Temporary Battalion Command",
  note: "General Hatchet is temporarily commanding Hell Hounds Battalion while retaining overall command of the 1st Mobile Infantry.",
  tier: "captain",
  company: "Hell Hounds Battalion",
  portrait: "/roster-hatchet.jpg",
};

const defaultLeadership: ManagedLeader[] = [
  ...roster
    .filter((person) => String(person.name).toLowerCase() !== "ripper")
    .map((person) => ({
      rank: person.name === "Lustrati" ? "Major" : person.rank,
      name: person.name,
      billet: person.billet,
      note: person.note,
      tier: person.tier as "command" | "captain",
      company: "company" in person ? person.company : undefined,
      portrait: "portrait" in person && person.portrait ? person.portrait : "",
    })),
  temporaryHellHoundsCaptain,
];

export const DEFAULT_SITE_ADMIN_CONFIG: SiteAdminConfig = {
  appearance: {
    backgroundImage: "/site-bg.png",
    logoImage: unit.emblem || "/mi-emblem.jpg",
  },
  companies: [
    ...baseCompanies.map((company) => ({
      callsign: company.callsign,
      code: company.code,
      role: company.role,
      winCon: company.winCon,
      captain: company.captain,
      logo: company.logo,
      traits: [...company.traits],
      summary: company.summary,
    })),
    hellHoundsBattalion,
  ],
  leadership: defaultLeadership,
  rules: {
    intro: serverRules.intro,
    items: serverRules.items.map((item) => ({ ...item })),
    notes: [...serverRules.notes],
  },
  standingOrders: standingOrders.map((order) => ({
    number: order.number,
    title: order.title,
    body: order.body || "",
    subsections: order.subsections.map((subsection) => ({ ...subsection })),
    extra: "extra" in order && order.extra ? [...order.extra] : [],
  })),
  join: {
    kicker: "Recruiting",
    title: "Join Now!",
    body:
      "The front gate is Discord. Join the 1st M.I. server, read the rules, and get on the line with your company.",
    battleCry: "Come on, you apes! You wanna live forever?",
    battleCryAttribution: "Unit battle cry · attributed",
    discordLabel: unit.discordLabel,
    discordInvite: unit.discordInvite,
    discordBody:
      "New troopers report in on Discord. Company channels, ops, certifications, and leadership all live there. One click opens the invite.",
    beforeDrop: [
      "Read Server Rules & Standing Orders on this site",
      "Enable DMs so leadership can reach you",
      "Respect rank tags and company channels",
    ],
    steps: enlistSteps.map((step) => ({ ...step })),
  },
};

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function mergeSiteAdminConfig(input?: Partial<SiteAdminConfig> | null): SiteAdminConfig {
  const defaults = copy(DEFAULT_SITE_ADMIN_CONFIG);
  if (!input) return defaults;

  const inputCompanies = Array.isArray(input.companies)
    ? copy(input.companies).map((company) => {
        const callsign = company.callsign.trim().toLowerCase();
        const isHellHounds =
          callsign === "alpha" ||
          callsign.includes("hell hounds") ||
          callsign.includes("hellhounds");
        if (isHellHounds) {
          return {
            ...company,
            callsign: "Hell Hounds Battalion",
            code: "Fifth Battalion",
            role: company.role === "Fifth line company" ? "Flexible line battalion" : company.role,
            captain: "General Hatchet",
            logo: "/hell-hounds-battalion-v5.webp",
            summary:
              isHellHounds ||
              company.summary.toLowerCase().includes("alpha company")
                ? "Hell Hounds Battalion is the fifth formation of the 1st Mobile Infantry, reinforcing the line wherever Division Command needs additional combat power."
                : company.summary,
          };
        }
        return company;
      })
    : defaults.companies;

  const storedLeadership = Array.isArray(input.leadership)
    ? copy(input.leadership).filter(
        (person) =>
          !(
            person.name.trim().toLowerCase() === "hookngaffe" &&
            person.company?.trim().toLowerCase() === "alpha"
          ) &&
          !(
            person.tier === "captain" &&
            person.name.trim().toLowerCase() === "hatchet" &&
            (() => {
              const company = person.company?.trim().toLowerCase() || "";
              return company === "alpha" || company.includes("hell hounds") || company.includes("hellhounds");
            })()
          ),
      )
    : defaults.leadership.filter(
        (person) =>
          !(
            person.tier === "captain" &&
            person.name.trim().toLowerCase() === "hatchet"
          ),
      );

  const inputLeadership = [
    ...storedLeadership,
    copy(temporaryHellHoundsCaptain),
  ];

  return {
    appearance: {
      ...defaults.appearance,
      ...(input.appearance ?? {}),
    },
    companies: inputCompanies,
    leadership: inputLeadership,
    rules: {
      ...defaults.rules,
      ...(input.rules ?? {}),
      items: Array.isArray(input.rules?.items) ? copy(input.rules!.items) : defaults.rules.items,
      notes: Array.isArray(input.rules?.notes) ? copy(input.rules!.notes) : defaults.rules.notes,
    },
    standingOrders: Array.isArray(input.standingOrders)
      ? copy(input.standingOrders)
      : defaults.standingOrders,
    join: {
      ...defaults.join,
      ...(input.join ?? {}),
      beforeDrop: Array.isArray(input.join?.beforeDrop)
        ? copy(input.join!.beforeDrop)
        : defaults.join.beforeDrop,
      steps: Array.isArray(input.join?.steps) ? copy(input.join!.steps) : defaults.join.steps,
    },
  };
}
