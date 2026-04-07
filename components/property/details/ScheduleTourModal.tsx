"use client"

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Loader2, Clock, Calendar as CalendarIcon, User, Mail, 
  Phone, MessageSquare, CheckCircle2, MapPin, Building2, 
  ChevronLeft, X, Video
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle?: string;
  propertyAddress?: string;
  agentId?: string;
  agentName?: string;
  initialDate?: Date;
  onScheduled?: () => void;
}

const timeslots = [
  { time: "09:00", label: "9:00 AM", period: "morning" },
  { time: "10:00", label: "10:00 AM", period: "morning" },
  { time: "11:00", label: "11:00 AM", period: "morning" },
  { time: "12:00", label: "12:00 PM", period: "afternoon" },
  { time: "13:00", label: "1:00 PM", period: "afternoon" },
  { time: "14:00", label: "2:00 PM", period: "afternoon" },
  { time: "15:00", label: "3:00 PM", period: "afternoon" },
  { time: "16:00", label: "4:00 PM", period: "afternoon" },
  { time: "17:00", label: "5:00 PM", period: "evening" },
];

const tourTypes = [
  { id: "in-person", label: "In-person", icon: Building2, description: "Visit the property" },
  { id: "virtual", label: "Video chat", icon: Video, description: "Take a virtual tour" },
];

export default function ScheduleTourModal({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  propertyAddress,
  agentId,
  agentName,
  initialDate,
  onScheduled
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"type" | "datetime" | "details">("type");
  const [tourType, setTourType] = useState<string>("in-person");
  const [date, setDate] = useState<Date | undefined>(initialDate ?? new Date());
  const [time, setTime] = useState<string>(timeslots[1].time);
  const [name, setName] = useState<string>(user?.name ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [phone, setPhone] = useState<string>(user?.phoneNumber ?? "");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("type");
      setSuccess(false);
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setPhone(user?.phoneNumber ?? "");
      setDate(initialDate ?? new Date());
      setTime(timeslots[1].time);
      setTourType("in-person");
      setMessage("");
    }
  }, [open, user, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Login required", { description: "Please log in to schedule a tour." });
      return;
    }

    if (!date) {
      toast.error("Date required", { description: "Please select a date." });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        propertyId,
        agentId,
        viewingDate: date.toISOString(),
        viewingTime: time,
        tourType,
        name,
        email,
        phone,
        message,
      };

      await apiClient.scheduleTour(payload as any);

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        onScheduled?.();
      }, 3000);
    } catch (err: any) {
      console.error('Schedule tour error:', err);
      toast.error("Failed to schedule tour", {
        description: err?.response?.data?.message || "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "details") setStep("datetime");
    else if (step === "datetime") setStep("type");
  };

  const canProceedToDateTime = tourType !== "";
  const canProceedToDetails = date !== undefined && time !== "";

  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";

  // ─── SUCCESS STATE ───
  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0 sm:rounded-2xl">
          <div className="flex items-center justify-end px-6 py-4 border-b border-[#EBEBEB]">
            <button onClick={() => onOpenChange(false)} className="p-2 -mr-2 rounded-full hover:bg-[#F7F7F7] transition-colors">
              <X className="w-5 h-5 text-[#222222]" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#EBFBF0] rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-[#008A05] stroke-[2.5]" />
            </div>
            <h3 className="text-[26px] font-semibold text-[#222222] mb-2 tracking-tight">Tour scheduled</h3>
            <p className="text-[16px] text-[#717171] mb-8 leading-relaxed max-w-[300px]">
              We've let {agentName || "the agent"} know you'd like to tour this property. They will contact you shortly to confirm.
            </p>
            
            <div className="w-full bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl p-5 space-y-3 text-left mb-2">
              <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                <CalendarIcon className="w-5 h-5 text-[#717171]" />
                <span className="font-semibold">{date && format(date, "EEEE, MMMM d")} at {timeslots.find(t => t.time === time)?.label}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                {tourType === "virtual" ? <Video className="w-5 h-5 text-[#717171]" /> : <Building2 className="w-5 h-5 text-[#717171]" />}
                <span>{tourTypes.find(t => t.id === tourType)?.label}</span>
              </div>
              {propertyAddress && tourType === "in-person" && (
                <div className="flex items-start gap-3 text-[15px] text-[#222222]">
                  <MapPin className="w-5 h-5 text-[#717171] shrink-0 mt-0.5" />
                  <span>{propertyAddress}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── MAIN FLOW ───
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0 sm:rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB]">
          <button 
            onClick={step === "type" ? () => onOpenChange(false) : handleBack} 
            className="p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors"
          >
            {step === "type" ? <X className="w-5 h-5 text-[#222222]" /> : <ChevronLeft className="w-5 h-5 text-[#222222]" />}
          </button>
          <h2 className="text-[16px] font-bold text-[#222222]">Request a tour</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Header Context */}
          <div className="mb-8">
            <h3 className="text-[26px] font-semibold text-[#222222] tracking-tight mb-2">
              {step === "type" && "How would you like to tour?"}
              {step === "datetime" && "When would you like to tour?"}
              {step === "details" && "Review your details"}
            </h3>
            {propertyTitle && (
              <p className="text-[15px] text-[#717171] truncate">{propertyTitle}</p>
            )}
          </div>

          {/* STEP 1: Tour Type */}
          {step === "type" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              {tourTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setTourType(type.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-xl border text-left transition-all",
                    tourType === type.id 
                      ? "border-[#222222] bg-[#F7F7F7] shadow-[0_0_0_1px_#222222]" 
                      : "border-[#DDDDDD] hover:border-[#222222]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <type.icon className={cn("w-6 h-6", tourType === type.id ? "text-[#222222]" : "text-[#717171]")} />
                    <div>
                      <div className="text-[16px] font-semibold text-[#222222]">{type.label}</div>
                      <div className="text-[14px] text-[#717171] mt-0.5">{type.description}</div>
                    </div>
                  </div>
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", tourType === type.id ? "border-[#222222] bg-[#222222]" : "border-[#DDDDDD]")}>
                    {tourType === type.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Date & Time */}
          {step === "datetime" && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              
              <div>
                <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">Select a date</Label>
                <div className="flex justify-center border border-[#DDDDDD] rounded-xl p-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { if (d) setDate(d); }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-0 font-sans"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">Select a time</Label>
                <div className="grid grid-cols-3 gap-3">
                  {timeslots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setTime(slot.time)}
                      className={cn(
                        "h-12 rounded-xl text-[14px] font-semibold border transition-all",
                        slot.time === time
                          ? "border-[#222222] bg-[#222222] text-white shadow-md"
                          : "border-[#DDDDDD] bg-white text-[#222222] hover:border-[#222222]"
                      )}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Contact Details */}
          {step === "details" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Summary Card */}
              <div className="bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl p-5 space-y-3 mb-6">
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#717171]">Tour type</span>
                  <span className="font-semibold text-[#222222]">{tourTypes.find(t => t.id === tourType)?.label}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-[#717171]">Date & Time</span>
                  <span className="font-semibold text-[#222222]">
                    {date && format(date, "MMM d, yyyy")} · {timeslots.find(t => t.time === time)?.label}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[15px] font-semibold text-[#222222] mb-2 block">Full legal name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className={inputClasses}
                  />
                </div>

                <div>
                  <Label className="text-[15px] font-semibold text-[#222222] mb-2 block">Phone number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +237 600 000 000"
                    required
                    className={inputClasses}
                  />
                </div>

                <div>
                  <Label className="text-[15px] font-semibold text-[#222222] mb-2 block">Email address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    required
                    className={inputClasses}
                  />
                </div>

                <div>
                  <Label className="text-[15px] font-semibold text-[#222222] mb-2 block">Message to agent (optional)</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any specific questions or requirements?"
                    className="w-full px-4 py-3 border border-[#B0B0B0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent resize-none text-[16px] text-[#222222] placeholder:text-[#717171] min-h-[100px] transition-all"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#EBEBEB] bg-white">
          {step === "type" && (
            <Button
              onClick={() => setStep("datetime")}
              disabled={!canProceedToDateTime}
              className="w-full h-14 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors"
            >
              Continue
            </Button>
          )}

          {step === "datetime" && (
            <Button
              onClick={() => setStep("details")}
              disabled={!canProceedToDetails}
              className="w-full h-14 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors"
            >
              Next
            </Button>
          )}

          {step === "details" && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !name || !email || !phone}
              className="w-full h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] transition-colors active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request tour"}
            </Button>
          )}
        </div>

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
          background: #B0B0B0;
        }
      `}</style>
    </Dialog>
  );
}