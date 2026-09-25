import { useEffect, useState } from "react";
import { supabase, ensureCustomerSession } from "@/lib/supabase";
import type { OrderRow } from "@/types/database";

export function useMyOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (active) {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      }
    }

    (async () => {
      await ensureCustomerSession();
      await refresh();
    })();

    const channel = supabase
      .channel("my-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { orders, loading };
}
