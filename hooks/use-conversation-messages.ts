import useSWR from 'swr';

import { fetchConversationMessages } from '@/lib/conversation-client';
import type { ConversationMessage } from '@/types/conversation';

interface UseConversationMessagesOptions {
  enabled?: boolean;
  refreshIntervalMs?: number;
}

async function conversationMessagesFetcher(
  conversationId: string,
): Promise<ConversationMessage[]> {
  const { messages } = await fetchConversationMessages(conversationId);
  return messages;
}

export function useConversationMessages(
  conversationId: string | null | undefined,
  options: UseConversationMessagesOptions = {},
) {
  const { enabled = true, refreshIntervalMs = 30000 } = options;

  const swrKey =
    conversationId && enabled
      ? `/api/conversations/${conversationId}/messages`
      : null;

  const { data, error, isLoading, mutate } = useSWR<ConversationMessage[]>(
    swrKey,
    () => conversationMessagesFetcher(conversationId!),
    {
      revalidateOnFocus: true,
      refreshInterval: refreshIntervalMs,
      shouldRetryOnError: false,
    },
  );

  return {
    messages: data ?? [],
    isLoading,
    error,
    isUnauthorized: error?.name === 'UnauthorizedError',
    mutate,
  };
}
