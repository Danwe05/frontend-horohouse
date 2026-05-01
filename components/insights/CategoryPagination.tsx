import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function pageUrl(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export default function CategoryPagination({
  currentPage,
  totalPages,
  basePath,
}: CategoryPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).reduce<
    (number | 'ellipsis')[]
  >((acc, p, idx, arr) => {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      if (acc.length > 0 && typeof acc[acc.length - 1] === 'number') {
        const last = acc[acc.length - 1] as number;
        if (p - last > 1) acc.push('ellipsis');
      }
      acc.push(p);
    }
    return acc;
  }, []);

  return (
    <div className="flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link
          href={pageUrl(basePath, currentPage - 1)}
          className="p-2 rounded-full border border-[#DDDDDD] hover:border-[#B0B0B0] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#222222]" />
        </Link>
      ) : (
        <span className="p-2 rounded-full border border-[#EBEBEB] opacity-30 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4 text-[#222222]" />
        </span>
      )}

      {pages.map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-[#717171] text-[14px]">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageUrl(basePath, item as number)}
            className={`w-9 h-9 rounded-full text-[14px] font-medium transition-colors flex items-center justify-center ${
              item === currentPage
                ? 'bg-[#222222] text-white'
                : 'text-[#222222] hover:bg-[#F7F7F7] border border-[#DDDDDD]'
            }`}
          >
            {item}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={pageUrl(basePath, currentPage + 1)}
          className="p-2 rounded-full border border-[#DDDDDD] hover:border-[#B0B0B0] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#222222]" />
        </Link>
      ) : (
        <span className="p-2 rounded-full border border-[#EBEBEB] opacity-30 cursor-not-allowed">
          <ChevronRight className="w-4 h-4 text-[#222222]" />
        </span>
      )}
    </div>
  );
}