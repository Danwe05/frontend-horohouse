import React from 'react';

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200/60 animate-pulse">
            <div className="h-48 bg-slate-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                <div className="h-5 bg-slate-200 rounded-md w-1/3 mt-2" />
                <div className="flex gap-3 mt-3">
                    <div className="h-3 bg-slate-200 rounded-md w-16" />
                    <div className="h-3 bg-slate-200 rounded-md w-16" />
                    <div className="h-3 bg-slate-200 rounded-md w-16" />
                </div>
            </div>
        </div>
    );
}
