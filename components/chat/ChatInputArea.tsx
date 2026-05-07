import React from "react";
import { Mic, Paperclip, Send, Smile, Zap } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  isRecording: boolean;
  isConnected: boolean;
  showQuickMessages: boolean;
  setShowQuickMessages: (val: boolean) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendVoiceMessage: () => void;
  audioBlob: Blob | null;
  recordingTime: number;
  quickMessagesList: string[];
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  isUploading: boolean;
}

export function ChatInputArea({
  inputValue,
  setInputValue,
  isRecording,
  isConnected,
  showQuickMessages,
  setShowQuickMessages,
  handleInputChange,
  handleKeyPress,
  handleSendMessage,
  startRecording,
  stopRecording,
  sendVoiceMessage,
  audioBlob,
  recordingTime,
  quickMessagesList,
  selectedFiles,
  setSelectedFiles,
  isUploading,
}: ChatInputAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
    // clear input so same file can be selected again
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  return (
    <div className="px-6 py-4 bg-white border-t border-[#EBEBEB] shrink-0">
      {/* File Preview Area */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="relative flex items-center justify-center w-16 h-16 rounded-lg border border-[#EBEBEB] bg-[#F7F7F7] shrink-0 group">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-[10px] font-semibold text-[#717171] uppercase">{file.name.split('.').pop()}</div>
              )}
              <button 
                className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(idx)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />
        
        <div className="relative flex items-center shrink-0">
          <button 
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors focus:outline-none",
              showQuickMessages ? "text-[#222222] bg-[#F7F7F7]" : "text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]"
            )}
            onClick={() => setShowQuickMessages(!showQuickMessages)}
            title="Quick replies"
          >
            <Zap className="w-5 h-5 stroke-[2]" />
          </button>

          {showQuickMessages && (
            <div className="absolute bottom-14 left-0 w-72 bg-white border border-[#EBEBEB] rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.12)] overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#EBEBEB] bg-[#F7F7F7]">
                <h4 className="text-[14px] font-bold text-[#222222]">Quick replies</h4>
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                {quickMessagesList.map((msg, idx) => (
                  <button 
                    key={idx}
                    className="w-full text-left px-4 py-3.5 text-[14px] text-[#222222] hover:bg-[#F7F7F7] border-b border-[#EBEBEB] last:border-0 transition-colors focus:outline-none"
                    onClick={() => {
                      setInputValue(msg);
                      setShowQuickMessages(false);
                    }}
                  >
                    <span className="line-clamp-2 leading-relaxed">{msg}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] transition-colors focus:outline-none"
          onClick={() => fileInputRef.current?.click()}
        >
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
          {audioBlob ? (
            <div className="flex items-center gap-3 bg-[#F7F7F7] border border-[#EBEBEB] rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-[#C2293F] animate-pulse" />
              <span className="text-[14px] font-medium text-[#222222]">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[13px] text-[#717171] ml-2">Voice message ready to send</span>
            </div>
          ) : (
            <>
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={!isConnected}
                placeholder={isConnected ? "Message..." : "Reconnecting..."}
                className="w-full bg-[#F7F7F7] border-[#EBEBEB] focus:border-[#222222] rounded-full pl-4 pr-10 py-[18px] text-[15px] transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:text-[#222222] transition-colors">
                <Smile className="w-5 h-5 stroke-[2]" />
              </button>
            </>
          )}
        </div>

        {audioBlob ? (
          <button
            className="w-12 h-12 rounded-full bg-[#222222] hover:bg-black text-white shrink-0 flex items-center justify-center transition-transform active:scale-95 focus:outline-none"
            onClick={sendVoiceMessage}
            disabled={isUploading}
          >
            <Send className="w-5 h-5 stroke-[2] ml-0.5" />
          </button>
        ) : (
          <button
            className={cn(
              "w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-transform focus:outline-none",
              (inputValue.trim() || selectedFiles.length > 0) && isConnected && !isUploading
                ? "bg-[#222222] hover:bg-black text-white active:scale-95" 
                : "bg-[#F7F7F7] text-[#DDDDDD] cursor-not-allowed"
            )}
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && selectedFiles.length === 0) || !isConnected || isUploading}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin ml-0.5" />
            ) : (
              <Send className="w-5 h-5 stroke-[2] ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
