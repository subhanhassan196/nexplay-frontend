import { api } from "@/lib/api/axios";

export interface CommunityPostDTO {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
  game: { id: string; slug: string; title: string } | null;
  _count: { comments: number; likes: number };
  comments?: { id: string; content: string; createdAt: string; user: { id: string; username: string } }[];
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const communityApi = {
  listPosts: (params?: { take?: number; game?: string }) =>
    api.get<Envelope<{ posts: CommunityPostDTO[] }>>("/community/posts", { params }),
  getPost: (id: string) => api.get<Envelope<{ post: CommunityPostDTO }>>(`/community/posts/${id}`),
  createPost: (data: { content: string; gameId?: string }) =>
    api.post<Envelope<{ post: CommunityPostDTO }>>("/community/posts", data),
  addComment: (id: string, content: string) =>
    api.post<Envelope<object>>(`/community/posts/${id}/comments`, { content }),
  toggleLike: (id: string) => api.post<Envelope<{ liked: boolean; count: number }>>(`/community/posts/${id}/like`),
};
