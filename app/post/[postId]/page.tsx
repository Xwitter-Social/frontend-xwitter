import { notFound } from 'next/navigation';

import PostDetailsClient from './post-details-client';

interface PostDetailsPageProps {
  params: Promise<{ postId?: string }>;
}

export default async function PostDetailsPage({
  params,
}: PostDetailsPageProps) {
  const { postId } = await params;
  if (!postId) {
    notFound();
  }

  return <PostDetailsClient postId={postId} />;
}
