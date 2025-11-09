import apiClient from './api';

export interface SearchCriteria {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  listingType?: string;
  city?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface SavedSearch {
  _id: string;
  userId: string;
  name: string;
  searchCriteria: SearchCriteria;
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  isActive: boolean;
  resultsCount: number;
  newMatchingProperties: string[];
  lastChecked: Date;
  lastNotificationSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavedSearchDto {
  name: string;
  searchCriteria: SearchCriteria;
  notificationFrequency?: 'instant' | 'daily' | 'weekly' | 'never';
  isActive?: boolean;
}

export interface UpdateSavedSearchDto {
  name?: string;
  searchCriteria?: SearchCriteria;
  notificationFrequency?: 'instant' | 'daily' | 'weekly' | 'never';
  isActive?: boolean;
}

export interface SavedSearchStatistics {
  totalSearches: number;
  activeSearches: number;
  totalNewMatches: number;
  byFrequency: {
    instant: number;
    daily: number;
    weekly: number;
    never: number;
  };
  totalResults: number;
}

class SavedSearchesApi {
  /**
   * Create a new saved search
   */
  async create(data: CreateSavedSearchDto): Promise<SavedSearch> {
    const response = await apiClient.request({
      method: 'POST',
      url: '/saved-searches',
      data,
    });
    return response;
  }

  /**
   * Get all saved searches for current user
   */
  async getAll(): Promise<SavedSearch[]> {
    const response = await apiClient.request({
      method: 'GET',
      url: '/saved-searches',
    });
    return response;
  }

  /**
   * Get a specific saved search
   */
  async getById(id: string): Promise<SavedSearch> {
    const response = await apiClient.request({
      method: 'GET',
      url: `/saved-searches/${id}`,
    });
    return response;
  }

  /**
   * Update a saved search
   */
  async update(id: string, data: UpdateSavedSearchDto): Promise<SavedSearch> {
    const response = await apiClient.request({
      method: 'PATCH',
      url: `/saved-searches/${id}`,
      data,
    });
    return response;
  }

  /**
   * Delete a saved search
   */
  async delete(id: string): Promise<void> {
    await apiClient.request({
      method: 'DELETE',
      url: `/saved-searches/${id}`,
    });
  }

  /**
   * Get matching properties for a saved search
   */
  async getMatchingProperties(
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    properties: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.request({
      method: 'GET',
      url: `/saved-searches/${id}/properties`,
      params: { page, limit },
    });
    return response;
  }

  /**
   * Get statistics for user's saved searches
   */
  async getStatistics(): Promise<SavedSearchStatistics> {
    const response = await apiClient.request({
      method: 'GET',
      url: '/saved-searches/statistics',
    });
    return response;
  }
}

export const savedSearchesApi = new SavedSearchesApi();
export default savedSearchesApi;