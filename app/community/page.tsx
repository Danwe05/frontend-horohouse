"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, PenLine, ThumbsUp, Eye, ChevronRight,
  Home, Coffee, Compass, BookOpen, TrendingUp,
  Bell, Users, Award, Pin, MoreHorizontal,
  Flame, Clock, HelpCircle, MessageCircle, Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Static UI data ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "popular",   label: "Most Popular",      icon: Flame },
  { id: "homes",     label: "Homes",              icon: Home },
  { id: "cafe",      label: "Community Café",     icon: Coffee },
  { id: "explore",   label: "Explore",            icon: Compass },
  { id: "resources", label: "Resources",          icon: BookOpen },
  { id: "updates",   label: "HoroHouse Updates",  icon: Bell },
];

const TABS = [
  { id: "top",        label: "Top discussions", sortBy: "likes",      sortOrder: "desc" as const },
  { id: "recent",     label: "Recent",          sortBy: "createdAt",  sortOrder: "desc" as const },
  { id: "unanswered", label: "Unanswered",      sortBy: "replyCount", sortOrder: "asc"  as const },
];

const QUICK_LINKS = [
  { label: "Help Center",          href: "/support" },
  { label: "Host Resources",       href: "/about" },
  { label: "Report an issue",      href: "/support" },
  { label: "Community guidelines", href: "/terms" },
];

const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  slug: string;
  category: string;
  pinned: boolean;
  title: string;
  excerpt?: string;
  tags: string[];
  likes: number;
  replyCount: number;
  views: number;
  authorSnapshot: { name: string; initials: string; role: string; avatar: string };
  createdAt: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="py-6 border-b border-[#EBEBEB] last:border-b-0 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-[#EBEBEB] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#EBEBEB] rounded w-1/4" />
          <div className="h-5 bg-[#EBEBEB] rounded w-3/4" />
          <div className="h-3 bg-[#EBEBEB] rounded w-full" />
          <div className="h-3 bg-[#EBEBEB] rounded w-5/6" />
          <div className="flex gap-3 mt-2">
            <div className="h-3 bg-[#EBEBEB] rounded w-12" />
            <div className="h-3 bg-[#EBEBEB] rounded w-12" />
            <div className="h-3 bg-[#EBEBEB] rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, onTagClick }: { post: Post; onTagClick: (tag: string) => void }) {
  const { user } = useAuth();
  const [liked,      setLiked]      = useState(false);
  const [likeCount,  setLikeCount]  = useState(post.likes);
  const [submitting, setSubmitting] = useState(false);

  const relTimeLabel = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const toggleLike = async () => {
    if (!user || submitting) return;
    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    setSubmitting(true);
    try {
      const res = await apiClient.toggleCommunityPostLike(post.id);
      setLiked(res.liked);
      setLikeCount(res.likes);
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : c - 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 border-b border-[#EBEBEB] last:border-b-0">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          {post.authorSnapshot.avatar && <AvatarImage src={post.authorSnapshot.avatar} alt={post.authorSnapshot.name} />}
          <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
            {post.authorSnapshot.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
            <span className="text-[15px] font-semibold text-[#222222]">{post.authorSnapshot.name}</span>
            <span className="text-[14px] text-[#717171] hidden sm:inline">·</span>
            <span className="text-[14px] text-[#717171]">{post.authorSnapshot.role}</span>
            <span className="text-[14px] text-[#717171] hidden sm:inline">·</span>
            <span className="text-[14px] text-[#717171]">{relTimeLabel(post.createdAt)}</span>
            {post.pinned && (
              <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[#FF385C] font-semibold uppercase tracking-wide">
                <Pin className="w-3.5 h-3.5 fill-[#FF385C]" /> Pinned
              </span>
            )}
          </div>

          <Link href={`/community/${post.slug}`}>
            <h3 className="text-[18px] font-semibold text-[#222222] leading-snug mb-2 hover:underline cursor-pointer">
              {post.title}
            </h3>
          </Link>

          {post.excerpt && (
            <p className="text-[15px] text-[#717171] leading-relaxed line-clamp-2 mb-4">
              {post.excerpt}
            </p>
          )}

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="px-3 py-1 rounded-full bg-white border border-[#DDDDDD] text-[13px] font-medium text-[#222222] hover:border-[#222222] transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 text-[14px] font-medium text-[#222222]">
            <button
              onClick={toggleLike}
              disabled={!user}
              title={user ? undefined : "Sign in to like"}
              className={cn(
                "flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-40",
                liked && "text-[#FF385C]"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4 stroke-[2]", liked && "fill-[#FF385C]")} />
              {likeCount.toLocaleString()}
            </button>
            <Link href={`/community/${post.slug}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <MessageCircle className="w-4 h-4 stroke-[2]" />
              {post.replyCount.toLocaleString()}
            </Link>
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

// ─── Inner component (requires useSearchParams — wrapped in Suspense below) ───

function CommunityFeed() {
  const { user } = useAuth();
  const router   = useRouter();
  const params   = useSearchParams();

  // ── Derive state from URL params ──────────────────────────────────────────
  const categoryParam = params.get("category") ?? "popular";
  const tagParam      = params.get("tag") ?? "";
  const tabParam      = params.get("tab") ?? "top";
  const searchParam   = params.get("search") ?? "";

  const [search,          setSearch]          = useState(searchParam);
  const [showNewPost,     setShowNewPost]      = useState(false);
  const [newPostTitle,    setNewPostTitle]     = useState("");
  const [newPostBody,     setNewPostBody]      = useState("");
  const [newPostCategory, setNewPostCategory]  = useState("homes");
  const [publishing,      setPublishing]       = useState(false);

  const [posts,      setPosts]      = useState<Post[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore] = useState(false);

  // Global stats for sidebar
  const [stats, setStats] = useState({ totalUsers: 12400, totalPosts: 0, topContributors: 42 });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    apiClient.getCommunityStats().then(s => setStats(s)).catch(() => {});
  }, []);

  // ── URL helpers ───────────────────────────────────────────────────────────

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "" || (k === "category" && v === "popular") || (k === "tab" && v === "top")) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    router.replace(`/community?${next.toString()}`, { scroll: false });
  }, [params, router]);

  const setCategory = (id: string) => updateUrl({ category: id, tag: null });
  const setTab      = (id: string) => updateUrl({ tab: id });
  const setTagFilter = (tag: string) => {
    updateUrl({ tag, category: null });
    setSearch("");
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const currentTab = TABS.find(t => t.id === tabParam) ?? TABS[0];

  const fetchPosts = useCallback(async (searchVal: string, pg: number, append = false) => {
    if (append) setLoadingMore(true);
    else        setLoading(true);

    try {
      const q: Record<string, any> = {
        page: pg, limit: PAGE_SIZE,
        sortBy: currentTab.sortBy,
        sortOrder: currentTab.sortOrder,
      };
      if (categoryParam !== "popular") q.category = categoryParam;
      if (tagParam.trim())   q.tag    = tagParam.trim();
      if (searchVal.trim())  q.search = searchVal.trim();

      const res = await apiClient.getCommunityPosts(q);
      const items: Post[] = res.data ?? [];
      setPosts(prev => append ? [...prev, ...items] : items);
      setTotal(res.meta.total);
      setHasMore(pg < res.meta.totalPages);
      setPage(pg);
    } catch {
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryParam, tagParam, currentTab]);

  // Trigger re-fetch when URL-driven params change (reset to page 1)
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(false);
    fetchPosts(searchParam, 1);
  }, [categoryParam, tagParam, tabParam, searchParam]);

  // Debounce local search box → update URL param
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== searchParam) updateUrl({ search: search || null });
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const handleLoadMore = () => fetchPosts(searchParam, page + 1, true);

  const handlePublish = async () => {
    if (!newPostTitle.trim() || publishing) return;
    setPublishing(true);
    try {
      await apiClient.createCommunityPost({
        category: newPostCategory as any,
        title:    newPostTitle.trim(),
        body:     newPostBody.trim() || undefined,
      });
      setShowNewPost(false);
      setNewPostTitle("");
      setNewPostBody("");
      fetchPosts(searchParam, 1);
    } catch {
      // TODO: toast
    } finally {
      setPublishing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#F7F7F7] border-b border-[#EBEBEB] pt-20 pb-16 px-6 mt-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-[32px] md:text-[44px] font-bold tracking-tight leading-tight text-[#222222] mb-4">
            Welcome to the Host Community
          </h1>
          <p className="text-[18px] text-[#717171] mb-10 max-w-2xl mx-auto">
            Connect with hosts locally and globally. Ask questions, share advice, and get the latest updates.
          </p>

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
            <button
              onClick={() => updateUrl({ search: search || null })}
              className="bg-blue-600 hover:bg-blue-700 transition-colors p-3.5 rounded-full text-white flex items-center justify-center shrink-0"
            >
              <Search className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Active tag badge */}
          {tagParam && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#222222] text-[14px] font-semibold text-[#222222]">
              Tag: {tagParam}
              <button onClick={() => updateUrl({ tag: null })} className="text-[#717171] hover:text-red-500 transition-colors text-lg leading-none">×</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <nav className="space-y-1" aria-label="Community categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition-colors text-left",
                    categoryParam === cat.id
                      ? "bg-[#F7F7F7] text-[#222222] font-semibold"
                      : "text-[#717171] font-medium hover:bg-[#F7F7F7] hover:text-[#222222]"
                  )}
                >
                  <cat.icon className={cn("w-5 h-5 stroke-[2]", categoryParam === cat.id ? "text-[#222222]" : "text-[#717171]")} />
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

          {/* ── Main feed ────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* New post CTA */}
            {!showNewPost ? (
              <button
                onClick={() => { if (!user) return; setShowNewPost(true); }}
                className="w-full mb-8 flex items-center gap-4 px-6 py-4 rounded-2xl border border-[#DDDDDD] bg-white hover:border-[#222222] transition-colors text-[#717171] text-[15px] font-medium shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-[#222222]" />
                </div>
                <span>{user ? "Share a tip, ask a question, or start a discussion..." : "Sign in to start a discussion"}</span>
                {user && (
                  <span className="ml-auto px-5 py-2.5 rounded-lg bg-[#222222] hover:bg-[#000000] text-white text-[14px] font-semibold transition-colors">
                    Create post
                  </span>
                )}
              </button>
            ) : (
              <div className="mb-8 rounded-2xl border-2 border-[#222222] bg-white overflow-hidden shadow-sm">
                <div className="px-6 pt-6 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.filter(c => c.id !== "popular").map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewPostCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                          newPostCategory === cat.id
                            ? "bg-[#222222] text-white border-[#222222]"
                            : "border-[#DDDDDD] text-[#717171] hover:border-[#222222]"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#EBEBEB]">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="text-[15px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={!newPostTitle.trim() || publishing}
                    className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
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
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 pb-4 text-[15px] font-semibold border-b-2 transition-colors -mb-px",
                    tabParam === tab.id
                      ? "border-[#222222] text-[#222222]"
                      : "border-transparent text-[#717171] hover:border-[#DDDDDD] hover:text-[#222222]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
              <span className="ml-auto text-[14px] font-medium text-[#717171] pb-4">
                {total} {total === 1 ? "result" : "results"}
              </span>
            </div>

            {/* Post list */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-24 text-center text-[#717171]">
                <Search className="w-12 h-12 mx-auto mb-4 stroke-[1.5] text-[#DDDDDD]" />
                <p className="text-[18px] font-semibold text-[#222222]">No discussions found</p>
                <p className="text-[15px] mt-2 max-w-sm mx-auto">
                  Try adjusting your search or be the first to start a topic in this category.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onTagClick={setTagFilter} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 rounded-xl border border-[#222222] text-[15px] font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                      Load more discussions
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <aside className="hidden xl:block w-[280px] shrink-0 space-y-8 lg:sticky lg:top-28">
            <div>
              <h3 className="text-[16px] font-semibold text-[#222222] mb-4">About this community</h3>
              <div className="space-y-4">
                {[
                  { label: "Members worldwide",     value: stats.totalUsers.toLocaleString(),              icon: Users },
                  { label: "Total discussions",      value: stats.totalPosts.toLocaleString(), icon: MessageCircle },
                  { label: "Top contributors",       value: stats.topContributors.toLocaleString(),                   icon: Award },
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

// ─── Page export (Suspense boundary for useSearchParams) ──────────────────────

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDDDDD]" />
      </div>
    }>
      <CommunityFeed />
    </Suspense>
  );
}