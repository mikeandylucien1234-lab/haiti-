import { useQuery } from "@tanstack/react-query";
import { supabase, ensureCustomerSession } from "@/lib/supabase";
import { useCart } from "@/hooks/useCart";
import type { CartComboItem, CartJusItem, CartPateItem } from "@/types/cart";
import type { OrderItemRow } from "@/types/database";

export interface RecentItem {
  key: string;
  label: string;
  detail: string;
  image: string;
  unitPrice: number;
  reorder: () => void;
}

const IMAGE_BY_TYPE: Record<string, string> = {
  pate: "/images/pate-hero.webp",
  jus: "/images/jus-trio.webp",
  combo: "/images/combo-hero.webp",
};

export function useRecentOrderItems() {
  const { addItem } = useCart();

  return useQuery({
    queryKey: ["recent-order-items"],
    queryFn: async (): Promise<RecentItem[]> => {
      const session = await ensureCustomerSession();
      if (!session) return [];

      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastOrder = (orders as { id: string }[] | null)?.[0];
      if (!lastOrder) return [];

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", lastOrder.id)
        .limit(2);

      return ((items as OrderItemRow[]) ?? []).map((row) => ({
        key: row.id,
        label: row.label,
        detail: row.detail,
        image: IMAGE_BY_TYPE[row.item_type] ?? "/images/pate-hero.webp",
        unitPrice: row.unit_price_htg,
        reorder: () => {
          if (row.item_type === "pate") {
            const cfg = row.config as {
              cuisson_slug: string;
              viande_slug: string;
              extra_viande_portions: number;
              extra_slugs: string[];
            };
            const item: CartPateItem = {
              id: crypto.randomUUID(),
              type: "pate",
              cuisson_slug: cfg.cuisson_slug,
              cuisson_label: "",
              viande_slug: cfg.viande_slug,
              viande_label: "",
              extra_viande_portions: cfg.extra_viande_portions ?? 0,
              extra_slugs: cfg.extra_slugs ?? [],
              extra_labels: [],
              quantity: 1,
              unit_price_htg: row.unit_price_htg,
            };
            addItem(item);
          } else if (row.item_type === "jus") {
            const cfg = row.config as { jus_slug: string };
            const item: CartJusItem = {
              id: crypto.randomUUID(),
              type: "jus",
              jus_slug: cfg.jus_slug,
              name: row.label,
              description: row.detail,
              quantity: 1,
              unit_price_htg: row.unit_price_htg,
            };
            addItem(item);
          } else {
            const cfg = row.config as { combo_slug: string };
            const item: CartComboItem = {
              id: crypto.randomUUID(),
              type: "combo",
              combo_slug: cfg.combo_slug,
              name: row.label,
              description: row.detail,
              quantity: 1,
              unit_price_htg: row.unit_price_htg,
            };
            addItem(item);
          }
        },
      }));
    },
    staleTime: 60_000,
  });
}
