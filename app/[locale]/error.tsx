'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans antialiased bg-white">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        
        {/* Icon Container */}
        <div className="w-14 h-14 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-7 h-7 text-[#FF385C]" strokeWidth={1.5} />
        </div>

        {/* Text Content */}
        <h2 className="text-[22px] font-semibold tracking-tight text-[#222222] mb-2">
          Something went wrong
        </h2>
        <p className="text-[15px] text-[#717171] mb-8 leading-relaxed max-w-sm">
          {error.message || "We encountered an unexpected issue while loading this page. Please try again or contact support if the problem persists."}
        </p>

        {/* Primary Action Button */}
        <button
          onClick={reset}
          className="bg-[#222222] hover:bg-black text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl transition-all active:scale-[0.98] w-full sm:w-auto"
        >
          Try again
        </button>
        
      </div>
    </div>
  );
}