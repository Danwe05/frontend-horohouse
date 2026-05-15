"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, PenLine, ThumbsUp, MessageSquare, Eye, ChevronRight,
  Star, Home, Coffee, Compass, BookOpen, TrendingUp,
  Bell, Users, Award, Pin, MoreHorizontal, ArrowUp,
  Flame, Clock, HelpCircle,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ─── Static data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "popular", label: "Most Popular", icon: Flame },
  { id: "homes",   label: "Homes",        icon: Home },
  { id: "cafe",    label: "Community Café", icon: Coffee },
  { id: "explore", label: "Explore",      icon: Compass },
  { id: "resources", label: "Resources",  icon: BookOpen },
  { id: "updates", label: "Airbnb Updates", icon: Bell },
];

const MEMBERS = [
  { name: "Amara Diallo",   role: "Top Contributor", years: 4, reviews: 128, avatar: "", initials: "AD", badge: "🏆" },
  { name: "Kwame Asante",   role: "Superhost",        years: 2, reviews: 91,  avatar: "", initials: "KA", badge: "⭐" },
  { name: "Fatou Ndiaye",   role: "Host",             years: 1, reviews: 43,  avatar: "", initials: "FN", badge: "" },
];

import { POSTS } from "./data";

const QUICK_LINKS = [
  { label: "Help Center", href: "/support" },
  { label: "Host Resources", href: "/about" },
  { label: "Report an issue", href: "/support" },
  { label: "Community guidelines", href: "/terms" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PostCard({ post }: { post: typeof POSTS[number] }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const toggleLike = () => {
    setLiked((p) => !p);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div className="py-6 border-b border-[#EBEBEB] last:border-b-0">
      {/* Top row */}
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          {post.author.avatar && <img src={post.author.avatar} alt={post.author.name} />}
          <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
            {post.author.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Author + meta */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
            <span className="text-[15px] font-semibold text-[#222222]">{post.author.name}</span>
            <span className="text-[14px] text-[#717171] hidden sm:inline">·</span>
            <span className="text-[14px] text-[#717171]">{post.author.role}</span>
            <span className="text-[14px] text-[#717171] hidden sm:inline">·</span>
            <span className="text-[14px] text-[#717171]">{post.time}</span>
            {post.pinned && (
              <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[#FF385C] font-semibold uppercase tracking-wide">
                <Pin className="w-3.5 h-3.5 fill-[#FF385C]" /> Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/community/${post.slug}`}>
            <h3 className="text-[18px] font-semibold text-[#222222] leading-snug mb-2 hover:underline cursor-pointer">
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-[15px] text-[#717171] leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white border border-[#DDDDDD] text-[13px] font-medium text-[#222222] cursor-pointer hover:border-[#222222] transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 text-[14px] font-medium text-[#222222] underline-offset-2">
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-2 hover:opacity-70 transition-opacity",
                liked && "text-[#FF385C]"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4 stroke-[2]", liked && "fill-[#FF385C]")} />
              {likeCount.toLocaleString()}
            </button>
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <MessageCircle className="w-4 h-4 stroke-[2]" />
              {post.replies.toLocaleString()}
            </button>
            <span className="flex items-center gap-2 text-[#717171] font-normal">
              <Eye className="w-4 h-4 stroke-[2]" />
              {post.views.toLocaleString()}
            </span>
            <button className="ml-auto hover:bg-[#F7F7F7] p-2 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-[#222222]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "top",        label: "Top discussions",  icon: TrendingUp },
  { id: "recent",     label: "Recent",           icon: Clock },
  { id: "unanswered", label: "Unanswered",       icon: HelpCircle },
];

export default function CommunityPage() {
  const [search, setSearch]       = useState("");
  const [activeCategory, setActiveCategory] = useState("popular");
  const [activeTab, setActiveTab] = useState("top");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody]   = useState("");

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCategory === "popular" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (activeTab === "top") return b.likes - a.likes;
    if (activeTab === "recent") return a.time.localeCompare(b.time);
    return a.replies - b.replies;
  });

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="bg-[#F7F7F7] border-b border-[#EBEBEB] pt-20 pb-16 px-6 mt-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-[32px] md:text-[44px] font-bold tracking-tight leading-tight text-[#222222] mb-4">
            Welcome to the Host Community
          </h1>
          <p className="text-[18px] text-[#717171] mb-10 max-w-2xl mx-auto">
            Connect with hosts locally and globally. Ask questions, share advice, and get the latest updates.
          </p>

          {/* Airbnb-style Search Pill */}
          <div className="mx-auto flex items-center bg-white rounded-full border border-[#DDDDDD] shadow-[0_3px_12px_rgb(0,0,0,0.08)] hover:shadow-[0_3px_12px_rgb(0,0,0,0.12)] transition-shadow p-2 w-full max-w-2xl">
            <div className="flex-1 px-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discussions, topics, or keywords"
                className="w-full text-[15px] font-medium text-[#222222] placeholder:text-[#717171] bg-transparent focus:outline-none"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 transition-colors p-3.5 rounded-full text-white flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <nav className="space-y-1" aria-label="Community categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition-colors text-left",
                    activeCategory === cat.id
                      ? "bg-[#F7F7F7] text-[#222222] font-semibold"
                      : "text-[#717171] font-medium hover:bg-[#F7F7F7] hover:text-[#222222]"
                  )}
                >
                  <cat.icon className={cn("w-5 h-5 stroke-[2]", activeCategory === cat.id ? "text-[#222222]" : "text-[#717171]")} />
                  {cat.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-[#EBEBEB] space-y-2">
              <p className="text-[14px] font-semibold text-[#222222] mb-4 px-4">Helpful links</p>
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[15px] text-[#717171] font-medium hover:text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 ml-auto text-[#B0B0B0]" />
                </a>
              ))}
            </div>
          </aside>

          {/* ── Main feed ──────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* New post CTA */}
            {!showNewPost ? (
              <button
                onClick={() => setShowNewPost(true)}
                className="w-full mb-8 flex items-center gap-4 px-6 py-4 rounded-2xl border border-[#DDDDDD] bg-white hover:border-[#222222] transition-colors text-[#717171] text-[15px] font-medium shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-[#222222]" />
                </div>
                <span>Share a tip, ask a question, or start a discussion...</span>
                <span className="ml-auto px-5 py-2.5 rounded-lg bg-[#222222] hover:bg-[#000000] text-white text-[14px] font-semibold transition-colors">
                  Create post
                </span>
              </button>
            ) : (
              <div className="mb-8 rounded-2xl border-2 border-[#222222] bg-white overflow-hidden shadow-sm">
                <div className="px-6 pt-6 space-y-4">
                  <input
                    autoFocus
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Give your post a title..."
                    className="w-full text-[20px] font-semibold text-[#222222] placeholder:text-[#B0B0B0] focus:outline-none"
                  />
                  <textarea
                    value={newPostBody}
                    onChange={(e) => setNewPostBody(e.target.value)}
                    placeholder="What's on your mind? Share details here..."
                    rows={5}
                    className="w-full resize-none text-[16px] text-[#222222] placeholder:text-[#717171] focus:outline-none leading-relaxed"
                  />
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#EBEBEB] bg-white">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="text-[15px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!newPostTitle.trim()}
                    className="px-6 py-3 rounded-lg bg-[#E61E4D] hover:bg-[#D90B26] text-white text-[15px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Publish
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-6 border-b border-[#EBEBEB]">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 pb-4 text-[15px] font-semibold border-b-2 transition-colors -mb-px",
                    activeTab === tab.id
                      ? "border-[#222222] text-[#222222]"
                      : "border-transparent text-[#717171] hover:border-[#DDDDDD] hover:text-[#222222]"
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <span className="ml-auto text-[14px] font-medium text-[#717171] pb-4">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </span>
            </div>

            {/* Post list */}
            {filtered.length === 0 ? (
              <div className="py-24 text-center text-[#717171]">
                <Search className="w-12 h-12 mx-auto mb-4 stroke-[1.5] text-[#DDDDDD]" />
                <p className="text-[18px] font-semibold text-[#222222]">No discussions found</p>
                <p className="text-[15px] mt-2 max-w-sm mx-auto">Try adjusting your search or be the first to start a topic in this category.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>

          {/* ── Right column ───────────────────────────────────────────── */}
          <aside className="hidden xl:block w-[280px] shrink-0 space-y-8 lg:sticky lg:top-28">

            {/* Stats strip */}
            <div>
              <h3 className="text-[16px] font-semibold text-[#222222] mb-4">About this community</h3>
              <div className="space-y-4">
                {[
                  { label: "Members worldwide", value: "12,400+", icon: Users },
                  { label: "Discussions this week", value: "318",     icon: MessageCircle},
                  { label: "Top contributors", value: "42",   icon: Award },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-[#DDDDDD] bg-white flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#222222] stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#222222] leading-none">{value}</p>
                      <p className="text-[13px] text-[#717171] mt-1">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top contributors */}
            <div className="pt-8 border-t border-[#EBEBEB]">
              <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Top contributors</h3>
              <div className="space-y-5">
                {MEMBERS.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-[#222222] text-white text-[13px] font-semibold">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#222222] truncate">
                        {m.name} {m.badge}
                      </p>
                      <p className="text-[13px] text-[#717171] truncate">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full text-left text-[15px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] transition-colors">
                Show all
              </button>
            </div>

            {/* Back to top */}
            <div className="pt-8 border-t border-[#EBEBEB]">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#222222] text-[15px] font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors"
              >
                Back to top
              </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}