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
  maxSelections: number;
  totalVotes: number;
  selectedOptionId: string | null;
  selectedOptionIds: string[];
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
  maxSelections?: number;
  options: PollOptionInput[];
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
};

export type PollAdditionInput = {
  shareCode: string;
  label: string;
  emoji?: string;
  voterKey: string;
};
