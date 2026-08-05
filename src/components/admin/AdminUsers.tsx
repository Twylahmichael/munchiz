import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, ShieldOff, UserPlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return (data || []) as Profile[];
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, role, approved }: { id: string; role: string; approved: boolean }) => {
      const { error } = await supabase.from("profiles").update({ role, is_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filtered = users?.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display text-white">Users</h1>
        <button onClick={() => setShowCreateAdmin(true)}
          className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-400">
          <UserPlus size={16} />
          Create Admin
        </button>
      </div>

      {showCreateAdmin && (
        <CreateAdminForm onClose={() => setShowCreateAdmin(false)} onCreated={() => {
          setShowCreateAdmin(false);
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }} />
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm w-48 focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        {["all", "customer", "admin"].map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
              roleFilter === r ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
            }`}>{r}</button>
        ))}
      </div>

      <div className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-white/40 font-medium">User</th>
                <th className="text-left p-3 text-white/40 font-medium">Phone</th>
                <th className="text-left p-3 text-white/40 font-medium">Role</th>
                <th className="text-left p-3 text-white/40 font-medium">Status</th>
                <th className="text-left p-3 text-white/40 font-medium">Joined</th>
                <th className="text-left p-3 text-white/40 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div>
                      <p className="text-white font-medium">{user.full_name || "—"}</p>
                      <p className="text-white/40 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-3 text-white/60">{user.phone || "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      user.role === "admin" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/60"
                    }`}>{user.role}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      user.is_approved ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>{user.is_approved ? "Active" : "Pending"}</span>
                  </td>
                  <td className="p-3 text-white/40 text-xs">
                    {new Date(user.created_at).toLocaleDateString("en-KE")}
                  </td>
                  <td className="p-3">
                    {user.role === "admin" ? (
                      <button onClick={() => toggleAdmin.mutate({ id: user.id, role: "customer", approved: true })}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors" title="Remove admin">
                        <ShieldOff size={14} />
                      </button>
                    ) : (
                      <button onClick={() => toggleAdmin.mutate({ id: user.id, role: "admin", approved: true })}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-400 transition-colors" title="Make admin">
                        <Shield size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <div className="p-8 text-center text-white/40">Loading...</div>}
      </div>
    </div>
  );
}

function CreateAdminForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { data, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        await supabase.from("profiles").update({ role: "admin", is_approved: true, full_name: fullName }).eq("id", data.user.id);
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#242018] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Create Admin Account</h2>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-1">Full Name *</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Temp Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm" />
        </div>
        {error && <div className="md:col-span-3 bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
        <div className="md:col-span-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50">
            {saving ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </form>
    </div>
  );
}
