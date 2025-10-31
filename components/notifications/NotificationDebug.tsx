import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export default function NotificationDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const debugData: any = {};

      // Check if user is logged in
      debugData.isLoggedIn = authService.isLoggedIn();
      
      // Get stored tokens
      debugData.accessToken = authService.getAccessToken();
      debugData.refreshToken = authService.getRefreshToken();
      debugData.storedUser = authService.getStoredUser();

      // Check token expiration
      debugData.isTokenExpired = authService.isTokenExpired();

      // Verify token with server
      debugData.tokenValid = await authService.verifyToken();

      // Test notifications API directly
      try {
        const notificationsResponse = await apiClient.getNotifications({ limit: 1 });
        debugData.notificationsTest = { success: true, count: notificationsResponse.notifications.length };
      } catch (error: any) {
        debugData.notificationsTest = { 
          success: false, 
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        };
      }

      // Test unread count API
      try {
        const unreadResponse = await apiClient.getUnreadNotificationCount();
        debugData.unreadCountTest = { success: true, count: unreadResponse.count };
      } catch (error: any) {
        debugData.unreadCountTest = { 
          success: false, 
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        };
      }

      setDebugInfo(debugData);
    } catch (error) {
      console.error('Debug check failed:', error);
      setDebugInfo({ error: 'Debug check failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokens = () => {
    authService.logout();
    setDebugInfo({});
  };

  const refreshToken = async () => {
    try {
      const newTokens = await authService.refreshToken();
      if (newTokens) {
        alert('Token refreshed successfully!');
        checkAuthStatus();
      } else {
        alert('Token refresh failed');
      }
    } catch (error) {
      alert('Token refresh error: ' + error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-4">🔍 Notification API Debug</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={checkAuthStatus}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Check Status'}
        </button>
        <button
          onClick={refreshToken}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Refresh Token
        </button>
        <button
          onClick={clearTokens}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Tokens
        </button>
      </div>

      <div className="bg-white p-3 rounded border text-sm">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Common Issues & Solutions:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>401 Unauthorized:</strong> Token expired or invalid - try refreshing token</li>
          <li><strong>No token:</strong> User not logged in - need to login again</li>
          <li><strong>Token expired:</strong> Use refresh token button or login again</li>
          <li><strong>Server error:</strong> Check if backend is running on port 4000</li>
        </ul>
      </div>
    </div>
  );
}


