// lib/apiProperty.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { authService } from './auth';

// ====================
// TYPE DEFINITIONS
// ====================

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  STUDIO = 'studio',
  DUPLEX = 'duplex',
  OFFICE = 'office',
  SHOP = 'shop',
  WAREHOUSE = 'warehouse',
  LAND = 'land',
  PENTHOUSE = 'penthouse',
}

export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SOLD = 'sold',
  RENTED = 'rented',
  UNDER_REVIEW = 'under_review',
}

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  REGISTERED_USER = 'registered_user',
  GUEST = 'guest',
}

export interface PropertyAmenities {
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  hasSecurity?: boolean;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasAirConditioning?: boolean;
  hasInternet?: boolean;
  hasGenerator?: boolean;
  furnished?: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: UserRole;
  profilePicture?: string;
  agency?: string;
  licenseNumber?: string;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  currency?: string;
  type: PropertyType;
  listingType: ListingType;
  description: string;
  city: string;
  address: string;
  state: string;
  neighborhood?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  amenities?: PropertyAmenities;
  images?: any[];
  videos?: any[];
  contactPhone?: string;
  contactEmail?: string;
  area?: number;
  yearBuilt?: number;
  floorNumber?: number;
  totalFloors?: number;
  pricePerSqm?: number;
  depositAmount?: number;
  maintenanceFee?: number;
  keywords?: string[];
  nearbyAmenities?: string[];
  transportAccess?: string[];
  virtualTourUrl?: string;
  videoUrl?: string;
  status?: PropertyStatus;
  availability?: PropertyStatus;
  isVerified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  viewsCount?: number;
  ownerId: User;
  agentId?: User;
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySearchFilters {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  listingType?: ListingType;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface PropertySearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export interface CreatePropertyDto {
  title: string;
  price: number;
  currency?: string;
  type: PropertyType;
  listingType: ListingType;
  description: string;
  city: string;
  address: string;
  state: string;
  neighborhood?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  amenities?: PropertyAmenities;
  images?: any[];
  videos?: any[];
  contactPhone?: string;
  contactEmail?: string;
  area?: number;
  yearBuilt?: number;
  floorNumber?: number;
  totalFloors?: number;
  pricePerSqm?: number;
  depositAmount?: number;
  maintenanceFee?: number;
  keywords?: string[];
  nearbyAmenities?: string[];
  transportAccess?: string[];
  virtualTourUrl?: string;
  videoUrl?: string;
  status?: PropertyStatus;
}

export interface UpdatePropertyDto extends Partial<CreatePropertyDto> {
  availability?: PropertyStatus;
  isVerified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface PaginatedPropertiesResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PopularCity {
  city: string;
  count: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// ====================
// API CLIENT CLASS
// ====================

export class PropertyApiClient {
  private api: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = authService.getAccessToken(); // Use authService method
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newTokens = await authService.refreshToken();
        if (newTokens && newTokens.accessToken) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return this.api(originalRequest);
        } else {
          // Refresh failed, redirect to login
          authService.logout();
          if (typeof window !== 'undefined') {
            // Use Next.js router if available, otherwise fallback to window.location
            if (window.location.pathname !== '/auth/login') {
              window.location.href = '/auth/login';
            }
          }
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed:', refreshError);
        authService.logout();
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
  }

  isAuthenticated(): boolean {
    return authService.isLoggedIn();
  }

  getCurrentToken(): string | null {
    return authService.getAccessToken();
  }

  // ====================
  // PROPERTY MANAGEMENT
  // ====================

  /**
   * Create a new property (Agents & Admins only)
   */
  async createProperty(propertyData: CreatePropertyDto): Promise<Property> {
    const response: AxiosResponse<Property> = await this.api.post('/properties', propertyData);
    return response.data;
  }

  /**
   * Get all properties with filtering and search
   */
  async getAllProperties(
    filters: PropertySearchFilters = {},
    options: PropertySearchOptions = {}
  ): Promise<PaginatedPropertiesResponse> {
    const params: Record<string, any> = { ...filters, ...options };

    if (params.bounds) {
      params.bounds = JSON.stringify(params.bounds);
    }

    if (Array.isArray(params.amenities)) {
      params.amenities = (params.amenities as string[]).join(',');
    }

    const response: AxiosResponse<PaginatedPropertiesResponse> = await this.api.get('/properties', {
      params,
    });
    return response.data;
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<Property> {
    const response: AxiosResponse<Property> = await this.api.get(`/properties/${id}`);
    return response.data;
  }

  /**
   * Update property (Owner/Agent/Admin only)
   */
  async updateProperty(id: string, updateData: UpdatePropertyDto): Promise<Property> {
    const response: AxiosResponse<Property> = await this.api.patch(`/properties/${id}`, updateData);
    return response.data;
  }

  /**
   * Delete property (Owner/Admin only)
   */
  async deleteProperty(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/properties/${id}`);
    return response.data;
  }

  // ====================
  // PROPERTY SEARCH & DISCOVERY
  // ====================

  /**
   * Find properties near a location
   */
  async findNearbyProperties(
    latitude: number,
    longitude: number,
    radius: number = 5,
    limit: number = 10
  ): Promise<Property[]> {
    const response: AxiosResponse<Property[]> = await this.api.get('/properties/nearby', {
      params: { latitude, longitude, radius, limit },
    });
    return response.data;
  }

  /**
   * Search properties by text
   */
  async searchPropertiesByText(
    query: string,
    filters: PropertySearchFilters = {},
    options: PropertySearchOptions = {}
  ): Promise<PaginatedPropertiesResponse> {
    const params = { q: query, ...filters, ...options };
    const response: AxiosResponse<PaginatedPropertiesResponse> = await this.api.get('/properties/search', {
      params,
    });
    return response.data;
  }

  /**
   * Get most viewed properties
   */
  async getMostViewedProperties(limit: number = 10): Promise<Property[]> {
    const response: AxiosResponse<Property[]> = await this.api.get('/properties/most-viewed', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get recently added properties
   */
  async getRecentProperties(limit: number = 10): Promise<Property[]> {
    const response: AxiosResponse<Property[]> = await this.api.get('/properties/recent', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get featured properties
   */
  async getFeaturedProperties(limit: number = 10): Promise<Property[]> {
    const response: AxiosResponse<Property[]> = await this.api.get('/properties/featured', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get popular cities with property counts
   */
  async getPopularCities(limit: number = 10): Promise<PopularCity[]> {
    const response: AxiosResponse<PopularCity[]> = await this.api.get('/properties/popular-cities', {
      params: { limit },
    });
    return response.data;
  }

  // ====================
  // USER PROPERTY MANAGEMENT
  // ====================

  /**
   * Get current user's properties (Agents & Admins only)
   */
  async getMyProperties(
    filters: PropertySearchFilters = {},
    options: PropertySearchOptions = {}
  ): Promise<PaginatedPropertiesResponse> {
    const params = { ...filters, ...options };
    const response: AxiosResponse<PaginatedPropertiesResponse> = await this.api.get('/properties/my/properties', {
      params,
    });
    return response.data;
  }

  // ====================
  // PROPERTY STATUS MANAGEMENT
  // ====================

  /**
   * Toggle property featured status (Admin only)
   */
  async togglePropertyFeatured(id: string, isFeatured: boolean): Promise<Property> {
    const response: AxiosResponse<Property> = await this.api.patch(`/properties/${id}/feature`, {
      isFeatured,
    });
    return response.data;
  }

  /**
   * Toggle property verification status (Admin only)
   */
  async togglePropertyVerified(id: string, isVerified: boolean): Promise<Property> {
    const response: AxiosResponse<Property> = await this.api.patch(`/properties/${id}/verify`, {
      isVerified,
    });
    return response.data;
  }

  /**
   * Toggle property active status
   */
  async togglePropertyActive(id: string, isActive: boolean): Promise<Property> {
    const response: AxiosResponse<Property> = await this.api.patch(`/properties/${id}/activate`, {
      isActive,
    });
    return response.data;
  }

  // ====================
  // FAVORITES MANAGEMENT
  // ====================

  /**
   * Add property to favorites
   */
  async addToFavorites(propertyId: string): Promise<{ message: string; propertyId: string }> {
    const response: AxiosResponse<{ message: string; propertyId: string }> = await this.api.post(
      `/properties/${propertyId}/favorite`
    );
    return response.data;
  }

  /**
   * Remove property from favorites
   */
  async removeFromFavorites(propertyId: string): Promise<{ message: string; propertyId: string }> {
    const response: AxiosResponse<{ message: string; propertyId: string }> = await this.api.delete(
      `/properties/${propertyId}/favorite`
    );
    return response.data;
  }

  // ====================
  // IMAGE MANAGEMENT
  // ====================

  /**
   * Upload property images
   */
  async uploadPropertyImages(propertyId: string, files: File[]): Promise<{ message: string }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });

    const response: AxiosResponse<{ message: string }> = await this.api.post(
      `/properties/${propertyId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Delete property image
   */
  async deletePropertyImage(propertyId: string, imageId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(
      `/properties/${propertyId}/images/${imageId}`
    );
    return response.data;
  }

  /**
   * Upload property videos
   */
  async uploadPropertyVideos(propertyId: string, files: File[]): Promise<{ message: string }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`video_${index}`, file);
    });

    const response: AxiosResponse<{ message: string }> = await this.api.post(
      `/properties/${propertyId}/videos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Delete property video
   */
  async deletePropertyVideo(propertyId: string, videoId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(
      `/properties/${propertyId}/videos/${videoId}`
    );
    return response.data;
  }

  // ====================
  // UTILITY METHODS
  // ====================

  /**
   * Build query parameters for API requests
   */
  private buildQueryParams(filters: PropertySearchFilters, options: PropertySearchOptions): Record<string, any> {
    const params: Record<string, any> = {};

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'bounds') {
          params[key] = JSON.stringify(value);
        } else if (key === 'amenities' && Array.isArray(value)) {
          params[key] = value.join(',');
        } else {
          params[key] = value;
        }
      }
    });

    // Add options
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    return params;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string, persistent: boolean = false): void {
    if (typeof window !== 'undefined') {
      if (persistent) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }
}

// ====================
// SINGLETON INSTANCE
// ====================

const propertyApi = new PropertyApiClient();
export default propertyApi;

// ====================
// CONVENIENCE HOOKS (for React)
// ====================

export const usePropertyApi = () => {
  return propertyApi;
};

// ====================
// ERROR TYPES
// ====================

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: any[];
}

export class PropertyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'PropertyApiError';
  }
}

// ====================
// EXAMPLE USAGE
// ====================

/* 
Example usage in a React component:

import propertyApi, { PropertyType, ListingType } from '@/lib/apiProperty';

// Get all properties
const properties = await propertyApi.getAllProperties({
  propertyType: PropertyType.APARTMENT,
  minPrice: 50000,
  maxPrice: 200000,
  city: 'Douala',
}, {
  page: 1,
  limit: 20,
  sortBy: 'price',
  sortOrder: 'asc'
});

// Search properties
const searchResults = await propertyApi.searchPropertiesByText('luxury apartment', {
  city: 'Yaoundé',
  propertyType: PropertyType.APARTMENT
});

// Get nearby properties
const nearbyProperties = await propertyApi.findNearbyProperties(
  3.8480,  // Yaoundé latitude
  11.5021, // Yaoundé longitude
  10,      // 10km radius
  20       // limit
);

// Create new property (requires auth)
const newProperty = await propertyApi.createProperty({
  title: 'Beautiful Apartment in Douala',
  price: 85000000,
  type: PropertyType.APARTMENT,
  listingType: ListingType.SALE,
  description: 'A beautiful 3-bedroom apartment...',
  city: 'Douala',
  address: '123 Avenue de la Liberté',
  state: 'Littoral',
  country: 'Cameroon',
  amenities: {
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 1,
    hasBalcony: true,
    hasAirConditioning: true
  }
});
*/