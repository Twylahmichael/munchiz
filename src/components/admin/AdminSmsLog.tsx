import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SmsMessage } from "@/lib/database.types";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-blue-500/20 text-blue-400",
  processed: "bg-white/10 text-white/60",
  invalid: "bg-red-500/20 text-red-400",
  sent: "bg-white/10 text-white/60",
  delivered: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

export function AdminSmsLog() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound">("all");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-sms-messages", directionFilter],
    queryFn: async () => {
      let q = supabase
        .from("sms_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (directionFilter !== "all") q = q.eq("direction", directionFilter);
      const { data } = await q;
      return (data || []) as SmsMessage[];
    },
    refetchInterval: 15_000,
  });

  const filtered = search
    ? messages?.filter(
        (m) => m.phone.includes(search) || m.message.toLowerCase().includes(search.toLowerCase()),
      )
    : messages;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-white">SMS Log</h1>
        <p className="text-white/40 text-sm mt-1">
          Every inbound and outbound SMS handled by the Africa's Talking integration — useful for
          debugging orders placed by text.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone or message..."
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm w-64 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "inbound", "outbound"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirectionFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap ${
                directionFilter === d
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#242018] rounded-xl border border-white/5 overflow-hidden">
        {isLoading && <div className="text-center text-white/40 py-8">Loading...</div>}
        {!isLoading && !filtered?.length && (
          <div className="text-center text-white/40 py-8">No SMS activity yet</div>
        )}
        <div className="divide-y divide-white/5">
          {filtered?.map((m) => (
            <div key={m.id} className="p-3 flex items-start gap-3 text-sm">
              {m.direction === "inbound" ? (
                <ArrowDownLeft size={16} className="text-blue-400 shrink-0 mt-0.5" />
              ) : (
                <ArrowUpRight size={16} className="text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-white font-medium">{m.phone}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[m.status] || "bg-white/10 text-white/60"}`}
                  >
                    {m.status}
                  </span>
                  {m.related_order_id && (
                    <span className="font-mono text-[10px] text-white/40">
                      #{m.related_order_id.slice(0, 8).toUpperCase()}
                    </span>
                  )}
                  <span className="text-white/30 text-xs ml-auto">
                    {new Date(m.created_at).toLocaleString("en-KE")}
                  </span>
                </div>
                <p className="text-white/70 mt-1 break-words">{m.message}</p>
                {m.error_reason && (
                  <p className="text-red-400 text-xs mt-1">Error: {m.error_reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
