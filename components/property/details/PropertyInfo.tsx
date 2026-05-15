"use client"

import { useMemo, useState, useCallback } from "react";
import {
  Wifi, BedDouble, Bath, Utensils, Maximize2, MapPin, Eye, Home,
  Car, Snowflake, Dumbbell, Waves, Shield, Coffee, TreePine,
  MessageCircle, Mail, Phone, AlertCircle, ShieldCheck, Star,
  Award, Clock, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyInfoProps {
  property: {
    agentId: any;
    ownerId: any;
    _id: any;
    title: string;
    address: string;
    city: string;
    neighborhood?: string;
    country?: string;
    type: string;
    listingType: string;
    description: string;
    amenities: {
      bedrooms?: number;
      bathrooms?: number;
      hasInternet?: boolean;
      furnished?: boolean;
      parking?: boolean;
      airConditioning?: boolean;
      gym?: boolean;
      pool?: boolean;
      security?: boolean;
      balcony?: boolean;
      garden?: boolean;
    };
    shortTermAmenities?: {
      maxGuests?: number;
      checkInTime?: string;
      checkOutTime?: string;
      hasWifi?: boolean;
      hasBreakfast?: boolean;
      hasTv?: boolean;
      hasKitchen?: boolean;
      hasWasher?: boolean;
      hasHeating?: boolean;
      petsAllowed?: boolean;
      smokingAllowed?: boolean;
      partiesAllowed?: boolean;
      wheelchairAccessible?: boolean;
      airportTransfer?: boolean;
      conciergeService?: boolean;
      dailyHousekeeping?: boolean;
    };
    cancellationPolicy?: string;
    minNights?: number;
    maxNights?: number;
    area?: number;
    viewsCount: number;
    createdAt: string;
    keywords: string[];
    virtualTourUrl?: string;
    videoUrl?: string;
    priceHistory?: Array<{ date: string; price: number; event?: string }>;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContactInfo(property: PropertyInfoProps["property"], pd: any = null) {
  if (property.agentId && typeof property.agentId === "object") {
    const a = property.agentId as any;
    if (a._id || a.id) {
      return {
        _id: a._id ?? a.id,
        name: a.name ?? (pd?.propertyAgent || "Property Agent"),
        email: a.email,
        phoneNumber: a.phoneNumber,
        profilePicture: a.profilePicture,
        createdAt: a.createdAt,
        rating: a.rating,
        totalReviews: a.totalReviews,
        role: "agent" as const,
      };
    }
  }
  if (property.ownerId && typeof property.ownerId === "object") {
    const o = property.ownerId as any;
    if (o._id || o.id) {
      return {
        _id: o._id ?? o.id,
        name: o.name ?? (pd?.propertyOwner || "Property Owner"),
        email: o.email,
        phoneNumber: o.phoneNumber,
        profilePicture: o.profilePicture,
        createdAt: o.createdAt,
        rating: o.rating,
        totalReviews: o.totalReviews,
        role: "owner" as const,
      };
    }
  }
  return null;
}

const MESSAGE_TEMPLATES = (title: string, pd: any) => [
  { label: pd?.askAvailability || "Ask availability", text: pd?.askAvailabilityText?.replace("{title}", title) || `Hi! I'm interested in ${title}. Is it still available?` },
  { label: pd?.scheduleViewing || "Schedule viewing", text: pd?.scheduleViewingText?.replace("{title}", title) || `Hi! I'd like to schedule a viewing for ${title}.` },
  { label: pd?.requestDetails || "Request details", text: pd?.requestDetailsText?.replace("{title}", title) || `Hi! Can you provide more details about ${title}?` },
];

function getYearsHosting(createdAt?: string): string {
  if (!createdAt) return "New host";
  const years = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365));
  if (years < 1) return "New host";
  return `${years} year${years !== 1 ? "s" : ""} hosting`;
}

// ─── Show All Amenities Modal ─────────────────────────────────────────────────

interface AmenityItem { icon: any; label: string; }
interface AmenityGroup { title: string; items: AmenityItem[]; }

const ShowAllAmenitiesModal = ({
  open,
  onClose,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  groups: AmenityGroup[];
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[600px] p-0 rounded-2xl border-[#DDDDDD] overflow-hidden max-h-[90vh]">
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#EBEBEB]">
        <h2 className="text-[18px] font-semibold text-[#222222]">What this place offers</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors"
        >
          <X className="w-4 h-4 stroke-[2.5] text-[#222222]" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[70vh] px-8 py-6 space-y-8">
        {groups.map((group, i) => (
          <div key={i} className="space-y-5">
            <h3 className="text-[16px] font-semibold text-[#222222]">{group.title}</h3>
            <div className="space-y-4">
              {group.items.map((item, j) => (
                <div key={j} className="flex items-center gap-4 py-1 border-b border-[#F7F7F7]">
                  <item.icon className="h-6 w-6 text-[#222222] stroke-[1.5] shrink-0" aria-hidden />
                  <span className="text-[16px] text-[#222222]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

// ─── Component ────────────────────────────────────────────────────────────────

const PropertyInfo = ({ property }: PropertyInfoProps) => {
  const amenities = property.amenities ?? {};
  const stAmenities = property.shortTermAmenities ?? {};

  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const { user, isAuthenticated } = useAuth();
  const { createConversation } = useChatContext();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const contact = useMemo(() => getContactInfo(property, pd), [property, pd]);
  const contactName = contact?.name ?? (pd?.propertyContact || "Property Contact");
  const contactRole = contact?.role === "agent" ? (pd?.propertyAgent || "Property Agent") : (pd?.propertyOwner || "Property Owner");
  const contactInitials = contactName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const yearsHosting = getYearsHosting(contact?.createdAt);

  const daysOnMarket = useMemo(() => {
    const diffMs = Date.now() - new Date(property.createdAt).getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [property.createdAt]);

  // ── Amenity groups ───────────────────────────────────────────────────────
  const amenityGroups: AmenityGroup[] = useMemo(() => [
    {
      title: pd?.essentials || "Essentials",
      items: [
        { icon: BedDouble, label: `${amenities.bedrooms ?? 0} bedrooms` },
        { icon: Bath, label: `${amenities.bathrooms ?? 0} bathrooms` },
        ...(property.area ? [{ icon: Maximize2, label: `${property.area} sqm` }] : []),
        ...(amenities.furnished ? [{ icon: Utensils, label: pd?.furnished || "Furnished" }] : []),
      ].filter(i => i.label),
    },
    ...(property.listingType === "short_term"
      ? [{
        title: pd?.hospitalityRules || "Hospitality & Rules",
        items: [
          ...(stAmenities.maxGuests ? [{ icon: Home, label: `${stAmenities.maxGuests} guests maximum` }] : []),
          { icon: Clock, label: `Check-in: ${stAmenities.checkInTime ?? "14:00"}` },
          { icon: Clock, label: `Checkout: ${stAmenities.checkOutTime ?? "11:00"}` },
          ...(stAmenities.hasBreakfast ? [{ icon: Coffee, label: pd?.breakfastIncluded || "Breakfast included" }] : []),
          ...(stAmenities.hasHeating ? [{ icon: Snowflake, label: pd?.heating || "Heating" }] : []),
          ...(stAmenities.conciergeService ? [{ icon: ShieldCheck, label: pd?.concierge || "Concierge" }] : []),
          ...(stAmenities.airportTransfer ? [{ icon: Car, label: pd?.airportTransfer || "Airport transfer" }] : []),
          ...(stAmenities.petsAllowed ? [{ icon: AlertCircle, label: pd?.petsAllowed || "Pets allowed" }] : []),
        ],
      }]
      : []),
    {
      title: pd?.comfortFacilities || "Comfort & Facilities",
      items: [
        ...(amenities.hasInternet || stAmenities.hasWifi ? [{ icon: Wifi, label: pd?.wifi || "Wifi" }] : []),
        ...(amenities.airConditioning ? [{ icon: Snowflake, label: pd?.airConditioning || "Air conditioning" }] : []),
        ...(amenities.balcony ? [{ icon: Coffee, label: pd?.balcony || "Balcony" }] : []),
        ...(amenities.garden ? [{ icon: TreePine, label: pd?.garden || "Garden" }] : []),
        ...(amenities.parking ? [{ icon: Car, label: pd?.parking || "Parking" }] : []),
        ...(amenities.gym ? [{ icon: Dumbbell, label: pd?.gym || "Gym" }] : []),
        ...(amenities.pool ? [{ icon: Waves, label: pd?.swimmingPool || "Pool" }] : []),
        ...(amenities.security ? [{ icon: Shield, label: pd?.security || "Security" }] : []),
      ],
    },
  ].filter((group) => group.items.length > 0), [amenities, stAmenities, property.area, property.listingType, pd]);

  // Flat list visible in the page (first 10, rest in modal)
  const allAmenityItems = amenityGroups.flatMap(g => g.items);
  const visibleAmenities = allAmenityItems.slice(0, 10);
  const hasMoreAmenities = allAmenityItems.length > 10;

  // Description truncation
  const descMaxLen = 320;
  const isLongDesc = property.description.length > descMaxLen;
  const displayDesc = descExpanded || !isLongDesc
    ? property.description
    : `${property.description.slice(0, descMaxLen)}…`;

  // ── Auth guard helper ────────────────────────────────────────────────────
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/properties/${property._id}`);
      return false;
    }
    return true;
  }, [isAuthenticated, router, property._id]);

  const requireContact = useCallback(() => {
    if (!contact || !contact._id) {
      toast.error(pd?.contactUnavailableError || "Contact unavailable", {
        description: pd?.contactUnavailableDesc || "The property owner hasn't completed their profile yet.",
      });
      return false;
    }
    const currentUserId = user?.id ?? user?._id;
    if (contact._id.toString() === currentUserId?.toString()) {
      toast.error(pd?.cantMessageYourself || "You can't message yourself");
      return false;
    }
    return true;
  }, [contact, user]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChatClick = useCallback(() => {
    if (!requireAuth() || !requireContact()) return;
    setIsOpen(true);
  }, [requireAuth, requireContact]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) {
      toast.error(pd?.enterMessage || "Please enter a message");
      return;
    }
    if (!contact?._id) return;

    setIsLoading(true);
    try {
      await createConversation(
        contact._id.toString(),
        property._id.toString(),
        message.trim()
      );
      setIsOpen(false);
      setMessage("");
      router.push("/dashboard/message");
    } catch (error: any) {
      toast.error(pd?.failedSendMessage || "Failed to send message", {
        description: error?.message ?? (pd?.pleaseTryAgain || "Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  }, [message, contact, property._id, createConversation, router]);

  const handleQuickMessage = useCallback(async () => {
    if (!requireAuth() || !requireContact()) return;
    if (!contact?._id) return;

    setIsLoading(true);
    try {
      await createConversation(
        contact._id.toString(),
        property._id.toString(),
        pd?.askAvailabilityText?.replace("{title}", property.title) || `Hi! I'm interested in ${property.title}. Is it still available?`
      );
      router.push("/dashboard/message");
    } catch (error: any) {
      toast.error(pd?.failedSendMessage || "Failed to send message", {
        description: error?.message ?? (pd?.pleaseTryAgain || "Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, requireContact, contact, property._id, property.title, createConversation, router]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0 text-[#222222]">

      {/* ── Subtitle row: type stats ── */}
      <div className="py-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px]">
        <span className="font-medium capitalize">{property.type}</span>
        <span className="text-[#DDDDDD]">·</span>
        <span className="capitalize">{property.listingType.replace("_", " ")}</span>
        {property.amenities.bedrooms && (
          <>
            <span className="text-[#DDDDDD]">·</span>
            <span>{property.amenities.bedrooms} beds</span>
          </>
        )}
        {property.amenities.bathrooms && (
          <>
            <span className="text-[#DDDDDD]">·</span>
            <span>{property.amenities.bathrooms} baths</span>
          </>
        )}
        {property.viewsCount > 0 && (
          <span className="ml-auto flex items-center gap-1 text-[14px] text-[#717171]">
            <Eye className="h-4 w-4 stroke-[2]" aria-hidden />
            {property.viewsCount.toLocaleString()} views
          </span>
        )}
      </div>

      <div className="h-px bg-[#DDDDDD]" />

      {/* ── Host card (Airbnb style) ── */}
      <div className="py-6 flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14">
            {contact?.profilePicture && (
              <AvatarImage src={contact.profilePicture} alt={contactName} />
            )}
            <AvatarFallback className="bg-blue-600 text-white text-[16px] font-semibold">
              {contactInitials}
            </AvatarFallback>
          </Avatar>
          {/* Superhost badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
            <Star className="w-2.5 h-2.5 fill-white stroke-0" />
          </div>
        </div>
        <div>
          <p className="text-[16px] font-semibold text-[#222222]">
            {(pd as any)?.hostedBy || "Hosted by"} {contactName}
          </p>
          <p className="text-[14px] text-[#717171] mt-0.5">{yearsHosting}</p>
        </div>
      </div>

      <div className="h-px bg-[#DDDDDD]" />

      {/* ── Host highlights ── */}
      <div className="py-6 space-y-5">
        {/* Instant book / verified / response */}
        <div className="flex items-start gap-4">
          <Award className="h-6 w-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-[16px] font-medium text-[#222222]">
              {contactRole}
            </p>
            <p className="text-[14px] text-[#717171]">
              {contact?.rating
                ? `★ ${contact.rating.toFixed(1)} · ${contact.totalReviews ?? 0} reviews`
                : "New on Horohouse"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-[16px] font-medium text-[#222222]">Identity verified</p>
            <p className="text-[14px] text-[#717171]">Confirmed email and phone number</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Clock className="h-6 w-6 text-[#222222] stroke-[1.5] shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-[16px] font-medium text-[#222222]">Listed {daysOnMarket} day{daysOnMarket !== 1 ? "s" : ""} ago</p>
            <p className="text-[14px] text-[#717171]">Usually responds within a few hours</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#DDDDDD]" />

      {/* ── Description ── */}
      <div className="py-6 space-y-4">
        <p className="text-[16px] text-[#222222] leading-relaxed whitespace-pre-line">
          {displayDesc}
        </p>
        {isLongDesc && (
          <button
            onClick={() => setDescExpanded(v => !v)}
            className="flex items-center gap-1 text-[16px] font-semibold text-[#222222] underline underline-offset-2 hover:text-black transition-colors"
          >
            {descExpanded ? "Show less" : "Show more →"}
          </button>
        )}
      </div>

      <div className="h-px bg-[#DDDDDD]" />

      {/* ── Amenities ── */}
      {amenityGroups.length > 0 && (
        <div className="py-6 space-y-6">
          <h2 className="text-[22px] font-semibold tracking-tight">{pd?.propertyFeatures || "What this place offers"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            {visibleAmenities.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-4">
                <item.icon className="h-6 w-6 text-[#222222] stroke-[1.5] shrink-0" aria-hidden />
                <span className="text-[16px] text-[#222222]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {hasMoreAmenities && (
            <button
              onClick={() => setShowAllAmenities(true)}
              className="mt-2 h-11 px-6 rounded-xl font-semibold text-[15px] text-[#222222] border border-[#222222] hover:bg-[#F7F7F7] transition-colors"
            >
              Show all {allAmenityItems.length} amenities
            </button>
          )}
        </div>
      )}


      {/* ── Show All Amenities Modal ── */}
      <ShowAllAmenitiesModal
        open={showAllAmenities}
        onClose={() => setShowAllAmenities(false)}
        groups={amenityGroups}
      />

      {/* ── Custom Message Dialog ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-8 border-[#DDDDDD] rounded-2xl shadow-2xl">
          <DialogHeader className="mb-6 space-y-2 text-left">
            <DialogTitle className="text-[22px] font-semibold text-[#222222]">
              {pd?.sendMessageTo?.replace("{name}", contactName) || `Contact ${contactName}`}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#717171]">
              {pd?.writeMessageAbout?.replace("{title}", property.title) || `Ask a question about ${property.title}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="custom-message" className="text-[15px] font-semibold text-[#222222] block">
                {pd?.yourMessage || "Message"}
              </label>
              <Textarea
                id="custom-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi! I'm interested in ${property.title}…`}
                rows={5}
                className="resize-none text-[15px] p-4 bg-white border-[#DDDDDD] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[14px] font-semibold text-[#222222]">{pd?.quickTemplates || "Quick templates"}</p>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES(property.title, pd).map(({ label, text }) => (
                  <Button
                    key={label}
                    variant="outline"
                    className="rounded-full border-[#DDDDDD] text-[#222222] hover:border-blue-600 hover:bg-white text-[14px] font-medium h-9"
                    onClick={() => setMessage(text)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 sm:space-x-0 gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-1/2 h-12 rounded-xl font-semibold text-[15px] border-[#222222] text-[#222222] hover:bg-[#F7F7F7] transition-colors"
            >
              {pd?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              aria-busy={isLoading}
              className="w-full sm:w-1/2 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors"
            >
              {isLoading ? (pd?.sending || "Sending…") : (pd?.sendMessage || "Send message")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyInfo;