export interface PostAuthor {
  id: string;
  username: string;
  name: string;
}
export interface TimelinePost {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  isLiked: boolean;
  isReposted: boolean;
  repostId: string | null;
  canDelete: boolean;
}

export interface CommentNode {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  replies: CommentNode[];
}

export interface PostDetails extends TimelinePost {
  comments: CommentNode[];
}

export interface RepostTimelinePost extends TimelinePost {
  repostedAt: string;
}
