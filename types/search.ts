import type { TimelinePost } from './post';

export type PostSearchResult = TimelinePost;

export interface UserSearchResult {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  isCurrentUser: boolean;
  isFollowing: boolean;
}
