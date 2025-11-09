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
    <section className="bg-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tenant Reviews</h2>
        {user && !userHasReviewed && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
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
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground mb-2">out of 5</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-500 text-warning text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((starRating) => (
              <div key={starRating} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8">{starRating} ★</span>
                <Progress
                  value={getRatingPercentage(starRating)}
                  className="flex-1 h-2"
                />
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {stats.ratingDistribution[starRating as keyof typeof stats.ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this property!</p>
        </div>
      )}

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          {reviews.map((review) => {
            const isExpanded = expandedReviews.has(review._id);
            const isLongComment = review.comment.length > 300;
            const displayComment = isExpanded || !isLongComment
              ? review.comment
              : `${review.comment.substring(0, 300)}...`;
            const isUserReview = review.userId._id === user?.id;

            return (
              <div
                key={review._id}
                className="space-y-3 pb-4 border-b border-border last:border-0"
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
                    <div className="flex items-start gap-3">
                      <Avatar>
                        {review.userId.profilePicture && (
                          <AvatarImage src={review.userId.profilePicture} />
                        )}
                        <AvatarFallback className="bg-primary text-white font-semibold">
                          {review.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{review.userName}</p>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-yellow-500 text-warning text-yellow-500"
                                  : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                        
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {displayComment}
                        </p>
                        
                        {isLongComment && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleExpanded(review._id)}
                            className="p-0 h-auto"
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
                            <Separator className="my-3" />
                            <div className="bg-muted rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold">
                                  Response from {review.respondedBy?.name || 'Property Owner'}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {review.response}
                              </p>
                              {review.respondedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(review.respondedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-2">
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsHelpful(review._id)}
                              className="h-auto p-0 hover:bg-transparent"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                Helpful ({review.helpfulCount})
                              </span>
                            </Button>
                          )}

                          {isUserReview && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingReview(review._id)}
                                className="h-auto p-0 hover:bg-transparent text-primary"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                <span className="text-sm">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteReviewId(review._id)}
                                className="h-auto p-0 hover:bg-transparent text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="text-sm">Delete</span>
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
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
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