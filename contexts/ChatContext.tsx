'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
    // FIX: tempId for optimistic message replacement
    tempId?: string;
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
    // FIX: Accept current user info so we can build optimistic messages
    currentUser?: {
        id?: string;
        _id?: string;
        name?: string;
        profilePicture?: string;
    };
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, token, apiUrl, currentUser }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // FIX: Keep a stable ref to the current user for optimistic messages
    const currentUserRef = useRef(currentUser);
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    // FIX: Keep a ref to the active conversation so socket handlers can read it
    const activeConversationRef = useRef<Conversation | null>(null);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

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

    // Load conversations IMMEDIATELY on mount
    useEffect(() => {
        if (!token) return;
        loadConversations();
    }, [token, loadConversations]);
    // Initialize socket connection
    useEffect(() => {
        if (!token) {
            console.warn('⚠️ No token provided to ChatProvider');
            return;
        }

        console.group('🔌 Initializing Socket Connection');
        console.log('API URL:', apiUrl);

        let socketUrl = apiUrl;
        socketUrl = socketUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
        socketUrl = socketUrl.replace(/\/$/, '');

        console.log('Full socket URL:', `${socketUrl}/chat`);
        console.groupEnd();

        const newSocket = io(`${socketUrl}/chat`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
            autoConnect: true,
            forceNew: false,
        });

        newSocket.on('connect', () => {
            console.log('✅ Chat socket connected! Socket ID:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('connection:success', (data) => {
            console.log('✅ Connection confirmed by server:', data);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                setTimeout(() => {
                    if (!newSocket.connected) {
                        newSocket.connect();
                    }
                }, 2000);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        newSocket.on('unauthorized', (error) => {
            console.error('🔐 Unauthorized:', error);
            setIsConnected(false);
        });

        // ============================================
        // MESSAGE EVENTS
        // ============================================

        newSocket.on('message:new', (data: { message: Message }) => {
            console.log('📩 New message received:', data.message._id);

            const senderId = typeof data.message.senderId === 'object'
                ? data.message.senderId._id?.toString()
                : (data.message.senderId as any)?.toString();

            const isOwnMessage = senderId === (currentUserRef.current?.id || currentUserRef.current?._id)?.toString();

            setMessages((prev) => {
                if (prev.some(m => m._id === data.message._id)) return prev;
                return [...prev, data.message];
            });

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

            if (!isOwnMessage) {
                playNotificationSound();
            }
        });

        // FIX: Replace optimistic temp message with real server message using tempId
        newSocket.on('message:sent', (data: { message: Message & { tempId?: string } }) => {
            console.log('✅ Message sent confirmation, tempId:', data.message.tempId);

            setMessages((prev) => {
                // Remove the optimistic temp message by tempId
                const withoutTemp = data.message.tempId
                    ? prev.filter(m => m._id !== data.message.tempId)
                    : prev;

                // Avoid duplicates by real _id
                if (withoutTemp.some(m => m._id === data.message._id)) return withoutTemp;

                return [...withoutTemp, data.message];
            });

            // Update last message in conversations list
            setConversations((prev) =>
                prev.map((conv) =>
                    conv._id === data.message.conversationId
                        ? {
                            ...conv,
                            lastMessage: {
                                content: data.message.content || '',
                                createdAt: data.message.createdAt,
                            },
                        }
                        : conv
                )
            );
        });

        newSocket.on('typing:start', (data: { conversationId: string; userId: string }) => {
            if (activeConversationRef.current?._id === data.conversationId) {
                setTypingUsers((prev) => new Set(prev).add(data.userId));
            }
        });

        newSocket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
            });
        });

        newSocket.on('messages:read', (data: { messageIds: string[] }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    data.messageIds.includes(msg._id)
                        ? { ...msg, status: 'read', readAt: new Date().toISOString() }
                        : msg
                )
            );
        });

        // ============================================
        // USER STATUS EVENTS
        // ============================================

        newSocket.on('user:status', (data: { userId: string; status: string }) => {
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

        return () => {
            console.log('🔌 Closing socket connection');
            newSocket.offAny();
            newSocket.close();
        };
    }, [token, apiUrl]);

    // Load messages
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            console.log('📥 Loading messages for:', conversationId);
            const data = await apiClient.getMessages(conversationId);
            setMessages(data.messages || []);

            if (socket?.connected) {
                socket.emit('conversation:join', { conversationId });
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error);
        }
    }, [socket]);

    // Create conversation
    const createConversation = useCallback(async (
        participantId: string,
        propertyId?: string,
        initialMessage?: string
    ): Promise<Conversation> => {
        try {
            const conversation = await apiClient.createConversation({
                participantId,
                propertyId,
                initialMessage,
            });

            setConversations((prev) => {
                const exists = prev.find(c => c._id === conversation._id);
                if (!exists) return [conversation, ...prev];
                return prev;
            });

            setActiveConversation(conversation);
            return conversation;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create conversation';
            throw new Error(errorMessage);
        }
    }, []);

    // FIX: sendMessage with optimistic update
    const sendMessage = useCallback((conversationId: string, content: string, type: string = 'text') => {
        if (!socket || !socket.connected) {
            console.error('❌ Socket not connected, cannot send message');
            return;
        }

        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const user = currentUserRef.current;
        const userId = user?.id || user?._id || '';

        // FIX: Add optimistic message immediately so it shows on the RIGHT side instantly
        const optimisticMessage: Message = {
            _id: tempId,
            conversationId,
            senderId: {
                _id: userId,
                name: user?.name || '',
                profilePicture: user?.profilePicture,
            },
            recipientId: '',
            type,
            content,
            status: 'sending',
            createdAt: new Date().toISOString(),
            tempId,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        playSentSound();

        console.log('📤 Sending message via socket:', {
            conversationId,
            contentPreview: content.substring(0, 50),
            type,
            tempId,
        });

        socket.emit('message:send', {
            conversationId,
            content,
            type,
            tempId,
        });
    }, [socket]);

    // Mark messages as read
    const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
        if (!socket || !socket.connected) return;

        socket.emit('messages:read', { conversationId, messageIds });

        setMessages((prev) =>
            prev.map((msg) =>
                messageIds.includes(msg._id)
                    ? { ...msg, status: 'read', readAt: new Date().toISOString() }
                    : msg
            )
        );

        setConversations((prev) =>
            prev.map((conv) =>
                conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
            )
        );
    }, [socket]);

    const startTyping = useCallback((conversationId: string) => {
        if (!socket || !socket.connected) return;
        socket.emit('typing:start', { conversationId, isTyping: true });
    }, [socket]);

    const stopTyping = useCallback((conversationId: string) => {
        if (!socket || !socket.connected) return;
        socket.emit('typing:stop', { conversationId, isTyping: false });
    }, [socket]);

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
        setActiveConversation,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping,
        loadConversations,
        loadMessages,
        createConversation,
        activeCall: null,
        callStatus: 'connected',
        setActiveCall: function (call: Call | null): void {
            throw new Error('Function not implemented.');
        },
        setCallStatus: function (status: CallStatus): void {
            throw new Error('Function not implemented.');
        }
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// AFTER
const playSound = (src: string, volume = 0.3) => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
        try {
            const audio = new Audio(src);
            audio.volume = volume;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
};

const playNotificationSound = () => playSound('/sounds/notification.mp3');  // incoming message
const playSentSound = () => playSound('/sounds/sent.wav');           // outgoing message
export const playRingtone = () => playSound('/sounds/ringtone.mp3', 0.5); // incoming call