"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import apiClient from "@/lib/api";

const REPORT_REASONS = [
  "Incorrect information",
  "Duplicate listing",
  "Fraudulent / scam",
  "Offensive content",
  "Property no longer available",
  "Other",
];

interface ReportModalProps {
  propertyId: string;
  open: boolean;
  onClose: () => void;
}

export const ReportModal = ({ propertyId, open, onClose }: ReportModalProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      // Call your API — adjust endpoint as needed
      await apiClient.reportProperty(propertyId, {
        reason: selected,
        details,
      });
      toast.success("Report submitted", {
        description: "Thank you. Our team will review this listing.",
      });
      onClose();
    } catch {
      toast.error("Failed to submit report", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelected(null);
      setDetails("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
          <DialogDescription>
            Help us keep listings accurate and trustworthy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${selected === reason
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/50 hover:bg-muted"
                }`}
            >
              {reason}
            </button>
          ))}
        </div>

        {selected === "Other" && (
          <Textarea
            placeholder="Please provide more details..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="resize-none"
            rows={3}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};