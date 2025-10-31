'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
}

interface ConnectionTestProps {
  className?: string;
}

export function ConnectionTest({ className }: ConnectionTestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HealthStatus = await response.json();
      setHealthStatus(data);
      setLastChecked(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setHealthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    
    if (error) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    
    if (healthStatus?.status === 'ok') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    return <XCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Testing connection...';
    if (error) return 'Connection failed';
    if (healthStatus?.status === 'ok') return 'Connected';
    return 'Unknown status';
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-100 text-blue-800';
    if (error) return 'bg-red-100 text-red-800';
    if (healthStatus?.status === 'ok') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Backend Connection</CardTitle>
            <CardDescription>
              API connection status and health check
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge className={getStatusColor()}>
            {healthStatus?.status || 'Unknown'}
          </Badge>
        </div>

        {/* API Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">API URL:</span>
            <p className="font-mono text-xs break-all">
              {process.env.NEXT_PUBLIC_API_URL}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Environment:</span>
            <p className="font-medium">
              {healthStatus?.environment || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Service Info */}
        {healthStatus && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Service:</span>
              <p className="font-medium">{healthStatus.service}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>
              <p className="font-medium">{healthStatus.version}</p>
            </div>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Error Details:</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <div className="mt-2 text-xs text-red-500">
              <p>Common solutions:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Ensure backend server is running on port 4000</li>
                <li>Check if MongoDB connection is established</li>
                <li>Verify CORS configuration</li>
                <li>Check network connectivity</li>
              </ul>
            </div>
          </div>
        )}

        {/* Last Checked */}
        {lastChecked && (
          <div className="text-xs text-muted-foreground">
            Last checked: {lastChecked.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}