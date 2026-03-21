'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import { Review, ReviewType } from '@/types/review';
import {
    Star, MessageSquare, ThumbsUp, Trash2, Loader2,
    Edit3, CheckCircle, BedDouble, Users, Building2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Star rating display ─────────────────────────────────────────────────────

function StarRating({ value, size = 16 }: { value: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={size}
                    className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
        </div>
    );
}

// ─── Review type badge ───────────────────────────────────────────────────────

const getTypeConfig = (type: ReviewType, s: any) => {
    const config: Record<ReviewType, { label: string; icon: React.ReactNode; color: string }> = {
        property: { label: s?.property || 'Property', icon: <Building2 className="h-3 w-3" />, color: 'bg-indigo-100 text-indigo-700' },
        agent: { label: s?.agent || 'Agent', icon: <Users className="h-3 w-3" />, color: 'bg-purple-100 text-purple-700' },
        stay: { label: s?.stay || 'Stay', icon: <BedDouble className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700' },
        guest: { label: s?.asGuest || 'As Guest', icon: <Users className="h-3 w-3" />, color: 'bg-emerald-100 text-emerald-700' },
    };
    return config[type] || config.property;
};

// ─── Sub-rating bar ──────────────────────────────────────────────────────────

function SubRatingBar({ label, value }: { label: string; value?: number }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-28 text-slate-500">{label}</span>
            <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${(value / 5) * 100}%` }} />
            </div>
            <span className="w-4 text-right font-medium text-slate-700">{value}</span>
        </div>
    );
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({ review, currentUserId, onDelete, onHelpful, s }: {
    review: Review;
    currentUserId?: string;
    onDelete: (id: string) => void;
    onHelpful: (id: string) => void;
    s: any;
}) {
    const cfg = getTypeConfig(review.reviewType, s);
    const isOwn = review.userId?._id === currentUserId;
    const isHelpful = review.helpfulBy?.includes(currentUserId ?? '');
    const sub = review.staySubRatings;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 -sm space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={review.userId?.profilePicture} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold">
                            {review.userId?.name?.charAt(0) ?? 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-slate-900 text-sm">{review.userId?.name}</p>
                        <p className="text-xs text-slate-400">{format(parseISO(review.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                </span>
            </div>

            {(review.propertyId || review.agentId) && (
                <p className="text-xs text-slate-500">
                    {review.propertyId ? `📍 ${review.propertyId.title}` : `👤 ${review.agentId?.name}`}
                </p>
            )}

            <div className="space-y-1">
                <StarRating value={review.rating} />
                {review.comment && <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>}
            </div>

            {sub && (
                <div className="space-y-1 rounded-xl bg-slate-50 p-3">
                    <SubRatingBar label={s?.cleanliness || "Cleanliness"} value={sub.cleanliness} />
                    <SubRatingBar label={s?.accuracy || "Accuracy"} value={sub.accuracy} />
                    <SubRatingBar label={s?.checkIn || "Check-in"} value={sub.checkIn} />
                    <SubRatingBar label={s?.communication || "Communication"} value={sub.communication} />
                    <SubRatingBar label={s?.location || "Location"} value={sub.location} />
                    <SubRatingBar label={s?.value || "Value"} value={sub.value} />
                </div>
            )}

            {review.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" /> {s?.verifiedStay || "Verified Stay"}
                </span>
            )}

            {review.response && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-[11px] font-semibold text-blue-600 mb-1">{s?.hostResponse || "Host Response"}</p>
                    <p className="text-xs text-blue-800 italic">"{review.response}"</p>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                <Button variant="ghost" size="sm"
                    className={`h-7 gap-1 text-xs ${isHelpful ? 'text-blue-600' : 'text-slate-400'}`}
                    onClick={() => onHelpful(review._id)}>
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {review.helpfulCount > 0 ? review.helpfulCount : ''} {s?.helpful || "Helpful"}
                </Button>
                {isOwn && (
                    <Button variant="ghost" size="sm"
                        className="h-7 gap-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDelete(review._id)}>
                        <Trash2 className="h-3.5 w-3.5" /> {s?.delete || "Delete"}
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Star className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm text-slate-400">{message}</p>
        </div>
    );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function MyReviewsClient() {
    const { data: session } = useSession();
    const currentUserId = (session?.user as any)?._id ?? (session?.user as any)?.id;
    const { t } = useLanguage();
    const s = (t as any)?.reviews || {};

    const [writtenReviews, setWrittenReviews] = useState<Review[]>([]);
    const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const [deleting, setDeleting] = useState(false);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const [written, received] = await Promise.all([
                apiClient.getMyReviews({ page: 1, limit: 50 }),
                currentUserId
                    ? apiClient.getGuestReviews(currentUserId, { limit: 50 })
                    : Promise.resolve({ reviews: [] }),
            ]);
            setWrittenReviews(written.reviews ?? []);
            setReceivedReviews(received.reviews ?? []);
        } catch {
            toast.error(s?.failedToLoad || 'Failed to load your reviews.');
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    async function handleDelete() {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.deleteReview(deleteDialog.id);
            toast.success(s?.reviewDeleted || 'Review deleted.');
            setWrittenReviews(rs => rs.filter(r => r._id !== deleteDialog.id));
            setDeleteDialog({ open: false, id: null });
        } catch {
            toast.error(s?.couldNotDelete || 'Could not delete review.');
        } finally {
            setDeleting(false);
        }
    }

    async function handleHelpful(reviewId: string) {
        try {
            await apiClient.markReviewAsHelpful(reviewId);
            setWrittenReviews(rs => rs.map(r =>
                r._id === reviewId
                    ? { ...r, helpfulCount: r.helpfulBy.includes(currentUserId ?? '') ? r.helpfulCount - 1 : r.helpfulCount + 1 }
                    : r
            ));
        } catch {
            toast.error(s?.couldNotMarkHelpful || 'Could not mark as helpful.');
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/20 p-6">
            <div className="mx-auto max-w-3xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{s?.myReviews || "My Reviews"}</h1>
                    <p className="mt-0.5 text-sm text-slate-500">{s?.myReviewsDesc || "Reviews you've written and received"}</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                ) : (
                    <Tabs defaultValue="written">
                        <TabsList className="bg-white border border-slate-100 -sm">
                            <TabsTrigger value="written" className="gap-1.5">
                                <Edit3 className="h-3.5 w-3.5" /> {s?.written || "Written"}
                                <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">
                                    {writtenReviews.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="received" className="gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" /> {s?.received || "Received"}
                                <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">
                                    {receivedReviews.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="written" className="mt-4 space-y-4">
                            {writtenReviews.length === 0
                                ? <EmptyState message={s?.noWrittenReviews || "You haven't written any reviews yet."} />
                                : writtenReviews.map(r => (
                                    <ReviewCard key={r._id} review={r} currentUserId={currentUserId}
                                        onDelete={(id) => setDeleteDialog({ open: true, id })}
                                        onHelpful={handleHelpful} s={s} />
                                ))}
                        </TabsContent>

                        <TabsContent value="received" className="mt-4 space-y-4">
                            {receivedReviews.length === 0
                                ? <EmptyState message={s?.noReceivedReviews || "You haven't received any guest reviews yet."} />
                                : receivedReviews.map(r => (
                                    <ReviewCard key={r._id} review={r} currentUserId={currentUserId}
                                        onDelete={(id) => setDeleteDialog({ open: true, id })}
                                        onHelpful={handleHelpful} s={s} />
                                ))}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog({ open: false, id: null })}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{s?.deleteReviewQuestion || "Delete Review?"}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">{s?.deleteReviewWarning || "This action is permanent and cannot be undone."}</p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: null })}>{s?.cancel || "Cancel"}</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (s?.delete || 'Delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}