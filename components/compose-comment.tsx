'use client';

import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types/user';
import { getInitials } from '@/lib/utils';

interface ComposeCommentProps {
  onSubmit: (content: string) => Promise<void>;
  user?: User | null;
  autoFocus?: boolean;
  placeholder?: string;
  submitLabel?: string;
}

const MAX_COMMENT_LENGTH = 280;

export function ComposeComment({
  onSubmit,
  user,
  autoFocus = false,
  placeholder = 'Compartilhe sua resposta',
  submitLabel = 'Responder',
}: ComposeCommentProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedContent = content.trim();
  const remainingCharacters = MAX_COMMENT_LENGTH - content.length;
  const isOverLimit = remainingCharacters < 0;

  const resetForm = () => {
    setContent('');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!trimmedContent || isSubmitting || isOverLimit) {
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
          : 'Não foi possível publicar seu comentário.';
      toast({
        title: 'Erro ao comentar',
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
    <div className="flex gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getInitials(user?.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="min-h-[80px] resize-none border border-border bg-background/60 px-3 py-2 text-sm focus-visible:ring-1"
          maxLength={MAX_COMMENT_LENGTH + 20}
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            {remainingCharacters}/{MAX_COMMENT_LENGTH}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ctrl+Enter para enviar</span>
            <Button
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={!trimmedContent || isSubmitting || isOverLimit}
            >
              {isSubmitting ? 'Enviando...' : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
