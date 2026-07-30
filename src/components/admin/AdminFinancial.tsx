import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AdminFinancial() {
  const { data: orders } = useQuery({
    queryKey: ["financial-orders"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("orders").select("total_amount, created_at, status").gte("created_at", thirtyDaysAgo);
      return data || [];
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["financial-expenses"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const { data } = await supabase.from("expenses").select("amount, category, date").gte("date", thirtyDaysAgo);
      return data || [];
    },
  });

  const totalRevenue = orders?.filter((o) => o.status === "completed").reduce((s, o) => s + (o.total_amount || 0), 0) || 0;
  const totalExpenses = expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;

  const expensesByCategory = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  const categoryData = Object.entries(expensesByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-white">Financial Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Revenue (30d)", value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
          { label: "Expenses (30d)", value: `KES ${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: "text-red-400" },
          { label: "Net Profit", value: `KES ${netProfit.toLocaleString()}`, icon: TrendingUp, color: netProfit >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Margin", value: totalRevenue > 0 ? `${Math.round((netProfit / totalRevenue) * 100)}%` : "—", icon: Wallet, color: "text-amber-400" },
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

      <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
        <h3 className="text-white font-semibold mb-4">Expenses by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} width={100} />
            <Tooltip contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => `KES ${v.toLocaleString()}`} />
            <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
