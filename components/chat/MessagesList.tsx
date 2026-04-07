import { Search, MessageCircle, Archive, Inbox, MapPin, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';

interface MessagesListProps {
  onConversationSelect?: () => void;
}

export function MessagesList({ onConversationSelect }: MessagesListProps) {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    unreadCount,
    onlineUsers,
    isConnected,
    loadConversations,
  } = useChatContext();
  const { t } = useLanguage();
  const s = (t as any)?.messages || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'general' | 'archive'>('general');
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount - DON'T WAIT FOR SOCKET
  useEffect(() => {
    console.log('MessagesList: Component mounted');
    console.log('Conversations from context:', conversations.length);

    // Just set loading to false after a short delay
    // ChatContext handles loading on mount now
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [conversations.length]);

  // Filter conversations based on search and archive status
  const filteredConversations = useMemo(() => {
    console.log('Filtering conversations:', {
      total: conversations.length,
      filter,
      searchQuery,
    });

    return conversations.filter(conv => {
      // Filter by archive status
      const isArchived = conv.archivedBy?.includes(user?.id || '');
      if (filter === 'archive' && !isArchived) return false;
      if (filter === 'general' && isArchived) return false;

      // Filter by search query
      if (searchQuery) {
        const otherUser = conv.otherUser ||
          conv.participants.find(p => p.userId._id !== user?.id)?.userId;
        const searchLower = searchQuery.toLowerCase();
        return (
          otherUser?.name?.toLowerCase().includes(searchLower) ||
          conv.lastMessage?.content?.toLowerCase().includes(searchLower) ||
          conv.propertyId?.title?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [conversations, searchQuery, filter, user?.id]);

  const handleConversationClick = (conv: any) => {
    console.log('Selected conversation:', conv._id);
    setActiveConversation(conv);
    onConversationSelect?.();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return s.yesterday || 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const archivedCount = conversations.filter(conv =>
    conv.archivedBy?.includes(user?.id || '')
  ).length;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-[#EBEBEB] shrink-0">
        <h1 className="text-[26px] font-semibold text-[#222222] mb-5 tracking-tight">{s.messagesTitle || 'Messages'}</h1>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 px-4 py-2 bg-[#FFF7ED] border border-[#C2410C]/20 rounded-xl flex items-center gap-2.5">
            <div className="w-2 h-2 bg-[#C2410C] rounded-full animate-pulse"></div>
            <span className="text-[13px] font-medium text-[#C2410C]">{s.connectingMsg || 'Connecting to chat server...'}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('general')}
            className={cn(
              "px-5 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-colors focus:outline-none",
              filter === 'general'
                ? "bg-blue-600 text-white"
                : "bg-white text-[#717171] hover:bg-[#F7F7F7] border border-transparent hover:border-[#EBEBEB]"
            )}
          >
            <Inbox className="w-4 h-4 stroke-[2]" />
            {s.general || 'General'}
            {unreadCount > 0 && (
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] ml-1",
                filter === 'general' ? "bg-white text-[#222222]" : "bg-[#FF385C] text-white"
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setFilter('archive')}
            className={cn(
              "px-5 py-2.5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-colors focus:outline-none",
              filter === 'archive'
                ? "bg-blue-600 text-white"
                : "bg-white text-[#717171] hover:bg-[#F7F7F7] border border-transparent hover:border-[#EBEBEB]"
            )}
          >
            <Archive className="w-4 h-4 stroke-[2]" />
            {s.archive || 'Archive'}
            {archivedCount > 0 && (
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] ml-1",
                filter === 'archive' ? "bg-white text-[#222222]" : "bg-[#EBEBEB] text-[#222222]"
              )}>
                {archivedCount > 99 ? '99+' : archivedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171]" />
          <Input
            placeholder={s.searchConversations || 'Search messages...'}
            className="pl-11 h-12 bg-[#F7F7F7] border-transparent rounded-xl text-[15px] focus-visible:ring-1 focus-visible:ring-[#222222] placeholder:text-[#717171]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#222222] mb-4 stroke-[2.5]" />
            <p className="text-[14px] font-semibold text-[#717171]">{s.loadingConversations || 'Loading conversations...'}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center mb-5">
              {searchQuery ? (
                <Search className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
              ) : filter === 'archive' ? (
                <Archive className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
              ) : (
                <MessageCircle className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
              )}
            </div>
            <h3 className="font-semibold text-[18px] text-[#222222] mb-2">
              {searchQuery
                ? (s.noConversationsFound || "No results found")
                : filter === 'archive'
                  ? (s.noArchivedConversations || "No archived messages")
                  : (s.noConversationsYet || "No messages yet")}
            </h3>
            <p className="text-[15px] text-[#717171] mb-6 max-w-[250px]">
              {searchQuery
                ? (s.tryDifferentSearch || "Try searching for a different name or keyword.")
                : filter === 'archive'
                  ? (s.archivedAppearHere || "Messages you archive will appear here.")
                  : (s.startConversationDesc || "When you contact a host or tenant, your messages will show up here.")}
            </p>
            {!searchQuery && filter === 'general' && (
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[15px] transition-colors active:scale-[0.98]"
              >
                {s.browseProperties || "Explore listings"}
              </button>
            )}
          </div>
        ) : (
          // Conversations
          <div className="flex flex-col">
            {filteredConversations.map((conv) => {
              const otherUser = conv.otherUser ||
                conv.participants.find(p => p.userId._id !== user?.id)?.userId;
              const isOnline = otherUser && onlineUsers.has(otherUser._id);
              const isActive = activeConversation?._id === conv._id;
              const conversationUnreadCount = conv.unreadCount || 0;
              const hasUnread = conversationUnreadCount > 0;

              return (
                <button
                  key={conv._id}
                  onClick={() => handleConversationClick(conv)}
                  className={cn(
                    "w-full p-5 flex items-start gap-4 hover:bg-[#F7F7F7] transition-colors border-b border-[#EBEBEB] text-left focus:outline-none group",
                    isActive && "bg-[#F7F7F7]"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#EBEBEB] border border-[#DDDDDD] flex items-center justify-center">
                      {otherUser?.profilePicture ? (
                        <img src={otherUser.profilePicture} alt={otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[16px] font-bold text-[#222222]">
                          {otherUser?.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#008A05] border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <h3 className={cn(
                        "text-[16px] truncate",
                        hasUnread ? "font-bold text-[#222222]" : "font-semibold text-[#222222]"
                      )}>
                        {otherUser?.name || (s.unknownUser || "Unknown User")}
                      </h3>
                      <span className={cn(
                        "text-[13px] whitespace-nowrap shrink-0",
                        hasUnread ? "font-bold text-[#222222]" : "font-medium text-[#717171]"
                      )}>
                        {conv.lastMessage?.createdAt && formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className={cn(
                        "text-[14px] truncate flex-1",
                        hasUnread ? "font-bold text-[#222222]" : "text-[#717171]"
                      )}>
                        {conv.lastMessage?.content || (s.noMessagesYetStr || "No messages yet")}
                      </p>
                      {hasUnread && (
                        <span className="bg-[#FF385C] text-white text-[11px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 shrink-0">
                          {conversationUnreadCount > 99 ? '99+' : conversationUnreadCount}
                        </span>
                      )}
                    </div>

                    {conv.propertyId && (
                      <p className="text-[13px] flex items-center gap-1.5 text-[#717171] mt-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{conv.propertyId.title}</span>
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}