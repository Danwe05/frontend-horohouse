import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronRight, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export function ChatDetailsSidebar() {
  const { activeConversation } = useChatContext();
  const { user } = useAuth();
  const { t } = useLanguage();
  const s = (t as any)?.messages || {};

  const [reservation, setReservation] = useState<any>(null);
  const [loadingRes, setLoadingRes] = useState<boolean>(false);

  useEffect(() => {
    if (!activeConversation?.propertyId || !user) return;

    const propertyId = activeConversation.propertyId._id;
    const currentUserId = user.id || user._id;

    const fetchBooking = async () => {
      setLoadingRes(true);
      try {
        // Since we don't strictly know if the current user is host or guest in this chat,
        // we conservatively try fetching from 'my' bookings first.
        const myRes = await apiClient.getMyBookings();
        let found = myRes?.bookings?.find((b: any) => b.propertyId?._id === propertyId);

        // If not found in guest bookings, try host bookings
        if (!found) {
          try {
            const hostRes = await apiClient.getHostBookings();
            const otherUserId = activeConversation.otherUser?._id || 
              activeConversation.participants.find(p => p.userId._id !== currentUserId)?.userId._id;
            
            found = hostRes?.bookings?.find((b: any) => 
              b.propertyId?._id === propertyId && 
              b.guestId?._id === otherUserId
            );
          } catch (e) {
            // Might fail if user is not a host, ignore
          }
        }
        
        if (found) {
          setReservation(found);
        }
      } catch (err) {
        console.error("Error fetching reservation for chat:", err);
      } finally {
        setLoadingRes(false);
      }
    };

    fetchBooking();
  }, [activeConversation, user]);

  if (!activeConversation) {
    return null;
  }

  const currentUserId = (user?.id || user?._id || '').toString();
  const otherUser = activeConversation.otherUser || 
    activeConversation.participants.find(
      p => p.userId._id.toString() !== currentUserId
    )?.userId;

  const property = activeConversation.propertyId;

  const renderTimelineDate = (dateString: string, label: string) => {
    const d = new Date(dateString);
    return (
      <div>
        <p className="text-[12px] font-semibold text-[#717171] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[15px] font-medium text-[#222222]">
          {d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    );
  };

  return (
    <div className="w-[320px] shrink-0 border-l border-[#EBEBEB] bg-white hidden lg:flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 pb-2">
        <h2 className="text-[18px] font-semibold text-[#222222] mb-6">Details</h2>
      </div>

      {property && (
        <div className="px-6 py-4 border-b border-[#EBEBEB]">
          <Link href={`/properties/${property._id}`} className="group block focus:outline-none">
            <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-[#EBEBEB] mb-4">
              {property.images?.[0]?.url ? (
                <img 
                  src={property.images[0].url} 
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-[16px] text-[#222222] line-clamp-2 leading-snug group-hover:underline">
              {property.title}
            </h3>
            {property.price && (
              <p className="text-[15px] text-[#717171] mt-1">
                <span className="font-semibold text-[#222222]">${property.price.toLocaleString()}</span> / night
              </p>
            )}
          </Link>
          <div className="mt-5 space-y-3">
            <button
              onClick={() => window.location.href = `/properties/${property._id}`}
              className="w-full py-3 bg-white border border-[#222222] text-[#222222] rounded-lg font-semibold text-[15px] hover:bg-[#F7F7F7] transition-colors focus:outline-none"
            >
              View property
            </button>
            {reservation ? (
              <Link href={`/dashboard/reservations`}>
                <button className="w-full py-3 mt-3 bg-[#222222] text-white rounded-lg font-semibold text-[15px] hover:bg-black transition-colors focus:outline-none">
                  Manage reservation
                </button>
              </Link>
            ) : (
              <button className="w-full py-3 bg-[#222222] text-white rounded-lg font-semibold text-[15px] hover:bg-black transition-colors focus:outline-none">
                Request or send money
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Trip Timeline */}
      {(property && reservation) ? (
        <div className="px-6 py-6 border-b border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[16px] text-[#222222]">Trip details</h3>
            <span className="px-2 py-1 bg-[#F7F7F7] rounded-md text-[11px] font-bold tracking-wide text-[#222222] uppercase">
              {reservation.status}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            {renderTimelineDate(reservation.checkIn, 'Check-in')}
            <div className="w-[1px] h-8 bg-[#EBEBEB]"></div>
            <div className="text-right">
              {renderTimelineDate(reservation.checkOut, 'Check-out')}
            </div>
          </div>
        </div>
      ) : property && !loadingRes ? (
        <div className="px-6 py-6 border-b border-[#EBEBEB]">
           <h3 className="font-semibold text-[16px] text-[#222222] mb-1">No upcoming trip</h3>
           <p className="text-[14px] text-[#717171]">There are no active reservations associated with this conversation.</p>
        </div>
      ) : null}

      {otherUser && (
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#F7F7F7] border border-[#DDDDDD] flex shrink-0 items-center justify-center">
              {otherUser.profilePicture ? (
                <img src={otherUser.profilePicture} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[18px] font-bold text-[#222222]">{otherUser.name?.[0]?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#222222]">{otherUser.name || "Unknown User"}</h3>
              <p className="text-[14px] text-[#717171] mt-0.5">Joined recently</p>
            </div>
          </div>
          
          <div className="space-y-4 mt-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 shrink-0 text-[#222222] stroke-[1.5]" />
              <div>
                <h4 className="text-[15px] text-[#222222] font-semibold">Identity verified</h4>
                <p className="text-[14px] text-[#717171] leading-snug mt-0.5">
                  Protecting your account is our top priority.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-[#EBEBEB] pt-6">
            <button className="flex w-full items-center justify-between text-[#222222] hover:bg-[#F7F7F7] p-2 -mx-2 rounded-lg transition-colors focus:outline-none">
              <span className="text-[15px] font-semibold underline decoration-solid underline-offset-2">Report this user</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
