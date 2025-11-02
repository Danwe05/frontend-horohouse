'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiTester } from '@/lib/api-test';
import { Play, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export default function APITestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    error: number;
    successRate: number;
  } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      const testResults = await apiTester.runAllTests();
      setResults(testResults);
      
      const successCount = testResults.filter(r => r.status === 'success').length;
      const errorCount = testResults.filter(r => r.status === 'error').length;
      
      setSummary({
        total: testResults.length,
        success: successCount,
        error: errorCount,
        successRate: Math.round((successCount / testResults.length) * 100)
      });
    } catch (error) {
      console.error('Failed to run API tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HoroHouse API Integration Tests</h1>
          <p className="text-gray-600">
            Test all critical API endpoints to ensure frontend-backend communication is working correctly.
          </p>
        </div>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
              
              {summary && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-medium">
                    ✅ {summary.success} Success
                  </span>
                  <span className="text-red-600 font-medium">
                    ❌ {summary.error} Failed
                  </span>
                  <span className="text-blue-600 font-medium">
                    📈 {summary.successRate}% Success Rate
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <span className="font-mono text-sm font-medium">
                          {result.endpoint}
                        </span>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {result.message}
                    </p>
                    
                    {result.data && (
                      <div className="bg-gray-50 rounded p-3 mt-2">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {results.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints to Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Property Search Endpoints:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                  <li><code>GET /api/v1/properties</code> - Property search with filters</li>
                  <li><code>GET /api/v1/properties/search</code> - Text-based search</li>
                  <li><code>GET /api/v1/properties/featured</code> - Featured properties</li>
                  <li><code>GET /api/v1/properties/recent</code> - Recent properties</li>
                  <li><code>GET /api/v1/properties/most-viewed</code> - Popular properties</li>
                  <li><code>GET /api/v1/properties/nearby</code> - Location-based search</li>
                  <li><code>GET /api/v1/properties/:id</code> - Property details</li>
                </ul>
                
                <Separator className="my-4" />
                
                <p className="text-sm text-gray-500">
                  <strong>Note:</strong> Make sure your backend is running on port 4000 before running these tests.
                  The tests will validate API responses and error handling.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
