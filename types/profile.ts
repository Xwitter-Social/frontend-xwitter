export interface ProfileUser {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  createdAt: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
}

export interface ViewerRelationship {
  isCurrentUser: boolean;
  isFollowing: boolean;
}

export interface UserProfilePayload {
  profile: ProfileUser;
  stats: ProfileStats;
  viewerRelationship: ViewerRelationship;
}

export interface RelationshipUser {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  isCurrentUser: boolean;
  isFollowing: boolean;
}
