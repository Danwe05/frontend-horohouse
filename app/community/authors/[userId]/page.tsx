"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin, Calendar, Star, ThumbsUp, MessageCircle, Eye,
  BadgeCheck, ChevronRight, Globe, Briefcase, Clock,
  ArrowLeft, Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommunityUser {
  name: string;
  profilePicture?: string;
  role: string;
  bio?: string;
  city?: string;
  country?: string;
  languages?: string[];
  createdAt: string;
  hostProfile?: {
    isSuperhost: boolean;
    responseRate?: number;
    operatingCity?: string;
    hostBio?: string;
    hostLanguages?: string[];
  };
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  tags: string[];
  likes: number;
  replyCount: number;
  views: number;
  createdAt: string;
}

interface AuthorProfileData {
  user: CommunityUser;
  communityStats: { totalPosts: number; totalLikes: number };
}

const PROFILE_TABS = [
  { id: "posts", label: "Discussions" },
  { id: "about", label: "About" },
];

// ─── Mini post row ────────────────────────────────────────────────────────────

function MiniPostRow({ post }: { post: Post }) {
  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };
  return (
    <Link href={`/community/${post.slug}`} className="group block">
      <div className="flex items-start gap-4 py-5 border-b border-[#EBEBEB] last:border-b-0">
        <div className="flex-1 min-w-0">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] text-[11px] font-medium text-[#717171]">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-[15px] font-semibold text-[#222222] leading-snug group-hover:underline line-clamp-2 mb-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-[13px] text-[#717171] line-clamp-1 mb-3">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-[12px] text-[#717171]">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 stroke-[2]" />{post.likes.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 stroke-[2]" />{post.replyCount.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 stroke-[2]" />{post.views.toLocaleString()}</span>
            <span className="ml-auto">{relativeTime(post.createdAt)}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#B0B0B0] shrink-0 mt-1" />
      </div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommunityAuthorPage() {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState("posts");

  const [profile,     setProfile]     = useState<AuthorProfileData | null>(null);
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      apiClient.getCommunityAuthorProfile(userId),
      apiClient.getCommunityAuthorPosts(userId, { limit: 30, sortOrder: "desc" }),
    ])
      .then(([profileData, postsData]) => {
        setProfile(profileData);
        setAuthorPosts(postsData.data ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#DDDDDD]" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6 pt-20">
        <div>
          <p className="text-[22px] font-semibold text-[#222222] mb-2">Profile not found</p>
          <p className="text-[#717171] mb-6">This author's profile doesn't exist or was removed.</p>
          <Link href="/community" className="text-blue-600 underline font-medium">Back to community</Link>
        </div>
      </div>
    );
  }

  const { user, communityStats } = profile;
  const isSuperhost = user.hostProfile?.isSuperhost ?? false;
  const languages   = user.hostProfile?.hostLanguages ?? user.languages ?? [];
  const location    = user.hostProfile?.operatingCity ?? user.city ?? user.country;
  const bio         = user.hostProfile?.hostBio ?? user.bio;
  const responseRate = user.hostProfile?.responseRate;

  const initials = user.name.trim().split(" ")
    .map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const joinedYear = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const statCols = [
    { value: communityStats.totalPosts.toLocaleString(),  label: "Posts" },
    { value: communityStats.totalLikes.toLocaleString(),  label: "Kudos received" },
    ...(isSuperhost ? [{ value: "Superhost", label: "Status" }] : []),
    ...(responseRate != null ? [{ value: `${responseRate}%`, label: "Response rate" }] : []),
  ];

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans">

      {/* ── Breadcrumb bar ───────────────────────────────────────────────── */}
      <div className="border-b border-[#EBEBEB] bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/community" className="flex items-center gap-1.5 text-[14px] font-medium text-[#717171] hover:text-[#222222] transition-colors">
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            Community
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B0B0B0]" />
          <span className="text-[14px] font-medium text-[#222222] truncate">{user.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Profile header ───────────────────────────────────────────── */}
        <div className="mb-10">
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                {user.profilePicture && <AvatarImage src={user.profilePicture} alt={user.name} />}
                <AvatarFallback className="bg-[#222222] text-white text-[28px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-[28px] font-bold tracking-tight text-[#222222]">{user.name}</h1>
                {isSuperhost && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222222] text-white text-[12px] font-semibold">
                    <Star className="w-3 h-3 fill-white" /> Superhost
                  </span>
                )}
              </div>
              <p className="text-[16px] text-[#717171] font-medium mb-3 capitalize">{user.role.replace("_", " ")}</p>

              <div className="flex flex-wrap gap-4 text-[14px] text-[#717171]">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 stroke-[2]" /> {location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 stroke-[2]" /> Member since {joinedYear}
                </span>
                {languages.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 stroke-[2]" /> {languages.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          {statCols.length > 0 && (
            <div className={cn("grid gap-px bg-[#EBEBEB] rounded-2xl overflow-hidden border border-[#EBEBEB]",
              `grid-cols-${Math.min(statCols.length, 4)}`)}>
              {statCols.map(({ value, label }) => (
                <div key={label} className="bg-white px-5 py-5 text-center">
                  <p className="text-[22px] font-bold text-[#222222] leading-none mb-1">{value}</p>
                  <p className="text-[12px] text-[#717171] leading-snug">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 border-b border-[#EBEBEB] mb-8">
          {PROFILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 text-[15px] font-semibold border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-[#222222] text-[#222222]"
                  : "border-transparent text-[#717171] hover:text-[#222222]"
              )}
            >
              {tab.label}
              {tab.id === "posts" && (
                <span className="ml-2 text-[12px] font-medium text-[#717171]">({communityStats.totalPosts})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        {activeTab === "posts" && (
          <div>
            {authorPosts.length === 0 ? (
              <div className="py-20 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#DDDDDD] stroke-[1.5]" />
                <p className="text-[17px] font-semibold text-[#222222]">No discussions yet</p>
                <p className="text-[14px] text-[#717171] mt-1">{user.name} hasn't posted yet.</p>
              </div>
            ) : (
              <div>
                {authorPosts.map((p: Post) => <MiniPostRow key={p.id} post={p} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-2xl space-y-8">
            {bio && (
              <div>
                <h2 className="text-[18px] font-semibold text-[#222222] mb-3">About {user.name.split(" ")[0]}</h2>
                <p className="text-[16px] text-[#717171] leading-relaxed">{bio}</p>
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-[#EBEBEB]">
              <h2 className="text-[18px] font-semibold text-[#222222] mb-5">Details</h2>
              {[
                { icon: MapPin,    label: "Location",      value: location },
                { icon: Globe,     label: "Languages",     value: languages.length > 0 ? languages.join(", ") : undefined },
                { icon: Clock,     label: "Member since",  value: joinedYear },
                { icon: Star,      label: "Response rate", value: responseRate != null ? `${responseRate}%` : undefined },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-3 text-[15px]">
                  <Icon className="w-5 h-5 text-[#717171] stroke-[1.5] shrink-0" />
                  <span className="text-[#717171]">{label}:</span>
                  <span className="font-medium text-[#222222]">{value}</span>
                </div>
              ) : null)}
            </div>

            <div className="pt-6 border-t border-[#EBEBEB]">
              <p className="text-[13px] text-[#717171] leading-relaxed flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                To help protect your payment and communications, always use HoroHouse to send money and contact hosts.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
