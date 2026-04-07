import { MoreVertical, Paperclip, Send, ArrowLeft, Smile, MessageCircle, Mic, Video, MapPin, Check, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState, useEffect, useRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoCall } from "@/hooks/useVideoCall";
import { VideoCallOverlay } from './VideoCallOverlay';
import { IncomingCallDialog } from './IncomingCallDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  onBack?: () => void;
  conversationId?: string;
}

export function ChatThread({ onBack, conversationId }: ChatThreadProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    socket,
    activeConversation,
    messages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    typingUsers,
    onlineUsers,
    isConnected,
  } = useChatContext();
  const { t } = useLanguage();
  const s = (t as any)?.messages || {};

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // FIX: Normalize current user ID to string once
  const currentUserId = (user?.id || user?._id || '').toString();

  // Get other user from conversation
  const otherUser = activeConversation?.otherUser ||
    activeConversation?.participants.find(
      p => p.userId._id.toString() !== currentUserId
    )?.userId;

  const {
    callStatus,
    currentCall,
    remoteUser,
    localVideoRef,
    remoteVideoRef,
    remoteStreamRef,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
  } = useVideoCall({
    socket,
    userId: currentUserId,
    otherUser,
    onIncomingCall: (data) => {
      console.log('📞 Incoming call data in ChatThread:', data);
      setIncomingCallData(data);
    },
  });

  // Control video overlay visibility
  useEffect(() => {
    if (callStatus === 'calling' || callStatus === 'connecting' || callStatus === 'connected') {
      setShowVideoCall(true);
      if (callStatus === 'connecting' || callStatus === 'connected') {
        setIncomingCallData(null);
      }
    } else if (callStatus === 'idle' || callStatus === 'ended' || callStatus === 'declined' || callStatus === 'missed') {
      setShowVideoCall(false);
      setIncomingCallData(null);
    }
  }, [callStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (activeConversation && messages.length > 0 && currentUserId) {
      const unreadMessages = messages
        .filter(msg => {
          // FIX: Normalize senderId safely whether it's a string or object
          const senderId = typeof msg.senderId === 'object'
            ? msg.senderId._id?.toString()
            : (msg.senderId as any)?.toString();
          return senderId !== currentUserId && msg.status !== 'read';
        })
        .map(msg => msg._id)
        // Exclude optimistic temp messages (they don't exist on server yet)
        .filter(id => id && !id.startsWith('temp_'));

      if (unreadMessages.length > 0) {
        markAsRead(activeConversation._id, unreadMessages);
      }
    }
  }, [messages, activeConversation, currentUserId, markAsRead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      stopRecording();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!isTyping && activeConversation) {
      setIsTyping(true);
      startTyping(activeConversation._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (activeConversation) {
        setIsTyping(false);
        stopTyping(activeConversation._id);
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeConversation) return;

    sendMessage(activeConversation._id, inputValue.trim());
    setInputValue("");

    if (isTyping) {
      setIsTyping(false);
      stopTyping(activeConversation._id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !activeConversation) return;
    const audioUrl = URL.createObjectURL(audioBlob);
    const voiceMessageContent = `VOICE_MESSAGE:${audioUrl}:${recordingTime}`;
    sendMessage(activeConversation._id, voiceMessageContent, 'audio');
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleStartVideoCall = async () => {
    if (!activeConversation) return;
    try {
      await startCall(activeConversation._id, 'video');
    } catch (error: any) {
      console.error('Error starting video call:', error);
      alert(error.message || 'Could not start video call');
    }
  };

  const handleAnswerCall = async () => {
    if (!incomingCallData) return;
    try {
      await answerCall(incomingCallData);
    } catch (error: any) {
      console.error('Error answering call:', error);
      alert(error.message || 'Could not answer call');
      setIncomingCallData(null);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCallData) {
      declineCall(incomingCallData.call._id);
      setIncomingCallData(null);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border-l border-[#EBEBEB]">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-[#F7F7F7] border border-[#EBEBEB] rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-[#DDDDDD] stroke-[1.5]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#222222] mb-2">{s.yourMessages || 'Your messages'}</h2>
          <p className="text-[15px] text-[#717171] mb-8 leading-relaxed">
            {s.selectConversationDesc || 'Select a conversation from the list to start messaging, or browse properties to connect with owners and agents.'}
          </p>
          <Button 
            onClick={() => router.push('/')} 
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[15px] transition-colors"
          >
            {s.browseProperties || 'Browse listings'}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border-l border-[#EBEBEB]">
        <div className="text-center max-w-md p-8">
          <h2 className="text-[22px] font-semibold text-[#222222] mb-2">{s.authRequired || 'Authentication required'}</h2>
          <p className="text-[15px] text-[#717171] mb-6">{s.pleaseLoginAccess || 'Please log in to access your messages.'}</p>
        </div>
      </div>
    );
  }

  const isOtherUserOnline = otherUser && onlineUsers.has(otherUser._id);
  const isOtherUserTyping = Array.from(typingUsers).some(id => id !== currentUserId);
  const displayUser = remoteUser || otherUser;

  return (
    <div className="flex-1 flex flex-col h-full bg-white min-h-0 relative border-l border-[#EBEBEB]">
      {/* Video Call Overlay */}
      {showVideoCall && (
        <VideoCallOverlay
          onClose={() => setShowVideoCall(false)}
          callStatus={callStatus}
          remoteUser={displayUser}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          remoteStreamRef={remoteStreamRef}
          toggleMicrophone={toggleMicrophone}
          toggleCamera={toggleCamera}
          endCall={endCall}
        />
      )}

      {/* Incoming Call Dialog */}
      {incomingCallData && callStatus === 'ringing' && (
        <IncomingCallDialog
          caller={{
            name: incomingCallData.initiator?.name || 'Unknown',
            profilePicture: incomingCallData.initiator?.profilePicture,
          }}
          callType={incomingCallData.call?.type || 'video'}
          onAnswer={handleAnswerCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Chat Header */}
      <div className="px-6 py-4 bg-white border-b border-[#EBEBEB] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none" onClick={onBack}>
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
              <h2 className="text-[16px] font-semibold text-[#222222] truncate">{otherUser?.name || (s.unknownUser || "Unknown User")}</h2>
            </div>
            {activeConversation.propertyId?._id ? (
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
            onClick={handleStartVideoCall}
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

      {/* Connection Warning */}
      {!isConnected && (
        <div className="px-6 py-2.5 bg-[#FFF7ED] border-b border-[#C2410C]/20 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#C2410C] rounded-full animate-pulse" />
          <span className="text-[13px] font-medium text-[#C2410C]">{s.reconnectingMsg || 'Reconnecting to chat server...'}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EBEBEB]">
                <MessageCircle className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#222222] mb-2">{s.noMessagesYetStr || 'No messages yet'}</h3>
              <p className="text-[15px] text-[#717171]">
                {s.startConversationWith?.replace('{name}', otherUser?.name) ||
                  `Send a message to ${otherUser?.name} to start the conversation.`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const senderId = typeof message.senderId === 'object'
                ? message.senderId._id?.toString()
                : (message.senderId as any)?.toString();

              const isOwn = !!senderId && !!currentUserId && senderId === currentUserId;

              const isVoiceMessage = message.type === 'audio' ||
                (message.content && message.content.startsWith('VOICE_MESSAGE:'));

              const isOptimistic = !!message._id && message._id.startsWith('temp_');

              return (
                <div
                  key={`${message._id}-${index}`}
                  className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB] shrink-0 flex items-center justify-center text-[#222222] mb-5">
                      {typeof message.senderId === 'object' && message.senderId.profilePicture ? (
                        <img src={message.senderId.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] font-bold">
                          {typeof message.senderId === 'object' ? message.senderId.name?.[0]?.toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start", "max-w-[75%]")}>
                    <div
                      className={cn(
                        "px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                        isOwn 
                          ? "bg-blue-600 text-white rounded-2xl rounded-br-sm" 
                          : "bg-[#F7F7F7] text-[#222222] border border-[#EBEBEB] rounded-2xl rounded-bl-sm",
                        isVoiceMessage ? 'min-w-[200px]' : '',
                        isOptimistic ? 'opacity-70' : 'opacity-100'
                      )}
                    >
                      {!isVoiceMessage && message.type !== 'image' && (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>

                    <div className={cn("flex items-center gap-1.5 mt-1.5", isOwn ? "pr-1" : "pl-1")}>
                      <span className="text-[11px] font-medium text-[#717171]">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isOwn && (
                        <span className="flex items-center">
                          {isOptimistic ? (
                            <Check className="w-3.5 h-3.5 text-[#DDDDDD]" />
                          ) : message.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#222222]" />
                          ) : message.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#717171]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[#717171]" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isOtherUserTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB] shrink-0 flex items-center justify-center text-[#222222] mb-1">
                  {otherUser?.profilePicture ? (
                    <img src={otherUser.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold">{otherUser?.name?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="bg-[#F7F7F7] border border-[#EBEBEB] px-4 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center justify-center h-[46px] mb-1">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#717171] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#717171] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1.5 h-1.5 bg-[#717171] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 bg-white border-t border-[#EBEBEB] shrink-0">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] transition-colors focus:outline-none">
            <Paperclip className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors focus:outline-none",
              isRecording ? "text-[#C2293F] bg-[#FFF8F6]" : "text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]"
            )}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            title="Hold to record voice message"
          >
            <Mic className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={s.typeYourMessage || 'Type a message...'}
              className="w-full h-12 bg-[#F7F7F7] border-transparent rounded-full px-5 text-[15px] focus-visible:ring-1 focus-visible:ring-[#222222] placeholder:text-[#717171] pr-12"
              disabled={!isConnected}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:text-[#222222] transition-colors focus:outline-none">
              <Smile className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          <button
            className={cn(
              "w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-transform focus:outline-none",
              inputValue.trim() && isConnected 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-[#F7F7F7] text-[#DDDDDD] cursor-not-allowed"
            )}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected}
          >
            <Send className="w-5 h-5 stroke-[2] -ml-0.5 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}