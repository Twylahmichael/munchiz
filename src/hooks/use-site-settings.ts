import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/database.types";

export function useSiteSettings() {
  return useQuery<SiteSettings | null>({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
