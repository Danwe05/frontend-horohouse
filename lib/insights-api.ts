import axios, { AxiosInstance } from 'axios';
import { authService } from './auth';
import type {
  PaginatedInsights,
  InsightPost,
  InsightCategory,
  InsightTag,
  InsightsQueryParams,
} from '@/types/insights';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface AdminPostsQuery {
  status?: string;
  postType?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminPostsResult {
  data: InsightPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminStats {
  total: number;
  published: number;
  draft: number;
  review: number;
  scheduled: number;
  featured: number;
  trending: number;
  topPosts?: InsightPost[];
  recentActivity?: InsightPost[];
}

export interface AdminAuthorsResult {
  data: any[];
  meta: { total: number; page: number; limit: number };
}

export interface AdminTagsResult {
  data: InsightTag[];
  meta: { total: number; page: number; limit: number };
}

// ─── InsightsApiClient ────────────────────────────────────────────────────────

class InsightsApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    // ── Request: attach token unless skipAuth ──────────────────────────────
    this.client.interceptors.request.use(
      async (config: any) => {
        if (config.skipAuth) return config;
        if (typeof window !== 'undefined') {
          const token = authService.getAccessToken();
          if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // ── Response: auto-refresh on 401  ────────────────────────────────────
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const original = error.config;
        if (original?.skipAuth) return Promise.reject(error);

        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  original.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(original));
                },
                reject: (err: any) => reject(err),
              });
            });
          }

          this.isRefreshing = true;
          try {
            const refreshed = await authService.refreshToken();
            if (refreshed) {
              this.isRefreshing = false;
              this.processQueue(null, refreshed.accessToken);
              original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
              return this.client(original);
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            this.processQueue(refreshError, null);
            await authService.logout();
            if (typeof window !== 'undefined') window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildQuery(params: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') result[k] = String(v);
    });
    return result;
  }

  // ─── Public endpoints (no auth) ───────────────────────────────────────────

  async getInsights(params: InsightsQueryParams = {}): Promise<PaginatedInsights> {
    return (await this.client.get('/insights', { params: this.buildQuery(params), skipAuth: true } as any)).data;
  }

  async getFeaturedInsights(limit = 6): Promise<InsightPost[]> {
    return (await this.client.get('/insights/featured', { params: { limit }, skipAuth: true } as any)).data;
  }

  async getTrendingInsights(limit = 5): Promise<InsightPost[]> {
    return (await this.client.get('/insights/trending', { params: { limit }, skipAuth: true } as any)).data;
  }

  async getInsightBySlug(slug: string): Promise<InsightPost> {
    return (await this.client.get(`/insights/${slug}`, { skipAuth: true } as any)).data;
  }

  async getRelatedInsights(slug: string, limit = 4): Promise<InsightPost[]> {
    return (await this.client.get(`/insights/${slug}/related`, { params: { limit }, skipAuth: true } as any)).data;
  }

  async getInsightCategories(): Promise<InsightCategory[]> {
    return (await this.client.get('/insights/categories', { skipAuth: true } as any)).data;
  }

  async getPopularTags(limit = 30): Promise<InsightTag[]> {
    return (await this.client.get('/insights/tags/popular', { params: { limit }, skipAuth: true } as any)).data;
  }

  async getInsightsByCategory(categorySlug: string, params: InsightsQueryParams = {}): Promise<PaginatedInsights> {
    return (await this.client.get(`/insights/category/${categorySlug}`, { params: this.buildQuery(params), skipAuth: true } as any)).data;
  }

  async searchInsights(q: string, params: InsightsQueryParams = {}): Promise<PaginatedInsights> {
    return (await this.client.get('/insights/search', { params: { q, ...this.buildQuery(params) }, skipAuth: true } as any)).data;
  }

  async getMarketInsights(params: InsightsQueryParams = {}): Promise<PaginatedInsights> {
    return (await this.client.get('/insights/market', { params: this.buildQuery(params), skipAuth: true } as any)).data;
  }

  async getAuthorWithPosts(authorSlug: string, params: InsightsQueryParams = {}) {
    return (await this.client.get(`/insights/author/${authorSlug}`, { params: this.buildQuery(params), skipAuth: true } as any)).data;
  }

  // ─── Admin: Posts ─────────────────────────────────────────────────────────

  async adminGetPosts(query: AdminPostsQuery = {}): Promise<AdminPostsResult> {
    return (await this.client.get('/insights/admin/all', { params: this.buildQuery(query) })).data;
  }

  async adminGetStats(): Promise<AdminStats> {
    return (await this.client.get('/insights/admin/stats')).data;
  }

  async adminGetAnalytics(params?: Record<string, any>) {
    return (await this.client.get('/insights/admin/analytics', { params })).data;
  }

  async adminGetPost(id: string): Promise<InsightPost> {
    return (await this.client.get(`/insights/admin/${id}`)).data;
  }

  async adminCreatePost(dto: any): Promise<InsightPost> {
    return (await this.client.post('/insights/admin', dto)).data;
  }

  async adminUpdatePost(id: string, dto: any): Promise<InsightPost> {
    return (await this.client.patch(`/insights/admin/${id}`, dto)).data;
  }

  async adminPublish(id: string): Promise<InsightPost> {
    return (await this.client.patch(`/insights/admin/${id}/publish`)).data;
  }

  async adminToggleFeatured(id: string, isFeatured: boolean): Promise<InsightPost> {
    return (await this.client.patch(`/insights/admin/${id}/feature`, { isFeatured })).data;
  }

  async adminSchedule(id: string, scheduledAt: string): Promise<InsightPost> {
    return (await this.client.patch(`/insights/admin/${id}/schedule`, { scheduledAt })).data;
  }

  async adminReview(id: string, decision: 'approve' | 'reject', note?: string): Promise<InsightPost> {
    return (await this.client.patch(`/insights/admin/${id}/review`, { decision, note })).data;
  }

  async adminDeletePost(id: string): Promise<void> {
    return (await this.client.delete(`/insights/admin/${id}`)).data;
  }

  async adminUploadCover(file: File): Promise<{ url: string; publicId: string; width: number; height: number }> {
    const form = new FormData();
    form.append('file', file);
    return (await this.client.post('/insights/admin/upload-cover', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  // ─── Admin: Categories ────────────────────────────────────────────────────

  /** Returns a flat array — backend: `find().lean()` */
  async adminGetCategories(): Promise<InsightCategory[]> {
    return (await this.client.get('/insights/admin/categories')).data;
  }

  async adminCreateCategory(dto: {
    name: string;
    description?: string;
    icon?: string;
    accentColor?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<InsightCategory> {
    return (await this.client.post('/insights/admin/categories', dto)).data;
  }

  async adminUpdateCategory(id: string, dto: Partial<{
    name: string;
    description: string;
    icon: string;
    accentColor: string;
    sortOrder: number;
    isActive: boolean;
  }>): Promise<InsightCategory> {
    return (await this.client.patch(`/insights/admin/categories/${id}`, dto)).data;
  }

  async adminDeleteCategory(id: string): Promise<{ message: string }> {
    return (await this.client.delete(`/insights/admin/categories/${id}`)).data;
  }

  // ─── Admin: Tags ──────────────────────────────────────────────────────────

  async adminGetTags(params: Record<string, any> = {}): Promise<AdminTagsResult> {
    return (await this.client.get('/insights/admin/tags', { params })).data;
  }

  async adminCreateTag(name: string): Promise<InsightTag> {
    return (await this.client.post('/insights/admin/tags', { name })).data;
  }

  async adminDeleteTag(id: string): Promise<{ message: string }> {
    return (await this.client.delete(`/insights/admin/tags/${id}`)).data;
  }

  // ─── Admin: Authors ───────────────────────────────────────────────────────

  async adminGetAuthors(params: Record<string, any> = {}): Promise<AdminAuthorsResult> {
    return (await this.client.get('/insights/admin/authors', { params })).data;
  }

  async adminCreateAuthor(dto: {
    userId: string;
    displayName: string;
    title?: string;
    bio?: string;
    role?: string;
    isActive?: boolean;
    avatar?: string;
    social?: { twitter?: string; linkedin?: string; website?: string };
  }): Promise<any> {
    return (await this.client.post('/insights/admin/authors', dto)).data;
  }

  async adminUpdateAuthor(id: string, dto: Partial<{
    displayName: string;
    title: string;
    bio: string;
    role: string;
    isActive: boolean;
    avatar: string;
    social: { twitter?: string; linkedin?: string; website?: string };
  }>): Promise<any> {
    return (await this.client.patch(`/insights/admin/authors/${id}`, dto)).data;
  }

  async adminBackfillSlugs(): Promise<{ fixed: number; skipped: number }> {
    return (await this.client.post('/insights/admin/backfill-slugs')).data;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const insightsClient = new InsightsApiClient();

// ─── Public API (backwards compat) ───────────────────────────────────────────

export const getInsights            = (p?: InsightsQueryParams)              => insightsClient.getInsights(p);
export const getFeaturedInsights    = (limit?: number)                       => insightsClient.getFeaturedInsights(limit);
export const getTrendingInsights    = (limit?: number)                       => insightsClient.getTrendingInsights(limit);
export const getInsightBySlug       = (slug: string)                         => insightsClient.getInsightBySlug(slug);
export const getRelatedInsights     = (slug: string, limit?: number)         => insightsClient.getRelatedInsights(slug, limit);
export const getInsightCategories   = ()                                     => insightsClient.getInsightCategories();
export const getPopularTags         = (limit?: number)                       => insightsClient.getPopularTags(limit);
export const getInsightsByCategory  = (s: string, p?: InsightsQueryParams)   => insightsClient.getInsightsByCategory(s, p);
export const searchInsights         = (q: string, p?: InsightsQueryParams)   => insightsClient.searchInsights(q, p);
export const getMarketInsights      = (p?: InsightsQueryParams)              => insightsClient.getMarketInsights(p);
export const getAuthorWithPosts     = (slug: string, p?: InsightsQueryParams)=> insightsClient.getAuthorWithPosts(slug, p);

// ─── Admin API namespace (backwards compat + new methods) ─────────────────────

export const insightsAdminApi = {
  // Posts
  getPosts:         (q?: AdminPostsQuery)                        => insightsClient.adminGetPosts(q),
  getStats:         ()                                           => insightsClient.adminGetStats(),
  getAnalytics:     (p?: Record<string, any>)                    => insightsClient.adminGetAnalytics(p),
  getPost:          (id: string)                                 => insightsClient.adminGetPost(id),
  createPost:       (dto: any)                                   => insightsClient.adminCreatePost(dto),
  updatePost:       (id: string, dto: any)                       => insightsClient.adminUpdatePost(id, dto),
  publish:          (id: string)                                 => insightsClient.adminPublish(id),
  toggleFeatured:   (id: string, isFeatured: boolean)            => insightsClient.adminToggleFeatured(id, isFeatured),
  schedule:         (id: string, scheduledAt: string)            => insightsClient.adminSchedule(id, scheduledAt),
  review:           (id: string, d: 'approve'|'reject', n?: string) => insightsClient.adminReview(id, d, n),
  delete:           (id: string)                                 => insightsClient.adminDeletePost(id),
  uploadCover:      (file: File)                                 => insightsClient.adminUploadCover(file),
  backfillSlugs:    ()                                           => insightsClient.adminBackfillSlugs(),

  // Categories
  getCategories:    ()                                           => insightsClient.adminGetCategories(),
  createCategory:   (dto: {
    name: string; description?: string; icon?: string;
    accentColor?: string; sortOrder?: number; isActive?: boolean;
  })                                                             => insightsClient.adminCreateCategory(dto),
  updateCategory:   (id: string, dto: Partial<{
    name: string; description: string; icon: string;
    accentColor: string; sortOrder: number; isActive: boolean;
  }>)                                                            => insightsClient.adminUpdateCategory(id, dto),
  deleteCategory:   (id: string)                                 => insightsClient.adminDeleteCategory(id),

  // Tags
  getTags:          (p?: Record<string, any>)                    => insightsClient.adminGetTags(p),
  createTag:        (name: string)                               => insightsClient.adminCreateTag(name),
  deleteTag:        (id: string)                                 => insightsClient.adminDeleteTag(id),

  // Authors
  getAuthors:       (p?: Record<string, any>)                    => insightsClient.adminGetAuthors(p),
  createAuthor:     (dto: {
    userId: string; displayName: string; title?: string; bio?: string;
    role?: string; isActive?: boolean; avatar?: string;
    social?: { twitter?: string; linkedin?: string; website?: string };
  })                                                             => insightsClient.adminCreateAuthor(dto),
  updateAuthor:     (id: string, dto: Partial<{
    displayName: string; title: string; bio: string; role: string;
    isActive: boolean; avatar: string;
    social: { twitter?: string; linkedin?: string; website?: string };
  }>)                                                            => insightsClient.adminUpdateAuthor(id, dto),
};

// ─── Helpers used by client components ───────────────────────────────────────

export function formatInsightDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatPrice(price: number, currency = 'XAF'): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M ${currency}`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(0)}K ${currency}`;
  return `${price} ${currency}`;
}

export function getCategoryColor(slug?: string): string {
  if (!slug) return '#2563EB';
  const map: Record<string, string> = {
    buying:            '#2563EB',
    renting:           '#7C3AED',
    investing:         '#059669',
    'market-trends':   '#D97706',
    'fraud-prevention':'#DC2626',
    'horohouse-news':  '#0891B2',
    'property-tips':   '#9333EA',
    default:           '#2563EB',
  };
  return map[slug] ?? map.default;
}

export function getOgImage(post: InsightPost): string {
  return (
    post.seo?.ogImage ||
    post.coverImage?.url ||
    `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`
  );
}