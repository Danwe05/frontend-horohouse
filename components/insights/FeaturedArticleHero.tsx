'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import type { InsightPost } from '@/types/insights';
import { formatInsightDate } from '@/lib/insights-api';

interface FeaturedArticleHeroProps {
  post: InsightPost;
}

export function FeaturedArticleHeroSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-pulse">
      <div className="aspect-[4/3] rounded-xl bg-[#EBEBEB]" />
      <div className="space-y-4">
        <div className="h-3 bg-[#EBEBEB] rounded w-1/4" />
        <div className="h-9 bg-[#EBEBEB] rounded w-full" />
        <div className="h-9 bg-[#EBEBEB] rounded w-4/5" />
        <div className="h-4 bg-[#EBEBEB] rounded w-full" />
        <div className="h-4 bg-[#EBEBEB] rounded w-5/6" />
        <div className="h-8 bg-[#EBEBEB] rounded w-1/3" />
      </div>
    </div>
  );
}

export default function FeaturedArticleHero({ post }: FeaturedArticleHeroProps) {
  return (
    <Link href={`/insights/${post.slug}`}>
      <section className="group cursor-pointer">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* ── Cover image ── */}
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-[#F7F7F7]">
            {post.coverImage?.url ? (
              <Image
                src={post.coverImage.url}
                alt={post.coverImage.alt || post.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[#F0F0F0]" />
            )}
          </div>

          {/* ── Copy ── */}
          <div className="flex flex-col justify-center lg:pr-4">

            {/* Meta row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#717171]">
                {post.category?.name}
              </span>
              <span className="text-[#DDDDDD]">·</span>
              <span className="text-[12px] text-[#717171] flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {post.readingTimeMinutes} min read
              </span>
              <span className="text-[#DDDDDD]">·</span>
              <span className="text-[12px] text-[#717171]">{formatInsightDate(post.publishedAt)}</span>
            </div>

            {/* Title */}
            <h2 className="text-[2rem] md:text-[2.4rem] font-semibold tracking-tight text-[#222222] leading-[1.1] mb-4 group-hover:underline decoration-1 underline-offset-4">
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="text-[1rem] text-[#717171] leading-relaxed mb-6 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Author row */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#EBEBEB]">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[12px] font-bold text-[#717171]">
                  {post.author.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[13px] font-semibold text-[#222222]">{post.author.displayName}</p>
                {post.author.title && (
                  <p className="text-[12px] text-[#717171]">{post.author.title}</p>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 text-[#222222] font-semibold text-[14px]">
              Read full article
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </section>
    </Link>
  );
}