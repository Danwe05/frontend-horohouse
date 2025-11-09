import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { authService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and handle token refresh
    this.client.interceptors.request.use(
      async (config: any) => {
        // Skip authentication for public endpoints
        if (config.skipAuth) {
          return config;
        }

        if (typeof window !== 'undefined') {
          // Check if token is expired before making the request
          if (authService.isTokenExpired()) {
            console.log('[ApiClient] Token expired, refreshing before request...');

            if (!this.isRefreshing) {
              this.isRefreshing = true;
              try {
                const refreshedTokens = await authService.refreshToken();
                if (refreshedTokens) {
                  this.isRefreshing = false;
                  this.processQueue(null, refreshedTokens.accessToken);
                  config.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;
                  return config;
                } else {
                  this.isRefreshing = false;
                  this.processQueue(new Error('Token refresh failed'), null);
                  await authService.logout();
                  if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                  }
                  return Promise.reject(new Error('Token refresh failed'));
                }
              } catch (error) {
                this.isRefreshing = false;
                this.processQueue(error, null);
                await authService.logout();
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/login';
                }
                return Promise.reject(error);
              }
            }

            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  config.headers.Authorization = `Bearer ${token}`;
                  resolve(config);
                },
                reject: (err: any) => {
                  reject(err);
                }
              });
            });
          }

          // Token is valid, add it to headers
          const token = authService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Don't retry authentication for public endpoints
        if (originalRequest.skipAuth) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(originalRequest));
                },
                reject: (err: any) => {
                  reject(err);
                }
              });
            });
          }

          this.isRefreshing = true;

          try {
            const refreshedTokens = await authService.refreshToken();
            if (refreshedTokens) {
              this.isRefreshing = false;
              this.processQueue(null, refreshedTokens.accessToken);
              originalRequest.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            this.processQueue(refreshError, null);
            // Refresh failed, redirect to login
            await authService.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.patch('/users/me', data);
    return response.data;
  }

  async updatePreferences(preferences: any) {
    const response = await this.client.patch('/users/me/preferences', preferences);
    return response.data;
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/users/me/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async addToFavorites(propertyId: string) {
    const response = await this.client.post(`/users/me/favorites/${propertyId}`);
    return response.data;
  }

  async removeFromFavorites(propertyId: string) {
    const response = await this.client.delete(`/users/me/favorites/${propertyId}`);
    return response.data;
  }

  async getRecentlyViewed(limit = 10) {
    const response = await this.client.get(`/users/me/recently-viewed?limit=${limit}`);
    return response.data;
  }

  async getSearchHistory(limit = 20) {
    const response = await this.client.get(`/users/me/search-history?limit=${limit}`);
    return response.data;
  }

  async getFavorites() {
    const response = await this.client.get('/users/me/favorites');
    return response.data;
  }

  async getUserStats() {
    const response = await this.client.get('/users/stats');
    return response.data;
  }

  // Auth endpoints
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await this.client.post('/auth/change-password', data);
    return response.data;
  }

  async enable2FA() {
    const response = await this.client.post('/auth/enable-2fa');
    return response.data;
  }

  async disable2FA() {
    const response = await this.client.post('/auth/disable-2fa');
    return response.data;
  }

  async getSessions() {
    const response = await this.client.get('/auth/sessions');
    return response.data;
  }

  async terminateSession(sessionId: string) {
    const response = await this.client.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  }

  async terminateAllSessions() {
    const response = await this.client.delete('/auth/sessions/all');
    return response.data;
  }

  async resendEmailVerification() {
    const response = await this.client.post('/auth/resend-email-verification');
    return response.data;
  }

  async resendPhoneVerification() {
    const response = await this.client.post('/auth/resend-phone-verification');
    return response.data;
  }

  // Properties endpoints - PUBLIC ACCESS
  async getMyProperties(params?: any) {
    const response = await this.client.get('/properties/my/properties', { params });
    return response.data;
  }

  async createProperty(data: any) {
    const response = await this.client.post('/properties', data);
    return response.data;
  }

  async updateProperty(id: string, data: any) {
    const response = await this.client.patch(`/properties/${id}`, data);
    return response.data;
  }

  async deleteProperty(id: string) {
    const response = await this.client.delete(`/properties/${id}`);
    return response.data;
  }

  async getProperty(id: string) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/properties/${id}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async searchProperties(params: any) {
    // Public endpoint - no auth required
    const response = await this.client.get('/properties', {
      params,
      skipAuth: true
    } as any);
    return response.data;
  }

  async getFeaturedProperties(limit = 10) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/properties/featured?limit=${limit}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getRecentProperties(limit = 10) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/properties/recent?limit=${limit}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getMostViewedProperties(limit = 10) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/properties/most-viewed?limit=${limit}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getSimilarProperties(propertyId: string, city?: string, type?: string) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/properties/${propertyId}/similar`, {
      params: { limit: 6 },
      skipAuth: true
    } as any);
    return response.data;
  }

  async getMyFavoriteProperties(params?: any) {
    const response = await this.client.get('/properties/my/favorites', { params });
    return response.data;
  }

  // Property media uploads
  async uploadPropertyImages(propertyId: string, files: File[], onUploadProgress?: (progressEvent: any) => void) {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file));
    const response = await this.client.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  }

  async deletePropertyImage(propertyId: string, imagePublicId: string) {
    const response = await this.client.delete(`/properties/${propertyId}/images/${encodeURIComponent(imagePublicId)}`);
    return response.data;
  }

  async uploadPropertyVideos(propertyId: string, files: File[], onUploadProgress?: (progressEvent: any) => void) {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file));
    const response = await this.client.post(`/properties/${propertyId}/videos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  }

  async deletePropertyVideo(propertyId: string, videoPublicId: string) {
    const response = await this.client.delete(`/properties/${propertyId}/videos/${encodeURIComponent(videoPublicId)}`);
    return response.data;
  }

  // Saved Searches endpoints
  async createSavedSearch(data: {
    name: string;
    searchCriteria: {
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
    };
    notificationFrequency?: 'instant' | 'daily' | 'weekly' | 'never';
    isActive?: boolean;
  }) {
    const response = await this.client.post('/saved-searches', data);
    return response.data;
  }

  async getSavedSearches() {
    const response = await this.client.get('/saved-searches');
    return response.data;
  }

  async getSavedSearchById(id: string) {
    const response = await this.client.get(`/saved-searches/${id}`);
    return response.data;
  }

  async updateSavedSearch(id: string, data: {
    name?: string;
    searchCriteria?: any;
    notificationFrequency?: 'instant' | 'daily' | 'weekly' | 'never';
    isActive?: boolean;
  }) {
    const response = await this.client.patch(`/saved-searches/${id}`, data);
    return response.data;
  }

  async deleteSavedSearch(id: string) {
    const response = await this.client.delete(`/saved-searches/${id}`);
    return response.data;
  }

  async getSavedSearchProperties(id: string, page: number = 1, limit: number = 20) {
    const response = await this.client.get(`/saved-searches/${id}/properties`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getSavedSearchStatistics() {
    const response = await this.client.get('/saved-searches/statistics');
    return response.data;
  }

  // History endpoints
  async logActivity(data: any) {
    const response = await this.client.post('/history/activity', data);
    return response.data;
  }

  async getMyActivity(timeframe = 30) {
    const response = await this.client.get(`/history/me/activity?timeframe=${timeframe}`);
    return response.data;
  }

  async getPropertyAnalytics(propertyId: string, timeframe = 30) {
    const response = await this.client.get(`/history/property/${propertyId}/analytics?timeframe=${timeframe}`);
    return response.data;
  }

  async getAgentAnalytics(agentId: string, timeframe = 30) {
    const response = await this.client.get(`/history/agent/${agentId}/analytics?timeframe=${timeframe}`);
    return response.data;
  }

  async getDashboardStats(timeframe = 30) {
    const response = await this.client.get(`/history/dashboard?timeframe=${timeframe}`);
    return response.data;
  }

  async getPopularCities(limit = 10, timeframe = 30) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/history/popular-cities?limit=${limit}&timeframe=${timeframe}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getSearchTrends(timeframe = 7, limit = 20) {
    // Public endpoint - no auth required
    const response = await this.client.get(`/history/search-trends?timeframe=${timeframe}&limit=${limit}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getViewedProperties(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const response = await this.client.get('/users/me/viewed-properties', { params });
    return response.data;
  }

  async clearViewingHistory() {
    const response = await this.client.delete('/users/me/viewed-properties');
    return response.data;
  }

  async removeFromViewingHistory(propertyId: string) {
    const response = await this.client.delete(`/users/me/viewed-properties/${propertyId}`);
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsDashboard(params?: { startDate?: string; endDate?: string }) {
    const response = await this.client.get('/analytics/dashboard', { params });
    return response.data;
  }

  async getAnalyticsEngagement(params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'day' | 'week' | 'month'
  }) {
    const response = await this.client.get('/analytics/engagement', { params });
    return response.data;
  }

  async getAnalyticsKPIs(params?: { startDate?: string; endDate?: string }) {
    const response = await this.client.get('/analytics/kpis', { params });
    return response.data;
  }

  async exportAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json' | 'pdf'
  }) {
    const response = await this.client.get('/analytics/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  async getAnalyticsComparison(params?: { startDate?: string; endDate?: string }) {
    const response = await this.client.get('/analytics/comparison', { params });
    return response.data;
  }

  // Admin endpoints
  async getAllUsers(params?: any) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  // In api.ts - Update the getAgents method
  async getAgents(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/users/agents', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 12
      },
    });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.patch(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async togglePropertyFeatured(id: string, isFeatured: boolean) {
    const response = await this.client.patch(`/properties/${id}/feature`, { isFeatured });
    return response.data;
  }

  async togglePropertyVerified(id: string, isVerified: boolean) {
    const response = await this.client.patch(`/properties/${id}/verify`, { isVerified });
    return response.data;
  }

  async togglePropertyActive(id: string, isActive: boolean) {
    const response = await this.client.patch(`/properties/${id}/activate`, { isActive });
    return response.data;
  }

  // Add these methods to your ApiClient class in lib/api.ts

  async getAgentById(id: string) {
    const response = await this.client.get(`/users/agents/${id}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getAgentStats(id: string) {
    const response = await this.client.get(`/users/agents/${id}/stats`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getAgentProperties(id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get(`/users/agents/${id}/properties`, {
      params,
      skipAuth: true
    } as any);
    return response.data;
  }

  async getAgentReviews(id: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get(`/users/agents/${id}/reviews`, {
      params,
      skipAuth: true
    } as any);
    return response.data;
  }

  // Recommendations endpoint
  async getRecommendations(limit = 10) {
    const response = await this.client.get(`/properties/recommendations?limit=${limit}`);
    return response.data;
  }

  // Property comparison endpoints
  async compareProperties(propertyIds: string[]) {
    const response = await this.client.post('/properties/compare', { propertyIds });
    return response.data;
  }

  async getComparisonHistory() {
    const response = await this.client.get('/properties/compare/history');
    return response.data;
  }

  async saveComparison(propertyIds: string[], name?: string) {
    const response = await this.client.post('/properties/compare/save', { propertyIds, name });
    return response.data;
  }

  // Reviews endpoints
  async createReview(data: {
    reviewType: 'property' | 'agent';
    propertyId?: string;
    agentId?: string;
    rating: number;
    comment: string;
    images?: string[];
  }) {
    const response = await this.client.post('/reviews', data);
    return response.data;
  }

  async getPropertyReviews(propertyId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await this.client.get(`/reviews/property/${propertyId}`, {
      params,
      skipAuth: true
    } as any);
    return response.data;
  }

  async getPropertyReviewStats(propertyId: string) {
    const response = await this.client.get(`/reviews/property/${propertyId}/stats`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getAgentReviewsAPI(agentId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await this.client.get(`/reviews/agent/${agentId}`, {
      params,
      skipAuth: true
    } as any);
    return response.data;
  }

  async getAgentReviewStatsAPI(agentId: string) {
    const response = await this.client.get(`/reviews/agent/${agentId}/stats`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async getMyReviews(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await this.client.get('/reviews/my-reviews', { params });
    return response.data;
  }

  async getReview(id: string) {
    const response = await this.client.get(`/reviews/${id}`, {
      skipAuth: true
    } as any);
    return response.data;
  }

  async updateReview(id: string, data: {
    rating?: number;
    comment?: string;
    images?: string[];
  }) {
    const response = await this.client.patch(`/reviews/${id}`, data);
    return response.data;
  }

  async respondToReview(id: string, response: string) {
    const res = await this.client.post(`/reviews/${id}/respond`, { response });
    return res.data;
  }

  async markReviewAsHelpful(id: string) {
    const response = await this.client.post(`/reviews/${id}/helpful`);
    return response.data;
  }

  async deleteReview(id: string) {
    const response = await this.client.delete(`/reviews/${id}`);
    return response.data;
  }

  // Inquiry endpoints
  async getInquiryStats() {
    const response = await this.client.get('/inquiries/stats');
    return response.data;
  }

  async sendInquiry(data: {
    propertyId: string;
    message: string;
    name?: string;
    email?: string;
    phone?: string;
    type?: string;
    preferredContactMethod?: string;
    preferredContactTime?: string;
    viewingDate?: Date;
    budget?: number;
    moveInDate?: Date;
    contactEmail?: string;
    contactPhone?: string;
  }) {
    const response = await this.client.post('/inquiries', data);
    return response.data;
  }

  async getPropertyInquiries(propertyId: string) {
    const response = await this.client.get(`/inquiries/property/${propertyId}`);
    return response.data;
  }

  async getMyInquiries(params?: any) {
    const response = await this.client.get('/inquiries', { params });
    return response.data;
  }

  async getInquiry(id: string) {
    const response = await this.client.get(`/inquiries/${id}`);
    return response.data;
  }

  async updateInquiry(id: string, data: {
    response?: string;
    status?: string;
  }) {
    const response = await this.client.patch(`/inquiries/${id}`, data);
    return response.data;
  }

  async markInquiryAsRead(id: string) {
    const response = await this.client.patch(`/inquiries/${id}/read`);
    return response.data;
  }

  async deleteInquiry(id: string) {
    const response = await this.client.delete(`/inquiries/${id}`);
    return response.data;
  }

  // Notification endpoints
  async getNotifications(params?: { limit?: number; skip?: number; unreadOnly?: boolean }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.client.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.patch('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string) {
    const response = await this.client.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  async deleteAllReadNotifications() {
    const response = await this.client.delete('/notifications/read');
    return response.data;
  }

  // Generic request method
  async request(config: AxiosRequestConfig) {
    const response = await this.client.request(config);
    return response.data;
  }
}



export const apiClient = new ApiClient();
export default apiClient;