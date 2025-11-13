'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { CommentCard } from '@/components/comment-card';
import { ComposeComment } from '@/components/compose-comment';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePostDetails } from '@/hooks/use-post-details';
import { toast } from '@/hooks/use-toast';
import {
  createComment,
  deleteComment,
  deletePost,
  deleteRepost,
  likePost,
  repostPost,
  unlikePost,
} from '@/lib/post-client';
import type {
  CommentNode,
  PostAuthor,
  PostDetails,
  TimelinePost,
} from '@/types/post';

interface PostDetailsClientProps {
  postId: string;
}

function insertComment(
  comments: CommentNode[],
  newComment: CommentNode,
  parentCommentId?: string,
): { comments: CommentNode[]; inserted: boolean } {
  if (!parentCommentId) {
    return {
      comments: [newComment, ...comments],
      inserted: true,
    };
  }

  let inserted = false;

  const updatedComments = comments.map((comment) => {
    if (comment.id === parentCommentId) {
      inserted = true;
      return {
        ...comment,
        replies: [...comment.replies, newComment],
      };
    }

    if (comment.replies.length > 0) {
      const nested = insertComment(
        comment.replies,
        newComment,
        parentCommentId,
      );

      if (nested.inserted) {
        inserted = true;
        return {
          ...comment,
          replies: nested.comments,
        };
      }
    }

    return comment;
  });

  return {
    comments: inserted ? updatedComments : comments,
    inserted,
  };
}

function removeCommentFromTree(
  comments: CommentNode[],
  targetCommentId: string,
): { list: CommentNode[]; removed: boolean } {
  let removed = false;

  const filtered = comments
    .map((comment) => {
      if (comment.id === targetCommentId) {
        removed = true;
        return null;
      }

      if (comment.replies.length > 0) {
        const nested = removeCommentFromTree(comment.replies, targetCommentId);

        if (nested.removed) {
          removed = true;
          return {
            ...comment,
            replies: nested.list,
          };
        }
      }

      return comment;
    })
    .filter((comment): comment is CommentNode => comment !== null);

  return { list: filtered, removed };
}

function countCommentNodes(comment: CommentNode): number {
  return (
    1 +
    comment.replies.reduce(
      (total, reply) => total + countCommentNodes(reply),
      0,
    )
  );
}

type PartialCommentNode = Omit<CommentNode, 'author' | 'replies'> & {
  author?: PostAuthor | null;
  replies?: PartialCommentNode[] | null | undefined;
};

function normalizeCommentNode(
  comment: PartialCommentNode,
  fallbackAuthor: PostAuthor,
): CommentNode {
  const author =
    comment.author && comment.author.id ? comment.author : fallbackAuthor;

  const replies = Array.isArray(comment.replies)
    ? comment.replies.map((reply) =>
        normalizeCommentNode(reply, fallbackAuthor),
      )
    : [];

  return {
    ...comment,
    author,
    replies,
  } as CommentNode;
}

function PostHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onBack}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary">Post</h1>
        </div>
      </div>
    </header>
  );
}

export default function PostDetailsClient({ postId }: PostDetailsClientProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { post, isLoading, error, mutate } = usePostDetails(postId);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/timeline');
  };

  const buildFallbackAuthor = (): PostAuthor => ({
    id: user?.id ?? 'unknown-author',
    name: user?.name ?? user?.username ?? 'Usuário desconhecido',
    username: user?.username ?? 'usuario-desconhecido',
  });

  const hasComments = (post?.comments.length ?? 0) > 0;

  const updatePost = async (updater: (post: PostDetails) => PostDetails) => {
    await mutate((current) => (current ? updater(current) : current), {
      revalidate: false,
    });
  };

  const handleToggleLike = async (targetPost: TimelinePost) => {
    try {
      if (targetPost.isLiked) {
        await unlikePost(targetPost.id);
        await updatePost((current) => ({
          ...current,
          isLiked: false,
          likeCount: Math.max(0, current.likeCount - 1),
        }));
      } else {
        await likePost(targetPost.id);
        await updatePost((current) => ({
          ...current,
          isLiked: true,
          likeCount: current.likeCount + 1,
        }));
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível atualizar a curtida.';
      toast({ variant: 'destructive', description: message });
      throw cause;
    }
  };

  const handleToggleRepost = async (targetPost: TimelinePost) => {
    try {
      if (targetPost.isReposted) {
        if (!targetPost.repostId) {
          throw new Error('Repost não encontrado.');
        }

        await deleteRepost(targetPost.repostId);
        await updatePost((current) => ({
          ...current,
          isReposted: false,
          repostId: null,
          repostCount: Math.max(0, current.repostCount - 1),
        }));
        toast({ description: 'Repost removido.' });
      } else {
        const repost = await repostPost(targetPost.id);
        await updatePost((current) => ({
          ...current,
          isReposted: true,
          repostId: repost.id,
          repostCount: current.repostCount + 1,
        }));
        toast({ description: 'Post repostado.' });
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível atualizar o repost.';
      toast({ variant: 'destructive', description: message });
      throw cause;
    }
  };

  const handleDeletePost = async (postIdToRemove: string) => {
    try {
      const message = await deletePost(postIdToRemove);
      toast({ description: message });
      router.push('/timeline');
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível excluir o post.';
      toast({ variant: 'destructive', description: message });
      throw cause;
    }
  };

  const handleCreateComment = async (content: string) => {
    try {
      const rawComment = (await createComment(postId, {
        content,
      })) as PartialCommentNode;
      const normalizedComment = normalizeCommentNode(
        rawComment,
        buildFallbackAuthor(),
      );

      await updatePost((current) => {
        const result = insertComment(current.comments, normalizedComment);

        return {
          ...current,
          commentCount: current.commentCount + 1,
          comments: result.comments,
        };
      });

      toast({ description: 'Comentário publicado.' });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível publicar o comentário.';
      throw new Error(message);
    }
  };

  const handleReplyToComment = async (parentId: string, content: string) => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    try {
      const rawComment = (await createComment(postId, {
        content: trimmed,
        parentCommentId: parentId,
      })) as PartialCommentNode;
      const normalizedComment = normalizeCommentNode(
        rawComment,
        buildFallbackAuthor(),
      );

      let inserted = false;

      await updatePost((current) => {
        const result = insertComment(
          current.comments,
          normalizedComment,
          parentId,
        );
        inserted = result.inserted;

        return {
          ...current,
          commentCount: current.commentCount + 1,
          comments: result.comments,
        };
      });

      if (!inserted) {
        await mutate();
      }

      toast({ description: 'Resposta publicada.' });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível responder ao comentário.';
      toast({ variant: 'destructive', description: message });
      throw new Error(message);
    }
  };

  const handleDeleteComment = async (comment: CommentNode) => {
    try {
      await deleteComment(comment.id);

      await updatePost((current) => {
        const { list, removed } = removeCommentFromTree(
          current.comments,
          comment.id,
        );

        if (!removed) {
          return current;
        }

        const removedCount = countCommentNodes(comment);

        return {
          ...current,
          commentCount: Math.max(0, current.commentCount - removedCount),
          comments: list,
        };
      });

      toast({ description: 'Comentário excluído.' });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível excluir o comentário.';
      toast({ variant: 'destructive', description: message });
      throw new Error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user ?? undefined} />
        <div className="md:ml-64 pb-16 md:pb-0">
          <PostHeader onBack={handleGoBack} />

          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
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
          </div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (error) {
    const description =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar os detalhes do post.';

    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user ?? undefined} />
        <div className="md:ml-64 pb-16 md:pb-0">
          <PostHeader onBack={handleGoBack} />

          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              {description}
            </div>
          </div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user ?? undefined} />

      <div className="md:ml-64 pb-16 md:pb-0">
        <PostHeader onBack={handleGoBack} />

        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
          <PostCard
            post={post}
            onToggleLike={(target) => handleToggleLike(target)}
            onToggleRepost={(target) => handleToggleRepost(target)}
            onDelete={post.canDelete ? handleDeletePost : undefined}
          />

          <section className="rounded-xl border border-border bg-card/40 p-6">
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Comentários
            </h2>

            <ComposeComment
              user={user ?? undefined}
              onSubmit={(value) => handleCreateComment(value)}
              placeholder="Compartilhe sua resposta"
              submitLabel="Responder"
            />
          </section>

          <section className="space-y-6">
            {hasComments ? (
              post.comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  onReply={handleReplyToComment}
                  onDelete={handleDeleteComment}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                Nenhum comentário ainda. Seja o primeiro a responder!
              </div>
            )}
          </section>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
