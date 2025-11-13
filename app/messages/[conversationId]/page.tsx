'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  MoreVertical,
  Send,
} from 'lucide-react';

import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConversationMessages } from '@/hooks/use-conversation-messages';
import { useConversations } from '@/hooks/use-conversations';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';
import { sendConversationMessage } from '@/lib/conversation-client';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const {
    conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    isUnauthorized: isConversationsUnauthorized,
    mutate: mutateConversations,
  } = useConversations();

  const rawConversationId = params?.conversationId;
  const conversationId = Array.isArray(rawConversationId)
    ? rawConversationId[0]
    : (rawConversationId ?? '');

  const {
    messages,
    isLoading: isLoadingMessages,
    error: messagesError,
    isUnauthorized: isMessagesUnauthorized,
    mutate: mutateMessages,
  } = useConversationMessages(conversationId, {
    enabled: Boolean(conversationId),
    refreshIntervalMs: 30000,
  });

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesLengthRef = useRef(0);
  const lastConversationIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
  }, []);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    if (lastConversationIdRef.current !== conversationId) {
      lastConversationIdRef.current = conversationId;
      previousMessagesLengthRef.current = 0;
    }

    const previousLength = previousMessagesLengthRef.current;
    const currentLength = messages.length;

    if (currentLength === 0) {
      previousMessagesLengthRef.current = currentLength;
      return;
    }

    const behavior = previousLength === 0 ? 'auto' : 'smooth';
    scrollToBottom(behavior);
    previousMessagesLengthRef.current = currentLength;
  }, [conversationId, messages, scrollToBottom]);

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId),
    [conversations, conversationId],
  );

  const participant = conversation?.participant;

  const isUnauthorized = isConversationsUnauthorized || isMessagesUnauthorized;

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || isSending || !conversationId) {
      return;
    }

    setIsSending(true);

    try {
      const { createdMessage } = await sendConversationMessage(
        conversationId,
        content,
      );

      setNewMessage('');
      scrollToBottom('smooth');

      await mutateMessages(
        (currentMessages) => {
          if (!currentMessages) {
            return [createdMessage];
          }

          return [...currentMessages, createdMessage];
        },
        { revalidate: false },
      );

      await mutateMessages();
      await mutateConversations();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível enviar a mensagem.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const renderMessages = () => {
    if (isUnauthorized) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Sessão expirada. Faça login novamente para acessar suas mensagens.
        </div>
      );
    }

    if (messagesError) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {messagesError.message}
        </div>
      );
    }

    if (isLoadingMessages) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`message-skeleton-${index}`} className="flex gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!messages.length) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-60" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Comece a conversa
          </h3>
          <p className="text-sm">
            Envie uma mensagem para{' '}
            {participant?.name ?? 'o outro participante'}.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {messages.map((message) => {
          const isFromCurrentUser = user?.id === message.author.id;
          const alignmentClass = isFromCurrentUser
            ? 'justify-end'
            : 'justify-start';
          const bubbleClass = isFromCurrentUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground';
          const timestampClass = isFromCurrentUser
            ? 'text-primary-foreground/70'
            : 'text-muted-foreground/70';

          return (
            <div key={message.id} className={`flex ${alignmentClass}`}>
              <div className="flex max-w-[80%] items-end gap-2">
                {!isFromCurrentUser ? (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(participant?.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleClass}`}
                >
                  <p className="whitespace-pre-wrap break-words break-all leading-relaxed">
                    {message.content}
                  </p>
                  <p className={`mt-1 text-xs ${timestampClass}`}>
                    {formatRelativeTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div
          ref={messagesEndRef}
          className="md:h-20"
          style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}
        />
      </div>
    );
  };

  const renderHeader = () => {
    if (isUnauthorized) {
      return null;
    }

    if (isLoadingConversations && !conversation) {
      return (
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div>
              <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      );
    }

    if (!conversation || !participant) {
      return null;
    }

    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push('/messages')}
            aria-label="Voltar para mensagens"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Link
            href={`/profile/${participant.username}`}
            className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
          >
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(participant.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <h1 className="font-semibold text-foreground">
                {participant.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                @{participant.username}
              </p>
            </div>
          </Link>
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  const renderComposer = () => {
    if (isUnauthorized) {
      return null;
    }

    if (!conversationId || !conversation) {
      return null;
    }

    return (
      <div
        className={cn(
          'sticky z-30 border-t border-border bg-background backdrop-blur-md',
          'bottom-[calc(env(safe-area-inset-bottom,_0px)+4rem)]',
          'md:bottom-[env(safe-area-inset-bottom,_0px)]',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-2xl items-end gap-3 px-4 py-4">
          <Textarea
            placeholder="Escreva sua mensagem..."
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={(event) => handleComposerKeyDown(event)}
            maxLength={500}
            rows={1}
          />
          <Button
            onClick={() => handleSendMessage()}
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="h-10 w-10 shrink-0"
            aria-label="Enviar mensagem"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3 text-right text-xs text-muted-foreground">
          {newMessage.length}/500 • Enter para enviar
        </div>
      </div>
    );
  };

  const renderBody = () => {
    if (isUnauthorized) {
      return (
        <div
          className={cn(
            'flex flex-1 items-center justify-center px-4 py-12',
            'pb-[calc(env(safe-area-inset-bottom,_0px)+7rem)]',
            'md:pb-24',
          )}
        >
          <div className="max-w-sm text-center text-sm text-muted-foreground">
            Sessão expirada. Faça login novamente para continuar.
          </div>
        </div>
      );
    }

    if (conversationsError) {
      return (
        <div
          className={cn(
            'flex flex-1 items-center justify-center px-4 py-12',
            'pb-[calc(env(safe-area-inset-bottom,_0px)+7rem)]',
            'md:pb-24',
          )}
        >
          <div className="max-w-sm text-center text-sm text-destructive">
            {conversationsError.message}
          </div>
        </div>
      );
    }

    if (!conversation && !isLoadingConversations) {
      return (
        <div
          className={cn(
            'flex flex-1 items-center justify-center px-4 py-12',
            'pb-[calc(env(safe-area-inset-bottom,_0px)+7rem)]',
            'md:pb-24',
          )}
        >
          <div className="max-w-sm text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Conversa não encontrada
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Talvez você não tenha acesso ou ela tenha sido removida.
            </p>
            <Button onClick={() => router.push('/messages')}>
              Voltar para mensagens
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex-1 overflow-y-auto',
          'pb-[calc(env(safe-area-inset-bottom,_0px)+7rem)]',
          'md:pb-28',
        )}
      >
        <div className="mx-auto max-w-2xl px-4 py-6">{renderMessages()}</div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation user={user ?? undefined} />

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          {renderHeader()}
        </header>

        {renderBody()}

        {renderComposer()}
      </div>

      <MobileNavigation />
    </div>
  );
}
