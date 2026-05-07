import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import React, { useState, useEffect, useRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoCall } from "@/hooks/useVideoCall";
import { VideoCallOverlay } from './VideoCallOverlay';
import { IncomingCallDialog } from './IncomingCallDialog';
import { useLanguage } from '@/contexts/LanguageContext';

// Import newly refactored sub-components
import { ChatThreadHeader } from "./ChatThreadHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputArea } from "./ChatInputArea";

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
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const quickMessagesList = [
    "Here are the check-in instructions. Please let me know if you have any questions.",
    "The WiFi network is 'HoroHouse_Guest' and the password is 'Welcome2026!'.",
    "What time are you expecting to arrive?",
    "Thank you! We hope you have a great stay.",
    "Yes, late checkout is available upon request."
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { apiClient } = require('@/lib/api'); // Wait, imported? No let's import at top. Actually `import { apiClient } from '@/lib/api';` at top is cleaner.

  const currentUserId = (user?.id || user?._id || '').toString();

  const otherUser = activeConversation?.otherUser ||
    activeConversation?.participants.find(
      (p: any) => p.userId._id.toString() !== currentUserId
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
    onIncomingCall: (data: any) => {
      console.log('📞 Incoming call data in ChatThread:', data);
      setIncomingCallData(data);
    },
  });

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeConversation && messages.length > 0 && currentUserId) {
      const unreadMessages = messages
        .filter(msg => {
          const senderId = typeof msg.senderId === 'object'
            ? msg.senderId._id?.toString()
            : (msg.senderId as any)?.toString();
          return senderId !== currentUserId && msg.status !== 'read';
        })
        .map(msg => msg._id)
        .filter(id => id && !id.startsWith('temp_'));

      if (unreadMessages.length > 0) {
        markAsRead(activeConversation._id, unreadMessages);
      }
    }
  }, [messages, activeConversation, currentUserId, markAsRead]);

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

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || !activeConversation || isUploading) return;

    if (selectedFiles.length > 0) {
      try {
        setIsUploading(true);
        // Use API client for attachment posts
        const { apiClient } = require('@/lib/api');
        await apiClient.sendMessageWithAttachments(
          {
            conversationId: activeConversation._id,
            content: inputValue.trim() || undefined,
            propertyId: activeConversation.propertyId?._id
          },
          selectedFiles
        );
        // Let the realtime socket pick up the returned message, or manually trigger refresh
      } catch (e) {
        console.error("Error uploading attachments", e);
        alert("Failed to send files.");
      } finally {
        setIsUploading(false);
        setSelectedFiles([]);
        setInputValue("");
        setShowQuickMessages(false);
      }
    } else {
      sendMessage(activeConversation._id, inputValue.trim());
      setInputValue("");
      setShowQuickMessages(false);
    }

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
            className="h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[15px] transition-colors"
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
      {/* Video Call Componentry */}
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

      {/* Header */}
      <ChatThreadHeader 
        otherUser={otherUser}
        activeConversation={activeConversation}
        isOtherUserOnline={isOtherUserOnline}
        callStatus={callStatus}
        onBack={onBack}
        onStartVideoCall={handleStartVideoCall}
      />

      {/* Connection Warning */}
      {!isConnected && (
        <div className="px-6 py-2.5 bg-[#FFF7ED] border-b border-[#C2410C]/20 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#C2410C] rounded-full animate-pulse" />
          <span className="text-[13px] font-medium text-[#C2410C]">{s.reconnectingMsg || 'Reconnecting to chat server...'}</span>
        </div>
      )}

      {/* Message List */}
      <ChatMessageList 
        messages={messages}
        currentUserId={currentUserId}
        otherUser={otherUser}
        isOtherUserTyping={isOtherUserTyping}
        messagesEndRef={messagesEndRef}
      />

      {/* Input Area */}
      <ChatInputArea 
        inputValue={inputValue}
        setInputValue={setInputValue}
        isRecording={isRecording}
        isConnected={isConnected}
        showQuickMessages={showQuickMessages}
        setShowQuickMessages={setShowQuickMessages}
        handleInputChange={handleInputChange}
        handleKeyPress={handleKeyPress}
        handleSendMessage={handleSendMessage}
        startRecording={startRecording}
        stopRecording={stopRecording}
        sendVoiceMessage={sendVoiceMessage}
        audioBlob={audioBlob}
        recordingTime={recordingTime}
        quickMessagesList={quickMessagesList}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        isUploading={isUploading}
      />
    </div>
  );
}