import { catalogApi, type CatalogGameDTO, type CatalogCategoryDTO } from "@/lib/api/catalog";

/**
 * Tiny in-memory cache for the game catalog.
 *
 * Several components on one page need the same list (trending row,
 * featured row, category chips). Without this each one fires its own
 * request, so the homepage made the same call three times and the
 * content visibly popped in at different moments.
 *
 * Concurrent callers share a single in-flight promise, and the result is
 * reused for a short window — long enough to cover one page render,
 * short enough that admin edits appear almost immediately.
 */
const TTL_MS = 30_000;

let gamesCache: { data: CatalogGameDTO[]; at: number } | null = null;
let gamesInFlight: Promise<CatalogGameDTO[]> | null = null;

let categoriesCache: { data: CatalogCategoryDTO[]; at: number } | null = null;
let categoriesInFlight: Promise<CatalogCategoryDTO[]> | null = null;

function fresh(entry: { at: number } | null): boolean {
  return Boolean(entry && Date.now() - entry.at < TTL_MS);
}

export async function getGames(): Promise<CatalogGameDTO[]> {
  if (fresh(gamesCache)) return gamesCache!.data;
  if (gamesInFlight) return gamesInFlight;

  gamesInFlight = catalogApi
    .listGames({ limit: 100 })
    .then(({ data }) => {
      gamesCache = { data: data.data, at: Date.now() };
      return data.data;
    })
    .catch(() => [])
    .finally(() => {
      gamesInFlight = null;
    });

  return gamesInFlight;
}

export async function getCategories(): Promise<CatalogCategoryDTO[]> {
  if (fresh(categoriesCache)) return categoriesCache!.data;
  if (categoriesInFlight) return categoriesInFlight;

  categoriesInFlight = catalogApi
    .listCategories()
    .then(({ data }) => {
      categoriesCache = { data: data.data.categories, at: Date.now() };
      return data.data.categories;
    })
    .catch(() => [])
    .finally(() => {
      categoriesInFlight = null;
    });

  return categoriesInFlight;
}

/** Call after an admin edit so the next read refetches immediately. */
export function invalidateCatalogCache() {
  gamesCache = null;
  categoriesCache = null;
}
