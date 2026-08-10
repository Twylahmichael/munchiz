import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Addon, AddonCategory } from "@/lib/database.types";

// One page that manages both add-on categories AND the add-ons in them.
// Categories on the left, add-ons on the right filtered to the active category.
export function AdminAddonsManager() {
  const qc = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AddonCategory | null>(null);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["admin-addon-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("addon_categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as AddonCategory[];
    },
  });

  const { data: addons, isLoading: addonsLoading } = useQuery({
    queryKey: ["admin-addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("addons").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Addon[];
    },
  });

  const activeCategory =
    categories?.find((c) => c.id === activeCategoryId) ?? categories?.[0] ?? null;

  const currentAddons = (addons ?? []).filter(
    (a) => activeCategory && a.category_id === activeCategory.id
  );

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addon_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-addon-categories"] });
      setActiveCategoryId(null);
    },
  });

  const deleteAddon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-addons"] }),
  });

  const toggleAddon = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("addons").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-addons"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-white">Add-ons</h1>
          <p className="text-white/40 text-sm mt-1">
            Group add-ons into categories, then attach them to menu items on the Meals page.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Categories column */}
        <div className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Categories</h2>
            <button
              onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
              aria-label="Add category"
            >
              <Plus size={16} />
            </button>
          </div>
          {catsLoading && <div className="p-4 text-white/40 text-sm">Loading…</div>}
          {!catsLoading && !categories?.length && (
            <div className="p-4 text-white/40 text-sm">No categories yet. Add one to get started.</div>
          )}
          <ul>
            {categories?.map((cat) => (
              <li
                key={cat.id}
                className={`group flex items-center border-b border-white/5 last:border-b-0 ${
                  activeCategory?.id === cat.id ? "bg-white/5" : ""
                }`}
              >
                <button
                  onClick={() => setActiveCategoryId(cat.id)}
                  className="flex-1 text-left px-4 py-3 text-sm text-white hover:bg-white/5"
                >
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-xs text-white/40">
                    {(addons ?? []).filter((a) => a.category_id === cat.id).length} add-ons ·{" "}
                    {cat.is_active ? "Active" : "Inactive"}
                  </div>
                </button>
                <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingCategory(cat); setShowCategoryForm(true); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"? This won't delete its add-ons unless the DB refuses.`))
                        deleteCategory.mutate(cat.id);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Add-ons column */}
        <div className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider">
                {activeCategory ? activeCategory.name : "Add-ons"}
              </h2>
              {activeCategory && (
                <p className="text-white/40 text-xs mt-0.5">Slug: {activeCategory.slug}</p>
              )}
            </div>
            <button
              onClick={() => {
                if (!activeCategory) { alert("Create a category first."); return; }
                setEditingAddon(null);
                setShowAddonForm(true);
              }}
              disabled={!activeCategory}
              className="bg-amber-500 text-black px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Add add-on
            </button>
          </div>

          {addonsLoading && <div className="p-6 text-white/40 text-sm">Loading…</div>}
          {!addonsLoading && activeCategory && currentAddons.length === 0 && (
            <div className="p-6 text-white/40 text-sm">
              No add-ons in this category yet.
            </div>
          )}
          {!addonsLoading && !activeCategory && (
            <div className="p-6 text-white/40 text-sm">Pick a category on the left.</div>
          )}
          <ul className="divide-y divide-white/5">
            {currentAddons.map((a) => (
              <li key={a.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{a.name}</p>
                  {a.description && (
                    <p className="text-white/40 text-xs truncate">{a.description}</p>
                  )}
                </div>
                <span className="text-amber-400 font-semibold text-sm whitespace-nowrap">
                  KES {a.price.toLocaleString()}
                </span>
                <button
                  onClick={() => toggleAddon.mutate({ id: a.id, active: !a.is_active })}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                    a.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {a.is_active ? "Active" : "Hidden"}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingAddon(a); setShowAddonForm(true); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete add-on "${a.name}"?`)) deleteAddon.mutate(a.id); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onClose={() => { setShowCategoryForm(false); setEditingCategory(null); }}
          onSaved={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
            qc.invalidateQueries({ queryKey: ["admin-addon-categories"] });
          }}
        />
      )}
      {showAddonForm && activeCategory && (
        <AddonForm
          addon={editingAddon}
          categoryId={activeCategory.id}
          onClose={() => { setShowAddonForm(false); setEditingAddon(null); }}
          onSaved={() => {
            setShowAddonForm(false);
            setEditingAddon(null);
            qc.invalidateQueries({ queryKey: ["admin-addons"] });
          }}
        />
      )}
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: AddonCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [active, setActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name) { setError("Name is required."); return; }
    const finalSlug = slug || slugify(name);

    setSaving(true);
    try {
      const data = {
        name,
        slug: finalSlug,
        sort_order: parseInt(sortOrder, 10) || 0,
        is_active: active,
      };
      if (category) {
        const { error: e } = await supabase.from("addon_categories").update(data).eq("id", category.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("addon_categories").insert(data);
        if (e) throw e;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={category ? "Edit category" : "New category"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); if (!category && !slug) setSlug(slugify(e.target.value)); }}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from name"
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <label className="text-xs text-white/40">Active</label>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`w-10 h-5 rounded-full transition-colors relative ${active ? "bg-green-500" : "bg-white/20"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${active ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
        {error && <div className="md:col-span-2 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={saving} className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : category ? "Update" : "Create"}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-white/60 hover:text-white text-sm border border-white/10 hover:border-white/20 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AddonForm({
  addon,
  categoryId,
  onClose,
  onSaved,
}: {
  addon: Addon | null;
  categoryId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(addon?.name || "");
  const [description, setDescription] = useState(addon?.description || "");
  const [price, setPrice] = useState(String(addon?.price ?? 0));
  const [sortOrder, setSortOrder] = useState(String(addon?.sort_order ?? 0));
  const [active, setActive] = useState(addon?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name) { setError("Name is required."); return; }
    setSaving(true);
    try {
      const data = {
        category_id: categoryId,
        name,
        description,
        price: parseInt(price, 10) || 0,
        sort_order: parseInt(sortOrder, 10) || 0,
        is_active: active,
      };
      if (addon) {
        const { error: e } = await supabase.from("addons").update(data).eq("id", addon.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("addons").insert(data);
        if (e) throw e;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={addon ? "Edit add-on" : "New add-on"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Price (KES) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={0}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Sort order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <label className="text-xs text-white/40">Active</label>
          <button type="button" onClick={() => setActive(!active)}
            className={`w-10 h-5 rounded-full transition-colors relative ${active ? "bg-green-500" : "bg-white/20"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${active ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
        {error && <div className="md:col-span-2 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={saving} className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : addon ? "Update" : "Create"}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-white/60 hover:text-white text-sm border border-white/10 hover:border-white/20 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-[#242018] rounded-xl p-5 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X size={18} /></button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
