export const unit = {
  designation: "1st Mobile Infantry",
  shortName: "1st M.I.",
  division: "1st M.I. Division",
  branch: "Federal Armed Services",
  motto: "No one stacks them high like the First M.I.",
  secondaryMotto: "The first to drop. The last to leave.",
  tagline: "Service Guarantees Citizenship.",
  homebase: "San Diego Recruit Depot · Terra",
  status: "Active — Drop Ready",
  established: "Federal Year 2148",
  emblem: "/mi-emblem.jpg",
  /** Official Discord invite — paste your permanent invite here */
  discordInvite: "https://discord.gg/1stmi",
  discordLabel: "1st Mobile Infantry Discord",
};

export const stats = [
  { id: "troopers", label: "Total troopers", value: "live" },
  { id: "companies", label: "Companies", value: "4" },
  { id: "bugs", label: "Bugs killed", value: "live" },
  { id: "dropships", label: "Total dropships completed", value: "live" },
] as const;

// bugsKilledBase kept for any legacy imports — live tally lives in lib/bugs-killed.ts
export const bugsKilledBase = 2_778_110;

export const doctrine = [
  {
    title: "Friendship",
    body: "Your fireteam is family. Buddy checks before every push. No Trooper left on the line. Trust is what holds the squad together when the swarm hits.",
  },
  {
    title: "Honour",
    body: "Wear the emblem clean. Report true. Keep the oath you signed when you volunteered. Citizenship is earned — never bought, never bartered.",
  },
  {
    title: "Courage",
    body: "Fear is allowed. Freezing is not. Move when the order comes. Hold the line when the ridge goes black with bugs.",
  },
  {
    title: "Discipline",
    body: "Weapon, kit, and orders. Drill until the rifle is part of you. Fire discipline keeps friendlies alive.",
  },
];

export const companies = [
  {
      callsign: "Demon",
      code: "A Co",
      role: "Base construction & ARC defense",
      winCon: "Hold the ARC",
      captain: "Ricky D Spanish",
      logo: "/company-demon.png",
      traits: ["Fortify", "Static defense", "Engineer teams", "Perimeter guns"],
      summary:
        "Demon builds the war on the ground. They dig in, raise the ARC, hardpoint the perimeter, and own every meter of wire and sandbag. When the swarm hits the fence, Demon is the anvil.",
    },
  {
      callsign: "Cerberus",
      code: "C Co",
      role: "Quick Reaction Force",
      winCon: "First to the breach",
      captain: "KnightBear",
      logo: "/company-cerberus.png",
      traits: ["QRF", "Rapid deploy", "Hot LZ relief", "All-weather"],
      summary:
        "Cerberus is the three-headed watchdog — always geared, always listening. When a squad is pinned or a gate is breached, Cerberus is the first boots through the door.",
    },
  {
      callsign: "Nightmare",
      code: "B Co",
      role: "Resource & logistics warfare",
      winCon: "Gas & ore flowing",
      captain: "PurpleWolf",
      logo: "/company-nightmare.png",
      traits: ["Convoy security", "Extraction", "Field refining", "Supply lines"],
      summary:
        "Nightmare feeds the war machine. Gas, ore, and every critical resource the Fleet and the Line need. They secure extraction sites, run the convoys, and keep the pipeline open under bug pressure.",
    },
  {
      callsign: "Hellfire",
      code: "D Co",
      role: "Bug hunters / offensive kill teams",
      winCon: "Kill count rising",
      captain: "Burster",
      logo: "/company-hellfire.png",
      traits: ["Hunt teams", "Nest clearance", "Ambush", "Aggressive recon"],
      summary:
        "Hellfire does not wait for the bugs to come to them. They hunt. Nest clearance, tunnel denial, and free-fire pursuit until the local population is ash.",
    },
];

export const campaigns = [
  {
    code: "OP-VALAKA",
    name: "Valaka",
    year: "FY 2204",
    outcome: "Ongoing",
    terrain: "Desert · canyons · hollows",
    brief:
      "Sprawling deserts, deep canyons, and hidden subterranean hollows. Open sand kills the unprepared; the real fight is under the rim. Hellfire clears nest chambers while Demon holds ARC sites on the canyon lips.",
  },
  {
    code: "OP-AGNI",
    name: "Agni Prime",
    year: "FY 2204",
    outcome: "Ongoing",
    terrain: "Volcanic · jungle · extreme heat",
    brief:
      "Fire-blasted volcanic ranges with lava flows and exploding rock, plus prehistoric jungle and massive crystal formations. Extreme heat pushes troopers to the limit. Nightmare strips ore between the flows; Hellfire burns nests under crystal and canopy.",
  },
  {
    code: "OP-BOREAS",
    name: "Boreas",
    year: "FY 2205",
    outcome: "Ongoing",
    terrain: "Ice · methane · vertical canyons",
    brief:
      "Frozen wasteland of deep blue ice, sparkling snow, and frozen methane — scarred by a Bug meteor that evolved extreme cold adaptations. The vertical canyons between plateaus demand tactical movement, mastered by Cerberus Company utilising their class-loadouts.",
  },
  {
    code: "OP-X11",
    name: "X-11",
    year: "FY 2205",
    outcome: "Ongoing",
    terrain: "Cratered mining world · ring system",
    brief:
      "Rugged cratered mining planet inside a gas giant’s rings. Low gravity dust, ring-shadow night cycles, deep extraction pits. Nightmare’s primary industrial target. Demon’s ARC is the only green zone on the surface.",
  },
];

export const roster = [
  {
        rank: "General",
        name: "Hatchet",
        billet: "Division command",
        note: "Overall authority for the 1st Mobile Infantry. Sets strategic intent across all four theaters and Companies.",
        tier: "command",
        portrait: "/roster-hatchet.jpg",
      },
  {
        rank: "Colonel",
        name: "Zakuria",
        billet: "Regimental command",
        note: "Executes General Hatchet’s intent on the ground. Coordinates multi-company operations and theater rotations.",
        tier: "command",
        portrait: "/roster-zakuria.jpg",
      },
  {
        rank: "Lt. Colonel",
        name: "Kontra",
        billet: "Deputy / operations",
        note: "Plans drops, assigns company objectives, and keeps the division tempo high when contact is continuous.",
        tier: "command",
        portrait: "/roster-kontra.jpg",
      },
  {
        rank: "Sergeant Major",
        name: "Talmor",
        billet: "Division sergeant major",
        note: "Top enlisted advisor to Division command. Owns discipline, NCO development, and the hard standard every company is measured against.",
        tier: "command",
        portrait: "/roster-talmor.jpg",
      },
  {
        rank: "Command Sergeant",
        name: "Ripper",
        billet: "Division senior enlisted",
        note: "Senior enlisted voice of Division command. Enforces standards, keeps the NCOs tight, and makes sure every order from HQ hits the line clean.",
        tier: "command",
        portrait: "/roster-ripper.jpg",
      },
  {
        rank: "Warrant Officer",
        name: "Lustrati",
        billet: "Senior technical / training",
        note: "Master of systems, kit standards, and field craft. The bridge between officer intent and trooper execution.",
        tier: "command",
        portrait: "/roster-lustrati.jpg",
      },
  {
        rank: "Warrant Officer",
        name: "Matrix",
        billet: "Division staff / technical command",
        note: "Division command warrant. Owns systems coordination, readiness tracking, and the tools that keep HQ and the line aligned.",
        tier: "command",
        portrait: "/roster-matrix.jpg",
      },
  {
        rank: "Captain",
        name: "Ricky D Spanish",
        billet: "Demon Company (A Co)",
        note: "Commands base construction and ARC defense. Owns the wire, the guns, and the ground the division stands on.",
        tier: "captain",
        company: "Demon",
        portrait: "/roster-ricky.jpg",
      },
  {
        rank: "Captain",
        name: "KnightBear",
        billet: "Cerberus Company (C Co)",
        note: "Commands the Quick Reaction Force. First to the breach when a squad is pinned or a gate fails.",
        tier: "captain",
        company: "Cerberus",
        portrait: "/roster-knightbear.jpg",
      },
  {
        rank: "Captain",
        name: "PurpleWolf",
        billet: "Nightmare Company (B Co)",
        note: "Commands resource and logistics warfare. Gas, ore, and every convoy that keeps the war machine alive.",
        tier: "captain",
        company: "Nightmare",
        portrait: "/roster-purplewolf.jpg",
      },
  {
        rank: "Captain",
        name: "Burster",
        billet: "Hellfire Company (D Co)",
        note: "Commands bug hunter kill teams. Nest clearance, tunnel denial, and the kill tally that never stops climbing.",
        tier: "captain",
        company: "Hellfire",
        portrait: "/roster-burster.jpg",
      },
];

export const enlistSteps = [
  {
    step: "01",
    title: "Join Discord",
    body: "Hit Join Now! and open the 1st M.I. Discord. That’s the front gate for every new trooper.",
  },
  {
    step: "02",
    title: "Read the rules",
    body: "Server Rules and Standing Orders apply the moment you join. Read them before you post or drop.",
  },
  {
    step: "03",
    title: "Introduce yourself",
    body: "Say hi in the recruit / general channels. Leadership and company NCOs will point you where you need to go.",
  },
  {
    step: "04",
    title: "Get assigned",
    body: "Land with Demon, Cerberus, Nightmare, or Hellfire — then get on the line with your company.",
  },
];

/** Discord server rules — 1st M.I. */
export const serverRules = {
  intro:
    "The core principle of the 1st M.I. is that all users treat each other with respect regardless of opinion. These rules apply to all channels, including off topic. Please keep all conversations professional and respectful. If you have a disagreement with another user, please take it to DMs or ask a Moderator for assistance.",
  items: [
    { code: "I", text: "DO NOT disrespect other users." },
    {
      code: "II",
      text: "DO NOT promote your own Discord within the 1st M.I server, without direct permission from @[GEN] Hatchet [DC], @[COL] Zakuria [DC] or @[LTCOL] Kontra [DC].",
    },
    {
      code: "III",
      text: "DO NOT post exploits, glitches or hacks in this Discord. Please inform a member of Community Team or a Moderator and they will get you into contact with QA.",
    },
    {
      code: "IV",
      text: "DO NOT post illegal content such as torrents, warez, counterfeit products, keys, etc.",
    },
    {
      code: "V",
      text: "DO NOT post personal information such as name, address, email, phone numbers, etc.",
    },
    {
      code: "VI",
      text: "DO NOT post media depicting actual real-life violence of any kind.",
    },
    { code: "VII", text: "DO NOT post NSFW content." },
    { code: "VIII", text: "DO NOT discuss politics or religion." },
    {
      code: "IX",
      text: "DO NOT spam, troll, harass, or bait in text and voice channels.",
    },
    {
      code: "X",
      text: "DO NOT attempt to evade bans by creating and joining on alternate Discord accounts.",
    },
    {
      code: "XI",
      text: "DO NOT record voices in Discord without prior permission from all presents in the channel.",
    },
    {
      code: "XII",
      text: "DO NOT intentionally initiate, or participate, in any game mechanic that causes Friendly Fire.",
    },
    {
      code: "XIII",
      text: "This is a NON-EXHAUSTIVE list of rules that ADMIN and Moderators will act on as they see fit.",
    },
  ],
  notes: [
    "As a primarily English-speaking server we request all members to speak in English. Other languages may find their messages removed.",
    "All the above applies to reactions/emojis/gifs etc.",
    "We reserve the right to remove anyone from this Discord server based on disruptive behaviour and attitude.",
    "We treat all warnings/moderation actions as if the recipient received them. It is in your best interest to have DMs enabled.",
  ],
};

/** Standing Orders — operational rules for the 1st M.I. */
export const standingOrders = [
  {
    number: 1,
    title: "Companies",
    body: "While we are separated into Companies, no one Company is better than any other Company or receives special treatment. We are first and foremost one community, and any action that counters this will be treated as a severe offence.",
    subsections: [],
  },
  {
    number: 2,
    title: "Communications",
    body: "All conversations regarding 1st M.I. issues and/or situations are to be handled, where appropriate, in the designated chats including the below.",
    subsections: [
      {
        label: "a",
        text: "Captains, Officer, Leadership, Senior Sergeant, NCO and General chats.",
      },
      { label: "b", text: "The separate company chats." },
      {
        label: "c",
        text: "Ensure relevant conversations are held in the right place. In the event you disagree with a direction given or a person you DO NOT argue it in a public channel — take it to an appropriate channel (DMs/Leadership chat for your company etc). If you are disrespectful in a public channel, it will not be tolerated and depending on your Rank and Role within the community can be treated as a severe offence with the higher your role the greater the offence.",
      },
    ],
    extra: [
      "There is to be no “external” chats used by any person for group communication, for the following reasons:",
      "(1) Accountability: In the event a situation occurs DC should be able to see any conversations related to the incident so they can understand both sides.",
      "(2) Integrity: All decisions by the Companies Command structure are subject to review by DC to ensure that fairness and unbiased decisions are being made in line with the rules, spirit and direction of the 1st M.I.",
      "(3) Control: All chats in the server can be seen by DC including any deleted or edited posts to ensure that any incidents are handled truthfully; this cannot be done with external chats/servers which brings into question the validity and honesty of both the information provided and the people providing it.",
      "There are exemptions such as Leave of Absence [LOA] which may contain private information, but these exemptions are approved at the discretion of DC — no one else may approve them.",
    ],
  },
  {
    number: 3,
    title: "Behaviour",
    body: "There are expectations of all members of the 1st M.I. which are listed above. In terms of the operations, we take on a mil-sim approach. All members regardless of rank must abide by the Platoon Leaders (PL) and their Squad Leaders (SL) directions.",
    subsections: [
      {
        label: "a",
        text: "When there are enough numbers for a dropship a qualified PL will take charge in organising everyone. At this point all banter and conversations cease until the operation is on the ground. This is to ensure that dropships get going in a quick and timely manner.",
      },
      {
        label: "b",
        text: "If you see something you do not agree with or feel can be done better, do not bring it up in the middle of the operation — bring it up with the person at the end of de-briefing.",
      },
      {
        label: "c",
        text: "Any vocal comments in Local, Team or squad discord channels that disparage or are disrespectful (e.g. why are they doing that, I could do better etc) will not be tolerated.",
      },
      {
        label: "d",
        text: "PLs and SLs will wait for a brief time after debriefing to answer any questions or hear anyone out. This is an obligation that comes with holding the certification and it will be expected that it happens.",
      },
      {
        label: "e",
        text: "If you are in the waiting for game channel, in the event an operation starts forming, it is expected that you leave any casual match you are in and join the operation.",
      },
      {
        label: "f",
        text: "Team Killing is not tolerated in the 1st M.I.",
      },
      {
        label: "f-i",
        text: "If someone is giving grief to the team DO NOT KILL THEM. Instead have all 1st M.I. members in the match report the person by using the in-game menu. The game has an auto-kick function for when someone receives multiple reports in one match.",
      },
      {
        label: "f-ii",
        text: "If it is an “official” 1st M.I. match that means you’ll have 12 people — with those 12 you should be able to get the auto kick function to kick them.",
      },
      {
        label: "f-iii",
        text: "If you don’t have enough to get the auto kick feature to turn on, leave the match. The game shadow tracks how much team damage you have done, and you might get a ban.",
      },
      {
        label: "f-iv",
        text: "Team killing is also something that we do not accept within 1st M.I. Below is how we handle team killing incidents.",
      },
      {
        label: "ENLISTED",
        text: "v) You will be given a talking to and warning for your behaviour. vi) If it is reported again, you will be timed out of the server for 24hr. vii) If your actions continue you will be KICK until such time you can behave yourself in our community and be allowed back at the rank of PVT.",
      },
      {
        label: "NCO/OFFICER",
        text: "viii) You will be demoted in rank and timed out of the server for 24hrs. ix) If your actions continue you will be kicked until such time you can behave in our community and be allowed back in at the rank of PVT.",
      },
    ],
    extra: [
      "We understand that griefers are annoying to deal with — save yourself the time, report them to get them auto kicked, or leave the match. It isn’t worth engaging with them; by team killing them you’re doing exactly what they want.",
    ],
  },
  {
    number: 4,
    title: "3 Strike Policy",
    body: "The 1st M.I. uses a 3-strike policy. If you have questions or concerns regarding your personal warning, please feel free to DM a Moderator for assistance. However, kicks, warnings and bans are not up for discussion, and they will not be overturned.",
    subsections: [
      {
        label: "Strike 1",
        text: "Warning. You are warned. These warnings may be issued via DM, voice chat, or in public channels.",
      },
      {
        label: "Strike 2",
        text: "Kick/Timeout. You are kicked/timed out from the Discord server and issued another warning for your behaviour. You may join again, but please read and understand the rules before posting again.",
      },
      {
        label: "Strike 3",
        text: "Ban. You are banned from this Discord server.",
      },
    ],
    extra: [
      "Please note that for egregiously bad behaviour the Admins and Moderators can skip straight to a kick or ban without a chance of appeal. Mutes may also be issued should we feel people are misusing channels, disregarding warnings or being a nuisance. All these actions are done at our discretion and things are discussed internally.",
      "Trying to circumvent bans or mutes will result in a permanent ban.",
      "Additionally, if you get banned, we have no obligation to unban you; this falls in line with any moderator action such as muting/restrictions.",
    ],
  },
  {
    number: 5,
    title: "Disciplinary Action",
    body: "As stated above for serious offences you will receive a strike. For smaller offences a Bolo will be created describing the event which will include:",
    subsections: [
      { label: "a", text: "What the incident was." },
      { label: "b", text: "A summary of the conversation had with the moderator." },
      { label: "c", text: "Outcome e.g. warning etc." },
    ],
    extra: [
      "All members of the community including DC, Division Staff and Captains are subject to this and due to the higher position and responsibility of said roles will be held to the highest standard possible.",
      "Please note in the event you have multiple small offences they will be treated as a strike at the recommendation of DC, your home Company Captain or senior leadership, who will be involved in all conversations regarding the incident.",
      "Should no suitable member of your company be online at this time DC or a senior officer from another company will be brought in to handle the situation.",
    ],
  },
  {
    number: 6,
    title: "Appeal Process",
    body: "You can appeal warnings or a decision (excluding bans, kicks) to your company Captain who will review it.",
    subsections: [
      {
        label: "a",
        text: "If you feel that you cannot get an unbiased ruling or that certain information was not used or misunderstood, you can bring it to DC.",
      },
      {
        label: "b",
        text: "Please note: In this event DC may bring in other Captains or Officers from outside the incident to review the information.",
      },
      {
        label: "c",
        text: "Once this is done DC will make the final decision which cannot be appealed.",
      },
    ],
  },
  {
    number: 7,
    title: "Leave of Absence [LOA]",
    body: "Real life happens. In the event you are going to be away for an extended amount of time please inform your NCO’s or higher. Division oversees LOA but does not intervene unless there is an issue or lack of action from the Company.",
    subsections: [
      {
        label: "a",
        text: "For NCOs and above: Leave of Absence time limit is 45 days; this can be extended by your home company’s Senior Sergeants and officers at their discretion depending on circumstances.",
      },
      {
        label: "b",
        text: "If you are out of the Discord, and not playing SST: E, for more than 30 days you will be contacted by your home company to see how you are going.",
      },
      {
        label: "c",
        text: "If you will be offline for a considerable unknown time, you can request demotion to LCPL or Specialist. When you come back you can progress up the ranks again or return to your previous rank at the discretion of your Captain or senior leadership.",
      },
      {
        label: "d",
        text: "If you do not respond you can be demoted to LCPL or Specialist at the discretion and approval of your Senior Sergeants in the case of an NCO, or in the case of an officer your Captain and 1st Lieutenant or at direction of DC.",
      },
      {
        label: "e",
        text: "Please note taking LOA is a private matter — you do not need to tell anyone the reason for your LOA, just that you are taking it. Should anyone demand or request to know why you are going on LOA please inform your Captain or Division Command as this is a breach of privacy.",
      },
      {
        label: "f",
        text: "Keep in mind that LOA is meant mainly for those who are likely to not be seen or heard from for an extended period. If you’re only expecting to be gone for a few days LOA is not required.",
      },
    ],
  },
  {
    number: 8,
    title: "Activity Checks",
    body: "For NCO’s and Officers activity checks are conducted monthly to ensure that those in these ranks are performing the duties required of the positions.",
    subsections: [
      {
        label: "a",
        text: "Activity checks are overseen and done by the Companies’ Senior Sergeants.",
      },
      {
        label: "b",
        text: "How they are done is up to the Companies, whether it is by doing an Activity Log or by reaching out via DM’s or other means.",
      },
      {
        label: "c",
        text: "It is a responsibility of the officers and ultimately the captain of the Companies to ensure Activity Checks are done and reported; there are no exemptions.",
      },
      {
        label: "d",
        text: "In the event a member is not active, is not on LOA and/or does not respond to DMs they are to be demoted to LCPL or Specialist at the discretion of their Company or direction of DC.",
      },
      {
        label: "e",
        text: "There is a limit of 45 days an NCO or above can be inactive as it is a requirement of the roles to be active in the server.",
      },
    ],
  },
  {
    number: 9,
    title: "Certifications",
    body: "",
    subsections: [
      {
        label: "a",
        text: "All certifications are conducted by an experienced and certified trainer.",
      },
      {
        label: "b",
        text: "Certifications are conducted utilizing a checklist for an unbiased decision.",
      },
      {
        label: "c",
        text: "Paperwork is to be filed in the appropriate company thread for reference.",
      },
      {
        label: "d",
        text: "Certification debriefs are to be conducted in the Cert Debrief Rooms with only the Trainer and Trainee present.",
      },
    ],
  },
  {
    number: 10,
    title: "Locking the Lobby",
    body: "In official operations (12 or more) we can lock the lobby. This prevents contractors from joining which allows 1st M.I. members who crash to rejoin the match.",
    subsections: [
      {
        label: "a",
        text: "The only time locking the lobby is mandatory is when certifications or shadows are occurring.",
      },
      {
        label: "b",
        text: "At all other times it is at the discretion of the PL.",
      },
      {
        label: "c",
        text: "While locking the lobby is preferred for allowing members of the community to join, do not forget that going into a match and allowing contractors to join allows for recruitment to occur and is just as important.",
      },
    ],
  },
  {
    number: 11,
    title: "Ore/Gas Canisters",
    body: "",
    subsections: [
      {
        label: "a",
        text: "All Ore/Gas canisters are to be immediately deposited to prevent them being destroyed and delaying the match.",
      },
      {
        label: "b",
        text: "There are exceptions to this SO being that one gas can is held in reserve by the builder on their back.",
      },
      {
        label: "c",
        text: "An event requiring this rule to be disregarded.",
      },
    ],
    extra: [
      "In the event a can being on the ground it is not to be shot on purpose; if it results in killing a Trooper it will be treated the same as team killing as mentioned in Paragraph 3 subsection f.",
    ],
  },
  {
    number: 12,
    title: "Changing the structure of the 1st M.I.",
    body: "This includes ranks, rank tags, LOA etc.",
    subsections: [
      {
        label: "a",
        text: "If there is a need for Rank/Tag/Nickname change it must be referred to a CPT who will assess the request. If they agree they will submit it to Division Command.",
      },
      {
        label: "b",
        text: "If approved a Divisional PSA will be released by Division Command stating the exception and its approval.",
      },
      {
        label: "c",
        text: "Once the PSA is released the company may go ahead and make the change.",
      },
      {
        label: "d",
        text: "Under no circumstances will anyone else change the way the tags/ranks or nicknames for any other reason than to match the in-game name without approval.",
      },
    ],
  },
  {
    number: 13,
    title: "Voice channels",
    body: "The server is not an 18+ server so channels have the same rules as the rest of the server and violations will be handled appropriately.",
    subsections: [
      {
        label: "a",
        text: "This includes all rules and SO’s that apply e.g. no slurs, politics etc.",
      },
      {
        label: "b",
        text: "If you are reported or found out to be in violation of the server standards you will face disciplinary action.",
      },
      {
        label: "c",
        text: "Part of the reason is if it is reported to the Discord admins they can shut the whole server down. Secondly, we pride ourselves on showing respect to each other and just because you don’t mind does not mean everyone else doesn’t.",
      },
    ],
  },
];

export const navLinks = [
  { to: "/", label: "Home", exact: true },
  { to: "/leadership", label: "Leadership" },
  { to: "/rules", label: "Rules" },
  { to: "/join", label: "Join now" },
] as const;
