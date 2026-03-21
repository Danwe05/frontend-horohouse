"use client";

import { useState } from "react";
import { Star, ThumbsUp, Edit2, Trash2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    markAsHelpful,
  } = usePropertyReviews(propertyId, page, 10);

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
      <section className="bg-card rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-card rounded-2xl p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-8 mt-10">
      <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{pd?.tenantReviews || "Tenant Reviews"}</h2>
        {user && !userHasReviewed && !showReviewForm && (
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl"
          >
            {pd?.writeAReview || "Write a Review"}
          </Button>
        )}
      </div>

      {/* Show Review Form */}
      {showReviewForm && (
        <ReviewForm
          propertyId={propertyId}
          onSubmit={handleCreateReview}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 ? (
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-6xl font-black text-slate-900 tracking-tight leading-none">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-slate-500 font-medium mb-1.5">{pd?.outOfFive || "out of 5"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${star <= Math.round(averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                    }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-500">
              {pd?.basedOnReviews?.replace("{count}", stats.totalReviews.toString()) || `Based on ${stats.totalReviews} ${stats.totalReviews === 1 ? 'review' : 'reviews'}`}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[5, 4, 3, 2, 1].map((starRating) => (
              <div key={starRating} className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700 w-8">{starRating} ★</span>
                <Progress
                  value={getRatingPercentage(starRating)}
                  className="flex-1 h-2.5 bg-slate-100"
                />
                <span className="text-sm font-medium text-slate-500 w-8 text-right">
                  {stats.ratingDistribution[starRating as keyof typeof stats.ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium">{pd?.noReviewsYet || "No reviews yet. Be the first to review this property!"}</p>
        </div>
      )}

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-slate-100">
          {reviews.map((review) => {
            const comment = review.comment ?? '';
            const isExpanded = expandedReviews.has(review._id);
            const isLongComment = comment.length > 300;
            const displayComment = isExpanded || !isLongComment
              ? comment
              : `${comment.substring(0, 300)}...`;
            const isUserReview = review.userId._id === user?.id;

            return (
              <div
                key={review._id}
                className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100"
              >
                {editingReview === review._id ? (
                  <ReviewForm
                    propertyId={propertyId}
                    onSubmit={(data) => handleUpdateReview(review._id, data)}
                    onCancel={() => setEditingReview(null)}
                    initialRating={review.rating}
                    initialComment={review.comment}
                    submitLabel="Update Review"
                  />
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white ring-1 ring-slate-100">
                        <AvatarImage 
                          src={review.userId?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.userName || 'User')}&backgroundColor=ffdfbf`} 
                          alt={review.userName}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                          {review.userName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <p className="font-bold text-slate-900">{review.userName}</p>
                            {review.verified && (
                              <Badge className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 border-none text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-500">
                            {formatDistanceToNow(new Date(review.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                                }`}
                            />
                          ))}
                        </div>

                        <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                          {displayComment}
                        </p>

                        {isLongComment && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleExpanded(review._id)}
                            className="p-0 h-auto text-blue-600 font-bold hover:text-blue-700"
                          >
                            {isExpanded ? (
                              <>
                                Show less <ChevronUp className="h-4 w-4 ml-1" />
                              </>
                            ) : (
                              <>
                                Read more <ChevronDown className="h-4 w-4 ml-1" />
                              </>
                            )}
                          </Button>
                        )}

                        {/* Agent Response */}
                        {review.response && (
                          <>
                            <div className="mt-4 bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                <p className="text-sm font-bold text-slate-800">
                                  Response from {review.respondedBy?.name || 'Property Owner'}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-slate-600">
                                {review.response}
                              </p>
                              {review.respondedAt && (
                                <p className="text-xs font-medium text-slate-400">
                                  {formatDistanceToNow(new Date(review.respondedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-200/50">
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsHelpful(review._id)}
                              className="h-9 px-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-bold"
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Helpful ({review.helpfulCount})
                            </Button>
                          )}

                          {isUserReview && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingReview(review._id)}
                                className="h-9 px-3 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteReviewId(review._id)}
                                className="h-9 px-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm font-bold text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}