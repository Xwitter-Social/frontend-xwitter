'use client';

import { useMemo } from 'react';

import { ComposePost } from '@/components/compose-post';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTimeline } from '@/hooks/use-timeline';
import { toast } from '@/hooks/use-toast';
import {
  deletePost,
  deleteRepost,
  likePost,
  repostPost,
  unlikePost,
} from '@/lib/post-client';
import type { TimelinePost } from '@/types/post';

export default function TimelinePage() {
  const { user } = useCurrentUser();
  const { posts, isLoading, error, mutate } = useTimeline();

  const hasPosts = posts.length > 0;

  const emptyStateMessage = useMemo(() => {
    if (isLoading) {
      return 'Carregando timeline...';
    }

    if (error) {
      return error.message;
    }

    return 'Ainda não há posts na sua timeline. Que tal começar a conversa?';
  }, [error, isLoading]);

  const handleCreatePost = async (content: string) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      credentials: 'include',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data &&
        typeof data === 'object' &&
        'message' in data &&
        typeof data.message === 'string'
          ? data.message
          : 'Não foi possível publicar seu post.';
      throw new Error(message);
    }

    toast({
      title: 'Post publicado',
      description: 'Seu post foi compartilhado com sucesso.',
    });

    await mutate();
  };

  const updateTimelinePost = async (
    postId: string,
    updater: (post: TimelinePost) => TimelinePost,
  ) => {
    await mutate(
      (currentPosts) => {
        if (!currentPosts) {
          return currentPosts;
        }

        return currentPosts.map((post) =>
          post.id === postId ? updater(post) : post,
        );
      },
      { revalidate: false },
    );
  };

  const removeTimelinePost = async (postId: string) => {
    await mutate(
      (currentPosts) =>
        currentPosts?.filter((post) => post.id !== postId) ?? currentPosts,
      { revalidate: false },
    );
  };

  const handleToggleLike = async (targetPost: TimelinePost) => {
    try {
      if (targetPost.isLiked) {
        await unlikePost(targetPost.id);
        await updateTimelinePost(targetPost.id, (post) => ({
          ...post,
          isLiked: false,
          likeCount: Math.max(0, post.likeCount - 1),
        }));
      } else {
        await likePost(targetPost.id);
        await updateTimelinePost(targetPost.id, (post) => ({
          ...post,
          isLiked: true,
          likeCount: post.likeCount + 1,
        }));
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar sua curtida.';
      toast({ variant: 'destructive', description: message });
      throw error;
    }
  };

  const handleToggleRepost = async (targetPost: TimelinePost) => {
    try {
      if (targetPost.isReposted) {
        if (!targetPost.repostId) {
          throw new Error('Repost não encontrado para remoção.');
        }

        await deleteRepost(targetPost.repostId);
        await updateTimelinePost(targetPost.id, (post) => ({
          ...post,
          isReposted: false,
          repostId: null,
          repostCount: Math.max(0, post.repostCount - 1),
        }));

        toast({ description: 'Repost removido.' });
      } else {
        const repost = await repostPost(targetPost.id);
        await updateTimelinePost(targetPost.id, (post) => ({
          ...post,
          isReposted: true,
          repostId: repost.id,
          repostCount: post.repostCount + 1,
        }));

        toast({ description: 'Post repostado.' });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o repost.';
      toast({ variant: 'destructive', description: message });
      throw error;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const message = await deletePost(postId);
      await removeTimelinePost(postId);

      toast({ description: message });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o post.';
      toast({ variant: 'destructive', description: message });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user ?? undefined} />

      <div className="md:ml-64 pb-16 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <h1 className="text-xl font-bold text-primary">Timeline</h1>
          </div>
        </header>

        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
          <ComposePost user={user ?? undefined} onSubmit={handleCreatePost} />

          {error && !isLoading && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error.message}
            </div>
          )}

          {isLoading && !hasPosts ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-xl border border-border bg-card/40 p-6"
                >
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-muted" />
                      <div className="h-4 w-2/3 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && hasPosts ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleLike={(timelinePost) =>
                    handleToggleLike(timelinePost)
                  }
                  onToggleRepost={(timelinePost) =>
                    handleToggleRepost(timelinePost)
                  }
                  onDelete={post.canDelete ? handleDeletePost : undefined}
                />
              ))}
            </div>
          ) : null}

          {!isLoading && !hasPosts && !error && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              {emptyStateMessage}
            </div>
          )}
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
