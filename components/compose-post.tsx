'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types/user';
import { getInitials } from '@/lib/utils';

interface ComposePostProps {
  onSubmit: (content: string) => Promise<void>;
  user?: User | null;
  placeholder?: string;
}

const MAX_CONTENT_LENGTH = 280;

export function ComposePost({
  onSubmit,
  user,
  placeholder = 'O que está acontecendo?',
}: ComposePostProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingCharacters = MAX_CONTENT_LENGTH - content.length;
  const isOverLimit = remainingCharacters < 0;

  const resetForm = () => {
    setContent('');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isOverLimit || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(trimmedContent);
      resetForm();
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar seu post.';
      toast({
        title: 'Erro ao publicar',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] resize-none border-0 p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
              maxLength={MAX_CONTENT_LENGTH + 20}
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                {remainingCharacters}/{MAX_CONTENT_LENGTH}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Ctrl+Enter para postar</span>
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={!content.trim() || isOverLimit || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? 'Publicando...' : 'Postar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
