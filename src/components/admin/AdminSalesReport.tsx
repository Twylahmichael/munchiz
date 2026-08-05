import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AdminSalesReport() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("week");

  const { data: orders } = useQuery({
    queryKey: ["sales-report", period],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      const now = new Date();
      if (period === "today") {
        q = q.gte("created_at", now.toISOString().split("T")[0]);
      } else if (period === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        q = q.gte("created_at", weekAgo.toISOString());
      } else if (period === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        q = q.gte("created_at", monthAgo.toISOString());
      }
      const { data } = await q;
      return data || [];
    },
  });

  const totalRevenue = orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const completedOrders = orders?.filter((o) => o.status === "completed").length || 0;

  const statusCounts = orders?.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4"];

  const dailyData = orders?.reduce((acc, o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-KE", { weekday: "short" });
    const existing = acc.find((d) => d.day === day);
    if (existing) { existing.revenue += o.total_amount || 0; existing.orders += 1; }
    else acc.push({ day, revenue: o.total_amount || 0, orders: 1 });
    return acc;
  }, [] as { day: string; revenue: number; orders: number }[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display text-white">Sales Report</h1>
        <div className="flex gap-2">
          {(["today", "week", "month", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${period === p ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
          { label: "Orders", value: totalOrders, icon: ShoppingBag, color: "text-blue-400" },
          { label: "Avg Order", value: `KES ${avgOrder}`, icon: TrendingUp, color: "text-amber-400" },
          { label: "Completed", value: completedOrders, icon: Users, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#242018] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <span className="text-white/40 text-xs">{label}</span>
            </div>
            <p className="text-xl font-display text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-semibold mb-4">Revenue by Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-semibold mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
