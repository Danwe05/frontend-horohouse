import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, Eye, ArrowLeft } from 'lucide-react';
import {
  getInsightBySlug,
  getRelatedInsights,
  formatInsightDate,
} from '@/lib/insights-api';
import type { InsightPost } from '@/types/insights';
import ArticleContent from '@/components/insights/ArticleContent';
import ArticleCard from '@/components/insights/ArticleCard';
import RelatedListingsSection from '@/components/insights/RelatedListingsSection';
import NewsletterCTA from '@/components/insights/NewsletterCTA';
import ShareBookmark from '@/components/insights/ShareBookmark';
import InlinePropertyCTA from '@/components/insights/InlinePropertyCTA';
import ArticleComments from '@/components/insights/ArticleComments';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await getInsightBySlug(slug);
    const description = post.seo?.metaDescription ?? post.excerpt;
    
    return {
      title: post.seo?.metaTitle ?? `${post.title} — HoroHouse Insights`,
      description: description,
      openGraph: {
        title: post.seo?.ogTitle ?? post.title,
        description: post.seo?.ogDescription ?? description,
        images: [{ url: post.coverImage?.url ?? "https://horohouse.com/og-fallback.jpg" }],
        type: "article",
        publishedTime: post.publishedAt?.toString(),
        modifiedTime: post.updatedAt?.toString(),
        section: post.category?.name,
        authors: [post.author?.displayName || "HoroHouse Author"],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: description,
        images: [post.coverImage?.url ?? "https://horohouse.com/og-fallback.jpg"],
      },
      alternates: {
        canonical: post.seo?.canonicalUrl ?? `/insights/${post.slug}`,
      },
    };
  } catch {
    return { title: "Article | HoroHouse Insights" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the article first — if this fails, show not-found
  let post: InsightPost;
  try {
    post = await getInsightBySlug(slug);
  } catch {
    notFound();
  }

  // Related posts are non-critical — never let their failure kill the page
  let relatedPosts: InsightPost[] = [];
  try {
    relatedPosts = await getRelatedInsights(slug, 3);
  } catch {
    // silently ignore — page still renders without related articles
  }


  return (
    <main className="min-h-screen bg-white">

      {/* ── Back nav ────────────────────────────────────────────────────── */}
      <div className="border-b border-[#EBEBEB]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#717171] hover:text-[#222222] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Insights
          </Link>
        </div>
      </div>

      <article>
        {/* ── Article Header ──────────────────────────────────────────── */}
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-10 md:pt-14 pb-8">

          {/* Category + meta */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <Link
              href={`/insights/category/${post.category?.slug}`}
              className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#717171] hover:text-[#222222] transition-colors"
            >
              {post.category?.name}
            </Link>
            <span className="text-[#DDDDDD]">·</span>
            <span className="text-[13px] text-[#717171] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTimeMinutes} min read
            </span>
            <span className="text-[#DDDDDD]">·</span>
            <span className="text-[13px] text-[#717171] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatInsightDate(post.publishedAt)}
            </span>
            {post.viewCount > 0 && (
              <>
                <span className="text-[#DDDDDD]">·</span>
                <span className="text-[13px] text-[#717171] flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.viewCount.toLocaleString()} views
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[2.2rem] md:text-[2.8rem] font-semibold tracking-tight text-[#222222] leading-[1.1] mb-5">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-[1.1rem] text-[#717171] leading-relaxed mb-8 border-l-4 border-[#EBEBEB] pl-4">
            {post.excerpt}
          </p>

          {/* Author row + share */}
          <div className="flex items-center justify-between gap-4 pb-8 border-b border-[#EBEBEB]">
            <Link
              href={`/insights/author/${post.author.slug}`}
              className="flex items-center gap-3 group"
            >
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-11 h-11 rounded-full object-cover border border-[#DDDDDD]"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[14px] font-bold text-[#717171]">
                  {post.author.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[14px] font-semibold text-[#222222] group-hover:underline">
                  {post.author.displayName}
                </p>
                {post.author.title && (
                  <p className="text-[12px] text-[#717171]">{post.author.title}</p>
                )}
              </div>
            </Link>

            <ShareBookmark title={post.title} slug={post.slug} />
          </div>
        </div>

        {/* ── Cover Image ────────────────────────────────────────────────── */}
        {post.coverImage?.url && (
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 mb-10">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[20px] bg-[#F7F7F7]">
              <img
                src={post.coverImage.url}
                alt={post.coverImage.alt || post.title}
                className="w-full h-full object-cover"
              />
              {post.coverImage.caption && (
                <p className="absolute bottom-0 left-0 right-0 text-center text-[12px] text-white/80 bg-black/30 py-2 px-4 backdrop-blur-sm">
                  {post.coverImage.caption}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Article Body ────────────────────────────────────────────────── */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-10">
          {post.content ? (
            <ArticleContent content={post.content} />
          ) : (
            <div className="max-w-[720px]">
              <p className="text-[#717171] text-[17px] leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          )}
        </div>

        {/* ── Inline Property CTA ──────────────────────────────────────────── */}
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 pb-12">
          <InlinePropertyCTA type={post.cta?.type ?? 'search_listings'} />
        </div>

        {/* ── Tags ────────────────────────────────────────────────────────── */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 pb-12">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-[#717171] font-medium">Tags:</span>
              {post.tags.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/insights?tag=${tag.slug}`}
                  className="px-3 py-1 rounded-full text-[12px] border border-[#DDDDDD] text-[#717171] hover:border-[#B0B0B0] hover:text-[#222222] transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Author Bio Card ──────────────────────────────────────────────── */}
        {post.author.bio && (
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 pb-12">
            <div className="bg-[#F7F7F7] rounded-[20px] p-6 md:p-8 flex gap-5 items-start">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-14 h-14 rounded-full object-cover shrink-0 border border-[#DDDDDD]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[18px] font-bold text-[#717171] shrink-0">
                  {post.author.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#717171] mb-1">
                  About the author
                </p>
                <p className="text-[15px] font-semibold text-[#222222] mb-1">
                  {post.author.displayName}
                </p>
                {post.author.title && (
                  <p className="text-[13px] text-[#717171] mb-2">{post.author.title}</p>
                )}
                <p className="text-[14px] text-[#717171] leading-relaxed">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Related Listings ────────────────────────────────────────────── */}
        {post.relatedListings && post.relatedListings.length > 0 && (
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
            <RelatedListingsSection listings={post.relatedListings} />
          </div>
        )}

        {/* ── Share row (bottom) ────────────────────────────────────────── */}
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 border-t border-[#EBEBEB] mt-6">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-medium text-[#222222]">
              Found this helpful?
            </p>
            <ShareBookmark title={post.title} slug={post.slug} />
          </div>
        </div>

        {/* ── Article Comments ────────────────────────────────────────── */}
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 pb-12">
          <ArticleComments insightId={post._id} />
        </div>

        {/* ── Related Articles ─────────────────────────────────────────── */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-[#EBEBEB]">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-[13px] font-semibold tracking-[0.12em] uppercase text-[#222222]">
                  Related Insights
                </h2>
                <div className="flex-1 h-px bg-[#EBEBEB]" />
                <Link
                  href="/insights"
                  className="text-[12px] font-semibold text-blue-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((p, i) => (
                  <ArticleCard key={p._id} post={p} variant="default" index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Newsletter ───────────────────────────────────────────────── */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
          <NewsletterCTA variant="banner" />
        </div>
      </article>
    </main>
  );
}