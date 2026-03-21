"use client";

import React from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { BookingSummaryWidget } from "@/components/dashboard/BookingSummaryWidget";
import { useLanguage } from "@/contexts/LanguageContext";

type Property = any;

interface Props {
  properties: Property[];
  loadingProperties: boolean;
  sortBy: string;
  setSortBy: (s: string) => void;
  handlePropertyUpdate: () => void;
  router: any;
}

export default function AgentRole({ properties, loadingProperties, sortBy, setSortBy, handlePropertyUpdate, router }: Props) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.roles?.agent || {};
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border-0 -lg p-3 lg:p-6">
            <div className="flex items-center flex-wrap justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{s.myProperties || "My Properties"}</h2>
                {properties.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {properties.length} {s.listed || "Listed"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] sm:w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{s.recentListed || "Recent Listed"}</SelectItem>
                      <SelectItem value="-price">{s.priceHighToLow || "Price: High to Low"}</SelectItem>
                      <SelectItem value="price">{s.priceLowToHigh || "Price: Low to High"}</SelectItem>
                      <SelectItem value="-viewCount">{s.mostViewed || "Most Viewed"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/property')}
                    className="w-full sm:w-auto"
                  >
                    {s.viewAll || "View All"}
                  </Button>
                </div>

                <div className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => router.push('/dashboard/propertyForm')}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    {s.addNew || "Add New"}
                  </Button>
                </div>
              </div>
            </div>

            {loadingProperties ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{s.noPropertiesListedYet || "No properties listed yet"}</h3>
                <p className="text-muted-foreground mb-4">{s.startByAdding || "Start by adding your first property listing"}</p>
                <Button onClick={() => router.push('/dashboard/propertyForm')}>
                  <Plus className="w-4 h-4 mr-2" />
                  {s.addYourFirstProperty || "Add Your First Property"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.slice(0, 4).map((property: Property) => {
                  const propertyId = property._id || property.id || 'unknown';
                  const images = property.images || [];
                  const firstImage = images.length > 0
                    ? (typeof images[0] === 'string' ? images[0] : (images[0] as { url: string })?.url)
                    : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500";

                  const addressParts = [property.address, property.city, property.country].filter(Boolean);
                  const locationStr = addressParts.length > 0 ? addressParts.join(", ") : (_t.roles?.user?.locationNotSpecified || "Location not specified");

                  const beds = property.amenities?.bedrooms ?? property.bedrooms ?? property.beds ?? 0;
                  const baths = property.amenities?.bathrooms ?? property.bathrooms ?? property.baths ?? 0;

                  return (
                    <PropertyCard
                      key={propertyId}
                      id={propertyId}
                      image={firstImage}
                      title={property.title || _t.roles?.user?.untitledProperty || "Untitled Property"}
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

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <BookingSummaryWidget role="host" title={s.recentBookingRequests || "Recent Booking Requests"} limit={4} />
          {/* Add more widgets as needed */}
        </div>
      </div>
    </div>
  );
}
