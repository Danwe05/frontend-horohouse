import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VideoCallOverlayProps {
  onClose?: () => void;
  callStatus: string;
  remoteUser: any;
  // FIXED: Accept nullable refs to match useVideoCall hook
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
      console.log('🎥 Attaching remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(err => console.error('Error playing remote video:', err));
    }
  }, [callStatus, remoteVideoRef, remoteStreamRef]);

  // Call duration timer
  useEffect(() => {
    console.log('📊 VideoCallOverlay: callStatus =', callStatus);

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
    console.log('📵 Ending call from overlay');
    endCall();
    onClose?.();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if call is idle
  if (callStatus === 'idle') {
    console.log('⚠️ VideoCallOverlay: Not rendering (status=idle)');
    return null;
  }

  console.log('✅ VideoCallOverlay: Rendering with status:', callStatus);
  console.log('👤 Remote user:', remoteUser?.name || 'Unknown');

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${isFullscreen ? '' : 'rounded-lg'}`}>
      {/* Remote Video */}
      <div className="flex-1 bg-gray-900 relative">
        {callStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={remoteUser?.profilePicture} />
                <AvatarFallback className="text-4xl">
                  {remoteUser?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-semibold mb-2">
                {remoteUser?.name || 'Unknown User'}
              </h3>
              <p className="text-gray-300">
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'ringing' && 'Ringing...'}
                {callStatus === 'connecting' && 'Connecting...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video Preview */}
        {isCameraEnabled && (
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
        )}

        {/* Call Info */}
        <div className="absolute top-8 left-8 text-white">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            {remoteUser?.name || 'Unknown User'}
            {callStatus === 'connected' && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </h3>
          {callStatus === 'connected' ? (
            <p className="text-green-400">{formatDuration(callDuration)}</p>
          ) : (
            <p className="text-gray-300 capitalize">{callStatus}</p>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-8 right-8 bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 p-0"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </Button>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <Button
            onClick={handleToggleMic}
            className={`rounded-full w-14 h-14 transition-all ${isMicEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-500 hover:bg-red-600'
              }`}
            title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={handleToggleCamera}
            className={`rounded-full w-14 h-14 transition-all ${isCameraEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-500 hover:bg-red-600'
              }`}
            title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 rounded-full w-14 h-14 transition-all hover:scale-110"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
