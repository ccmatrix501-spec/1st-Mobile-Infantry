import { createServerFn } from "@tanstack/react-start";
import type {
  LeadershipPoll,
  PollAccessSettingsInput,
  PollAdditionInput,
  PollOption,
  PollOptionInput,
  PollVoter,
  PollVoteInput,
  PublicPoll,
  PublicPollRequest,
  SaveLeadershipPollInput,
} from "@/lib/polls";

const MAX_POLLS = 100;
const MAX_OPTIONS = 100;
const MAX_USER_ADDITIONS = 3;

const UUID_PATTERN = /^[a-f0-9-]{32,64}$/i;
const SHARE_CODE_PATTERN = /^[a-z0-9]{12,32}$/i;
const VOTER_KEY_PATTERN = /^[a-z0-9_-]{16,160}$/i;

type PollRow = {
  id: string;
  share_code: string;
  title: string;
  description: string;
  allow_additions: boolean;
  is_open: boolean;
  max_selections: number;
  require_discord_name: boolean;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
};

type PollOptionRow = {
  id: string;
  label: string;
  emoji: string;
  image_url: string;
  sort_order: number;
  is_user_added: boolean;
  votes: number;
};

type PollVoterRow = {
  voter_hash: string;
  discord_name: string;
  updated_at: string;
  option_id: string;
  label: string;
  sort_order: number;
};

function cleanText(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

function cleanShareCode(value: unknown): string {
  const shareCode = cleanText(value, 40).toLowerCase();
  if (!SHARE_CODE_PATTERN.test(shareCode)) throw new Error("This poll link is invalid.");
  return shareCode;
}

function voterKey(value: unknown): string {
  const key = cleanText(value, 180);
  if (!VOTER_KEY_PATTERN.test(key)) {
    throw new Error("Your browser vote key is invalid. Refresh and try again.");
  }
  return key;
}

async function voterHash(value: unknown): Promise<string> {
  const key = voterKey(value);
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(`1stmi-poll:${key}`).digest("hex");
}

function normaliseDiscordName(value: unknown, required: boolean): string {
  const name = cleanText(value, 80).replace(/\s+/g, " ");
  if (required && name.length < 2) {
    throw new Error("Enter your Discord username or server display name before voting.");
  }
  return name;
}

function normaliseClosesAt(value: unknown): string | null {
  const text = cleanText(value, 100);
  if (!text) return null;
  const parsed = new Date(text);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("Choose a valid poll closing date and time.");
  }
  return parsed.toISOString();
}

function effectiveOpen(row: Pick<PollRow, "is_open" | "closes_at">): boolean {
  if (!row.is_open) return false;
  if (!row.closes_at) return true;
  const closes = Date.parse(row.closes_at);
  return !Number.isFinite(closes) || closes > Date.now();
}

function validImageUrl(value: string): boolean {
  return !value || value.startsWith("/media/") || value.startsWith("/") || /^https:\/\//i.test(value);
}

function normaliseOption(input: PollOptionInput, index: number) {
  const label = cleanText(input.label, 100);
  if (!label) throw new Error(`Poll answer ${index + 1} needs a label.`);
  const emoji = cleanText(input.emoji, 24);
  const imageUrl = cleanText(input.imageUrl, 500);
  if (!validImageUrl(imageUrl)) {
    throw new Error(`Image for “${label}” must use a Media Library path or HTTPS URL.`);
  }
  return {
    id: UUID_PATTERN.test(String(input.id || "")) ? String(input.id) : "",
    label,
    emoji,
    imageUrl,
  };
}

function normaliseMaxSelections(value: unknown, optionCount: number): number {
  const count = Math.max(1, optionCount);
  const requested = Math.floor(Number(value) || 1);
  return Math.max(1, Math.min(count, requested, MAX_OPTIONS));
}

function normaliseSelectedOptionIds(input: PollVoteInput): string[] {
  const supplied = Array.isArray(input.optionIds)
    ? input.optionIds
    : input.optionId
      ? [input.optionId]
      : [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const value of supplied) {
    const id = cleanText(value, 80);
    if (!UUID_PATTERN.test(id)) throw new Error("Choose valid poll answers.");
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  if (!unique.length) throw new Error("Choose at least one poll answer.");
  if (unique.length > MAX_OPTIONS) throw new Error("Too many poll answers were selected.");
  return unique;
}

async function getSql() {
  const { getSql: loadSql } = await import("@/lib/db");
  return loadSql();
}

async function readOptions(pollId: string): Promise<PollOption[]> {
  const sql = await getSql();
  const rows = await sql.query<PollOptionRow>(
    `select o.id,
            o.label,
            o.emoji,
            o.image_url,
            o.sort_order,
            o.is_user_added,
            count(v.id)::int as votes
       from poll_options o
       left join poll_votes v on v.option_id = o.id
      where o.poll_id = $1
        and o.active = true
      group by o.id, o.label, o.emoji, o.image_url, o.sort_order, o.is_user_added
      order by o.sort_order asc, o.created_at asc`,
    [pollId],
  );
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    emoji: row.emoji || "",
    imageUrl: row.image_url || "",
    sortOrder: Number(row.sort_order),
    isUserAdded: row.is_user_added === true,
    votes: Number(row.votes || 0),
  }));
}

async function selectedOptionIds(pollId: string, hash?: string): Promise<string[]> {
  if (!hash) return [];
  const sql = await getSql();
  const rows = await sql.query<{ option_id: string }>(
    `select v.option_id
       from poll_votes v
       join poll_options o on o.id = v.option_id
      where v.poll_id = $1
        and v.voter_hash = $2
        and o.active = true
      order by v.created_at asc, v.option_id asc`,
    [pollId, hash],
  );
  return rows.map((row) => row.option_id);
}

async function voterDiscordName(pollId: string, hash?: string): Promise<string> {
  if (!hash) return "";
  const sql = await getSql();
  const rows = await sql.query<{ discord_name: string }>(
    `select discord_name
       from poll_voters
      where poll_id = $1 and voter_hash = $2
      limit 1`,
    [pollId, hash],
  );
  return rows[0]?.discord_name || "";
}

async function totalVoters(pollId: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql.query<{ count: number }>(
    `select count(distinct voter_hash)::int as count
       from poll_votes
      where poll_id = $1`,
    [pollId],
  );
  return Number(rows[0]?.count || 0);
}

async function readVoters(pollId: string): Promise<PollVoter[]> {
  const sql = await getSql();
  const rows = await sql.query<PollVoterRow>(
    `select v.voter_hash,
            coalesce(pv.discord_name, '') as discord_name,
            v.updated_at::text as updated_at,
            v.option_id,
            o.label,
            o.sort_order
       from poll_votes v
       join poll_options o on o.id = v.option_id and o.active = true
       left join poll_voters pv
         on pv.poll_id = v.poll_id and pv.voter_hash = v.voter_hash
      where v.poll_id = $1
      order by v.voter_hash asc, o.sort_order asc, o.created_at asc`,
    [pollId],
  );

  const grouped = new Map<string, PollVoter>();
  for (const row of rows) {
    const current = grouped.get(row.voter_hash) || {
      discordName: row.discord_name || "",
      selectedOptionIds: [],
      selectedLabels: [],
      updatedAt: row.updated_at,
    };
    current.discordName = row.discord_name || current.discordName;
    current.selectedOptionIds.push(row.option_id);
    current.selectedLabels.push(row.label);
    if (row.updated_at > current.updatedAt) current.updatedAt = row.updated_at;
    grouped.set(row.voter_hash, current);
  }

  return [...grouped.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function upsertVoterIdentity(
  pollId: string,
  hash: string,
  discordName: string,
): Promise<void> {
  if (!discordName) return;
  const sql = await getSql();
  await sql.query(
    `insert into poll_voters
       (poll_id, voter_hash, discord_name, created_at, updated_at)
     values ($1, $2, $3, now(), now())
     on conflict (poll_id, voter_hash) do update
       set discord_name = excluded.discord_name,
           updated_at = now()`,
    [pollId, hash, discordName],
  );
}

async function hydratePoll(
  row: PollRow,
  hash?: string,
  includeVoters = false,
): Promise<LeadershipPoll> {
  const [options, selected, voterCount, name, voters] = await Promise.all([
    readOptions(row.id),
    selectedOptionIds(row.id, hash),
    totalVoters(row.id),
    voterDiscordName(row.id, hash),
    includeVoters ? readVoters(row.id) : Promise.resolve([]),
  ]);
  const maxSelections = normaliseMaxSelections(row.max_selections, options.length);
  const safeSelected = selected.slice(0, maxSelections);
  return {
    id: row.id,
    shareCode: row.share_code,
    title: row.title,
    description: row.description || "",
    allowAdditions: row.allow_additions === true,
    isOpen: effectiveOpen(row),
    maxSelections,
    requireDiscordName: row.require_discord_name === true,
    closesAt: row.closes_at || null,
    totalVotes: options.reduce((sum, option) => sum + option.votes, 0),
    totalVoters: voterCount,
    voterDiscordName: name,
    selectedOptionId: safeSelected[0] || null,
    selectedOptionIds: safeSelected,
    options,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    voters,
  };
}

async function publicPollByShareCode(shareCode: string, hash?: string): Promise<PublicPoll | null> {
  const sql = await getSql();
  const rows = await sql.query<PollRow>(
    `select id, share_code, title, description, allow_additions, is_open,
            max_selections, require_discord_name,
            closes_at::text as closes_at,
            created_at::text as created_at, updated_at::text as updated_at
       from polls
      where share_code = $1
      limit 1`,
    [shareCode],
  );
  if (!rows[0]) return null;
  const full = await hydratePoll(rows[0], hash, false);
  const { createdAt: _createdAt, updatedAt: _updatedAt, voters: _voters, ...publicPoll } = full;
  return publicPoll;
}

export const fetchPublicPoll = createServerFn({ method: "GET" })
  .inputValidator((input: PublicPollRequest) => input)
  .handler(async ({ data }): Promise<PublicPoll | null> => {
    const shareCode = cleanShareCode(data.shareCode);
    const hash = data.voterKey ? await voterHash(data.voterKey) : undefined;
    return publicPollByShareCode(shareCode, hash);
  });

export const votePublicPoll = createServerFn({ method: "POST" })
  .inputValidator((input: PollVoteInput) => input)
  .handler(async ({ data }): Promise<PublicPoll> => {
    const shareCode = cleanShareCode(data.shareCode);
    const optionIds = normaliseSelectedOptionIds(data);
    const hash = await voterHash(data.voterKey);
    const sql = await getSql();

    const pollRows = await sql.query<{
      id: string;
      max_selections: number;
      require_discord_name: boolean;
    }>(
      `select id, max_selections, require_discord_name
         from polls
        where share_code = $1
          and is_open = true
          and (closes_at is null or closes_at > now())
        limit 1`,
      [shareCode],
    );
    const pollId = pollRows[0]?.id;
    if (!pollId) throw new Error("This poll is closed or no longer available.");

    const discordName = normaliseDiscordName(
      data.discordName,
      pollRows[0].require_discord_name === true,
    );
    const maxSelections = Math.max(
      1,
      Math.min(MAX_OPTIONS, Number(pollRows[0].max_selections) || 1),
    );
    if (optionIds.length > maxSelections) {
      throw new Error(`Choose up to ${maxSelections} answer${maxSelections === 1 ? "" : "s"}.`);
    }

    const placeholders = optionIds.map((_, index) => `$${index + 2}`).join(", ");
    const validRows = await sql.query<{ id: string }>(
      `select id
         from poll_options
        where poll_id = $1
          and active = true
          and id in (${placeholders})`,
      [pollId, ...optionIds],
    );
    if (validRows.length !== optionIds.length) {
      throw new Error("One or more selected answers are no longer available.");
    }

    await upsertVoterIdentity(pollId, hash, discordName);
    await sql.query(
      `delete from poll_votes
        where poll_id = $1 and voter_hash = $2`,
      [pollId, hash],
    );

    const { randomUUID } = await import("node:crypto");
    const values: unknown[] = [pollId, hash];
    const valueRows = optionIds.map((optionId, index) => {
      const idPosition = index * 2 + 3;
      values.push(randomUUID(), optionId);
      return `($${idPosition}, $1, $${idPosition + 1}, $2, now(), now())`;
    });
    await sql.query(
      `insert into poll_votes (id, poll_id, option_id, voter_hash, created_at, updated_at)
       values ${valueRows.join(", ")}`,
      values,
    );

    const poll = await publicPollByShareCode(shareCode, hash);
    if (!poll) throw new Error("Poll was not found.");
    return poll;
  });

export const addPublicPollOption = createServerFn({ method: "POST" })
  .inputValidator((input: PollAdditionInput) => input)
  .handler(async ({ data }): Promise<PublicPoll> => {
    const shareCode = cleanShareCode(data.shareCode);
    const label = cleanText(data.label, 100);
    const emoji = cleanText(data.emoji, 24);
    if (label.length < 2) throw new Error("Enter an answer with at least 2 characters.");
    const hash = await voterHash(data.voterKey);
    const sql = await getSql();

    const pollRows = await sql.query<{
      id: string;
      max_selections: number;
      require_discord_name: boolean;
    }>(
      `select id, max_selections, require_discord_name
         from polls
        where share_code = $1
          and is_open = true
          and allow_additions = true
          and (closes_at is null or closes_at > now())
        limit 1`,
      [shareCode],
    );
    const pollId = pollRows[0]?.id;
    if (!pollId) throw new Error("This poll is closed or is not accepting new answers.");

    const discordName = normaliseDiscordName(
      data.discordName,
      pollRows[0].require_discord_name === true,
    );
    const existing = await sql.query<{ id: string }>(
      `select id
         from poll_options
        where poll_id = $1
          and active = true
          and lower(label) = lower($2)
        limit 1`,
      [pollId, label],
    );

    let optionId = existing[0]?.id || "";
    const currentSelections = await selectedOptionIds(pollId, hash);
    const alreadySelected = Boolean(optionId && currentSelections.includes(optionId));
    const maxSelections = Math.max(
      1,
      Math.min(MAX_OPTIONS, Number(pollRows[0].max_selections) || 1),
    );
    if (!alreadySelected && currentSelections.length >= maxSelections) {
      throw new Error(
        `You already selected the maximum of ${maxSelections} answer${maxSelections === 1 ? "" : "s"}. Deselect one and update your vote first.`,
      );
    }

    if (!optionId) {
      const [additionCount, optionCount] = await Promise.all([
        sql.query<{ count: number }>(
          `select count(*)::int as count
             from poll_options
            where poll_id = $1
              and active = true
              and is_user_added = true
              and added_by_hash = $2`,
          [pollId, hash],
        ),
        sql.query<{ count: number }>(
          `select count(*)::int as count
             from poll_options
            where poll_id = $1 and active = true`,
          [pollId],
        ),
      ]);
      if (Number(additionCount[0]?.count || 0) >= MAX_USER_ADDITIONS) {
        throw new Error(`You can add up to ${MAX_USER_ADDITIONS} answers to this poll.`);
      }
      if (Number(optionCount[0]?.count || 0) >= MAX_OPTIONS) {
        throw new Error("This poll has reached its answer limit.");
      }

      const orderRows = await sql.query<{ next_order: number }>(
        `select coalesce(max(sort_order), -1)::int + 1 as next_order
           from poll_options
          where poll_id = $1`,
        [pollId],
      );
      const { randomUUID } = await import("node:crypto");
      optionId = randomUUID();
      try {
        await sql.query(
          `insert into poll_options
             (id, poll_id, label, emoji, image_url, sort_order, is_user_added,
              added_by_hash, active, created_at, updated_at)
           values ($1, $2, $3, $4, '', $5, true, $6, true, now(), now())`,
          [optionId, pollId, label, emoji, Number(orderRows[0]?.next_order || 0), hash],
        );
      } catch (error) {
        const duplicate = await sql.query<{ id: string }>(
          `select id
             from poll_options
            where poll_id = $1
              and active = true
              and lower(label) = lower($2)
            limit 1`,
          [pollId, label],
        );
        if (!duplicate[0]) throw error;
        optionId = duplicate[0].id;
      }
    }

    await upsertVoterIdentity(pollId, hash, discordName);
    const { randomUUID } = await import("node:crypto");
    await sql.query(
      `insert into poll_votes (id, poll_id, option_id, voter_hash, created_at, updated_at)
       values ($1, $2, $3, $4, now(), now())
       on conflict (poll_id, voter_hash, option_id) do update
       set updated_at = now()`,
      [randomUUID(), pollId, optionId, hash],
    );

    const poll = await publicPollByShareCode(shareCode, hash);
    if (!poll) throw new Error("Poll was not found.");
    return poll;
  });

export const fetchLeadershipPolls = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipPoll[]> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    const sql = await getSql();
    const rows = await sql.query<PollRow>(
      `select id, share_code, title, description, allow_additions, is_open,
              max_selections, require_discord_name,
              closes_at::text as closes_at,
              created_at::text as created_at, updated_at::text as updated_at
         from polls
        order by updated_at desc
        limit $1`,
      [MAX_POLLS],
    );
    const polls: LeadershipPoll[] = [];
    for (const row of rows) polls.push(await hydratePoll(row, undefined, true));
    return polls;
  },
);

export const updateLeadershipPollAccess = createServerFn({ method: "POST" })
  .inputValidator((input: PollAccessSettingsInput) => input)
  .handler(async ({ data }): Promise<LeadershipPoll> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    const pollId = cleanText(data.pollId, 80);
    if (!UUID_PATTERN.test(pollId)) throw new Error("Select a saved poll first.");
    const closesAt = normaliseClosesAt(data.closesAt);
    const sql = await getSql();
    const updated = await sql.query<{ id: string }>(
      `update polls
          set require_discord_name = $2,
              closes_at = $3,
              updated_at = now()
        where id = $1
      returning id`,
      [pollId, data.requireDiscordName === true, closesAt],
    );
    if (!updated[0]) throw new Error("Poll was not found.");
    const rows = await sql.query<PollRow>(
      `select id, share_code, title, description, allow_additions, is_open,
              max_selections, require_discord_name,
              closes_at::text as closes_at,
              created_at::text as created_at, updated_at::text as updated_at
         from polls
        where id = $1
        limit 1`,
      [pollId],
    );
    if (!rows[0]) throw new Error("Poll could not be reloaded after saving.");
    return hydratePoll(rows[0], undefined, true);
  });

export const saveLeadershipPoll = createServerFn({ method: "POST" })
  .inputValidator((input: SaveLeadershipPollInput) => input)
  .handler(async ({ data }): Promise<LeadershipPoll> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const profile = await requireLocalLeadership();
    const title = cleanText(data.title, 160);
    const description = cleanText(data.description, 4000);
    if (title.length < 3) throw new Error("Poll title must be at least 3 characters.");

    const supplied = Array.isArray(data.options) ? data.options : [];
    if (supplied.length < 2) throw new Error("Add at least two poll answers.");
    if (supplied.length > MAX_OPTIONS) {
      throw new Error(`A poll can contain up to ${MAX_OPTIONS} answers.`);
    }
    const options = supplied.map(normaliseOption);
    const maxSelections = normaliseMaxSelections(data.maxSelections, options.length);
    const labels = new Set<string>();
    for (const option of options) {
      const key = option.label.toLocaleLowerCase();
      if (labels.has(key)) throw new Error(`“${option.label}” is listed more than once.`);
      labels.add(key);
    }

    const sql = await getSql();
    const { randomUUID } = await import("node:crypto");
    const requestedId = cleanText(data.id, 80);
    let pollId = "";

    if (requestedId && UUID_PATTERN.test(requestedId)) {
      const current = await sql.query<{
        id: string;
        require_discord_name: boolean;
        closes_at: string | null;
      }>(
        `select id, require_discord_name, closes_at::text as closes_at
           from polls
          where id = $1
          limit 1`,
        [requestedId],
      );
      if (!current[0]) throw new Error("Poll was not found.");
      pollId = current[0].id;
      const requireDiscordName =
        data.requireDiscordName === undefined
          ? current[0].require_discord_name === true
          : data.requireDiscordName === true;
      const closesAt =
        data.closesAt === undefined
          ? current[0].closes_at
          : normaliseClosesAt(data.closesAt);
      await sql.query(
        `update polls
            set title = $2,
                description = $3,
                allow_additions = $4,
                is_open = $5,
                max_selections = $6,
                require_discord_name = $7,
                closes_at = $8,
                updated_at = now()
          where id = $1`,
        [
          pollId,
          title,
          description,
          data.allowAdditions === true,
          data.isOpen !== false,
          maxSelections,
          requireDiscordName,
          closesAt,
        ],
      );
    } else {
      pollId = randomUUID();
      const shareCode = randomUUID().replaceAll("-", "").slice(0, 18).toLowerCase();
      const closesAt = data.closesAt === undefined ? null : normaliseClosesAt(data.closesAt);
      await sql.query(
        `insert into polls
           (id, share_code, title, description, allow_additions, is_open,
            max_selections, require_discord_name, closes_at,
            created_at, updated_at, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now(), $10)`,
        [
          pollId,
          shareCode,
          title,
          description,
          data.allowAdditions === true,
          data.isOpen !== false,
          maxSelections,
          data.requireDiscordName === true,
          closesAt,
          profile.id,
        ],
      );
    }

    const existingRows = await sql.query<{ id: string; is_user_added: boolean }>(
      `select id, is_user_added from poll_options where poll_id = $1`,
      [pollId],
    );
    const existing = new Map(existingRows.map((row) => [row.id, row]));

    await sql.query(
      `update poll_options
          set active = false, updated_at = now()
        where poll_id = $1`,
      [pollId],
    );

    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const current = option.id ? existing.get(option.id) : undefined;
      if (current) {
        await sql.query(
          `update poll_options
              set label = $3,
                  emoji = $4,
                  image_url = $5,
                  sort_order = $6,
                  active = true,
                  updated_at = now()
            where id = $1 and poll_id = $2`,
          [option.id, pollId, option.label, option.emoji, option.imageUrl, index],
        );
      } else {
        await sql.query(
          `insert into poll_options
             (id, poll_id, label, emoji, image_url, sort_order, is_user_added,
              active, created_at, updated_at)
           values ($1, $2, $3, $4, $5, $6, false, true, now(), now())`,
          [randomUUID(), pollId, option.label, option.emoji, option.imageUrl, index],
        );
      }
    }

    await sql.query(
      `delete from poll_votes v
        where v.poll_id = $1
          and not exists (
            select 1 from poll_options o
             where o.id = v.option_id and o.active = true
          )`,
      [pollId],
    );

    await sql.query(
      `delete from poll_votes v
        where v.id in (
          select id
            from (
              select id,
                     row_number() over (
                       partition by poll_id, voter_hash
                       order by updated_at desc, created_at desc, id desc
                     ) as selection_number
                from poll_votes
               where poll_id = $1
            ) ranked
           where ranked.selection_number > $2
        )`,
      [pollId, maxSelections],
    );

    await sql.query(`update polls set updated_at = now() where id = $1`, [pollId]);
    const rows = await sql.query<PollRow>(
      `select id, share_code, title, description, allow_additions, is_open,
              max_selections, require_discord_name,
              closes_at::text as closes_at,
              created_at::text as created_at, updated_at::text as updated_at
         from polls
        where id = $1
        limit 1`,
      [pollId],
    );
    if (!rows[0]) throw new Error("Poll could not be reloaded after saving.");
    return hydratePoll(rows[0], undefined, true);
  });

export const deleteLeadershipPoll = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<boolean> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    const id = cleanText(data.id, 80);
    if (!UUID_PATTERN.test(id)) throw new Error("Invalid poll id.");
    const sql = await getSql();
    await sql.query(`delete from polls where id = $1`, [id]);
    return true;
  });
