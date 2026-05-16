import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  getInsightsByCategory,
  getInsightCategories,
  getTrendingInsights,
  getCategoryColor,
} from '@/lib/insights-api';
import ArticleCard from '@/components/insights/ArticleCard';
import CategoryChips from '@/components/insights/CategoryChips';
import TrendingSidebar from '@/components/insights/TrendingSidebar';
import NewsletterCTA from '@/components/insights/NewsletterCTA';
import InsightsSearchBar from '@/components/insights/InsightsSearchBar';
import CategoryPagination from '@/components/insights/CategoryPagination';

export async function generateStaticParams() {
  const categories = await getInsightCategories().catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getInsightCategories().catch(() => []);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: 'Category | HoroHouse Insights' };

  return {
    title: `${cat.name} — HoroHouse Insights`,
    description:
      cat.description ??
      `Browse all ${cat.name} articles, guides, and market reports from HoroHouse.`,
    openGraph: {
      title: `${cat.name} | HoroHouse Insights`,
      description: cat.description,
    },
    alternates: {
      canonical: `/insights/category/${slug}`,
    },
  };
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);

  let categories;
  let data;
  let trending;

  try {
    [categories, data, trending] = await Promise.all([
      getInsightCategories(),
      getInsightsByCategory(slug, { page, limit: 12 }),
      getTrendingInsights(5),
    ]);
  } catch {
    notFound();
  }

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const accentColor = getCategoryColor(slug);
  const heroPost = data.data[0];
  const gridPosts = data.data.slice(1);

  return (
    <main className="min-h-screen bg-white">

      {/* ── Category Header ─────────────────────────────────────────────── */}
      <div className="border-b border-[#EBEBEB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">

          {/* Back link */}
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#717171] hover:text-[#222222] transition-colors mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            All Insights
          </Link>

          {/* Category label + title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span
                className="inline-block text-[11px] font-bold tracking-[0.16em] uppercase mb-3 px-3 py-1 rounded-full"
                style={{ color: accentColor, backgroundColor: `${accentColor}14` }}
              >
                {category.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#222222] leading-[1.05]">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-3 text-[1.05rem] text-[#717171] max-w-xl leading-relaxed">
                  {category.description}
                </p>
              )}
              {category.postCount !== undefined && (
                <p className="mt-2 text-[13px] text-[#717171]">
                  {category.postCount} articles
                </p>
              )}
            </div>
            <div className="w-full md:w-72">
              <InsightsSearchBar placeholder={`Search ${category.name}…`} />
            </div>
          </div>

          {/* Sibling category chips */}
          <div className="mt-8">
            <CategoryChips
              categories={categories}
              activeSlug={slug}
              navigateToPage
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Featured post in category ──────────────────────────────────── */}
        {heroPost && page === 1 && (
          <section className="py-12 md:py-14 border-b border-[#EBEBEB]">
            <div className="flex items-center gap-3 mb-7">
              <h2 className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[#222222]">
                Top Story
              </h2>
              <div className="flex-1 h-px bg-[#EBEBEB]" />
            </div>
            <ArticleCard post={heroPost} variant="featured-grid" priority />
          </section>
        )}

        {/* ── Grid + Sidebar ─────────────────────────────────────────────── */}
        <section className="py-12 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

            {/* Articles grid */}
            <div>
              {gridPosts.length === 0 && page === 1 ? (
                <div className="text-center py-20 text-[#717171]">
                  <p className="text-[1.2rem] font-medium mb-2">No articles yet</p>
                  <p className="text-[14px]">Check back soon for new content in this category.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-7">
                    <h2 className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[#222222]">
                      {page > 1 ? `Page ${page}` : 'Latest'}
                    </h2>
                    <div className="flex-1 h-px bg-[#EBEBEB]" />
                    <span className="text-[12px] text-[#717171]">
                      {data.meta.total} total
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {gridPosts.map((post, i) => (
                      <ArticleCard
                        key={post._id}
                        post={post}
                        variant="default"
                        index={i}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {data.meta.totalPages > 1 && (
                    <div className="mt-12">
                      <CategoryPagination
                        currentPage={data.meta.page}
                        totalPages={data.meta.totalPages}
                        basePath={`/insights/category/${slug}`}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Trending sidebar */}
            <div className="lg:border-l lg:border-[#EBEBEB] lg:pl-12">
              <TrendingSidebar posts={trending} title="Trending across all topics" />

              {/* Other categories */}
              <div className="mt-10 pt-10 border-t border-[#EBEBEB]">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#717171] mb-4">
                  Browse topics
                </p>
                <div className="flex flex-col gap-0">
                  {categories
                    .filter((c) => c.slug !== slug)
                    .map((cat) => {
                      const color = getCategoryColor(cat.slug);
                      return (
                        <Link
                          key={cat._id}
                          href={`/insights/category/${cat.slug}`}
                          className="flex items-center justify-between py-3 border-b border-[#F0F0F0] last:border-0 group"
                        >
                          <span
                            className="text-[13px] font-medium group-hover:underline"
                            style={{ color }}
                          >
                            {cat.name}
                          </span>
                          {cat.postCount !== undefined && (
                            <span className="text-[11px] text-[#717171]">
                              {cat.postCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Newsletter ─────────────────────────────────────────────────── */}
        <div className="pb-16 md:pb-20">
          <NewsletterCTA variant="banner" />
        </div>
      </div>
    </main>
  );
}