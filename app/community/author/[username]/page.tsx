"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin, Calendar, Star, ThumbsUp, MessageCircle, Eye,
  BadgeCheck, ChevronRight, Globe, Briefcase, Clock,
  MessageSquare, ArrowLeft, Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAuthorByUsername } from "../../data";
import { POSTS } from "../../data";

// ─── Tabs ────────────────────────────────────────────────────────────────────

const PROFILE_TABS = [
  { id: "posts",        label: "Discussions" },
  { id: "kudos",        label: "Kudos & badges" },
  { id: "about",        label: "About" },
];

// ─── Mini post row ────────────────────────────────────────────────────────────

function MiniPostRow({ post }: { post: typeof POSTS[number] }) {
  return (
    <Link href={`/community/${post.slug}`} className="group block">
      <div className="flex items-start gap-4 py-5 border-b border-[#EBEBEB] last:border-b-0">
        <div className="flex-1 min-w-0">
          {/* Tags */}
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
          <p className="text-[13px] text-[#717171] line-clamp-1 mb-3">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-[12px] text-[#717171]">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 stroke-[2]" />{post.likes.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 stroke-[2]" />{post.replies.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 stroke-[2]" />{post.views.toLocaleString()}</span>
            <span className="ml-auto">{post.time}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#B0B0B0] shrink-0 mt-1" />
      </div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuthorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState("posts");

  const author = useMemo(() => getAuthorByUsername(username), [username]);
  const authorPosts = useMemo(
    () => POSTS.filter((p: any) => p.author.name === author?.name),
    [author]
  );

  if (!author) {
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

  const statCols = [
    { value: author.totalReviews,             label: "Reviews" },
    { value: author.rating.toFixed(2),        label: "Rating" },
    { value: author.yearsHosting,             label: `Year${author.yearsHosting !== 1 ? "s" : ""} hosting` },
    { value: author.kudosReceived.toLocaleString(), label: "Kudos received" },
    { value: author.posts,                    label: "Posts" },
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
          <span className="text-[14px] font-medium text-[#222222] truncate">{author.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Profile header ───────────────────────────────────────────── */}
        <div className="mb-10">
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                <AvatarFallback className="bg-[#222222] text-white text-[28px] font-bold">
                  {author.initials}
                </AvatarFallback>
              </Avatar>
              {author.verified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-[28px] font-bold tracking-tight text-[#222222]">{author.name}</h1>
                {author.badge && <span className="text-[22px]">{author.badge}</span>}
                {author.superhost && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222222] text-white text-[12px] font-semibold">
                    <Star className="w-3 h-3 fill-white" /> Superhost
                  </span>
                )}
              </div>
              <p className="text-[16px] text-[#717171] font-medium mb-3">{author.role}</p>

              <div className="flex flex-wrap gap-4 text-[14px] text-[#717171]">
                {author.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 stroke-[2]" /> {author.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 stroke-[2]" /> Member since {author.joinedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 stroke-[2]" /> {author.languages.join(", ")}
                </span>
              </div>
            </div>

            {/* Message button */}
            <button className="shrink-0 px-6 py-3 rounded-xl bg-[#222222] hover:bg-black text-white text-[15px] font-semibold transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4 stroke-[2]" />
              Message
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#EBEBEB] rounded-2xl overflow-hidden border border-[#EBEBEB]">
            {statCols.map(({ value, label }) => (
              <div key={label} className="bg-white px-5 py-5 text-center">
                <p className="text-[22px] font-bold text-[#222222] leading-none mb-1">{value}</p>
                <p className="text-[12px] text-[#717171] leading-snug">{label}</p>
              </div>
            ))}
          </div>
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
                <span className="ml-2 text-[12px] font-medium text-[#717171]">({authorPosts.length})</span>
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
                <p className="text-[14px] text-[#717171] mt-1">{author.name} hasn't posted yet.</p>
              </div>
            ) : (
              <div>
                {authorPosts.map((p: any) => <MiniPostRow key={p.id} post={p} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === "kudos" && (
          <div className="space-y-6">
            {/* Kudos bar */}
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-[#F7F7F7] border border-[#EBEBEB]">
              <div className="w-14 h-14 rounded-full bg-white border border-[#DDDDDD] flex items-center justify-center shrink-0">
                <ThumbsUp className="w-6 h-6 text-[#222222] stroke-[2]" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-[#222222]">{author.kudosReceived.toLocaleString()}</p>
                <p className="text-[14px] text-[#717171]">Total kudos received from the community</p>
              </div>
            </div>

            {/* Achievements grid */}
            <div>
              <h2 className="text-[18px] font-semibold text-[#222222] mb-5">Achievements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {author.achievements.map(a => (
                  <div key={a.label} className="flex items-center gap-4 p-5 rounded-2xl border border-[#DDDDDD] bg-white hover:border-[#222222] hover:shadow-sm transition-all">
                    <div className="text-[32px] leading-none shrink-0">{a.icon}</div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#222222]">{a.label}</p>
                      <p className="text-[13px] text-[#717171] mt-0.5 leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-2xl space-y-8">
            {/* Bio */}
            <div>
              <h2 className="text-[18px] font-semibold text-[#222222] mb-3">About {author.name.split(" ")[0]}</h2>
              <p className="text-[16px] text-[#717171] leading-relaxed">{author.bio}</p>
            </div>

            {/* Details */}
            <div className="space-y-4 pt-6 border-t border-[#EBEBEB]">
              <h2 className="text-[18px] font-semibold text-[#222222] mb-5">Host details</h2>

              {[
                { icon: Briefcase, label: "My work", value: author.work },
                { icon: Clock,     label: "I spend too much time", value: author.spendTime },
                { icon: MapPin,    label: "Location", value: author.location },
                { icon: Globe,     label: "Languages", value: author.languages.join(", ") },
                { icon: Star,      label: "Response rate", value: `${author.responseRate}%` },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-3 text-[15px]">
                  <Icon className="w-5 h-5 text-[#717171] stroke-[1.5] shrink-0" />
                  <span className="text-[#717171]">{label}:</span>
                  <span className="font-medium text-[#222222]">{value}</span>
                </div>
              ) : null)}
            </div>

            {/* Safety note */}
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
