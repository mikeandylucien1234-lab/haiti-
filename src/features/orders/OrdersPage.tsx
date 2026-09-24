import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase, ensureCustomerSession } from "@/lib/supabase";
import { formatHTG } from "@/lib/format";
import type { OrderRow, OrderStatus } from "@/types/database";

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Commande reçue",
  preparing: "En préparation",
  delivering: "En livraison",
  delivered: "Livrée",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      await ensureCustomerSession();
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (active) {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("my-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .then(({ data }) => active && setOrders((data as OrderRow[]) ?? []));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="pb-10">
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-lg font-extrabold">Mes commandes</h1>
        <p className="text-sm text-brand-sage">Historique et suivi, sur cet appareil.</p>
      </header>

      {loading ? (
        <p className="px-5 text-brand-sage text-sm">Chargement…</p>
      ) : orders.length === 0 ? (
        <div className="px-5 py-12 text-center text-brand-sage">
          <p className="mb-4">Vous n'avez pas encore commandé.</p>
          <Link to="/" className="text-brand-green font-semibold">
            Découvrir le menu
          </Link>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/confirmation/$orderId"
              params={{ orderId: o.id }}
              className="bg-white rounded-2xl border border-brand-cream-3 p-4 block"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{o.order_number}</p>
                  <p className="text-xs text-brand-sage">
                    {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-xs font-semibold bg-brand-cream-2 text-brand-green-dark rounded-full px-2.5 py-1">
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-brand-sage">{o.quartier}</span>
                <span className="font-bold text-brand-green">{formatHTG(o.total_htg)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
