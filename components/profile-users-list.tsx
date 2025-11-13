'use client';

import Link from 'next/link';
import { X } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FollowButton } from '@/components/follow-button';
import { getInitials } from '@/lib/utils';
import type { RelationshipUser } from '@/types/profile';

interface ProfileUsersListProps {
  title: string;
  users: RelationshipUser[];
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onToggleFollow?: (userId: string, isFollowing: boolean) => void;
}

export function ProfileUsersList({
  title,
  users,
  isOpen,
  isLoading = false,
  onClose,
  onToggleFollow,
}: ProfileUsersListProps) {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal
      onClick={(event) => handleOverlayClick(event)}
    >
      <Card className="relative w-full max-w-lg overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => onClose()}
            aria-label="Fechar lista"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-9 w-24 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-4"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
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
                  </Link>

                  {!user.isCurrentUser ? (
                    <FollowButton
                      userId={user.id}
                      isFollowing={user.isFollowing}
                      size="sm"
                      className="ml-auto"
                      onToggle={(isUserFollowing) =>
                        onToggleFollow?.(user.id, isUserFollowing)
                      }
                    />
                  ) : null}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
