import { MoreVertical, Paperclip, Send, ArrowLeft, Smile, MessageCircle, Mic, Video } from "lucide-react";
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

  // Get other user from conversation
  const otherUser = activeConversation?.otherUser ||
    activeConversation?.participants.find(p => p.userId._id !== (user?.id || user?._id))?.userId;

  // CRITICAL DEBUG LOGGING
  console.log('🔍 DEBUG - ChatThread otherUser extraction:');
  console.log('  activeConversation:', activeConversation);
  console.log('  activeConversation?.otherUser:', activeConversation?.otherUser);
  console.log('  activeConversation?.participants:', activeConversation?.participants);
  console.log('  otherUser (final):', otherUser);
  console.log('  user?.id:', user?.id || user?._id);

  // Video call hook with proper remote user handling
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
    userId: user?.id || user?._id || '',
    otherUser: otherUser, // Pass the other user for remote user display
    onIncomingCall: (data) => {
      console.log('📞 Incoming call data in ChatThread:', data);
      console.log('👤 Initiator:', data.initiator);
      console.log('📋 Call:', data.call);
      setIncomingCallData(data);
    },
  });

  // Control video overlay visibility
  useEffect(() => {
    console.log('📊 Call status changed to:', callStatus);
    console.log('👤 Remote user:', remoteUser);

    if (callStatus === 'calling' || callStatus === 'connecting' || callStatus === 'connected') {
      console.log('✅ Showing video call overlay');
      setShowVideoCall(true);
      if (callStatus === 'connecting' || callStatus === 'connected') {
        setIncomingCallData(null);
      }
    }
    else if (callStatus === 'idle' || callStatus === 'ended' || callStatus === 'declined' || callStatus === 'missed') {
      console.log('❌ Hiding video call overlay');
      setShowVideoCall(false);
      setIncomingCallData(null);
    }
  }, [callStatus, remoteUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (activeConversation && messages.length > 0 && user) {
      const currentUserId = user.id || user._id;
      const unreadMessages = messages
        .filter(msg => msg.recipientId === currentUserId && msg.status !== 'read')
        .map(msg => msg._id);

      if (unreadMessages.length > 0) {
        markAsRead(activeConversation._id, unreadMessages);
      }
    }
  }, [messages, activeConversation, user, markAsRead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      stopRecording();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!isTyping && activeConversation) {
      setIsTyping(true);
      startTyping(activeConversation._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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

  // Voice Message Functions
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
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
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
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

  // Video Call Functions
  const handleStartVideoCall = async () => {
    if (!activeConversation) return;

    try {
      console.log('📞 Starting video call from ChatThread...');
      console.log('👤 Other user:', otherUser);
      await startCall(activeConversation._id, 'video');
    } catch (error: any) {
      console.error('Error starting video call:', error);
      alert(error.message || 'Could not start video call');
    }
  };

  const handleAnswerCall = async () => {
    if (!incomingCallData) return;

    console.log('📞 Answering call in ChatThread...', incomingCallData);
    console.log('👤 Call initiator:', incomingCallData.initiator);

    try {
      await answerCall(incomingCallData);
      console.log('✅ Call answered successfully');
    } catch (error: any) {
      console.error('❌ Error answering call:', error);
      alert(error.message || 'Could not answer call');
      setIncomingCallData(null);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCallData) {
      console.log('❌ Declining call:', incomingCallData.call._id);
      declineCall(incomingCallData.call._id);
      setIncomingCallData(null);
    }
  };

  // Empty state when no conversation is selected
  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center max-w-md p-8">
          <div className="w-98 h-98 flex items-center justify-center mx-auto">
            <Image src="/messagePage/Texting.gif" alt="Chat Intro" width={100} height={100} style={{ height: "200px", width: "200px" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3">{s.yourMessages || 'Your Messages'}</h2>
          <p className="text-muted-foreground mb-6">
            {s.selectConversationDesc || 'Select a conversation from the list to start messaging, or browse properties to connect with owners and agents.'}
          </p>
          <Button onClick={() => router.push('/')} className="bg-primary">
            {s.browseProperties || 'Browse Properties'}
          </Button>
        </div>
      </div>
    );
  }

  const isOtherUserOnline = otherUser && onlineUsers.has(otherUser._id);
  const isOtherUserTyping = Array.from(typingUsers).some(id => id !== (user?.id || user?._id));
  const currentUserId = user?.id || user?._id;

  if (!currentUserId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center max-w-md p-8">
          <h2 className="text-2xl font-bold mb-3">{s.authRequired || 'Authentication Required'}</h2>
          <p className="text-muted-foreground mb-6">{s.pleaseLoginAccess || 'Please log in to access your messages.'}</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Determine display user for video call
  const displayUser = remoteUser || otherUser;
  console.log('📊 Display user:', displayUser);

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
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
      <div className="p-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={otherUser?.profilePicture} />
              <AvatarFallback>{otherUser?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            {isOtherUserOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{otherUser?.name || (s.unknownUser || "Unknown User")}</h2>
              {isOtherUserOnline && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {s.online || 'Online'}
                </span>
              )}
            </div>
            {activeConversation.propertyId?._id && (
              <button
                onClick={() => router.push(`/properties/${activeConversation.propertyId?._id}`)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors text-left truncate max-w-full"
              >
                📍 {activeConversation.propertyId?.title}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleStartVideoCall}
            disabled={!isOtherUserOnline || callStatus !== 'idle'}
            title={isOtherUserOnline ? "Start video call" : "User is offline"}
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-yellow-700">{s.reconnectingMsg || 'Reconnecting to chat server...'}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{s.noMessagesYetStr || 'No messages yet'}</h3>
              <p className="text-sm text-muted-foreground">
                {s.startConversationWith?.replace('{name}', otherUser?.name) || `Start the conversation by sending a message to ${otherUser?.name}`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const senderId = message.senderId._id;
              const isOwn = senderId === currentUserId ||
                (senderId?.toString && currentUserId?.toString &&
                  senderId.toString() === currentUserId.toString());

              const isVoiceMessage = message.type === 'audio' ||
                (message.content && message.content.startsWith('VOICE_MESSAGE:'));

              return (
                <div
                  key={message._id}
                  className={`flex items-start gap-3 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  {!isOwn && (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={message.senderId.profilePicture} />
                      <AvatarFallback>{message.senderId.name[0]}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                    <div
                      className={`${isOwn ? "bg-primary text-white" : "bg-muted text-foreground"} 
                        p-4 rounded-2xl ${isOwn ? "rounded-tr-sm" : "rounded-tl-sm"} 
                        ${isVoiceMessage ? 'min-w-[200px]' : ''}`}
                    >
                      {!isVoiceMessage && message.type !== 'image' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isOwn && (
                        <span className="text-xs text-muted-foreground">
                          {message.status === 'read' ? (
                            <span className="text-blue-500">✓✓</span>
                          ) : message.status === 'delivered' ? (
                            <span className="text-gray-500">✓✓</span>
                          ) : (
                            <span className="text-gray-400">✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwn && (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={user?.profilePicture} />
                      <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}

            {isOtherUserTyping && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={otherUser?.profilePicture} />
                  <AvatarFallback>{otherUser?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="bg-muted p-4 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full shrink-0 ${isRecording ? 'text-red-500' : ''}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            title="Hold to record voice message"
          >
            <Mic className="w-5 h-5" />
          </Button>

          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={s.typeYourMessage || 'Type your message...'}
            className="flex-1 bg-muted border-0 rounded-full px-4"
            disabled={!isConnected}
          />

          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <Smile className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            className="rounded-full shrink-0 bg-primary hover:opacity-90 transition-opacity"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}