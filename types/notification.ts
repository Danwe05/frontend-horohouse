export enum NotificationType {
  // ── Existing ────────────────────────────────────────────────────────────
  INQUIRY = 'inquiry',
  FAVORITE = 'favorite',
  PROPERTY_UPDATE = 'property_update',
  MESSAGE = 'message',
  SYSTEM = 'system',

  // ── Booking lifecycle ────────────────────────────────────────────────────
  BOOKING_REQUEST = 'booking_request',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_COMPLETED = 'booking_completed',

  // ── Review lifecycle ─────────────────────────────────────────────────────
  REVIEW_REQUEST = 'review_request',
  REVIEW_RECEIVED = 'review_received',
  REVIEW_PUBLISHED = 'review_published',
  REVIEW_RESPONSE = 'review_response',

  // ── Payment ──────────────────────────────────────────────────────────────
  PAYMENT_RECEIVED = 'payment_received',
  REFUND_PROCESSED = 'refund_processed',
}

export interface NotificationMetadata {
  propertyId?: string;
  inquiryId?: string;
  senderId?: string;
  // ── Booking/Review/Payment ───────────────────────────────────────────────
  bookingId?: string;
  reviewId?: string;
  checkIn?: string;
  checkOut?: string;
  guestName?: string;
  hostName?: string;
  propertyTitle?: string;
  amount?: number;
  currency?: string;
  [key: string]: any;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: NotificationMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationQueryParams {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}


