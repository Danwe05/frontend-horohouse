"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Share2, Heart, Loader2, Star, ChevronRight,
  Check, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

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
    type?: string;
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
    advanceNoticeDays?: number;
    bookingWindowDays?: number;
    weeklyDiscountPercent?: number;
    monthlyDiscountPercent?: number;
    pricingUnit?: 'nightly' | 'weekly' | 'monthly';
    unavailableDates?: Array<{ from: string; to: string }>;
    rating?: number;
    reviewCount?: number;
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
  <div className="hidden lg:block bg-white rounded-2xl p-6 space-y-6 border border-[#DDDDDD] shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
    <div className="flex items-center justify-between">
      <Skeleton className="h-7 w-36 bg-[#F0F0F0] rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 rounded-full bg-[#F0F0F0]" />
        <Skeleton className="h-9 w-9 rounded-full bg-[#F0F0F0]" />
      </div>
    </div>
    <Skeleton className="h-[120px] w-full rounded-xl bg-[#F0F0F0]" />
    <div className="space-y-3 pt-2">
      <Skeleton className="h-[52px] w-full rounded-xl bg-[#F0F0F0]" />
      <Skeleton className="h-[52px] w-full rounded-xl bg-[#F0F0F0]" />
    </div>
    <div className="pt-4 border-t border-[#EBEBEB] space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-32 bg-[#F0F0F0] rounded" />
          <Skeleton className="h-4 w-20 bg-[#F0F0F0] rounded" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const BookingPanel = ({ property }: BookingPanelProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const { isAuthenticated, user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { formatMoney } = useCurrency();

  // Short-term: fully delegate to BookingForm
  if (property.listingType === "short_term") {
    return (
      <BookingForm
        property={{
          ...property,
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
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", message: "" });

  const saved = isFavorite(property._id);

  // ── Derived ────────────────────────────────────────────────────────────────
  const agent = property.agentId || property.ownerId;
  const agentInitials = agent?.name
    ? agent.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";
  const isAgent = !!property.agentId;

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
    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const response = await apiClient.searchProperties({
          [isAgent ? "agentId" : "ownerId"]: agent._id,
          limit: 5,
        });
        if (!cancelled) {
          const other = response.properties?.filter((p: any) => p._id !== property._id) ?? [];
          setAgentListings(other.slice(0, 5));
        }
      } catch { /* silently ignore */ } finally {
        if (!cancelled) setLoadingListings(false);
      }
    };
    fetchListings();
    return () => { cancelled = true; };
  }, [agent?._id, property._id, isAgent]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error(pd?.loginRequired || "Login required", {
        description: pd?.pleaseLoginToSave || "Please log in to save properties.",
      });
      return;
    }
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (saved) {
        await apiClient.removeFromFavorites(property._id);
        removeFavorite(property._id);
        toast.success("Removed from saved");
      } else {
        await apiClient.addToFavorites(property._id);
        addFavorite(property._id);
        toast.success("Saved");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isAuthenticated, isTogglingFavorite, saved, property._id, addFavorite, removeFavorite, pd]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: pd?.checkOutThisProperty || "Check out this property",
          text: `${property.listingType} — ${formatMoney(costs.monthlyRent)}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch { /* user cancelled */ }
  }, [property.listingType, costs.monthlyRent, pd, formatMoney]);

  const handleOpenInquiry = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Login required", { description: "Please log in to send a message." });
      return;
    }
    if (user) {
      setInquiryForm(prev => ({
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
    if (!isAuthenticated) { toast.error("Login required"); return; }
    setInquiryLoading(true);
    try {
      await apiClient.sendInquiry({ propertyId: property._id, ...inquiryForm });
      toast.success("Message sent!", {
        description: "The host will get back to you soon.",
      });
      setInquiryForm({ name: "", email: "", phone: "", message: "" });
      setIsInquiryOpen(false);
    } catch (err: any) {
      toast.error("Failed to send message", {
        description: err.response?.data?.message ?? "Please try again later.",
      });
    } finally {
      setInquiryLoading(false);
    }
  };

  const inputCls = "w-full border border-[#DDDDDD] bg-white text-[#222222] rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent transition-all placeholder:text-[#B0B0B0]";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5">

        {/* ── Desktop Booking Card ── */}
        <div className="hidden lg:block bg-white rounded-2xl p-6 border border-[#DDDDDD] shadow-[0_6px_20px_rgba(0,0,0,0.12)]">

          {/* Price + actions */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-[22px] font-semibold text-[#222222] tracking-tight">
                  {formatMoney(costs.monthlyRent)}
                </span>
                {property.listingType === "rent" && (
                  <span className="text-[#717171] text-[15px]">/month</span>
                )}
              </div>
              {property.rating && (
                <div className="flex items-center gap-1 mt-1 text-[13px] text-[#222222]">
                  <Star className="w-3 h-3 fill-[#222222]" />
                  <span className="font-semibold">{property.rating.toFixed(2)}</span>
                  {property.reviewCount && (
                    <span className="text-[#717171]">
                      &nbsp;·&nbsp;
                      <span className="underline underline-offset-2 cursor-pointer">
                        {property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      className="p-2.5 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
                    >
                      <Share2 className="h-[18px] w-[18px] stroke-[1.5]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-xl text-[13px]">Share</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      className="p-2.5 rounded-full hover:bg-[#F7F7F7] transition-colors disabled:opacity-50 text-[#222222]"
                    >
                      {isTogglingFavorite
                        ? <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        : <Heart className={cn("h-[18px] w-[18px] stroke-[1.5]", saved && "fill-[#FF385C] text-[#FF385C] stroke-[#FF385C]")} />
                      }
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-xl text-[13px]">
                    {saved ? "Remove from saved" : "Save"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Move-in date (rent) */}
          {property.listingType === "rent" && (
            <div className="border border-[#222222] rounded-xl overflow-hidden mb-4">
              <div className="border-b border-[#B0B0B0]">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex flex-col px-4 py-3 text-left hover:bg-[#F7F7F7] transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">Move-in date</span>
                      <span className={cn("text-[14px] font-medium", moveInDate ? "text-[#222222]" : "text-[#717171]")}>
                        {moveInDate ? format(moveInDate, "MM/dd/yyyy") : "Add date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-2xl border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.15)]"
                    align="start"
                    sideOffset={6}
                  >
                    <Calendar
                      mode="single"
                      selected={moveInDate}
                      onSelect={setMoveInDate}
                      disabled={(date) => date < new Date()}
                      className="p-4"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222]">Availability</span>
                <span className={cn(
                  "text-[13px] font-medium flex items-center gap-1",
                  property.availability === "available" ? "text-[#008A05]" : "text-[#717171]"
                )}>
                  {property.availability === "available" && <Check className="w-3.5 h-3.5" />}
                  {property.availability === "available" ? "Immediate" : property.availability}
                </span>
              </div>
            </div>
          )}

          {/* Sale status (buy) */}
          {property.listingType === "buy" && (
            <div className="border border-[#222222] rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222]">Status</span>
              <span className={cn(
                "text-[13px] font-medium flex items-center gap-1.5",
                property.availability === "available" ? "text-[#008A05]" : "text-[#717171]"
              )}>
                {property.availability === "available" && <Check className="w-3.5 h-3.5" />}
                {property.availability === "available" ? "Available" : property.availability}
              </span>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-3 mb-4">
            <button className="w-full h-[52px] rounded-xl font-semibold text-[16px] text-white bg-blue-600 hover:opacity-90 transition-opacity shadow-sm">
              {property.listingType === "rent"
                ? (pd?.applyNow || "Apply now")
                : (pd?.makeOffer || "Make offer")}
            </button>
            <button
              className="w-full h-[52px] rounded-xl font-semibold text-[16px] text-[#222222] bg-white border border-[#222222] hover:bg-[#F7F7F7] transition-colors"
              onClick={() => setIsScheduleOpen(true)}
            >
              {pd?.scheduleTour || "Schedule a tour"}
            </button>
          </div>

          <p className="text-center text-[13px] text-[#717171] mb-5">You won't be charged yet</p>

          {/* Cost breakdown */}
          <div className="border-t border-[#EBEBEB] pt-5 space-y-3.5 text-[15px] text-[#222222]">
            <div className="flex justify-between">
              <span className="underline underline-offset-2 cursor-pointer">
                {property.listingType === "rent" ? "Monthly rent" : "Listed price"}
              </span>
              <span>{formatMoney(costs.monthlyRent)}</span>
            </div>

            {property.listingType === "rent" && (
              <>
                <div className="flex justify-between">
                  <span className="underline underline-offset-2 cursor-pointer">Security deposit</span>
                  <span>{formatMoney(costs.securityDeposit)}</span>
                </div>
                {costs.maintenanceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="underline underline-offset-2 cursor-pointer">Maintenance fee</span>
                    <span>{formatMoney(costs.maintenanceFee)}/mo</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="underline underline-offset-2 cursor-pointer">Application fee</span>
                  <span>{formatMoney(costs.applicationFee)}</span>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-[#EBEBEB] flex justify-between font-semibold text-[16px]">
              <span>
                {property.listingType === "rent" ? "Total due at move-in" : "Total"}
              </span>
              <span>
                {formatMoney(
                  property.listingType === "rent" ? costs.totalMoveInCost : costs.monthlyRent
                )}
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-5 pt-5 border-t border-[#EBEBEB] grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-[13px] text-[#717171]">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#717171]">
              <Zap className="w-4 h-4 shrink-0" />
              <span>Fast response</span>
            </div>
          </div>
        </div>

        {/* ── Agent Card ── */}
        {agent && (
          <div className="hidden lg:block bg-white rounded-2xl p-6 border border-[#DDDDDD] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-14 w-14 shrink-0">
                {agent.profilePicture && (
                  <AvatarImage src={agent.profilePicture} alt={agent.name} />
                )}
                <AvatarFallback className="bg-[#222222] text-white text-[16px] font-semibold">
                  {agentInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[16px] font-semibold text-[#222222] truncate">{agent.name}</p>
                <p className="text-[14px] text-[#717171] mt-0.5">
                  {isAgent ? "Property Agent" : "Property Owner"}
                </p>
                {(agent as any).rating && (
                  <div className="flex items-center gap-1 mt-1 text-[13px] text-[#222222]">
                    <Star className="w-3 h-3 fill-[#222222]" />
                    <span className="font-semibold">{(agent as any).rating.toFixed(1)}</span>
                    {(agent as any).totalReviews && (
                      <span className="text-[#717171]">· {(agent as any).totalReviews} reviews</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2.5">
                <button
                  onClick={handleOpenInquiry}
                  className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-[#222222] border border-[#222222] hover:bg-[#F7F7F7] transition-colors"
                >
                  {pd?.sendMessage || "Send message"}
                </button>
                {agent.phoneNumber && (
                  <a
                    href={`tel:${agent.phoneNumber}`}
                    className="flex items-center justify-center gap-2 w-full h-[48px] rounded-xl font-semibold text-[15px] text-[#222222] border border-[#DDDDDD] hover:bg-[#F7F7F7] transition-colors"
                  >
                    {agent.phoneNumber}
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-white bg-[#222222] hover:bg-[#111111] transition-colors"
              >
                Log in to contact
              </button>
            )}

            {/* Agent's other listings */}
            {isAuthenticated && agentListings.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#EBEBEB] space-y-4">
                <h4 className="text-[15px] font-semibold text-[#222222]">
                  More from {agent.name.split(" ")[0]}
                </h4>

                <div className="space-y-3">
                  {loadingListings
                    ? [...Array(2)].map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-16 h-16 rounded-xl bg-[#F0F0F0] shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <Skeleton className="h-4 w-3/4 bg-[#F0F0F0] rounded" />
                          <Skeleton className="h-3 w-1/2 bg-[#F0F0F0] rounded" />
                        </div>
                      </div>
                    ))
                    : agentListings.slice(0, 2).map((listing) => (
                      <a
                        key={listing._id}
                        href={`/properties/${listing._id}`}
                        className="flex gap-3 group"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F7F7F7] shrink-0">
                          {listing.images?.[0]?.url && (
                            <img
                              src={listing.images[0].url}
                              alt={listing.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <p className="text-[14px] font-medium text-[#222222] truncate group-hover:underline underline-offset-2">
                            {listing.title}
                          </p>
                          <p className="text-[13px] text-[#717171] mt-0.5">
                            {formatMoney(listing.price)}
                            {listing.listingType === "rent" ? "/mo" : ""}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#B0B0B0] self-center shrink-0" />
                      </a>
                    ))
                  }
                </div>

                {agentListings.length > 2 && (
                  <a
                    href={`/properties?${isAgent ? "agent" : "owner"}=${agent._id}`}
                    className="flex items-center gap-1 text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:text-black"
                  >
                    Show all listings
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] px-5 py-3.5 z-50 shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-semibold text-[#222222]">
                {formatMoney(costs.monthlyRent)}
              </span>
              {property.listingType === "rent" && (
                <span className="text-[14px] text-[#717171]">/mo</span>
              )}
            </div>
            {moveInDate && (
              <p className="text-[13px] text-[#717171] mt-0.5 underline underline-offset-2">
                {format(moveInDate, "MMM d")} move-in
              </p>
            )}
          </div>
          <button
            className="h-[48px] px-7 rounded-xl bg-blue-600 text-white font-semibold text-[15px] shadow-sm hover:opacity-90 transition-opacity"
            onClick={() => setIsScheduleOpen(true)}
          >
            {property.listingType === "rent" ? "Apply" : "Inquire"}
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <ScheduleTourModal
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        propertyId={property._id}
        agentId={agent?._id}
        onScheduled={() => {}}
      />

      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 rounded-2xl border-[#DDDDDD] overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <DialogHeader className="text-left space-y-1.5 mb-7">
              <DialogTitle className="text-[20px] font-semibold text-[#222222]">
                {pd?.sendInquiry || "Contact host"}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#717171] leading-relaxed">
                {pd?.getInTouch?.replace("{role}", isAgent ? "agent" : "owner")
                  || "Send a message — hosts typically respond within an hour."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label htmlFor="inquiry-name" className="text-[13px] font-semibold text-[#222222] block mb-1.5">Name</Label>
                  <input
                    id="inquiry-name"
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    placeholder="Your name"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="inquiry-phone" className="text-[13px] font-semibold text-[#222222] block mb-1.5">Phone</Label>
                  <input
                    id="inquiry-phone"
                    type="tel"
                    value={inquiryForm.phone}
                    onChange={e => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    placeholder="+237..."
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inquiry-email" className="text-[13px] font-semibold text-[#222222] block mb-1.5">Email</Label>
                <input
                  id="inquiry-email"
                  type="email"
                  value={inquiryForm.email}
                  onChange={e => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                  placeholder="name@email.com"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <Label htmlFor="inquiry-message" className="text-[13px] font-semibold text-[#222222] block mb-1.5">Message</Label>
                <Textarea
                  id="inquiry-message"
                  rows={4}
                  value={inquiryForm.message}
                  onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  placeholder="I'm interested in this property..."
                  required
                  className="resize-none text-[15px] px-4 py-3.5 border border-[#DDDDDD] rounded-xl focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent placeholder:text-[#B0B0B0]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(false)}
                  disabled={inquiryLoading}
                  className="flex-1 h-[48px] rounded-xl font-semibold text-[15px] text-[#222222] border border-[#222222] hover:bg-[#F7F7F7] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inquiryLoading}
                  className="flex-1 h-[48px] rounded-xl font-semibold text-[15px] text-white bg-blue-600 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inquiryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {inquiryLoading ? "Sending..." : "Send message"}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingPanel;