"use client"

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Clock, Calendar as CalendarIcon, User, Mail, Phone, MessageSquare, CheckCircle2, MapPin, Building2 } from "lucide-react";

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
  { id: "in-person", label: "In-Person Tour", icon: Building2, description: "Visit the property" },
  { id: "virtual", label: "Virtual Tour", icon: CalendarIcon, description: "Video call tour" },
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
      toast.error("Login required to schedule a tour");
      return;
    }

    if (!date) {
      toast.error("Please choose a date");
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
      toast.success("Tour scheduled successfully!", {
        description: "The agent will contact you to confirm."
      });

      setTimeout(() => {
        onOpenChange(false);
        onScheduled?.();
      }, 2000);
    } catch (err: any) {
      console.error('Schedule tour error:', err);
      toast.error("Failed to schedule tour", {
        description: err?.response?.data?.message || "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedToDateTime = tourType !== "";
  const canProceedToDetails = date !== undefined && time !== "";

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tour Scheduled!</h3>
            <p className="text-gray-600 mb-6 max-w-sm">
              Your tour request has been sent. {agentName || "The agent"} will contact you shortly to confirm the details.
            </p>
            <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-left mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{date && format(date, "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{timeslots.find(t => t.time === time)?.label}</span>
              </div>
              {propertyAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 text-xs">{propertyAddress}</span>
                </div>
              )}
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-primary" />
            Schedule a Tour
          </DialogTitle>
          {propertyTitle && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
              <p className="font-medium text-sm text-gray-900">{propertyTitle}</p>
              {propertyAddress && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {propertyAddress}
                </p>
              )}
            </div>
          )}
          <DialogDescription>
            {step === "type" && "Choose how you'd like to tour this property"}
            {step === "datetime" && "Select your preferred date and time"}
            {step === "details" && "Complete your contact information"}
          </DialogDescription>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 pt-2">
            {["type", "datetime", "details"].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step === s ? "bg-primary text-white" :
                    ["type", "datetime"].indexOf(step) > idx ? "bg-green-500 text-white" :
                      "bg-gray-200 text-gray-500"
                    }`}>
                    {["type", "datetime"].indexOf(step) > idx ? "✓" : idx + 1}
                  </div>
                  <span className={`text-xs font-medium ${step === s ? "text-gray-900" : "text-gray-500"}`}>
                    {s === "type" ? "Type" : s === "datetime" ? "Date & Time" : "Details"}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`h-px flex-1 transition-colors ${["type", "datetime"].indexOf(step) > idx ? "bg-green-500" : "bg-gray-200"
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Tour Type */}
          {step === "type" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <Label className="text-base font-semibold">Tour Type</Label>
              <div className="grid grid-cols-1 gap-3">
                {tourTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTourType(type.id)}
                    className={`relative flex items-start gap-4 p-4 rounded-lg border-1 transition-all text-left ${tourType === type.id
                      ? "border-primary bg-primary/5 -sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tourType === type.id ? "bg-primary/10" : "bg-gray-100"
                      }`}>
                      <type.icon className={`w-5 h-5 ${tourType === type.id ? "text-primary" : "text-gray-600"
                        }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{type.description}</div>
                    </div>
                    {tourType === type.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary absolute top-4 right-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === "datetime" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Date</Label>
                <div className="border rounded-lg p-2 bg-white">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md w-full border-0"
                  />
                </div>
                {date && (
                  <p className="text-sm text-primary font-medium mt-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(date, "EEEE, MMMM d, yyyy")}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Select Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeslots.map((slot) => (
                    <button
                      type="button"
                      key={slot.time}
                      onClick={() => setTime(slot.time)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border-1 transition-all ${slot.time === time
                        ? "border-primary bg-primary text-white -sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        <Clock className="w-4 h-4 mb-1" />
                        <span>{slot.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact Details */}
          {step === "details" && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <User className="w-4 h-4 text-gray-500" />
                    Full Name *
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Phone Number *
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email Address *
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Additional Message (Optional)
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any specific requirements or questions..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tour Summary</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">
                      {tourTypes.find(t => t.id === tourType)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {date && format(date, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">
                      {timeslots.find(t => t.time === time)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {step !== "type" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === "details") setStep("datetime");
                else if (step === "datetime") setStep("type");
              }}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
          )}

          {step === "type" && (
            <Button
              type="button"
              onClick={() => setStep("datetime")}
              disabled={!canProceedToDateTime}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90"
            >
              Continue
            </Button>
          )}

          {step === "datetime" && (
            <Button
              type="button"
              onClick={() => setStep("details")}
              disabled={!canProceedToDetails}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90"
            >
              Continue
            </Button>
          )}

          {step === "details" && (
            <Button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Tour
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}