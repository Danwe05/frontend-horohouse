"use client"

import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewsProps {
  propertyId: string;
}

const Reviews = ({ propertyId }: ReviewsProps) => {
  const reviews = [
    {
      name: "Emily Rodriguez",
      date: "2 months ago",
      rating: 5,
      comment: "Fantastic apartment in a great location! The landlord is very responsive and the building is well-maintained. Highly recommend!",
    },
    {
      name: "Michael Chen",
      date: "4 months ago",
      rating: 5,
      comment: "Lived here for a year and loved every minute. Great amenities, friendly neighbors, and close to everything you need.",
    },
    {
      name: "Jessica Thompson",
      date: "6 months ago",
      rating: 4,
      comment: "Nice place with modern finishes. The only downside is parking can be tight during peak hours, but overall a great rental.",
    },
  ];

  const ratings = [
    { stars: 5, count: 24, percentage: 75 },
    { stars: 4, count: 6, percentage: 19 },
    { stars: 3, count: 2, percentage: 6 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  return (
    <section className="bg-card rounded-2xl p-6 space-y-6">
      <h2 className="text-2xl font-bold">Tenant Reviews</h2>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold">4.8</span>
            <span className="text-muted-foreground mb-2">out of 5</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 fill-warning text-warning" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Based on 32 reviews</p>
        </div>

        <div className="space-y-3">
          {ratings.map((rating) => (
            <div key={rating.stars} className="flex items-center gap-3">
              <span className="text-sm font-medium w-8">{rating.stars} ★</span>
              <Progress value={rating.percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-8 text-right">{rating.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4 pt-4 border-t border-border">
        {reviews.map((review, idx) => (
          <div key={idx} className="space-y-3 pb-4 border-b border-border last:border-0">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-white font-semibold">
                  {review.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">{review.name}</p>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${star <= review.rating ? 'fill-warning text-warning' : 'text-border'}`} 
                    />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed">{review.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Reviews;
