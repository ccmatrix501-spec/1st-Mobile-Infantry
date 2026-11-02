export type PollOption = {
  id: string;
  label: string;
  emoji: string;
  imageUrl: string;
  sortOrder: number;
  isUserAdded: boolean;
  votes: number;
};

export type PollVoter = {
  discordName: string;
  selectedOptionIds: string[];
  selectedLabels: string[];
  updatedAt: string;
};

export type PublicPoll = {
  id: string;
  shareCode: string;
  title: string;
  description: string;
  allowAdditions: boolean;
  isOpen: boolean;
  maxSelections: number;
  requireDiscordName: boolean;
  closesAt: string | null;
  totalVotes: number;
  totalVoters: number;
  voterDiscordName: string;
  selectedOptionId: string | null;
  selectedOptionIds: string[];
  options: PollOption[];
};

export type LeadershipPoll = PublicPoll & {
  createdAt: string;
  updatedAt: string;
  voters: PollVoter[];
};

export type PollOptionInput = {
  id?: string;
  label: string;
  emoji?: string;
  imageUrl?: string;
};

export type SaveLeadershipPollInput = {
  id?: string;
  title: string;
  description: string;
  allowAdditions: boolean;
  isOpen: boolean;
  maxSelections?: number;
  requireDiscordName?: boolean;
  closesAt?: string | null;
  options: PollOptionInput[];
};

export type PollAccessSettingsInput = {
  pollId: string;
  requireDiscordName: boolean;
  closesAt?: string | null;
};

export type PublicPollRequest = {
  shareCode: string;
  voterKey?: string;
};

export type PollVoteInput = {
  shareCode: string;
  optionIds?: string[];
  optionId?: string;
  voterKey: string;
  discordName?: string;
};

export type PollAdditionInput = {
  shareCode: string;
  label: string;
  emoji?: string;
  voterKey: string;
  discordName?: string;
};
