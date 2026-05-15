"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ThumbsUp, MessageCircle, Eye, Bookmark,
  Share2, MoreHorizontal, Flag, ChevronRight,
  Users, Award, Pin, Clock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { POSTS } from "../data";
import { getAuthorByName } from "../data";

// ─── Static reply data (would come from API in production) ─────────────────

const REPLIES_MAP: Record<string, Array<{
  id: number; author: { name: string; initials: string; role: string };
  body: string; time: string; likes: number;
}>> = {
  "how-i-went-from-0-to-40-reviews-in-6-months": [
    { id: 1, author: { name: "Kwame Asante", initials: "KA", role: "Superhost" }, body: "Step 3 is underrated. My welcome kit took me from 4.7 to 4.95 average rating in two months. I also added a handwritten note with the city's best kept secret restaurant — guests mention it in almost every review.", time: "1h ago", likes: 42 },
    { id: 2, author: { name: "Fatou Ndiaye", initials: "FN", role: "Host" }, body: "The follow-up message is the one I was missing. Started doing it last week and already intercepted one issue before it became a bad review. Thank you for this!", time: "45m ago", likes: 28 },
    { id: 3, author: { name: "David Mensah", initials: "DM", role: "New Host" }, body: "Genuinely one of the best posts on this forum. Saving and sharing with my co-host. Question: did the dynamic pricing tool need approval from Airbnb or does it connect directly?", time: "20m ago", likes: 6 },
  ],
  "weekend-coffee-chat-most-unexpected-guest": [
    { id: 1, author: { name: "Amara Diallo", initials: "AD", role: "Top Contributor" }, body: "A guest of mine started a small garden in my balcony pots. Left behind labeled plants, a watering schedule, and a note saying 'these will bloom in March.' It's now my favorite feature of the listing.", time: "4h ago", likes: 87 },
    { id: 2, author: { name: "Kwame Asante", initials: "KA", role: "Superhost" }, body: "Mine alphabetized my entire bookshelf. Every single book. Left a hand-drawn Dewey Decimal system on a Post-it note attached to the shelf. I've kept it.", time: "3h ago", likes: 64 },
  ],
};

const MEMBERS = [
  { name: "Amara Diallo",  role: "Top Contributor", initials: "AD", badge: "🏆" },
  { name: "Kwame Asante",  role: "Superhost",        initials: "KA", badge: "⭐" },
  { name: "Fatou Ndiaye",  role: "Host",             initials: "FN", badge: "" },
];

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
// Renders **bold**, *italic*, numbered lists, bullet lists, and *** dividers.

function RenderBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-[16px] text-[#222222] leading-[1.7]">
      {lines.map((line, i) => {
        if (line.trim() === "---") return <hr key={i} className="border-t border-[#EBEBEB] my-2" />;
        if (!line.trim()) return null;

        // Parse inline **bold** and *italic*
        const parsed = line
          .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
          .map((seg, j) => {
            if (seg.startsWith("**") && seg.endsWith("**"))
              return <strong key={j}>{seg.slice(2, -2)}</strong>;
            if (seg.startsWith("*") && seg.endsWith("*"))
              return <em key={j}>{seg.slice(1, -1)}</em>;
            return seg;
          });

        // Bullet
        if (/^[-•]/.test(line.trim()))
          return <li key={i} className="ml-6 list-disc text-[#222222]">{parsed}</li>;
        // Numbered list
        if (/^\d+\./.test(line.trim()))
          return <li key={i} className="ml-6 list-decimal text-[#222222]">{parsed}</li>;

        return <p key={i}>{parsed}</p>;
      })}
    </div>
  );
}

// ─── Reply card ──────────────────────────────────────────────────────────────

function ReplyCard({ reply }: { reply: NonNullable<typeof REPLIES_MAP[string]>[number] }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(reply.likes);
  return (
    <div className="py-6 border-b border-[#EBEBEB] last:border-b-0">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-[#222222] text-white text-[13px] font-semibold">
            {reply.author.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px] font-semibold text-[#222222]">{reply.author.name}</span>
            <span className="text-[13px] text-[#717171]">· {reply.author.role}</span>
            <span className="text-[13px] text-[#717171] ml-auto">{reply.time}</span>
          </div>
          <p className="text-[15px] text-[#222222] leading-relaxed mb-3">{reply.body}</p>
          <div className="flex items-center gap-5">
            <button
              onClick={() => { setLiked(p => !p); setCount(c => liked ? c - 1 : c + 1); }}
              className={cn("flex items-center gap-1.5 text-[13px] font-medium transition-colors",
                liked ? "text-[#FF385C]" : "text-[#717171] hover:text-[#222222]")}
            >
              <ThumbsUp className={cn("w-4 h-4 stroke-[2]", liked && "fill-[#FF385C]")} />
              {count}
            </button>
            <button className="text-[13px] text-[#717171] hover:text-[#222222] font-medium flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 stroke-[2]" /> Reply
            </button>
            <button className="ml-auto text-[#B0B0B0] hover:text-[#717171] transition-colors p-1 rounded-full hover:bg-[#F7F7F7]">
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommunityPostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [replyText, setReplyText] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const post = useMemo(() => POSTS.find(p => p.slug === slug), [slug]);
  const replies = REPLIES_MAP[slug] ?? [];
  const authorProfile = useMemo(() => post ? getAuthorByName(post.author.name) : undefined, [post]);
  const relatedPosts = useMemo(() =>
    POSTS.filter(p => p.slug !== slug && p.category === post?.category).slice(0, 3),
    [slug, post]);

  if (!post) {
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

  // Init likeCount from post data once
  if (likeCount === 0 && post.likes > 0) setLikeCount(post.likes);

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

            {/* Title */}
            <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight leading-tight text-[#222222] mb-6">
              {post.title}
            </h1>

            {/* Author row */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#EBEBEB]">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
                  {post.author.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                {authorProfile ? (
                  <Link href={`/community/author/${authorProfile.username}`} className="text-[15px] font-semibold text-[#222222] hover:underline">
                    {post.author.name}
                  </Link>
                ) : (
                  <p className="text-[15px] font-semibold text-[#222222]">{post.author.name}</p>
                )}
                <div className="flex items-center gap-2 text-[13px] text-[#717171]">
                  <span>{post.author.role}</span>
                  <span>·</span>
                  <span>{post.time}</span>
                  <span>·</span>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              </div>

              {/* Post actions */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setSaved(s => !s)}
                  className={cn(
                    "p-2.5 rounded-full border transition-colors",
                    saved ? "border-blue-600 text-blue-600 bg-blue-50" : "border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222]"
                  )}
                  title="Save post"
                >
                  <Bookmark className={cn("w-4 h-4 stroke-[2]", saved && "fill-blue-600")} />
                </button>
                <button
                  className="p-2.5 rounded-full border border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4 stroke-[2]" />
                </button>
                <button
                  className="p-2.5 rounded-full border border-[#DDDDDD] text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
                  title="More"
                >
                  <MoreHorizontal className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Post body */}
            <article className="mb-10">
              <RenderBody text={post.body ?? post.excerpt} />
            </article>

            {/* Like + reply count strip */}
            <div className="flex items-center gap-6 py-5 border-t border-b border-[#EBEBEB] mb-10">
              <button
                onClick={() => { setLiked(p => !p); setLikeCount(c => liked ? c - 1 : c + 1); }}
                className={cn(
                  "flex items-center gap-2 text-[15px] font-semibold transition-colors",
                  liked ? "text-[#FF385C]" : "text-[#222222] hover:text-[#FF385C]"
                )}
              >
                <ThumbsUp className={cn("w-5 h-5 stroke-[2]", liked && "fill-[#FF385C]")} />
                {likeCount.toLocaleString()} Kudos
              </button>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#222222]">
                <MessageCircle className="w-5 h-5 stroke-[2]" />
                {post.replies} Replies
              </span>
              <button className="ml-auto flex items-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222222] transition-colors">
                <Flag className="w-4 h-4 stroke-[2]" /> Report
              </button>
            </div>

            {/* ── Replies ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
                {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
              </h2>

              {replies.length > 0 && (
                <div className="mb-8">
                  {replies.map(r => <ReplyCard key={r.id} reply={r} />)}
                </div>
              )}

              {/* Reply composer */}
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
                    disabled={!replyText.trim()}
                    className="px-5 py-2.5 rounded-lg bg-[#222222] hover:bg-black text-white text-[14px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Post reply
                  </button>
                </div>
              </div>
            </section>

            {/* ── Related posts ────────────────────────────────────────── */}
            {relatedPosts.length > 0 && (
              <section className="mt-14 pt-10 border-t border-[#EBEBEB]">
                <h2 className="text-[20px] font-semibold text-[#222222] mb-6">Related discussions</h2>
                <div className="space-y-5">
                  {relatedPosts.map(p => (
                    <Link key={p.id} href={`/community/${p.slug}`} className="block group">
                      <div className="flex items-start gap-4 p-4 rounded-xl border border-[#EBEBEB] hover:border-[#222222] hover:shadow-sm transition-all">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-[#222222] text-white text-[12px] font-semibold">
                            {p.author.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-[#222222] leading-snug group-hover:underline line-clamp-2 mb-1">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-3 text-[12px] text-[#717171]">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{p.likes}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{p.replies}</span>
                            <span>{p.time}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#B0B0B0] shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ── Right sidebar ────────────────────────────────────────────── */}
          <aside className="hidden xl:block w-[280px] shrink-0 space-y-8 lg:sticky lg:top-20">

            {/* Author card */}
            <div className="rounded-2xl border border-[#DDDDDD] p-6 bg-white">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#B0B0B0] mb-4">About the author</p>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
                    {post.author.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[15px] font-semibold text-[#222222]">{post.author.name}</p>
                  <p className="text-[13px] text-[#717171]">{post.author.role}</p>
                </div>
              </div>
              {authorProfile ? (
                <Link
                  href={`/community/author/${authorProfile.username}`}
                  className="block w-full py-2.5 rounded-lg border border-[#222222] text-[14px] font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors text-center"
                >
                  View profile
                </Link>
              ) : (
                <button className="w-full py-2.5 rounded-lg border border-[#DDDDDD] text-[14px] font-semibold text-[#717171] cursor-not-allowed" disabled>
                  View profile
                </button>
              )}
            </div>

            {/* Post stats */}
            <div>
              <p className="text-[14px] font-semibold text-[#222222] mb-4">Post stats</p>
              <div className="space-y-3">
                {[
                  { icon: ThumbsUp, label: "Kudos", value: post.likes.toLocaleString() },
                  { icon: MessageCircle, label: "Replies", value: post.replies.toLocaleString() },
                  { icon: Eye, label: "Views", value: post.views.toLocaleString() },
                  { icon: Clock, label: "Posted", value: post.time },
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

            {/* Top contributors */}
            <div className="pt-8 border-t border-[#EBEBEB]">
              <p className="text-[14px] font-semibold text-[#222222] mb-4">Top contributors</p>
              <div className="space-y-4">
                {MEMBERS.map(m => (
                  <div key={m.name} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-[#222222] text-white text-[12px] font-semibold">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[14px] font-semibold text-[#222222]">{m.name} {m.badge}</p>
                      <p className="text-[12px] text-[#717171]">{m.role}</p>
                    </div>
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
