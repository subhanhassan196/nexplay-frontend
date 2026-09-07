import type { CatalogGameDTO } from "@/lib/api/catalog";
import type { Game, GameCategory } from "@/types";

/**
 * Bridges the database DTO to the `Game` shape the shared UI components
 * already expect. Keeping the conversion in one place means the cards,
 * carousels and listings didn't need rewriting when the catalog moved
 * from mock data to the API.
 */
export function toGame(dto: CatalogGameDTO): Game {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description,
    longDescription: dto.longDescription ?? undefined,
    coverImage: dto.coverImageUrl ?? "/games/placeholder.jpg",
    // The UI type expects a category label; fall back gracefully when a
    // game hasn't been categorised yet.
    category: (dto.category?.name ?? "Games") as GameCategory,
    players: dto.activePlayers ?? 0,
    rating: Number(dto.averageRating) || 0,
    isTrending: dto.isTrending,
    isFeatured: dto.isFeatured,
  };
}

export function toGames(dtos: CatalogGameDTO[]): Game[] {
  return dtos.map(toGame);
}
