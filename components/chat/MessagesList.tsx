import { Search, MessageCircle, Archive, Inbox } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";

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
      return 'Yesterday';
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
    <div className="w-full md:w-[320px] bg-white border-r border-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-700">Connecting to chat server...</span>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setFilter('general')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
              filter === 'general'
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Inbox className="w-4 h-4" />
            General 
            {unreadCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setFilter('archive')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
              filter === 'archive'
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Archive className="w-4 h-4" />
            Archive 
            {archivedCount > 0 && (
              <span className="bg-foreground/10 px-2 py-0.5 rounded-full text-xs">
                {archivedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted border-0 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              {searchQuery ? (
                <Search className="w-8 h-8 text-muted-foreground" />
              ) : filter === 'archive' ? (
                <Archive className="w-8 h-8 text-muted-foreground" />
              ) : (
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery 
                ? "No conversations found" 
                : filter === 'archive'
                ? "No archived conversations"
                : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? "Try a different search term" 
                : filter === 'archive'
                ? "Archived conversations will appear here"
                : "Start a conversation by contacting a property owner"}
            </p>
            {!searchQuery && filter === 'general' && (
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Browse Properties
              </button>
            )}
          </div>
        ) : (
          // Conversations
          filteredConversations.map((conv) => {
            const otherUser = conv.otherUser || 
              conv.participants.find(p => p.userId._id !== user?.id)?.userId;
            const isOnline = otherUser && onlineUsers.has(otherUser._id);
            const isActive = activeConversation?._id === conv._id;
            const conversationUnreadCount = conv.unreadCount || 0;

            return (
              <button
                key={conv._id}
                onClick={() => handleConversationClick(conv)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border text-left",
                  isActive && "bg-muted/50"
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={otherUser?.profilePicture} />
                    <AvatarFallback>{otherUser?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm flex items-center gap-1 truncate">
                      {otherUser?.name || "Unknown User"}
                      {isOnline && (
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {conv.lastMessage?.createdAt && formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                    {conversationUnreadCount > 0 && (
                      <Badge className="ml-2 bg-primary text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full border-0 shrink-0 px-1.5">
                        {conversationUnreadCount > 99 ? '99+' : conversationUnreadCount}
                      </Badge>
                    )}
                  </div>
                  {conv.propertyId && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      📍 {conv.propertyId.title}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}