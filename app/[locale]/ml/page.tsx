'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Brain,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Database,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AdminMLDashboard() {
  const { user } = useAuth();
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<any>(null);

  useEffect(() => {
    fetchMLStatus();
    const interval = setInterval(fetchMLStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMLStatus = async () => {
    try {
      const response = await apiClient.getMLStatus();
      if (response.success) {
        setMlStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching ML status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async (force: boolean = false) => {
    setTraining(true);
    setTrainResult(null);

    try {
      const response = await apiClient.trainMLModel(force);
      setTrainResult(response);

      // Refresh status after training
      setTimeout(fetchMLStatus, 2000);
    } catch (err: any) {
      setTrainResult({
        success: false,
        message: err.message || 'Training failed',
      });
    } finally {
      setTraining(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Admin access required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-15 pt-18">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            ML Recommendation System
          </h2>
          <p className="text-gray-600 mt-1">Monitor and manage the AI recommendation engine</p>
        </div>

        <button
          onClick={() => fetchMLStatus()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Flask Service Status */}
        <div className="bg-white rounded-lg -sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Flask ML Service</h3>
            {mlStatus?.flaskService.healthy ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${mlStatus?.flaskService.healthy
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}>
            <div className={`w-2 h-2 rounded-full ${mlStatus?.flaskService.healthy ? 'bg-green-500' : 'bg-red-500'
              }`} />
            {mlStatus?.flaskService.status || 'Unknown'}
          </div>
        </div>

        {/* Training Status */}
        <div className="bg-white rounded-lg -sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Training Status</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${mlStatus?.sync.isTraining
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
            }`}>
            {mlStatus?.sync.isTraining ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Training in Progress
              </>
            ) : (
              'Idle'
            )}
          </div>
        </div>

        {/* Auto-Sync Status */}
        <div className="bg-white rounded-lg -sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Auto-Sync</h3>
            <Database className="w-5 h-5 text-purple-500" />
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${mlStatus?.sync.autoSyncEnabled
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
            }`}>
            {mlStatus?.sync.autoSyncEnabled ? 'Enabled (Daily 2 AM)' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Last Training Info */}
      {mlStatus?.sync.lastTrainingTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Last Training</h4>
              <p className="text-sm text-blue-700">
                {new Date(mlStatus.sync.lastTrainingTime).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Training Controls */}
      <div className="bg-white rounded-lg -sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Training Controls</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Training the model will sync all properties and user interactions from the database
                to the Flask ML service. This may take several minutes.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleTrainModel(false)}
              disabled={training || mlStatus?.sync.isTraining}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {training ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Train Model
                </>
              )}
            </button>

            <button
              onClick={() => handleTrainModel(true)}
              disabled={training || mlStatus?.sync.isTraining}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Force Retrain
            </button>
          </div>
        </div>
      </div>

      {/* Training Result */}
      {trainResult && (
        <div className={`rounded-lg p-6 ${trainResult.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
          }`}>
          <div className="flex items-start gap-3">
            {trainResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium mb-2 ${trainResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                {trainResult.message}
              </h4>

              {trainResult.success && trainResult.data && (
                <div className="text-sm space-y-1 text-green-700">
                  <p>Properties processed: {trainResult.data.propertiesProcessed}</p>
                  <p>Interactions processed: {trainResult.data.interactionsProcessed}</p>
                  <p>Processing time: {trainResult.data.processingTime}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="bg-white rounded-lg -sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Flask Service</p>
            <p className="font-medium">
              {mlStatus?.flaskService.healthy ? 'Online' : 'Offline'}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Training Queue</p>
            <p className="font-medium">
              {mlStatus?.sync.isTraining ? 'Active' : 'Empty'}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Auto-Sync Schedule</p>
            <p className="font-medium">Daily at 2:00 AM</p>
          </div>

          <div>
            <p className="text-gray-600">Last Check</p>
            <p className="font-medium">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}