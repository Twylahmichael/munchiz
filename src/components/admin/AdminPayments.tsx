import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CreditCard, Smartphone, Banknote } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AdminPayments() {
  const { data: orders } = useQuery({
    queryKey: ["payment-analytics"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("payment_method, payment_status, total_amount, status");
      return data || [];
    },
  });

  const mpesaOrders = orders?.filter((o) => o.payment_method === "mpesa") || [];
  const cashOrders = orders?.filter((o) => o.payment_method === "cash") || [];
  const mpesaTotal = mpesaOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const cashTotal = cashOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

  const pieData = [
    { name: "M-Pesa", value: mpesaTotal },
    { name: "Cash", value: cashTotal },
  ].filter((d) => d.value > 0);

  const pendingPayments = orders?.filter((o) => o.payment_status === "pending" && o.status !== "cancelled") || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-white">Payments</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={16} className="text-green-400" />
            <span className="text-white/40 text-xs">M-Pesa</span>
          </div>
          <p className="text-xl font-display text-white">KES {mpesaTotal.toLocaleString()}</p>
          <p className="text-white/30 text-xs mt-1">{mpesaOrders.length} transactions</p>
        </div>
        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={16} className="text-amber-400" />
            <span className="text-white/40 text-xs">Cash</span>
          </div>
          <p className="text-xl font-display text-white">KES {cashTotal.toLocaleString()}</p>
          <p className="text-white/30 text-xs mt-1">{cashOrders.length} transactions</p>
        </div>
        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-red-400" />
            <span className="text-white/40 text-xs">Pending</span>
          </div>
          <p className="text-xl font-display text-white">{pendingPayments.length}</p>
          <p className="text-white/30 text-xs mt-1">unpaid orders</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-semibold mb-4">Payment Method Split</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="#22c55e" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                formatter={(v: number) => `KES ${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#242018] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-semibold mb-4">Pending Payments</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {pendingPayments.length === 0 ? (
              <p className="text-white/30 text-center py-4">No pending payments</p>
            ) : pendingPayments.slice(0, 20).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-[#1a1714]">
                <span className="text-white/60 text-sm font-mono">#{(o.id as string).slice(0, 8)}</span>
                <span className="text-white font-medium text-sm">KES {(o.total_amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
