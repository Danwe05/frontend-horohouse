'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import {
    ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from 'lucide-react';
import {
    addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
    format, parseISO, isBefore, isAfter, isWithinInterval, isSameDay,
    startOfDay, getDay,
} from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnavailableRange { from: string; to: string; }
interface BookedRange { checkIn: string; checkOut: string; }

interface Props {
    propertyId: string;
    /** Emits the selected [checkIn, checkOut] pair, or null when deselected */
    onRangeSelect?: (range: [Date, Date] | null) => void;
    /** Already-selected range from parent (controlled) */
    value?: [Date, Date] | null;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AvailabilityCalendar({ propertyId, onRangeSelect, value }: Props) {
    const today = startOfDay(new Date());
    const [viewing, setViewing] = useState(startOfMonth(today));
    const [unavail, setUnavail] = useState<UnavailableRange[]>([]);
    const [booked, setBooked] = useState<BookedRange[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Selection state (uncontrolled fallback)
    const [selStart, setSelStart] = useState<Date | null>(value?.[0] ?? null);
    const [selEnd, setSelEnd] = useState<Date | null>(value?.[1] ?? null);

    // 3-month window: current + next 2
    const lookaheadEnd = addMonths(viewing, 2);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await apiClient.getPropertyAvailability(
                    propertyId,
                    format(viewing, 'yyyy-MM-dd'),
                    format(endOfMonth(lookaheadEnd), 'yyyy-MM-dd'),
                );
                if (!cancelled) {
                    setUnavail(res.unavailableDates ?? []);
                    setBooked(res.bookedRanges ?? []);
                }
            } catch {
                if (!cancelled) setError('Could not load availability.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId, viewing.getTime()]);

    // Build set of unavailable date strings for O(1) lookup
    const blockedSet = useMemo<Set<string>>(() => {
        const s = new Set<string>();
        [...unavail].forEach(({ from, to }) => {
            eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).forEach(d => s.add(format(d, 'yyyy-MM-dd')));
        });
        [...booked].forEach(({ checkIn, checkOut }) => {
            eachDayOfInterval({ start: parseISO(checkIn), end: parseISO(checkOut) }).forEach(d => s.add(format(d, 'yyyy-MM-dd')));
        });
        return s;
    }, [unavail, booked]);

    function isUnavailable(d: Date) {
        return blockedSet.has(format(d, 'yyyy-MM-dd')) || isBefore(d, today);
    }

    function handleDayClick(d: Date) {
        if (isUnavailable(d)) return;

        if (!selStart || (selStart && selEnd)) {
            // Start fresh
            setSelStart(d);
            setSelEnd(null);
            onRangeSelect?.(null);
            return;
        }

        if (isBefore(d, selStart)) {
            setSelStart(d);
            return;
        }

        // Check that no blocked day falls inside the range
        const days = eachDayOfInterval({ start: selStart, end: d });
        if (days.some(day => isUnavailable(day))) {
            // Reset and start from this day
            setSelStart(d);
            setSelEnd(null);
            onRangeSelect?.(null);
            return;
        }

        setSelEnd(d);
        onRangeSelect?.([selStart, d]);
    }

    function dayClass(d: Date) {
        const key = format(d, 'yyyy-MM-dd');
        const unavailable = isUnavailable(d);
        const isStart = selStart && isSameDay(d, selStart);
        const isEnd = selEnd && isSameDay(d, selEnd);
        const inRange = selStart && selEnd && isWithinInterval(d, { start: selStart, end: selEnd });
        const isToday = isSameDay(d, today);

        if (unavailable)
            return 'bg-slate-50 text-slate-300 line-through cursor-not-allowed';
        if (isStart || isEnd)
            return 'bg-blue-600 text-white font-bold rounded-full cursor-pointer hover:bg-blue-700';
        if (inRange)
            return 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200';
        if (isToday)
            return 'border border-blue-300 text-blue-600 cursor-pointer hover:bg-blue-50 rounded-full font-semibold';
        return 'text-slate-700 cursor-pointer hover:bg-slate-100 rounded-full';
    }

    // Generate calendar grid for a given month (filled with nulls for offset)
    function monthDays(monthStart: Date): (Date | null)[] {
        const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) });
        const offset = getDay(monthStart); // 0=Sun
        return [...Array(offset).fill(null), ...days];
    }

    const months = [viewing, addMonths(viewing, 1)];

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 -sm">
            {/* Navigation */}
            <div className="mb-4 flex items-center justify-between">
                <button
                    onClick={() => setViewing(v => subMonths(v, 1))}
                    disabled={loading || isBefore(subMonths(viewing, 1), today)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                    {format(viewing, 'MMMM yyyy')} – {format(addMonths(viewing, 1), 'MMMM yyyy')}
                </span>
                <button
                    onClick={() => setViewing(v => addMonths(v, 1))}
                    disabled={loading}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Loading / error */}
            {loading && (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading availability…
                </div>
            )}
            {!loading && error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 mb-3">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
            )}

            {/* Two-month grid */}
            {!loading && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {months.map((monthStart) => (
                        <div key={format(monthStart, 'yyyy-MM')}>
                            <p className="mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                {format(monthStart, 'MMMM yyyy')}
                            </p>
                            {/* Weekday headers */}
                            <div className="mb-1 grid grid-cols-7 text-center">
                                {WEEKDAYS.map(d => (
                                    <span key={d} className="text-[10px] font-semibold text-slate-400">{d}</span>
                                ))}
                            </div>
                            {/* Days grid */}
                            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                                {monthDays(monthStart).map((d, i) =>
                                    d === null ? <span key={`null-${i}`} /> : (
                                        <button
                                            key={format(d, 'yyyy-MM-dd')}
                                            onClick={() => handleDayClick(d)}
                                            className={`flex h-8 w-8 mx-auto items-center justify-center text-xs transition-colors ${dayClass(d)}`}
                                        >
                                            {format(d, 'd')}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-600 inline-block" /> Selected</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-100 inline-block" /> In range</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-slate-100 inline-block" /> Unavailable</span>
            </div>

            {/* Selection summary */}
            {selStart && selEnd && (
                <div className="mt-3 rounded-xl bg-blue-50 px-4 py-2.5 text-center text-sm">
                    <span className="font-semibold text-blue-700">
                        {format(selStart, 'MMM d')} → {format(selEnd, 'MMM d, yyyy')}
                    </span>
                    <span className="ml-2 text-blue-500 text-xs">
                        ({Math.round((selEnd.getTime() - selStart.getTime()) / 86400000)} nights)
                    </span>
                </div>
            )}
        </div>
    );
}
