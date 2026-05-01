'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { InsightCategory } from '@/types/insights';

interface CategoryChipsProps {
  categories: InsightCategory[];
  activeSlug?: string | null;
  navigateToPage?: boolean;
  onSelect?: (slug: string | null) => void;
}

const ALL_SLUG = '__all__';

export function CategoryChipsSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-9 rounded-full bg-[#EBEBEB] animate-pulse shrink-0"
          style={{ width: `${70 + i * 15}px` }}
        />
      ))}
    </div>
  );
}

export default function CategoryChips({
  categories,
  activeSlug,
  navigateToPage = false,
  onSelect,
}: CategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = activeSlug ?? ALL_SLUG;

  const handleClick = (slug: string) => {
    const isAll = slug === ALL_SLUG;

    if (onSelect) {
      onSelect(isAll ? null : slug);
      return;
    }

    if (navigateToPage && !isAll) {
      router.push(`/insights/category/${slug}`);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (isAll) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const chips = [
    { _id: ALL_SLUG, name: 'All', slug: ALL_SLUG },
    ...categories,
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {chips.map((cat) => {
        const isActive = cat.slug === active || (cat.slug === ALL_SLUG && !activeSlug);

        return (
          <button
            key={cat._id}
            onClick={() => handleClick(cat.slug)}
            className={[
              'whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium transition-colors shrink-0 border',
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-[#222222] border-[#DDDDDD] hover:border-[#B0B0B0]',
            ].join(' ')}
          >
            {cat.name}
            {(cat as InsightCategory).postCount !== undefined && !isActive && (
              <span className="ml-1.5 text-[11px] text-[#717171]">
                {(cat as InsightCategory).postCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}