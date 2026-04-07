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
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { cn } from "@/lib/utils";

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
      <DialogContent className="sm:max-w-[425px] p-6 sm:p-8 rounded-2xl border-[#DDDDDD] bg-white gap-0">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-[22px] font-semibold text-[#222222]">
            Report this listing
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#717171] mt-2">
            Help us keep listings accurate and trustworthy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pb-6 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-xl border text-[15px] transition-colors focus:outline-none",
                selected === reason
                  ? "border-blue-600 ring-1 ring-[#222222] bg-[#F7F7F7] font-semibold text-[#222222]"
                  : "border-[#DDDDDD] hover:border-blue-600 text-[#222222] font-medium"
              )}
            >
              {reason}
            </button>
          ))}

          {selected === "Other" && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <textarea
                placeholder="Please provide more details..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-4 text-[15px] text-[#222222] bg-white border border-[#DDDDDD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors placeholder:text-[#717171] resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#DDDDDD] pt-6 sm:justify-between flex-col-reverse sm:flex-row gap-3 sm:gap-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-3 text-[15px] font-semibold text-[#222222] underline hover:bg-[#F7F7F7] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center"
          >
            {isSubmitting ? "Submitting..." : "Submit report"}
          </button>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDDDDD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #717171;
        }
      `}</style>
    </Dialog>
  );
};