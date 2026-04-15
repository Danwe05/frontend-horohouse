import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full bg-white px-6 font-sans selection:bg-blue-100">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Massive 404 Typography */}
        <h1 className="text-[120px] leading-none font-bold text-blue-600 tracking-tighter">
          404
        </h1>
        
        {/* Clean Airbnb-style Headline */}
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
          We can't seem to find that page.
        </h2>
        
        {/* Subtle Description */}
        <p className="text-base text-[#717171] leading-relaxed">
          The link you followed may be broken, or the page may have been removed. Let's get you back to finding your perfect place.
        </p>
        
        {/* Primary Action */}
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-10 py-4 bg-blue-600 text-white rounded-full font-semibold text-base hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            Back to Home
          </Link>
        </div>
        
      </div>
    </div>
  );
}