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
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: any) => {
        if (config.skipAuth) return config;
        if (typeof window !== 'undefined') {
          if (authService.isTokenExpired()) {
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
                  if (typeof window !== 'undefined') window.location.href = '/auth/login';
                  return Promise.reject(new Error('Token refresh failed'));
                }
              } catch (error) {
                this.isRefreshing = false;
                this.processQueue(error, null);
                await authService.logout();
                if (typeof window !== 'undefined') window.location.href = '/auth/login';
                return Promise.reject(error);
              }
            }
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => { config.headers.Authorization = `Bearer ${token}`; resolve(config); },
                reject: (err: any) => reject(err),
              });
            });
          }
          const token = authService.getAccessToken();
          if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (originalRequest.skipAuth) return Promise.reject(error);
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(originalRequest));
                },
                reject: (err: any) => reject(err),
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
            await authService.logout();
            if (typeof window !== 'undefined') window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  async getCurrentUser() { return (await this.client.get('/users/me')).data; }
  async updateProfile(data: any) { return (await this.client.patch('/users/me', data)).data; }
  async updatePreferences(preferences: any) { return (await this.client.patch('/users/me/preferences', preferences)).data; }
  async uploadProfilePicture(file: File) {
    const formData = new FormData(); formData.append('file', file);
    return (await this.client.post('/users/me/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  }
  async addToFavorites(propertyId: string) { return (await this.client.post(`/users/me/favorites/${propertyId}`)).data; }
  async removeFromFavorites(propertyId: string) { return (await this.client.delete(`/users/me/favorites/${propertyId}`)).data; }
  async getRecentlyViewed(limit = 10) { return (await this.client.get(`/users/me/recently-viewed?limit=${limit}`)).data; }
  async getSearchHistory(limit = 20) { return (await this.client.get(`/users/me/search-history?limit=${limit}`)).data; }
  async getFavorites() { return (await this.client.get('/users/me/favorites')).data; }
  async getUserStats() { return (await this.client.get('/users/stats')).data; }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  async changePassword(data: { currentPassword: string; newPassword: string }) { return (await this.client.post('/auth/change-password', data)).data; }
  async enable2FA() { return (await this.client.post('/auth/enable-2fa')).data; }
  async disable2FA() { return (await this.client.post('/auth/disable-2fa')).data; }
  async getSessions() { return (await this.client.get('/auth/sessions')).data; }
  async terminateSession(sessionId: string) { return (await this.client.delete(`/auth/sessions/${sessionId}`)).data; }
  async terminateAllSessions() { return (await this.client.delete('/auth/sessions/all')).data; }
  async resendEmailVerification() { return (await this.client.post('/auth/resend-email-verification')).data; }
  async resendPhoneVerification() { return (await this.client.post('/auth/resend-phone-verification')).data; }

  // ─── Properties ───────────────────────────────────────────────────────────
  async getMyProperties(params?: any) { return (await this.client.get('/properties/my/properties', { params })).data; }
  async createProperty(data: any) { return (await this.client.post('/properties', data)).data; }
  async updateProperty(id: string, data: any) { return (await this.client.patch(`/properties/${id}`, data)).data; }
  async deleteProperty(id: string) { return (await this.client.delete(`/properties/${id}`)).data; }
  async getProperty(id: string) { return (await this.client.get(`/properties/${id}`)).data; }
  async getPropertyPublic(id: string) { return (await this.client.get(`/properties/${id}`, { skipAuth: true } as any)).data; }
  async getPropertyAuthenticated(id: string) { return (await this.client.get(`/properties/${id}`)).data; }
  async searchProperties(params: any) { return (await this.client.get('/properties', { params, skipAuth: true } as any)).data; }
  async getFeaturedProperties(limit = 10) { return (await this.client.get(`/properties/featured?limit=${limit}`, { skipAuth: true } as any)).data; }
  async getRecentProperties(limit = 10) { return (await this.client.get(`/properties/recent?limit=${limit}`, { skipAuth: true } as any)).data; }
  async getMostViewedProperties(limit = 10) { return (await this.client.get(`/properties/most-viewed?limit=${limit}`, { skipAuth: true } as any)).data; }
  async getSimilarProperties(propertyId: string, city?: string, type?: string) { return (await this.client.get(`/properties/${propertyId}/similar`, { params: { limit: 6 }, skipAuth: true } as any)).data; }
  async getMyFavoriteProperties(params?: any) { return (await this.client.get('/properties/my/favorites', { params })).data; }
  async uploadPropertyImages(propertyId: string, files: File[], onUploadProgress?: (e: any) => void) {
    const formData = new FormData(); files.forEach(f => formData.append('file', f));
    return (await this.client.post(`/properties/${propertyId}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })).data;
  }
  async deletePropertyImage(propertyId: string, imagePublicId: string) { return (await this.client.delete(`/properties/${propertyId}/images/${encodeURIComponent(imagePublicId)}`)).data; }
  async uploadPropertyVideos(propertyId: string, files: File[], onUploadProgress?: (e: any) => void) {
    const formData = new FormData(); files.forEach(f => formData.append('file', f));
    return (await this.client.post(`/properties/${propertyId}/videos`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })).data;
  }
  async deletePropertyVideo(propertyId: string, videoPublicId: string) { return (await this.client.delete(`/properties/${propertyId}/videos/${encodeURIComponent(videoPublicId)}`)).data; }
  async togglePropertyFeatured(id: string, isFeatured: boolean) { return (await this.client.patch(`/properties/${id}/feature`, { isFeatured })).data; }
  async togglePropertyVerified(id: string, isVerified: boolean) { return (await this.client.patch(`/properties/${id}/verify`, { isVerified })).data; }
  async togglePropertyActive(id: string, isActive: boolean) { return (await this.client.patch(`/properties/${id}/activate`, { isActive })).data; }
  async adminGetAllProperties(params?: any) { return (await this.client.get('/properties/admin/all', { params })).data; }
  async approveProperty(id: string) { return (await this.client.patch(`/properties/${id}/approve`)).data; }
  async rejectProperty(id: string, reason?: string) { return (await this.client.patch(`/properties/${id}/reject`, { reason })).data; }
  async compareProperties(propertyIds: string[]) { return (await this.client.post('/properties/compare', { propertyIds })).data; }
  async getComparisonHistory() { return (await this.client.get('/properties/compare/history')).data; }
  async saveComparison(propertyIds: string[], name?: string) { return (await this.client.post('/properties/compare/save', { propertyIds, name })).data; }

  // ─── Short-term ───────────────────────────────────────────────────────────
  async getShortTermListings(params?: any) { return (await this.client.get('/properties/short-term', { params, skipAuth: true } as any)).data; }
  async getShortTermById(id: string) { return (await this.client.get(`/properties/short-term/${id}`, { skipAuth: true } as any)).data; }
  async getBlockedDates(propertyId: string) { return (await this.client.get(`/properties/${propertyId}/blocked-dates`)).data; }
  async blockDates(propertyId: string, ranges: { from: string; to: string; reason?: string }[]) { return (await this.client.post(`/properties/${propertyId}/block-dates`, { ranges })).data; }
  async unblockDates(propertyId: string, fromDates: string[]) { return (await this.client.delete(`/properties/${propertyId}/block-dates`, { data: { fromDates } })).data; }

  // ─── Saved Searches ───────────────────────────────────────────────────────
  async createSavedSearch(data: any) { return (await this.client.post('/saved-searches', data)).data; }
  async getSavedSearches() { return (await this.client.get('/saved-searches')).data; }
  async getSavedSearchById(id: string) { return (await this.client.get(`/saved-searches/${id}`)).data; }
  async updateSavedSearch(id: string, data: any) { return (await this.client.patch(`/saved-searches/${id}`, data)).data; }
  async deleteSavedSearch(id: string) { return (await this.client.delete(`/saved-searches/${id}`)).data; }
  async getSavedSearchProperties(id: string, page = 1, limit = 20) { return (await this.client.get(`/saved-searches/${id}/properties`, { params: { page, limit } })).data; }
  async getSavedSearchStatistics() { return (await this.client.get('/saved-searches/statistics')).data; }

  // ─── History / Analytics ──────────────────────────────────────────────────
  async logActivity(data: any) { return (await this.client.post('/history/activity', data)).data; }
  async getMyActivity(timeframe = 30) { return (await this.client.get(`/history/me/activity?timeframe=${timeframe}`)).data; }
  async getPropertyAnalytics(propertyId: string, timeframe = 30) { return (await this.client.get(`/history/property/${propertyId}/analytics?timeframe=${timeframe}`)).data; }
  async getAgentAnalytics(agentId: string, timeframe = 30) { return (await this.client.get(`/history/agent/${agentId}/analytics?timeframe=${timeframe}`)).data; }
  async getDashboardStats(timeframe = 30) { return (await this.client.get(`/history/dashboard?timeframe=${timeframe}`)).data; }
  async getPopularCities(limit = 10, timeframe = 30) { return (await this.client.get(`/history/popular-cities?limit=${limit}&timeframe=${timeframe}`, { skipAuth: true } as any)).data; }
  async getSearchTrends(timeframe = 7, limit = 20) { return (await this.client.get(`/history/search-trends?timeframe=${timeframe}&limit=${limit}`)).data; }
  async getAllActivities(params?: any) { return (await this.client.get('/history/all-activities', { params })).data; }
  async getViewedProperties(params?: any) { return (await this.client.get('/users/me/viewed-properties', { params })).data; }
  async clearViewingHistory() { return (await this.client.delete('/users/me/viewed-properties')).data; }
  async removeFromViewingHistory(propertyId: string) { return (await this.client.delete(`/users/me/viewed-properties/${propertyId}`)).data; }
  async getAnalyticsDashboard(params?: any) { return (await this.client.get('/analytics/dashboard', { params })).data; }
  async getAnalyticsEngagement(params?: any) { return (await this.client.get('/analytics/engagement', { params })).data; }
  async getAnalyticsKPIs(params?: any) { return (await this.client.get('/analytics/kpis', { params })).data; }
  async exportAnalytics(params?: any) { return (await this.client.get('/analytics/export', { params, responseType: 'blob' })).data; }
  async getAnalyticsComparison(params?: any) { return (await this.client.get('/analytics/comparison', { params })).data; }
  async getSystemSettings() { return (await this.client.get('/system-settings')).data; }
  async updateSystemSettings(data: any) { return (await this.client.patch('/system-settings', data)).data; }

  // ─── Admin ────────────────────────────────────────────────────────────────
  async getAllUsers(params?: any) { return (await this.client.get('/users', { params })).data; }
  async getAgents(params?: { page?: number; limit?: number }) { return (await this.client.get('/users/agents', { params: { page: params?.page || 1, limit: params?.limit || 12 } })).data; }
  async getUserById(id: string) { return (await this.client.get(`/users/${id}`)).data; }
  async updateUser(id: string, data: any) { return (await this.client.patch(`/users/${id}`, data)).data; }
  async deleteUser(id: string) { return (await this.client.delete(`/users/${id}`)).data; }
  async toggleRole() { return (await this.client.patch('/users/me/role')).data; }
  async getAgentById(id: string) { return (await this.client.get(`/users/agents/${id}`, { skipAuth: true } as any)).data; }
  async getAgentStats(id: string) { return (await this.client.get(`/users/agents/${id}/stats`, { skipAuth: true } as any)).data; }
  async getAgentProperties(id: string, params?: any) { return (await this.client.get(`/users/agents/${id}/properties`, { params, skipAuth: true } as any)).data; }
  async getAgentReviews(id: string, params?: any) { return (await this.client.get(`/users/agents/${id}/reviews`, { params, skipAuth: true } as any)).data; }
  async getAdminAnalyticsDashboard(params?: any) { return (await this.client.get('/admin/analytics/dashboard', { params })).data; }
  async getAdminKPIs(params?: any) { return (await this.client.get('/admin/analytics/kpis', { params })).data; }
  async getAdminRevenue(params?: any) { return (await this.client.get('/admin/analytics/revenue', { params })).data; }
  async getAdminOccupancy(params?: any) { return (await this.client.get('/admin/analytics/occupancy', { params })).data; }
  async getAdminBookingStatusBreakdown(params?: any) { return (await this.client.get('/admin/analytics/status-breakdown', { params })).data; }
  async getAdminPropertyTypeBreakdown(params?: any) { return (await this.client.get('/admin/analytics/property-type-breakdown', { params })).data; }
  async getAdminTopProperties(params?: any) { return (await this.client.get('/admin/analytics/top-properties', { params })).data; }
  async getAdminCityPerformance(params?: any) { return (await this.client.get('/admin/analytics/city-performance', { params })).data; }
  async getAdminHostLeaderboard(params?: any) { return (await this.client.get('/admin/analytics/host-leaderboard', { params })).data; }
  async getAdminAnalyticsComparison(params?: any) { return (await this.client.get('/admin/analytics/comparison', { params })).data; }

  // ─── Recommendations ──────────────────────────────────────────────────────
  async getRecommendations(params?: any) { return (await this.client.get('/recommendations', { params })).data; }
  async getFlaskMLRecommendations(params?: any) { return (await this.client.get('/recommendations/flask-ml', { params })).data; }
  async getContentBasedRecommendations(params?: any) { return (await this.client.get('/recommendations/content-based', { params })).data; }
  async getCollaborativeRecommendations(params?: any) { return (await this.client.get('/recommendations/collaborative', { params })).data; }
  async getPopularityRecommendations(params?: any) { return (await this.client.get('/recommendations/popularity', { params })).data; }
  async getHybridRecommendations(params?: any) { return (await this.client.get('/recommendations/hybrid', { params })).data; }
  async getRecommendationStats() { return (await this.client.get('/recommendations/stats')).data; }
  async submitRecommendationFeedback(data: any) { return (await this.client.post('/recommendations/feedback', data)).data; }
  async getMLStatus() { return (await this.client.get('/recommendations/ml/status')).data; }
  async trainMLModel(force = false) { return (await this.client.post('/recommendations/ml/train', null, { params: { force } })).data; }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  async createReview(data: any) { return (await this.client.post('/reviews', data)).data; }
  async getPropertyReviews(propertyId: string, params?: any) { return (await this.client.get(`/reviews/property/${propertyId}`, { params, skipAuth: true } as any)).data; }
  async getPropertyReviewStats(propertyId: string) { return (await this.client.get(`/reviews/property/${propertyId}/stats`, { skipAuth: true } as any)).data; }
  async getAgentReviewsAPI(agentId: string, params?: any) { return (await this.client.get(`/reviews/agent/${agentId}`, { params, skipAuth: true } as any)).data; }
  async getAgentReviewStatsAPI(agentId: string) { return (await this.client.get(`/reviews/agent/${agentId}/stats`, { skipAuth: true } as any)).data; }
  async getMyReviews(params?: any) { return (await this.client.get('/reviews/my-reviews', { params })).data; }
  async getReview(id: string) { return (await this.client.get(`/reviews/${id}`, { skipAuth: true } as any)).data; }
  async updateReview(id: string, data: any) { return (await this.client.patch(`/reviews/${id}`, data)).data; }
  async respondToReview(id: string, response: string) { return (await this.client.post(`/reviews/${id}/respond`, { response })).data; }
  async markReviewAsHelpful(id: string) { return (await this.client.post(`/reviews/${id}/helpful`)).data; }
  async deleteReview(id: string) { return (await this.client.delete(`/reviews/${id}`)).data; }
  async createBookingReview(data: any) { return (await this.client.post('/reviews', data)).data; }
  async getBookingReviews(bookingId: string) { return (await this.client.get(`/reviews/booking/${bookingId}`)).data; }
  async getGuestReviews(userId: string, params?: any) { return (await this.client.get(`/reviews/guest/${userId}`, { params })).data; }

  // ─── Bookings ─────────────────────────────────────────────────────────────
  async createBooking(data: {
    propertyId: string; checkIn: string; checkOut: string;
    guests: { adults: number; children?: number; infants?: number };
    currency?: string; guestNote?: string;
  }) { return (await this.client.post('/bookings', data)).data; }
  async getMyBookings(params?: any) { return (await this.client.get('/bookings/my', { params })).data; }
  async cancelBooking(id: string, data: { reason?: string }) { return (await this.client.patch(`/bookings/${id}/cancel`, data)).data; }
  async getHostBookings(params?: any) { return (await this.client.get('/bookings/hosting', { params })).data; }
  async confirmBooking(id: string, data?: { hostNote?: string }) { return (await this.client.patch(`/bookings/${id}/confirm`, data ?? {})).data; }
  async rejectBooking(id: string, data?: { hostNote?: string; reason?: string }) { return (await this.client.patch(`/bookings/${id}/reject`, data ?? {})).data; }
  async completeBooking(id: string) { return (await this.client.patch(`/bookings/${id}/complete`)).data; }
  async getPropertyAvailability(propertyId: string, from: string, to: string) { return (await this.client.get(`/bookings/availability/${propertyId}`, { params: { from, to }, skipAuth: true } as any)).data; }
  async getBookingById(id: string) { return (await this.client.get(`/bookings/${id}`)).data; }
  async getBookingStats() { return (await this.client.get('/bookings/stats')).data; }
  async getAdminBookings(params?: any) { return (await this.client.get('/bookings/admin/all', { params })).data; }

  // ─── Payments ─────────────────────────────────────────────────────────────
  async initiateBookingPayment(bookingId: string): Promise<{ transaction: any; paymentLink: string; txRef: string }> {
    return (await this.client.post(`/payments/bookings/${bookingId}/initiate`)).data;
  }
  async getBookingPaymentStatus(bookingId: string): Promise<any> {
    return (await this.client.get(`/bookings/${bookingId}`)).data;
  }
  async getUserTransactions(params?: any) { return (await this.client.get('/payments/transactions', { params })).data; }
  async getTransactionByReference(txRef: string) { return (await this.client.get(`/payments/transactions/reference/${txRef}`)).data; }
  async getTransactionById(id: string) { return (await this.client.get(`/payments/transactions/${id}`)).data; }
  async getRevenueAnalytics() { return (await this.client.get('/analytics/revenue/overview')).data; }
  async getMonthlyRevenueChart(months = 12) { return (await this.client.get('/analytics/revenue/monthly-chart', { params: { months } })).data; }
  async getSubscriptionAnalytics() { return (await this.client.get('/analytics/revenue/subscriptions')).data; }
  async getBoostAnalytics() { return (await this.client.get('/analytics/revenue/boosts')).data; }
  async getTopRevenueUsers(limit = 10) { return (await this.client.get('/analytics/revenue/top-users', { params: { limit } })).data; }
  async getAnalyticsSummary() { return (await this.client.get('/analytics/revenue/summary')).data; }
  async getSubscriptionPlans() { return (await this.client.get('/subscriptions/plans', { skipAuth: true } as any)).data; }
  async getMySubscription() { return (await this.client.get('/subscriptions/my-subscription')).data; }
  async getSubscriptionUsage() { return (await this.client.get('/subscriptions/usage')).data; }
  async checkSubscriptionLimit(resourceType: 'listings' | 'boosts') { return (await this.client.get(`/subscriptions/check-limit/${resourceType}`)).data; }
  async getWallet() { return (await this.client.get('/wallet')).data; }
  async getWalletTransactions(limit?: number) { return (await this.client.get('/wallet/transactions', { params: { limit } })).data; }
  async getWalletStats() { return (await this.client.get('/wallet/stats')).data; }

  // ─── Inquiries ────────────────────────────────────────────────────────────
  async getInquiryStats() { return (await this.client.get('/inquiries/stats')).data; }
  async sendInquiry(data: any) { return (await this.client.post('/inquiries', data)).data; }
  async getPropertyInquiries(propertyId: string) { return (await this.client.get(`/inquiries/property/${propertyId}`)).data; }
  async getMyInquiries(params?: any) { return (await this.client.get('/inquiries', { params })).data; }
  async getInquiry(id: string) { return (await this.client.get(`/inquiries/${id}`)).data; }
  async updateInquiry(id: string, data: any) { return (await this.client.patch(`/inquiries/${id}`, data)).data; }
  async markInquiryAsRead(id: string) { return (await this.client.patch(`/inquiries/${id}/read`)).data; }
  async deleteInquiry(id: string) { return (await this.client.delete(`/inquiries/${id}`)).data; }

  // ─── Reports ──────────────────────────────────────────────────────────────
  async reportProperty(propertyId: string, data: { reason: string; details?: string }) { return (await this.client.post(`/reports/property/${propertyId}`, data)).data; }
  async getAdminReports(params?: any) { return (await this.client.get('/reports', { params })).data; }
  async getAdminReportStats() { return (await this.client.get('/reports/stats')).data; }
  async getAdminReportById(id: string) { return (await this.client.get(`/reports/${id}`)).data; }
  async updateReportStatus(id: string, data: { status: string; adminNotes?: string }) { return (await this.client.patch(`/reports/${id}/status`, data)).data; }
  async deleteReport(id: string) { return (await this.client.delete(`/reports/${id}`)).data; }
  async deleteReportedProperty(reportId: string): Promise<{ message: string }> { return (await this.client.delete(`/reports/${reportId}/property`)).data; }
  async warnPropertyOwner(reportId: string, data: { message: string; severity?: 'warning' | 'final_warning' }): Promise<{ message: string }> { return (await this.client.post(`/reports/${reportId}/warn-owner`, data)).data; }

  // ─── AI Chat ──────────────────────────────────────────────────────────────
  async processAiChat(data: any) { return (await this.client.post('/ai-chat/chat', data)).data; }
  async processAiChatGuest(data: any) { return (await this.client.post('/ai-chat/chat/guest', data, { skipAuth: true } as any)).data; }
  async refineAiSearch(data: any) { return (await this.client.post('/ai-chat/refine-search', data)).data; }
  async getAiSuggestions(query: string) { return (await this.client.post('/ai-chat/suggestions', { query }, { skipAuth: true } as any)).data; }
  async getAiRecommendations(limit = 6) { return (await this.client.get('/ai-chat/recommendations', { params: { limit } })).data; }
  async getAiChatSession(sessionId: string) { return (await this.client.get(`/ai-chat/session/${sessionId}`)).data; }
  async getAiChatStats() { return (await this.client.get('/ai-chat/stats')).data; }
  async checkAiChatHealth() { return (await this.client.post('/ai-chat/health', {}, { skipAuth: true } as any)).data; }
  async getHealthStatus() { return (await this.client.get('/health', { skipAuth: true } as any)).data; }

  // ─── Chat / Conversations ─────────────────────────────────────────────────
  async createConversation(data: any) { return (await this.client.post('/chat/conversations', data)).data; }
  async getConversations(params?: any) { return (await this.client.get('/chat/conversations', { params })).data; }
  async getConversation(conversationId: string) { return (await this.client.get(`/chat/conversations/${conversationId}`)).data; }
  async archiveConversation(conversationId: string, archive: boolean) { return (await this.client.put(`/chat/conversations/${conversationId}/archive`, { archive })).data; }
  async deleteConversation(conversationId: string) { return (await this.client.delete(`/chat/conversations/${conversationId}`)).data; }
  async sendMessage(data: any) { return (await this.client.post('/chat/messages', data)).data; }
  async sendMessageWithAttachments(data: any, files: File[]) {
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    if (data.content) formData.append('content', data.content);
    if (data.type) formData.append('type', data.type);
    if (data.propertyId) formData.append('propertyId', data.propertyId);
    if (data.replyTo) formData.append('replyTo', data.replyTo);
    files.forEach(f => formData.append('files', f));
    return (await this.client.post('/chat/messages/with-attachments', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  }
  async getMessages(conversationId: string, params?: any) { return (await this.client.get(`/chat/conversations/${conversationId}/messages`, { params })).data; }
  async markMessagesAsRead(data: any) { return (await this.client.post('/chat/messages/mark-read', data)).data; }
  async editMessage(messageId: string, content: string) { return (await this.client.put(`/chat/messages/${messageId}`, { content })).data; }
  async deleteMessage(messageId: string) { return (await this.client.delete(`/chat/messages/${messageId}`)).data; }
  async getUnreadMessagesCount() { return (await this.client.get('/chat/unread-count')).data; }
  async getConversationCallHistory(conversationId: string, limit = 20) { return (await this.client.get(`/chat/conversations/${conversationId}/calls`, { params: { limit } })).data; }
  async getUserCallHistory(limit = 50) { return (await this.client.get('/chat/calls/history', { params: { limit } })).data; }
  async getCall(callId: string) { return (await this.client.get(`/chat/calls/${callId}`)).data; }

  // ─── Misc ─────────────────────────────────────────────────────────────────
  async getMyLeaseInfo() { return (await this.client.get('/users/me/lease-info')).data; }
  async getNotifications(params?: any) { return (await this.client.get('/notifications', { params })).data; }
  async getUnreadNotificationCount() { return (await this.client.get('/notifications/unread-count')).data; }
  async markNotificationAsRead(notificationId: string) { return (await this.client.patch(`/notifications/${notificationId}/read`)).data; }
  async markAllNotificationsAsRead() { return (await this.client.patch('/notifications/read-all')).data; }
  async deleteNotification(notificationId: string) { return (await this.client.delete(`/notifications/${notificationId}`)).data; }
  async deleteAllReadNotifications() { return (await this.client.delete('/notifications/read')).data; }
  async getLeads() { return (await this.client.get('/leads')).data; }
  async getLead(id: string) { return (await this.client.get(`/leads/${id}`)).data; }
  async createLead(data: any) { return (await this.client.post('/leads', data)).data; }
  async updateLead(id: string, data: any) { return (await this.client.put(`/leads/${id}`, data)).data; }
  async deleteLead(id: string) { return (await this.client.delete(`/leads/${id}`)).data; }
  async addLeadNote(id: string, content: string) { return (await this.client.post(`/leads/${id}/notes`, { content })).data; }
  async getLeadStats() { return (await this.client.get('/leads/stats')).data; }
  async getAppointments(params?: any) { return (await this.client.get('/appointments', { params })).data; }
  async getAppointment(id: string) { return (await this.client.get(`/appointments/${id}`)).data; }
  async createAppointment(data: any) { return (await this.client.post('/appointments', data)).data; }
  async scheduleTour(data: any) { return (await this.client.post('/appointments/schedule', data)).data; }
  async getMyTours(limit = 10) { return (await this.client.get(`/appointments/my-tours?limit=${limit}`)).data; }
  async updateAppointment(id: string, data: any) { return (await this.client.put(`/appointments/${id}`, data)).data; }
  async deleteAppointment(id: string) { return (await this.client.delete(`/appointments/${id}`)).data; }
  async addAppointmentNote(id: string, content: string) { return (await this.client.post(`/appointments/${id}/notes`, { content })).data; }
  async getAppointmentStats() { return (await this.client.get('/appointments/stats')).data; }
  async getMyTenants() { return (await this.client.get('/users/me/tenants')).data; }
  async addTenant(data: any) { return (await this.client.post('/users/me/tenants', data)).data; }
  async updateTenant(tenantId: string, data: any) { return (await this.client.patch(`/users/me/tenants/${tenantId}`, data)).data; }
  async removeTenant(tenantId: string) { return (await this.client.delete(`/users/me/tenants/${tenantId}`)).data; }

  async request(config: AxiosRequestConfig) { return (await this.client.request(config)).data; }
}

export const apiClient = new ApiClient();
export default apiClient;