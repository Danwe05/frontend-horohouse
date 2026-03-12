"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon, Share2, Heart, Phone, Mail,
  MessageCircle, Loader2, Home, MapPin, Star, ChevronRight,
  Check, Clock, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import ScheduleTourModal from "@/components/property/details/ScheduleTourModal";
import BookingForm from "@/components/dashboard/BookingForm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentListing {
  _id: string;
  title: string;
  price: number;
  city: string;
  address: string;
  listingType: string;
  images: Array<{ url: string }>;
}

interface BookingPanelProps {
  property: {
    _id: string;
    price: number;
    type?: string;           // hotel, hostel, motel, etc.
    listingType: string;
    availability: string;
    depositAmount?: number;
    maintenanceFee?: number;
    contactPhone?: string;
    contactEmail?: string;
    shortTermAmenities?: any;
    currency?: string;
    minNights?: number;
    maxNights?: number;
    cleaningFee?: number;
    serviceFee?: number;
    isInstantBookable?: boolean;
    cancellationPolicy?: string;
    // STR booking rules
    advanceNoticeDays?: number;
    bookingWindowDays?: number;
    weeklyDiscountPercent?: number;
    monthlyDiscountPercent?: number;
    unavailableDates?: Array<{ from: string; to: string }>;
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const BookingPanelSkeleton = () => (
  <div className="hidden lg:block bg-white rounded-3xl shadow-sm p-8 space-y-6 border border-slate-100 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
    <Skeleton className="h-12 w-full rounded-xl" />
    <div className="space-y-3 p-5 bg-slate-50 rounded-2xl">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
    <div className="space-y-3">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const BookingPanel = ({ property }: BookingPanelProps) => {
  const { isAuthenticated, user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  // Short-term: delegate to dedicated booking form — pass the full property object
  if (property.listingType === "short_term") {
    return (
      <BookingForm
        property={{
          ...property,
          // BookingForm needs propertyType to detect hotel/hostel multi-room
          propertyType: property.type,
        } as any}
      />
    );
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(new Date());
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [agentListings, setAgentListings] = useState<AgentListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: "", email: "", phone: "", message: "",
  });

  const saved = isFavorite(property._id);

  // ── Derived ────────────────────────────────────────────────────────────────
  const agent = property.agentId || property.ownerId;
  const agentInitials = agent?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "A";

  const costs = useMemo(() => ({
    monthlyRent: property.price,
    securityDeposit: property.depositAmount ?? property.price,
    applicationFee: 50,
    maintenanceFee: property.maintenanceFee ?? 0,
    get totalMoveInCost() {
      return this.monthlyRent + this.securityDeposit + this.applicationFee;
    },
  }), [property.price, property.depositAmount, property.maintenanceFee]);

  // ── Fetch agent's other listings ───────────────────────────────────────────
  useEffect(() => {
    if (!agent?._id) return;
    let cancelled = false;

    const fetch = async () => {
      setLoadingListings(true);
      try {
        const response = await apiClient.searchProperties({
          [property.agentId ? "agentId" : "ownerId"]: agent._id,
          limit: 5,
        });
        if (!cancelled) {
          const other = response.properties?.filter((p: any) => p._id !== property._id) ?? [];
          setAgentListings(other.slice(0, 5));
        }
      } catch {
        // non-critical — silently ignore
      } finally {
        if (!cancelled) setLoadingListings(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [agent?._id, property._id, property.agentId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Login required", { description: "Please login to save properties." });
      return;
    }
    if (isTogglingFavorite) return;

    const prev = saved;
    setIsTogglingFavorite(true);
    try {
      if (prev) {
        await apiClient.removeFromFavorites(property._id);
        removeFavorite(property._id);
        toast.success("Removed from favorites");
      } else {
        await apiClient.addToFavorites(property._id);
        addFavorite(property._id);
        toast.success("Added to favorites");
      }
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isAuthenticated, isTogglingFavorite, saved, property._id, addFavorite, removeFavorite]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this property",
          text: `${property.listingType} — ${costs.monthlyRent.toLocaleString()} XAF`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch { /* user cancelled */ }
  }, [property.listingType, costs.monthlyRent]);

  const handleOpenInquiry = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Login required", { description: "Please login to send an inquiry." });
      return;
    }
    if (user) {
      setInquiryForm((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
        phone: user.phoneNumber ?? prev.phone,
      }));
    }
    setIsInquiryOpen(true);
  }, [isAuthenticated, user]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Login required");
      return;
    }
    setInquiryLoading(true);
    try {
      await apiClient.sendInquiry({ propertyId: property._id, ...inquiryForm });
      toast.success("Inquiry sent!", {
        description: "The agent will contact you soon.",
      });
      setInquiryForm({ name: "", email: "", phone: "", message: "" });
      setIsInquiryOpen(false);
    } catch (err: any) {
      toast.error("Failed to send inquiry", {
        description: err.response?.data?.message ?? "Please try again later.",
      });
    } finally {
      setInquiryLoading(false);
    }
  };

  // ── Action button shared style ─────────────────────────────────────────────
  const ActionButton = ({
    onClick,
    disabled,
    "aria-label": ariaLabel,
    "aria-pressed": ariaPressed,
    children,
    className,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { "aria-pressed"?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={cn(
        "transition-all duration-200 inline-flex items-center justify-center rounded-lg border border-slate-200 w-10 h-10 hover:bg-slate-50 disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* ── Desktop Booking Card ── */}
        <div className="hidden lg:block bg-white rounded-3xl shadow-sm p-8 space-y-8 border border-slate-100">
          {/* Price header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {costs.monthlyRent.toLocaleString()} XAF
              </span>
              {property.listingType === "rent" && (
                <span className="text-slate-500 font-medium ml-1">/ mo</span>
              )}
            </div>

            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionButton
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      aria-label={saved ? "Remove from favorites" : "Add to favorites"}
                      aria-pressed={saved}
                      className={saved ? "border-destructive/20 text-destructive" : ""}
                    >
                      {isTogglingFavorite
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Heart className={cn("h-4 w-4", saved && "fill-current text-destructive")} />
                      }
                    </ActionButton>
                  </TooltipTrigger>
                  <TooltipContent>{saved ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionButton onClick={handleShare} aria-label="Share this property">
                      <Share2 className="h-4 w-4" />
                    </ActionButton>
                  </TooltipTrigger>
                  <TooltipContent>Share this property</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Move-in date (rent only) */}
          {property.listingType === "rent" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Desired Move-in Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal hover:border-primary transition-all",
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
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2 mt-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  property.availability === "available" ? "bg-green-500" : "bg-amber-500"
                )} />
                <p className="text-xs text-muted-foreground">
                  {property.availability === "available"
                    ? "Available immediately"
                    : `Available: ${property.availability}`}
                </p>
              </div>
            </div>
          )}

          {/* Lease / property details */}
          <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              {property.listingType === "rent" ? "Lease Details" : "Property Details"}
            </h3>
            <div className="space-y-2.5 text-sm font-medium">
              {property.listingType === "rent" && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Lease term</span>
                  <Badge variant="outline" className="font-bold border-slate-200">12 months</Badge>
                </div>
              )}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Available</span>
                <Badge
                  className={cn(
                    "capitalize font-bold border-none",
                    property.availability === "available"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  )}
                >
                  {property.availability}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Type</span>
                <Badge variant="outline" className="capitalize font-bold border-slate-200">
                  For {property.listingType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Cost Breakdown
            </h3>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">
                  {property.listingType === "rent" ? "Monthly rent" : "Price"}
                </span>
                <span className="text-slate-900">{costs.monthlyRent.toLocaleString()} XAF</span>
              </div>
              {property.listingType === "rent" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Security deposit</span>
                    <span className="text-slate-900">{costs.securityDeposit.toLocaleString()} XAF</span>
                  </div>
                  {costs.maintenanceFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Maintenance fee</span>
                      <span className="text-slate-900">{costs.maintenanceFee.toLocaleString()} XAF/mo</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Application fee</span>
                    <span className="text-slate-900">{costs.applicationFee.toLocaleString()} XAF</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Total */}
          <div className="space-y-4">
            {property.listingType === "rent" ? (
              <>
                <div className="flex items-end justify-between">
                  <span className="font-bold text-slate-900">Due at move-in</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {costs.totalMoveInCost.toLocaleString()} XAF
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.round((costs.totalMoveInCost / (costs.totalMoveInCost * 1.5)) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"
                >
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(costs.totalMoveInCost / (costs.totalMoveInCost * 1.5)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Total move-in cost</span>
                  <span>Includes rent, deposit & fees</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Total Price</span>
                <span className="text-2xl font-black text-slate-900">
                  {costs.monthlyRent.toLocaleString()} XAF
                </span>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
              size="lg"
            >
              {property.listingType === "rent" ? "Apply Now" : "Make an Offer"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 text-base font-bold rounded-xl border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              size="lg"
              onClick={() => setIsScheduleOpen(true)}
            >
              Schedule Tour
            </Button>
          </div>

          <p className="text-xs text-center font-medium text-slate-500">
            {property.listingType === "rent"
              ? "Subject to application approval • 24h response time"
              : "Contact us for more information • Flexible viewing times"}
          </p>
        </div>

        {/* ── Agent Card ── */}
        {agent && (
          <div className="bg-slate-50 rounded-3xl p-6 lg:p-8 space-y-6 border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 tracking-tight">Listed by</h3>
              {agent.rating && isAuthenticated && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{agent.rating}</span>
                  <span className="text-slate-400">({agent.totalReviews ?? 0})</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shadow-sm border-2 border-white">
                {agent.profilePicture && (
                  <AvatarImage src={agent.profilePicture} alt={agent.name} />
                )}
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                  {agentInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 mt-1">
                <p className="font-bold text-slate-900 text-lg leading-none mb-1.5">
                  {agent.name}
                </p>
                <p className="text-sm font-medium text-slate-500 capitalize">
                  {property.agentId ? "Property Agent" : "Property Owner"}
                </p>
                {isAuthenticated && agent.phoneNumber && (
                  <p className="text-sm font-bold text-slate-700 mt-2 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-blue-500" />
                    {agent.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            {isAuthenticated ? (
              <>
                <TooltipProvider>
                  <div className="flex gap-2">
                    {agent.phoneNumber && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="flex-1" asChild>
                            <a href={`tel:${agent.phoneNumber}`} aria-label={`Call ${agent.name}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Call {agent.name}</TooltipContent>
                      </Tooltip>
                    )}
                    {agent.email && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="flex-1" asChild>
                            <a href={`mailto:${agent.email}`} aria-label={`Email ${agent.name}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Email {agent.name}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>

                <Button
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  onClick={handleOpenInquiry}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </>
            ) : (
              <Button
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                asChild
              >
                <a href="/auth/login">
                  <Lock className="h-4 w-4 mr-2" />
                  Login to See Contact
                </a>
              </Button>
            )}

            {/* Agent's other listings */}
            {isAuthenticated && agentListings.length > 0 && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">
                    Other listings by {agent.name.split(" ")[0]}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {agentListings.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {loadingListings
                    ? [...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3 p-2">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                    ))
                    : agentListings.map((listing) => (
                      <a
                        key={listing._id}
                        href={`/properties/${listing._id}`}
                        className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all group border border-transparent hover:border-border/50"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary relative">
                          {listing.images?.[0]?.url ? (
                            <img
                              src={listing.images[0].url}
                              alt={listing.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Home className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {listing.listingType === "rent" ? "Rent" : "Sale"}
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
                            {listing.listingType === "rent" && (
                              <span className="text-xs text-muted-foreground">/month</span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </a>
                    ))
                  }
                </div>

                {agentListings.length >= 5 && (
                  <Button variant="outline" className="w-full" size="sm" asChild>
                    <a
                      href={`/properties?${property.agentId ? "agent" : "owner"}=${agent._id}`}
                      className="flex items-center justify-center"
                    >
                      View all listings
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border/50 p-4 shadow-2xl z-50 backdrop-blur-sm">
        <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">
                {costs.monthlyRent.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">XAF</span>
            </div>
            {property.listingType === "rent" && (
              <span className="text-xs text-muted-foreground">/month</span>
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
                    aria-label={saved ? "Remove from favorites" : "Add to favorites"}
                    aria-pressed={saved}
                    className={cn(
                      "h-12 w-12 transition-all",
                      saved ? "text-destructive border-destructive/20" : ""
                    )}
                  >
                    {isTogglingFavorite
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <Heart className={cn("h-5 w-5", saved && "fill-current")} />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {saved ? "Remove from favorites" : "Add to favorites"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {agent?.phoneNumber && isAuthenticated ? (
              <Button
                className="flex-1 h-12 bg-blue-600 text-white w-[120px]"
                asChild
              >
                <a href={`tel:${agent.phoneNumber}`} aria-label={`Call ${agent.name}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            ) : (
              <Button className="h-12 px-6 bg-gradient-to-r from-primary to-primary/90" asChild>
                <a href="/auth/login">
                  <Lock className="h-5 w-5 mr-2" />
                  Login
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ScheduleTourModal
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        propertyId={property._id}
        agentId={agent?._id}
        onScheduled={() => { }}
      />

      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Send Inquiry
            </DialogTitle>
            <DialogDescription>
              Get in touch with the {property.agentId ? "agent" : "owner"} about this property.
              They typically respond within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inquiry-name">Name *</Label>
                <Input
                  id="inquiry-name"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiry-phone">Phone *</Label>
                <Input
                  id="inquiry-phone"
                  type="tel"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  placeholder="Your phone number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-email">Email *</Label>
              <Input
                id="inquiry-email"
                type="email"
                value={inquiryForm.email}
                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Message *</Label>
              <Textarea
                id="inquiry-message"
                rows={5}
                value={inquiryForm.message}
                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                placeholder="I'm interested in this property. Please contact me with more information..."
                required
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInquiryOpen(false)}
                className="flex-1"
                disabled={inquiryLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary to-primary/90"
                disabled={inquiryLoading}
              >
                {inquiryLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><MessageCircle className="h-4 w-4 mr-2" />Send Inquiry</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingPanel;