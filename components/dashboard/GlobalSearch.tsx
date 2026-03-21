"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Building2, MessageSquare, FileText, Users, Home, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ className }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock data - replace with actual API calls
  const mockProperties = [
    {
      id: "1",
      title: "Modern Downtown Apartment",
      description: "3 bedroom apartment in city center",
      location: "New York",
      price: "$450,000",
      status: "For Sale"
    },
    {
      id: "2",
      title: "Suburban Family House",
      description: "5 bedroom house with garden",
      location: "California",
      price: "$750,000",
      status: "For Rent"
    }
  ];

  const mockMessages = [
    {
      id: "1",
      title: "David Johnson",
      description: "Check the photos I sent to you",
      unread: 3,
      date: "2 hours ago"
    },
    {
      id: "2",
      title: "Sarah Williams",
      description: "Great, thank so much!",
      unread: 0,
      date: "1 day ago"
    }
  ];

  const mockTransactions = [
    {
      id: "1",
      title: "Property Purchase #1234",
      description: "Modern Downtown Apartment",
      amount: "$450,000",
      status: "Completed",
      date: "2024-01-15"
    }
  ];

  const mockAgents = [
    {
      id: "1",
      title: "John Smith",
      description: "Senior Real Estate Agent",
      properties: 25,
      rating: 4.8
    }
  ];

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

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
            status: `${agent.properties} properties`
          }
        });
      }
    });

    setResults(searchResults);
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const getIconForResult = (type: SearchResult["type"]) => {
    switch (type) {
      case "property": return Building2;
      case "message": return MessageSquare;
      case "transaction": return FileText;
      case "agent": return Users;
      default: return FileText;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "property": return "bg-blue-100 text-blue-800";
      case "message": return "bg-green-100 text-green-800";
      case "transaction": return "bg-purple-100 text-purple-800";
      case "agent": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search properties, messages, transactions..."
          className="pl-10 pr-10 h-10 bg-background/50 border-border/50 focus:bg-background focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 rounded-xl"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto -xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {results.length} Results Found
                </div>
                {results.map((result) => {
                  const Icon = getIconForResult(result.type);
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{result.title}</h4>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {result.description}
                            </p>
                            {result.metadata && (
                              <div className="flex items-center gap-2 mt-2">
                                {result.metadata.price && (
                                  <span className="text-xs font-medium text-blue-600">
                                    {result.metadata.price}
                                  </span>
                                )}
                                {result.metadata.location && (
                                  <span className="text-xs text-muted-foreground">
                                    {result.metadata.location}
                                  </span>
                                )}
                                {result.metadata.unread && result.metadata.unread > 0 && (
                                  <Badge variant="destructive" className="text-xs h-4 px-1">
                                    {result.metadata.unread}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={cn("text-xs", getTypeColor(result.type))}>
                            {result.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : query ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try searching with different keywords
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Quick Access
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/property")}
                    className="w-full justify-start gap-3 px-3 py-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">Properties</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/message")}
                    className="w-full justify-start gap-3 px-3 py-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Messages</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/transactions")}
                    className="w-full justify-start gap-3 px-3 py-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Transactions</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
