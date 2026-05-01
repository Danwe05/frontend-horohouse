import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { InsightPost } from '@/types/insights';
import { formatInsightDate } from '@/lib/insights-api';

interface TrendingSidebarProps {
  posts: InsightPost[];
  title?: string;
}

export function TrendingSidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 bg-[#EBEBEB] rounded w-1/3 animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-4 border-b border-[#EBEBEB] animate-pulse">
          <div className="w-6 h-5 bg-[#EBEBEB] rounded shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 bg-[#EBEBEB] rounded w-1/3" />
            <div className="h-3.5 bg-[#EBEBEB] rounded w-3/4" />
            <div className="h-3.5 bg-[#EBEBEB] rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TrendingSidebar({ posts, title = 'Trending' }: TrendingSidebarProps) {
  return (
    <aside className="w-full">
      {/* Header */}
      <h3 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-[#222222] mb-4">
        {title}
      </h3>

      {/* List */}
      <ol className="space-y-0">
        {posts.map((post, idx) => (
          <li key={post._id}>
            <Link
              href={`/insights/${post.slug}`}
              className="flex gap-4 py-4 border-b border-[#EBEBEB] last:border-0 group"
            >
              {/* Rank number */}
              <span className="text-[1.6rem] font-semibold leading-none shrink-0 w-7 text-right select-none text-[#DDDDDD]">
                {idx + 1}
              </span>

              <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
                {/* Category */}
                {post.category?.name && (
                  <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#717171]">
                    {post.category.name}
                  </span>
                )}

                {/* Title */}
                <h4 className="text-[13px] font-semibold text-[#222222] leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
                  {post.title}
                </h4>

                {/* Meta */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#717171] mt-0.5">
                  <Clock className="w-3 h-3" />
                  {post.readingTimeMinutes} min
                  <span className="text-[#DDDDDD]">·</span>
                  {formatInsightDate(post.publishedAt)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}