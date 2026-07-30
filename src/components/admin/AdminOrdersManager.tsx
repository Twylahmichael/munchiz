import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/database.types";

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "on_the_way", "completed"];

export function AdminOrdersManager() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      return (data || []) as Order[];
    },
    refetchInterval: 15_000,
  });

  const { data: drivers } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data } = await supabase.from("drivers").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const driverMutation = useMutation({
    mutationFn: async ({ id, driverId }: { id: string; driverId: string | null }) => {
      const { error } = await supabase.from("orders").update({ assigned_driver_id: driverId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const filtered = search
    ? orders?.filter((o) =>
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_phone.includes(search) ||
        o.id.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-white">Orders</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, ref..."
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm w-56 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {["all", "pending", "confirmed", "preparing", "on_the_way", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap ${
                statusFilter === s ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}>
              {s === "on_the_way" ? "On The Way" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-center text-white/40 py-8">Loading...</div>}
        {!isLoading && !filtered?.length && <div className="text-center text-white/40 py-8">No orders</div>}
        {filtered?.map((order) => {
          const isExpanded = expandedId === order.id;
          const items = (order.items_summary as Array<{ name: string; quantity: number; subtotal: number }>) || [];
          const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status as OrderStatus) + 1];

          return (
            <div key={order.id} className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full p-4 flex items-center justify-between text-left">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono text-xs text-white/40">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-white font-medium">{order.customer_name}</span>
                  <span className="text-white/60 text-sm">{items.length} items</span>
                  <span className="text-white font-bold">KES {order.total_amount.toLocaleString()}</span>
                  <span className="text-white/40 text-xs capitalize">{order.payment_method}</span>
                  <StatusBadge status={order.status} />
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-white/40 text-xs uppercase tracking-wider">Items</p>
                      {items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-white/80">{item.quantity}x {item.name}</span>
                          <span className="text-white">KES {item.subtotal.toLocaleString()}</span>
                        </div>
                      ))}
                      {order.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm border-t border-white/5 pt-1">
                          <span className="text-white/40">Delivery</span>
                          <span className="text-white/60">KES {order.delivery_fee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t border-white/5 pt-1">
                        <span className="text-white">Total</span>
                        <span className="text-amber-400">KES {order.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-white/40 text-xs uppercase tracking-wider">Customer</p>
                      <p className="text-white">{order.customer_name} &middot; {order.customer_phone}</p>
                      <p className="text-white/60 capitalize">{order.order_type}</p>
                      {order.delivery_address && <p className="text-white/40">{order.delivery_address}</p>}
                      {order.delivery_notes && <p className="text-white/40 italic">{order.delivery_notes}</p>}
                      <p className="text-white/30 text-xs">
                        {new Date(order.created_at).toLocaleString("en-KE")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {nextStatus && order.status !== "cancelled" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: nextStatus })}
                        className="bg-amber-500 text-black px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-amber-400">
                        Mark as {nextStatus === "on_the_way" ? "On The Way" : nextStatus}
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "completed" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: "cancelled" })}
                        className="border border-red-500/30 text-red-400 px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-red-500/10">
                        Cancel
                      </button>
                    )}
                    {drivers && drivers.length > 0 && (
                      <select
                        value={order.assigned_driver_id || ""}
                        onChange={(e) => driverMutation.mutate({ id: order.id, driverId: e.target.value || null })}
                        className="px-3 py-1.5 rounded-lg bg-[#1a1714] border border-white/10 text-white text-xs">
                        <option value="">Assign driver...</option>
                        {drivers.map((d: Record<string, unknown>) => (
                          <option key={d.id as string} value={d.id as string}>{d.name as string}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    confirmed: "bg-blue-500/20 text-blue-400",
    preparing: "bg-purple-500/20 text-purple-400",
    on_the_way: "bg-green-500/20 text-green-400",
    completed: "bg-white/10 text-white/60",
    cancelled: "bg-red-500/20 text-red-400",
  };
  const labels: Record<string, string> = { on_the_way: "On The Way" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${styles[status] || "bg-white/10 text-white/60"}`}>
      {labels[status] || status}
    </span>
  );
}
