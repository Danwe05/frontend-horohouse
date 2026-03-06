"use client";

import React from "react";
import { Building2, Plus, KeyRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { BookingSummaryWidget } from "@/components/dashboard/BookingSummaryWidget";

type Property = any;

interface Props {
    properties: Property[];
    loadingProperties: boolean;
    sortBy: string;
    setSortBy: (s: string) => void;
    handlePropertyUpdate: () => void;
    router: any;
}

export default function LandlordRole({ properties, loadingProperties, sortBy, setSortBy, handlePropertyUpdate, router }: Props) {
    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
                    onClick={() => router.push('/dashboard/propertyForm')}
                >
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium">Add Property</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
                    onClick={() => router.push('/dashboard/tenants')}
                >
                    <KeyRound className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium">Manage Tenants</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
                    onClick={() => router.push('/dashboard/inquiries')}
                >
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium">View Inquiries</span>
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Property Portfolio */}
                <div className="lg:col-span-2">
                    <div className="bg-card rounded-lg border shadow-none p-3 lg:p-6">
                        <div className="flex items-center flex-wrap justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold">My Properties</h2>
                                {properties.length > 0 && (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                                        {properties.length} Owned
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
                                            <SelectItem value="recent">Recent Listed</SelectItem>
                                            <SelectItem value="-price">Price: High to Low</SelectItem>
                                            <SelectItem value="price">Price: Low to High</SelectItem>
                                            <SelectItem value="-viewCount">Most Viewed</SelectItem>
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
                                        View All
                                    </Button>
                                </div>

                                <div className="w-full sm:w-auto">
                                    <Button
                                        size="sm"
                                        onClick={() => router.push('/dashboard/propertyForm')}
                                        className="gap-2 w-full sm:w-auto"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New
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
                                <h3 className="text-lg font-semibold mb-2">No properties in your portfolio</h3>
                                <p className="text-muted-foreground mb-4">Start by adding your first rental property</p>
                                <Button onClick={() => router.push('/dashboard/propertyForm')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Property
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
                                    const locationStr = addressParts.length > 0 ? addressParts.join(", ") : "Location not specified";

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
                                            type={property.type || "rent"}
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
                    <BookingSummaryWidget role="host" title="Recent Booking Requests" limit={4} />

                    {/* Add more widgets here if needed */}
                </div>
            </div>
        </div>
    );
}
