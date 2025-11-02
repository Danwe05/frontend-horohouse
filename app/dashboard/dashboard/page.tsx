"use client";

import { AppSidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import { Home, Building2, TrendingUp, DollarSign, Users, Plus } from "lucide-react";
import WelcomeHorohouse from "@/components/dashboard/WelcomeHoroHouse";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Property {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  location?: {
    address: string;
    city: string;
    state: string;
  };
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: {
    bedrooms?: number;
    bathrooms?: number;
  };
  beds?: number;
  baths?: number;
  area?: number;
  sqft?: number;
  squareFeet?: number;
  images: Array<{ url: string } | string>;
  type: string;
  status: string;
  availability?: string;
  isFeatured: boolean;
  isVerified: boolean;
  viewCount?: number;
  viewsCount?: number;
  views?: number;
  favoriteCount?: number;
  favorites?: number;
  inquiries?: number;
  isFavorite?: boolean;
  isActive?: boolean;
}

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
}

const Index = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sortBy, setSortBy] = useState("recent");

  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        console.log('⚠️ No user found, skipping stats fetch');
        return;
      }

      try {
        setLoadingStats(true);
        console.log('\n🔍 ==================== FETCHING STATS ====================');
        console.log('👤 User role:', user.role, '| Is Agent:', isAgent);
        
        if (isAgent) {
          // AGENT STATS - Fetch properties and calculate stats from them
          console.log('🏢 Fetching agent properties to calculate stats...');
          
          try {
            // Fetch all agent properties (not just the first 6)
            const propertiesResponse = await apiClient.getMyProperties();
            console.log('📦 Properties response:', propertiesResponse);
            
            // Extract properties array
            let agentProperties: Property[] = [];
            if (Array.isArray(propertiesResponse)) {
              agentProperties = propertiesResponse;
            } else if (propertiesResponse?.properties && Array.isArray(propertiesResponse.properties)) {
              agentProperties = propertiesResponse.properties;
            } else if (propertiesResponse?.data && Array.isArray(propertiesResponse.data)) {
              agentProperties = propertiesResponse.data;
            }

            console.log(`📊 Found ${agentProperties.length} properties for agent`);

            // Calculate stats from properties
            const totalProperties = agentProperties.length;
            
            // Count active listings - check multiple possible status fields
            const activeListings = agentProperties.filter(p => {
              const status = p.status || p.availability;
              const isActive = p.isActive !== false; // Default to true if undefined
              return (status === 'active' || status === 'available') && isActive;
            }).length;

            // Sum total views - check multiple possible field names
            const totalViews = agentProperties.reduce((sum, p) => {
              const views = p.viewsCount || p.viewCount || p.views || 0;
              return sum + views;
            }, 0);

            // Fetch inquiry stats from the inquiry service
            let totalInquiries = 0;
            try {
              const inquiryStats = await apiClient.getInquiryStats();
              console.log('📧 Inquiry stats response:', inquiryStats);
              totalInquiries = inquiryStats?.total || inquiryStats?.data?.total || 0;
            } catch (inquiryError) {
              console.warn('Failed to fetch inquiry stats, using property inquiries count:', inquiryError);
              // Fallback: Sum inquiries from properties
              totalInquiries = agentProperties.reduce((sum, p) => {
                const inquiries = p.inquiries || 0;
                return sum + inquiries;
              }, 0);
            }

            const calculatedStats = {
              totalProperties,
              activeListings,
              totalViews,
              totalInquiries,
            };

            console.log('✨ Calculated agent stats:', calculatedStats);
            console.log('  - Total Properties:', totalProperties);
            console.log('  - Active Listings:', activeListings);
            console.log('  - Total Views:', totalViews);
            console.log('  - Total Inquiries:', totalInquiries);

            setStats(calculatedStats);

          } catch (agentError: any) {
            console.error('❌ Agent stats error:', {
              message: agentError?.message,
              status: agentError?.response?.status,
              data: agentError?.response?.data,
            });
            throw agentError;
          }

        } else {
          // USER STATS - Fetch user-specific data
          console.log('👥 Fetching user stats...');
          
          try {
            // Fetch user data in parallel
            const [favoritesResponse, recentResponse, searchResponse] = await Promise.all([
              apiClient.getFavorites().catch((err) => {
                console.warn('Failed to fetch favorites:', err);
                return null;
              }),
              apiClient.getRecentlyViewed(10).catch((err) => {
                console.warn('Failed to fetch recently viewed:', err);
                return null;
              }),
              apiClient.getSearchHistory(20).catch((err) => {
                console.warn('Failed to fetch search history:', err);
                return null;
              }),
            ]);

            console.log('📦 User data responses:', {
              favorites: favoritesResponse,
              recent: recentResponse,
              search: searchResponse,
            });

            // Extract favorites - /users/me/favorites returns User object with populated favorites array
            let favorites = [];
            if (favoritesResponse) {
              if (Array.isArray(favoritesResponse?.favorites)) {
                favorites = favoritesResponse.favorites;
              } else if (Array.isArray(favoritesResponse?.data?.favorites)) {
                favorites = favoritesResponse.data.favorites;
              } else if (Array.isArray(favoritesResponse)) {
                favorites = favoritesResponse;
              }
            }

            // Extract recently viewed - returns array of objects with property and viewedAt
            let recentlyViewed = [];
            if (recentResponse) {
              if (Array.isArray(recentResponse)) {
                recentlyViewed = recentResponse;
              } else if (Array.isArray(recentResponse?.data)) {
                recentlyViewed = recentResponse.data;
              } else if (Array.isArray(recentResponse?.recentlyViewed)) {
                recentlyViewed = recentResponse.recentlyViewed;
              }
            }

            // Extract search history - returns array of search query objects
            let searchHistory = [];
            if (searchResponse) {
              if (Array.isArray(searchResponse)) {
                searchHistory = searchResponse;
              } else if (Array.isArray(searchResponse?.data)) {
                searchHistory = searchResponse.data;
              } else if (Array.isArray(searchResponse?.searchHistory)) {
                searchHistory = searchResponse.searchHistory;
              }
            }

            console.log('📊 Extracted data:', {
              favoritesCount: favorites.length,
              recentlyViewedCount: recentlyViewed.length,
              searchHistoryCount: searchHistory.length,
            });

            // Try to get inquiry count from inquiry stats
            let inquiryCount = 0;
            try {
              const inquiryStats = await apiClient.getInquiryStats();
              console.log('📧 User inquiry stats response:', inquiryStats);
              inquiryCount = inquiryStats?.total || inquiryStats?.data?.total || 0;
            } catch (err) {
              console.warn('Failed to fetch inquiry stats:', err);
            }

            const calculatedStats = {
              totalProperties: favorites.length, // Favorites count
              activeListings: recentlyViewed.length, // Recently viewed count
              totalViews: searchHistory.length, // Search history count
              totalInquiries: inquiryCount,
            };

            console.log('✨ Calculated user stats:', calculatedStats);
            console.log('  - Favorites:', favorites.length);
            console.log('  - Recently Viewed:', recentlyViewed.length);
            console.log('  - Searches:', searchHistory.length);
            console.log('  - Inquiries:', inquiryCount);

            setStats(calculatedStats);

          } catch (userError: any) {
            console.error('❌ User stats error:', {
              message: userError?.message,
              status: userError?.response?.status,
              data: userError?.response?.data,
            });
            throw userError;
          }
        }

        console.log('🎉 Stats fetch completed successfully!');
        console.log('==================== END STATS FETCH ====================\n');
        
      } catch (error: any) {
        console.error('\n💥 ==================== STATS FETCH FAILED ====================');
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
        });
        console.error('==================== END ERROR ====================\n');
        
        // Keep stats at zero on error
        setStats({
          totalProperties: 0,
          activeListings: 0,
          totalViews: 0,
          totalInquiries: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, isAgent]);

  // Fetch properties based on user role
  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;

      try {
        setLoadingProperties(true);
        let response;

        if (isAgent) {
          response = await apiClient.getMyProperties({ limit: 6, sort: sortBy });
        } else {
          response = await apiClient.getRecentProperties(6);
        }

        let propertyData: Property[] = [];
        if (Array.isArray(response)) {
          propertyData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          propertyData = response.data;
        } else if (response?.properties && Array.isArray(response.properties)) {
          propertyData = response.properties;
        }

        console.log(`📍 Loaded ${propertyData.length} properties for display`);
        setProperties(propertyData);
      } catch (error) {
        console.error('Failed to fetch properties:', error);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [user, isAgent, sortBy]);

  const handlePropertyUpdate = () => {
    const fetchProperties = async () => {
      try {
        let response;
        if (isAgent) {
          response = await apiClient.getMyProperties({ limit: 6, sort: sortBy });
        } else {
          response = await apiClient.getRecentProperties(6);
        }
        
        let propertyData: Property[] = [];
        if (Array.isArray(response)) {
          propertyData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          propertyData = response.data;
        } else if (response?.properties && Array.isArray(response.properties)) {
          propertyData = response.properties;
        }
        
        setProperties(propertyData);
      } catch (error) {
        console.error('Failed to refresh properties:', error);
        setProperties([]);
      }
    };
    fetchProperties();
  };

  const getStatsData = () => {
    if (isAgent) {
      return [
        {
          title: "Total Properties",
          value: stats.totalProperties.toString(),
          icon: Building2,
          subtitle: "Properties listed",
          trend: { value: 12, isPositive: true },
        },
        {
          title: "Active Listings",
          value: stats.activeListings.toString(),
          icon: Home,
          subtitle: "Currently active",
          trend: { value: 8, isPositive: true },
        },
        {
          title: "Total Views",
          value: stats.totalViews.toString(),
          icon: TrendingUp,
          subtitle: "Property views",
          trend: { value: 15, isPositive: true },
        },
        {
          title: "Inquiries",
          value: stats.totalInquiries.toString(),
          icon: Users,
          subtitle: "Total inquiries",
          trend: { value: 5, isPositive: true },
        },
      ];
    } else {
      return [
        {
          title: "Favorites",
          value: stats.totalProperties.toString(),
          icon: Home,
          subtitle: "Saved properties",
          trend: { value: 3, isPositive: true },
        },
        {
          title: "Viewed",
          value: stats.activeListings.toString(),
          icon: TrendingUp,
          subtitle: "Properties viewed",
          trend: { value: 10, isPositive: true },
        },
        {
          title: "Searches",
          value: stats.totalViews.toString(),
          icon: Building2,
          subtitle: "Total searches",
          trend: { value: 7, isPositive: true },
        },
        {
          title: "Inquiries Sent",
          value: stats.totalInquiries.toString(),
          icon: Users,
          subtitle: "Contact requests",
          trend: { value: 2, isPositive: true },
        },
      ];
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="flex-1">
            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {loadingStats ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                  ))
                ) : (
                  getStatsData().map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                  ))
                )}
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="mb-4">
                    <WelcomeHorohouse />
                  </div>
                  <div>
                    <SalesChart />
                  </div>
                </div>
                <div>
                  <DashboardCalendar />
                </div>
              </div>

              {/* Property Listings */}
              <div className="grid grid-cols-1 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-card rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold">
                          {isAgent ? "My Properties" : "Recommended Properties"}
                        </h2>
                        {isAgent && properties.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            {properties.length} Listed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {isAgent && (
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recent">Recent Listed</SelectItem>
                              <SelectItem value="-price">Price: High to Low</SelectItem>
                              <SelectItem value="price">Price: Low to High</SelectItem>
                              <SelectItem value="-viewCount">Most Viewed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(isAgent ? '/dashboard/property' : '/properties')}
                        >
                          View All
                        </Button>
                        {isAgent && (
                          <Button
                            size="sm"
                            onClick={() => router.push('/dashboard/propertyForm')}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add New
                          </Button>
                        )}
                      </div>
                    </div>

                    {loadingProperties ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
                        ))}
                      </div>
                    ) : properties.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">
                          {isAgent ? "No properties listed yet" : "No properties available"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {isAgent 
                            ? "Start by adding your first property listing" 
                            : "Check back later for new listings"}
                        </p>
                        {isAgent && (
                          <Button onClick={() => router.push('/dashboard/propertyForm')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Property
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {properties.map((property) => {
                          const propertyId = property._id || property.id;
                          const images = property.images || [];
                          const firstImage = images.length > 0 
                            ? (typeof images[0] === 'string' ? images[0] : images[0]?.url || images[0])
                            : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500";
                          
                          const addressParts = [
                            property.address,
                            property.city,
                            property.country
                          ].filter(Boolean);
                          const locationStr = addressParts.length > 0 
                            ? addressParts.join(", ")
                            : "Location not specified";

                          const beds = property.amenities?.bedrooms ?? property.bedrooms ?? property.beds ?? 0;
                          const baths = property.amenities?.bathrooms ?? property.bathrooms ?? property.baths ?? 0;

                          return (
                            <PropertyCard
                              key={propertyId}
                              id={propertyId}
                              image={firstImage}
                              title={property.title || "Untitled Property"}
                              location={locationStr}
                              price={property.price || 0}
                              beds={beds}
                              baths={baths}
                              sqft={property.area || property.sqft || property.squareFeet || 0}
                              type={property.type || "sale"}
                              status={property.status || property.availability || "active"}
                              isFeatured={property.isFeatured || false}
                              isVerified={property.isVerified || false}
                              viewCount={property.viewsCount || property.viewCount || property.views || 0}
                              favoriteCount={property.favoriteCount || property.favorites || 0}
                              isFavorite={property.isFavorite || false}
                              onUpdate={handlePropertyUpdate}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;