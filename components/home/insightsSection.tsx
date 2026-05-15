'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { getInsights, formatInsightDate } from '@/lib/insights-api';
import { InsightPost } from '@/types/insights';

// ─── Mini components ──────────────────────────────────────────────────────────

function CategoryPill({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-700">
      {name}
    </span>
  );
}

function ReadTime({ minutes }: { minutes?: number }) {
  if (!minutes) return null;
  return (
    <span className="flex items-center gap-1 text-[12px] text-[#717171]">
      <Clock className="w-3 h-3" />
      {minutes} min read
    </span>
  );
}

// ─── Featured (big) card ──────────────────────────────────────────────────────

function FeaturedCard({ post }: { post: InsightPost }) {
  const href = `/insights/${post.slug || post._id}`;
  return (
    <Link href={href} className="group block relative overflow-hidden rounded-2xl bg-[#F7F7F7] h-full min-h-[380px]">
      {/* Image */}
      {post.coverImage?.url ? (
        <Image
          src={post.coverImage.url}
          alt={post.coverImage.alt || post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 60vw"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-50" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />

      {/* Content pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <CategoryPill name={post.category?.name} />
          <ReadTime minutes={post.readingTimeMinutes} />
        </div>
        <h3 className="text-white text-[20px] md:text-[24px] font-bold leading-snug mb-3 line-clamp-3 group-hover:underline decoration-1 underline-offset-2">
          {post.title}
        </h3>
        <p className="text-white/75 text-[14px] line-clamp-2 mb-4 hidden sm:block">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt={post.author.displayName} className="w-7 h-7 rounded-full object-cover border border-white/30" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold text-white">
              {post.author?.displayName?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <span className="text-[13px] text-white/80 font-medium">{post.author?.displayName}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-[12px] text-white/70">{formatInsightDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Small card ───────────────────────────────────────────────────────────────

function SmallCard({ post }: { post: InsightPost }) {
  const href = `/insights/${post.slug || post._id}`;
  return (
    <Link href={href} className="group flex gap-4 items-start p-4 rounded-xl hover:bg-[#F7F7F7] transition-colors duration-200 -mx-4">
      {/* Thumbnail */}
      <div className="relative w-[88px] h-[66px] shrink-0 rounded-xl overflow-hidden bg-[#EBEBEB]">
        {post.coverImage?.url ? (
          <Image
            src={post.coverImage.url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="88px"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-50" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <CategoryPill name={post.category?.name} />
          <ReadTime minutes={post.readingTimeMinutes} />
        </div>
        <h4 className="text-[14px] font-semibold text-[#222222] leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
          {post.title}
        </h4>
        <p className="text-[12px] text-[#717171] mt-1">{formatInsightDate(post.publishedAt)}</p>
      </div>
    </Link>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function FeaturedSkeleton() {
  return <div className="rounded-2xl bg-[#EBEBEB] animate-pulse min-h-[380px]" />;
}

function SmallSkeleton() {
  return (
    <div className="flex gap-4 items-start p-4 animate-pulse">
      <div className="w-[88px] h-[66px] rounded-xl bg-[#EBEBEB] shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-[#EBEBEB] rounded w-1/4" />
        <div className="h-4 bg-[#EBEBEB] rounded w-full" />
        <div className="h-4 bg-[#EBEBEB] rounded w-3/4" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function InsightsSection() {
  const [posts, setPosts] = useState<InsightPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await getInsights({ page: 1, limit: 4 });
        setPosts(res.data || []);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="bg-white py-16 px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto relative">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[12px] font-semibold tracking-widest uppercase text-blue-600 mb-2">Market intelligence</p>
            <h2 className="text-[28px] md:text-[34px] font-bold text-[#222222] tracking-tight leading-tight relative inline-block mt-1">
              Insights &amp;{' '}
              <span className="relative z-10 whitespace-nowrap">
                Guides
                <span className="absolute bottom-1 md:bottom-2 left-0 w-full h-3 bg-blue-200/80 -z-10 rounded-sm transform -rotate-1"></span>
              </span>
            </h2>
            <p className="text-[#717171] mt-2 text-[15px]">Expert analysis and property trends curated for you.</p>
          </div>
          <Link
            href="/insights"
            className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#222222] hover:text-blue-600 transition-colors shrink-0"
          >
            Explore all
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

          {/* Featured — left, takes 3 cols */}
          <div className="lg:col-span-3">
            {loading ? <FeaturedSkeleton /> : posts[0] && <FeaturedCard post={posts[0]} />}
          </div>

          {/* Small cards — right, takes 2 cols */}
          <div className="lg:col-span-2 flex flex-col justify-between divide-y divide-[#EBEBEB] lg:divide-y-0">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SmallSkeleton key={i} />)
              : posts.slice(1, 4).map((post) => <SmallCard key={post._id} post={post} />)}
          </div>
        </div>

      </div>
    </section>
  );
}
