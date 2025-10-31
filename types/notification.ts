export enum NotificationType {
  INQUIRY = 'inquiry',
  FAVORITE = 'favorite',
  PROPERTY_UPDATE = 'property_update',
  MESSAGE = 'message',
  SYSTEM = 'system',
}

export interface NotificationMetadata {
  propertyId?: string;
  inquiryId?: string;
  senderId?: string;
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


