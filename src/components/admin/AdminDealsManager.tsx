import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import type { Deal } from "@/lib/database.types";

export function AdminDealsManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Deal | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["admin-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-deals"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("deals").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-deals"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-white">Deals & Promos</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} /> Add Deal
        </button>
      </div>

      {(creating || editing) && (
        <DealForm
          deal={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
          }}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-white/40">Loading...</div>
      ) : (
        <div className="space-y-3">
          {deals?.map((deal) => (
            <div key={deal.id} className="bg-[#242018] rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {deal.photo_url && (
                  <img src={deal.photo_url} alt={deal.title} className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" />
                )}
                <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white">{deal.title}</h3>
                  <button
                    onClick={() => toggleMutation.mutate({ id: deal.id, is_active: !deal.is_active })}
                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      deal.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {deal.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
                <p className="text-white/40 text-sm">{deal.description}</p>
                <p className="text-sm mt-1">
                  {deal.original_price > deal.deal_price && (
                    <span className="line-through text-white/30 mr-2">KES {deal.original_price}</span>
                  )}
                  <span className="font-bold text-amber-400">KES {deal.deal_price}</span>
                </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(deal); setCreating(false); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm(`Delete "${deal.title}"?`)) deleteMutation.mutate(deal.id); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DealForm({ deal, onClose, onSaved }: { deal: Deal | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(deal?.title || "");
  const [description, setDescription] = useState(deal?.description || "");
  const [imageUrl, setImageUrl] = useState(deal?.photo_url || "");
  const [originalPrice, setOriginalPrice] = useState(deal?.original_price?.toString() || "0");
  const [dealPrice, setDealPrice] = useState(deal?.deal_price?.toString() || "");
  const [isActive, setIsActive] = useState(deal?.is_active ?? true);
  const [startDate, setStartDate] = useState(deal?.start_date || "");
  const [endDate, setEndDate] = useState(deal?.end_date || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      photo_url: imageUrl || null,
      original_price: parseInt(originalPrice, 10) || 0,
      deal_price: parseInt(dealPrice, 10),
      is_active: isActive,
      start_date: startDate || null,
      end_date: endDate || null,
    };
    try {
      if (deal) {
        const { error } = await supabase.from("deals").update(payload).eq("id", deal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("deals").insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500";

  return (
    <div className="bg-[#242018] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{deal ? "Edit Deal" : "New Deal"}</h2>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div><label className="block text-xs text-white/40 mb-1">Title *</label><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></div>
        <div className="flex items-center gap-3 self-end">
          <label className="text-xs text-white/40">Active</label>
          <button type="button" onClick={() => setIsActive(!isActive)} className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? "bg-green-500" : "bg-white/20"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
        <div className="md:col-span-2"><label className="block text-xs text-white/40 mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></div>
        <div className="md:col-span-2">
          <label className="block text-xs text-white/40 mb-1">Deal Image</label>
          <ImageUpload bucket="menu-images" folder="deals" currentUrl={imageUrl || null} onUpload={(url) => setImageUrl(url)} onRemove={() => setImageUrl("")} />
        </div>
        <div><label className="block text-xs text-white/40 mb-1">Original Price (KES)</label><input type="number" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className={inputCls} /></div>
        <div><label className="block text-xs text-white/40 mb-1">Deal Price (KES) *</label><input required type="number" min="1" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} className={inputCls} /></div>
        <div><label className="block text-xs text-white/40 mb-1">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></div>
        <div><label className="block text-xs text-white/40 mb-1">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} /></div>
        {error && <div className="md:col-span-2 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={saving} className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50">{saving ? "Saving..." : deal ? "Update" : "Create"}</button>
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-white/60 hover:text-white text-sm border border-white/10">Cancel</button>
        </div>
      </form>
    </div>
  );
}
