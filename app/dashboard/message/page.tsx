'use client';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import MessageList from '@/components/dashboard/MessageList';
import ChatIntro from '@/components/dashboard/ChatIntro';
import Conversation from '@/components/dashboard/Conversation';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { MobileNav } from '@/components/chat/MobileNav';
import { MessagesList } from '@/components/chat/MessagesList';
import { ChatThread } from '@/components/chat/ChatThread';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MessagesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { t } = useLanguage();
  const s = (t as any)?.messages || {};

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    console.group('📱 Messages Page Initialization');
    console.log('State:', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      hasToken: !!token,
      apiUrl,
    });
    console.groupEnd();

    // Wait for auth to finish loading
    if (isLoading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/auth/login?redirect=/dashboard/message');
      return;
    }

    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      console.log('🔑 Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'Not found');

      if (!accessToken) {
        console.log('❌ No access token, redirecting to login');
        router.push('/auth/login?redirect=/dashboard/message');
        return;
      }

      setToken(accessToken);
      setIsInitializing(false);
      console.log('✅ Messages page initialized successfully');
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Show loading while checking auth or getting token
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-500 animate-pulse">{s.loadingMessages || 'Loading messages...'}</p>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold mb-2">{s.authRequired || 'Authentication Required'}</h2>
            <p className="text-muted-foreground mb-4">{s.pleaseLogin || 'Please log in to view your messages'}</p>
          </div>
          <button
            onClick={() => router.push('/auth/login?redirect=/dashboard/message')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            {s.goToLogin || 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  // Show error if no token
  if (!token) {
    return (

      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold mb-2">{s.authError || 'Authentication Error'}</h2>
            <p className="text-muted-foreground mb-4">{s.sessionExpired || 'Your session has expired. Please log in again.'}</p>
          </div>
          <button
            onClick={() => router.push('/auth/login?redirect=/dashboard/message')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            {s.goToLogin || 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  // Render with ChatProvider
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar - Slimmer */}
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden w-full h-full">
          <NavDash />

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col overflow-hidden w-full relative">
            <ChatProvider token={token} apiUrl={apiUrl} currentUser={user}>
              <div className="flex h-full w-full overflow-hidden">
                {/* Messages List - Hidden on mobile when thread is shown */}
                <div className={`h-full shrink-0 ${showMobileThread ? 'hidden md:block' : 'block w-full md:w-auto'}`}>
                  <MessagesList onConversationSelect={() => setShowMobileThread(true)} />
                </div>

                {/* Chat Thread - Hidden on mobile when list is shown */}
                <div className={`flex-1 h-full min-w-0 ${showMobileThread ? 'block' : 'hidden md:block'}`}>
                  <ChatThread onBack={() => setShowMobileThread(false)} />
                </div>
              </div>
            </ChatProvider>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}