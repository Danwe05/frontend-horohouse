"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Search, MoreHorizontal, Pencil, Trash2,
  Tag, Layers, Loader2, AlertCircle, CheckCircle2, X,
  Hash, FolderOpen, BarChart3,
} from "lucide-react";
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from "@/lib/utils";
import { insightsAdminApi } from "@/lib/insights-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  accentColor?: string;
  icon?: string;
  postCount?: number;
  isActive?: boolean;
  sortOrder?: number;
}

interface TagItem {
  _id: string;
  name: string;
  slug: string;
  usageCount?: number;
  isActive?: boolean;
}

interface CategoryForm {
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_CAT: CategoryForm = {
  name: "", description: "", accentColor: "#2563EB",
  icon: "", isActive: true, sortOrder: 0,
};


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

// ─── Category modal ───────────────────────────────────────────────────────────

function CategoryModal({
  initial, editId, onClose, onSaved,
}: {
  initial: CategoryForm;
  editId?: string;
  onClose: () => void;
  onSaved: (cat: Category) => void;
}) {
  const [form, setForm] = useState<CategoryForm>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (key: keyof CategoryForm, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return setErr("Name is required");
    setSaving(true);
    setErr("");
    try {
      const result: Category = editId
        ? await insightsAdminApi.updateCategory(editId, form)
        : await insightsAdminApi.createCategory(form);
      onSaved(result);
    } catch (e: any) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const PRESET_COLORS = [
    "#2563EB", "#7C3AED", "#059669", "#D97706",
    "#DC2626", "#0891B2", "#9333EA", "#65A30D",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{editId ? "Edit category" : "New category"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Icon (emoji / text)</label>
              <input
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="🏠"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Accent colour</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("accentColor", c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform hover:scale-110",
                    form.accentColor === c && "ring-2 ring-offset-2 ring-foreground"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0"
                title="Custom colour"
              />
            </div>
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
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {editId ? "Save changes" : "Create category"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const router = useRouter();

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModal, setCatModal] = useState<{ open: boolean; initial: CategoryForm; editId?: string }>({
    open: false, initial: EMPTY_CAT,
  });
  const [catMenu, setCatMenu] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);

  // Tags
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagLoading, setTagLoading] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [tagDeleteId, setTagDeleteId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"categories" | "tags">("categories");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadCategories = async () => {
    setCatLoading(true);
    try {
      const data = await insightsAdminApi.getCategories();
      setCategories(data ?? []);
    } catch {
      showToast("Failed to load categories", "error");
    } finally {
      setCatLoading(false);
    }
  };

  const loadTags = async () => {
    setTagLoading(true);
    try {
      const res = await insightsAdminApi.getTags({ limit: 200 });
      setTags(res.data ?? []);
    } catch {
      showToast("Failed to load tags", "error");
    } finally {
      setTagLoading(false);
    }
  };

  useEffect(() => { loadCategories(); loadTags(); }, []);

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const handleCatSaved = (cat: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c._id === cat._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = cat; return next; }
      return [cat, ...prev];
    });
    setCatModal({ open: false, initial: EMPTY_CAT });
    showToast(catModal.editId ? "Category updated" : "Category created");
  };

  const handleCatDelete = async (id: string) => {
    try {
      await insightsAdminApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      showToast("Category deleted");
    } catch (e: any) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setCatDeleteId(null);
    }
  };

  // ── Tag CRUD ──────────────────────────────────────────────────────────────
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    setAddingTag(true);
    try {
      const result = await insightsAdminApi.createTag(newTagName.trim());
      setTags((prev) => [result as TagItem, ...prev]);
      setNewTagName("");
      showToast("Tag created");
    } catch (e: any) {
      showToast(e.message || "Failed to create tag", "error");
    } finally {
      setAddingTag(false);
    }
  };

  const handleTagDelete = async (id: string) => {
    try {
      await insightsAdminApi.deleteTag(id);
      setTags((prev) => prev.filter((t) => t._id !== id));
      showToast("Tag deleted");
    } catch (e: any) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setTagDeleteId(null);
    }
  };

  const filteredCats = categories.filter(
    (c) => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredTags = tags.filter(
    (t) => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

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
              <h1 className="text-lg font-bold">Categories & Tags</h1>
              <p className="text-xs text-muted-foreground">
                {categories.length} categories · {tags.length} tags
              </p>
            </div>
          </div>
          {activeTab === "categories" ? (
            <button
              onClick={() => setCatModal({ open: true, initial: EMPTY_CAT })}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add category
            </button>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-0 max-w-screen-xl mx-auto">
          {(["categories", "tags"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "categories" ? <Layers className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ══ Categories tab ══ */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search categories…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>

            {catLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <FolderOpen className="w-10 h-10" />
                <p className="text-sm">No categories yet</p>
                <button
                  onClick={() => setCatModal({ open: true, initial: EMPTY_CAT })}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCats.map((cat) => (
                  <div
                    key={cat._id}
                    className="relative group rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${cat.accentColor ?? "#2563EB"}18` }}
                        >
                          {cat.icon || (
                            <Layers
                              className="w-5 h-5"
                              style={{ color: cat.accentColor ?? "#2563EB" }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                        </div>
                      </div>

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setCatMenu(catMenu === cat._id ? null : cat._id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all text-muted-foreground"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {catMenu === cat._id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-in fade-in duration-100">
                            <button
                              onClick={() => {
                                setCatModal({
                                  open: true,
                                  editId: cat._id,
                                  initial: {
                                    name: cat.name,
                                    description: cat.description ?? "",
                                    accentColor: cat.accentColor ?? "#2563EB",
                                    icon: cat.icon ?? "",
                                    isActive: cat.isActive ?? true,
                                    sortOrder: cat.sortOrder ?? 0,
                                  },
                                });
                                setCatMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                            >
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Edit
                            </button>
                            <button
                              onClick={() => { setCatDeleteId(cat._id); setCatMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {cat.description && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BarChart3 className="w-3.5 h-3.5" />
                        {cat.postCount} article{cat.postCount !== 1 ? "s" : ""}
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        cat.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                      )}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Color bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
                      style={{ backgroundColor: cat.accentColor ?? "#2563EB" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ Tags tab ══ */}
        {activeTab === "tags" && (
          <div className="space-y-4">
            {/* Add tag */}
            <div className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="New tag name…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
                />
              </div>
              <button
                onClick={handleAddTag}
                disabled={addingTag || !newTagName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addingTag ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Filter tags…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-background"
              />
            </div>

            {tagLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Tag className="w-10 h-10" />
                <p className="text-sm">No tags yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => (
                  <div
                    key={tag._id}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{tag.name}</span>
                    {(tag.usageCount ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {tag.usageCount}
                      </span>
                    )}
                    <button
                      onClick={() => setTagDeleteId(tag._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category modal */}
      {catModal.open && (
        <CategoryModal
          initial={catModal.initial}
          editId={catModal.editId}
          onClose={() => setCatModal({ open: false, initial: EMPTY_CAT })}
          onSaved={handleCatSaved}
        />
      )}

      {/* Category delete confirm */}
      {catDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-semibold mb-2">Delete category?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will fail if the category has articles. Reassign them first.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCatDeleteId(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={() => handleCatDelete(catDeleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag delete confirm */}
      {tagDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-semibold mb-2">Delete tag?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              It will be removed from all articles automatically.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setTagDeleteId(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={() => handleTagDelete(tagDeleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}