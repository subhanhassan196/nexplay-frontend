import { api } from "@/lib/api/axios";

// ── Types ──
export interface SiteContentDTO {
  id: string;
  key: string;
  value: unknown;
  isPublished: boolean;
  updatedAt: string;
}

export interface BannerDTO {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
  placement: string;
  order: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface LegalPageDTO {
  id: string;
  slug: string;
  title: string;
  body: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface FaqDTO {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

export interface SeoMetaDTO {
  id?: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  structuredData: unknown;
}

export interface MediaAssetDTO {
  id: string;
  filename: string;
  url: string;
  folder: string;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── CMS ──
export const cmsApi = {
  // content
  listContent: () => api.get<Envelope<{ items: SiteContentDTO[] }>>("/cms/content"),
  getContent: (key: string) => api.get<Envelope<{ content: SiteContentDTO | null }>>(`/cms/content/${key}`),
  setContent: (key: string, value: unknown) => api.put<Envelope<{ content: SiteContentDTO }>>(`/cms/content/${key}`, { value }),
  deleteContent: (key: string) => api.delete<Envelope<object>>(`/cms/content/${key}`),
  // banners
  listBanners: (params?: { placement?: string; activeOnly?: boolean }) =>
    api.get<Envelope<{ banners: BannerDTO[] }>>("/cms/banners", { params }),
  createBanner: (data: Partial<BannerDTO>) => api.post<Envelope<{ banner: BannerDTO }>>("/cms/banners", data),
  updateBanner: (id: string, data: Partial<BannerDTO>) => api.patch<Envelope<{ banner: BannerDTO }>>(`/cms/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete<Envelope<object>>(`/cms/banners/${id}`),
  // legal
  listLegal: (publishedOnly?: boolean) =>
    api.get<Envelope<{ pages: LegalPageDTO[] }>>("/cms/legal", { params: { publishedOnly } }),
  getLegal: (slug: string) => api.get<Envelope<{ page: LegalPageDTO }>>(`/cms/legal/${slug}`),
  upsertLegal: (slug: string, data: { title: string; body: string; isPublished?: boolean }) =>
    api.put<Envelope<{ page: LegalPageDTO }>>(`/cms/legal/${slug}`, data),
  deleteLegal: (slug: string) => api.delete<Envelope<object>>(`/cms/legal/${slug}`),
  // faq
  listFaq: (publishedOnly?: boolean) => api.get<Envelope<{ faqs: FaqDTO[] }>>("/cms/faq", { params: { publishedOnly } }),
  createFaq: (data: { question: string; answer: string; category?: string; order?: number }) =>
    api.post<Envelope<{ faq: FaqDTO }>>("/cms/faq", data),
  updateFaq: (id: string, data: Partial<FaqDTO>) => api.patch<Envelope<{ faq: FaqDTO }>>(`/cms/faq/${id}`, data),
  deleteFaq: (id: string) => api.delete<Envelope<object>>(`/cms/faq/${id}`),
};

// ── SEO ──
export const seoApi = {
  list: () => api.get<Envelope<{ items: SeoMetaDTO[] }>>("/seo"),
  getForPath: (path: string) => api.get<Envelope<{ meta: SeoMetaDTO }>>("/seo/meta", { params: { path } }),
  upsert: (data: SeoMetaDTO) => api.put<Envelope<{ meta: SeoMetaDTO }>>("/seo", data),
  remove: (path: string) => api.delete<Envelope<object>>(`/seo/${encodeURIComponent(path)}`),
};

// ── Media ──
export const mediaApi = {
  list: (params?: { page?: number; limit?: number; folder?: string; search?: string }) =>
    api.get<Envelope<{ items: MediaAssetDTO[]; folders: string[]; pagination: unknown }>>("/admin/media", { params }),
  upload: (file: File, folder: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    return api.post<Envelope<{ asset: MediaAssetDTO }>>("/admin/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id: string, data: { filename?: string; altText?: string; folder?: string }) =>
    api.patch<Envelope<{ asset: MediaAssetDTO }>>(`/admin/media/${id}`, data),
  remove: (id: string) => api.delete<Envelope<object>>(`/admin/media/${id}`),
};
