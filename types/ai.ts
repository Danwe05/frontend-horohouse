// types/ai.ts - ALIGNED WITH apiProperty.ts

import { Property, PropertyType, ListingType } from '@/lib/propertyApi';

// Message type for AI chat
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  hasVoice?: boolean;
  properties?: Property[];  // Using Property from apiProperty.ts
}

// Property search filters for AI chat
export interface PropertySearchFilters {
  propertyType?: PropertyType | string;  // Support both enum and string
  listingType?: ListingType | 'rent' | 'sale';
  city?: string;
  state?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
}

// Settings for AI chat
export interface Settings {
  voiceOutput: boolean;
  language: "fr" | "en";
  responseMode: "short" | "detailed";
}

// Conversation history
export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  messageCount: number;
}

// Hook options
export interface UseAiChatOptions {
  autoSave?: boolean;
  onError?: (error: Error) => void;
  sessionId?: string;
}

// Hook return type
export interface UseAiChatReturn {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  error: Error | null;
  sessionId: string;
  currentFilters: PropertySearchFilters | null;
  sendMessage: (content: string) => Promise<void>;
  refineSearch: (refinement: string) => Promise<void>;
  clearMessages: () => void;
  resetChat: () => void;
  loadSession: (sessionId: string) => void;
}

// Re-export Property and related types for convenience
export type { Property, PropertyType, ListingType } from '@/lib/propertyApi';