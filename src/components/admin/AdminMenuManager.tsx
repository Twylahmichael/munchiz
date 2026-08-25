import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import type { MenuItem, Category, Addon, AddonCategory, ComboOption } from "@/lib/database.types";

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
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-white">Meals</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
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
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
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
                          <img
                            src={item.photo_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">
                            {cat?.icon || "🍽️"}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-white/40 text-xs truncate max-w-[200px]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-white/60">{cat?.name || "—"}</td>
                    <td className="p-3 text-white font-medium">
                      KES {item.price.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({ id: item.id, available: !item.is_available })
                        }
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          item.is_available
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.is_available ? "Available" : "Sold Out"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this item?")) deleteMutation.mutate(item.id);
                          }}
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
        {!isLoading && !items?.length && (
          <div className="p-8 text-center text-white/40">No menu items</div>
        )}
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

  // Combo options: two selectable variants (e.g. "Burger" OR "Nuggets").
  // Edited as label + newline-separated bullet items, converted to/from the
  // combo_options jsonb array on load/save.
  const existingOptions = item?.combo_options ?? [];
  const [hasComboOptions, setHasComboOptions] = useState(existingOptions.length === 2);
  const [option1Label, setOption1Label] = useState(existingOptions[0]?.label || "Option 1");
  const [option1Items, setOption1Items] = useState(existingOptions[0]?.items.join("\n") || "");
  const [option2Label, setOption2Label] = useState(existingOptions[1]?.label || "Option 2");
  const [option2Items, setOption2Items] = useState(existingOptions[1]?.items.join("\n") || "");
  const [drinkChoiceCount, setDrinkChoiceCount] = useState(item?.drink_choice_count ?? 0);

  // Available add-ons (all) + which are currently attached to this item.
  const { data: addonCategories } = useQuery({
    queryKey: ["admin-addon-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("addon_categories").select("*").order("sort_order");
      return (data ?? []) as AddonCategory[];
    },
  });
  const { data: addons } = useQuery({
    queryKey: ["admin-addons"],
    queryFn: async () => {
      const { data } = await supabase.from("addons").select("*").order("sort_order");
      return (data ?? []) as Addon[];
    },
  });
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!item) {
      setSelectedAddonIds(new Set());
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("menu_item_addons")
        .select("addon_id")
        .eq("menu_item_id", item.id);
      setSelectedAddonIds(new Set((data ?? []).map((r: any) => r.addon_id)));
    })();
  }, [item]);

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !categoryId || !price) {
      setError("Name, category, and price are required.");
      return;
    }

    setSaving(true);
    try {
      const comboOptions: ComboOption[] = hasComboOptions
        ? [
            {
              label: option1Label.trim() || "Option 1",
              items: option1Items
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            },
            {
              label: option2Label.trim() || "Option 2",
              items: option2Items
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            },
          ]
        : [];

      const data = {
        name,
        category_id: categoryId,
        price: parseInt(price, 10),
        description,
        sort_order: parseInt(sortOrder, 10) || 0,
        photo_url: photoUrl || null,
        is_available: available,
        combo_options: comboOptions,
        drink_choice_count: drinkChoiceCount,
      };

      let savedId = item?.id;
      if (item) {
        const { error: e } = await supabase.from("menu_items").update(data).eq("id", item.id);
        if (e) throw e;
      } else {
        const { data: inserted, error: e } = await supabase
          .from("menu_items")
          .insert(data)
          .select("id")
          .single();
        if (e) throw e;
        savedId = (inserted as any)?.id;
      }

      // Sync menu_item_addons: clear then re-insert the picked set.
      if (savedId) {
        const { error: delErr } = await supabase
          .from("menu_item_addons")
          .delete()
          .eq("menu_item_id", savedId);
        if (delErr) throw delErr;
        if (selectedAddonIds.size > 0) {
          const rows = Array.from(selectedAddonIds).map((addon_id) => ({
            menu_item_id: savedId!,
            addon_id,
          }));
          const { error: insErr } = await supabase.from("menu_item_addons").insert(rows);
          if (insErr) throw insErr;
        }
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
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Price (KES) *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={0}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          />
        </div>

        <div className="md:col-span-2 border border-white/10 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Combo — two selectable options</p>
              <p className="text-xs text-white/40">
                For combos like "Solo Date" where the customer picks one of two variants at a fixed
                price.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasComboOptions(!hasComboOptions)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${hasComboOptions ? "bg-green-500" : "bg-white/20"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasComboOptions ? "left-5" : "left-0.5"}`}
              />
            </button>
          </div>

          {hasComboOptions && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Option 1 name</label>
                <input
                  value={option1Label}
                  onChange={(e) => setOption1Label(e.target.value)}
                  placeholder="e.g. Burger"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <label className="block text-xs text-white/40 mb-1">
                  Option 1 items (one per line)
                </label>
                <textarea
                  value={option1Items}
                  onChange={(e) => setOption1Items(e.target.value)}
                  rows={4}
                  placeholder={"1 beef burger\n1 medium fries\n1 small ranch sauce"}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Option 2 name</label>
                <input
                  value={option2Label}
                  onChange={(e) => setOption2Label(e.target.value)}
                  placeholder="e.g. Chicken Nuggets"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <label className="block text-xs text-white/40 mb-1">
                  Option 2 items (one per line)
                </label>
                <textarea
                  value={option2Items}
                  onChange={(e) => setOption2Items(e.target.value)}
                  rows={4}
                  placeholder={"Chicken nuggets\n1 medium fries\n1 small ranch sauce"}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-white/40 mb-1">
              Drinks included free (0 = none)
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={drinkChoiceCount}
              onChange={(e) => setDrinkChoiceCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-24 px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-xs text-white/40 mt-1">
              Customer picks this many drinks from the Drinks list at checkout — no extra charge.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1">Photo</label>
          <ImageUpload
            bucket="menu-images"
            currentUrl={photoUrl || null}
            onUpload={setPhotoUrl}
            onRemove={() => setPhotoUrl("")}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40">Available</label>
          <button
            type="button"
            onClick={() => setAvailable(!available)}
            className={`w-10 h-5 rounded-full transition-colors relative ${available ? "bg-green-500" : "bg-white/20"}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${available ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-2">Attached add-ons</label>
          {!addonCategories?.length ? (
            <p className="text-xs text-white/40">
              No add-on categories yet. Create some on the Add-ons page.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {addonCategories.map((cat) => {
                const catAddons = (addons ?? []).filter((a) => a.category_id === cat.id);
                if (!catAddons.length) return null;
                return (
                  <div key={cat.id}>
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
                      {cat.name}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {catAddons.map((a) => (
                        <label
                          key={a.id}
                          className="flex items-center gap-2 text-sm text-white/80 bg-[#1a1714] border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:border-amber-500/40"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAddonIds.has(a.id)}
                            onChange={() => toggleAddon(a.id)}
                            className="accent-amber-500"
                          />
                          <span className="flex-1 truncate">{a.name}</span>
                          <span className="text-xs text-white/40 whitespace-nowrap">
                            KES {a.price}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {error && (
          <div className="md:col-span-2 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : item ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-white/60 hover:text-white text-sm border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
