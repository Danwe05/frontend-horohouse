"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiClient from "@/lib/api";
import { authService } from "@/lib/auth";

export default function TestViewTracking() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTracking = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.group("🧪 TESTING VIEW TRACKING");

      // Step 1: Check authentication
      const token = authService.getAccessToken();
      console.log("1️⃣ Token exists:", !!token);

      // Step 2: Get a property (this should track the view)
      const propertyId = "6908e01db6737012727df03a"; // Use your property ID
      console.log("2️⃣ Fetching property:", propertyId);
      
      const property = await apiClient.getProperty(propertyId);
      console.log("3️⃣ Property fetched:", property.title);

      // Step 3: Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Check recently viewed
      console.log("4️⃣ Checking recently viewed...");
      const recentlyViewed = await apiClient.getRecentlyViewed(10);
      console.log("5️⃣ Recently viewed response:", recentlyViewed);

      // Step 5: Check if our property is in the list
      const found = recentlyViewed?.some((item: any) => {
        const propId = item.property?._id || item.property?.id || item.id;
        return propId === propertyId;
      });

      console.log("6️⃣ Property found in recently viewed:", found);

      // Step 6: Also check the viewed-properties endpoint
      console.log("7️⃣ Checking viewed-properties endpoint...");
      const viewedProperties = await apiClient.getViewedProperties({
        page: 1,
        limit: 10
      });
      console.log("8️⃣ Viewed properties response:", viewedProperties);

      const foundInViewed = viewedProperties?.properties?.some((prop: any) => {
        return prop._id === propertyId;
      });

      console.log("9️⃣ Property found in viewed-properties:", foundInViewed);

      console.groupEnd();

      setResult({
        success: true,
        propertyFetched: !!property,
        foundInRecentlyViewed: found,
        foundInViewedProperties: foundInViewed,
        recentlyViewedCount: recentlyViewed?.length || 0,
        viewedPropertiesCount: viewedProperties?.total || 0,
        recentlyViewedData: recentlyViewed,
        viewedPropertiesData: viewedProperties
      });

    } catch (error: any) {
      console.error("❌ Test failed:", error);
      console.error("Response:", error.response?.data);
      console.groupEnd();

      setResult({
        success: false,
        error: error.message,
        errorDetails: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test View Tracking</h1>
      
      <Button 
        onClick={testTracking}
        disabled={loading}
        className="mb-4"
      >
        {loading ? "Testing..." : "Run Tracking Test"}
      </Button>

      {result && (
        <Alert className={result.success ? "border-green-500" : "border-red-500"}>
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-bold">
                {result.success ? "✅ Test Results" : "❌ Test Failed"}
              </div>
              
              {result.success ? (
                <>
                  <div>Property Fetched: {result.propertyFetched ? "✅" : "❌"}</div>
                  <div>Found in Recently Viewed: {result.foundInRecentlyViewed ? "✅" : "❌"}</div>
                  <div>Found in Viewed Properties: {result.foundInViewedProperties ? "✅" : "❌"}</div>
                  <div>Recently Viewed Count: {result.recentlyViewedCount}</div>
                  <div>Viewed Properties Count: {result.viewedPropertiesCount}</div>
                  
                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold">
                      View Raw Data
                    </summary>
                    <pre className="mt-2 p-2 bg-black/10 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <>
                  <div>Error: {result.error}</div>
                  {result.errorDetails && (
                    <pre className="mt-2 p-2 bg-black/10 rounded text-xs overflow-auto">
                      {JSON.stringify(result.errorDetails, null, 2)}
                    </pre>
                  )}
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Run Tracking Test"</li>
          <li>Open browser console (F12)</li>
          <li>Look for logs starting with "🧪 TESTING VIEW TRACKING"</li>
          <li>Check the results above</li>
          <li>Share the console logs and results</li>
        </ol>
      </div>
    </div>
  );
}