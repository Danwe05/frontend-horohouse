import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Message = {
  id: number;
  name: string;
  username: string;
  message: string;
  time: string;
  date: string;
  unread: number;
  avatar: string;
  online?: boolean;
  lastSeen?: string;
};

interface ConversationItem {
  id: number;
  name: string;
  avatar: string;
}

interface MessageListProps {
  onSelectConversation: (conversation: ConversationItem) => void;
}

const initialMessages: Message[] = [
  {
    id: 1,
    name: "David Wilson",
    username: "David_224",
    message: "Check the photos I sent to you",
    time: "22:20",
    date: "09/05",
    unread: 3,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    online: true,
  },
  {
    id: 2,
    name: "Xabi Alonso",
    username: "Xabi_203",
    message: "Great, thank you so much!",
    time: "22:20",
    date: "09/05",
    unread: 7,
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    online: false,
    lastSeen: "2h ago"
  },
  {
    id: 3,
    name: "Edward Davison",
    username: "Edward",
    message: "Nice one! The property looks amazing",
    time: "22:20",
    date: "09/05",
    unread: 0,
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    online: true,
  },
  {
    id: 4,
    name: "Iren Michels",
    username: "Iren",
    message: "More of that. When can we schedule a visit?",
    time: "22:20",
    date: "09/05",
    unread: 1,
    avatar: "https://randomuser.me/api/portraits/women/60.jpg",
    online: false,
    lastSeen: "1d ago"
  },
];

export default function MessageList({ onSelectConversation }: MessageListProps) {
  const [messages] = useState<Message[]>(initialMessages);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredMessages.length} conversations
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>No conversations found</p>
            <p className="text-sm">Try adjusting your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() =>
                  onSelectConversation({
                    id: msg.id,
                    name: msg.name,
                    avatar: msg.avatar,
                  })
                }
                className="flex items-center gap-4 p-4 hover:bg-blue-50/50 cursor-pointer transition-colors group"
              >
                {/* Avatar with Online Indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={msg.avatar}
                    alt={msg.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {msg.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {msg.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {msg.time}
                      </span>
                      {msg.unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 text-xs font-semibold text-white bg-blue-500 rounded-full px-1">
                          {msg.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                      {msg.message}
                    </p>
                    {!msg.online && msg.lastSeen && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {msg.lastSeen}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}