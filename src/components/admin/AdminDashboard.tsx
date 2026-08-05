import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, DollarSign, TrendingUp, Clock, Heart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/lib/supabase";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, allOrdersRes, menuRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status, payment_method").gte("created_at", today.toISOString()),
        supabase.from("orders").select("id, total_amount, status, customer_name, payment_method, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("menu_items").select("id, name, favorites_count, price").order("favorites_count", { ascending: false }).limit(3),
      ]);

      const todayOrders = ordersRes.data || [];
      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const pendingCount = todayOrders.filter((o) => o.status === "pending").length;
      const avgOrder = todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;

      const mpesaCount = todayOrders.filter((o) => o.payment_method === "mpesa").length;
      const cashCount = todayOrders.filter((o) => o.payment_method === "cash").length;

      return {
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingOrders: pendingCount,
        avgOrderValue: avgOrder,
        totalMenuItems: menuRes.data?.length || 0,
        recentOrders: allOrdersRes.data || [],
        topFavorites: menuRes.data || [],
        paymentMethods: [
          { name: "M-Pesa", value: mpesaCount, color: "#22c55e" },
          { name: "Cash", value: cashCount, color: "#f59e0b" },
        ],
      };
    },
    refetchInterval: 30_000,
  });

  const cards = [
    { label: "Revenue Today", value: stats ? `KES ${stats.todayRevenue.toLocaleString()}` : "—", icon: DollarSign, color: "bg-green-500" },
    { label: "Orders Today", value: stats?.todayOrders ?? "—", icon: ShoppingCart, color: "bg-amber-500" },
    { label: "Avg Order Value", value: stats ? `KES ${stats.avgOrderValue.toLocaleString()}` : "—", icon: TrendingUp, color: "bg-blue-500" },
    { label: "Pending Orders", value: stats?.pendingOrders ?? "—", icon: Clock, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-white">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-[#242018] rounded-xl p-4 border border-white/5">
              <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-xl font-bold text-white">{card.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#242018] rounded-xl p-5 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-white/40 font-medium">Ref</th>
                    <th className="text-left py-2 text-white/40 font-medium">Customer</th>
                    <th className="text-left py-2 text-white/40 font-medium">Total</th>
                    <th className="text-left py-2 text-white/40 font-medium">Payment</th>
                    <th className="text-left py-2 text-white/40 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: Record<string, unknown>) => (
                    <tr key={order.id as string} className="border-b border-white/5">
                      <td className="py-2.5 font-mono text-xs text-white/60">#{(order.id as string).slice(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 text-white">{order.customer_name as string}</td>
                      <td className="py-2.5 text-white font-medium">KES {(order.total_amount as number).toLocaleString()}</td>
                      <td className="py-2.5 text-white/60 capitalize">{order.payment_method as string}</td>
                      <td className="py-2.5"><StatusBadge status={order.status as string} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-white/40 text-center py-8">No orders yet</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#242018] rounded-xl p-5 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-3">Payment Methods</h2>
            {stats?.paymentMethods && stats.paymentMethods.some((p) => p.value > 0) ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.paymentMethods} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                      {stats.paymentMethods.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#242018", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  {stats.paymentMethods.map((m) => (
                    <span key={m.name} className="flex items-center gap-1 text-white/60">
                      <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      {m.name} ({m.value})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-center py-8 text-sm">No data yet</p>
            )}
          </div>

          <div className="bg-[#242018] rounded-xl p-5 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-3">Most Favorited</h2>
            {stats?.topFavorites && stats.topFavorites.length > 0 ? (
              <div className="space-y-3">
                {stats.topFavorites.map((item: Record<string, unknown>) => (
                  <div key={item.id as string} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-lg">🍔</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name as string}</p>
                      <p className="text-white/40 text-xs">KES {(item.price as number).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 text-red-400 text-sm">
                      <Heart size={14} className="fill-current" />
                      {(item.favorites_count as number) || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-4 text-sm">No favorites yet</p>
            )}
          </div>
        </div>
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
