// ─── Core DTOs ────────────────────────────────────────────────────────────────

export interface InsightAuthor {
  _id: string;
  displayName: string;
  slug: string;
  avatar?: string;
  title?: string;
  bio?: string;
  role?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  specialties?: string[];
}

export interface InsightCategory {
  _id: string;
  name: string;
  slug: string;
  accentColor?: string;
  icon?: string;
  description?: string;
  postCount?: number;
}

export interface InsightTag {
  _id: string;
  name: string;
  slug: string;
  usageCount?: number;
}

export interface InsightCoverImage {
  url: string;
  publicId?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface InsightNeighborhood {
  name?: string;
  city?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
}

export interface InsightMarketData {
  averagePrice?: number;
  priceChange?: number;
  demandIndex?: number;
  currency?: string;
  dataDate?: string;
  source?: string;
}

export interface InsightSEO {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: Record<string, any>;
}

export interface InsightCTA {
  type: 'search_listings' | 'contact_agent' | 'book_tour' | 'newsletter' | 'download_report';
  label: string;
  url?: string;
  propertyId?: string;
}

// ─── Post / Article ───────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
export type PostType =
  | 'article'
  | 'neighborhood_guide'
  | 'market_report'
  | 'fraud_alert'
  | 'ai_insight';

export interface InsightPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: Record<string, any>; // Tiptap JSON
  contentText?: string;
  author: InsightAuthor;
  coAuthors?: InsightAuthor[];
  category: InsightCategory;
  tags?: InsightTag[];
  status: PostStatus;
  postType: PostType;
  coverImage?: InsightCoverImage;
  seo?: InsightSEO;
  neighborhood?: InsightNeighborhood;
  marketData?: InsightMarketData;
  relatedListings?: RelatedListing[];
  cta?: InsightCTA;
  publishedAt?: string;
  scheduledAt?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isPinned?: boolean;
  isAiGenerated?: boolean;
  viewCount: number;
  shareCount?: number;
  likeCount?: number;
  commentCount?: number;
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Related Property Listing (for inline recommendations) ───────────────────

export interface RelatedListing {
  _id: string;
  title: string;
  price: number;
  images?: Array<{ url: string }>;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
  city?: string;
  type?: string;
  listingType?: string;
  isVerified?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface PaginatedInsights {
  data: InsightPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InsightsQueryParams {
  category?: string;
  tag?: string;
  postType?: PostType;
  city?: string;
  author?: string;
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Category page ───────────────────────────────────────────────────────────

export interface CategoryPageData {
  category: InsightCategory;
  posts: InsightPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Post type labels & colors ────────────────────────────────────────────────

export const POST_TYPE_LABELS: Record<PostType, string> = {
  article: 'Article',
  neighborhood_guide: 'Neighborhood Guide',
  market_report: 'Market Report',
  fraud_alert: 'Fraud Alert',
  ai_insight: 'AI Insight',
};

export const CATEGORY_ACCENT_COLORS: Record<string, string> = {
  buying: '#2563EB',
  renting: '#7C3AED',
  investing: '#059669',
  'market-trends': '#D97706',
  'fraud-prevention': '#DC2626',
  'horohouse-news': '#0891B2',
  'property-tips': '#9333EA',
  'neighborhood-guide': '#16A34A',
  default: '#2563EB',
};