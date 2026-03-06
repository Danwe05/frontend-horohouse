// contexts/ChatProviderWrapper.tsx
'use client';

import { ChatProvider } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function ChatProviderWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Check if we're on a chat-related page
  const isChatPage = pathname?.startsWith('/messages') || pathname?.startsWith('/chat');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && mounted) {
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        setToken(accessToken);
      }
    } else if (!isAuthenticated) {
      setToken(null);
    }
  }, [isAuthenticated, isLoading, mounted]);

  // Always render children, but only wrap with ChatProvider when ready
  if (!mounted || isLoading) {
    return <>{children}</>;
  }

  // If authenticated and has token, wrap with ChatProvider
  if (isAuthenticated && token) {
    return (
      <ChatProvider token={token} apiUrl={apiUrl}>
        {children}
      </ChatProvider>
    );
  }

  // If on chat page but not authenticated/no token, show loading or redirect will handle
  if (isChatPage && (!isAuthenticated || !token)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For non-chat pages without auth, just render children
  return <>{children}</>;
}