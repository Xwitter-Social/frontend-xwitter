import type { User } from '@/types/user';

export interface ConversationParticipant {
  id: string;
  username: string;
  name: string;
}

export interface ConversationMessage {
  id: string;
  content: string;
  createdAt: string;
  author: ConversationParticipant;
}

export interface ConversationSummary {
  id: string;
  updatedAt: string;
  participant: ConversationParticipant;
  lastMessage: ConversationMessage | null;
}

export interface ConversationDetails {
  id: string;
  participants: ConversationParticipant[];
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
}

export interface ConversationMessagesResponse {
  messages: ConversationMessage[];
}

export interface ConversationCreatedMessageResponse {
  createdMessage: ConversationMessage;
}

export interface StartConversationPayload {
  recipientId: string;
}

export type SearchResultUser = Pick<User, 'id' | 'username' | 'name'>;
