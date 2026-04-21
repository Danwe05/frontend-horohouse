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
  async getSimilarProperties(propertyId: string) {
  return (await this.client.get(`/properties/${propertyId}/similar`,
    { params: { limit: 6 }, skipAuth: true } as any)).data;
}async getMyFavoriteProperties(params?: any) { return (await this.client.get('/properties/my/favorites', { params })).data; }
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

  // ─── Virtual Tour ─────────────────────────────────────────────────────────
  async trackTourView(propertyId: string): Promise<void> {
    try {
      await this.client.post(
        '/properties/tour/track',
        { propertyId },
        { skipAuth: true } as any,   // public endpoint — no auth needed
      );
    } catch {
      // silent fail — analytics should never break the UI
    }
  }

  async updatePropertyTour(
    propertyId: string,
    data: {
      tourType: 'kuula' | 'youtube' | 'images' | 'none';
      virtualTourUrl?: string;
      tourThumbnail?: string;
    },
  ): Promise<any> {
    return (await this.client.patch(`/properties/${propertyId}`, data)).data;
  }
  // ─── Short-term ───────────────────────────────────────────────────────────
  async getShortTermListings(params?: any) { return (await this.client.get('/properties/short-term', { params, skipAuth: true } as any)).data; }
  async getShortTermById(id: string) { return (await this.client.get(`/properties/short-term/${id}`, { skipAuth: true } as any)).data; }
  async getBlockedDates(propertyId: string) { return (await this.client.get(`/properties/${propertyId}/blocked-dates`)).data; }
  async blockDates(propertyId: string, ranges: { from: string; to: string; reason?: string }[]) { return (await this.client.post(`/properties/${propertyId}/block-dates`, { ranges })).data; }
  async unblockDates(propertyId: string, fromDates: string[]) { return (await this.client.delete(`/properties/${propertyId}/block-dates`, { data: { fromDates } })).data; }

  // ─── Rooms (Hotel / Hostel multi-room) ───────────────────────────────────
  async createRoom(data: {
    propertyId: string;
    name: string;
    roomType: string;
    maxGuests: number;
    roomNumber?: string;
    bedCount?: number;
    bedType?: string;
    price?: number;
    cleaningFee?: number;
    amenities?: Record<string, any>;
  }) { return (await this.client.post('/rooms', data)).data; }

  async getRoomsByProperty(propertyId: string, includeInactive = false) {
    return (await this.client.get(`/rooms/property/${propertyId}`, {
      params: includeInactive ? { includeInactive: 'true' } : {},
      skipAuth: true,
    } as any)).data;
  }

  async getRoomById(roomId: string) { return (await this.client.get(`/rooms/${roomId}`, { skipAuth: true } as any)).data; }
  async updateRoom(roomId: string, data: any) { return (await this.client.patch(`/rooms/${roomId}`, data)).data; }
  async deleteRoom(roomId: string) { return (await this.client.delete(`/rooms/${roomId}`)).data; }

  async uploadRoomImages(roomId: string, formData: FormData) {
    return (await this.client.post(`/rooms/${roomId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }
  async deleteRoomImage(roomId: string, imagePublicId: string) {
    return (await this.client.delete(`/rooms/${roomId}/images/${encodeURIComponent(imagePublicId)}`)).data;
  }

  async blockRoomDates(roomId: string, ranges: { from: string; to: string; reason?: string }[]) {
    return (await this.client.post(`/rooms/${roomId}/block-dates`, { ranges })).data;
  }
  async unblockRoomDates(roomId: string, fromDates: string[]) {
    return (await this.client.post(`/rooms/${roomId}/unblock-dates`, { fromDates })).data;
  }

  async setRoomIcalUrl(roomId: string, icalUrl: string) {
    return (await this.client.patch(`/rooms/${roomId}/ical-url`, { icalUrl })).data;
  }
  async syncRoomIcal(roomId: string) { return (await this.client.post(`/rooms/${roomId}/sync-ical`)).data; }

  async getRoomAvailability(roomId: string, from: string, to: string) {
    return (await this.client.get(`/rooms/${roomId}/availability`, {
      params: { from, to },
      skipAuth: true,
    } as any)).data;
  }

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
  /** Explicitly set the caller's role. Body: { role: UserRole } */
  async setRole(role: string) { return (await this.client.patch('/users/me/role', { role })).data; }
  async getAgentById(id: string) { return (await this.client.get(`/users/agents/${id}`, { skipAuth: true } as any)).data; }
  async getAgentStats(id: string) { return (await this.client.get(`/users/agents/${id}/stats`, { skipAuth: true } as any)).data; }
  async getAgentProperties(id: string, params?: any) { return (await this.client.get(`/users/agents/${id}/properties`, { params, skipAuth: true } as any)).data; }
  async getAgentReviews(id: string, params?: any) { return (await this.client.get(`/users/agents/${id}/reviews`, { params, skipAuth: true } as any)).data; }

  // ─── Admin Analytics ──────────────────────────────────────────────────────
  // NestJS controller: @Controller('analytics/admin')
  // All routes below match GET /analytics/admin/<route>
  async getAdminAnalyticsDashboard(params?: any) { return (await this.client.get('/analytics/admin/dashboard', { params })).data; }
  async getAdminKPIs(params?: any) { return (await this.client.get('/analytics/admin/kpis', { params })).data; }
  async getAdminRevenue(params?: any) { return (await this.client.get('/analytics/admin/revenue', { params })).data; }
  async getAdminOccupancy(params?: any) { return (await this.client.get('/analytics/admin/occupancy', { params })).data; }
  // NestJS routes: @Get('breakdown/status') and @Get('breakdown/property-type')
  async getAdminBookingStatusBreakdown(params?: any) { return (await this.client.get('/analytics/admin/breakdown/status', { params })).data; }
  async getAdminPropertyTypeBreakdown(params?: any) { return (await this.client.get('/analytics/admin/breakdown/property-type', { params })).data; }
  async getAdminTopProperties(params?: any) { return (await this.client.get('/analytics/admin/top-properties', { params })).data; }
  async getAdminCityPerformance(params?: any) { return (await this.client.get('/analytics/admin/city-performance', { params })).data; }
  async getAdminHostLeaderboard(params?: any) { return (await this.client.get('/analytics/admin/host-leaderboard', { params })).data; }
  async getAdminAnalyticsComparison(params?: any) { return (await this.client.get('/analytics/admin/comparison', { params })).data; }

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
    roomId?: string;
  }) { return (await this.client.post('/bookings', data)).data; }
  async getMyBookings(params?: any) { return (await this.client.get('/bookings/my', { params })).data; }
  async cancelBooking(id: string, data: { reason?: string }) { return (await this.client.patch(`/bookings/${id}/cancel`, data)).data; }
  async getHostBookings(params?: any) { return (await this.client.get('/bookings/hosting', { params })).data; }
  async confirmBooking(id: string, data?: { hostNote?: string }) { return (await this.client.patch(`/bookings/${id}/confirm`, data ?? {})).data; }
  async rejectBooking(id: string, data?: { hostNote?: string; reason?: string }) { return (await this.client.patch(`/bookings/${id}/reject`, data ?? {})).data; }
  async completeBooking(id: string) { return (await this.client.patch(`/bookings/${id}/complete`)).data; }
  async getPropertyAvailability(propertyId: string, from: string, to: string, roomId?: string) { return (await this.client.get(`/bookings/availability/${propertyId}`, { params: { from, to, ...(roomId ? { roomId } : {}) }, skipAuth: true } as any)).data; }
  async getBookingById(id: string) { return (await this.client.get(`/bookings/${id}`)).data; }
  async getBookingStats() { return (await this.client.get('/bookings/stats')).data; }
  async getAdminBookings(params?: any) { return (await this.client.get('/bookings/admin/all', { params })).data; }

  // ─── Payments ─────────────────────────────────────────────────────────────
  async initiateBookingPayment(bookingId: string): Promise<{ transaction: any; paymentLink: string; txRef: string }> {
    return (await this.client.post(`/payments/bookings/${bookingId}/initiate`)).data;
  }
  async verifyPayment(transactionId: string, flutterwaveReference?: string): Promise<any> {
    return (await this.client.post('/payments/verify', { transactionId, flutterwaveReference })).data;
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
  async withdrawFunds(data: { amount: number; withdrawalMethod: 'mtn_momo' | 'orange_money' | 'bank_transfer'; accountNumber: string; accountName?: string; bankCode?: string }) { return (await this.client.post('/wallet/withdraw', data)).data; }
  async updateWalletBankAccount(data: { accountName: string; accountNumber: string; bankName: string; bankCode: string }) { return (await this.client.post('/wallet/bank', data)).data; }
  async updateWalletMobileMoney(data: { phoneNumber: string; provider: 'MTN' | 'ORANGE' }) { return (await this.client.post('/wallet/mobile', data)).data; }
  async enableAutoWithdrawal(threshold: number) { return (await this.client.post('/wallet/auto-withdraw', { threshold })).data; }

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
  async subscribeNewsletter(email: string) {
    return (await this.client.post('/newsletter/subscribe', { email }, { skipAuth: true } as any)).data;
  }

  // ─── Student Profiles ────────────────────────────────────────────────────
  async createStudentProfile(data: {
    universityName: string;
    campusCity: string;
    campusName: string;
    faculty?: string;
    studyLevel?: string;
    enrollmentYear?: number;
    campusLatitude?: number;
    campusLongitude?: number;
  }) {
    return (await this.client.post('/student-profiles', data)).data;
  }

  async getMyStudentProfile() {
    return (await this.client.get('/student-profiles/me')).data;
  }

  async updateMyStudentProfile(data: {
    universityName?: string;
    campusCity?: string;
    campusName?: string;
    faculty?: string;
    studyLevel?: string;
    enrollmentYear?: number;
    campusLatitude?: number;
    campusLongitude?: number;
    roommateMode?: 'have_room' | 'need_room';
    isSeekingRoommate?: boolean;
  }) {
    return (await this.client.patch('/student-profiles/me', data)).data;
  }

  async uploadStudentId(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return (await this.client.post('/student-profiles/me/student-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  async getStudentVerificationStatus() {
    return (await this.client.get('/student-profiles/me/verification-status')).data;
  }

  async getAmbassadorStats() {
    return (await this.client.get('/student-profiles/me/ambassador-stats')).data;
  }

  async checkStudentVerified() {
    return (await this.client.get('/student-profiles/verified-check')).data;
  }

  async validateAmbassadorCode(code: string) {
    return (await this.client.get(`/student-profiles/ambassador/${code}`, { skipAuth: true } as any)).data;
  }

  async adminGetStudentProfiles(params?: {
    page?: number;
    limit?: number;
    verificationStatus?: string;
    campusCity?: string;
    isAmbassador?: boolean;
  }) {
    return (await this.client.get('/student-profiles/admin/all', { params })).data;
  }

  async adminGetStudentProfileStats() {
    return (await this.client.get('/student-profiles/admin/stats')).data;
  }

  async adminGetStudentProfileById(id: string) {
    return (await this.client.get(`/student-profiles/admin/${id}`)).data;
  }

  async adminReviewStudentId(id: string, data: {
    decision: 'verified' | 'rejected';
    rejectionReason?: string;
  }) {
    return (await this.client.patch(`/student-profiles/admin/${id}/review`, data)).data;
  }

  async adminGrantAmbassador(id: string, ambassadorCode: string) {
    return (await this.client.patch(`/student-profiles/admin/${id}/ambassador`, { ambassadorCode })).data;
  }

  // ─── Roommate Matching ───────────────────────────────────────────────────
  async createRoommateProfile(data: {
    mode: 'have_room' | 'need_room';
    campusCity: string;
    budgetPerPersonMax: number;
    moveInDate: string;
    sleepSchedule: 'early_bird' | 'night_owl' | 'flexible';
    cleanlinessLevel: 'very_neat' | 'neat' | 'relaxed';
    socialHabit: 'introverted' | 'balanced' | 'social';
    studyHabit: 'home_studier' | 'library_goer' | 'mixed';
    propertyId?: string;
    preferredNeighborhood?: string;
    budgetPerPersonMin?: number;
    moveInFlexibilityDays?: number;
    isSmoker?: boolean;
    acceptsSmoker?: boolean;
    hasPet?: boolean;
    acceptsPet?: boolean;
    preferredRoommateGender?: 'male' | 'female' | 'any';
    bio?: string;
  }) {
    return (await this.client.post('/roommate-matching/profile', data)).data;
  }

  async getMyRoommateProfile() {
    return (await this.client.get('/roommate-matching/profile/me')).data;
  }

  async updateMyRoommateProfile(data: any) {
    return (await this.client.patch('/roommate-matching/profile/me', data)).data;
  }

  async pauseRoommateProfile() {
    return (await this.client.delete('/roommate-matching/profile/me')).data;
  }

  async reactivateRoommateProfile() {
    return (await this.client.patch('/roommate-matching/profile/me/reactivate')).data;
  }

  async getRoommateProfileById(id: string) {
    return (await this.client.get(`/roommate-matching/profile/${id}`)).data;
  }

  async searchRoommates(params?: {
    page?: number;
    limit?: number;
    campusCity?: string;
    mode?: 'have_room' | 'need_room';
    maxBudget?: number;
    sleepSchedule?: string;
    cleanlinessLevel?: string;
    preferredRoommateGender?: string;
    acceptsSmoker?: boolean;
    acceptsPet?: boolean;
  }) {
    return (await this.client.get('/roommate-matching/search', { params })).data;
  }

  async expressRoommateInterest(receiverUserId: string) {
    return (await this.client.post(`/roommate-matching/interest/${receiverUserId}`)).data;
  }

  async acceptRoommateMatch(matchId: string) {
    return (await this.client.patch(`/roommate-matching/matches/${matchId}/accept`)).data;
  }

  async rejectRoommateMatch(matchId: string) {
    return (await this.client.patch(`/roommate-matching/matches/${matchId}/reject`)).data;
  }

  async getMyRoommateMatches() {
    return (await this.client.get('/roommate-matching/matches')).data;
  }

  // ─── Student Properties ──────────────────────────────────────────────────
  async searchStudentProperties(params?: {
    page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
    city?: string; neighborhood?: string; nearestCampus?: string;
    maxCampusProximityMeters?: number; minPricePerPerson?: number; maxPricePerPerson?: number;
    waterSource?: string; electricityBackup?: string; furnishingStatus?: string;
    genderRestriction?: string; noCurfew?: boolean; visitorsAllowed?: boolean;
    hasGatedCompound?: boolean; hasNightWatchman?: boolean; studentApprovedOnly?: boolean;
    acceptsRentAdvanceScheme?: boolean; maxAdvanceMonths?: number;
    hasAvailableBeds?: boolean; minAvailableBeds?: number;
  }) {
    return (await this.client.get('/student-properties/search', { params, skipAuth: true } as any)).data;
  }

  async getStudentPropertyStats() {
    return (await this.client.get('/student-properties/stats', { skipAuth: true } as any)).data;
  }

  async enrollPropertyInStudentProgramme(propertyId: string, data: {
    campusProximityMeters?: number; nearestCampus?: string; walkingMinutes?: number;
    taxiMinutes?: number; waterSource?: string; electricityBackup?: string;
    furnishingStatus?: string; genderRestriction?: string; curfewTime?: string;
    visitorsAllowed?: boolean; cookingAllowed?: boolean; hasGatedCompound?: boolean;
    hasNightWatchman?: boolean; hasFence?: boolean; maxAdvanceMonths?: number;
    acceptsRentAdvanceScheme?: boolean; availableBeds?: number; totalBeds?: number;
    pricePerPersonMonthly?: number;
  }) {
    return (await this.client.post(`/student-properties/${propertyId}/enroll`, data)).data;
  }

  async updateStudentPropertyEnrollment(propertyId: string, data: any) {
    return (await this.client.patch(`/student-properties/${propertyId}/enroll`, data)).data;
  }

  async removeStudentPropertyEnrollment(propertyId: string) {
    return (await this.client.delete(`/student-properties/${propertyId}/enroll`)).data;
  }

  async adminGrantStudentApproved(propertyId: string) {
    return (await this.client.patch(`/student-properties/admin/${propertyId}/approve`)).data;
  }

  async adminRevokeStudentApproved(propertyId: string) {
    return (await this.client.patch(`/student-properties/admin/${propertyId}/revoke`)).data;
  }

  // ─── Split Payments ──────────────────────────────────────────────────────
  async calculateRentSplit(data: {
    totalRent: number; numberOfTenants: number; customPercentages?: number[];
  }) {
    return (await this.client.post('/split-payments/calculate', data)).data;
  }

  async createPaymentCycle(data: {
    propertyId: string; leaseId: string; cycleLabel: string;
    cycleStart: string; cycleEnd: string; totalRent: number;
    tenantShares: Array<{
      tenantUserId: string; tenantName: string; tenantPhone?: string;
      amountDue: number; momoPhone?: string; momoProvider?: 'mtn' | 'orange'; dueDate: string;
    }>;
  }) {
    return (await this.client.post('/split-payments/cycles', data)).data;
  }

  async getLandlordPaymentCycles(status?: string) {
    return (await this.client.get('/split-payments/cycles/landlord', { params: status ? { status } : {} })).data;
  }

  async getMyTenantPayments() {
    return (await this.client.get('/split-payments/cycles/mine')).data;
  }

  async getPaymentCyclesByLease(leaseId: string) {
    return (await this.client.get(`/split-payments/cycles/lease/${leaseId}`)).data;
  }

  async getPaymentCycle(cycleId: string) {
    return (await this.client.get(`/split-payments/cycles/${cycleId}`)).data;
  }

  async initiateTenantMomoCharge(cycleId: string, data: {
    tenantUserId: string; momoPhone: string; momoProvider: 'mtn' | 'orange';
  }) {
    return (await this.client.post(`/split-payments/cycles/${cycleId}/charge`, data)).data;
  }

  async recordTenantPayment(cycleId: string, data: {
    tenantUserId: string; amountPaid: number;
    momoTransactionId?: string; momoProvider?: 'mtn' | 'orange';
  }) {
    return (await this.client.patch(`/split-payments/cycles/${cycleId}/payment`, data)).data;
  }

  async adminMarkCycleDisbursed(cycleId: string, disbursementTransactionId?: string) {
    return (await this.client.patch(`/split-payments/cycles/${cycleId}/disburse`, { disbursementTransactionId })).data;
  }

  // ─── Digital Leases ──────────────────────────────────────────────────────
  async createDigitalLease(data: {
    propertyId: string;
    tenants: Array<{
      tenantUserId: string; tenantName: string;
      tenantEmail?: string; tenantPhone?: string; rentShare: number;
    }>;
    leaseStart: string; leaseEnd: string; monthlyRent: number;
    depositAmount?: number; advanceMonths?: number;
    customClauses?: Array<{ heading: string; body: string }>;
  }) {
    return (await this.client.post('/digital-leases', data)).data;
  }

  async getLandlordLeases(status?: string) {
    return (await this.client.get('/digital-leases/mine/landlord', { params: status ? { status } : {} })).data;
  }

  async getMyTenantLeases() {
    return (await this.client.get('/digital-leases/mine/tenant')).data;
  }

  async getDigitalLease(leaseId: string) {
    return (await this.client.get(`/digital-leases/${leaseId}`)).data;
  }

  async signDigitalLease(leaseId: string, signatureBase64: string) {
    return (await this.client.patch(`/digital-leases/${leaseId}/sign`, { signatureBase64 })).data;
  }

  async addLeaseConditionLog(leaseId: string, data: {
    type: 'move_in' | 'move_out';
    items: Array<{ label: string; rating: 'excellent' | 'good' | 'fair' | 'poor'; notes?: string }>;
    overallNotes?: string;
  }) {
    return (await this.client.post(`/digital-leases/${leaseId}/condition-log`, data)).data;
  }

  async uploadLeaseConditionPhotos(
    leaseId: string, logType: 'move_in' | 'move_out', itemLabel: string, files: File[],
  ) {
    const formData = new FormData();
    files.forEach(f => formData.append('file', f));
    return (await this.client.post(
      `/digital-leases/${leaseId}/condition-photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, params: { logType, itemLabel } },
    )).data;
  }

  async terminateDigitalLease(leaseId: string, reason: string) {
    return (await this.client.patch(`/digital-leases/${leaseId}/terminate`, { reason })).data;
  }

  // ─── Hosts ────────────────────────────────────────────────────────────────

  /** Public: paginated list of active hosts with short-term listing stats. */
  async getHosts(params?: { page?: number; limit?: number }) {
    return (await this.client.get('/users/hosts', { params, skipAuth: true } as any)).data;
  }

  /** Public: full host profile — sensitive fields (gov-ID public_id, account identifiers) stripped. */
  async getHostById(id: string) {
    return (await this.client.get(`/users/hosts/${id}`, { skipAuth: true } as any)).data;
  }

  async getHostingBookings(params?: any) { return (await this.client.get('/bookings/hosting', { params })).data; }

  /** Live dashboard stats for a host synthesized from live bookings and properties data. */
  async getHostStats(_userId?: string) {
    return (await this.client.get('/bookings/host-stats')).data;
  }

  /**
   * PATCH host profile fields (HOST or ADMIN only).
   * Accepts any subset of UpdateHostProfileDto fields:
   * instantBookEnabled, min/maxNightsDefault, house rules, payout accounts,
   * co-host add/remove, hostBio, hostLanguages, operatingCity.
   */
  async updateHostProfile(id: string, data: {
    instantBookEnabled?: boolean;
    minNightsDefault?: number;
    maxNightsDefault?: number;
    advanceNoticeHours?: number;
    bookingWindowMonths?: number;
    petsAllowedDefault?: boolean;
    smokingAllowedDefault?: boolean;
    eventsAllowedDefault?: boolean;
    checkInTimeDefault?: string;
    checkOutTimeDefault?: string;
    addPayoutAccount?: {
      method: 'mobile_money' | 'bank_transfer' | 'paypal';
      accountIdentifier: string;
      providerName?: string;
      isDefault?: boolean;
      currency?: string;
    };
    removePayoutAccountIdentifier?: string;
    addCoHostId?: string;
    removeCoHostId?: string;
    hostBio?: string;
    hostLanguages?: string[];
    operatingCity?: string;
  }) {
    return (await this.client.patch(`/users/hosts/${id}/profile`, data)).data;
  }

  /**
   * Upload government ID for host verification.
   * Sets verificationStatus → PENDING.
   */
  async uploadHostGovernmentId(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return (await this.client.post(`/users/hosts/${id}/government-id`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  /** Admin: approve or reject host identity verification. */
  async verifyHost(id: string, decision: 'approve' | 'reject', rejectionReason?: string) {
    return (await this.client.patch(`/users/hosts/${id}/verify`, { decision, rejectionReason })).data;
  }

  /** Admin: manually trigger Superhost threshold recalculation. */
  async recalculateSuperhostStatus(id: string) {
    return (await this.client.post(`/users/hosts/${id}/superhost/recalculate`)).data;
  }

  /**
   * Admin / payments service: record a completed payout.
   * Called internally after a booking stay completes.
   */
  async recordHostPayout(id: string, record: {
    amount: number;
    currency: string;
    method: 'mobile_money' | 'bank_transfer' | 'paypal';
    reference?: string;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    initiatedAt: string;
    completedAt?: string;
    failureReason?: string;
  }) {
    return (await this.client.post(`/users/hosts/${id}/payouts`, record)).data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;