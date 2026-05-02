"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, MoreHorizontal, Eye, Edit2, Trash2,
  Star, StarOff, Clock, CheckCircle2, FileText, AlertCircle,
  Archive, TrendingUp, X, Newspaper,
  RefreshCw, BookOpen,
} from "lucide-react";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { insightsAdminApi, AdminStats } from "@/lib/insights-api";
import type { InsightPost } from "@/types/insights";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostStatus = "draft" | "review" | "scheduled" | "published" | "archived";
type PostType   = "article" | "neighborhood_guide" | "market_report" | "fraud_alert" | "ai_insight";

type Post = InsightPost;

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PostStatus, { label: string; icon: any; dot: string; bg: string; text: string }> = {
  published: { label: "Published", icon: CheckCircle2, dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
  draft:     { label: "Draft",     icon: FileText,     dot: "bg-gray-400",    bg: "bg-gray-100",    text: "text-gray-600"   },
  review:    { label: "In Review", icon: AlertCircle,  dot: "bg-amber-500",   bg: "bg-amber-50",    text: "text-amber-700"  },
  scheduled: { label: "Scheduled", icon: Clock,        dot: "bg-blue-500",    bg: "bg-blue-50",     text: "text-blue-700"   },
  archived:  { label: "Archived",  icon: Archive,      dot: "bg-red-400",     bg: "bg-red-50",      text: "text-red-600"    },
};

const POST_TYPE_LABELS: Record<PostType, string> = {
  article:            "Article",
  neighborhood_guide: "Neighborhood Guide",
  market_report:      "Market Report",
  fraud_alert:        "Fraud Alert",
  ai_insight:         "AI Insight",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: any; color: string;
}) {
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-5 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#222222] leading-none">{value}</p>
        <p className="text-[13px] text-[#717171] mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PostStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-[#F7F7F7] rounded-2xl flex items-center justify-center mb-4">
        <Newspaper className="w-8 h-8 text-[#BBBBBB]" />
      </div>
      <p className="text-[17px] font-semibold text-[#222222]">
        {hasFilters ? "No articles match your filters" : "No articles yet"}
      </p>
      <p className="text-[14px] text-[#717171] mt-1.5 max-w-sm">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Get started by creating your first insight article."}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="mt-5 text-[14px] font-semibold text-blue-600 hover:underline">
          Clear all filters
        </button>
      ) : (
        <Link href="/dashboard/insights/new">
          <Button className="mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-semibold text-[14px]">
            <Plus className="w-4 h-4 mr-2" /> Write your first article
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── CMS Content (uses useSearchParams — must be inside Suspense) ─────────────

function InsightsCMSContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  // ── State ──────────────────────────────────────────────────────────────────
  const [posts, setPosts]               = useState<Post[]>([]);
  const [meta, setMeta]                 = useState<Meta>({ total: 0, page: 1, limit: 15, totalPages: 0 });
  const [stats, setStats]               = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search,   setSearch]   = useState(searchParams.get("q")      || "");
  const [status,   setStatus]   = useState(searchParams.get("status") || "all");
  const [postType, setPostType] = useState(searchParams.get("type")   || "all");
  const [sortBy,   setSortBy]   = useState(searchParams.get("sort")   || "createdAt");
  const [page,     setPage]     = useState(Number(searchParams.get("page") || 1));

  // ── Fetch Posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    else         setIsRefreshing(true);
    try {
      const result = await insightsAdminApi.getPosts({
        ...(status   !== "all" && { status }),
        ...(postType !== "all" && { postType }),
        ...(search               && { q: search }),
        sortBy,
        sortOrder: "desc",
        page,
        limit: 15,
      });
      setPosts(result.data ?? []);
      setMeta(result.meta  ?? { total: 0, page: 1, limit: 15, totalPages: 0 });
    } catch (err) {
      console.error("[InsightsCMS] fetchPosts:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, status, postType, search, sortBy, page]);

  // ── Fetch Stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const result = await insightsAdminApi.getStats();
      setStats(result);
    } catch (err) {
      console.error("[InsightsCMS] fetchStats:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [fetchPosts]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handlePublish = async (id: string) => {
    setActionLoading(id + "-publish");
    try {
      await insightsAdminApi.publish(id);
      fetchPosts(true);
    } catch (err) {
      console.error("[InsightsCMS] publish:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (post: Post) => {
    setActionLoading(post._id + "-feature");
    try {
      await insightsAdminApi.toggleFeatured(post._id, !post.isFeatured);
      fetchPosts(true);
    } catch (err) {
      console.error("[InsightsCMS] toggleFeatured:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget._id + "-delete");
    try {
      await insightsAdminApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchPosts(true);
      fetchStats();
    } catch (err) {
      console.error("[InsightsCMS] delete:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const clearFilters = () => {
    setSearch(""); setStatus("all"); setPostType("all"); setPage(1);
  };

  const hasFilters = search !== "" || status !== "all" || postType !== "all";

  return (
    <div className="flex-1 min-h-screen bg-[#F7F7F7]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-blue-600 mb-1.5">
              Content Management
            </p>
            <h1 className="text-3xl font-semibold text-[#222222] tracking-tight">Insights</h1>
            <p className="text-[14px] text-[#717171] mt-1">
              Manage articles, market reports, and editorial content.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPosts(true)}
              disabled={isRefreshing}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#DDDDDD] bg-white hover:bg-[#F7F7F7] text-[#717171] transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </button>
            <Link href="/dashboard/insights/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-xl font-semibold text-[14px] gap-2">
                <Plus className="w-4 h-4" /> New Article
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard label="Total"     value={stats.total}     icon={BookOpen}     color="bg-gray-100 text-gray-600" />
            <StatCard label="Published" value={stats.published} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
            <StatCard label="Drafts"    value={stats.draft}     icon={FileText}     color="bg-gray-100 text-gray-500" />
            <StatCard label="In Review" value={stats.review}    icon={AlertCircle}  color="bg-amber-100 text-amber-600" />
            <StatCard label="Featured"  value={stats.featured}  icon={Star}         color="bg-yellow-100 text-yellow-600" />
            <StatCard label="Trending"  value={stats.trending}  icon={TrendingUp}   color="bg-blue-100 text-blue-600" />
          </div>
        )}

        {/* ── Filters Bar ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BBBBBB]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 h-10 bg-[#F7F7F7] border border-transparent rounded-xl text-[14px] text-[#222222] placeholder:text-[#BBBBBB] focus:outline-none focus:bg-white focus:border-blue-600 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BBBBBB] hover:text-[#717171]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl border-[#EBEBEB] bg-[#F7F7F7] text-[14px] font-medium text-[#222222] focus:ring-0 focus:border-blue-600">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#EBEBEB]">
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={postType} onValueChange={(v) => { setPostType(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-[#EBEBEB] bg-[#F7F7F7] text-[14px] font-medium text-[#222222] focus:ring-0 focus:border-blue-600">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#EBEBEB]">
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl border-[#EBEBEB] bg-[#F7F7F7] text-[14px] font-medium text-[#222222] focus:ring-0 focus:border-blue-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#EBEBEB]">
              <SelectItem value="createdAt">Newest first</SelectItem>
              <SelectItem value="publishedAt">Recently published</SelectItem>
              <SelectItem value="viewCount">Most viewed</SelectItem>
              <SelectItem value="updatedAt">Recently updated</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#717171] hover:text-[#222222] transition-colors whitespace-nowrap px-2">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Results meta ─────────────────────────────────────────────────── */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[13px] text-[#717171]">
              {meta.total} {meta.total === 1 ? "article" : "articles"}
              {hasFilters && " found"}
            </p>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-[#F7F7F7]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="w-14 h-14 bg-[#F7F7F7] rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F7F7F7] rounded-lg w-2/3" />
                    <div className="h-3 bg-[#F7F7F7] rounded-lg w-1/3" />
                  </div>
                  <div className="w-24 h-6 bg-[#F7F7F7] rounded-full" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <>
              <div className="hidden lg:grid grid-cols-[1fr_160px_120px_100px_80px_48px] gap-4 px-6 py-3 border-b border-[#F7F7F7] bg-[#FAFAFA]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BBBBBB]">Article</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BBBBBB]">Status</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BBBBBB]">Date</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BBBBBB]">Views</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BBBBBB]">Flags</span>
                <span />
              </div>
              <div className="divide-y divide-[#F7F7F7]">
                {posts.map((post) => (
                  <PostRow
                    key={post._id}
                    post={post}
                    isAdmin={isAdmin}
                    actionLoading={actionLoading}
                    onEdit={() => router.push(`/dashboard/insights/${post._id}/edit`)}
                    onView={() => window.open(`/insights/${post.slug}`, "_blank")}
                    onPublish={() => handlePublish(post._id)}
                    onToggleFeatured={() => handleToggleFeatured(post)}
                    onDelete={() => setDeleteTarget(post)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-[13px] text-[#717171]">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 px-4 rounded-xl border border-[#DDDDDD] bg-white text-[13px] font-semibold text-[#222222] hover:bg-[#F7F7F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-9 h-9 rounded-xl text-[13px] font-semibold transition-colors",
                      page === p
                        ? "bg-blue-600 text-white"
                        : "border border-[#DDDDDD] bg-white text-[#222222] hover:bg-[#F7F7F7]",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="h-9 px-4 rounded-xl border border-[#DDDDDD] bg-white text-[13px] font-semibold text-[#222222] hover:bg-[#F7F7F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-[420px] rounded-2xl border-[#DDDDDD] p-0 overflow-hidden gap-0">
          <AlertDialogHeader className="px-6 py-6 border-b border-[#EBEBEB]">
            <AlertDialogTitle className="text-[20px] font-semibold text-[#222222]">
              Delete article?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-[#717171] mt-1.5 leading-relaxed">
              <span className="font-semibold text-[#222222]">"{deleteTarget?.title}"</span> will be permanently deleted.
              {deleteTarget?.status === "published" && (
                <span className="block mt-2 text-amber-600 font-medium">
                  This article is published — deleting it will decrement category and tag counts.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 bg-[#FAFAFA] flex flex-row gap-3 sm:space-x-0">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl border-[#DDDDDD] text-[14px] font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[14px] font-semibold"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page Shell (Suspense boundary wraps useSearchParams) ─────────────────────

export default function InsightsCMSPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <Suspense
            fallback={
              <div className="flex-1 min-h-screen bg-[#F7F7F7] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#BBBBBB] animate-spin" />
              </div>
            }
          >
            <InsightsCMSContent />
          </Suspense>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ─── Post Row ─────────────────────────────────────────────────────────────────

function PostRow({
  post, isAdmin, actionLoading,
  onEdit, onView, onPublish, onToggleFeatured, onDelete,
}: {
  post: Post;
  isAdmin: boolean;
  actionLoading: string | null;
  onEdit: () => void;
  onView: () => void;
  onPublish: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const isPublishLoading = actionLoading === post._id + "-publish";
  const isFeatureLoading = actionLoading === post._id + "-feature";
  const isDeleteLoading  = actionLoading === post._id + "-delete";

  const displayDate =
    post.status === "published" ? formatDate(post.publishedAt) :
    post.status === "scheduled" ? formatDate(post.scheduledAt) :
    formatDate(post.createdAt);

  const dateLabel =
    post.status === "scheduled" ? "Scheduled" :
    post.status === "published" ? "Published"  : "Created";

  return (
    <div className="px-4 sm:px-6 py-4 hover:bg-[#FAFAFA] transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#F7F7F7] shrink-0 overflow-hidden border border-[#EBEBEB]">
          {post.coverImage?.url ? (
            <img src={post.coverImage.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#BBBBBB]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#222222] truncate leading-snug">
            {post.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[12px] text-[#717171]">{post.author?.displayName}</span>
            <span className="text-[#DDDDDD]">·</span>
            <span className="text-[12px] text-[#717171]">{post.category?.name}</span>
            <span className="text-[#DDDDDD]">·</span>
            <span className="text-[12px] text-[#BBBBBB]">{POST_TYPE_LABELS[post.postType as PostType]}</span>
            <span className="text-[#DDDDDD]">·</span>
            <span className="text-[12px] text-[#BBBBBB]">{post.readingTimeMinutes} min read</span>
          </div>
          <div className="flex items-center gap-2 mt-2 lg:hidden">
            <StatusBadge status={post.status as PostStatus} />
            <span className="text-[12px] text-[#BBBBBB]">{dateLabel} {displayDate}</span>
          </div>
        </div>
        <div className="hidden lg:block w-[160px] shrink-0">
          <StatusBadge status={post.status as PostStatus} />
        </div>
        <div className="hidden lg:block w-[120px] shrink-0">
          <p className="text-[13px] text-[#717171]">{displayDate}</p>
          <p className="text-[11px] text-[#BBBBBB] mt-0.5">{dateLabel}</p>
        </div>
        <div className="hidden lg:block w-[100px] shrink-0">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#BBBBBB]" />
            <span className="text-[13px] font-medium text-[#717171]">{formatViews(post.viewCount)}</span>
          </div>
        </div>
        <div className="hidden lg:flex w-[80px] shrink-0 items-center gap-1.5">
          {post.isFeatured && (
            <span title="Featured" className="w-6 h-6 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
            </span>
          )}
          {post.isTrending && (
            <span title="Trending" className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            </span>
          )}
        </div>
        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#BBBBBB] hover:bg-[#F7F7F7] hover:text-[#222222] transition-colors focus:outline-none">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.12)] p-1.5">
              <DropdownMenuItem onClick={onEdit} className="rounded-lg text-[14px] font-medium cursor-pointer gap-2.5 py-2.5">
                <Edit2 className="w-4 h-4 text-[#717171]" /> Edit article
              </DropdownMenuItem>
              {post.status === "published" && (
                <DropdownMenuItem onClick={onView} className="rounded-lg text-[14px] font-medium cursor-pointer gap-2.5 py-2.5">
                  <Eye className="w-4 h-4 text-[#717171]" /> View live
                </DropdownMenuItem>
              )}
              {isAdmin && post.status !== "published" && post.status !== "archived" && (
                <DropdownMenuItem onClick={onPublish} disabled={isPublishLoading} className="rounded-lg text-[14px] font-medium cursor-pointer gap-2.5 py-2.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  {isPublishLoading ? "Publishing..." : "Publish now"}
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onClick={onToggleFeatured} disabled={isFeatureLoading} className="rounded-lg text-[14px] font-medium cursor-pointer gap-2.5 py-2.5">
                  {post.isFeatured
                    ? <><StarOff className="w-4 h-4 text-[#717171]" /> Remove featured</>
                    : <><Star    className="w-4 h-4 text-[#717171]" /> Mark as featured</>}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1 bg-[#F7F7F7]" />
              <DropdownMenuItem onClick={onDelete} disabled={isDeleteLoading} className="rounded-lg text-[14px] font-medium cursor-pointer gap-2.5 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700">
                <Trash2 className="w-4 h-4" />
                {isDeleteLoading ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}