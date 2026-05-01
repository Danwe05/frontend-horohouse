'use client';

import { useState } from 'react';
import { Share2, Bookmark, BookmarkCheck, Copy, Twitter, Linkedin, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareBookmarkProps {
  title: string;
  slug: string;
}

const STORAGE_KEY = 'hh_bookmarked_insights';

function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export default function ShareBookmark({ title, slug }: ShareBookmarkProps) {
  const url = typeof window !== 'undefined' ? window.location.href : `https://www.horohouse.com/insights/${slug}`;
  const [bookmarked, setBookmarked] = useState(() => getBookmarks().includes(slug));
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleBookmark = () => {
    const bookmarks = getBookmarks();
    if (bookmarked) {
      const updated = bookmarks.filter((s) => s !== slug);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setBookmarked(false);
      toast('Removed from bookmarks');
    } else {
      bookmarks.push(slug);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
      setBookmarked(true);
      toast.success('Saved to bookmarks!');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      '_blank',
    );
  };

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bookmark */}
      <button
        onClick={toggleBookmark}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#DDDDDD] hover:border-[#B0B0B0] text-[13px] font-semibold text-[#222222] transition-all hover:shadow-sm"
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
      >
        {bookmarked ? (
          <BookmarkCheck className="w-4 h-4 text-blue-600" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
      </button>

      {/* Share */}
      <div className="relative">
        <button
          onClick={() => setShareOpen(!shareOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#DDDDDD] hover:border-[#B0B0B0] text-[13px] font-semibold text-[#222222] transition-all hover:shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <AnimatePresence>
          {shareOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShareOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 bg-white border border-[#EBEBEB] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-3 z-50 w-52"
              >
                <button
                  onClick={copyLink}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#F7F7F7] text-[14px] text-[#222222] font-medium transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 shrink-0" />
                  )}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>

                <button
                  onClick={shareTwitter}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#F7F7F7] text-[14px] text-[#222222] font-medium transition-colors text-left"
                >
                  <Twitter className="w-4 h-4 shrink-0" />
                  Share on X
                </button>

                <button
                  onClick={shareLinkedIn}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#F7F7F7] text-[14px] text-[#222222] font-medium transition-colors text-left"
                >
                  <Linkedin className="w-4 h-4 shrink-0" />
                  Share on LinkedIn
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}