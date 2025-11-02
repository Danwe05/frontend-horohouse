import axios, { AxiosInstance } from 'axios';
import { Property, PropertyType, ListingType } from '@/components/property/PropertyCard';
import { authService } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

export interface PropertySearchResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreatePropertyDto {
  title: string;
  price: number;
  type: PropertyType;
  listingType: ListingType;
  description: string;
  city: string;
  address: string;
  state: string;
  neighborhood?: string;
  country: string;
  latitude: number;
  longitude: number;
  amenities?: any;
  images?: any[];
  contactPhone?: string;
  contactEmail?: string;
  area?: number;
  yearBuilt?: number;
  keywords?: string[];
  nearbyAmenities?: string[];
  transportAccess?: string[];
}

export interface UpdatePropertyDto extends Partial<CreatePropertyDto> {
  availability?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}

class PropertyService {
    private api: AxiosInstance;
  
    constructor() {
      this.api = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      this.setupInterceptors();
    }
  
    private setupInterceptors() {
      // Request interceptor to add auth token
      this.api.interceptors.request.use(
        (config: any) => {
          if (typeof window !== 'undefined') {
            const token = authService.getAccessToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
          return config;
        },
        (error) => Promise.reject(error)
      );
  
      // Response interceptor for token refresh
      this.api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
  
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
  
            try {
              const refreshedTokens = await authService.refreshToken();
              if (refreshedTokens) {
                return this.api(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              await authService.logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
              }
            }
          }
  
          return Promise.reject(error);
        }
      );
    }

  /**
   * Search properties with filters and options
   */
  async searchProperties(
    filters: PropertySearchFilters = {},
    options: PropertySearchOptions = {}
  ): Promise<PropertySearchResponse> {
    try {
      const params = {
        ...filters,
        ...options,
      };
      
      const response = await this.api.get('', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error searching properties:', error);
      
      if (error.response?.data?.message) {
        throw new Error(`API Error: ${error.response.data.message}`);
      }
      throw new Error('Failed to search properties');
    }
  }

  /**
   * Search properties by text
   */
  async searchByText(
    searchText: string,
    filters: PropertySearchFilters = {},
    options: PropertySearchOptions = {}
  ): Promise<PropertySearchResponse> {
    try {
      const response = await this.api.get('/search', {
        params: {
          q: searchText,
          ...filters,
          ...options,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching properties by text:', error);
      throw new Error('Failed to search properties');
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<Property> {
    try {
      // Validate ObjectId format (24-character hexadecimal string)
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error(`Invalid property ID format: ${id}. Expected 24-character hexadecimal string.`);
      }
      
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching property:', error);
      if (error.message?.includes('Invalid property ID format')) {
        throw error;
      }
      throw new Error('Failed to fetch property');
    }
  }

  /**
   * Get nearby properties
   */
  async getNearbyProperties(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    limit: number = 10
  ): Promise<Property[]> {
    try {
      const response = await this.api.get('/nearby', {
        params: {
          latitude,
          longitude,
          radius: radiusKm,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby properties:', error);
      throw new Error('Failed to fetch nearby properties');
    }
  }

  /**
   * Get most viewed properties
   */
  async getMostViewed(limit: number = 10): Promise<Property[]> {
    try {
      const response = await this.api.get('/most-viewed', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching most viewed properties:', error);
      throw new Error('Failed to fetch most viewed properties');
    }
  }

  /**
   * Get recent properties
   */
  async getRecent(limit: number = 10): Promise<Property[]> {
    try {
      const response = await this.api.get('/recent', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent properties:', error);
      throw new Error('Failed to fetch recent properties');
    }
  }

  /**
   * Get featured properties
   */
  async getFeatured(limit: number = 10): Promise<Property[]> {
    try {
      const response = await this.api.get('/featured', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      throw new Error('Failed to fetch featured properties');
    }
  }

  /**
 * Get current user's properties
 */
async getMyProperties(
  filters: PropertySearchFilters = {},
  options: PropertySearchOptions = {}
): Promise<PropertySearchResponse> {
  try {
    const params = {
      ...filters,
      ...options,
    };
    
    const response = await this.api.get('/my/properties', {
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user properties:', error);
    
    if (error.response?.data?.message) {
      throw new Error(`API Error: ${error.response.data.message}`);
    }
    throw new Error('Failed to fetch user properties');
  }
}

  /**
   * Get popular cities
   */
  async getPopularCities(limit: number = 10): Promise<Array<{ city: string; count: number }>> {
    try {
      const response = await this.api.get('/popular-cities', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular cities:', error);
      throw new Error('Failed to fetch popular cities');
    }
  }

  /**
   * Create a new property
   */
  async createProperty(propertyData: CreatePropertyDto): Promise<Property> {
    try {
      const response = await this.api.post('/proprieties', propertyData);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw new Error('Failed to create property');
    }
  }

  /**
   * Update property
   */
  async updateProperty(id: string, propertyData: UpdatePropertyDto): Promise<Property> {
    try {
      const response = await this.api.patch(`/${id}`, propertyData);
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw new Error('Failed to update property');
    }
  }

  /**
   * Delete property
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw new Error('Failed to delete property');
    }
  }

  /**
   * Add property to favorites
   */
  async addFavorite(propertyId: string): Promise<void> {
    try {
      await this.api.post(`/${propertyId}/favorite`);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  }

  /**
   * Remove property from favorites
   */
  async removeFavorite(propertyId: string): Promise<void> {
    try {
      await this.api.delete(`/${propertyId}/favorite`);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  }

  /**
   * Geocode address
   */
async geocodeAddress(address: string, city?: string, country?: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const payload: Record<string, string> = { address };

    if (city) payload.city = city;
    if (country) payload.country = country;

    const response = await this.api.post('/geocode', payload);
    return response.data || null;
  } catch (error: any) {
    console.error('Error geocoding address:', error);

    if (error.response?.status === 400 && error.response?.data?.message === 'Address not found') {
      console.warn('Address not found during geocoding:', address);
      return null;
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Geocoding service temporarily unavailable');
    }
    
    return null;
  }
}


  /**
   * Upload property images
   */
  async uploadImages(propertyId: string, files: File[]): Promise<any[]> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await this.api.post(`/${propertyId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete property image
   */
  async deleteImage(propertyId: string, imageId: string): Promise<void> {
    try {
      await this.api.delete(`/${propertyId}/images/${imageId}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
}

export const propertyService = new PropertyService();
export default propertyService;