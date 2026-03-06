'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Star, Loader2, BarChart2, MessageSquare } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface StaySubRatings {
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    bookingId: string;
    propertyId: string;
    propertyTitle: string;
    onSuccess: () => void;
}

const SUB_RATING_LABELS: { key: keyof StaySubRatings; label: string; desc: string }[] = [
    { key: 'cleanliness', label: 'Cleanliness', desc: 'How clean was the property?' },
    { key: 'accuracy', label: 'Accuracy', desc: 'Did the listing match reality?' },
    { key: 'checkIn', label: 'Check-in', desc: 'How smooth was the check-in?' },
    { key: 'communication', label: 'Communication', desc: 'How responsive was the host?' },
    { key: 'location', label: 'Location', desc: 'How was the neighbourhood?' },
    { key: 'value', label: 'Value', desc: 'Was the price worth it?' },
];

type Step = 'overall' | 'sub' | 'comment';
const STEPS: Step[] = ['overall', 'sub', 'comment'];

const STEP_TITLES: Record<Step, { icon: React.ReactNode; label: string }> = {
    overall: { icon: <Star className="h-4 w-4" />, label: 'How was your stay?' },
    sub:     { icon: <BarChart2 className="h-4 w-4" />, label: 'Rate the details' },
    comment: { icon: <MessageSquare className="h-4 w-4" />, label: 'Final thoughts' },
};

// Must match CreateReviewDto @MinLength(10) on the backend
const COMMENT_MIN_LENGTH = 10;

function StarPicker({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
    const [hovered, setHovered] = useState(0);
    const display = hovered || value;
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    className={`cursor-pointer transition-colors ${i <= display ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(i)}
                />
            ))}
        </div>
    );
}

const OVERALL_LABELS = ['', 'Terrible', 'Bad', 'OK', 'Good', 'Excellent'];

export default function StayReviewForm({ open, onClose, bookingId, propertyId, propertyTitle, onSuccess }: Props) {
    const [step, setStep] = useState<Step>('overall');
    const [overall, setOverall] = useState(0);
    const [comment, setComment] = useState('');
    const [sub, setSub] = useState<StaySubRatings>({
        cleanliness: 0, accuracy: 0, checkIn: 0, communication: 0, location: 0, value: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    function reset() {
        setStep('overall');
        setOverall(0);
        setComment('');
        setSub({ cleanliness: 0, accuracy: 0, checkIn: 0, communication: 0, location: 0, value: 0 });
    }

    async function handleSubmit() {
        if (overall === 0) { toast.error('Please give an overall rating.'); return; }

        const trimmedComment = comment.trim();
        // comment is optional on backend — but if provided must be >= MinLength(10)
        if (trimmedComment.length > 0 && trimmedComment.length < COMMENT_MIN_LENGTH) {
            toast.error(`Comment must be at least ${COMMENT_MIN_LENGTH} characters, or leave it blank.`);
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.createBookingReview({
                reviewType: 'stay',
                bookingId,
                propertyId,
                rating: overall,
                comment: trimmedComment.length >= COMMENT_MIN_LENGTH ? trimmedComment : undefined,
                staySubRatings: Object.values(sub).some(v => v > 0) ? sub : undefined,
            });
            reset();
            onSuccess();
        } catch (err: any) {
            const raw = err?.response?.data?.message ?? err?.message;
            const message = typeof raw === 'string' ? raw : 'Failed to submit review.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    const allSubRated = Object.values(sub).every(v => v > 0);
    const currentStepIndex = STEPS.indexOf(step);
    const { icon, label } = STEP_TITLES[step];
    const trimmedComment = comment.trim();
    const commentTooShort = trimmedComment.length > 0 && trimmedComment.length < COMMENT_MIN_LENGTH;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
            <DialogContent className="sm:max-w-lg">

                <DialogHeader>
                    <DialogTitle className="text-slate-900">
                        <span className="flex items-center gap-2">
                            {icon}
                            {label}
                        </span>
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">{propertyTitle}</p>
                </DialogHeader>

                <div className="flex items-center gap-1.5 mb-2">
                    {STEPS.map((s, i) => (
                        <div
                            key={s}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                                step === s ? 'bg-amber-400' : currentStepIndex > i ? 'bg-amber-200' : 'bg-slate-100'
                            }`}
                        />
                    ))}
                </div>

                {step === 'overall' && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <StarPicker value={overall} onChange={setOverall} size={40} />
                        {overall > 0 && (
                            <p className="text-lg font-semibold text-amber-600 animate-in fade-in">
                                {OVERALL_LABELS[overall]}
                            </p>
                        )}
                    </div>
                )}

                {step === 'sub' && (
                    <div className="space-y-4 py-2">
                        {SUB_RATING_LABELS.map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{label}</p>
                                    <p className="text-xs text-slate-400">{desc}</p>
                                </div>
                                <StarPicker value={sub[key]} onChange={(v) => setSub(s => ({ ...s, [key]: v }))} size={18} />
                            </div>
                        ))}
                    </div>
                )}

                {step === 'comment' && (
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-slate-600">
                            Share your experience to help other travellers. You can also skip this step.
                        </p>
                        <Textarea
                            placeholder="Write your review here…"
                            value={comment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                            rows={5}
                            className={`resize-none ${commentTooShort ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                            autoFocus
                        />
                        <div className="flex items-center justify-between">
                            {commentTooShort
                                ? <p className="text-xs text-red-500">At least {COMMENT_MIN_LENGTH} characters required</p>
                                : <span />
                            }
                            <p className="text-xs text-slate-400 ml-auto">{comment.length}/1000</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 mt-2">
                    {step !== 'overall' && (
                        <Button variant="outline" onClick={() => setStep(step === 'comment' ? 'sub' : 'overall')}>
                            Back
                        </Button>
                    )}
                    {step === 'overall' && (
                        <Button className="flex-1 bg-amber-500 hover:bg-amber-600" disabled={overall === 0} onClick={() => setStep('sub')}>
                            Next: Rate Details
                        </Button>
                    )}
                    {step === 'sub' && (
                        <Button className="flex-1 bg-amber-500 hover:bg-amber-600" onClick={() => setStep('comment')}>
                            {allSubRated ? 'Next: Add Comment' : 'Skip Details'}
                        </Button>
                    )}
                    {step === 'comment' && (
                        <Button
                            className="flex-1 bg-amber-500 hover:bg-amber-600"
                            onClick={handleSubmit}
                            disabled={submitting || commentTooShort}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    Submitting…
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}