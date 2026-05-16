"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Eye, Send, Calendar, Star, Upload,
  X, Plus, ChevronDown, Loader2, AlertCircle, CheckCircle2,
  Clock, Globe, ImageIcon, Tag, User, FileText, Sparkles,
  Bold, Italic, Underline, List, ListOrdered, Quote,
  Link2, Code, Heading1, Heading2, Heading3, AlignLeft,
  AlignCenter, Undo, Redo, Minus,
} from "lucide-react";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { insightsAdminApi } from "@/lib/insights-api";
import type { InsightPost } from "@/types/insights";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author { _id: string; displayName: string; slug: string; avatar?: string; }
interface Category { _id: string; name: string; slug: string; accentColor?: string; }
interface Tag { _id: string; name: string; slug: string; }
interface CoverImage { url: string; publicId: string; width: number; height: number; }

interface PostForm {
  title: string;
  excerpt: string;
  content: any;
  author: string;
  category: string;
  tags: string[];
  coverImage: CoverImage | null;
  isFeatured: boolean;
  postType: string;
  seo: { metaTitle: string; metaDescription: string; };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeToTiptap(html: string): any {
  if (typeof window === "undefined") return { type: "doc", content: [] };
  const div = document.createElement("div");
  div.innerHTML = html.trim();

  function parseNode(node: Node, currentMarks: any[] = []): any {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text || text === "\n") return null;
      return { type: "text", text, ...(currentMarks.length ? { marks: currentMarks } : {}) };
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      let nextMarks = [...currentMarks];
      if (tag === "b" || tag === "strong") nextMarks.push({ type: "bold" });
      if (tag === "i" || tag === "em") nextMarks.push({ type: "italic" });
      if (tag === "u") nextMarks.push({ type: "underline" });
      if (tag === "s" || tag === "strike") nextMarks.push({ type: "strike" });
      if (tag === "code") nextMarks.push({ type: "code" });
      if (tag === "a") nextMarks.push({ type: "link", attrs: { href: el.getAttribute("href") || "#" } });

      const children = Array.from(el.childNodes)
        .map((child) => parseNode(child, nextMarks))
        .filter(Boolean)
        .flat();

      if (["b", "strong", "i", "em", "u", "s", "strike", "code", "a"].includes(tag)) {
        return children;
      }

      switch (tag) {
        case "h1": return { type: "heading", attrs: { level: 1 }, content: children };
        case "h2": return { type: "heading", attrs: { level: 2 }, content: children };
        case "h3": return { type: "heading", attrs: { level: 3 }, content: children };
        case "h4": return { type: "heading", attrs: { level: 4 }, content: children };
        case "p": return { type: "paragraph", content: children.length ? children : undefined };
        case "blockquote": return { type: "blockquote", content: children };
        case "pre": return { type: "codeBlock", content: children };
        case "ul": return { type: "bulletList", content: children };
        case "ol": return { type: "orderedList", content: children };
        case "li": return { type: "listItem", content: children };
        case "hr": return { type: "horizontalRule" };
        case "br": return { type: "hardBreak" };
        case "div":
        default:
          // Just unwrap divs/spans
          return children;
      }
    }
    return null;
  }

  const content = Array.from(div.childNodes).map((n) => parseNode(n, [])).flat().filter(Boolean);
  
  // Wrap raw text nodes in a paragraph at the top level
  const cleanContent = content.reduce((acc: any[], curr: any) => {
    if (curr.type === "text" || curr.type === "hardBreak") {
      const last = acc[acc.length - 1];
      if (last?.type === "paragraph") {
        last.content = last.content || [];
        last.content.push(curr);
      } else {
        acc.push({ type: "paragraph", content: [curr] });
      }
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  return { type: "doc", content: cleanContent.length ? cleanContent : [{ type: "paragraph" }] };
}

// ─── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarBtn({
  icon: Icon, title, onClick, active,
}: {
  icon: React.ComponentType<{ className: string }>; title: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "p-1.5 rounded-md transition-colors text-sm",
        active
          ? "bg-blue-100 text-blue-700"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Rich text editor ──────────────────────────────────────────────────────────

function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void; }) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/30">
        <ToolbarBtn icon={Undo} title="Undo" onClick={() => exec("undo")} />
        <ToolbarBtn icon={Redo} title="Redo" onClick={() => exec("redo")} />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn icon={Bold} title="Bold" onClick={() => exec("bold")} />
        <ToolbarBtn icon={Italic} title="Italic" onClick={() => exec("italic")} />
        <ToolbarBtn icon={Underline} title="Underline" onClick={() => exec("underline")} />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn icon={Heading1} title="H1" onClick={() => exec("formatBlock", "<h1>")} />
        <ToolbarBtn icon={Heading2} title="H2" onClick={() => exec("formatBlock", "<h2>")} />
        <ToolbarBtn icon={Heading3} title="H3" onClick={() => exec("formatBlock", "<h3>")} />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn icon={List} title="Bullet list" onClick={() => exec("insertUnorderedList")} />
        <ToolbarBtn icon={ListOrdered} title="Numbered list" onClick={() => exec("insertOrderedList")} />
        <ToolbarBtn icon={Quote} title="Blockquote" onClick={() => exec("formatBlock", "<blockquote>")} />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn icon={AlignLeft} title="Align left" onClick={() => exec("justifyLeft")} />
        <ToolbarBtn icon={AlignCenter} title="Align centre" onClick={() => exec("justifyCenter")} />
        <ToolbarBtn icon={Code} title="Code" onClick={() => exec("formatBlock", "<pre>")} />
        <ToolbarBtn icon={Minus} title="Divider" onClick={() => exec("insertHorizontalRule")} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => editorRef.current && onChange(editorRef.current.innerHTML)}
        className={cn(
          "min-h-[360px] p-5 focus:outline-none text-sm leading-relaxed",
          "prose prose-sm max-w-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-xs",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_hr]:border-border [&_hr]:my-4",
        )}
        data-placeholder="Start writing your article…"
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// ─── Tag chip ──────────────────────────────────────────────────────────────────

function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-blue-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={cn(
      "fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-in slide-in-from-bottom-2 fade-in duration-200",
      type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
    )}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
      {msg}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewInsightPage() {
  const router = useRouter();

  // ── Auth guard — same pattern as InsightsCMSPage ──────────────────────────
  // token is used only as a dependency so fetches re-run once auth is ready.
  // Actual header injection is handled inside insightsAdminApi via authService.
  const { token } = useAuth();

  const [form, setForm] = useState<PostForm>({
    title: "",
    excerpt: "",
    content: {},
    author: "",
    category: "",
    tags: [],
    coverImage: null,
    isFeatured: false,
    postType: "article",
    seo: { metaTitle: "", metaDescription: "" },
  });

  const [htmlContent, setHtmlContent] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load authors, categories, tags ────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    Promise.all([
      insightsAdminApi.getAuthors({ limit: 100 }),
      insightsAdminApi.getCategories(),
      insightsAdminApi.getTags({ limit: 200 }),
    ])
      .then(([a, c, t]) => {
        setAuthors(a.data ?? []);
        setCategories(c ?? []);
        setAllTags(t.data ?? []);
      })
      .catch((err) => {
        console.error('[NewInsight] loadMeta:', err);
      });
  }, [token]);

  const set = (key: keyof PostForm, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

const validateForm = (): string | null => {
  if (!form.title.trim())    return "Title is required";
  if (!form.author)          return "Please select an author";
  if (!form.category)        return "Please select a category";
  if (!htmlContent.trim())   return "Content cannot be empty";
  return null;
};

  // ── Cover upload ─────────────────────────────────────────────────────────
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const img = await insightsAdminApi.uploadCover(file);
      // uploadCover returns { url } — cast to match CoverImage shape
      set("coverImage", img as unknown as CoverImage);
    } catch {
      showToast("Cover upload failed", "error");
    } finally {
      setUploadingCover(false);
    }
  };

  // ── Tag helpers ───────────────────────────────────────────────────────────
  const addTagById = (id: string) => {
    if (!form.tags.includes(id)) set("tags", [...form.tags, id]);
  };

  const removeTagById = (id: string) =>
    set("tags", form.tags.filter((t) => t !== id));

  const tagName = (id: string) =>
    allTags.find((t) => t._id === id)?.name ?? id;

  const filteredTagSuggestions = allTags.filter(
    (t) => !form.tags.includes(t._id) && t.name.toLowerCase().includes(tagInput.toLowerCase())
  );

  // ── Build payload ─────────────────────────────────────────────────────────
 const buildPayload = () => {
  const payload: Record<string, any> = {
    title:     form.title.trim(),
    excerpt:   form.excerpt.trim(),
    content:   serializeToTiptap(htmlContent),
    author:    form.author,
    category:  form.category,
    postType:  form.postType,
    isFeatured: form.isFeatured,
    seo: {
      metaTitle:       form.seo.metaTitle  || form.title.slice(0, 70),
      metaDescription: form.seo.metaDescription || form.excerpt.slice(0, 160),
    },
  };

  // Only include tags if non-empty — DTO expects MongoId[]
  if (form.tags.length > 0) payload.tags = form.tags;

  // Only include coverImage if actually uploaded
  if (form.coverImage) payload.coverImage = form.coverImage;

  return payload;
};

const handleSave = async () => {
  const err = validateForm();
  if (err) return showToast(err, 'error');
  setSaving(true);
  try {
    const payload = buildPayload();
    if (savedId) {
      await insightsAdminApi.updatePost(savedId, payload);
    } else {
      const result = await insightsAdminApi.createPost(payload);
      setSavedId((result as any)._id);
    }
    showToast('Draft saved');
  } catch (e: any) {
    showToast(e.message || 'Save failed', 'error');
  } finally {
    setSaving(false);
  }
};

const handlePublish = async () => {
  const err = validateForm();
  if (err) return showToast(err, 'error');
  setPublishing(true);
  try {
    let id = savedId;
    if (!id) {
      const created = await insightsAdminApi.createPost(buildPayload());
      id = (created as any)._id;
      setSavedId(id);
    }
    await insightsAdminApi.publish(id!);
    showToast('Article published!');
    setTimeout(() => router.push('/dashboard/insights'), 1000);
  } catch (e: any) {
    showToast(e.message || 'Publish failed', 'error');
  } finally {
    setPublishing(false);
  }
};

const handleSchedule = async () => {
  if (!scheduleDate) return showToast('Pick a date & time', 'error');
  const err = validateForm();
  if (err) return showToast(err, 'error');
  setPublishing(true);
  try {
    let id = savedId;
    if (!id) {
      const created = await insightsAdminApi.createPost(buildPayload());
      id = (created as any)._id;
      setSavedId(id);
    }
    await insightsAdminApi.schedule(id!, scheduleDate);
    showToast('Article scheduled!');
    setShowSchedule(false);
  } catch (e: any) {
    showToast(e.message || 'Schedule failed', 'error');
  } finally {
    setPublishing(false);
  }
};

  const postTypes = [
    { value: "article",            label: "Article" },
    { value: "market_report",      label: "Market Report" },
    { value: "neighborhood_guide", label: "Neighborhood Guide" },
    { value: "how_to",             label: "How-To Guide" },
    { value: "news",               label: "News" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="min-h-screen bg-background flex-1">
            {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/insights")}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold">New Article</h1>
              <p className="text-xs text-muted-foreground">
                {savedId ? "Draft saved" : "Unsaved"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save draft
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule
              </button>
              {showSchedule && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-popover border border-border rounded-xl p-4 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-xs font-semibold mb-2">Schedule publish</p>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSchedule}
                    disabled={publishing}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    Confirm schedule
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-screen-xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* ── Left: main editor ── */}
        <div className="space-y-6">
          {/* Cover image */}
          <div
            className={cn(
              "relative rounded-2xl border-2 border-dashed border-border overflow-hidden transition-colors hover:border-blue-400 cursor-pointer",
              form.coverImage ? "border-solid border-border h-60" : "h-44"
            )}
            onClick={() => (document.getElementById("cover-input") as HTMLInputElement)?.click()}
          >
            <input
              id="cover-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCoverUpload(file); }}
            />
            {form.coverImage ? (
              <>
                <img src={form.coverImage.url} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); set("coverImage", null); }}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                {uploadingCover ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-sm font-medium">Upload cover image</p>
                    <p className="text-xs">Recommended: 1200 × 630 px</p>
                  </>
                )}
              </div>
            )}
          </div>

          <textarea
            placeholder="Article title…"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            rows={2}
            className="w-full text-2xl font-bold bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-tight"
          />

          <textarea
            placeholder="Short excerpt shown in listings (1–2 sentences)…"
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className="w-full text-sm bg-transparent border-none resize-none focus:outline-none text-muted-foreground placeholder:text-muted-foreground/40 leading-relaxed"
          />

          <div className="h-px bg-border/60" />

          <RichEditor value={htmlContent} onChange={setHtmlContent} />

          {/* SEO accordion */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                SEO settings
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showSeo && "rotate-180")} />
            </button>
            {showSeo && (
              <div className="px-4 pb-4 space-y-3 border-t border-border">
                <div className="pt-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta title <span className="text-muted-foreground/60">(max 70 chars)</span></label>
                  <input
                    value={form.seo.metaTitle}
                    onChange={(e) => set("seo", { ...form.seo, metaTitle: e.target.value })}
                    maxLength={70}
                    placeholder={form.title || "Auto-generated from title"}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta description <span className="text-muted-foreground/60">(max 160 chars)</span></label>
                  <textarea
                    value={form.seo.metaDescription}
                    onChange={(e) => set("seo", { ...form.seo, metaDescription: e.target.value })}
                    maxLength={160}
                    rows={2}
                    placeholder={form.excerpt || "Auto-generated from excerpt"}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-background"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post settings</h3>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={form.postType}
                onChange={(e) => set("postType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              >
                {postTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="sr-only" />
                <div className={cn("w-9 h-5 rounded-full transition-colors", form.isFeatured ? "bg-blue-500" : "bg-muted")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", form.isFeatured ? "translate-x-4" : "translate-x-0.5")} />
                </div>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> Featured article
              </span>
            </label>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Author
            </h3>
            <select value={form.author} onChange={(e) => set("author", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background">
              <option value="">Select author…</option>
              {authors.map((a) => <option key={a._id} value={a._id}>{a.displayName}</option>)}
            </select>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Category
            </h3>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background">
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((id) => <TagChip key={id} label={tagName(id)} onRemove={() => removeTagById(id)} />)}
            </div>
            <div className="relative">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Search tags…"
                className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
              {tagInput && filteredTagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg overflow-hidden shadow-lg z-10">
                  {filteredTagSuggestions.slice(0, 6).map((t) => (
                    <button key={t._id} type="button" onClick={() => { addTagById(t._id); setTagInput(""); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors">
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>SEO meta tags auto-generate from title & excerpt if left blank.</span>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
