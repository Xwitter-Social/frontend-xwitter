'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Loader2,
  MessageCircle,
  Search as SearchIcon,
} from 'lucide-react';

import { StartConversationDialog } from '@/components/start-conversation-dialog';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useConversations } from '@/hooks/use-conversations';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';
import { formatRelativeTime, getInitials } from '@/lib/utils';

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const {
    conversations,
    isLoading,
    error,
    isUnauthorized,
    mutate: mutateConversations,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const term = searchQuery.trim().toLowerCase();
    return conversations.filter((conversation) => {
      return (
        conversation.participant.name.toLowerCase().includes(term) ||
        conversation.participant.username.toLowerCase().includes(term)
      );
    });
  }, [conversations, searchQuery]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await mutateConversations();
    } catch {
      toast({
        variant: 'destructive',
        description: 'Não foi possível atualizar suas conversas.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConversationCreated = async (conversationId: string) => {
    await mutateConversations();
    router.push(`/messages/${conversationId}`);
  };

  const renderContent = () => {
    if (isUnauthorized) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Sessão expirada. Faça login novamente para acessar suas mensagens.
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={`conversation-skeleton-${index}`}
              className="rounded-none border-x-0 border-t-0"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredConversations.length === 0) {
      const trimmedQuery = searchQuery.trim();

      return (
        <div className="py-12 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            {trimmedQuery
              ? 'Nenhuma conversa encontrada'
              : 'Você ainda não tem mensagens'}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {trimmedQuery
              ? 'Tente buscar por outro nome ou usuário.'
              : 'Inicie uma conversa para trocar mensagens com alguém.'}
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Nova mensagem
          </Button>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {filteredConversations.map((conversation) => {
          const lastMessage = conversation.lastMessage;
          const isFromCurrentUser =
            lastMessage && user?.id && lastMessage.author.id === user.id;
          const lastMessagePreview = lastMessage
            ? lastMessage.content
            : 'Conversa sem mensagens.';
          const displayTimestamp = lastMessage
            ? formatRelativeTime(lastMessage.createdAt)
            : formatRelativeTime(conversation.updatedAt);

          return (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="rounded-none border-x-0 border-t-0 transition-colors hover:bg-card/60">
                <CardContent className="flex gap-4 p-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(conversation.participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-foreground">
                          {conversation.participant.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          @{conversation.participant.username}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {displayTimestamp}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {isFromCurrentUser ? 'Você: ' : ''}
                      {lastMessagePreview}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user ?? undefined} />

      <div className="pb-16 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Mensagens</h1>
              {conversations.length > 0 ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {conversations.length}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefresh()}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Atualizar'
                )}
              </Button>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Nova mensagem
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-2xl">
          <div className="border-b border-border px-4 py-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="px-4 py-6">{renderContent()}</div>
        </div>
      </div>

      <MobileNavigation />

      <StartConversationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
