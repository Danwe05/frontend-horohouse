'use client';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { MessagesList } from '@/components/chat/MessagesList';
import { ChatThread } from '@/components/chat/ChatThread';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#222222] mb-4 stroke-[2.5]" />
        <p className="text-[15px] font-semibold text-[#222222]">{s.loadingMessages || 'Loading messages...'}</p>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white px-6 text-center">
        <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-6 border border-[#EBEBEB]">
          <MessageCircle className="h-8 w-8 text-[#222222] stroke-[1.5]" />
        </div>
        <h2 className="text-[22px] font-semibold text-[#222222] mb-2">{s.authRequired || 'Authentication required'}</h2>
        <p className="text-[15px] text-[#717171] mb-8 max-w-sm">
          {s.pleaseLogin || 'Please log in to view your messages and communicate with hosts or tenants.'}
        </p>
        <button
          onClick={() => router.push('/auth/login?redirect=/dashboard/message')}
          className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[15px] transition-colors active:scale-[0.98]"
        >
          {s.goToLogin || 'Go to login'}
        </button>
      </div>
    );
  }

  // Show error if no token
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white px-6 text-center">
        <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-6 border border-[#EBEBEB]">
          <MessageCircle className="h-8 w-8 text-[#222222] stroke-[1.5]" />
        </div>
        <h2 className="text-[22px] font-semibold text-[#222222] mb-2">{s.authError || 'Session expired'}</h2>
        <p className="text-[15px] text-[#717171] mb-8 max-w-sm">
          {s.sessionExpired || 'Your session has expired. Please log in again to continue messaging.'}
        </p>
        <button
          onClick={() => router.push('/auth/login?redirect=/dashboard/message')}
          className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[15px] transition-colors active:scale-[0.98]"
        >
          {s.goToLogin || 'Go to login'}
        </button>
      </div>
    );
  }

  // Render with ChatProvider
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-white">
        {/* Sidebar */}
        <AppSidebar />
        
        <SidebarInset className="flex flex-col flex-1 overflow-hidden w-full h-full border-l border-[#EBEBEB] bg-white">
          <NavDash />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden w-full relative">
            <ChatProvider token={token} apiUrl={apiUrl} currentUser={user}>
              <div className="flex h-full w-full overflow-hidden">
                
                {/* Messages List - Hidden on mobile when thread is shown */}
                <div 
                  className={`h-full shrink-0 border-r border-[#EBEBEB] bg-white ${
                    showMobileThread 
                      ? 'hidden md:block md:w-[350px] lg:w-[400px]' 
                      : 'block w-full md:w-[350px] lg:w-[400px]'
                  }`}
                >
                  <MessagesList onConversationSelect={() => setShowMobileThread(true)} />
                </div>

                {/* Chat Thread - Hidden on mobile when list is shown */}
                <div 
                  className={`flex-1 h-full min-w-0 bg-white ${
                    showMobileThread 
                      ? 'block' 
                      : 'hidden md:block'
                  }`}
                >
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