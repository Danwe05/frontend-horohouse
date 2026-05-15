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

// ─── Build reply tree client-side ────────────────────────────────────────────

function buildReplyTree(flat: Reply[], rootPostId: string): Reply[] {
  const map = new Map<string, Reply>();
  const roots: Reply[] = [];

  // Normalize: ensure every reply has a string `id` (lean() returns _id, not id virtual)
  const normalized = flat.map(r => ({
    ...r,
    id: String(r.id ?? r._id ?? ""),
    replyToId: r.replyToId ? String(r.replyToId) : null,
    rootPostId: r.rootPostId ? String(r.rootPostId) : null,
    children: [] as Reply[],
  }));

  normalized.forEach(r => map.set(r.id, r));

  normalized.forEach(r => {
    const parentId = r.replyToId ?? null;
    if (!parentId || parentId === rootPostId) {
      roots.push(r);
    } else {
      const parent = map.get(parentId);
      if (parent) parent.children!.push(r);
      else roots.push(r); // fallback: orphan shown at top level
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

interface ReplyCardProps {
  reply: Reply;
  depth?: number;
  rootPostId: string;
  postCategory: string;
  onAddReply: (newReply: Reply) => void;
}

function ReplyCard({ reply, depth = 0, rootPostId, postCategory, onAddReply }: ReplyCardProps) {
  const { user } = useAuth();
  const [liked, setLiked]         = useState(false);
  const [count, setCount]         = useState(reply.likes);
  const [busy,  setBusy]          = useState(false);
  const [replying, setReplying]   = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        category: postCategory,
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

  const maxDepth = 4;
  const isDeep = depth >= maxDepth;

  return (
    <div className={cn("relative", depth > 0 && "pl-4 ml-1 border-l-2 border-[#EBEBEB]", depth === 1 && "border-l-blue-100")}>
      <div className="py-5">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className={cn("shrink-0", depth === 0 ? "h-10 w-10" : "h-8 w-8")}>
            {reply.authorSnapshot.avatar && (
              <AvatarImage src={reply.authorSnapshot.avatar} alt={reply.authorSnapshot.name} />
            )}
            <AvatarFallback className={cn(
              "text-white font-semibold",
              depth === 0 ? "bg-[#222222] text-[13px]" : "bg-[#717171] text-[11px]"
            )}>
              {reply.authorSnapshot.initials}
            </AvatarFallback>
          </Avatar>

          {/* Body */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[14px] font-semibold text-[#222222]">{reply.authorSnapshot.name}</span>
              <span className="text-[12px] text-[#B0B0B0]">{reply.authorSnapshot.role}</span>
              <span className="text-[12px] text-[#B0B0B0] ml-auto">{relativeTime(reply.createdAt)}</span>
            </div>

            {/* Content */}
            <p className="text-[15px] text-[#222222] leading-relaxed mb-3">
              {reply.body || reply.excerpt || reply.title}
            </p>

            {/* Action strip */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                disabled={!user || busy}
                className={cn(
                  "flex items-center gap-1.5 text-[13px] font-medium transition-colors disabled:opacity-40",
                  liked ? "text-[#FF385C]" : "text-[#717171] hover:text-[#222222]"
                )}
              >
                <ThumbsUp className={cn("w-4 h-4 stroke-[2]", liked && "fill-[#FF385C]")} />
                {count > 0 && count}
              </button>

              {user && !isDeep && (
                <button
                  onClick={() => setReplying(r => !r)}
                  className={cn(
                    "flex items-center gap-1 text-[13px] font-medium transition-colors",
                    replying ? "text-blue-600" : "text-[#717171] hover:text-[#222222]"
                  )}
                >
                  <MessageCircle className="w-4 h-4 stroke-[2]" />
                  Reply
                </button>
              )}

              {reply.children && reply.children.length > 0 && (
                <span className="text-[12px] text-[#B0B0B0]">
                  {reply.children.length} {reply.children.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>

            {/* Inline composer */}
            {replying && (
              <div className="mt-4 flex gap-3 items-start">
                <Avatar className="h-7 w-7 shrink-0 mt-1">
                  <AvatarFallback className="bg-[#222222] text-white text-[10px] font-bold">
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
                    className="w-full resize-none text-[14px] text-[#222222] placeholder:text-[#B0B0B0] focus:outline-none leading-relaxed px-3 py-2.5 border border-[#DDDDDD] rounded-xl focus:border-[#222222] focus:ring-1 focus:ring-[#222222] bg-white"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setReplying(false); setReplyText(""); }}
                      className="px-4 py-1.5 text-[13px] font-semibold text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReply}
                      disabled={submitting || !replyText.trim()}
                      className="px-4 py-1.5 bg-[#222222] hover:bg-black text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recursive children */}
            {reply.children && reply.children.length > 0 && (
              <div className="mt-4">
                {reply.children.map(child => (
                  <ReplyCard
                    key={child.id ?? child._id}
                    reply={child}
                    depth={depth + 1}
                    rootPostId={rootPostId}
                    postCategory={postCategory}
                    onAddReply={onAddReply}
                  />
                ))}
              </div>
            )}
          </div>
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

  const [post,         setPost]         = useState<Post | null>(null);
  const [replies,      setReplies]      = useState<Reply[]>([]);
  const [related,      setRelated]      = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(0);
  const [likeBusy,     setLikeBusy]     = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [flagging,     setFlagging]     = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  // Edit / Action state
  const [isEditing,    setIsEditing]    = useState(false);
  const [editTitle,    setEditTitle]    = useState("");
  const [editBody,     setEditBody]     = useState("");
  const [savingEdit,   setSavingEdit]   = useState(false);
  const [showToast,    setShowToast]    = useState(false);

  const [errorMsg,     setErrorMsg]     = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

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
        setReplies(buildReplyTree(repliesRes.data ?? [], p.id));
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
        category: post.category as any,
        title:    replyText.trim().slice(0, 80),
        body:     replyText.trim(),
        replyToId: post.id,
        // rootPostId same as replyToId for top-level replies
      });
      const newReply: Reply = {
        ...newPost,
        id: newPost._id ?? newPost.id,
        replyToId: post.id,
        rootPostId: post.id,
        children: [],
      };
      // Append at root level of tree
      setReplies(prev => [...prev, newReply]);
      setReplyText("");
      setPost(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Called by any ReplyCard's inline composer when a sub-reply is successfully submitted.
   * Inserts the new reply into the correct node in the tree.
   */
  const handleAddReply = (newReply: Reply) => {
    const insertInTree = (nodes: Reply[]): Reply[] =>
      nodes.map(n => {
        if (n.id === newReply.replyToId || n._id === newReply.replyToId) {
          return { ...n, children: [...(n.children ?? []), newReply] };
        }
        return { ...n, children: insertInTree(n.children ?? []) };
      });
    setReplies(prev => insertInTree(prev));
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
                <div className="mb-8 border border-[#EBEBEB] rounded-2xl divide-y divide-[#EBEBEB] overflow-hidden">
                  {replies.map(r => (
                    <div key={r.id ?? r._id} className="px-5">
                      <ReplyCard
                        reply={r}
                        depth={0}
                        rootPostId={post.id}
                        postCategory={post.category}
                        onAddReply={handleAddReply}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Reply composer */}
              {user ? (
                <div className="rounded-2xl border border-[#DDDDDD] overflow-hidden bg-white shadow-sm">
                  <div className="flex gap-4 px-5 py-5">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white text-[13px] font-semibold">Me</AvatarFallback>
                    </Avatar>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Share your experience or ask a follow-up question..."
                      rows={4}
                      className="flex-1 resize-none text-[15px] text-[#222222] placeholder:text-[#717171] focus:outline-none leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EBEBEB] bg-[#F7F7F7]">
                    <p className="text-[12px] text-[#717171]">Be kind, constructive, and on-topic.</p>
                    <button
                      onClick={submitReply}
                      disabled={!replyText.trim() || submitting}
                      className="px-5 py-2.5 rounded-lg bg-[#222222] hover:bg-black text-white text-[14px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Post reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#DDDDDD] p-8 text-center bg-[#F7F7F7]">
                  <p className="text-[15px] text-[#717171] mb-4">Sign in to post a reply</p>
                  <Link href="/auth/login" className="px-6 py-3 rounded-lg bg-[#222222] text-white text-[14px] font-semibold hover:bg-black transition-colors">
                    Sign in
                  </Link>
                </div>
              )}
            </section>

            {/* ── Related posts ────────────────────────────────────────── */}
            {related.length > 0 && (
              <section className="mt-14 pt-10 border-t border-[#EBEBEB]">
                <h2 className="text-[20px] font-semibold text-[#222222] mb-6">Related discussions</h2>
                <div className="space-y-5">
                  {related.map(p => <RelatedPostCard key={p.id} post={p} />)}
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
                  { icon: ThumbsUp,      label: "Kudos",   value: likeCount.toLocaleString() },
                  { icon: MessageCircle, label: "Replies", value: post.replyCount.toLocaleString() },
                  { icon: Eye,           label: "Views",   value: post.views.toLocaleString() },
                  { icon: Clock,         label: "Posted",  value: relativeTime(post.createdAt) },
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
