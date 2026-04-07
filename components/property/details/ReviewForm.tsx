"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  propertyId: string;
  onSubmit: (data: { rating: number; comment: string }) => Promise<boolean>;
  onCancel?: () => void;
  initialRating?: number;
  initialComment?: string;
  submitLabel?: string;
}

export default function ReviewForm({
  propertyId,
  onSubmit,
  onCancel,
  initialRating = 0,
  initialComment = "",
  submitLabel = "Submit review",
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="bg-[#F7F7F7] border border-[#DDDDDD] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <p className="text-[16px] text-[#222222] font-semibold mb-2">
          Want to share your experience?
        </p>
        <p className="text-[15px] text-[#717171] mb-6">
          You must be logged in to leave a review.
        </p>
        <Button
          onClick={() => router.push('/auth/login')}
          className="h-12 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors"
        >
          Sign in
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0 || comment.trim().length < 10) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({ rating, comment: comment.trim() });

    if (success) {
      setRating(0);
      setComment("");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Rating Section ── */}
      <div className="space-y-4">
        <label className="text-[18px] font-semibold text-[#222222] block">
          How was your stay?
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 -ml-1 transition-transform active:scale-95 focus:outline-none"
            >
              <Star
                className={`h-8 w-8 stroke-[1.5] transition-colors ${star <= (hoveredRating || rating)
                  ? "fill-[#222222] text-[#222222]"
                  : "fill-transparent text-[#DDDDDD]"
                  }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-[15px] font-medium text-[#222222] ml-2">
              {rating} / 5
            </span>
          )}
        </div>
      </div>

      {/* ── Review Text Section ── */}
      <div className="space-y-3">
        <label htmlFor="comment" className="text-[18px] font-semibold text-[#222222] block">
          Write a public review
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell future guests about what you loved and anything else they should know..."
          className="min-h-[140px] resize-none p-4 text-[15px] bg-white border border-[#DDDDDD] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-[#222222] focus-visible:border-blue-600 rounded-xl transition-colors"
          maxLength={1000}
        />
        <div className="flex justify-between text-[13px] font-medium text-[#717171] px-1">
          <span>Minimum 10 characters</span>
          <span>{comment.length} / 1000</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 px-8 rounded-lg font-semibold text-[15px] border-blue-600 text-[#222222] hover:bg-[#F7F7F7] transition-colors"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={rating === 0 || comment.trim().length < 10 || isSubmitting}
          className="w-full sm:w-auto h-12 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}