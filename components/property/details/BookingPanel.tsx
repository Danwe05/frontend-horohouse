"use client"

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Share2, Heart, Phone, Mail, User, MessageCircle, Loader2, Home, MapPin, Star, ChevronRight, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface BookingPanelProps {
  property: {
    _id: string;
    price: number;
    listingType: string;
    availability: string;
    depositAmount?: number;
    maintenanceFee?: number;
    contactPhone?: string;
    contactEmail?: string;
    agentId?: {
      _id: string;
      name: string;
      email?: string;
      phoneNumber?: string;
      profilePicture?: string;
      role: string;
      rating?: number;
      totalReviews?: number;
    };
    ownerId?: {
      rating: any;
      totalReviews: number;
      _id: string;
      name: string;
      email?: string;
      phoneNumber?: string;
      profilePicture?: string;
    };
  };
}

interface AgentListing {
  _id: string;
  title: string;
  price: number;
  city: string;
  address: string;
  listingType: string;
  images: Array<{ url: string }>;
}

const BookingPanel = ({ property }: BookingPanelProps) => {
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(new Date());
  const [saved, setSaved] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [agentListings, setAgentListings] = useState<AgentListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Initialize `saved` from server-side favorites
  useEffect(() => {
    let mounted = true;
    const initSaved = async () => {
      if (!isAuthenticated) return;

      try {
        const globalAny: any = globalThis as any;
        if (globalAny.__hh_favorites_cache instanceof Set) {
          if (mounted) setSaved(globalAny.__hh_favorites_cache.has(property._id));
          return;
        }

        const res = await apiClient.getFavorites();
        const arr = Array.isArray(res) ? res : res?.favorites ?? res?.data?.favorites ?? [];
        const ids = new Set<string>();
        for (const item of arr || []) {
          if (!item) continue;
          const id = item.propertyId ?? item.property?._id ?? item._id ?? item.id ?? item;
          if (id) ids.add(typeof id === 'string' ? id : String(id));
        }
        globalAny.__hh_favorites_cache = ids;
        if (mounted) setSaved(ids.has(property._id));
      } catch (err) {
        console.error('BookingPanel: failed to load favorites', err);
      }
    };

    initSaved();
    return () => { mounted = false; };
  }, [isAuthenticated, property._id]);

  const monthlyRent = property.price;
  const securityDeposit = property.depositAmount || property.price;
  const applicationFee = 50;
  const maintenanceFee = property.maintenanceFee || 0;

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Login required", {
        description: "Please login to save properties to your favorites.",
      });
      return;
    }

    if (isTogglingFavorite) return;

    const previousState = saved;
    setSaved(!saved);

    try {
      setIsTogglingFavorite(true);
      if (previousState) {
        await apiClient.removeFromFavorites(property._id);
        toast.success("Removed from favorites");
        const globalAny: any = globalThis as any;
        if (globalAny.__hh_favorites_cache instanceof Set) {
          globalAny.__hh_favorites_cache.delete(property._id);
        }
      } else {
        await apiClient.addToFavorites(property._id);
        toast.success("Added to favorites");
        const globalAny: any = globalThis as any;
        if (globalAny.__hh_favorites_cache instanceof Set) {
          globalAny.__hh_favorites_cache.add(property._id);
        } else {
          globalAny.__hh_favorites_cache = new Set([property._id]);
        }
      }
    } catch (error: any) {
      setSaved(previousState);
      toast.error("Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this property",
          text: `Amazing property for ${property.listingType} - ${monthlyRent.toLocaleString()} XAF`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
      setIsShareOpen(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Login required", {
        description: "Please login to send an inquiry.",
      });
      return;
    }

    setInquiryLoading(true);

    const inquiryData = {
      propertyId: property._id,
      ...inquiryForm,
    };
    
    console.log('=== SENDING INQUIRY ===');
    console.log('Inquiry data:', inquiryData);

    try {
      const response = await apiClient.sendInquiry(inquiryData);
      console.log('Inquiry response:', response);
      toast.success("Inquiry sent successfully!", {
        description: "The property agent will contact you soon.",
      });
      setInquiryForm({ name: "", email: "", phone: "", message: "" });
      setIsInquiryOpen(false);
    } catch (err: any) {
      console.error('Inquiry error:', err);
      toast.error("Failed to send inquiry", {
        description: err.response?.data?.message || "Please try again later.",
      });
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleOpenInquiry = () => {
    if (!isAuthenticated) {
      toast.error("Login required", {
        description: "Please login to send an inquiry.",
      });
      return;
    }
    
    if (user) {
      setInquiryForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phoneNumber || prev.phone,
      }));
    }
    
    setIsInquiryOpen(true);
  };

  // Get agent or owner info
  const agent = property.agentId || property.ownerId;
  const agentInitials = agent?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';

  // Fetch agent's listings
  useEffect(() => {
    const fetchAgentListings = async () => {
      if (!agent?._id) return;
      
      try {
        setLoadingListings(true);
        const response = await apiClient.searchProperties({
          [property.agentId ? 'agentId' : 'ownerId']: agent._id,
          limit: 5,
        });
        const otherListings = response.properties?.filter((p: any) => p._id !== property._id) || [];
        setAgentListings(otherListings.slice(0, 5));
      } catch (error) {
        console.error('Error fetching agent listings:', error);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchAgentListings();
  }, [agent?._id, property._id, property.agentId]);

  const totalMoveInCost = monthlyRent + securityDeposit + applicationFee;

  return (
    <div className="space-y-6">
      {/* Agent Information Card */}
      {agent && isAuthenticated && (
        <div className="bg-card rounded-2xl p-6 space-y-4 border border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Listed by</h3>
            {agent.rating && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{agent.rating}</span>
                <span>({agent.totalReviews || 0})</span>
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10">
              {agent.profilePicture && <AvatarImage src={agent.profilePicture} alt={agent.name} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-bold">
                {agentInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-lg">{agent.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {property.agentId ? 'Property Agent' : 'Property Owner'}
              </p>
              {agent.phoneNumber && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {agent.phoneNumber}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {agent.phoneNumber && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={`tel:${agent.phoneNumber}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Call {agent.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {agent.email && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={`mailto:${agent.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email {agent.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
            variant="default" 
            onClick={handleOpenInquiry}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>

          {/* Agent's Other Listings */}
          {agentListings.length > 0 && (
            <div className="pt-4 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Other listings by {agent.name.split(' ')[0]}</h4>
                <Badge variant="secondary" className="text-xs">
                  {agentListings.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {loadingListings ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3 p-2">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  agentListings.map((listing) => (
                    <a
                      key={listing._id}
                      href={`/properties/${listing._id}`}
                      className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 group border border-transparent hover:border-border/50"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary relative">
                        {listing.images?.[0]?.url ? (
                          <img
                            src={listing.images[0].url}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Home className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {listing.listingType === 'rent' ? 'Rent' : 'Sale'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {listing.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{listing.city}</span>
                        </div>
                        <p className="font-semibold text-sm mt-1 text-primary">
                          {listing.price.toLocaleString()} XAF
                          {listing.listingType === 'rent' && <span className="text-xs text-muted-foreground">/month</span>}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </a>
                  ))
                )}
              </div>
              {agentListings.length >= 5 && (
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <a href={`/properties?${property.agentId ? 'agent' : 'owner'}=${agent._id}`} className="flex items-center justify-center">
                    View all listings
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Booking Card */}
      <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-24 space-y-6 border border-border/50">
        {/* Price Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {monthlyRent.toLocaleString()} XAF
            </span>
            {property.listingType === "rent" && (
              <span className="text-muted-foreground">/month</span>
            )}
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                    className={cn(
                      "transition-all duration-200",
                      saved 
                        ? "text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" 
                        : "hover:border-destructive/20 hover:text-destructive"
                    )}
                  >
                    {isTogglingFavorite ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{saved ? "Remove from favorites" : "Add to favorites"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share this property</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Contact Buttons */}
        {(property.contactPhone || property.contactEmail) && (
          <div className="space-y-2">
            {property.contactPhone && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${property.contactPhone}`} className="flex items-center justify-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
              </Button>
            )}
            {property.contactEmail && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`mailto:${property.contactEmail}`} className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Move-in Date - Only for rent */}
        {property.listingType === "rent" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Desired Move-in Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal transition-all duration-200 hover:border-primary",
                    !moveInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {moveInDate ? format(moveInDate, "MMMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={moveInDate}
                  onSelect={setMoveInDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2 mt-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                property.availability === "available" ? "bg-green-500" : "bg-amber-500"
              )} />
              <p className="text-xs text-muted-foreground">
                {property.availability === "available" ? "Available immediately" : `Available: ${property.availability}`}
              </p>
            </div>
          </div>
        )}

        {/* Property Details */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-lg border border-border/50">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            {property.listingType === "rent" ? "Lease Details" : "Property Details"}
          </h3>
          <div className="space-y-2 text-sm">
            {property.listingType === "rent" && (
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Lease term</span>
                <Badge variant="outline" className="font-medium">12 months</Badge>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Available</span>
              <Badge 
                variant={property.availability === "available" ? "default" : "secondary"}
                className="capitalize"
              >
                {property.availability}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" className="capitalize">
                For {property.listingType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Cost Breakdown
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{property.listingType === "rent" ? "Monthly rent" : "Price"}</span>
              <span className="font-medium">{monthlyRent.toLocaleString()} XAF</span>
            </div>
            {property.listingType === "rent" && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Security deposit</span>
                  <span className="font-medium">{securityDeposit.toLocaleString()} XAF</span>
                </div>
                {maintenanceFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Maintenance fee</span>
                    <span className="font-medium">{maintenanceFee.toLocaleString()} XAF/month</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Application fee</span>
                  <span className="font-medium">{applicationFee} XAF</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          {property.listingType === "rent" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Due at move-in</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {totalMoveInCost.toLocaleString()} XAF
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(totalMoveInCost / (totalMoveInCost * 1.5)) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total move-in cost</span>
                <span>Includes rent, deposit, and fees</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Price</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {monthlyRent.toLocaleString()} XAF
              </span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <Button 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200 shadow-lg hover:shadow-xl"
            size="lg"
          >
            {property.listingType === "rent" ? "Apply Now" : "Make an Offer"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-semibold border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200"
            size="lg"
          >
            Schedule Tour
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border/50">
          {property.listingType === "rent" 
            ? "Subject to application approval • 24h response time" 
            : "Contact us for more information • Flexible viewing times"
          }
        </p>
      </div>

      {/* Inquiry Modal */}
      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Send Inquiry
            </DialogTitle>
            <DialogDescription>
              Get in touch with the {property.agentId ? 'agent' : 'owner'} about this property. 
              They typically respond within 24 hours.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  placeholder="Your phone number"
                  required
                  className="transition-colors duration-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={inquiryForm.email}
                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                placeholder="your.email@example.com"
                required
                className="transition-colors duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                rows={5}
                value={inquiryForm.message}
                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                placeholder="I'm interested in this property. Please contact me with more information..."
                required
                className="transition-colors duration-200 resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInquiryOpen(false)}
                className="flex-1 transition-all duration-200"
                disabled={inquiryLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200" 
                disabled={inquiryLoading}
              >
                {inquiryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPanel;