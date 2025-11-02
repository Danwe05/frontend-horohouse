import { useState } from "react";

type Message = {
  id: number;
  name: string;
  username: string;
  message: string;
  time: string;
  date: string;
  unread: number;
  avatar: string;
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
    name: "David",
    username: "David_224",
    message: "Check the photos i sent to you",
    time: "22:20",
    date: "09/05",
    unread: 3,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Xabi",
    username: "Xabi_203",
    message: "Great, thank so much!",
    time: "22:20",
    date: "09/05",
    unread: 7,
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    id: 3,
    name: "Edward Davison",
    username: "Edward",
    message: "Nice one!",
    time: "22:20",
    date: "09/05",
    unread: 0,
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    id: 4,
    name: "Iren Michels",
    username: "Iren",
    message: "More of that.",
    time: "22:20",
    date: "09/05",
    unread: 1,
    avatar: "https://randomuser.me/api/portraits/women/60.jpg",
  },
  {
    id: 5,
    name: "Iren Michels",
    username: "Iren",
    message: "More of that.",
    time: "22:20",
    date: "09/05",
    unread: 1,
    avatar: "https://randomuser.me/api/portraits/women/60.jpg",
  },
  {
    id: 6,
    name: "Xabi",
    username: "Xabi_203",
    message: "Great, thank so much!",
    time: "22:20",
    date: "09/05",
    unread: 7,
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
  },
];

export default function MessageList({ onSelectConversation }: MessageListProps) {
  const [messages] = useState<Message[]>(initialMessages);

  return (
    <div className="max-w-sm mx-full">
      {/* Title */}
      <div className="mb-6 mt-10">
        <h1 className="text-2xl md:text-2xl font-bold text-blue-600">
          Message
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mt-4 mb-4">
        <div className="relative w-[383px] max-w-sm">
          <input
            type="text"
            placeholder="Search"
            className="w-full border border-gray-300 rounded-md py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
      </div>

      {/* Messages List */}
      <div className="border rounded-lg shadow bg-white">
        <ul>
          {messages.map((msg) => (
            <li
              key={msg.id}
              onClick={() =>
                onSelectConversation({
                  id: msg.id,
                  name: msg.name,
                  avatar: msg.avatar,
                })
              }
              className="flex items-center justify-between p-3 border-b hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={msg.avatar}
                  alt={msg.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-800">{msg.username}</p>
                  <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {msg.time} {msg.date}
                </p>
                {msg.unread > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                    {msg.unread}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
