"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
      <DialogContent className="sm:max-w-[480px] p-0 rounded-[16px] border-[#DDDDDD] bg-white gap-0 overflow-hidden font-sans antialiased shadow-xl [&>button]:hidden">
        {/* Airbnb-style Header: Close left, Title center */}
        <DialogHeader className="relative flex flex-row items-center justify-center p-6 border-b border-[#EBEBEB]">
          <button 
            onClick={onClose}
            className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors active:scale-95"
          >
            <X className="w-5 h-5 text-[#222222]" strokeWidth={2} />
            <span className="sr-only">Close</span>
          </button>
          <DialogTitle className="text-[16px] font-semibold tracking-tight text-[#222222] m-0">
            Report this listing
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <p className="text-[22px] font-semibold text-[#222222] mb-6 leading-tight">
            Why are you reporting this listing?
          </p>

          <div className="space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelected(reason)}
                className="w-full flex items-center justify-between py-4 border-b border-[#EBEBEB] last:border-0 group focus:outline-none"
              >
                <span className="text-[16px] text-[#222222]">{reason}</span>
                {/* Radio button indicator */}
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  selected === reason ? "border-[#222222]" : "border-[#DDDDDD] group-hover:border-[#717171]"
                )}>
                  {selected === reason && (
                    <div className="w-3 h-3 bg-[#222222] rounded-full" />
                  )}
                </div>
              </button>
            ))}

            {selected === "Other" && (
              <div className="pt-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <textarea
                  placeholder="Please provide more details to help us understand..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-4 text-[16px] text-[#222222] bg-white border border-[#B0B0B0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent transition-shadow placeholder:text-[#717171] resize-none"
                  rows={4}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-[#EBEBEB] bg-white">
          <button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            className="w-full bg-[#222222] hover:bg-black text-white font-semibold text-[16px] py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isSubmitting ? "Submitting..." : "Submit report"}
          </button>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDDDDD;
          border-radius: 10px;
          border: 2px solid white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B0B0B0;
        }
      `}</style>
    </Dialog>
  );
};