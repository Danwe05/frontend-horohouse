import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface IncomingCallDialogProps {
  caller: {
    name: string;
    profilePicture?: string;
  };
  callType: 'audio' | 'video';
  onAnswer: () => void;
  onDecline: () => void;
}

export function IncomingCallDialog({
  caller,
  callType,
  onAnswer,
  onDecline
}: IncomingCallDialogProps) {
  const [timeoutSeconds, setTimeoutSeconds] = useState(45);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-[340px] p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Avatar with subtle ringing pulse */}
        <div className="relative w-28 h-28 mb-6">
          <div className="absolute inset-0 rounded-full border-[6px] border-[#008A05]/10 animate-ping" style={{ animationDuration: '2s' }} />
          <Avatar className="relative z-10 w-28 h-28 border border-[#EBEBEB] shadow-sm bg-[#F7F7F7]">
            <AvatarImage src={caller.profilePicture} className="object-cover" />
            <AvatarFallback className="text-[32px] font-semibold text-[#222222]">
              {caller.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Caller Info */}
        <h2 className="text-[22px] font-semibold text-[#222222] tracking-tight mb-1 truncate w-full">
          {caller.name}
        </h2>
        <div className="flex flex-col items-center gap-1.5 mb-8 text-[#717171]">
          <p className="text-[15px] flex items-center gap-1.5 font-medium">
            {callType === 'video' ? (
              <><Video className="w-4 h-4 stroke-[2]" /> Incoming video call</>
            ) : (
              <><Phone className="w-4 h-4 stroke-[2]" /> Incoming audio call</>
            )}
          </p>
          <p className="text-[13px]">
            Ringing... 0:{timeoutSeconds.toString().padStart(2, '0')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-8 w-full">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-[#C2293F] hover:bg-[#A31F33] text-white flex items-center justify-center transition-transform hover:scale-105 focus:outline-none shadow-sm active:scale-95"
            >
              <PhoneOff className="w-6 h-6 stroke-[2]" />
            </button>
            <span className="text-[13px] font-medium text-[#717171]">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAnswer}
              className="w-14 h-14 rounded-full bg-[#008A05] hover:bg-[#006C04] text-white flex items-center justify-center transition-transform hover:scale-105 focus:outline-none shadow-sm active:scale-95"
            >
              <Phone className="w-6 h-6 stroke-[2]" />
            </button>
            <span className="text-[13px] font-medium text-[#717171]">Answer</span>
          </div>
        </div>
      </div>
    </div>
  );
}