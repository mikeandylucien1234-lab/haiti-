import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/hooks/useCart";
import type { CartComboItem, CartJusItem, CartPateItem } from "@/types/cart";
import type { OrderItemRow } from "@/types/database";

type FeedRow = Pick<OrderItemRow, "id" | "item_type" | "label" | "detail" | "unit_price_htg" | "config"> & {
  created_at: string;
};

export interface RecentItem {
  key: string;
  label: string;
  detail: string;
  image: string;
  unitPrice: number;
  reorder: () => void;
}

const PATE_IMAGE_BY_VIANDE: Record<string, string> = {
  boeuf: "/images/pate-boeuf.webp",
  poulet: "/images/pate-poulet.webp",
  hareng: "/images/pate-hareng.webp",
};
const JUS_IMAGE_BY_SLUG: Record<string, string> = {
  mangue: "/images/jus-mangue.webp",
  ananas: "/images/jus-ananas.webp",
  fraise: "/images/jus-fraise.webp",
};
const JUS_LABEL_BY_SLUG: Record<string, string> = {
  mangue: "Jus de mangue",
  ananas: "Jus d'ananas",
  fraise: "Jus de fraise",
};
const VIANDE_LABEL_BY_SLUG: Record<string, string> = {
  boeuf: "Bœuf",
  poulet: "Poulet",
  hareng: "Hareng",
};
const CUISSON_LABEL_BY_SLUG: Record<string, string> = {
  frit_huile: "Frit à l'huile",
  au_four: "Au four",
};
const EXTRA_LABEL_BY_SLUG: Record<string, string> = {
  oeuf_dur: "Œuf dur",
  fromage: "Fromage",
  avocat: "Avocat",
  tomate: "Tomate",
  pikliz: "Pikliz maison",
  piment_bouc: "Piment bouc",
};

function imageForItem(row: FeedRow): string {
  if (row.item_type === "pate") {
    const slug = (row.config as { viande_slug?: string }).viande_slug;
    return (slug && PATE_IMAGE_BY_VIANDE[slug]) || "/images/pate-hero.webp";
  }
  if (row.item_type === "jus") {
    const slug = (row.config as { jus_slug?: string }).jus_slug;
    return (slug && JUS_IMAGE_BY_SLUG[slug]) || "/images/jus-trio.webp";
  }
  return "/images/combo-hero.webp";
}

// Clé de regroupement : deux articles identiques (même composition) ne doivent
// apparaître qu'une fois dans le fil, même si plusieurs clients l'ont commandé.
function dedupeKey(row: FeedRow): string {
  return `${row.item_type}:${JSON.stringify(row.config)}`;
}

export function useRecentOrderItems() {
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("recent-order-items-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_items" }, () => {
        queryClient.invalidateQueries({ queryKey: ["recent-order-items"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["recent-order-items"],
    queryFn: async (): Promise<RecentItem[]> => {
      // Vrai fil d'activité : les dernières commandes de TOUS les clients (aucune
      // donnée personnelle exposée), pas seulement celles du visiteur actuel.
      const { data } = await supabase
        .from("recent_order_items_feed")
        .select("*")
        .limit(30);

      const rows = (data as FeedRow[]) ?? [];
      const seen = new Set<string>();
      const deduped: FeedRow[] = [];
      for (const row of rows) {
        const key = dedupeKey(row);
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(row);
        if (deduped.length >= 6) break;
      }

      return deduped.map((row) => ({
        key: row.id,
        label: row.label,
        detail: row.detail,
        image: imageForItem(row),
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
              cuisson_label: CUISSON_LABEL_BY_SLUG[cfg.cuisson_slug] ?? cfg.cuisson_slug,
              viande_slug: cfg.viande_slug,
              viande_label: VIANDE_LABEL_BY_SLUG[cfg.viande_slug] ?? cfg.viande_slug,
              extra_viande_portions: cfg.extra_viande_portions ?? 0,
              extra_slugs: cfg.extra_slugs ?? [],
              extra_labels: (cfg.extra_slugs ?? []).map((s) => EXTRA_LABEL_BY_SLUG[s] ?? s),
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
            const cfg = row.config as { combo_slug: string; jus_slug: string };
            const item: CartComboItem = {
              id: crypto.randomUUID(),
              type: "combo",
              combo_slug: cfg.combo_slug,
              name: row.label,
              description: row.detail,
              jus_slug: cfg.jus_slug,
              jus_label: JUS_LABEL_BY_SLUG[cfg.jus_slug] ?? cfg.jus_slug,
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
