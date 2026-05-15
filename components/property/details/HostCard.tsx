"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Star, ShieldCheck, MessageCircle, Mail, Phone,
  Briefcase, Clock, MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HostCardProps {
  property: {
    _id: string;
    title: string;
    agentId: any;
    ownerId: any;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContact(property: HostCardProps["property"]) {
  const a = property.agentId;
  const o = property.ownerId;
  if (a && typeof a === "object" && (a._id || a.id))
    return { ...a, _id: a._id ?? a.id, role: "agent" as const };
  if (o && typeof o === "object" && (o._id || o.id))
    return { ...o, _id: o._id ?? o.id, role: "owner" as const };
  return null;
}

function getYearHosting(createdAt?: string): number {
  if (!createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
}

const QUICK_TEMPLATES = (title: string) => [
  { label: "Ask availability", text: `Hi! Is ${title} still available?` },
  { label: "Schedule viewing", text: `Hi! I'd like to schedule a viewing for ${title}.` },
  { label: "Request details", text: `Hi! Can you share more details about ${title}?` },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HostCard({ property }: HostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { createConversation } = useChatContext();
  const router = useRouter();

  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const contact = useMemo(() => getContact(property), [property]);
  if (!contact) return null;

  const name: string      = contact.name ?? "Host";
  const role: string      = contact.role === "agent" ? "Agent" : "Host";
  const initials          = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const yearHosting       = getYearHosting(contact.createdAt);
  const reviews: number   = contact.totalReviews ?? 0;
  const rating: number    = contact.rating ? Number(contact.rating) : 0;
  const responseRate      = contact.responseRate ?? 91;
  const isSelf            = !!(user && contact._id?.toString() === (user.id ?? user._id)?.toString());

  const goAuth = useCallback(() =>
    router.push(`/auth/login?redirect=/properties/${property._id}`),
    [router, property._id]);

  const handleQuickMessage = useCallback(async () => {
    if (!isAuthenticated) { goAuth(); return; }
    if (isSelf) { toast.error("You can't message yourself"); return; }
    setIsSending(true);
    try {
      await createConversation(
        contact._id.toString(), property._id.toString(),
        `Hi! I'm interested in ${property.title}. Is it still available?`
      );
      router.push("/dashboard/message");
    } catch (err: any) {
      toast.error("Failed to send message", { description: err?.message });
    } finally { setIsSending(false); }
  }, [isAuthenticated, isSelf, contact._id, property._id, property.title, createConversation, router, goAuth]);

  const handleSend = useCallback(async () => {
    if (!message.trim()) { toast.error("Please enter a message"); return; }
    setIsSending(true);
    try {
      await createConversation(contact._id.toString(), property._id.toString(), message.trim());
      setIsMessageOpen(false);
      setMessage("");
      router.push("/dashboard/message");
    } catch (err: any) {
      toast.error("Failed to send message", { description: err?.message });
    } finally { setIsSending(false); }
  }, [message, contact._id, property._id, createConversation, router]);

  const stats = [
    { value: reviews,                               label: `Review${reviews !== 1 ? "s" : ""}` },
    { value: rating > 0 ? `${rating.toFixed(2)}★` : "—", label: "Rating" },
    { value: yearHosting,                           label: `Year${yearHosting !== 1 ? "s" : ""} hosting` },
  ];

  return (
    <>
      <section className="py-12 border-t border-[#DDDDDD]">
        <h2 className="text-[22px] font-semibold tracking-tight mb-7 text-[#222222]">Meet your host</h2>

        {/* ══════════════════════════════════════════════
            Two-column: [card] | [host details + CTA]
        ══════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">

          {/* ── Left: host card ── */}
          <div className="shrink-0 w-full sm:w-[350px] rounded-3xl border border-[#DDDDDD] shadow-sm overflow-hidden bg-white">
            <div className="flex h-full">

              {/* Avatar + name (left part of card) */}
              <div className="flex flex-col items-center justify-between gap-1 px-5 py-6 flex-1">
                <div className="relative">
                  <Avatar className="h-[80px] w-[80px]">
                    {contact.profilePicture && (
                      <AvatarImage src={contact.profilePicture} alt={name} />
                    )}
                    <AvatarFallback className="bg-blue-600 text-white text-[22px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Verified badge */}
                  <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow">
                    <ShieldCheck className="w-3 h-3 text-white stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-[16px] font-bold text-[#222222] leading-tight">{name}</p>
                  <p className="text-[13px] text-[#717171] mt-0.5">{role}</p>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="w-px bg-[#DDDDDD] self-stretch" />

              {/* Stats (right part of card) */}
              <div className="flex flex-col divide-y divide-[#DDDDDD] min-w-[100px]">
                {stats.map(({ value, label }) => (
                  <div key={label} className="flex-1 flex flex-col items-center justify-center px-4 py-3">
                    <span className="text-[20px] font-bold text-[#222222] leading-none">{value}</span>
                    <span className="text-[12px] text-[#717171] mt-1 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ── Right: host details + CTA ── */}
          <div className="flex-1 space-y-5 pt-1">
            <div>
              <p className="text-[16px] font-semibold text-[#222222] mb-3">Host details</p>
              <div className="space-y-1.5 text-[15px] text-[#222222]">
                <p>Response rate: <span className="font-medium">{responseRate}%</span></p>
                <p>Responds within an hour</p>
              </div>
            </div>

            {/* Message host button — outline style like Airbnb */}
            {!isAuthenticated ? (
              <button
                onClick={goAuth}
                className="h-11 px-6 rounded-lg text-[15px] font-semibold text-[#222222] border border-[#222222] hover:bg-[#F7F7F7] transition-colors"
              >
                Log in to message
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleQuickMessage}
                  disabled={isSending || isSelf}
                  className="h-11 px-6 rounded-lg text-[15px] font-semibold text-[#222222] border border-[#222222] hover:bg-[#F7F7F7] transition-colors disabled:opacity-40"
                >
                  {isSending ? "Sending…" : "Message host"}
                </button>
                {contact.phoneNumber && (
                  <button
                    onClick={() => { window.location.href = `tel:${contact.phoneNumber}`; }}
                    className="h-11 px-4 rounded-lg text-[15px] font-medium text-[#717171] border border-[#DDDDDD] hover:border-[#222222] hover:text-[#222222] transition-colors"
                  >
                    <Phone className="w-4 h-4 stroke-[2]" />
                  </button>
                )}
              </div>
            )}

            {/* Divider + safety note */}
            <div className="border-t border-[#EBEBEB] pt-5">
              <p className="text-[13px] text-[#717171] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#c12b3a]" aria-hidden />
                To help protect your payment, always use Horohouse to send money and communicate with hosts.
              </p>
            </div>
          </div>
        </div>

        {/* ── Bio bullets — below the 2-col section ── */}
        {(contact.work || contact.spendTime) && (
          <div className="mt-8 space-y-3">
            {contact.work && (
              <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                <Briefcase className="w-5 h-5 stroke-[1.5] text-[#717171] shrink-0" aria-hidden />
                <span>My work: {contact.work}</span>
              </div>
            )}
            {contact.spendTime && (
              <div className="flex items-center gap-3 text-[15px] text-[#222222]">
                <Clock className="w-5 h-5 stroke-[1.5] text-[#717171] shrink-0" aria-hidden />
                <span>I spend too much time: {contact.spendTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Write message fallback button (below, secondary) */}
        {isAuthenticated && !isSelf && (
          <button
            onClick={() => setIsMessageOpen(true)}
            className="mt-4 flex items-center gap-2 text-[14px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors"
          >
            <Mail className="w-4 h-4 stroke-[2]" />
            Write a custom message
          </button>
        )}
      </section>

      {/* ── Write message dialog ── */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-[500px] p-8 border-[#DDDDDD] rounded-2xl shadow-2xl">
          <DialogHeader className="mb-5 space-y-1.5 text-left">
            <DialogTitle className="text-[20px] font-semibold text-[#222222]">
              Contact {name}
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#717171]">
              Ask a question about {property.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi! I'm interested in ${property.title}…`}
              rows={5}
              className="resize-none text-[15px] p-4 bg-white border-[#DDDDDD] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES(property.title).map(({ label, text }) => (
                <button
                  key={label}
                  onClick={() => setMessage(text)}
                  className="rounded-full border border-[#DDDDDD] text-[13px] font-medium text-[#222222] px-3 py-1.5 hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setIsMessageOpen(false)}
              className="w-full sm:w-1/2 h-11 rounded-xl font-semibold text-[15px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="w-full sm:w-1/2 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] transition-colors"
            >
              {isSending ? "Sending…" : "Send message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
