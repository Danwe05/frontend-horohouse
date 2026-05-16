"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ThumbsUp, MessageCircle, Eye, Bookmark,
  Share2, MoreHorizontal, Flag, ChevronRight, Pin, Clock, Loader2,
  Trash2, Edit2, PinOff, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  slug: string;
  category: string;
  pinned: boolean;
  title: string;
  excerpt?: string;
  body?: string;
  tags: string[];
  likes: number;
  replyCount: number;
  views: number;
  authorId: string;
  authorSnapshot: { name: string; initials: string; role: string; avatar: string };
  createdAt: string;
}

interface Reply {
  id: string;
  _id?: string;
  title: string;
  body?: string;
  excerpt?: string;
  likes: number;
  replyCount: number;
  views: number;
  replyToId?: string | null;
  rootPostId?: string | null;
  authorId?: string;
  authorSnapshot: { name: string; initials: string; role: string; avatar: string };
  createdAt: string;
  // populated client-side
  children?: Reply[];
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────

function RenderBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-[16px] text-[#222222] leading-[1.7]">
      {lines.map((line, i) => {
        if (line.trim() === "---") return <hr key={i} className="border-t border-[#EBEBEB] my-2" />;
        if (!line.trim()) return null;

        const parsed = line
          .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
          .map((seg, j) => {
            if (seg.startsWith("**") && seg.endsWith("**"))
              return <strong key={j}>{seg.slice(2, -2)}</strong>;
            if (seg.startsWith("*") && seg.endsWith("*"))
              return <em key={j}>{seg.slice(1, -1)}</em>;
            return seg;
          });

        if (/^[-•]/.test(line.trim()))
          return <li key={i} className="ml-6 list-disc text-[#222222]">{parsed}</li>;
        if (/^\d+\./.test(line.trim()))
          return <li key={i} className="ml-6 list-decimal text-[#222222]">{parsed}</li>;

        return <p key={i}>{parsed}</p>;
      })}
    </div>
  );
}

// ─── Build one-level tree ────────────────────────────────────────────────────
// All descendants of a top-level reply are flattened into its children[].
// Result: top-level replies + exactly one nested indent level.

function buildOneLevel(flat: Reply[], rootPostId: string): Reply[] {
  const normalized = flat.map(r => ({
    ...r,
    id: String(r.id ?? r._id ?? ""),
    replyToId: r.replyToId ? String(r.replyToId) : null,
    children: [] as Reply[],
  }));

  const map = new Map<string, Reply>();
  normalized.forEach(r => map.set(r.id, r));

  const roots: Reply[] = [];

  // Trace any reply up to its root-level ancestor
  const getRootAncestor = (id: string): Reply | null => {
    const r = map.get(id);
    if (!r) return null;
    const pid = r.replyToId;
    if (!pid || pid === rootPostId) return r;
    return getRootAncestor(pid) ?? r;
  };

  normalized.forEach(r => {
    const pid = r.replyToId;
    if (!pid || pid === rootPostId) {
      roots.push(r);
    } else {
      const ancestor = getRootAncestor(pid);
      if (ancestor) ancestor.children!.push(r);
      else roots.push(r);
    }
  });

  return roots;
}

// ─── Reply card ──────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Valid backend PostCategory enum values
const VALID_CATEGORIES = ['homes', 'cafe', 'explore', 'resources', 'updates'] as const;
type ValidCategory = typeof VALID_CATEGORIES[number];

function safeCategory(raw: string | undefined): ValidCategory {
  const lower = (raw ?? '').toLowerCase() as ValidCategory;
  return VALID_CATEGORIES.includes(lower) ? lower : 'homes';
}

function ReplyCard({ reply, rootPostId, postCategory, onAddReply, parentAuthorName, isNested }: {
  reply: Reply;
  rootPostId: string;
  postCategory: string;
  onAddReply: (newReply: Reply) => void;
  parentAuthorName?: string;
  isNested?: boolean;
}) {
  const { user } = useAuth();
  const [liked, setLiked]         = useState(false);
  const [count, setCount]         = useState(reply.likes);
  const [busy,  setBusy]          = useState(false);
  const [replying, setReplying]   = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu]   = useState(false);

  const toggle = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await apiClient.toggleCommunityPostLike(reply.id);
      setLiked(res.liked);
      setCount(res.likes);
    } finally {
      setBusy(false);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newPost = await apiClient.createCommunityPost({
        category: safeCategory(postCategory) as any,
        title: replyText.trim().slice(0, 80),
        body: replyText.trim(),
        replyToId: reply.id,
        rootPostId,
      });
      const newReply: Reply = {
        ...newPost,
        id: newPost._id ?? newPost.id,
        replyToId: reply.id,
        rootPostId,
        children: [],
      };
      onAddReply(newReply);
      setReplyText("");
      setReplying(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 border-b border-[#EBEBEB] last:border-0">
      <div className="flex gap-4">

        {/* Avatar + level badge */}
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12">
            {reply.authorSnapshot.avatar && (
              <AvatarImage src={reply.authorSnapshot.avatar} alt={reply.authorSnapshot.name} />
            )}
            <AvatarFallback className="bg-[#484848] text-white text-[14px] font-semibold">
              {reply.authorSnapshot.initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div>
              <span className="text-[15px] font-bold text-[#222222] leading-tight">
                {reply.authorSnapshot.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[12px] font-semibold text-[#767676] bg-[#F7F7F7] px-2 py-0.5 rounded-full border border-[#EBEBEB]">
                  {reply.authorSnapshot.role}
                </span>
                {parentAuthorName && (
                  <span className="text-[12px] text-[#767676]">
                    In response to <span className="font-semibold text-[#484848]">{parentAuthorName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* ··· menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(m => !m)}
                className="p-1.5 rounded-full text-[#B0B0B0] hover:text-[#222222] hover:bg-[#F7F7F7] transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div
                  onMouseLeave={() => setShowMenu(false)}
                  className="absolute right-0 top-8 z-20 bg-white border border-[#EBEBEB] rounded-2xl shadow-xl py-1.5 min-w-[140px] overflow-hidden"
                >
                  <button className="w-full text-left px-4 py-2.5 text-[14px] text-[#484848] hover:bg-[#F7F7F7] transition-colors">Share</button>
                  {user?.id === reply.authorId && (
                    <button className="w-full text-left px-4 py-2.5 text-[14px] text-[#FF385C] hover:bg-[#FFF0F3] transition-colors">Delete</button>
                  )}
                  <button className="w-full text-left px-4 py-2.5 text-[14px] text-[#484848] hover:bg-[#F7F7F7] transition-colors">Report</button>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <p className="text-[15px] text-[#484848] leading-relaxed mt-3 mb-4">
            {reply.body || reply.excerpt || reply.title}
          </p>

          {/* Actions — right-aligned Airbnb style */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#767676] mr-auto">
              {relativeTime(reply.createdAt)}
            </span>

            {/* Like — outlined pill */}
            <button
              onClick={toggle}
              disabled={!user || busy}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border text-[14px] font-semibold transition-all disabled:opacity-40",
                liked
                  ? "border-[#FF385C] text-[#FF385C] bg-[#FFF0F3]"
                  : "border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4 stroke-[2]", liked && "fill-[#FF385C]")} />
              {count > 0 ? count : ""}
            </button>

            {/* Reply — black pill */}
            {user && (
              <button
                onClick={() => setReplying(r => !r)}
                className={cn(
                  "px-5 py-2 rounded-full text-[14px] font-semibold transition-all",
                  replying ? "bg-[#484848] text-white" : "bg-[#222222] hover:bg-black text-white"
                )}
              >
                Reply
              </button>
            )}
          </div>

          {/* Inline composer */}
          {replying && (
            <div className="mt-4 flex gap-3 items-start">
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarFallback className="bg-[#222222] text-white text-[11px] font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${reply.authorSnapshot.name}…`}
                  rows={2}
                  className="w-full resize-none text-[14px] text-[#222222] placeholder:text-[#B0B0B0] focus:outline-none leading-relaxed px-4 py-3 border border-[#DDDDDD] rounded-2xl focus:border-[#222222] focus:ring-1 focus:ring-[#222222] bg-white"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => { setReplying(false); setReplyText(""); }}
                    className="px-4 py-2 text-[13px] font-semibold text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReply}
                    disabled={submitting || !replyText.trim()}
                    className="px-5 py-2 bg-[#222222] hover:bg-black text-white text-[13px] font-semibold rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* One-level children — only render on top-level cards */}
          {!isNested && reply.children && reply.children.length > 0 && (
            <div className="mt-6 sm:border-l-2 sm:border-[#EBEBEB] sm:pl-4 sm:ml-14 space-y-0">
              {reply.children.map((child, ci) => (
                <ReplyCard
                  key={child.id ?? child._id ?? ci}
                  reply={child}
                  rootPostId={rootPostId}
                  postCategory={postCategory}
                  onAddReply={onAddReply}
                  parentAuthorName={reply.authorSnapshot.name}
                  isNested={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Related post mini card ──────────────────────────────────────────────────


function RelatedPostCard({ post }: { post: Post }) {
  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };
  return (
    <Link href={`/community/${post.slug}`} className="block group">
      <div className="flex items-start gap-4 p-4 rounded-xl border border-[#EBEBEB] hover:border-[#222222] hover:shadow-sm transition-all">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-[#222222] text-white text-[12px] font-semibold">
            {post.authorSnapshot.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#222222] leading-snug group-hover:underline line-clamp-2 mb-1">
            {post.title}
          </p>
          <div className="flex items-center gap-3 text-[12px] text-[#717171]">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{post.likes}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.replyCount}</span>
            <span>{relativeTime(post.createdAt)}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#B0B0B0] shrink-0 mt-1" />
      </div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommunityPostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit / Action state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // relativeTime is now a module-level function, removed here

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    apiClient.getCommunityPostBySlug(slug)
      .then(async (p: Post) => {
        setPost(p);
        setLikeCount(p.likes);
        // fire-and-forget view increment
        apiClient.incrementCommunityPostView(p.id);

        // fetch replies and related in parallel
        const [repliesRes, relatedRes] = await Promise.all([
          apiClient.getCommunityPostReplies(p.id, { limit: 20 }),
          apiClient.getCommunityPosts({ category: p.category, limit: 4 }),
        ]);
        setReplies(buildOneLevel(repliesRes.data ?? [], p.id));
        setRelated((relatedRes.data ?? []).filter((r: Post) => r.id !== p.id).slice(0, 3));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleLike = async () => {
    if (!user || likeBusy || !post) return;
    setLikeBusy(true);
    try {
      const res = await apiClient.toggleCommunityPostLike(post.id);
      setLiked(res.liked);
      setLikeCount(res.likes);
    } finally {
      setLikeBusy(false);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || submitting || !post) return;
    setSubmitting(true);
    try {
      const newPost = await apiClient.createCommunityPost({
        category: safeCategory(post.category) as any,
        title: replyText.trim().slice(0, 80),
        body: replyText.trim(),
        replyToId: post.id,
        // rootPostId same as replyToId for top-level replies
      });
      const newReply: Reply = {
        ...newPost,
        id: String(newPost._id ?? newPost.id ?? ""),
        replyToId: post.id,
        rootPostId: post.id,
      };
      setReplies(prev => [...prev, newReply]);
      setReplyText("");
      setPost(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev);
    } finally {
      setSubmitting(false);
    }
  };

  // Flat append — no tree insertion needed
  const handleAddReply = (newReply: Reply) => {
    const flat: Reply = {
      ...newReply,
      id: String(newReply._id ?? newReply.id ?? ""),
    };
    setReplies(prev => [...prev, flat]);
    setPost(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim() || savingEdit || !post) return;
    setSavingEdit(true);
    setErrorMsg("");
    try {
      const updated = await apiClient.updateCommunityPost(post.id, {
        title: editTitle.trim(),
        body: editBody.trim() || undefined,
      });
      setPost(updated);
      setIsEditing(false);
    } catch {
      setErrorMsg("Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await apiClient.deleteCommunityPost(post.id);
      router.push("/community");
    } catch {
      setErrorMsg("Failed to delete post.");
    }
  };

  const handlePinToggle = async () => {
    if (!post) return;
    try {
      await apiClient.pinCommunityPost(post.id, !post.pinned);
      setPost(prev => prev ? { ...prev, pinned: !prev.pinned } : prev);
      setSuccessMsg(post.pinned ? "Post unpinned." : "Post pinned successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Failed to update pin status.");
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleFlag = async () => {
    if (!user || flagging || !post) return;
    setFlagging(true);
    try {
      await apiClient.flagCommunityPost(post.id);
      setSuccessMsg("Post has been reported to moderators.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setErrorMsg("Failed to report post.");
    } finally {
      setFlagging(false);
    }
  };

  const isOwner = user?.id === post?.authorId;
  const isAdmin = user?.role === "admin";
  const canModify = isOwner || isAdmin;

  // ── Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#DDDDDD]" />
      </div>
    );
  }

  // ── Not found
  if (notFound || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-[22px] font-semibold text-[#222222] mb-2">Discussion not found</p>
          <p className="text-[#717171] mb-6">This post may have been removed or the URL is incorrect.</p>
          <Link href="/community" className="text-blue-600 underline font-medium">Back to community</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans">

      {/* ── Breadcrumb bar ───────────────────────────────────────────────── */}
      <div className="border-b border-[#EBEBEB] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/community" className="flex items-center gap-1.5 text-[14px] font-medium text-[#717171] hover:text-[#222222] transition-colors">
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            Community
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B0B0B0]" />
          <span className="text-[14px] font-medium text-[#222222] truncate max-w-xs">{post.title}</span>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* ── Main column ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {post.tags.map(tag => (
                  <Link key={tag} href={`/community?tag=${tag}`}>
                    <span className="px-3 py-1 rounded-full bg-white border border-[#DDDDDD] text-[13px] font-medium text-[#222222] hover:border-[#222222] transition-colors cursor-pointer">
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {errorMsg && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {successMsg && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            {isEditing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Post title"
                className="w-full text-[28px] md:text-[32px] font-bold tracking-tight leading-tight text-[#222222] mb-6 border-b border-[#DDDDDD] focus:outline-none focus:border-[#222222] pb-2"
              />
            ) : (
              <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight leading-tight text-[#222222] mb-6 flex items-center flex-wrap gap-3">
                {post.title}
                {post.pinned && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[13px] font-semibold uppercase tracking-wide border border-blue-100">
                    <Pin className="w-3.5 h-3.5 fill-blue-600" /> Pinned
                  </span>
                )}
              </h1>
            )}

            {/* Author row */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#EBEBEB] flex-wrap">
              <Avatar className="h-12 w-12 shrink-0">
                {post.authorSnapshot.avatar && <AvatarImage src={post.authorSnapshot.avatar} alt={post.authorSnapshot.name} />}
                <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
                  {post.authorSnapshot.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/community/authors/${post.authorId}`} className="text-[15px] font-semibold text-[#222222] hover:underline">
                  {post.authorSnapshot.name}
                </Link>
                <div className="flex items-center gap-2 text-[13px] text-[#717171] flex-wrap">
                  <span>{post.authorSnapshot.role}</span>
                  <span>·</span>
                  <span>{relativeTime(post.createdAt)}</span>
                  <span>·</span>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              </div>

              {/* Post actions */}
              <div className="max-sm:w-full ml-auto flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={handlePinToggle}
                    className={cn(
                      "p-2.5 rounded-full border transition-colors group",
                      post.pinned ? "border-blue-600 text-blue-600 bg-blue-50" : "border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]"
                    )}
                    title={post.pinned ? "Unpin post" : "Pin post"}
                  >
                    {post.pinned ? <PinOff className="w-4 h-4 stroke-[2]" /> : <Pin className="w-4 h-4 stroke-[2]" />}
                  </button>
                )}
                {canModify && !isEditing && (
                  <>
                    <button
                      onClick={() => {
                        setEditTitle(post.title);
                        setEditBody(post.body || post.excerpt || "");
                        setIsEditing(true);
                      }}
                      className="p-2.5 rounded-full border border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
                      title="Edit post"
                    >
                      <Edit2 className="w-4 h-4 stroke-[2]" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2.5 rounded-full border border-[#DDDDDD] text-[#717171] hover:text-[#FF385C] hover:border-[#FF385C] transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this discussion.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-[#FF385C] hover:bg-[#D92C4B] text-white">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                <button
                  onClick={() => setSaved(s => !s)}
                  className={cn(
                    "p-2.5 rounded-full border transition-colors",
                    saved ? "border-[#FF385C] text-[#FF385C] bg-rose-50" : "border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]"
                  )}
                  title="Save post"
                >
                  <Bookmark className={cn("w-4 h-4 stroke-[2]", saved && "fill-[#FF385C]")} />
                </button>
                <div className="relative">
                  <button
                    className="p-2.5 rounded-full border border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
                    title="Share"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 stroke-[2]" />
                  </button>
                  {showToast && (
                    <div className="absolute top-full mt-2 right-0 bg-[#222222] text-white text-[12px] font-medium px-3 py-1.5 rounded-md shadow-md whitespace-nowrap z-10 animate-in fade-in zoom-in-95 duration-200">
                      Link copied!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Post body */}
            <article className="mb-10">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    placeholder="Content of your post..."
                    rows={12}
                    className="w-full resize-y text-[16px] text-[#222222] placeholder:text-[#717171] focus:outline-none leading-relaxed p-4 border border-[#DDDDDD] rounded-xl focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                  />
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 text-[15px] font-semibold text-[#222222] hover:bg-[#F7F7F7] rounded-lg transition-colors border border-transparent hover:border-[#DDDDDD]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={savingEdit || !editTitle.trim()}
                      className="px-5 py-2.5 bg-[#222222] hover:bg-black text-white text-[15px] font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save changes
                    </button>
                  </div>
                </div>
              ) : (
                <RenderBody text={post.body ?? post.excerpt ?? post.title} />
              )}
            </article>

            {/* Like + reply count strip */}
            <div className="flex items-center gap-6 py-5 border-t border-b border-[#EBEBEB] mb-10">
              <button
                onClick={toggleLike}
                disabled={!user || likeBusy}
                className={cn(
                  "flex items-center gap-2 text-[15px] font-semibold transition-colors disabled:opacity-40",
                  liked ? "text-[#FF385C]" : "text-[#222222] hover:text-[#FF385C]"
                )}
              >
                <ThumbsUp className={cn("w-5 h-5 stroke-[2]", liked && "fill-[#FF385C]")} />
                {likeCount.toLocaleString()} Kudos
              </button>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#222222]">
                <MessageCircle className="w-5 h-5 stroke-[2]" />
                {post.replyCount} Replies
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={flagging || !user}
                    className="ml-auto flex items-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222222] transition-colors disabled:opacity-40"
                    title={user ? "Report post" : "Sign in to report"}
                  >
                    <Flag className="w-4 h-4 stroke-[2]" /> {flagging ? "Reporting..." : "Report"}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Report this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to report this content to the moderators? Our team will review it shortly.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFlag} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Report Post
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* ── Replies ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
                {post.replyCount} {post.replyCount === 1 ? "Reply" : "Replies"}
              </h2>

              {replies.length > 0 && (
                <div className="mb-8">
                  {replies.map((r, i) => (
                    <ReplyCard
                      key={r.id || r._id || i}
                      reply={r}
                      rootPostId={post.id}
                      postCategory={post.category}
                      onAddReply={handleAddReply}
                    />
                  ))}
                </div>
              )}

              {/* Reply composer */}
              {user ? (
                <div className="rounded-2xl border border-[#DDDDDD] overflow-hidden bg-white">
                  <div className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-[#222222] text-white text-[12px] sm:text-[13px] font-semibold">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Add a reply…"
                        rows={3}
                        className="w-full resize-none text-[15px] text-[#222222] placeholder:text-[#B0B0B0] focus:outline-none leading-relaxed"
                      />
                      {replyText.trim() && (
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#EBEBEB]">
                          <button
                            onClick={() => setReplyText("")}
                            className="px-4 py-2 text-[13px] font-semibold text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitReply}
                            disabled={submitting}
                            className="px-5 py-2 rounded-lg bg-[#222222] hover:bg-black text-white text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#DDDDDD] px-6 sm:px-8 py-6 sm:py-8 text-center bg-[#F7F7F7]">
                  <p className="text-[15px] text-[#717171] mb-4">Sign in to join the discussion</p>
                  <Link
                    href="/auth/login"
                    className="inline-block px-6 py-2.5 rounded-lg bg-[#222222] text-white text-[14px] font-semibold hover:bg-black transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </section>

            {/* ── Related posts ────────────────────────────────────────── */}
            {related.length > 0 && (
              <section className="mt-14 pt-10 border-t border-[#EBEBEB]">
                <h2 className="text-[18px] font-semibold text-[#222222] mb-5">Related discussions</h2>
                <div className="space-y-4">
                  {related.map((p, i) => <RelatedPostCard key={p.id || p.slug || i} post={p} />)}
                </div>
              </section>
            )}
          </main>

          {/* ── Right sidebar ─────────────────────────────────────────────── */}
          <aside className="hidden xl:block w-[280px] shrink-0 space-y-8 lg:sticky lg:top-20">

            {/* Author card */}
            <div className="rounded-2xl border border-[#DDDDDD] p-6 bg-white">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#B0B0B0] mb-4">About the author</p>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 shrink-0">
                  {post.authorSnapshot.avatar && <AvatarImage src={post.authorSnapshot.avatar} />}
                  <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
                    {post.authorSnapshot.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[15px] font-semibold text-[#222222]">{post.authorSnapshot.name}</p>
                  <p className="text-[13px] text-[#717171]">{post.authorSnapshot.role}</p>
                </div>
              </div>
              <Link
                href={`/community/authors/${post.authorId}`}
                className="block w-full py-2.5 rounded-lg border border-[#222222] text-[14px] font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors text-center"
              >
                View profile
              </Link>
            </div>

            {/* Post stats */}
            <div>
              <p className="text-[14px] font-semibold text-[#222222] mb-4">Post stats</p>
              <div className="space-y-3">
                {[
                  { icon: ThumbsUp, label: "Kudos", value: likeCount.toLocaleString() },
                  { icon: MessageCircle, label: "Replies", value: post.replyCount.toLocaleString() },
                  { icon: Eye, label: "Views", value: post.views.toLocaleString() },
                  { icon: Clock, label: "Posted", value: relativeTime(post.createdAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[14px]">
                    <span className="flex items-center gap-2 text-[#717171]">
                      <Icon className="w-4 h-4 stroke-[1.8]" /> {label}
                    </span>
                    <span className="font-semibold text-[#222222]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back link */}
            <div className="pt-8 border-t border-[#EBEBEB]">
              <Link href="/community" className="flex items-center gap-2 text-[14px] font-semibold text-[#222222] hover:underline underline-offset-2">
                <ArrowLeft className="w-4 h-4 stroke-[2]" /> Back to community
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
