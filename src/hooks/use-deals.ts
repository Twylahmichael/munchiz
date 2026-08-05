import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Deal } from "@/lib/database.types";

export function useDeals() {
  return useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
