// components/property/details/TourPreview.tsx
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Play, CalendarClock, Video, Image as ImageIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Dynamic import — TourViewer JS chunk only loads when the modal opens.
// Critical for bandwidth saving on slow African networks.
const TourViewer = dynamic(() => import("./TourViewer"), {
    ssr: false,
    loading: () => null,
});

type TourType = "kuula" | "youtube" | "images" | "none";

interface TourPreviewProps {
    propertyId: string;
    tourType?: TourType;
    tourThumbnail?: string;
    virtualTourUrl?: string;
    videoUrl?: string;                                      // legacy field
    images?: Array<{ url: string; caption?: string }>;
    onScheduleVisit: () => void;
}

const TOUR_META: Record<Exclude<TourType, "none">, { label: string; badge: string; Icon: React.ElementType }> = {
    kuula: { label: "Start 360° Tour", badge: "360°", Icon: Globe },
    youtube: { label: "Watch Walkthrough", badge: "Video", Icon: Video },
    images: { label: "Browse Photo Tour", badge: "Photo Tour", Icon: ImageIcon },
};

export default function TourPreview({
    propertyId,
    tourType = "none",
    tourThumbnail,
    virtualTourUrl,
    videoUrl,
    images = [],
    onScheduleVisit,
}: TourPreviewProps) {

    // Auto-upgrade to image tour if no tour type is set but images exist
    const effectiveTourType: TourType = (() => {
        if (tourType !== "none") return tourType;
        if (videoUrl) return "youtube";
        if (images.length > 0) return "images"; // ← auto photo tour
        return "none";
    })();

    const [isOpen, setIsOpen] = useState(false);
    const handleClose = useCallback(() => setIsOpen(false), []);


    const effectiveUrl = virtualTourUrl ?? videoUrl;

    // ── No tour at all ───────────────────────────────────────────────────────
    if (effectiveTourType === "none") {
        return (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                    <p className="font-semibold text-slate-700">No virtual tour yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                        Schedule an in-person visit to see the property.
                    </p>
                </div>
                <Button
                    onClick={onScheduleVisit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold"
                >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Schedule a Visit
                </Button>
            </div>
        );
    }

    const meta = TOUR_META[effectiveTourType];

    return (
        <div className="space-y-4">
            {/* ── Thumbnail with play overlay ── */}
            <div
                role="button"
                tabIndex={0}
                aria-label={meta.label}
                onClick={() => setIsOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
                className="relative rounded-2xl overflow-hidden bg-slate-900 cursor-pointer group aspect-video"
            >
                {/* Thumbnail image — Cloudinary auto-format & quality */}
                {tourThumbnail ? (
                    <img
                        src={`${tourThumbnail}?w=800&q=auto&f=auto`}
                        alt="Virtual tour preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={800}
                        height={450}
                    />
                ) : images[0]?.url ? (
                    <img
                        src={`${images[0].url}?w=800&q=auto&f=auto`}
                        alt="Tour preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={800}
                        height={450}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                )}

                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badge top-left */}
                <Badge className="absolute top-4 left-4 bg-white/20 text-white border-none backdrop-blur-sm font-bold">
                    {meta.badge}
                </Badge>

                {/* Play button centre */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                        <Play className="h-7 w-7 text-white fill-white ml-1" />
                    </div>
                </div>

                {/* Label bottom */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <meta.Icon className="h-5 w-5 text-white/80" />
                    <span className="text-white font-semibold text-sm drop-shadow">
                        {meta.label}
                    </span>
                </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-3">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold"
                >
                    <meta.Icon className="h-4 w-4 mr-2" />
                    {meta.label}
                </Button>
                <Button
                    onClick={onScheduleVisit}
                    variant="outline"
                    className="flex-1 border-2 border-slate-200 text-slate-700 rounded-xl h-12 font-bold hover:bg-slate-50"
                >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Schedule Visit
                </Button>
            </div>

            {/* ── Lazy-mounted viewer modal ── */}
            {isOpen && (
                <TourViewer
                    tourType={effectiveTourType}
                    virtualTourUrl={effectiveUrl}
                    images={images}
                    propertyId={propertyId}
                    onClose={handleClose}
                />
            )}
        </div>
    );
}