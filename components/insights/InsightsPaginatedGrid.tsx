'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedInsights } from '@/types/insights';
import ArticleCard, { ArticleCardSkeleton } from '@/components/insights/ArticleCard';

interface InsightsPaginatedGridProps {
  initialData: PaginatedInsights;
  searchParams: { category?: string; q?: string; page?: string };
}

export default function InsightsPaginatedGrid({
  initialData,
  searchParams,
}: InsightsPaginatedGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const { data: posts, meta } = initialData;

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.q) params.set('q', searchParams.q);
    if (page > 1) params.set('page', String(page));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[1.1rem] font-medium text-[#222222] mb-2">No articles found</p>
        <p className="text-[14px] text-[#717171]">
          {searchParams.q
            ? `Try a different search term.`
            : 'Check back soon for new content.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-200 ${
          isPending ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {isPending
          ? Array.from({ length: 9 }).map((_, i) => (
              <ArticleCardSkeleton key={i} variant="default" />
            ))
          : posts.map((post, i) => (
              <ArticleCard
                key={post._id}
                post={post}
                variant="default"
                index={i}
              />
            ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => goToPage(meta.page - 1)}
            disabled={meta.page === 1 || isPending}
            className="p-2 rounded-full border border-[#DDDDDD] hover:border-[#B0B0B0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#222222]" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first, last, current, and neighbors
              return p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1;
            })
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
              acc.push(p);
              return acc;
            }, [])
            .map((item, i) =>
              item === 'ellipsis' ? (
                <span key={`e-${i}`} className="px-2 text-[#717171] text-[14px]">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => goToPage(item as number)}
                  disabled={isPending}
                  className={`w-9 h-9 rounded-full text-[14px] font-medium transition-colors ${
                    item === meta.page
                      ? 'bg-[#222222] text-white'
                      : 'text-[#222222] hover:bg-[#F7F7F7] border border-[#DDDDDD]'
                  }`}
                >
                  {item}
                </button>
              ),
            )}

          <button
            onClick={() => goToPage(meta.page + 1)}
            disabled={meta.page === meta.totalPages || isPending}
            className="p-2 rounded-full border border-[#DDDDDD] hover:border-[#B0B0B0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[#222222]" />
          </button>
        </div>
      )}
    </div>
  );
}