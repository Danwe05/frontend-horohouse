import React, { useState, useEffect } from "react";
import { Phone, Mail, Star, MapPin, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Skeleton = ({ className }: any) => (
  <div className={`bg-gray-200 animate-pulse rounded-md ${className}`} />
);

const CircularProgress = ({ completion, size, color }: any) => {
  const circumference = 2 * Math.PI * (size / 2);
  const offset = circumference - (completion / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

const CardSkeleton = () => (
  <div className="w-full bg-white rounded-xl p-6 flex flex-col items-center gap-4 border border-gray-200 shadow-md">
    <Skeleton className="w-20 h-20 rounded-full" />
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-4 w-24" />
    <div className="w-full space-y-3 pt-2 border-t border-gray-200">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-2 w-full" />
    </div>
    <div className="flex gap-3 w-full pt-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 flex-1" />
    </div>
  </div>
);

interface AgentCardProps {
  name: string;
  username: string;
  role: string;
  tasks: number;
  completion: number;
  imageUrl: string;
  age: number;
  gender: string;
  city: string;
  state: string;
  country: string;
  rent: number;
}

const AgentCard = ({
  name,
  username,
  role,
  tasks,
  completion,
  imageUrl,
  age,
  gender,
  city,
  state,
  country,
  rent
}: AgentCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const rentNumber = Math.max(0, Math.min(5, Number(rent) || 0));

  return (
    <>
      <div className="w-full">
        {/* Card principale */}
        <div
          onClick={() => setIsOpen(true)}
          className="bg-white rounded-xl p-6 flex flex-col items-center gap-4 cursor-pointer border border-gray-200 shadow-md hover:shadow-lg hover:border-blue-400 transition-all duration-200"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-20"></div>
            <img
              src={imageUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-3 border-blue-500 relative z-10"
            />
          </div>

          <div className="text-center w-full">
            <h3 className="font-bold text-lg text-black mb-1">{name}</h3>
            <p className="text-sm text-blue-600 font-semibold">{role}</p>
            <p className="text-xs text-gray-500">@{username}</p>
          </div>

          {/* Stats Section */}
          <div className="w-full space-y-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Users size={16} className="text-white" />
                </div>
                <span className="text-sm text-black font-medium">{tasks} Active Tasks</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-blue-600 w-10 text-right">{completion}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full pt-2">
            <button className="flex items-center justify-center flex-1 bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 transition-colors font-semibold text-sm gap-2 shadow-sm">
              <Phone size={16} />
              Call
            </button>
            <button className="flex items-center justify-center flex-1 bg-black text-white rounded-lg py-2.5 hover:bg-gray-800 transition-colors font-semibold text-sm gap-2 shadow-sm">
              <Mail size={16} />
              Message
            </button>
          </div>
        </div>
      </div>

      {/* Modal using shadcn */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm bg-white border border-gray-300 rounded-2xl p-0">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-center sr-only">Agent Details</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 text-center px-8 pb-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-25"></div>
              <img
                src={imageUrl}
                alt={name}
                className="h-28 w-28 rounded-full object-cover border-4 border-blue-500 relative z-10"
              />
            </div>

            {/* Name and Role */}
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">{name}</h2>
              <p className="text-sm text-blue-600 font-semibold">{role}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-gray-100 px-4 py-3 rounded-lg">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={20}
                  className={index < rentNumber ? "fill-blue-500 text-blue-500" : "text-gray-300"}
                />
              ))}
            </div>

            <div className="w-full border-t border-gray-200 my-4"></div>

            {/* Details Grid */}
            <div className="w-full space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
                <div className="bg-blue-500 p-2.5 rounded-lg">
                  <Users size={18} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Age</p>
                  <p className="text-base font-bold text-black">{age} years</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
                <div className="bg-blue-500 p-2.5 rounded-lg">
                  <Users size={18} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Gender</p>
                  <p className="text-base font-bold text-black">{gender}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
                <div className="bg-blue-500 p-2.5 rounded-lg">
                  <MapPin size={18} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Location</p>
                  <p className="text-base font-bold text-black">{city}, {state}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
                <div className="bg-blue-500 p-2.5 rounded-lg">
                  <MapPin size={18} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Country</p>
                  <p className="text-base font-bold text-black">{country}</p>
                </div>
              </div>
            </div>

            <div className="w-full border-t border-gray-200 my-4"></div>

            {/* Contact Buttons */}
            <div className="w-full flex gap-3">
              <button className="flex-1 bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md">
                <Phone size={18} />
                Call
              </button>
              <button className="flex-1 bg-black text-white rounded-lg py-3 hover:bg-gray-800 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md">
                <Mail size={18} />
                Email
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const mockAgents = [
  {
    name: "Sarah Johnson",
    username: "sarahjohnson",
    role: "Senior Agent",
    tasks: 12,
    completion: 75,
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    age: 28,
    gender: "Female",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    rent: 4
  },
  {
    name: "Michael Chen",
    username: "mchen",
    role: "Agent",
    tasks: 8,
    completion: 60,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    age: 32,
    gender: "Male",
    city: "New York",
    state: "NY",
    country: "USA",
    rent: 5
  },
  {
    name: "Emma Rodriguez",
    username: "emrod",
    role: "Junior Agent",
    tasks: 15,
    completion: 85,
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    age: 25,
    gender: "Female",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    rent: 3
  },
  {
    name: "James Wilson",
    username: "jwilson",
    role: "Senior Agent",
    tasks: 10,
    completion: 92,
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    age: 35,
    gender: "Male",
    city: "Chicago",
    state: "IL",
    country: "USA",
    rent: 5
  },
  {
    name: "Lisa Anderson",
    username: "lisaand",
    role: "Agent",
    tasks: 9,
    completion: 70,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    age: 29,
    gender: "Female",
    city: "Boston",
    state: "MA",
    country: "USA",
    rent: 4
  },
  {
    name: "David Martinez",
    username: "dmartinez",
    role: "Junior Agent",
    tasks: 14,
    completion: 65,
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    age: 26,
    gender: "Male",
    city: "Miami",
    state: "FL",
    country: "USA",
    rent: 3
  },
  {
    name: "Sophie Taylor",
    username: "sophiat",
    role: "Senior Agent",
    tasks: 11,
    completion: 88,
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    age: 31,
    gender: "Female",
    city: "Seattle",
    state: "WA",
    country: "USA",
    rent: 5
  },
  {
    name: "Robert Lee",
    username: "rlee",
    role: "Agent",
    tasks: 7,
    completion: 55,
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    age: 27,
    gender: "Male",
    city: "Denver",
    state: "CO",
    country: "USA",
    rent: 3
  }
];

export default function AgentCardGrid() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">Our Agents</h1>
          <p className="text-gray-600 text-lg">Meet our dedicated team of professionals</p>
          <div className="h-1 w-20 bg-blue-600 mt-4 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            mockAgents.map((_, index) => <CardSkeleton key={index} />)
          ) : (
            mockAgents.map((agent, index) => (
              <AgentCard key={index} {...agent} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}