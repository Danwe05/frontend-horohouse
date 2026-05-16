"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, MessageSquare, FileText, Users, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "property" | "message" | "transaction" | "agent" | "document";
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  metadata?: {
    price?: string;
    location?: string;
    status?: string;
    date?: string;
    unread?: number;
  };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Mock data - replace with actual API calls
  const mockProperties = [
    {
      id: "1",
      title: "Modern Downtown Apartment",
      description: "3 bedroom apartment in city center with modern amenities",
      location: "New York, Manhattan",
      price: "$450,000",
      status: "For Sale"
    },
    {
      id: "2",
      title: "Suburban Family House",
      description: "5 bedroom house with garden and pool",
      location: "California, Beverly Hills",
      price: "$750,000",
      status: "For Rent"
    },
    {
      id: "3",
      title: "Luxury Penthouse",
      description: "Penthouse with panoramic city views",
      location: "New York, Upper East Side",
      price: "$2,500,000",
      status: "For Sale"
    }
  ];

  const mockMessages = [
    {
      id: "1",
      title: "David Johnson",
      description: "Check the photos I sent to you regarding the property viewing",
      unread: 3,
      date: "2 hours ago"
    },
    {
      id: "2",
      title: "Sarah Williams",
      description: "Great, thank so much for the quick response!",
      unread: 0,
      date: "1 day ago"
    }
  ];

  const mockTransactions = [
    {
      id: "1",
      title: "Property Purchase #1234",
      description: "Modern Downtown Apartment - Sale completed successfully",
      amount: "$450,000",
      status: "Completed",
      date: "2024-01-15"
    },
    {
      id: "2",
      title: "Rental Agreement #5678",
      description: "Suburban Family House - Monthly rent payment",
      amount: "$3,500",
      status: "Pending",
      date: "2024-01-20"
    }
  ];

  const mockAgents = [
    {
      id: "1",
      title: "John Smith",
      description: "Senior Real Estate Agent with 10+ years experience",
      properties: 25,
      rating: 4.8
    },
    {
      id: "2",
      title: "Emily Davis",
      description: "Luxury Property Specialist",
      properties: 18,
      rating: 4.9
    }
  ];

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const searchResults: SearchResult[] = [];
    const queryLower = searchQuery.toLowerCase();

    // Search properties
    mockProperties.forEach(property => {
      if (
        property.title.toLowerCase().includes(queryLower) ||
        property.description.toLowerCase().includes(queryLower) ||
        property.location.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: `property-${property.id}`,
          type: "property",
          title: property.title,
          description: property.description,
          url: `/dashboard/property/${property.id}`,
          icon: Building2,
          metadata: {
            price: property.price,
            location: property.location,
            status: property.status
          }
        });
      }
    });

    // Search messages
    mockMessages.forEach(message => {
      if (
        message.title.toLowerCase().includes(queryLower) ||
        message.description.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: `message-${message.id}`,
          type: "message",
          title: message.title,
          description: message.description,
          url: `/dashboard/message/${message.id}`,
          icon: MessageSquare,
          metadata: {
            unread: message.unread,
            date: message.date
          }
        });
      }
    });

    // Search transactions
    mockTransactions.forEach(transaction => {
      if (
        transaction.title.toLowerCase().includes(queryLower) ||
        transaction.description.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: `transaction-${transaction.id}`,
          type: "transaction",
          title: transaction.title,
          description: transaction.description,
          url: `/dashboard/transactions/${transaction.id}`,
          icon: FileText,
          metadata: {
            price: transaction.amount,
            status: transaction.status,
            date: transaction.date
          }
        });
      }
    });

    // Search agents
    mockAgents.forEach(agent => {
      if (
        agent.title.toLowerCase().includes(queryLower) ||
        agent.description.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: `agent-${agent.id}`,
          type: "agent",
          title: agent.title,
          description: agent.description,
          url: `/dashboard/agents/${agent.id}`,
          icon: Users,
          metadata: {
            status: `${agent.properties} properties • ${agent.rating}★`
          }
        });
      }
    });

    setResults(searchResults);
    setIsLoading(false);
  };

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = (e.target as HTMLFormElement).search.value;
    setQuery(searchQuery);
    router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const filteredResults = activeFilter === "all"
    ? results
    : results.filter(result => result.type === activeFilter);

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "property": return "bg-blue-100 text-blue-800";
      case "message": return "bg-green-100 text-green-800";
      case "transaction": return "bg-purple-100 text-purple-800";
      case "agent": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filters = [
    { id: "all", label: "All Results", count: results.length },
    { id: "property", label: "Properties", count: results.filter(r => r.type === "property").length },
    { id: "message", label: "Messages", count: results.filter(r => r.type === "message").length },
    { id: "transaction", label: "Transactions", count: results.filter(r => r.type === "transaction").length },
    { id: "agent", label: "Agents", count: results.filter(r => r.type === "agent").length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600">
            {query && `Showing results for "${query}"`}
            {!query && "Enter a search term to find properties, messages, transactions, and more"}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  name="search"
                  type="text"
                  placeholder="Search properties, messages, transactions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        {results.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter by type:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.id)}
                    className="gap-2"
                  >
                    {filter.label}
                    <Badge variant="secondary" className="text-xs">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Found {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
            </p>
            {filteredResults.map((result) => {
              const Icon = result.icon;
              return (
                <Card key={result.id} className="hover:-md transition- cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {result.title}
                            </h3>
                            <p className="text-gray-600 mb-2">{result.description}</p>
                            {result.metadata && (
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {result.metadata.price && (
                                  <span className="font-medium text-blue-600">
                                    {result.metadata.price}
                                  </span>
                                )}
                                {result.metadata.location && (
                                  <span>{result.metadata.location}</span>
                                )}
                                {result.metadata.date && (
                                  <span>{result.metadata.date}</span>
                                )}
                                {result.metadata.status && (
                                  <span>{result.metadata.status}</span>
                                )}
                                {result.metadata.unread && result.metadata.unread > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {result.metadata.unread} unread
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getTypeColor(result.type)}>
                              {result.type}
                            </Badge>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : query ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find anything matching "{query}"
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Try:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Checking your spelling</li>
                  <li>• Using more general keywords</li>
                  <li>• Searching for different terms</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">
                Enter a search term above to find properties, messages, transactions, and more
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          }>
            <SearchResults />
          </Suspense>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
