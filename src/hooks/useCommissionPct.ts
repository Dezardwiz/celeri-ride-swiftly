import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCommissionPct() {
  const [pct, setPct] = useState<number>(15);
  useEffect(() => {
    supabase
      .from("commission_settings")
      .select("percentage")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.percentage != null) setPct(Number(data.percentage));
      });
  }, []);
  return pct;
}
