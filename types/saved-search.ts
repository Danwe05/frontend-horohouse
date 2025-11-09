export enum SearchFrequency {
  INSTANT = 'instant',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never',
}

export interface SearchCriteria {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  listingType?: string;
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
  notificationFrequency: SearchFrequency;
  isActive: boolean;
  resultsCount: number;
  lastNotificationSent?: string;
  lastChecked?: string;
  newMatchingProperties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchDto {
  name: string;
  searchCriteria: SearchCriteria;
  notificationFrequency?: SearchFrequency;
  isActive?: boolean;
}

export interface UpdateSavedSearchDto {
  name?: string;
  searchCriteria?: SearchCriteria;
  notificationFrequency?: SearchFrequency;
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