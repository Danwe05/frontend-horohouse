"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Search, MoreHorizontal, Pencil,
  Users2, Loader2, AlertCircle, CheckCircle2, X, User,
  BookOpen, Pen, Eye,
} from "lucide-react";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from "@/lib/utils";
import { insightsAdminApi } from "@/lib/insights-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author {
  _id: string;
  displayName: string;
  slug: string;
  title?: string;
  bio?: string;
  avatar?: string;
  role: "editor" | "contributor" | "guest";
  isActive: boolean;
  publishedPostCount: number;
  user?: { email: string; firstName: string; lastName: string; };
}

interface AuthorForm {
  userId: string;
  displayName: string;
  title: string;
  bio: string;
  role: "editor" | "contributor" | "guest";
  isActive: boolean;
  avatar: string;
  social: { twitter: string; linkedin: string; website: string; };
}

const EMPTY_FORM: AuthorForm = {
  userId: "", displayName: "", title: "", bio: "",
  role: "contributor", isActive: true, avatar: "",
  social: { twitter: "", linkedin: "", website: "" },
};


// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: "editor" | "contributor" | "guest" }) {
  const map: Record<string, { bg: string; text: string; icon: any }> = {
    editor:      { bg: "bg-blue-100",    text: "text-blue-700",    icon: Pen },
    contributor: { bg: "bg-purple-100",  text: "text-purple-700",  icon: Pencil },
    guest:       { bg: "bg-amber-100",   text: "text-amber-700",   icon: User },
  };
  const s = map[role] ?? map.guest;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full", s.bg, s.text)}>
      <Icon className="w-3 h-3" />
      {role.charAt(0).toUpperCase() + role.slice(1)}
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

// ─── Author form modal ────────────────────────────────────────────────────────

function AuthorModal({
  initial, onClose, onSaved, editId,
}: {
  initial: AuthorForm;
  onClose: () => void;
  onSaved: (author: Author) => void;
  editId?: string;
}) {
  const [form, setForm] = useState<AuthorForm>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (key: keyof AuthorForm, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setSocial = (key: keyof AuthorForm["social"], val: string) =>
    setForm((f) => ({ ...f, social: { ...f.social, [key]: val } }));

  const handleSubmit = async () => {
    if (!form.displayName.trim()) return setErr("Display name is required");
    setSaving(true);
    setErr("");
    try {
      // Strip empty userId so @IsMongoId never sees an empty string
      const payload = { ...form, ...(form.userId.trim() === "" && { userId: undefined }) };
      const result: Author = editId
        ? await insightsAdminApi.updateAuthor(editId, payload)
        : await insightsAdminApi.createAuthor(payload as any);
      onSaved(result);
    } catch (e: any) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{editId ? "Edit author" : "New author"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {!editId && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Platform User ID <span className="text-muted-foreground/50">(optional)</span></label>
              <input
                value={form.userId}
                onChange={(e) => set("userId", e.target.value)}
                placeholder="MongoDB ObjectId — leave blank to create a standalone author"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Display name <span className="text-red-500">*</span></label>
              <input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title / role</label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Senior Editor"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              >
                <option value="editor">Editor</option>
                <option value="contributor">Contributor</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-background"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Avatar URL</label>
            <input
              value={form.avatar}
              onChange={(e) => set("avatar", e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Social links</label>
            {(["twitter", "linkedin", "website"] as const).map((key) => (
              <input
                key={key}
                value={form.social[key]}
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="sr-only" />
              <div className={cn("w-9 h-5 rounded-full transition-colors", form.isActive ? "bg-blue-500" : "bg-muted")}>
                <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", form.isActive ? "translate-x-4" : "translate-x-0.5")} />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">Active</span>
          </label>

          {err && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /> {err}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {editId ? "Save changes" : "Create author"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthorsPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; initial: AuthorForm; editId?: string }>({
    open: false, initial: EMPTY_FORM,
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const res = await insightsAdminApi.getAuthors({ limit: 50, ...(roleFilter && { role: roleFilter }) });
      setAuthors(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch {
      showToast("Failed to load authors", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAuthors(); }, [roleFilter]);

  const handleSaved = (author: Author) => {
    setAuthors((prev) => {
      const idx = prev.findIndex((a) => a._id === author._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = author;
        return next;
      }
      return [author, ...prev];
    });
    setModal({ open: false, initial: EMPTY_FORM });
    showToast(modal.editId ? "Author updated" : "Author created");
  };

  const openEdit = (author: Author) => {
    setModal({
      open: true,
      editId: author._id,
      initial: {
        userId: author.user ? (author.user as any)._id ?? "" : "",
        displayName: author.displayName,
        title: author.title ?? "",
        bio: author.bio ?? "",
        role: author.role,
        isActive: author.isActive,
        avatar: author.avatar ?? "",
        social: { twitter: "", linkedin: "", website: "" },
      },
    });
    setOpenMenu(null);
  };

  const filtered = authors.filter(
    (a) =>
      !search ||
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleOptions = [
    { value: "", label: "All roles" },
    { value: "editor", label: "Editor" },
    { value: "contributor", label: "Contributor" },
    { value: "guest", label: "Guest" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="min-h-screen bg-background flex-1">
            {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/insights")}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Authors</h1>
              <p className="text-xs text-muted-foreground">{total} author{total !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => setModal({ open: true, initial: EMPTY_FORM })}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add author
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        {/* ── Filters ── */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
          >
            {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Users2 className="w-10 h-10" />
            <p className="text-sm">No authors found</p>
            <button
              onClick={() => setModal({ open: true, initial: EMPTY_FORM })}
              className="text-sm text-blue-600 hover:underline"
            >
              Create your first author
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Posts</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((author) => (
                  <tr key={author._id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                          {author.avatar ? (
                            <img src={author.avatar} alt={author.displayName} className="w-full h-full object-cover" />
                          ) : (
                            author.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{author.displayName}</p>
                          <p className="text-xs text-muted-foreground">/{author.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={author.role} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {author.title || <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {author.user?.email || <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        {author.publishedPostCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        author.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {author.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === author._id ? null : author._id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all text-muted-foreground"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenu === author._id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-in fade-in duration-100">
                            <button
                              onClick={() => openEdit(author)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Edit
                            </button>
                            <button
                              onClick={() => router.push(`/insights/author/${author.slug}`)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" /> View page
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <AuthorModal
          initial={modal.initial}
          editId={modal.editId}
          onClose={() => setModal({ open: false, initial: EMPTY_FORM })}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}