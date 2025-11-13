'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CommentNode } from '@/types/post';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

interface CommentCardProps {
  comment: CommentNode;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete?: (comment: CommentNode) => Promise<void>;
  currentUserId?: string;
  depth?: number;
}

const MAX_REPLY_LENGTH = 280;

export function CommentCard({
  comment,
  onReply,
  onDelete,
  currentUserId,
  depth = 0,
}: CommentCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const author = comment.author ?? {
    id: 'unknown-author',
    name: 'Usuário desconhecido',
    username: 'usuario-desconhecido',
  };
  const timestampLabel = formatRelativeTime(comment.createdAt);
  const canDelete = Boolean(onDelete && currentUserId === author.id);

  const remainingChars = MAX_REPLY_LENGTH - replyContent.length;
  const isReplyOverLimit = remainingChars < 0;

  const handleSubmitReply = async () => {
    const trimmed = replyContent.trim();
    if (!trimmed || isSubmittingReply || isReplyOverLimit) {
      return;
    }

    try {
      setIsSubmittingReply(true);
      await onReply(comment.id, trimmed);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Não foi possível enviar a resposta.', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(comment);
    } catch (error) {
      console.error('Não foi possível excluir o comentário.', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link href={`/profile/${author.username}`}>
          <Avatar
            className={cn('cursor-pointer', depth > 0 ? 'h-8 w-8' : 'h-9 w-9')}
          >
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/profile/${author.username}`}
              className="font-semibold hover:underline"
            >
              {author.name}
            </Link>
            <span className="text-muted-foreground">@{author.username}</span>
            {timestampLabel && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{timestampLabel}</span>
              </>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Excluir
              </Button>
            )}
          </div>

          <p className="text-sm leading-relaxed text-foreground break-words break-all">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-muted-foreground hover:text-primary"
              onClick={() => setIsReplying((previous) => !previous)}
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              {isReplying ? 'Cancelar' : 'Responder'}
            </Button>
          </div>

          {isReplying && (
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                className="min-h-[70px] resize-none border border-border bg-background/60 px-3 py-2 text-sm focus-visible:ring-1"
                maxLength={MAX_REPLY_LENGTH + 20}
                placeholder="Escreva sua resposta..."
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span
                  className={cn(
                    'text-xs',
                    isReplyOverLimit ? 'text-red-500' : 'text-muted-foreground',
                  )}
                >
                  {remainingChars}/{MAX_REPLY_LENGTH}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleSubmitReply()}
                    disabled={
                      !replyContent.trim() ||
                      isSubmittingReply ||
                      isReplyOverLimit
                    }
                  >
                    {isSubmittingReply ? 'Enviando...' : 'Responder'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="space-y-4 border-l border-border/60 pl-6">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
