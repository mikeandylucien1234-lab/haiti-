import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/features/catalog/queries";
import { getPaymentProofSignedUrl } from "@/lib/paymentProof";
import { formatHTG } from "@/lib/format";
import type { OrderItemRow, OrderRow, OrderStatus, PaymentStatus } from "@/types/database";

const STATUS_FLOW: OrderStatus[] = ["received", "preparing", "delivering", "delivered"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "En préparation",
  delivering: "En livraison",
  delivered: "Livrée",
};
const PAYMENT_LABEL: Record<string, string> = { moncash: "MonCash", natcash: "NatCash", cash: "À la livraison" };
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  not_required: "À la livraison",
  pending_proof: "En attente de preuve",
  pending_verification: "À vérifier",
  confirmed: "Paiement confirmé",
  rejected: "Paiement refusé",
};
const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  not_required: "bg-brand-cream-2 text-brand-ink",
  pending_proof: "bg-brand-cream-2 text-brand-sage",
  pending_verification: "bg-brand-gold text-brand-green-dark",
  confirmed: "bg-brand-green text-white",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const { data: settings } = useSettings();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItemRow[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "active" | "all" | "payment_pending">("active");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

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

  async function verifyPayment(order: OrderRow, decision: "confirmed" | "rejected") {
    setVerifying(order.id);
    setProofError(null);
    try {
      const { data } = await supabase.auth.getUser();
      const adminId = data.user?.id ?? null;
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: decision,
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminId,
        } as never)
        .eq("id", order.id);
      if (error) throw error;
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "Impossible de mettre à jour le paiement.");
    } finally {
      setVerifying(null);
    }
  }

  async function viewProof(path: string) {
    try {
      const url = await getPaymentProofSignedUrl(path);
      window.open(url, "_blank", "noreferrer");
    } catch {
      setProofError("Impossible d'ouvrir la preuve de paiement.");
    }
  }

  const paymentPendingCount = orders.filter((o) => o.payment_status === "pending_verification").length;

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "payment_pending") return o.payment_status === "pending_verification";
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
        <button
          onClick={() => setFilter("payment_pending")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 ${
            filter === "payment_pending" ? "bg-brand-gold text-brand-green-dark" : "bg-white border border-brand-gold text-brand-green-dark"
          }`}
        >
          Paiements à vérifier
          {paymentPendingCount > 0 && (
            <span className="bg-brand-green-dark text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {paymentPendingCount}
            </span>
          )}
        </button>
      </div>

      {proofError && <p className="text-sm text-red-600 mb-3">{proofError}</p>}

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
                  {order.payment_method !== "cash" && (
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${PAYMENT_STATUS_COLOR[order.payment_status]}`}>
                      {PAYMENT_STATUS_LABEL[order.payment_status]}
                    </span>
                  )}
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

                {order.payment_method !== "cash" && (
                  <div className="mb-3 rounded-xl bg-white border border-brand-cream-3 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-brand-sage uppercase tracking-wide">Vérification du paiement</span>
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${PAYMENT_STATUS_COLOR[order.payment_status]}`}>
                        {PAYMENT_STATUS_LABEL[order.payment_status]}
                      </span>
                    </div>
                    {settings && (
                      <p className="text-xs text-brand-sage mb-1">
                        Bénéficiaire attendu :{" "}
                        <span className="text-brand-ink font-medium">
                          {order.payment_method === "moncash" ? settings.moncash_name : settings.natcash_name} ·{" "}
                          {order.payment_method === "moncash" ? settings.moncash_number : settings.natcash_number}
                        </span>
                      </p>
                    )}
                    {order.transaction_number ? (
                      <p className="text-xs text-brand-sage mb-1">
                        N° de transaction fourni : <span className="font-mono font-semibold text-brand-ink">{order.transaction_number}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-brand-sage mb-1">Aucune preuve envoyée pour l'instant.</p>
                    )}
                    {order.payment_submitted_at && (
                      <p className="text-xs text-brand-sage mb-1">
                        Envoyée le {new Date(order.payment_submitted_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {order.payment_verified_at && (
                      <p className="text-xs text-brand-sage mb-2">
                        {order.payment_status === "confirmed" ? "Confirmé" : "Refusé"} le{" "}
                        {new Date(order.payment_verified_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}

                    {order.payment_proof_path && (
                      <button
                        onClick={() => viewProof(order.payment_proof_path!)}
                        className="text-xs font-semibold text-brand-green underline mb-2 block"
                      >
                        Voir la preuve de paiement
                      </button>
                    )}

                    {order.payment_status === "pending_verification" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => verifyPayment(order, "confirmed")}
                          disabled={verifying === order.id}
                          className="flex-1 bg-brand-green text-white rounded-full py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          Confirmer le paiement
                        </button>
                        <button
                          onClick={() => verifyPayment(order, "rejected")}
                          disabled={verifying === order.id}
                          className="flex-1 border border-red-400 text-red-600 rounded-full py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          Refuser le paiement
                        </button>
                      </div>
                    )}
                  </div>
                )}

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

                <div className="mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-sage">Sous-total / Livraison</span>
                    <span>
                      {formatHTG(order.subtotal_htg)} + {formatHTG(order.delivery_fee_htg)}
                    </span>
                  </div>
                  {order.discount_htg > 0 && (
                    <div className="flex justify-between text-sm text-brand-green">
                      <span>Remise ({order.promo_code})</span>
                      <span>−{formatHTG(order.discount_htg)}</span>
                    </div>
                  )}
                </div>

                {order.payment_method !== "cash" && order.payment_status !== "confirmed" && order.status === "received" && (
                  <p className="text-xs text-brand-green-dark bg-brand-gold-light/50 rounded-lg px-3 py-2 mb-2 text-center">
                    Confirmez le paiement avant de commencer la préparation.
                  </p>
                )}

                {order.status !== "delivered" ? (
                  <button
                    onClick={() => advanceStatus(order)}
                    disabled={
                      order.payment_method !== "cash" && order.payment_status !== "confirmed" && order.status === "received"
                    }
                    className="w-full bg-brand-green-dark disabled:opacity-40 text-white rounded-full py-2.5 font-semibold text-sm"
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
