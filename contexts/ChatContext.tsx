// contexts/ChatContext.tsx - FIXED VERSION
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';

interface Attachment {
    url: string;
    publicId: string;
    filename: string;
    size: number;
    mimeType: string;
}

interface PropertyReference {
    propertyId: string;
    title: string;
    price: number;
    image: string;
    address: string;
    city: string;
}

interface Message {
    _id: string;
    conversationId: string;
    senderId: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    recipientId: string;
    type: string;
    content?: string;
    status: string;
    createdAt: string;
    readAt?: string;
    deliveredAt?: string;
    attachments?: Attachment[];
    propertyReference?: PropertyReference;
    isEdited?: boolean;
    editedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}

interface Conversation {
    _id: string;
    participants: Array<{
        userId: {
            _id: string;
            name: string;
            email?: string;
            profilePicture?: string;
        };
        unreadCount: number;
    }>;
    propertyId?: {
        _id: string;
        title: string;
        images: Array<{ url: string }>;
        price: number;
    };
    lastMessage?: {
        content: string;
        createdAt: string;
    };
    unreadCount?: number;
    otherUser?: any;
    archivedBy?: string[];
    isArchived?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface Call {
    _id: string;
    conversationId: string;
    initiatorId: string;
    recipientId: string;
    type: 'audio' | 'video';
    status: 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'missed';
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    endReason?: string;
    metadata?: {
        sdp?: any;
        candidates?: any[];
    };
    participants?: Array<{
        userId: string;
        status: string;
        joinedAt?: string;
        leftAt?: string;
    }>;
}

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'missed';

interface ChatContextType {
    socket: Socket | null;
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    isConnected: boolean;
    unreadCount: number;
    typingUsers: Set<string>;
    onlineUsers: Set<string>;
    activeCall: Call | null;
    callStatus: CallStatus;
    setActiveConversation: (conversation: Conversation | null) => void;
    setActiveCall: (call: Call | null) => void;
    setCallStatus: (status: CallStatus) => void;
    sendMessage: (conversationId: string, content: string, type?: string) => void;
    markAsRead: (conversationId: string, messageIds: string[]) => void;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    loadConversations: () => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    createConversation: (participantId: string, propertyId?: string, initialMessage?: string) => Promise<Conversation>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: React.ReactNode;
    token: string;
    apiUrl: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, token, apiUrl }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');

    // Load conversations - INDEPENDENT OF SOCKET
    const loadConversations = useCallback(async () => {
        try {
            console.group('📥 Loading Conversations (REST API)');
            console.log('Token available:', !!token);

            const data = await apiClient.getConversations();

            console.log('✅ API Response:', {
                conversationsCount: data.conversations?.length || 0,
            });
            console.groupEnd();

            setConversations(data.conversations || []);

            // Calculate total unread count
            const total = (data.conversations || []).reduce(
                (acc: number, conv: Conversation) => acc + (conv.unreadCount || 0),
                0
            );
            setUnreadCount(total);

            console.log(`✅ Loaded ${data.conversations?.length || 0} conversations`);
        } catch (error: any) {
            console.group('❌ Error Loading Conversations');
            console.error('Error:', error);
            console.error('Response:', error.response?.data);
            console.error('Status:', error.response?.status);
            console.groupEnd();
        }
    }, [token]);

    // Load conversations IMMEDIATELY on mount (don't wait for socket)
    useEffect(() => {
        console.log('🚀 ChatProvider mounted - loading conversations immediately');
        loadConversations();
    }, [loadConversations]);

    // Initialize socket connection
    useEffect(() => {
        if (!token) {
            console.warn('⚠️ No token provided to ChatProvider');
            return;
        }

        console.group('🔌 Initializing Socket Connection');
        console.log('API URL:', apiUrl);
        console.log('Token preview:', token.substring(0, 30) + '...');

        // FIXED: Properly extract base URL
        let socketUrl = apiUrl;
        
        // Remove /api/v1 or /api from the end
        socketUrl = socketUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
        
        // Ensure no trailing slash
        socketUrl = socketUrl.replace(/\/$/, '');

        console.log('Base URL:', socketUrl);
        console.log('Socket namespace:', '/chat');
        console.log('Full socket URL:', `${socketUrl}/chat`);
        console.groupEnd();

        const newSocket = io(`${socketUrl}/chat`, {
            auth: { 
                token  // Server expects { token: "your-jwt-token" }
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
            autoConnect: true,
            forceNew: false,
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ Chat socket connected!');
            console.log('   Socket ID:', newSocket.id);
            console.log('   Transport:', newSocket.io.engine.transport.name);
            console.log('   Auth token sent:', !!token);
            setIsConnected(true);
        });

        newSocket.on('connection:success', (data) => {
            console.log('✅ Connection confirmed by server:', data);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket disconnected:', reason);
            console.warn('   Disconnect details:', {
                reason,
                willReconnect: reason === 'io server disconnect' ? 'No (server kicked)' : 'Yes (auto-reconnect)'
            });
            setIsConnected(false);
            
            // If server disconnected us, try to reconnect manually
            if (reason === 'io server disconnect') {
                console.log('🔄 Server disconnected - will attempt manual reconnect in 2s...');
                setTimeout(() => {
                    if (!newSocket.connected) {
                        console.log('🔄 Attempting manual reconnection...');
                        newSocket.connect();
                    }
                }, 2000);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', {
                message: error.message,
                description: error,
                type: error.constructor.name,
            });
            setIsConnected(false);
            
            // Check if it's an auth error
            if (error.message.includes('auth') || error.message.includes('unauthorized')) {
                console.error('🔐 Authentication error - token may be invalid');
            }
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        // Auth error event (if your server emits this)
        newSocket.on('unauthorized', (error) => {
            console.error('🔐 Unauthorized:', error);
            setIsConnected(false);
        });

        // ============================================
        // MESSAGE EVENTS
        // ============================================

        newSocket.on('message:new', (data: { message: Message }) => {
            console.log('📩 New message received:', data.message);
            setMessages((prev) => [...prev, data.message]);

            // Update conversation's last message
            setConversations((prev) =>
                prev.map((conv) =>
                    conv._id === data.message.conversationId
                        ? {
                            ...conv,
                            lastMessage: {
                                content: data.message.content || '',
                                createdAt: data.message.createdAt,
                            },
                            unreadCount: (conv.unreadCount || 0) + 1,
                        }
                        : conv
                )
            );

            playNotificationSound();
        });

        newSocket.on('message:sent', (data: { message: Message }) => {
            console.log('✅ Message sent confirmation:', data.message);
            setMessages((prev) => [...prev, data.message]);
        });

        // Typing indicators
        newSocket.on('typing:start', (data: { conversationId: string; userId: string }) => {
            console.log('⌨️ User typing:', data.userId);
            if (activeConversation?._id === data.conversationId) {
                setTypingUsers((prev) => new Set(prev).add(data.userId));
            }
        });

        newSocket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
            console.log('⌨️ User stopped typing:', data.userId);
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
            });
        });

        // Read receipts
        newSocket.on('messages:read', (data: { messageIds: string[] }) => {
            console.log('📖 Messages read:', data.messageIds.length);
            setMessages((prev) =>
                prev.map((msg) =>
                    data.messageIds.includes(msg._id)
                        ? { ...msg, status: 'read', readAt: new Date().toISOString() }
                        : msg
                )
            );
        });

        // ============================================
        // CALL EVENTS
        // ============================================

        newSocket.on('call:incoming', (data: { call: Call; initiator: any }) => {
            console.log('📞 Incoming call:', data);
            setActiveCall(data.call);
            setCallStatus('ringing');
            playNotificationSound();
        });

        newSocket.on('call:answered', (data: { call: Call; sdpAnswer: any }) => {
            console.log('✅ Call answered:', data);
            setActiveCall(data.call);
            setCallStatus('connecting');
        });

        newSocket.on('call:declined', (data: { call: Call; reason?: string }) => {
            console.log('❌ Call declined:', data);
            setCallStatus('declined');
            setTimeout(() => {
                setActiveCall(null);
                setCallStatus('idle');
            }, 2000);
        });

        newSocket.on('call:ended', (data: { call: Call; reason?: string }) => {
            console.log('📵 Call ended:', data);
            setCallStatus('ended');
            setTimeout(() => {
                setActiveCall(null);
                setCallStatus('idle');
            }, 2000);
        });

        newSocket.on('call:missed', (data: { call: Call }) => {
            console.log('📵 Call missed:', data);
            setCallStatus('missed');
            setTimeout(() => {
                setActiveCall(null);
                setCallStatus('idle');
            }, 2000);
        });

        newSocket.on('call:status', (data: { callId: string; status: string }) => {
            console.log('📊 Call status update:', data);
            if (data.status === 'connected') {
                setCallStatus('connected');
            }
        });

        newSocket.on('call:ice-candidate', (data: { callId: string; candidate: any }) => {
            console.log('🧊 ICE candidate received');
            // This will be handled by useVideoCall hook
        });

        // ============================================
        // USER STATUS EVENTS
        // ============================================

        newSocket.on('user:status', (data: { userId: string; status: string }) => {
            console.log('👤 User status:', data.userId, data.status);
            if (data.status === 'online') {
                setOnlineUsers((prev) => new Set(prev).add(data.userId));
            } else {
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(data.userId);
                    return newSet;
                });
            }
        });

        setSocket(newSocket);

        // Cleanup
        return () => {
            console.log('🔌 Closing socket connection');
            newSocket.off('connect');
            newSocket.off('connection:success');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.off('error');
            newSocket.off('unauthorized');
            newSocket.off('message:new');
            newSocket.off('message:sent');
            newSocket.off('typing:start');
            newSocket.off('typing:stop');
            newSocket.off('messages:read');
            newSocket.off('call:incoming');
            newSocket.off('call:answered');
            newSocket.off('call:declined');
            newSocket.off('call:ended');
            newSocket.off('call:missed');
            newSocket.off('call:status');
            newSocket.off('call:ice-candidate');
            newSocket.off('user:status');
            newSocket.close();
        };
    }, [token, apiUrl, activeConversation]);

    // Load messages - USE API CLIENT
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            console.log('📥 Loading messages for:', conversationId);
            const data = await apiClient.getMessages(conversationId);
            setMessages(data.messages || []);

            // Join conversation room via socket (if connected)
            if (socket?.connected) {
                socket.emit('conversation:join', { conversationId });
                console.log('🔌 Joined conversation room via socket');
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error);
        }
    }, [socket]);

    // Create conversation - USE API CLIENT
    const createConversation = useCallback(async (
        participantId: string,
        propertyId?: string,
        initialMessage?: string
    ): Promise<Conversation> => {
        try {
            console.log('🔵 Creating conversation:', {
                participantId,
                propertyId,
                hasMessage: !!initialMessage,
            });

            const conversation = await apiClient.createConversation({
                participantId,
                propertyId,
                initialMessage,
            });

            console.log('✅ Conversation created:', conversation);

            // Add to conversations list if new
            setConversations((prev) => {
                const exists = prev.find(c => c._id === conversation._id);
                if (!exists) {
                    return [conversation, ...prev];
                }
                return prev;
            });

            // Set as active conversation
            setActiveConversation(conversation);

            return conversation;
        } catch (error: any) {
            console.error('❌ Error creating conversation:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create conversation';
            throw new Error(errorMessage);
        }
    }, []);

    // Send message
    const sendMessage = useCallback((conversationId: string, content: string, type: string = 'text') => {
        if (!socket || !socket.connected) {
            console.error('❌ Socket not connected, cannot send message');
            return;
        }

        console.log('📤 Sending message via socket:', { 
            conversationId, 
            contentPreview: content.substring(0, 50),
            type 
        });

        const tempId = `temp_${Date.now()}`;

        socket.emit('message:send', {
            conversationId,
            content,
            type,
            tempId,
        });
    }, [socket]);

    // Mark messages as read
    const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
        if (!socket || !socket.connected) {
            console.log('⚠️ Socket not connected, skipping mark as read');
            return;
        }

        console.log('📖 Marking messages as read:', messageIds.length);

        socket.emit('messages:read', {
            conversationId,
            messageIds,
        });

        // Update local state immediately
        setMessages((prev) =>
            prev.map((msg) =>
                messageIds.includes(msg._id)
                    ? { ...msg, status: 'read', readAt: new Date().toISOString() }
                    : msg
            )
        );

        // Update conversation unread count
        setConversations((prev) =>
            prev.map((conv) =>
                conv._id === conversationId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );
    }, [socket]);

    // Start typing
    const startTyping = useCallback((conversationId: string) => {
        if (!socket || !socket.connected) return;
        socket.emit('typing:start', { conversationId, isTyping: true });
    }, [socket]);

    // Stop typing
    const stopTyping = useCallback((conversationId: string) => {
        if (!socket || !socket.connected) return;
        socket.emit('typing:stop', { conversationId, isTyping: false });
    }, [socket]);

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation._id);
        } else {
            setMessages([]);
            setTypingUsers(new Set());
        }
    }, [activeConversation, loadMessages]);

    const value: ChatContextType = {
        socket,
        conversations,
        activeConversation,
        messages,
        isConnected,
        unreadCount,
        typingUsers,
        onlineUsers,
        activeCall,
        callStatus,
        setActiveConversation,
        setActiveCall,
        setCallStatus,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping,
        loadConversations,
        loadMessages,
        createConversation,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Helper function to play notification sound
const playNotificationSound = () => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
};