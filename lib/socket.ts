import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

interface SocketEvents {
  connected: (data: { userId: string; socketId: string; timestamp: string; activeConnections: number }) => void;
  notification: (notification: any) => void;
  unreadCount: (data: { count: number; timestamp: string }) => void;
  notificationRead: (data: { notificationId: string; timestamp: string }) => void;
  allNotificationsRead: (data: { timestamp: string }) => void;
  notificationDeleted: (data: { notificationId: string; timestamp: string }) => void;
  systemNotification: (notification: any) => void;
  error: (error: { message: string }) => void;
  disconnect: (reason: string) => void;
  pong: (data: { timestamp: string; serverTime: number }) => void;
  status: (data: { connected: boolean; userId: string; socketId: string; activeConnections: number; timestamp: string }) => void;
  subscribed: (data: { userId: string; timestamp: string }) => void;
}

type SocketEventHandler<K extends keyof SocketEvents> = SocketEvents[K];

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;
  private eventHandlers: Map<keyof SocketEvents, Set<Function>> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize socket connection
   */
  connect(): Socket | null {
    // Prevent multiple connections
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    const token = authService.getAccessToken();
    if (!token) {
      console.warn('⚠️ Cannot connect socket: No access token');
      return null;
    }

    // Determine API base and socket URL. The backend uses a global prefix
    // for REST routes (e.g. '/api/v1') but Socket.IO is mounted at the root
    // and exposes the 'notifications' namespace at '/notifications'. If
    // NEXT_PUBLIC_API_URL includes '/api/v1' we must strip it when building
    // the socket URL.
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    // Strip common REST prefix like /api or /api/v1 so socket connects to root
    const socketBase = API_URL.replace(/\/api\/(v\d+|v\d+\/)?$/i, '').replace(/\/api\/v\d+$/i, '').replace(/\/$/, '') || API_URL;
    const socketUrl = `${socketBase}/notifications`;

    console.log('🔌 Initializing socket connection to (API_URL):', API_URL);
    console.log('🔌 Socket base (stripped):', socketBase);
    console.log('🔌 Connecting to namespace URL:', socketUrl);
    console.log('🔌 Token (first 20 chars):', token.substring(0, 20) + '...');

    // Connect directly to the notifications namespace on the socket server
    this.socket = io(socketUrl, {
      // Socket.IO default path is '/socket.io' at the server root. Keep it explicit
      // in case the server or proxy changes it.
      path: '/socket.io/',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
    });

    // ❌ OLD (WRONG):
    // this.socket = io(`${API_URL}/notifications`, { ... });
    // This tries to connect with /notifications as part of the base URL
    
    // ✅ NEW (CORRECT):
    // Connect to base URL, Socket.IO will handle namespace routing

    this.setupEventListeners();
    this.startHealthCheck();

    return this.socket;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('🔌 Socket.IO connected, socket ID:', this.socket?.id);
    });

    this.socket.on('connected', (data: any) => {
      console.log('✅ WebSocket authenticated and ready:', data);
      this.reconnectAttempts = 0;
      this.isManualDisconnect = false;
      this.emitToHandlers('connected', data);
    });

    // New notification received
    this.socket.on('notification', (notification: any) => {
      console.log('📬 New notification received:', notification);
      this.emitToHandlers('notification', notification);
    });

    // Unread count update
    this.socket.on('unreadCount', (data: any) => {
      console.log('📊 Unread count updated:', data.count);
      this.emitToHandlers('unreadCount', data);
    });

    // Notification marked as read
    this.socket.on('notificationRead', (data: any) => {
      console.log('✓ Notification marked as read:', data.notificationId);
      this.emitToHandlers('notificationRead', data);
    });

    // All notifications marked as read
    this.socket.on('allNotificationsRead', (data: any) => {
      console.log('✓ All notifications marked as read');
      this.emitToHandlers('allNotificationsRead', data);
    });

    // Notification deleted
    this.socket.on('notificationDeleted', (data: any) => {
      console.log('🗑️ Notification deleted:', data.notificationId);
      this.emitToHandlers('notificationDeleted', data);
    });

    // System notification
    this.socket.on('systemNotification', (notification: any) => {
      console.log('📢 System notification:', notification);
      this.emitToHandlers('systemNotification', notification);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      this.emitToHandlers('error', error);
    });

    // Connection error
    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Connection error:', error.message);
      console.error('❌ Full error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason: any) => {
      console.log('🔌 Socket disconnected:', reason);
      this.emitToHandlers('disconnect', reason);

      // Auto-reconnect unless manually disconnected
      if (!this.isManualDisconnect && reason !== 'io client disconnect') {
        console.log('🔄 Attempting to reconnect...');
        setTimeout(() => this.connect(), this.reconnectDelay * (this.reconnectAttempts + 1));
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attempt: any) => {
      console.log(`🔄 Reconnection attempt ${attempt}...`);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attempt: any) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      this.reconnectAttempts = 0;
    });

    // Pong response (health check)
    this.socket.on('pong', (data: any) => {
      console.log('🏓 Pong received:', data);
      this.emitToHandlers('pong', data);
    });

    // Status response
    this.socket.on('status', (data: any) => {
      console.log('📊 Status:', data);
      this.emitToHandlers('status', data);
    });
  }

  /**
   * Emit event to registered handlers
   */
  private emitToHandlers<K extends keyof SocketEvents>(
    event: K,
    data: Parameters<SocketEvents[K]>[0]
  ) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error: any) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Register event handler
   */
  on<K extends keyof SocketEvents>(
    event: K,
    handler: SocketEventHandler<K>
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as Function);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler as Function);
      }
    };
  }

  /**
   * Remove event handler
   */
  off<K extends keyof SocketEvents>(
    event: K,
    handler?: SocketEventHandler<K>
  ) {
    if (!handler) {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
    } else {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler as Function);
      }
    }
  }

  /**
   * Send ping to check connection health
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Request current connection status
   */
  getStatus() {
    if (this.socket?.connected) {
      this.socket.emit('getStatus');
    }
  }

  /**
   * Subscribe to notifications (manual)
   */
  subscribeToNotifications() {
    if (this.socket?.connected) {
      this.socket.emit('subscribeToNotifications');
    }
  }

  /**
   * Start health check interval
   */
  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop health check interval
   */
  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    console.log('🔌 Disconnecting socket...');
    this.isManualDisconnect = true;
    this.stopHealthCheck();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clear all event handlers
    this.eventHandlers.clear();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Reconnect with new token (useful after token refresh)
   */
  reconnectWithNewToken() {
    console.log('🔄 Reconnecting with new token...');
    this.disconnect();
    setTimeout(() => this.connect(), 500);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;