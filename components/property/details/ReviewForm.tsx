"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  submitLabel = "Submit Review",
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-4">
          You must be logged in to leave a review
        </p>
        <Button onClick={() => router.push('/auth/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      return;
    }

    if (comment.trim().length < 10) {
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-lg p-6 border border-border">
      <div className="space-y-2">
        <Label>Your Rating *</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-500 text-warning text-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {rating} out of 5
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Your Review *</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this property... (minimum 10 characters)"
          className="min-h-[120px] resize-none"
          maxLength={1000}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Minimum 10 characters</span>
          <span>{comment.length}/1000</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={rating === 0 || comment.trim().length < 10 || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}