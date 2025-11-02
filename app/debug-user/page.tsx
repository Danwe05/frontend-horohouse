'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugUserPage() {
  const { user, isAuthenticated } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageData({
        accessToken: localStorage.getItem('accessToken') ? 'Present (hidden)' : 'Not found',
        refreshToken: localStorage.getItem('refreshToken') ? 'Present (hidden)' : 'Not found',
        user: localStorage.getItem('user'),
      });
    }
  }, []);

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      alert('User ID copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background py-24 px-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <h1 className="text-4xl font-bold">User Debug Info</h1>

        {/* Auth Context */}
        <Card>
          <CardHeader>
            <CardTitle>Auth Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>User Object:</strong></p>
              <pre className="p-4 bg-gray-50 rounded overflow-auto text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* User ID */}
        <Card>
          <CardHeader>
            <CardTitle>User ID (for seeding notifications)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-600 mb-2">Your User ID:</p>
                <p className="text-xl font-mono font-bold">{user?.id || 'Not logged in'}</p>
              </div>
              {user?.id && (
                <>
                  <Button onClick={copyUserId}>
                    Copy User ID to Clipboard
                  </Button>
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="font-semibold mb-2">📝 To create test notifications:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Copy your User ID above</li>
                      <li>Open terminal in: <code className="bg-white px-2 py-1 rounded">d:\projects\horohouse\web\api</code></li>
                      <li>Run: <code className="bg-white px-2 py-1 rounded">npx ts-node src/notifications/seed-notifications.ts {user.id}</code></li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LocalStorage */}
        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-gray-50 rounded overflow-auto text-xs">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* MongoDB Query */}
        <Card>
          <CardHeader>
            <CardTitle>Check MongoDB Directly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To check if notifications exist in your database:
              </p>
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-semibold mb-2">MongoDB Compass:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Connect to: <code className="bg-white px-2 py-1 rounded">mongodb://localhost:27017/horohouse</code></li>
                  <li>Go to <code className="bg-white px-2 py-1 rounded">notifications</code> collection</li>
                  <li>Filter by: <code className="bg-white px-2 py-1 rounded">{`{"userId": ObjectId("${user?.id || 'YOUR_USER_ID'}")}`}</code></li>
                </ol>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-semibold mb-2">mongosh (CLI):</p>
                <pre className="text-xs bg-white p-2 rounded overflow-auto">
{`use horohouse
db.notifications.find({ userId: ObjectId("${user?.id || 'YOUR_USER_ID'}") }).pretty()`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User ID Mismatch Check */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Common Issue: User ID Mismatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm">
                The most common reason for empty notifications is that the <code className="bg-gray-100 px-2 py-1 rounded">userId</code> in 
                the database doesn't match your current user's ID.
              </p>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold mb-2">✅ Solution:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Make sure you're using the correct User ID: <strong>{user?.id}</strong></li>
                  <li>Delete old test notifications in MongoDB</li>
                  <li>Run the seeder with YOUR current User ID</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
