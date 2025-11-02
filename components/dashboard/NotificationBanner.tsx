"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export const NotificationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-accent text-accent-foreground p-4 rounded-lg flex items-start gap-3 relative">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-primary" />
      </div>
      
      <div className="flex-1">
        <p className="font-semibold mb-1">
          74 Tenant has been submitted recently, please check it out!
        </p>
        <p className="text-sm opacity-90">
          There are some issues has been found, review it and approve.
        </p>
      </div>

      <Button 
        variant="secondary" 
        size="sm"
        className="flex-shrink-0"
      >
        Review Listings
      </Button>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
