import useSWR from 'swr';

import { fetchConversations } from '@/lib/conversation-client';
import type { ConversationSummary } from '@/types/conversation';

async function conversationsFetcher(): Promise<ConversationSummary[]> {
  const { conversations } = await fetchConversations();
  return conversations;
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR<ConversationSummary[]>(
    '/api/conversations',
    conversationsFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      shouldRetryOnError: false,
    },
  );

  return {
    conversations: data ?? [],
    isLoading,
    error,
    isUnauthorized: error?.name === 'UnauthorizedError',
    mutate,
  };
}
