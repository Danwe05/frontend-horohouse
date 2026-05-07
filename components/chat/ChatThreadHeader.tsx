import React from "react";
import { ArrowLeft, MapPin, MoreVertical, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatThreadHeaderProps {
  otherUser: any;
  activeConversation: any;
  isOtherUserOnline: boolean;
  callStatus: string;
  onBack?: () => void;
  onStartVideoCall: () => void;
}

export function ChatThreadHeader({
  otherUser,
  activeConversation,
  isOtherUserOnline,
  callStatus,
  onBack,
  onStartVideoCall,
}: ChatThreadHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const s = (t as any)?.messages || {};

  return (
    <div className="px-6 py-4 bg-white border-b border-[#EBEBEB] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none" 
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
        )}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F7F7F7] border border-[#DDDDDD] flex items-center justify-center text-[#222222]">
            {otherUser?.profilePicture ? (
              <img src={otherUser.profilePicture} alt={otherUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] font-bold">{otherUser?.name?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          {isOtherUserOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#008A05] border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[16px] font-semibold text-[#222222] truncate">
              {otherUser?.name || (s.unknownUser || "Unknown User")}
            </h2>
          </div>
          {activeConversation?.propertyId?._id ? (
            <button
              onClick={() => router.push(`/properties/${activeConversation.propertyId?._id}`)}
              className="flex items-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222222] transition-colors text-left truncate max-w-full focus:outline-none"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{activeConversation.propertyId?.title}</span>
            </button>
          ) : (
            <p className="text-[13px] text-[#717171] truncate">
              {isOtherUserOnline ? 'Active now' : 'Offline'}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#F7F7F7] transition-colors disabled:opacity-50 focus:outline-none"
          onClick={onStartVideoCall}
          disabled={!isOtherUserOnline || callStatus !== 'idle'}
          title={isOtherUserOnline ? "Start video call" : "User is offline"}
        >
          <Video className="w-5 h-5 stroke-[2]" />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#F7F7F7] transition-colors focus:outline-none">
          <MoreVertical className="w-5 h-5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
