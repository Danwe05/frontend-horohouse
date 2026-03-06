"use client";

import { useState } from "react";
import GlobalSearch from "./GlobalSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchTest() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Functionality Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Global Search Component:</h3>
            <GlobalSearch />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Try searching for "modern" - should find properties</li>
              <li>Try searching for "david" - should find messages</li>
              <li>Try searching for "purchase" - should find transactions</li>
              <li>Try searching for "john" - should find agents</li>
              <li>Try typing with no results - should show empty state</li>
              <li>Click on results to navigate to respective pages</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Features Implemented:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>✅ Real-time search with debouncing</li>
              <li>✅ Search across properties, messages, transactions, and agents</li>
              <li>✅ Dropdown results with type badges</li>
              <li>✅ Quick access links when no query</li>
              <li>✅ Loading states</li>
              <li>✅ Empty state handling</li>
              <li>✅ Mobile responsive design</li>
              <li>✅ Keyboard navigation support</li>
              <li>✅ Click outside to close</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
