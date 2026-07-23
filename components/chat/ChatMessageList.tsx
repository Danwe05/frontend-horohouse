import React from "react";
import { Check, CheckCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageListProps {
  messages: any[];
  currentUserId: string;
  otherUser: any;
  isOtherUserTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const formatDateSeparator = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

export function ChatMessageList({
  messages,
  currentUserId,
  otherUser,
  isOtherUserTyping,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="bg-[#F7F7F7] border border-[#EBEBEB] rounded-2xl p-8 w-full shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="w-16 h-16 bg-white border border-[#EBEBEB] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MessageCircle className="w-8 h-8 text-[#DDDDDD] stroke-[1.5]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#222222] mb-2">No messages yet</h3>
            <p className="text-[15px] text-[#717171]">
              Send a message to {otherUser?.name} to start the conversation.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const isNewDay = !previousMessage ||
              new Date(message.createdAt).toDateString() !== new Date(previousMessage.createdAt).toDateString();

            const senderId = typeof message.senderId === 'object'
              ? message.senderId._id?.toString()
              : (message.senderId as any)?.toString();

            const isOwn = !!senderId && !!currentUserId && senderId === currentUserId;

            const isVoiceMessage = message.type === 'audio' ||
              (message.content && message.content.startsWith('VOICE_MESSAGE:'));

            const isOptimistic = !!message._id && message._id.startsWith('temp_');

            return (
              <React.Fragment key={`${message._id}-${index}`}>
                {isNewDay && (
                  <div className="flex justify-center mt-8 mb-6">
                    <span className="text-[12px] font-semibold text-[#717171]">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}
                <div
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
                          ? "bg-[#222222] text-white rounded-2xl rounded-br-sm"
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
              </React.Fragment>
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
  );
}
