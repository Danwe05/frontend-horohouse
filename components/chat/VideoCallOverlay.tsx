'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface VideoCallOverlayProps {
  onClose?: () => void;
  callStatus: string;
  remoteUser: any;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  toggleMicrophone: () => boolean;
  toggleCamera: () => boolean;
  endCall: () => void;
}

export function VideoCallOverlay({
  onClose,
  callStatus,
  remoteUser,
  localVideoRef,
  remoteVideoRef,
  remoteStreamRef,
  toggleMicrophone,
  toggleCamera,
  endCall,
}: VideoCallOverlayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Attach remote stream when video element is ready
  useEffect(() => {
    if (callStatus === 'connected' && remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(err => console.error('Error playing remote video:', err));
    }
  }, [callStatus, remoteVideoRef, remoteStreamRef]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [callStatus]);

  const handleToggleMic = () => {
    const enabled = toggleMicrophone();
    setIsMicEnabled(enabled);
  };

  const handleToggleCamera = () => {
    const enabled = toggleCamera();
    setIsCameraEnabled(enabled);
  };

  const handleEndCall = () => {
    endCall();
    onClose?.();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (callStatus === 'idle') return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[10000] bg-[#1A1A1A] flex flex-col overflow-hidden transition-all duration-500",
      isFullscreen ? "m-0" : "sm:m-4 sm:rounded-2xl shadow-2xl border border-white/10"
    )}>
      
      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
            <Avatar className="w-full h-full">
              <AvatarImage src={remoteUser?.profilePicture} className="object-cover" />
              <AvatarFallback className="bg-[#222222] text-white">
                {remoteUser?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-white">
            <h3 className="text-[16px] font-semibold leading-none mb-1.5">
              {remoteUser?.name || 'User'}
            </h3>
            {callStatus === 'connected' ? (
              <p className="text-[13px] text-white/70 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#008A05] rounded-full animate-pulse" />
                {formatDuration(callDuration)}
              </p>
            ) : (
              <p className="text-[13px] text-white/70 animate-pulse">
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'ringing' && 'Ringing...'}
                {callStatus === 'connecting' && 'Connecting...'}
              </p>
            )}
          </div>
        </div>

        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus:outline-none"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Main Video Area ── */}
      <div className="flex-1 relative flex items-center justify-center">
        {callStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center">
             <div className="w-32 h-32 rounded-full border-2 border-white/10 p-1 mb-6">
                <Avatar className="w-full h-full">
                  <AvatarImage src={remoteUser?.profilePicture} className="object-cover" />
                  <AvatarFallback className="bg-[#222222] text-white text-4xl">
                    {remoteUser?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
             </div>
             {callStatus === 'connecting' && <Loader2 className="w-6 h-6 text-white/40 animate-spin" />}
          </div>
        )}

        {/* Local Video PIP (Airbnb Style: Floating, rounded, sharp border) */}
        {isCameraEnabled && (
          <div className="absolute bottom-24 right-6 w-32 sm:w-48 aspect-[3/4] bg-[#222222] rounded-xl overflow-hidden border border-white/20 shadow-2xl z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-8 flex items-center justify-center gap-6 bg-gradient-to-t from-black/60 to-transparent">
        
        {/* Toggle Mic */}
        <button
          onClick={handleToggleMic}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all focus:outline-none",
            isMicEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#C2293F] text-white hover:bg-[#A31F33]"
          )}
        >
          {isMicEnabled ? <Mic className="w-6 h-6 stroke-[1.5]" /> : <MicOff className="w-6 h-6 stroke-[1.5]" />}
        </button>

        {/* End Call (Airbnb Red: #C2293F) */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-[#C2293F] text-white flex items-center justify-center hover:bg-[#A31F33] transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
        >
          <PhoneOff className="w-7 h-7 stroke-[2]" />
        </button>

        {/* Toggle Camera */}
        <button
          onClick={handleToggleCamera}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all focus:outline-none",
            isCameraEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#C2293F] text-white hover:bg-[#A31F33]"
          )}
        >
          {isCameraEnabled ? <Video className="w-6 h-6 stroke-[1.5]" /> : <VideoOff className="w-6 h-6 stroke-[1.5]" />}
        </button>

      </div>
    </div>
  );
}