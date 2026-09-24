import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatHTG } from "@/lib/format";
import type { OrderItemRow, OrderRow, OrderStatus } from "@/types/database";

const STATUS_FLOW: OrderStatus[] = ["received", "preparing", "delivering", "delivered"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "En préparation",
  delivering: "En livraison",
  delivered: "Livrée",
};
const PAYMENT_LABEL: Record<string, string> = { moncash: "MonCash", natcash: "NatCash", cash: "À la livraison" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItemRow[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "active" | "all">("active");

  async function loadOrders() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    setOrders((data as OrderRow[]) ?? []);
  }

  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel("admin-orders-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function toggleExpand(order: OrderRow) {
    if (expanded === order.id) {
      setExpanded(null);
      return;
    }
    setExpanded(order.id);
    if (!itemsByOrder[order.id]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      setItemsByOrder((prev) => ({ ...prev, [order.id]: (data as OrderItemRow[]) ?? [] }));
    }
  }

  async function advanceStatus(order: OrderRow) {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    await supabase.from("orders").update({ status: next } as never).eq("id", order.id);
  }

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return o.status !== "delivered";
    return o.status === filter;
  });

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["active", "received", "preparing", "delivering", "delivered", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === f ? "bg-brand-green text-white" : "bg-white border border-brand-cream-3 text-brand-ink"
            }`}
          >
            {f === "active" ? "En cours" : f === "all" ? "Toutes" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-brand-sage text-sm">Aucune commande.</p>}

      <div className="flex flex-col gap-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-brand-cream-3 overflow-hidden">
            <button onClick={() => toggleExpand(order)} className="w-full text-left p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{order.order_number}</p>
                  <span className="text-xs font-semibold bg-brand-cream-2 text-brand-green-dark rounded-full px-2 py-0.5">
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <p className="text-sm text-brand-sage">
                  {order.customer_name} · {order.quartier} · {formatHTG(order.total_htg)}
                </p>
                <p className="text-xs text-brand-sage">
                  {new Date(order.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="text-brand-sage">{expanded === order.id ? "▲" : "▼"}</span>
            </button>

            {expanded === order.id && (
              <div className="border-t border-brand-cream-3 px-4 py-3 bg-brand-cream/50">
                <p className="text-sm font-semibold mb-1">Client</p>
                <p className="text-sm text-brand-sage mb-3">
                  {order.customer_name} · {order.phone}
                  <br />
                  {order.address}
                  {order.landmark && `, ${order.landmark}`} — {order.quartier}
                  {order.lat && order.lng && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        className="text-brand-green underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
                      >
                        position GPS
                      </a>
                    </>
                  )}
                </p>

                {order.house_photo_url && (
                  <a href={order.house_photo_url} target="_blank" rel="noreferrer" className="block mb-3">
                    <img
                      src={order.house_photo_url}
                      alt="Photo de la maison du client"
                      className="w-24 h-24 rounded-xl object-cover border border-brand-cream-3"
                    />
                  </a>
                )}

                <p className="text-sm font-semibold mb-1">Paiement</p>
                <p className="text-sm text-brand-sage mb-3">{PAYMENT_LABEL[order.payment_method]}</p>

                <p className="text-sm font-semibold mb-1">Articles</p>
                <div className="flex flex-col gap-1 mb-3">
                  {(itemsByOrder[order.id] ?? []).map((item) => (
                    <div key={item.id} className="text-sm text-brand-sage flex justify-between">
                      <span>
                        {item.quantity} × {item.label}
                        <span className="block text-xs">{item.detail}</span>
                      </span>
                      <span className="font-medium text-brand-ink">{formatHTG(item.unit_price_htg * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-sm mb-3">
                  <span className="text-brand-sage">Sous-total / Livraison</span>
                  <span>
                    {formatHTG(order.subtotal_htg)} + {formatHTG(order.delivery_fee_htg)}
                  </span>
                </div>

                {order.status !== "delivered" ? (
                  <button
                    onClick={() => advanceStatus(order)}
                    className="w-full bg-brand-green-dark text-white rounded-full py-2.5 font-semibold text-sm"
                  >
                    Passer à « {STATUS_LABEL[STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]]} »
                  </button>
                ) : (
                  <p className="text-center text-sm text-brand-green font-semibold">Commande livrée ✓</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
