import React, { useState } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConversationProps {
  participantName: string;
  participantAvatar: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const Conversation = ({ participantName, participantAvatar }: ConversationProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey! I'm interested in the property you listed",
      sender: 'them',
      time: '10:30 AM'
    },
    {
      id: 2,
      text: "Hello! Thanks for your interest. Which property are you referring to?",
      sender: 'me',
      time: '10:32 AM'
    },
    {
      id: 3,
      text: "The 3-bedroom apartment in downtown",
      sender: 'them',
      time: '10:33 AM'
    },
  ]);
  
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <img
            src={participantAvatar}
            alt={participantName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{participantName}</h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'me'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
            <Smile className="w-5 h-5" />
          </Button>
          
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-gray-200 focus:border-blue-500"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;