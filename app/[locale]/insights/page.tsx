import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
  getInsights,
  getFeaturedInsights,
  getTrendingInsights,
  getInsightCategories,
} from '@/lib/insights-api';
import FeaturedArticleHero, {
  FeaturedArticleHeroSkeleton,
} from '@/components/insights/FeaturedArticleHero';
import ArticleCard, { ArticleCardSkeleton } from '@/components/insights/ArticleCard';
import TrendingSidebar, {
  TrendingSidebarSkeleton,
} from '@/components/insights/TrendingSidebar';
import CategoryChips, {
  CategoryChipsSkeleton,
} from '@/components/insights/CategoryChips';
import InsightsSearchBar from '@/components/insights/InsightsSearchBar';
import NewsletterCTA from '@/components/insights/NewsletterCTA';
import InsightsPaginatedGrid from '@/components/insights/InsightsPaginatedGrid';
import { InsightCategory, InsightPost} from '@/types/insights';

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "HoroHouse Insights — Africa's Property Market Intelligence",
  description: "Expert guides, market trends, and investment intelligence for Cameroon and Central Africa's real estate landscape.",
  openGraph: {
    title: "HoroHouse Insights",
    description: "Expert property guides and market intelligence for Africa.",
    type: "website",
  },
  alternates: {
    canonical: "/insights",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

interface InsightsPageProps {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const { page: rawPage, category, q } = await searchParams;
  const page = Number(rawPage ?? 1);

  // Parallel data fetching
  const [featuredPosts, trendingPosts, categories, latestData] = await Promise.all([
    getFeaturedInsights(3).catch(() => [] as InsightPost[]),
    getTrendingInsights(5).catch(() => [] as InsightPost[]),
    getInsightCategories().catch(() => [] as InsightCategory[]),
    getInsights({ page, limit: 9, category, q }).catch(() => ({
      data: [] as InsightPost[],
      meta: { total: 0, page: 1, limit: 9, totalPages: 0 },
    })),
  ]);

  const heroPost = featuredPosts[0];
  // Fall back to latest posts if there aren't enough featured ones to fill the grid
  const subFeatured = featuredPosts.length >= 3
    ? featuredPosts.slice(1, 3)
    : latestData.data.filter((p) => p._id !== heroPost?._id).slice(0, 2);

  return (
    <main className="min-h-screen bg-white">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="border-b mt-10 border-[#EBEBEB]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>

              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#222222] leading-[1.05]">
                Insights
              </h1>
              <p className="mt-3 text-[1.05rem] text-[#717171] max-w-md leading-relaxed">
                Market intelligence, expert guides, and property trends — curated for Africa.
              </p>
            </div>
            <div className="w-full md:w-80">
              <InsightsSearchBar defaultValue={q} />
            </div>
          </div>

          {/* Category chips */}
          <div className="mt-8">
            <Suspense fallback={<CategoryChipsSkeleton />}>
              <CategoryChips
                categories={categories}
                activeSlug={category}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero Section ──────────────────────────────────────────────── */}
        {!q && !category && heroPost && (
          <section className="py-12 md:py-16 border-b border-[#EBEBEB]">
            <FeaturedArticleHero post={heroPost} />
          </section>
        )}

        {/* ── Sub-featured + Trending ───────────────────────────────────── */}
        {!q && !category && (
          <section className="py-12 md:py-14 border-b border-[#EBEBEB]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
              {/* Sub-featured grid */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {subFeatured.map((post, i) => (
                    <ArticleCard
                      key={post._id}
                      post={post}
                      variant="featured-grid"
                      index={i}
                      priority={i === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Trending sidebar */}
              <div className="lg:border-l lg:border-[#EBEBEB] lg:pl-12">
                <TrendingSidebar posts={trendingPosts} />
              </div>
            </div>
          </section>
        )}

        {/* ── Latest / Filtered Articles ────────────────────────────────── */}
        <section className="py-12 md:py-14">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[#222222]">
              {q
                ? `Results for "${q}"`
                : category
                ? categories.find((c) => c.slug === category)?.name ?? 'Articles'
                : 'Latest Insights'}
            </h2>
            <div className="flex-1 h-px bg-[#EBEBEB]" />
            {latestData.meta.total > 0 && (
              <span className="text-[12px] text-[#717171]">
                {latestData.meta.total} articles
              </span>
            )}
          </div>

          <InsightsPaginatedGrid
            initialData={latestData}
            searchParams={{ category, q, page: String(page) }}
          />
        </section>

        {/* ── Newsletter CTA ────────────────────────────────────────────── */}
        <div className="pb-16 md:pb-20">
          <NewsletterCTA variant="banner" />
        </div>
      </div>
    </main>
  );
}