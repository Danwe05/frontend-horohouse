'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationAPI } from '@/lib/api-notifications';
import apiClient from '@/lib/api';

export default function TestNotificationsPage() {
  const { notifications, unreadCount, isLoading, fetchNotifications } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const [apiTest, setApiTest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testDirectAPI = async () => {
    try {
      setError(null);
      console.log('Testing direct API call...');
      
      // Test 1: Check if user is authenticated
      console.log('User:', user);
      console.log('Is Authenticated:', isAuthenticated);
      
      // Test 2: Try to get unread count
      const count = await notificationAPI.getUnreadCount();
      console.log('Unread count:', count);
      
      // Test 3: Try to get notifications
      const response = await notificationAPI.getNotifications({ limit: 10 });
      console.log('Notifications response:', response);
      
      setApiTest({
        user: user,
        isAuthenticated,
        unreadCount: count,
        notifications: response.notifications,
        total: response.total,
      });
    } catch (err: any) {
      console.error('API Test Error:', err);
      setError(err.message || 'Unknown error');
      setApiTest({
        error: err.response?.data || err.message,
        status: err.response?.status,
      });
    }
  };

  const createTestNotification = async () => {
    try {
      setError(null);
      // This would need an admin endpoint or you can create via backend directly
      console.log('To create test notifications, use the backend directly or send an inquiry');
      alert('Send an inquiry on a property to create a test notification!');
    } catch (err: any) {
      console.error('Create notification error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background py-24 px-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <h1 className="text-4xl font-bold">Notification System Test</h1>

        {/* Auth Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>User ID:</strong> {user?._id || 'Not logged in'}</p>
              <p><strong>User Name:</strong> {user?.name || 'N/A'}</p>
              <p><strong>User Role:</strong> {user?.role || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Context Status */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Context Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
              <p><strong>Unread Count:</strong> {unreadCount}</p>
              <p><strong>Total Notifications:</strong> {notifications.length}</p>
              <Button onClick={fetchNotifications} className="mt-4">
                Refresh Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications from Context</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-muted-foreground">No notifications found</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif, index) => (
                  <div key={`${notif._id}-${index}`} className="p-3 border rounded">
                    <p><strong>{notif.title}</strong></p>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {notif.type} | Read: {notif.read ? 'Yes' : 'No'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle>Direct API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testDirectAPI}>
                Test API Connection
              </Button>
              <Button onClick={createTestNotification} variant="outline">
                Create Test Notification
              </Button>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {apiTest && (
                <div className="p-4 bg-gray-50 border rounded">
                  <strong>API Response:</strong>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(apiTest, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Make sure you're logged in</li>
              <li>Click "Test API Connection" to check if the API is working</li>
              <li>Send an inquiry on a property to create a test notification</li>
              <li>Check the browser console for detailed logs</li>
              <li>Click "Refresh Notifications" to fetch latest</li>
            </ol>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <strong>💡 Tip:</strong> Open browser DevTools (F12) and check:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Console tab for error messages</li>
                <li>Network tab to see API requests</li>
                <li>Look for requests to <code>/api/v1/notifications</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
