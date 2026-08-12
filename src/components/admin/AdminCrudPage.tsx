import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface Field {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "toggle" | "date" | "datetime";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** When set to "csv_to_array", the text input value is split on commas and stored as a string array. */
  transform?: "csv_to_array";
}

interface AdminCrudPageProps {
  title: string;
  table: string;
  columns: Column[];
  fields: Field[];
  orderBy?: string;
  searchField?: string;
  defaultValues?: Record<string, unknown>;
}

export function AdminCrudPage({ title, table, columns, fields, orderBy = "created_at", searchField, defaultValues = {} }: AdminCrudPageProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: [`admin-${table}`],
    queryFn: async () => {
      let q = supabase.from(table).select("*").order(orderBy, { ascending: false });
      const { data } = await q;
      return (data || []) as Record<string, unknown>[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`admin-${table}`] }),
  });

  const filtered = searchField && search
    ? rows?.filter((r) => String(r[searchField] || "").toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display text-white">{title}</h1>
        <div className="flex items-center gap-3">
          {searchField && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm w-48 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-400 transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {showForm && (
        <CrudForm
          item={editing}
          fields={fields}
          table={table}
          defaultValues={defaultValues}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: [`admin-${table}`] }); }}
        />
      )}

      <div className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((col) => (
                  <th key={col.key} className="text-left p-3 text-white/40 font-medium">{col.label}</th>
                ))}
                <th className="text-left p-3 text-white/40 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((row) => (
                <tr key={row.id as string} className="border-b border-white/5 hover:bg-white/5">
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-white/80">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(row); setShowForm(true); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(row.id as string); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <div className="p-8 text-center text-white/40">Loading...</div>}
        {!isLoading && !filtered?.length && <div className="p-8 text-center text-white/40">No data</div>}
      </div>
    </div>
  );
}

function CrudForm({ item, fields, table, defaultValues, onClose, onSaved }: {
  item: Record<string, unknown> | null;
  fields: Field[];
  table: string;
  defaultValues: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    if (item) {
      const v: Record<string, unknown> = {};
      fields.forEach((f) => {
        let val = item[f.key] ?? defaultValues[f.key] ?? "";
        // Convert arrays back to CSV string for editing
        if (f.transform === "csv_to_array" && Array.isArray(val)) {
          val = (val as string[]).join(", ");
        }
        v[f.key] = val;
      });
      return v;
    }
    const v: Record<string, unknown> = {};
    fields.forEach((f) => {
      let val = defaultValues[f.key] ?? "";
      if (f.transform === "csv_to_array" && Array.isArray(val)) {
        val = (val as string[]).join(", ");
      }
      v[f.key] = val;
    });
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      fields.forEach((f) => {
        let val = values[f.key];
        if (f.type === "number") val = Number(val) || 0;
        if (f.type === "toggle") val = Boolean(val);
        if (f.transform === "csv_to_array") {
          val = String(val || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        data[f.key] = val;
      });

      if (item) {
        const { error: e } = await supabase.from(table).update(data).eq("id", item.id as string);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from(table).insert(data);
        if (e) throw e;
      }
      onSaved();
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#242018] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{item ? "Edit" : "Add New"}</h2>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="block text-xs text-white/40 mb-1">{field.label}{field.required ? " *" : ""}</label>
            {field.type === "textarea" ? (
              <textarea value={String(values[field.key] || "")} onChange={(e) => set(field.key, e.target.value)}
                rows={2} required={field.required} placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500" />
            ) : field.type === "select" ? (
              <select value={String(values[field.key] || "")} onChange={(e) => set(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500">
                <option value="">Select...</option>
                {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : field.type === "toggle" ? (
              <button type="button" onClick={() => set(field.key, !values[field.key])}
                className={`w-10 h-5 rounded-full transition-colors relative ${values[field.key] ? "bg-green-500" : "bg-white/20"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${values[field.key] ? "left-5" : "left-0.5"}`} />
              </button>
            ) : (
              <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
                value={String(values[field.key] || "")} onChange={(e) => set(field.key, e.target.value)}
                required={field.required} placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            )}
          </div>
        ))}
        {error && <div className="md:col-span-2 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={saving}
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50">
            {saving ? "Saving..." : item ? "Update" : "Create"}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2 rounded-lg text-white/60 hover:text-white text-sm border border-white/10">Cancel</button>
        </div>
      </form>
    </div>
  );
}
