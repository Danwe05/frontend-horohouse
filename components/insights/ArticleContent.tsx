'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Tiptap JSON → HTML renderer ─────────────────────────────────────────────
// Lightweight client-side renderer without importing full TipTap editor bundle.

type TiptapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
};

function renderMarks(text: string, marks: TiptapNode['marks'] = []): string {
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong>${acc}</strong>`;
      case 'italic':
        return `<em>${acc}</em>`;
      case 'underline':
        return `<u>${acc}</u>`;
      case 'strike':
        return `<s>${acc}</s>`;
      case 'code':
        return `<code>${acc}</code>`;
      case 'link':
        return `<a href="${mark.attrs?.href ?? '#'}" target="${mark.attrs?.target ?? '_blank'}" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-2 hover:text-blue-800">${acc}</a>`;
      default:
        return acc;
    }
  }, text);
}

function renderNode(node: TiptapNode): string {
  if (node.type === 'text') {
    const escaped = (node.text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return renderMarks(escaped, node.marks);
  }

  const children = (node.content ?? []).map(renderNode).join('');

  switch (node.type) {
    case 'doc':
      return children;
    case 'paragraph':
      return `<p class="mb-5 leading-[1.8] text-[#333333]">${children || '&nbsp;'}</p>`;
    case 'heading': {
      const level = node.attrs?.level ?? 2;
      const id = `heading-${children.replace(/<[^>]+>/g, '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      const sizeClass = level === 1 ? 'text-3xl mt-10 mb-4' : level === 2 ? 'text-2xl mt-8 mb-3' : 'text-xl mt-6 mb-2';
      return `<h${level} id="${id}" class="${sizeClass} font-semibold tracking-tight text-[#222222] scroll-mt-24">${children}</h${level}>`;
    }
    case 'blockquote':
      return `<blockquote class="border-l-4 border-blue-600 pl-5 py-1 my-6 bg-blue-50/50 rounded-r-lg text-[#444444] italic">${children}</blockquote>`;
    case 'bulletList':
      return `<ul class="list-disc pl-6 mb-5 space-y-1.5 text-[#333333]">${children}</ul>`;
    case 'orderedList':
      return `<ol class="list-decimal pl-6 mb-5 space-y-1.5 text-[#333333]">${children}</ol>`;
    case 'listItem':
      return `<li class="leading-[1.7]">${children}</li>`;
    case 'codeBlock':
      return `<pre class="bg-[#1E1E1E] text-[#D4D4D4] rounded-xl p-5 mb-6 overflow-x-auto text-[13px] leading-relaxed font-mono"><code>${children}</code></pre>`;
    case 'image': {
      const src = node.attrs?.src ?? '';
      const alt = node.attrs?.alt ?? '';
      const caption = node.attrs?.title ?? '';
      return `<figure class="my-8"><img src="${src}" alt="${alt}" class="w-full rounded-[16px] object-cover" />${caption ? `<figcaption class="text-center text-[13px] text-[#717171] mt-3">${caption}</figcaption>` : ''}</figure>`;
    }
    case 'horizontalRule':
      return `<hr class="my-8 border-[#EBEBEB]" />`;
    case 'hardBreak':
      return `<br />`;
    default:
      return children;
  }
}

function tiptapToHtml(doc: Record<string, any>): string {
  try {
    return renderNode(doc as TiptapNode);
  } catch {
    return '<p>Content could not be rendered.</p>';
  }
}

// ─── Table of Contents ────────────────────────────────────────────────────────

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(doc: Record<string, any>): TocItem[] {
  const headings: TocItem[] = [];

  function walk(node: TiptapNode) {
    if (node.type === 'heading') {
      const level = node.attrs?.level ?? 2;
      if (level <= 3) {
        const text = (node.content ?? [])
          .filter((n) => n.type === 'text')
          .map((n) => n.text ?? '')
          .join('');
        const id = `heading-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
        headings.push({ id, text, level });
      }
    }
    (node.content ?? []).forEach(walk);
  }

  walk(doc as TiptapNode);
  return headings;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ArticleContentProps {
  content: Record<string, any>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArticleContent({ content }: ArticleContentProps) {
  const html = tiptapToHtml(content);
  const headings = extractHeadings(content);
  const [activeId, setActiveId] = useState<string>('');
  const articleRef = useRef<HTMLDivElement>(null);

  // Intersection observer for active heading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="flex gap-12 items-start">
      {/* ── Main article body ───────────────────────────────────────────── */}
      <div
        ref={articleRef}
        className="min-w-0 flex-1 text-[17px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* ── Sticky Table of Contents ─────────────────────────────────────── */}
      {headings.length > 2 && (
        <aside className="hidden xl:block w-64 shrink-0 sticky top-28 self-start">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#717171] mb-4">
            On this page
          </p>
          <nav>
            <ul className="space-y-1">
              {headings.map(({ id, text, level }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={cn(
                      'block text-[13px] leading-snug py-1 border-l-2 transition-all duration-150',
                      level === 2 ? 'pl-3' : 'pl-5',
                      activeId === id
                        ? 'text-[#222222] font-semibold border-blue-600'
                        : 'text-[#717171] border-transparent hover:text-[#222222] hover:border-[#DDDDDD]',
                    )}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
  );
}