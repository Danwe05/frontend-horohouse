"use client";

import { useState } from "react";
import { Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePropertyReviews } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ReviewForm from "./ReviewForm";
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

interface ReviewsProps {
  propertyId: string;
}

export default function Reviews({ propertyId }: ReviewsProps) {
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const { user } = useAuth();
  const {
    reviews,
    stats,
    loading,
    error,
    totalPages,
    averageRating,
    createReview,
    updateReview,
    deleteReview,
  } = usePropertyReviews(propertyId, page, 6); // Set to 6 to fit a nice 2-column grid

  const userHasReviewed = reviews.some(
    (review) => review.userId._id === user?.id
  );

  const handleCreateReview = async (data: { rating: number; comment: string }) => {
    const success = await createReview(data);
    if (success) {
      setShowReviewForm(false);
    }
    return success;
  };

  const handleUpdateReview = async (reviewId: string, data: { rating: number; comment: string }) => {
    const success = await updateReview(reviewId, data);
    if (success) {
      setEditingReview(null);
    }
    return success;
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;

    const success = await deleteReview(deleteReviewId);
    if (success) {
      setDeleteReviewId(null);
    }
  };

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const getRatingPercentage = (starRating: number) => {
    if (!stats?.totalReviews) return 0;
    return (stats.ratingDistribution[starRating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100;
  };

  if (loading && reviews.length === 0) {
    return (
      <section className="py-8 border-b border-[#DDDDDD] animate-pulse">
        <div className="h-8 bg-[#F7F7F7] rounded w-1/4 mb-8"></div>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="h-4 bg-[#F7F7F7] rounded w-full"></div>
          <div className="h-4 bg-[#F7F7F7] rounded w-full"></div>
          <div className="h-4 bg-[#F7F7F7] rounded w-full"></div>
          <div className="h-4 bg-[#F7F7F7] rounded w-full"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 border-b border-[#DDDDDD]">
        <Alert className="bg-[#FFF8F8] border-[#FFDFDF]">
          <AlertDescription className="text-[#E50000]">{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="text-[#222222] space-y-8">
      {/* ── Header & Rating Summary ── */}
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
        <h2 className="text-[22px] font-semibold tracking-tight">
          {stats?.totalReviews && stats.totalReviews > 0
            ? `${averageRating.toFixed(2)} · ${stats.totalReviews} ${stats.totalReviews === 1 ? 'review' : 'reviews'}`
            : pd?.tenantReviews || "No reviews (yet)"
          }
        </h2>
      </div>

      {stats && stats.totalReviews > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-3 mb-10">
          {[5, 4, 3, 2, 1].map((starRating) => (
            <div key={starRating} className="flex items-center justify-between text-[14px]">
              <span className="text-[#222222] w-6">{starRating}</span>
              <div className="flex-1 mx-4 h-1 bg-[#DDDDDD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${getRatingPercentage(starRating)}%` }}
                />
              </div>
              <span className="text-[#222222] w-8 text-right font-medium">
                {stats.ratingDistribution[starRating as keyof typeof stats.ratingDistribution]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Show Review Form */}
      {showReviewForm && (
        <div className="pb-8">
          <ReviewForm
            propertyId={propertyId}
            onSubmit={handleCreateReview}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Individual Reviews Grid */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {reviews.map((review) => {
            const comment = review.comment ?? '';
            const isExpanded = expandedReviews.has(review._id);
            const isLongComment = comment.length > 150;
            const displayComment = isExpanded || !isLongComment
              ? comment
              : `${comment.substring(0, 150)}...`;

            return (
              <div key={review._id} className="space-y-4">
                {editingReview === review._id ? (
                  <ReviewForm
                    propertyId={propertyId}
                    onSubmit={(data) => handleUpdateReview(review._id, data)}
                    onCancel={() => setEditingReview(null)}
                    initialRating={review.rating}
                    initialComment={review.comment}
                    submitLabel="Update"
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 bg-[#EBEBEB]">
                        <AvatarImage
                          src={review.userId?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.userName || 'User')}&backgroundColor=dddddd`}
                          alt={review.userName}
                        />
                        <AvatarFallback className="text-[#222222] font-semibold text-[16px]">
                          {review.userName?.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[16px] font-semibold text-[#222222]">{review.userName}</p>
                        <p className="text-[14px] text-[#717171]">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-[#DDDDDD]"}`}
                        />
                      ))}
                    </div>

                    <div>
                      <p className="text-[16px] text-[#222222] leading-relaxed whitespace-pre-wrap">
                        {displayComment}
                      </p>
                      {isLongComment && (
                        <button
                          onClick={() => toggleExpanded(review._id)}
                          className="flex items-center text-[16px] font-semibold text-[#222222] underline hover:text-black mt-2 transition-colors bg-transparent border-none p-0 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                          ) : (
                            <>Show more <ChevronDown className="h-4 w-4 ml-1" /></>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Agent Response */}
                    {review.response && (
                      <div className="mt-4 pl-4 border-l-2 border-[#DDDDDD] space-y-2">
                        <p className="text-[14px] font-semibold text-[#222222]">
                          Response from {review.respondedBy?.name || 'Host'}
                        </p>
                        <p className="text-[15px] text-[#717171] leading-relaxed">
                          {review.response}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination & Write Review Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#DDDDDD] mt-8">

        {/* Write review button (Left side) */}
        {user && !userHasReviewed && !showReviewForm ? (
          <Button
            onClick={() => setShowReviewForm(true)}
            variant="outline"
            className="rounded-lg h-12 px-6 border-blue-600 text-[#222222] font-semibold text-[15px] hover:bg-[#F7F7F7] transition-colors w-full sm:w-auto"
          >
            {pd?.writeAReview || "Write a review"}
          </Button>
        ) : (
          <div className="hidden sm:block" /> /* Spacer */
        )}

        {/* Pagination controls (Right side) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[14px] text-[#717171] font-medium block sm:hidden">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-10 w-10 rounded-full border-[#DDDDDD] text-[#222222] hover:border-blue-600 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5 stroke-[2]" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-10 w-10 rounded-full border-[#DDDDDD] text-[#222222] hover:border-blue-600 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5 stroke-[2]" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent className="rounded-2xl p-8 border-[#DDDDDD] shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[22px] font-semibold text-[#222222]">Delete review?</AlertDialogTitle>
            <AlertDialogDescription className="text-[16px] text-[#717171] mt-2">
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-lg h-12 px-6 font-semibold text-[15px] border-blue-600 text-[#222222] hover:bg-[#F7F7F7] mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview} className="rounded-lg h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}