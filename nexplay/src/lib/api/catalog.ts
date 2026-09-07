import { api } from "@/lib/api/axios";

export interface CatalogCategoryDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconName: string | null;
  order: number;
  isActive: boolean;
  _count?: { games: number };
}

export interface CatalogGameDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string | null;
  status: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isTrending: boolean;
  averageRating: string | number;
  ratingsCount: number;
  activePlayers: number;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface Paginated<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: unknown;
}

/** Public, read-only catalog — everything comes from the database. */
export const catalogApi = {
  listGames: (params?: { category?: string; search?: string; featured?: boolean; limit?: number }) =>
    api.get<Paginated<CatalogGameDTO>>("/games", { params }),
  getGame: (slug: string) => api.get<Envelope<{ game: CatalogGameDTO }>>(`/games/${slug}`),
  listCategories: () => api.get<Envelope<{ categories: CatalogCategoryDTO[] }>>("/games/categories"),
};

/** Admin catalog management — games + categories, fully editable. */
export const adminCatalogApi = {
  listGames: (params?: { search?: string; categoryId?: string; includeArchived?: boolean }) =>
    api.get<Envelope<{ games: CatalogGameDTO[] }>>("/admin/catalog/games", { params }),
  getGame: (id: string) => api.get<Envelope<{ game: CatalogGameDTO }>>(`/admin/catalog/games/${id}`),
  createGame: (data: Partial<CatalogGameDTO>) =>
    api.post<Envelope<{ game: CatalogGameDTO }>>("/admin/catalog/games", data),
  updateGame: (id: string, data: Partial<CatalogGameDTO>) =>
    api.patch<Envelope<{ game: CatalogGameDTO }>>(`/admin/catalog/games/${id}`, data),
  archiveGame: (id: string) => api.delete<Envelope<object>>(`/admin/catalog/games/${id}`),
  restoreGame: (id: string) => api.post<Envelope<{ game: CatalogGameDTO }>>(`/admin/catalog/games/${id}/restore`),
  reorderGames: (items: { id: string; displayOrder: number }[]) =>
    api.post<Envelope<{ count: number }>>("/admin/catalog/games/reorder", { items }),

  listCategories: (includeInactive?: boolean) =>
    api.get<Envelope<{ categories: CatalogCategoryDTO[] }>>("/admin/catalog/categories", {
      params: { includeInactive },
    }),
  createCategory: (data: Partial<CatalogCategoryDTO>) =>
    api.post<Envelope<{ category: CatalogCategoryDTO }>>("/admin/catalog/categories", data),
  updateCategory: (id: string, data: Partial<CatalogCategoryDTO>) =>
    api.patch<Envelope<{ category: CatalogCategoryDTO }>>(`/admin/catalog/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<Envelope<object>>(`/admin/catalog/categories/${id}`),
  reorderCategories: (items: { id: string; order: number }[]) =>
    api.post<Envelope<{ count: number }>>("/admin/catalog/categories/reorder", { items }),
  assignGame: (gameId: string, categoryId: string | null) =>
    api.patch<Envelope<{ game: CatalogGameDTO }>>(`/admin/catalog/categories/assign/${gameId}`, { categoryId }),
};
