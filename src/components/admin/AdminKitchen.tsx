import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, CheckCircle, ChefHat } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/database.types";

function minutesAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export function AdminKitchen() {
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "confirmed", "preparing"])
        .order("created_at", { ascending: true });
      return (data || []) as Order[];
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("kitchen-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] }),
  });

  const pending = orders?.filter((o) => o.status === "pending") || [];
  const confirmed = orders?.filter((o) => o.status === "confirmed") || [];
  const preparing = orders?.filter((o) => o.status === "preparing") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChefHat size={24} className="text-amber-400" />
        <h1 className="text-2xl font-display text-white">Kitchen Display</h1>
        <span className="text-white/40 text-sm">
          {orders?.length || 0} active order{orders?.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <KitchenColumn title="New Orders" orders={pending} color="yellow"
          actionLabel="Accept" onAction={(id) => statusMutation.mutate({ id, status: "confirmed" })} />
        <KitchenColumn title="Confirmed" orders={confirmed} color="blue"
          actionLabel="Start Preparing" onAction={(id) => statusMutation.mutate({ id, status: "preparing" })} />
        <KitchenColumn title="Preparing" orders={preparing} color="purple"
          actionLabel="Ready" onAction={(id) => statusMutation.mutate({ id, status: "on_the_way" })} />
      </div>
    </div>
  );
}

function KitchenColumn({ title, orders, color, actionLabel, onAction }: {
  title: string;
  orders: Order[];
  color: string;
  actionLabel: string;
  onAction: (id: string) => void;
}) {
  const colorMap: Record<string, string> = {
    yellow: "border-yellow-500/30 bg-yellow-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
  };
  const badgeMap: Record<string, string> = {
    yellow: "bg-yellow-500/20 text-yellow-400",
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className={`rounded-xl border ${colorMap[color]} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeMap[color]}`}>{orders.length}</span>
      </div>
      <div className="space-y-3">
        {orders.map((order) => {
          const items = (order.items_summary as Array<{ name: string; quantity: number }>) || [];
          const mins = minutesAgo(order.created_at);
          return (
            <div key={order.id} className="bg-[#242018] rounded-lg p-3 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-white/40">#{order.id.slice(0, 8).toUpperCase()}</span>
                <span className={`flex items-center gap-1 text-xs ${mins > 15 ? "text-red-400" : mins > 8 ? "text-yellow-400" : "text-white/40"}`}>
                  <Clock size={12} />
                  {mins}m
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {items.map((item, i) => (
                  <p key={i} className="text-white text-sm">
                    <span className="text-amber-400 font-bold">{item.quantity}x</span> {item.name}
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs capitalize">{order.order_type}</span>
                <button
                  onClick={() => onAction(order.id)}
                  className="bg-amber-500 text-black px-3 py-1 rounded-lg font-bold text-xs hover:bg-amber-400 flex items-center gap-1"
                >
                  <CheckCircle size={12} />
                  {actionLabel}
                </button>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-white/20 text-center py-4 text-sm">No orders</p>
        )}
      </div>
    </div>
  );
}
