'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TimelinePost } from '@/types/post';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

interface PostCardProps {
  post: TimelinePost;
  onDelete?: (postId: string) => Promise<void> | void;
  onToggleLike?: (post: TimelinePost) => Promise<void>;
  onToggleRepost?: (post: TimelinePost) => Promise<void>;
}

const MAX_PREVIEW_LENGTH = 280;

export function PostCard({
  post,
  onDelete,
  onToggleLike,
  onToggleRepost,
}: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const router = useRouter();
  const timestampLabel = useMemo(
    () => formatRelativeTime(post.createdAt),
    [post.createdAt],
  );
  const repostTimestampLabel = useMemo(() => {
    if (!post.repostedAt) {
      return null;
    }

    return formatRelativeTime(post.repostedAt);
  }, [post.repostedAt]);

  const isLongContent = post.content.length > MAX_PREVIEW_LENGTH;
  const displayContent =
    isLongContent && !showFullContent
      ? `${post.content.slice(0, MAX_PREVIEW_LENGTH)}...`
      : post.content;

  const handleToggleLike = async () => {
    if (!onToggleLike || isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      await onToggleLike(post);
    } catch (error) {
      console.error('Não foi possível atualizar curtida.', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleRepost = async () => {
    if (!onToggleRepost || isReposting) {
      return;
    }

    setIsReposting(true);
    try {
      await onToggleRepost(post);
    } catch (error) {
      console.error('Não foi possível atualizar repost.', error);
    } finally {
      setIsReposting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      console.error('Não foi possível excluir o post.', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author.name}`,
          text: post.content,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    await navigator.clipboard.writeText(shareUrl);
  };

  const handleNavigateToDetails = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    router.push(`/post/${post.id}`);
  };

  const actionButtons = (
    <div className="flex items-center justify-between pt-2 text-muted-foreground">
      <Link href={`/post/${post.id}`}>
        <Button variant="ghost" size="sm" className="hover:text-primary">
          <MessageCircle className="mr-1 h-4 w-4" />
          {post.commentCount}
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className={cn('hover:text-rose-500', post.isLiked && 'text-rose-500')}
        title={post.isLiked ? 'Remover curtida' : 'Curtir post'}
        disabled={!onToggleLike || isLiking}
        onClick={() => void handleToggleLike()}
        aria-pressed={post.isLiked}
      >
        <Heart
          className="mr-1 h-4 w-4"
          fill={post.isLiked ? 'currentColor' : 'none'}
        />
        {post.likeCount}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'hover:text-emerald-500',
          post.isReposted && 'text-emerald-500',
        )}
        title={post.isReposted ? 'Desfazer repost' : 'Repostar'}
        disabled={!onToggleRepost || isReposting}
        onClick={() => void handleToggleRepost()}
        aria-pressed={post.isReposted}
      >
        <Repeat2 className="mr-1 h-4 w-4" />
        {post.repostCount}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="hover:text-primary"
        onClick={() => void handleShare()}
      >
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card className="transition-colors hover:bg-card/80">
      <CardContent className="pt-6">
        {post.repostedBy ? (
          <div className="flex items-center gap-2 pb-3 pl-14 text-sm text-muted-foreground">
            <Repeat2 className="h-4 w-4" />
            <Link
              href={`/profile/${post.repostedBy.username}`}
              className="font-semibold text-foreground hover:underline"
            >
              {post.repostedBy.name}
            </Link>
            <span>repostou</span>
            {repostTimestampLabel ? (
              <>
                <span aria-hidden>·</span>
                <span>{repostTimestampLabel}</span>
              </>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar className="cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(post.author.name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.username}`}
                className="hover:underline"
              >
                <span className="font-semibold">{post.author.name}</span>
              </Link>
              <span className="text-muted-foreground">
                @{post.author.username}
              </span>
              {timestampLabel && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {timestampLabel}
                  </span>
                </>
              )}
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => void handleShare()}>
                      <Share className="mr-2 h-4 w-4" />
                      Compartilhar
                    </DropdownMenuItem>
                    {post.canDelete && onDelete && (
                      <DropdownMenuItem
                        onClick={() => void handleDelete()}
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div
              className="cursor-pointer space-y-1"
              onClick={(event) => handleNavigateToDetails(event)}
            >
              <p className="text-pretty leading-relaxed text-foreground break-words break-all">
                {displayContent}
              </p>
              {isLongContent && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-primary"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowFullContent((previous) => !previous);
                  }}
                >
                  {showFullContent ? 'Ver menos' : 'Ver mais'}
                </Button>
              )}
            </div>

            {actionButtons}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
