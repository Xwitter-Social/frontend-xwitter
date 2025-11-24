'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { followUser, unfollowUser } from '@/lib/profile-client';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  disabled?: boolean;
  onToggle?: (isFollowing: boolean) => void;
  size?: 'default' | 'sm';
  className?: string;
}

export function FollowButton({
  userId,
  isFollowing,
  disabled = false,
  onToggle,
  size = 'default',
  className,
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentFollowing, setCurrentFollowing] = useState(isFollowing);

  useEffect(() => {
    setCurrentFollowing(isFollowing);
  }, [isFollowing]);

  const handleToggle = async () => {
    if (disabled || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      if (currentFollowing) {
        const message = await unfollowUser(userId);
        setCurrentFollowing(false);
        onToggle?.(false);
        toast({ description: message });
      } else {
        const message = await followUser(userId);
        setCurrentFollowing(true);
        onToggle?.(true);
        toast({ description: message });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o seguimento.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={currentFollowing ? 'outline' : 'default'}
      disabled={isLoading || disabled}
      onClick={() => void handleToggle()}
      className={cn(
        currentFollowing
          ? 'border-destructive !text-destructive hover:border-destructive hover:bg-destructive/10 hover:!text-destructive focus-visible:ring-destructive/30 dark:hover:bg-destructive/20'
          : undefined,
        className,
      )}
    >
      {isLoading
        ? currentFollowing
          ? 'Atualizando...'
          : 'Atualizando...'
        : currentFollowing
          ? 'Parar de seguir'
          : 'Seguir'}
    </Button>
  );
}
