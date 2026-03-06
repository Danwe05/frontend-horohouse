// hooks/useAiChat.ts - USING apiProperty.ts TYPES
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/lib/api';
import type { Property } from '@/lib/propertyApi';
import type { Message, PropertySearchFilters, UseAiChatOptions, UseAiChatReturn } from '@/types/ai';

// API Property type (what backend returns - minimal version)
interface ApiProperty {
  _id?: string;
  id?: string;
  title: string;
  price: number;
  currency?: string;
  type?: string;
  listingType?: string;
  description?: string;
  city?: string;
  address?: string;
  state?: string;
  neighborhood?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  amenities?: any;
  images?: Array<{ url: string; publicId?: string } | string>;
  videos?: any[];
  contactPhone?: string;
  contactEmail?: string;
  area?: number;
  yearBuilt?: number;
  floorNumber?: number;
  totalFloors?: number;
  pricePerSqm?: number;
  status?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  viewsCount?: number;
  ownerId?: any;
  agentId?: any;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const INITIAL_MESSAGE: Message = {
  id: uuidv4(),
  role: 'assistant',
  content: "Bonjour ! Je suis votre assistant immobilier HoroHouse. Comment puis-je vous aider à trouver le bien de vos rêves aujourd'hui ?",
  timestamp: new Date(),
};

/**
 * Transform API property to frontend Property type (from apiProperty.ts)
 */
function transformApiProperty(apiProp: ApiProperty): Property | null {
  try {
    // Get property ID
    const id = (apiProp._id || apiProp.id)?.toString();
    if (!id) return null;
    
    // Get image - handle different formats
    let images: any[] = [];
    if (apiProp.images && Array.isArray(apiProp.images)) {
      images = apiProp.images.map(img => {
        if (typeof img === 'string') {
          return { url: img };
        } else if (img && typeof img === 'object' && 'url' in img) {
          return img;
        }
        return null;
      }).filter(Boolean);
    }
    
    // Extract amenities with proper structure
    const amenities = apiProp.amenities || {};
    const propertyAmenities = {
      bedrooms: amenities.bedrooms || apiProp.bedrooms || undefined,
      bathrooms: amenities.bathrooms || apiProp.bathrooms || undefined,
      parkingSpaces: amenities.parkingSpaces || undefined,
      hasGarden: amenities.hasGarden || false,
      hasPool: amenities.hasPool || false,
      hasGym: amenities.hasGym || false,
      hasSecurity: amenities.hasSecurity || false,
      hasElevator: amenities.hasElevator || false,
      hasBalcony: amenities.hasBalcony || false,
      hasAirConditioning: amenities.hasAirConditioning || false,
      hasInternet: amenities.hasInternet || false,
      hasGenerator: amenities.hasGenerator || false,
      furnished: amenities.furnished || false,
    };
    
    // Extract owner info
    const ownerId = apiProp.ownerId || apiProp.owner || {};
    const ownerUser = {
      id: ownerId._id || ownerId.id || id,
      name: ownerId.name || 'Owner',
      email: ownerId.email,
      phoneNumber: ownerId.phoneNumber || apiProp.contactPhone || '',
      role: ownerId.role || 'agent',
      profilePicture: ownerId.profilePicture,
      agency: ownerId.agency,
      licenseNumber: ownerId.licenseNumber,
    };
    
    // Extract agent info if available
    let agentId;
    if (apiProp.agentId || apiProp.agent) {
      const agent = apiProp.agentId || apiProp.agent || {};
      agentId = {
        id: agent._id || agent.id || id,
        name: agent.name || 'Agent',
        email: agent.email,
        phoneNumber: agent.phoneNumber || '',
        role: agent.role || 'agent',
        profilePicture: agent.profilePicture,
        agency: agent.agency,
        licenseNumber: agent.licenseNumber,
      };
    }
    
    return {
      id,
      title: apiProp.title || 'Untitled Property',
      price: typeof apiProp.price === 'number' ? apiProp.price : 0,
      currency: apiProp.currency || 'XAF',
      type: apiProp.type as any || 'apartment',
      listingType: apiProp.listingType as any || 'sale',
      description: apiProp.description || '',
      city: apiProp.city || '',
      address: apiProp.address || '',
      state: apiProp.state || '',
      neighborhood: apiProp.neighborhood,
      country: apiProp.country || 'Cameroon',
      latitude: apiProp.latitude,
      longitude: apiProp.longitude,
      amenities: propertyAmenities,
      images: images.length > 0 ? images : undefined,
      videos: apiProp.videos,
      contactPhone: apiProp.contactPhone,
      contactEmail: apiProp.contactEmail,
      area: apiProp.area,
      yearBuilt: apiProp.yearBuilt,
      floorNumber: apiProp.floorNumber,
      totalFloors: apiProp.totalFloors,
      pricePerSqm: apiProp.pricePerSqm,
      status: apiProp.status as any,
      availability: apiProp.status as any,
      isVerified: apiProp.isVerified || false,
      isFeatured: apiProp.isFeatured || false,
      isActive: apiProp.isActive !== false,
      viewsCount: apiProp.viewsCount || 0,
      ownerId: ownerUser as any,
      agentId: agentId as any,
      slug: apiProp.slug,
      createdAt: apiProp.createdAt || new Date().toISOString(),
      updatedAt: apiProp.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error transforming property:', error, apiProp);
    return null;
  }
}

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { autoSave = true, onError, sessionId: providedSessionId } = options;

  const [sessionId, setSessionId] = useState(() => providedSessionId || uuidv4());
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PropertySearchFilters | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages from localStorage on mount or session change
  useEffect(() => {
    if (autoSave && typeof window !== 'undefined' && sessionId) {
      loadMessagesFromStorage(sessionId);
      setIsInitialized(true);
    }
  }, [sessionId, autoSave]);

  // Save messages to localStorage whenever they change (after initialization)
  useEffect(() => {
    if (autoSave && typeof window !== 'undefined' && isInitialized && messages.length > 0) {
      saveMessagesToStorage(sessionId, messages, currentFilters);
    }
  }, [messages, currentFilters, sessionId, autoSave, isInitialized]);

  const loadMessagesFromStorage = (sid: string) => {
    try {
      const savedData = localStorage.getItem(`chat-session-${sid}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const loadedMessages = (parsed.messages || parsed).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        
        setMessages(loadedMessages.length > 0 ? loadedMessages : [INITIAL_MESSAGE]);
        
        if (parsed.currentFilters) {
          setCurrentFilters(parsed.currentFilters);
        }
        
        console.log(`Loaded ${loadedMessages.length} messages for session ${sid}`);
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    } catch (e) {
      console.error('Failed to load saved messages:', e);
      setMessages([INITIAL_MESSAGE]);
    }
  };

  const saveMessagesToStorage = (sid: string, msgs: Message[], filters: PropertySearchFilters | null) => {
    try {
      const dataToSave = {
        messages: msgs,
        currentFilters: filters,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`chat-session-${sid}`, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('token');
      
      // Use the current messages state + the new user message for history
      const currentMessages = [...messages, userMessage];
      const formattedHistory = currentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      console.log(`Sending ${formattedHistory.length} messages as conversation history`);

      const response = isAuthenticated 
        ? await apiClient.processAiChat({
            message: content,
            sessionId,
            conversationHistory: formattedHistory,
            currentFilters: currentFilters || undefined,
          })
        : await apiClient.processAiChatGuest({
            message: content,
            sessionId,
            conversationHistory: formattedHistory,
            currentFilters: currentFilters || undefined,
          });

      // Transform API properties to frontend Property type
      const transformedProperties: Property[] = (response.properties || [])
        .map((apiProp: ApiProperty) => transformApiProperty(apiProp))
        .filter((prop: any): prop is Property => prop !== null);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.message || response.response || "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date(response.timestamp || new Date()),
        properties: transformedProperties.length > 0 ? transformedProperties : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.hasFilters && response.filters) {
        setCurrentFilters(response.filters);
      }

      setIsTyping(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error('Send message error:', err);
      const error = new Error(err.message || 'Failed to send message');
      setError(error);
      
      if (onError) {
        onError(error);
      }

      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "Désolé, j'ai rencontré une erreur. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, sessionId, currentFilters, onError]);

  const refineSearch = useCallback(async (refinement: string) => {
    if (!refinement.trim() || !currentFilters) {
      throw new Error('Current filters are required to refine search');
    }

    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: refinement.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const currentMessages = [...messages, userMessage];
      const formattedHistory = currentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const response = await apiClient.refineAiSearch({
        message: refinement,
        currentFilters,
        conversationHistory: formattedHistory,
      });

      // Transform API properties
      const transformedProperties: Property[] = (response.properties || [])
        .map((apiProp: ApiProperty) => transformApiProperty(apiProp))
        .filter((prop: any): prop is Property => prop !== null);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.message || response.response,
        timestamp: new Date(response.timestamp || new Date()),
        properties: transformedProperties.length > 0 ? transformedProperties : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentFilters(response.filters);
      setIsTyping(false);
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to refine search');
      setError(error);
      
      if (onError) {
        onError(error);
      }

      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "Désolé, j'ai rencontré une erreur lors du raffinage de la recherche.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, currentFilters, onError]);

  const clearMessages = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentFilters(null);
    setError(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`chat-session-${sessionId}`);
    }
  }, [sessionId]);

  const resetChat = useCallback(() => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([INITIAL_MESSAGE]);
    setCurrentFilters(null);
    setError(null);
    setIsInitialized(false);
  }, []);

  const loadSession = useCallback((sid: string) => {
    setSessionId(sid);
    setIsInitialized(false);
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    error,
    sessionId,
    currentFilters,
    sendMessage,
    refineSearch,
    clearMessages,
    resetChat,
    loadSession,
  };
}