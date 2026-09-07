import { api } from "@/lib/api/axios";

export interface CommunityAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface CommunityPostDTO {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  user: CommunityAuthor;
  game: { id: string; slug: string; title: string } | null;
  _count: { comments: number; likes: number };
}

export interface CommunityCommentDTO {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  postId: string;
  parentCommentId: string | null;
  user: CommunityAuthor;
  _count: { likes: number; replies: number };
  replies?: CommunityCommentDTO[];
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const communityApi = {
  // Posts
  listPosts: (params?: { take?: number; skip?: number; game?: string; author?: string }) =>
    api.get<Envelope<{ posts: CommunityPostDTO[]; total: number; likedPostIds: string[] }>>("/community/posts", {
      params,
    }),
  getPost: (id: string) => api.get<Envelope<{ post: CommunityPostDTO }>>(`/community/posts/${id}`),
  createPost: (data: { content: string; gameId?: string }) =>
    api.post<Envelope<{ post: CommunityPostDTO }>>("/community/posts", data),
  updatePost: (id: string, content: string) =>
    api.patch<Envelope<{ post: CommunityPostDTO }>>(`/community/posts/${id}`, { content }),
  deletePost: (id: string) => api.delete<Envelope<object>>(`/community/posts/${id}`),
  toggleLike: (id: string) => api.post<Envelope<{ liked: boolean; count: number }>>(`/community/posts/${id}/like`),

  // Comments
  listComments: (postId: string, params?: { take?: number; skip?: number }) =>
    api.get<Envelope<{ comments: CommunityCommentDTO[]; total: number }>>(`/community/posts/${postId}/comments`, {
      params,
    }),
  addComment: (postId: string, content: string, parentCommentId?: string) =>
    api.post<Envelope<{ comment: CommunityCommentDTO }>>(`/community/posts/${postId}/comments`, {
      content,
      parentCommentId,
    }),
  updateComment: (commentId: string, content: string) =>
    api.patch<Envelope<{ comment: CommunityCommentDTO }>>(`/community/comments/${commentId}`, { content }),
  deleteComment: (commentId: string) => api.delete<Envelope<object>>(`/community/comments/${commentId}`),
  toggleCommentLike: (commentId: string) =>
    api.post<Envelope<{ liked: boolean; count: number }>>(`/community/comments/${commentId}/like`),
};

export const adminCommunityApi = {
  listPosts: (params?: { take?: number; skip?: number; search?: string; includeDeleted?: boolean }) =>
    api.get<Envelope<{ posts: CommunityPostDTO[]; total: number }>>("/admin/community/posts", { params }),
  deletePost: (id: string, reason?: string) =>
    api.delete<Envelope<object>>(`/admin/community/posts/${id}`, { data: { reason } }),
  restorePost: (id: string) => api.post<Envelope<{ post: CommunityPostDTO }>>(`/admin/community/posts/${id}/restore`),
  deleteComment: (commentId: string) => api.delete<Envelope<object>>(`/admin/community/comments/${commentId}`),
};
