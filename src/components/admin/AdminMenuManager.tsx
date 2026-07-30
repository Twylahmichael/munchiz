import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import type { MenuItem, Category } from "@/lib/database.types";

export function AdminMenuManager() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data as Category[];
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data } = await supabase.from("menu_items").select("*").order("sort_order");
      return data as MenuItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_available: available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-white">Meals</h1>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {showForm && (
        <MenuItemForm
          item={editingItem}
          categories={categories || []}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditingItem(null);
            queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
          }}
        />
      )}

      <div className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-white/40 font-medium">Item</th>
                <th className="text-left p-3 text-white/40 font-medium">Category</th>
                <th className="text-left p-3 text-white/40 font-medium">Price</th>
                <th className="text-left p-3 text-white/40 font-medium">Status</th>
                <th className="text-left p-3 text-white/40 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => {
                const cat = categories?.find((c) => c.id === item.category_id);
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">{cat?.icon || "🍽️"}</div>
                        )}
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-white/40 text-xs truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-white/60">{cat?.name || "—"}</td>
                    <td className="p-3 text-white font-medium">KES {item.price.toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: item.id, available: !item.is_available })}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          item.is_available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.is_available ? "Available" : "Sold Out"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingItem(item); setShowForm(true); }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this item?")) deleteMutation.mutate(item.id); }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isLoading && <div className="p-8 text-center text-white/40">Loading...</div>}
        {!isLoading && !items?.length && <div className="p-8 text-center text-white/40">No menu items</div>}
      </div>
    </div>
  );
}

function MenuItemForm({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name || "");
  const [categoryId, setCategoryId] = useState(item?.category_id || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [description, setDescription] = useState(item?.description || "");
  const [sortOrder, setSortOrder] = useState(item?.sort_order?.toString() || "0");
  const [photoUrl, setPhotoUrl] = useState(item?.photo_url || "");
  const [available, setAvailable] = useState(item?.is_available ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !categoryId || !price) { setError("Name, category, and price are required."); return; }

    setSaving(true);
    try {
      const data = {
        name,
        category_id: categoryId,
        price: parseInt(price, 10),
        description,
        sort_order: parseInt(sortOrder, 10) || 0,
        photo_url: photoUrl || null,
        is_available: available,
      };

      if (item) {
        const { error: e } = await supabase.from("menu_items").update(data).eq("id", item.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("menu_items").insert(data);
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
    <div className="bg-[#242018] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{item ? "Edit Item" : "Add Item"}</h2>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Category *</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Price (KES) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={0}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Sort Order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Photo</label>
          <ImageUpload bucket="menu-images" currentUrl={photoUrl || null} onUpload={setPhotoUrl} onRemove={() => setPhotoUrl("")} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40">Available</label>
          <button type="button" onClick={() => setAvailable(!available)}
            className={`w-10 h-5 rounded-full transition-colors relative ${available ? "bg-green-500" : "bg-white/20"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${available ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
        {error && <div className="md:col-span-2 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={saving}
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : item ? "Update" : "Create"}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2 rounded-lg text-white/60 hover:text-white text-sm border border-white/10 hover:border-white/20 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
