'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { InsightPost } from '@/types/insights';
import { formatInsightDate } from '@/lib/insights-api';
import { cn } from '@/lib/utils';

// ─── Variants ─────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'compact' | 'horizontal' | 'featured-grid';

interface ArticleCardProps {
  post: InsightPost;
  variant?: CardVariant;
  className?: string;
  priority?: boolean;
  index?: number;
}

// ─── Avatar fallback ──────────────────────────────────────────────────────────

function AuthorAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-6 h-6 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[10px] font-bold text-[#717171]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Category label  (plain text, no pill, Airbnb style) ─────────────────────

function CategoryLabel({ category }: { category: InsightPost['category'] }) {
  if (!category?.name) return null;
  return (
    <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#717171]">
      {category.name}
    </span>
  );
}

// ─── Default card (vertical, 3–4 col grids) ───────────────────────────────────

function DefaultCard({ post, priority, index = 0, className }: ArticleCardProps) {
  const href = `/insights/${post.slug || post._id}`;
  return (
    <article className={cn('group flex flex-col', className)}>
      <Link href={href} className="flex flex-col h-full">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-[#F7F7F7]">
          {post.coverImage?.url ? (
            <Image
              src={post.coverImage.url}
              alt={post.coverImage.alt || post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 bg-[#F0F0F0]" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <CategoryLabel category={post.category} />
            <span className="text-[#DDDDDD] text-xs">·</span>
            <span className="text-[12px] text-[#717171] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTimeMinutes} min
            </span>
          </div>

          <h3 className="text-[15px] font-semibold text-[#222222] leading-snug mb-2 group-hover:underline decoration-1 underline-offset-2 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-[13px] text-[#717171] leading-relaxed line-clamp-2 mb-4 flex-grow">
            {post.excerpt}
          </p>

          {/* Author row */}
          <div className="flex items-center gap-2 mt-auto">
            <AuthorAvatar name={post.author.displayName} avatar={post.author.avatar} />
            <span className="text-[12px] text-[#717171] truncate">{post.author.displayName}</span>
            <span className="text-[#DDDDDD] text-xs">·</span>
            <span className="text-[12px] text-[#717171]">{formatInsightDate(post.publishedAt)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// ─── Compact card (sidebar / trending) ───────────────────────────────────────

function CompactCard({ post, index = 0 }: ArticleCardProps) {
  const href = `/insights/${post.slug || post._id}`;
  return (
    <article>
      <Link
        href={href}
        className="flex gap-3 group py-3 border-b border-[#EBEBEB] last:border-0"
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-[#F7F7F7]">
          {post.coverImage?.url ? (
            <Image
              src={post.coverImage.url}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="80px"
            />
          ) : (
            <div className="absolute inset-0 bg-[#EBEBEB]" />
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col justify-center min-w-0 gap-1">
          <CategoryLabel category={post.category} />
          <h4 className="text-[13px] font-semibold text-[#222222] leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
            {post.title}
          </h4>
        </div>
      </Link>
    </article>
  );
}

// ─── Horizontal card (list view) ──────────────────────────────────────────────

function HorizontalCard({ post, index = 0 }: ArticleCardProps) {
  const href = `/insights/${post.slug || post._id}`;
  return (
    <article>
      <Link
        href={href}
        className="flex gap-4 group py-5 border-b border-[#EBEBEB] last:border-0"
      >
        {/* Thumbnail */}
        <div className="relative w-28 h-20 shrink-0 rounded-xl overflow-hidden bg-[#F7F7F7]">
          {post.coverImage?.url ? (
            <Image
              src={post.coverImage.url}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-400 group-hover:scale-[1.03]"
              sizes="112px"
            />
          ) : (
            <div className="absolute inset-0 bg-[#EBEBEB]" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <CategoryLabel category={post.category} />
            <h3 className="text-[15px] font-semibold text-[#222222] leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2 mt-1 mb-1">
              {post.title}
            </h3>
            <p className="text-[13px] text-[#717171] line-clamp-1 hidden sm:block">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <AuthorAvatar name={post.author.displayName} avatar={post.author.avatar} />
            <span className="text-[12px] text-[#717171]">{post.author.displayName}</span>
            <span className="text-[#DDDDDD] text-xs">·</span>
            <span className="text-[12px] text-[#717171]">{formatInsightDate(post.publishedAt)}</span>
            <span className="text-[#DDDDDD] text-xs">·</span>
            <span className="text-[12px] text-[#717171] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTimeMinutes} min
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// ─── Featured grid card (2-col) ───────────────────────────────────────────────

function FeaturedGridCard({ post, priority, index = 0 }: ArticleCardProps) {
  const href = `/insights/${post.slug || post._id}`;
  return (
    <article className="group">
      <Link href={href}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl mb-3 bg-[#F7F7F7]">
          {post.coverImage?.url ? (
            <Image
              src={post.coverImage.url}
              alt={post.coverImage.alt || post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 bg-[#EBEBEB]" />
          )}
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <CategoryLabel category={post.category} />
          <span className="text-[#DDDDDD] text-xs">·</span>
          <span className="text-[12px] text-[#717171]">{post.readingTimeMinutes} min read</span>
        </div>

        <h3 className="text-[17px] font-semibold text-[#222222] leading-snug mb-2 group-hover:underline decoration-1 underline-offset-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[13px] text-[#717171] line-clamp-2 mb-3">{post.excerpt}</p>

        <div className="flex items-center gap-2">
          <AuthorAvatar name={post.author.displayName} avatar={post.author.avatar} />
          <span className="text-[12px] text-[#717171]">{post.author.displayName}</span>
          <span className="text-[#DDDDDD] text-xs">·</span>
          <span className="text-[12px] text-[#717171]">{formatInsightDate(post.publishedAt)}</span>
        </div>
      </Link>
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ArticleCardSkeleton({ variant = 'default' }: { variant?: CardVariant }) {
  if (variant === 'compact') {
    return (
      <div className="flex gap-3 py-3 border-b border-[#EBEBEB] animate-pulse">
        <div className="w-20 h-16 rounded-lg bg-[#EBEBEB] shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-2.5 bg-[#EBEBEB] rounded w-1/3" />
          <div className="h-3.5 bg-[#EBEBEB] rounded w-3/4" />
          <div className="h-3.5 bg-[#EBEBEB] rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="flex gap-4 py-5 border-b border-[#EBEBEB] animate-pulse">
        <div className="w-28 h-20 rounded-xl bg-[#EBEBEB] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-[#EBEBEB] rounded w-1/4" />
          <div className="h-4 bg-[#EBEBEB] rounded w-3/4" />
          <div className="h-3 bg-[#EBEBEB] rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-[4/3] rounded-xl bg-[#EBEBEB]" />
      <div className="space-y-2">
        <div className="h-2.5 bg-[#EBEBEB] rounded w-1/3" />
        <div className="h-4 bg-[#EBEBEB] rounded w-full" />
        <div className="h-4 bg-[#EBEBEB] rounded w-4/5" />
        <div className="h-3 bg-[#EBEBEB] rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ArticleCard({
  post,
  variant = 'default',
  className,
  priority,
  index,
}: ArticleCardProps) {
  const props = { post, variant, className, priority, index };

  switch (variant) {
    case 'compact':
      return <CompactCard {...props} />;
    case 'horizontal':
      return <HorizontalCard {...props} />;
    case 'featured-grid':
      return <FeaturedGridCard {...props} />;
    default:
      return <DefaultCard {...props} />;
  }
}