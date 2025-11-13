'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, X, Loader2, MessageCircle } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSearchUsers } from '@/hooks/use-search';
import { toast } from '@/hooks/use-toast';
import { startConversation } from '@/lib/conversation-client';
import { getInitials } from '@/lib/utils';
import type { UserSearchResult } from '@/types/search';

interface StartConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated?: (conversationId: string) => void | Promise<void>;
}

export function StartConversationDialog({
  isOpen,
  onClose,
  onConversationCreated,
}: StartConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handle);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
      setSubmittingUserId(null);
    }
  }, [isOpen]);

  const { users, isLoading, error, hasQuery } = useSearchUsers(
    isOpen ? debouncedQuery : '',
  );

  const filteredUsers = useMemo(() => {
    if (!isOpen) {
      return [];
    }

    return users.filter((user) => !user.isCurrentUser);
  }, [isOpen, users]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleStartConversation = async (user: UserSearchResult) => {
    if (submittingUserId) {
      return;
    }

    setSubmittingUserId(user.id);

    try {
      const conversationId = await startConversation({
        recipientId: user.id,
      });

      toast({
        description: `Conversa iniciada com ${user.name}.`,
      });

      await onConversationCreated?.(conversationId);
      onClose();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível iniciar a conversa.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setSubmittingUserId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal
      onClick={(event) => handleOverlayClick(event)}
    >
      <Card className="relative w-full max-w-xl overflow-hidden border-border/80 bg-background/95">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-left">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Iniciar nova conversa
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => onClose()}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="space-y-4 p-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar pessoas pelo nome ou usuário..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </div>
          ) : null}

          {!hasQuery ? (
            <div className="rounded-md border border-dashed border-border/80 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              Use a busca para encontrar alguém e iniciar uma conversa.
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`start-conversation-skeleton-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-4"
                >
                  <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-9 w-28 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {filteredUsers.map((user) => {
                const isSubmitting = submittingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-4"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1 text-left">
                      <p className="font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                      {user.bio ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {user.bio}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={isSubmitting}
                      onClick={() => handleStartConversation(user)}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        'Iniciar conversa'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/80 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
              Nenhuma pessoa encontrada para “{debouncedQuery.trim()}”.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
