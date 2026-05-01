import Link from 'next/link';
import { ArrowLeft, FileSearch } from 'lucide-react';

export default function InsightNotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#F7F7F7] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileSearch className="w-8 h-8 text-[#BBBBBB]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#222222] mb-2">Article not found</h1>
        <p className="text-[15px] text-[#717171] leading-relaxed mb-8">
          This article doesn't exist or hasn't been published yet.
          It may have been moved, deleted, or is still a draft.
        </p>
        <Link
          href="/insights"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-[#333333] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Insights
        </Link>
      </div>
    </main>
  );
}
