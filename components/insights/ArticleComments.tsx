"use client";

import { useState } from "react";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useInsightReviews } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
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
import { toast } from "sonner";

interface ArticleCommentsProps {
  insightId: string;
}

export default function ArticleComments({ insightId }: ArticleCommentsProps) {
  const [page, setPage] = useState(1);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  const { user } = useAuth();
  const { reviews, loading, error, totalPages, createReview, deleteReview } =
    useInsightReviews(insightId, page, 10);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    setIsSubmitting(true);
    const success = await createReview({ rating: 5, comment: commentText });
    if (success) setCommentText("");
    setIsSubmitting(false);
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;
    const success = await deleteReview(deleteReviewId);
    if (success) setDeleteReviewId(null);
  };

  return (
    <section className="pt-10 border-t border-[#EBEBEB] mt-10">
      {/* ── Header ── */}
      <h2 className="text-[18px] font-semibold text-[#222222] mb-8 flex items-center gap-2">
        Comments
        {reviews.length > 0 && (
          <span className="text-[14px] font-normal text-[#717171]">· {reviews.length}</span>
        )}
      </h2>

      {/* ── Write Comment ── */}
      {user ? (
        <div className="flex gap-4 mb-10">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user.profilePicture || ""} alt={user.name} />
            <AvatarFallback className="bg-[#EBEBEB] text-[#717171] text-[12px] font-semibold">
              {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share your thoughts..."
              className="resize-none min-h-[96px] border-[#DDDDDD] focus-visible:ring-0 focus-visible:border-[#222222] rounded-xl text-[14px] text-[#222222] placeholder:text-[#B0B0B0] transition-colors"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!commentText.trim() || isSubmitting}
                className="px-5 py-2.5 bg-[#222222] hover:bg-black text-white text-[13px] font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border border-[#EBEBEB] rounded-2xl px-6 py-5 mb-10">
          <p className="text-[14px] text-[#717171]">Sign in to join the discussion.</p>
          <button
            onClick={() => toast.info("Please log in to continue.")}
            className="text-[13px] font-semibold text-[#222222] underline underline-offset-2 hover:text-black transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && reviews.length === 0 && (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-[#EBEBEB] shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-[#EBEBEB] rounded w-28" />
                <div className="h-3 bg-[#EBEBEB] rounded w-full" />
                <div className="h-3 bg-[#EBEBEB] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <p className="text-[14px] text-[#717171] py-4">{error}</p>
      )}

      {/* ── Comments list ── */}
      {reviews.length > 0 && (
        <div className="space-y-8">
          {reviews.map((review) => (
            <div key={review._id} className="flex gap-4">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                  src={
                    review.userId?.profilePicture ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(review.userName || "U")}`
                  }
                  alt={review.userName}
                />
                <AvatarFallback className="bg-[#EBEBEB] text-[#717171] text-[12px] font-semibold">
                  {review.userName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#222222]">
                      {review.userName}
                    </span>
                    <span className="text-[12px] text-[#717171]">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {(user?.id === review.userId?._id || (user as any)?.role === "admin") && (
                    <button
                      onClick={() => setDeleteReviewId(review._id)}
                      className="text-[12px] text-[#717171] hover:text-[#222222] transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="text-[14px] text-[#222222] leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>

                {review.response && (
                  <div className="mt-3 pl-4 border-l-2 border-[#EBEBEB]">
                    <p className="text-[12px] font-semibold text-[#222222] mb-1">
                      Response from {review.respondedBy?.name || "Author"}
                    </p>
                    <p className="text-[13px] text-[#717171] leading-relaxed">
                      {review.response}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-[#EBEBEB]">
          <span className="text-[13px] text-[#717171]">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="w-9 h-9 rounded-full border border-[#DDDDDD] flex items-center justify-center text-[#222222] hover:border-[#222222] transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="w-9 h-9 rounded-full border border-[#DDDDDD] flex items-center justify-center text-[#222222] hover:border-[#222222] transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#DDDDDD] max-w-sm p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] font-semibold text-[#222222]">
              Delete comment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-[#717171] mt-1">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl h-11 px-5 font-semibold text-[14px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="rounded-xl h-11 px-5 bg-[#222222] hover:bg-black text-white font-semibold text-[14px]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}