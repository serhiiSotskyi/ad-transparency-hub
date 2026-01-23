import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SnapshotResponse } from "@/types/snapshot";

export function useSnapshot() {
  return useQuery<SnapshotResponse>({
    queryKey: ["snapshot"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("snapshot", {
        method: "GET",
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch snapshot");
      }

      return data;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
