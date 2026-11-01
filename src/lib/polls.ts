export type PollOption = {
  id: string;
  label: string;
  emoji: string;
  imageUrl: string;
  sortOrder: number;
  isUserAdded: boolean;
  votes: number;
};

export type PublicPoll = {
  id: string;
  shareCode: string;
  title: string;
  description: string;
  allowAdditions: boolean;
  isOpen: boolean;
  totalVotes: number;
  selectedOptionId: string | null;
  options: PollOption[];
};

export type LeadershipPoll = PublicPoll & {
  createdAt: string;
  updatedAt: string;
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
  options: PollOptionInput[];
};

export type PublicPollRequest = {
  shareCode: string;
  voterKey?: string;
};

export type PollVoteInput = {
  shareCode: string;
  optionId: string;
  voterKey: string;
};

export type PollAdditionInput = {
  shareCode: string;
  label: string;
  emoji?: string;
  voterKey: string;
};
