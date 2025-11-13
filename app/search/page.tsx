'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';

import { FollowButton } from '@/components/follow-button';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useSearchPosts, useSearchUsers } from '@/hooks/use-search';
import { toast } from '@/hooks/use-toast';
import {
  deletePost,
  deleteRepost,
  likePost,
  repostPost,
  unlikePost,
} from '@/lib/post-client';
import { getInitials } from '@/lib/utils';
import type { PostSearchResult } from '@/types/search';

type SearchTab = 'posts' | 'people';

export default function SearchPage() {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const {
    posts,
    isLoading: isLoadingPosts,
    error: postsError,
    mutate: mutatePosts,
    hasQuery: hasPostsQuery,
  } = useSearchPosts(debouncedQuery);

  const {
    users,
    isLoading: isLoadingUsers,
    error: usersError,
    mutate: mutateUsers,
    hasQuery: hasUsersQuery,
  } = useSearchUsers(debouncedQuery);

  const hasQuery = useMemo(
    () => hasPostsQuery || hasUsersQuery,
    [hasPostsQuery, hasUsersQuery],
  );

  const handleToggleLike = async (targetPost: PostSearchResult) => {
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
      } else {
        await likePost(targetPost.id);
        await mutatePosts(
          (currentPosts) =>
            currentPosts?.map((post) =>
              post.id === targetPost.id
                ? {
                    ...post,
                    isLiked: true,
                    likeCount: post.likeCount + 1,
                  }
                : post,
            ) ?? currentPosts,
          { revalidate: false },
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar sua curtida.';
      toast({ variant: 'destructive', description: message });
    }
  };

  const handleToggleRepost = async (targetPost: PostSearchResult) => {
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

        toast({ description: 'Repost removido.' });
      } else {
        const repost = await repostPost(targetPost.id);
        await mutatePosts(
          (currentPosts) =>
            currentPosts?.map((post) =>
              post.id === targetPost.id
                ? {
                    ...post,
                    isReposted: true,
                    repostId: repost.id,
                    repostCount: post.repostCount + 1,
                  }
                : post,
            ) ?? currentPosts,
          { revalidate: false },
        );

        toast({ description: 'Post repostado.' });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o repost.';
      toast({ variant: 'destructive', description: message });
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

      toast({ description: message });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o post.';
      toast({ variant: 'destructive', description: message });
    }
  };

  const handleToggleFollow = async (
    targetUserId: string,
    isFollowing: boolean,
  ) => {
    await mutateUsers(
      (currentUsers) =>
        currentUsers?.map((searchUser) =>
          searchUser.id === targetUserId
            ? { ...searchUser, isFollowing }
            : searchUser,
        ) ?? currentUsers,
      { revalidate: false },
    );
  };

  const renderPostsTab = () => {
    if (!hasQuery) {
      return null;
    }

    if (postsError) {
      return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {postsError.message}
        </div>
      );
    }

    if (isLoadingPosts) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`post-skeleton-${index}`}
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

    if (posts.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Nenhum post encontrado para &ldquo;{debouncedQuery.trim()}&rdquo;.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={(currentPost) => handleToggleLike(currentPost)}
            onToggleRepost={(currentPost) => handleToggleRepost(currentPost)}
            onDelete={post.canDelete ? handleDeletePost : undefined}
          />
        ))}
      </div>
    );
  };

  const renderUsersTab = () => {
    if (!hasQuery) {
      return null;
    }

    if (usersError) {
      return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {usersError.message}
        </div>
      );
    }

    if (isLoadingUsers) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={`user-skeleton-${index}`}
              className="border-x-0 border-t-0"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-9 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Nenhuma pessoa encontrada para &ldquo;{debouncedQuery.trim()}&rdquo;.
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {users.map((searchUser) => (
          <Card
            key={searchUser.id}
            className="rounded-none border-x-0 border-t-0 bg-transparent"
          >
            <CardContent className="flex items-center justify-between p-4">
              <Link
                href={`/profile/${searchUser.username}`}
                className="flex flex-1 items-center gap-3"
              >
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(searchUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {searchUser.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{searchUser.username}
                  </p>
                  {searchUser.bio ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {searchUser.bio}
                    </p>
                  ) : null}
                </div>
              </Link>

              {!searchUser.isCurrentUser ? (
                <FollowButton
                  userId={searchUser.id}
                  isFollowing={searchUser.isFollowing}
                  size="sm"
                  onToggle={(isFollowing) =>
                    handleToggleFollow(searchUser.id, isFollowing)
                  }
                />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user ?? undefined} />

      <div className="md:ml-64 pb-16 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Buscar posts e pessoas..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 text-base"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-6">
          {hasQuery ? (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as SearchTab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="people">Pessoas</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0 space-y-4">
                {renderPostsTab()}
              </TabsContent>

              <TabsContent value="people" className="mt-0 space-y-4">
                {renderUsersTab()}
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <Card className="border-dashed border-primary/50 bg-card/30">
                <CardContent className="space-y-4 p-6 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    Encontre novos conteúdos rapidamente
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Digite um termo na busca para descobrir posts recentes e
                    pessoas com interesses semelhantes.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
