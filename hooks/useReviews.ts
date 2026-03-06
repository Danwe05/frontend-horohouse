import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Review, ReviewStats, ReviewsResponse } from '@/types/review';
import { toast } from 'sonner';

export function usePropertyReviews(propertyId: string, page: number = 1, limit: number = 10) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reviewsData, statsData] = await Promise.all([
        apiClient.getPropertyReviews(propertyId, { page, limit, sortBy: 'createdAt', sortOrder: 'desc' }),
        apiClient.getPropertyReviewStats(propertyId),
      ]);

      setReviews(reviewsData.reviews);
      setTotalPages(reviewsData.totalPages);
      setAverageRating(reviewsData.averageRating);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchReviews();
    }
  }, [propertyId, page, limit]);

  const createReview = async (data: {
    rating: number;
    comment: string;
    images?: string[];
  }) => {
    try {
      await apiClient.createReview({
        reviewType: 'property',
        propertyId,
        ...data,
      });

      toast.success('Success', {
        description: 'Your review has been submitted successfully!',
      });

      // Refresh reviews
      await fetchReviews();
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit review';
      toast.error('Error', {
        description: errorMessage,
      });
      return false;
    }
  };

  const updateReview = async (reviewId: string, data: {
    rating?: number;
    comment?: string;
    images?: string[];
  }) => {
    try {
      await apiClient.updateReview(reviewId, data);

      toast.success('Success', {
        description: 'Your review has been updated successfully!',
      });

      await fetchReviews();
      return true;
    } catch (err: any) {
      toast.error('Error', {
        description: err.response?.data?.message || 'Failed to update review',
      });
      return false;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await apiClient.deleteReview(reviewId);

      toast.success('Success', {
        description: 'Your review has been deleted',
      });

      await fetchReviews();
      return true;
    } catch (err: any) {
      toast.error('Error', {
        description: err.response?.data?.message || 'Failed to delete review',
      });
      return false;
    }
  };

  const markAsHelpful = async (reviewId: string) => {
    try {
      await apiClient.markReviewAsHelpful(reviewId);
      
      // Update the local state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? { ...review, helpfulCount: review.helpfulCount + 1 }
            : review
        )
      );
      
      return true;
    } catch (err: any) {
      toast.error('Error', {
        description: err.response?.data?.message || 'Failed to mark review as helpful',
      });
      return false;
    }
  };

  return {
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
    refetch: fetchReviews,
  };
}