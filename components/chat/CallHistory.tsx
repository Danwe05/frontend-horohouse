import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/api';
import { useEffect, useState } from 'react';

export function CallHistory({ conversationId }: { conversationId?: string }) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, [conversationId]);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const data = conversationId
        ? await apiClient.getConversationCallHistory(conversationId)
        : await apiClient.getUserCallHistory();
      setCalls(data);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCallIcon = (call: any, isInitiator: boolean) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    if (isInitiator) {
      return <PhoneOutgoing className="w-4 h-4 text-green-500" />;
    }
    return <PhoneIncoming className="w-4 h-4 text-blue-500" />;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'Not connected';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-4 text-center">Loading call history...</div>;
  }

  if (calls.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No call history</div>;
  }

  return (
    <div className="divide-y">
      {calls.map((call) => {
        const isInitiator = call.initiatorId._id === call.userId;
        const otherUser = isInitiator ? call.recipientId : call.initiatorId;

        return (
          <div key={call._id} className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.profilePicture} />
                <AvatarFallback>{otherUser.name?.[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getCallIcon(call, isInitiator)}
                  <span className="font-medium">{otherUser.name}</span>
                  {call.type === 'video' && <Video className="w-3 h-3 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}</span>
                  <span>•</span>
                  <span>{formatDuration(call.duration)}</span>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="rounded-full">
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}