'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new callback page
    router.replace('/auth/callback');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}