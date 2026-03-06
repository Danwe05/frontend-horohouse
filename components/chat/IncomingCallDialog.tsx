import { Phone, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="text-center text-white max-w-md p-8">
        <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Avatar className="w-28 h-28">
            <AvatarImage src={caller.profilePicture} />
            <AvatarFallback className="text-4xl">
              {caller.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <h2 className="text-3xl font-bold mb-2">{caller.name}</h2>
        <p className="text-gray-300 mb-2">
          {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Ringing... ({timeoutSeconds}s)
        </p>
        
        <div className="flex gap-6 justify-center">
          <div className="text-center">
            <Button
              onClick={onDecline}
              className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 mb-2"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
            <p className="text-sm text-gray-400">Decline</p>
          </div>
          
          <div className="text-center">
            <Button
              onClick={onAnswer}
              className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 mb-2 animate-pulse"
            >
              <Phone className="w-7 h-7" />
            </Button>
            <p className="text-sm text-gray-400">Answer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
