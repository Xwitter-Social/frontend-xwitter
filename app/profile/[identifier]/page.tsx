'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

import { FollowButton } from '@/components/follow-button';
import { ProfileUsersList } from '@/components/profile-users-list';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';
import {
  useProfile,
  useProfileFollowers,
  useProfileFollowing,
  useProfilePosts,
  useProfileReposts,
} from '@/hooks/use-profile';
import {
  deletePost,
  deleteRepost,
  likePost,
  repostPost,
  unlikePost,
} from '@/lib/post-client';
import { startConversation } from '@/lib/conversation-client';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import type { RepostTimelinePost, TimelinePost } from '@/types/post';
import type { RelationshipUser } from '@/types/profile';

type RelationListType = 'followers' | 'following' | null;

type PostsTab = 'posts' | 'reposts';

const numberFormatter = new Intl.NumberFormat('pt-BR');

function formatJoinDate(date: string | null | undefined): string {
  if (!date) {
    return 'Data não disponível';
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Data não disponível';
  }

  return parsedDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function renderPostsSkeleton() {
  return (
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
  );
}

function renderPostsSection(
  posts: TimelinePost[],
  isLoading: boolean,
  error: Error | undefined,
  emptyMessage: string,
  options: {
    onDelete?: (postId: string) => Promise<void> | void;
    onToggleLike?: (post: TimelinePost) => Promise<void>;
    onToggleRepost?: (post: TimelinePost) => Promise<void>;
  } = {},
) {
  const { onDelete, onToggleLike, onToggleRepost } = options;

  if (isLoading) {
    return renderPostsSkeleton();
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={onDelete}
          onToggleLike={onToggleLike}
          onToggleRepost={onToggleRepost}
        />
      ))}
    </div>
  );
}

function renderRepostsSection(
  reposts: RepostTimelinePost[],
  isLoading: boolean,
  error: Error | undefined,
  options: {
    onDelete?: (postId: string) => Promise<void> | void;
    onToggleLike?: (post: TimelinePost) => Promise<void>;
    onToggleRepost?: (post: TimelinePost) => Promise<void>;
  } = {},
) {
  const { onDelete, onToggleLike, onToggleRepost } = options;

  if (isLoading) {
    return renderPostsSkeleton();
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  if (reposts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        Nenhum repost encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reposts.map((repost) => (
        <div key={`${repost.id}-${repost.repostedAt}`} className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Repostado {formatRelativeTime(repost.repostedAt)}</span>
            <span aria-hidden>·</span>
            <Link href={`/post/${repost.id}`} className="hover:underline">
              Ver detalhes
            </Link>
          </div>
          <PostCard
            post={repost}
            onDelete={onDelete}
            onToggleLike={onToggleLike}
            onToggleRepost={onToggleRepost}
          />
        </div>
      ))}
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ identifier: string }>();
  const identifier = params?.identifier ?? '';
  const router = useRouter();

  const { user: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<PostsTab>('posts');
  const [activeList, setActiveList] = useState<RelationListType>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    mutate: mutateProfile,
  } = useProfile(identifier);

  const profileId = profile?.profile.id ?? null;

  const {
    posts,
    isLoading: isPostsLoading,
    error: postsError,
    mutate: mutatePosts,
  } = useProfilePosts(profileId, { enabled: Boolean(profileId) });

  const {
    reposts,
    isLoading: isRepostsLoading,
    error: repostsError,
    mutate: mutateReposts,
  } = useProfileReposts(profileId, { enabled: Boolean(profileId) });

  const {
    followers,
    isLoading: isFollowersLoading,
    mutate: mutateFollowers,
  } = useProfileFollowers(profileId, {
    enabled: activeList === 'followers' && Boolean(profileId),
  });

  const {
    following,
    isLoading: isFollowingLoading,
    mutate: mutateFollowing,
  } = useProfileFollowing(profileId, {
    enabled: activeList === 'following' && Boolean(profileId),
  });

  const isCurrentUserProfile =
    profile?.viewerRelationship.isCurrentUser ?? false;
  const isFollowingProfile = profile?.viewerRelationship.isFollowing ?? false;

  const handleStartConversation = async () => {
    if (!profileId || isStartingConversation) {
      return;
    }

    setIsStartingConversation(true);

    try {
      const conversationId = await startConversation({
        recipientId: profileId,
      });

      router.push(`/messages/${conversationId}`);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Não foi possível iniciar a conversa.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleRelationFollowToggle = async (
    userId: string,
    isUserFollowing: boolean,
  ) => {
    const updateOperation = (users?: RelationshipUser[]) =>
      users?.map((user) =>
        user.id === userId ? { ...user, isFollowing: isUserFollowing } : user,
      ) ?? users;

    if (activeList === 'followers') {
      await mutateFollowers(updateOperation, { revalidate: false });
      void mutateFollowers();
    } else if (activeList === 'following') {
      await mutateFollowing(updateOperation, { revalidate: false });
      void mutateFollowing();
    }

    if (isCurrentUserProfile) {
      const delta = isUserFollowing ? 1 : -1;

      await mutateProfile(
        (currentProfile) => {
          if (!currentProfile) {
            return currentProfile;
          }

          const nextFollowing = Math.max(
            0,
            currentProfile.stats.following + delta,
          );

          return {
            ...currentProfile,
            stats: {
              ...currentProfile.stats,
              following: nextFollowing,
            },
          };
        },
        { revalidate: false },
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const message = await deletePost(postId);

      await mutatePosts(
        (currentPosts) =>
          currentPosts?.filter((post) => post.id !== postId) ?? currentPosts,
        { revalidate: false },
      );

      await mutateReposts(
        (currentReposts) =>
          currentReposts?.filter((repost) => repost.id !== postId) ??
          currentReposts,
        { revalidate: false },
      );

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

  const handleToggleLike = async (targetPost: TimelinePost) => {
    try {
      if (targetPost.isLiked) {
        await unlikePost(targetPost.id);
        await mutatePosts(
          (currentPosts) =>
            currentPosts?.map((post) =>
              post.id === targetPost.id
                ? {
                    ...post,
                    isLiked: false,
                    likeCount: Math.max(0, post.likeCount - 1),
                  }
                : post,
            ) ?? currentPosts,
          { revalidate: false },
        );
        await mutateReposts(
          (currentReposts) =>
            currentReposts?.map((repost) =>
              repost.id === targetPost.id
                ? {
                    ...repost,
                    isLiked: false,
                    likeCount: Math.max(0, repost.likeCount - 1),
                  }
                : repost,
            ) ?? currentReposts,
          { revalidate: false },
        );
      } else {
        await likePost(targetPost.id);
        await mutatePosts(
          (currentPosts) =>
            currentPosts?.map((post) =>
              post.id === targetPost.id
                ? { ...post, isLiked: true, likeCount: post.likeCount + 1 }
                : post,
            ) ?? currentPosts,
          { revalidate: false },
        );
        await mutateReposts(
          (currentReposts) =>
            currentReposts?.map((repost) =>
              repost.id === targetPost.id
                ? {
                    ...repost,
                    isLiked: true,
                    likeCount: repost.likeCount + 1,
                  }
                : repost,
            ) ?? currentReposts,
          { revalidate: false },
        );
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

        await mutatePosts(
          (currentPosts) =>
            currentPosts?.map((post) =>
              post.id === targetPost.id
                ? {
                    ...post,
                    isReposted: false,
                    repostId: null,
                    repostCount: Math.max(0, post.repostCount - 1),
                  }
                : post,
            ) ?? currentPosts,
          { revalidate: false },
        );

        await mutateReposts(
          (currentReposts) => {
            if (!currentReposts) {
              return currentReposts;
            }

            if (isCurrentUserProfile) {
              return currentReposts.filter(
                (repost) => repost.repostId !== targetPost.repostId,
              );
            }

            return currentReposts.map((repost) =>
              repost.id === targetPost.id
                ? {
                    ...repost,
                    isReposted: false,
                    repostId: null,
                    repostCount: Math.max(0, repost.repostCount - 1),
                  }
                : repost,
            );
          },
          { revalidate: false },
        );

        toast({ description: 'Repost removido.' });
      } else {
        const createdRepost = await repostPost(targetPost.id);

        await mutatePosts(
          (currentPosts) =>
            currentPosts?.map((post) =>
              post.id === targetPost.id
                ? {
                    ...post,
                    isReposted: true,
                    repostId: createdRepost.id,
                    repostCount: post.repostCount + 1,
                  }
                : post,
            ) ?? currentPosts,
          { revalidate: false },
        );

        await mutateReposts();

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

  const profileStats = useMemo(() => {
    if (!profile) {
      return { followers: '0', following: '0' };
    }

    return {
      followers: numberFormatter.format(profile.stats.followers),
      following: numberFormatter.format(profile.stats.following),
    };
  }, [profile]);

  const profileJoinDate = useMemo(
    () => formatJoinDate(profile?.profile.createdAt),
    [profile?.profile.createdAt],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={currentUser ?? undefined} />

      <div className="md:ml-64 pb-16 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <h1 className="text-xl font-bold text-primary">
              {profile?.profile.name ?? 'Perfil'}
            </h1>
            {profile ? (
              <p className="text-sm text-muted-foreground">
                @{profile.profile.username}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
          {isProfileLoading ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            </div>
          ) : profileError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {profileError.message}
            </div>
          ) : profile ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 text-xl">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile.profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {profile.profile.name}
                      </h2>
                      <p className="text-muted-foreground">
                        @{profile.profile.username}
                      </p>
                    </div>
                    {profile.profile.bio ? (
                      <p className="max-w-xl text-pretty text-sm text-foreground/80">
                        {profile.profile.bio}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>Entrou em {profileJoinDate}</span>
                    </div>
                  </div>
                </div>

                {!isCurrentUserProfile ? (
                  <div className="flex flex-col gap-2 md:flex-row md:self-start">
                    <Button
                      variant="outline"
                      onClick={() => void handleStartConversation()}
                      disabled={isStartingConversation || !profileId}
                    >
                      {isStartingConversation ? 'Abrindo…' : 'Mensagem'}
                    </Button>
                    <FollowButton
                      userId={profile.profile.id}
                      isFollowing={isFollowingProfile}
                      className="md:self-start"
                      onToggle={() => {
                        void mutateProfile();

                        if (activeList === 'followers') {
                          void mutateFollowers();
                        }

                        if (activeList === 'following') {
                          void mutateFollowing();
                        }
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="flex items-center gap-2 hover:text-primary"
                  onClick={() => setActiveList('followers')}
                  disabled={!profileId}
                >
                  <span className="font-semibold text-foreground">
                    {profileStats.followers}
                  </span>
                  Seguidores
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 hover:text-primary"
                  onClick={() => setActiveList('following')}
                  disabled={!profileId}
                >
                  <span className="font-semibold text-foreground">
                    {profileStats.following}
                  </span>
                  Seguindo
                </button>
              </div>
            </div>
          ) : null}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PostsTab)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="reposts">Reposts</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-6 space-y-4">
              {renderPostsSection(
                posts,
                isPostsLoading,
                postsError as Error | undefined,
                isCurrentUserProfile
                  ? 'Você ainda não publicou nada. Compartilhe seus pensamentos!'
                  : 'Este usuário ainda não publicou nada.',
                {
                  onDelete: handleDeletePost,
                  onToggleLike: handleToggleLike,
                  onToggleRepost: handleToggleRepost,
                },
              )}
            </TabsContent>
            <TabsContent value="reposts" className="mt-6 space-y-4">
              {renderRepostsSection(
                reposts,
                isRepostsLoading,
                repostsError as Error | undefined,
                {
                  onDelete: handleDeletePost,
                  onToggleLike: handleToggleLike,
                  onToggleRepost: handleToggleRepost,
                },
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MobileNavigation />

      <ProfileUsersList
        title="Seguidores"
        users={followers}
        isOpen={activeList === 'followers'}
        isLoading={isFollowersLoading}
        onClose={() => setActiveList(null)}
        onToggleFollow={(userId, isUserFollowing) =>
          void handleRelationFollowToggle(userId, isUserFollowing)
        }
      />

      <ProfileUsersList
        title="Seguindo"
        users={following}
        isOpen={activeList === 'following'}
        isLoading={isFollowingLoading}
        onClose={() => setActiveList(null)}
        onToggleFollow={(userId, isUserFollowing) =>
          void handleRelationFollowToggle(userId, isUserFollowing)
        }
      />
    </div>
  );
}
