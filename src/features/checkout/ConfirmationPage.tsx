import { useEffect, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatHTG } from "@/lib/format";
import type { OrderRow, OrderStatus } from "@/types/database";

const STEPS: { status: OrderStatus; title: string; description: string }[] = [
  { status: "received", title: "Commande reçue", description: "Nous avons bien reçu votre commande" },
  { status: "preparing", title: "En préparation", description: "Vos pâtés sortent de la friteuse" },
  { status: "delivering", title: "En livraison", description: "Le livreur est en route à moto" },
  { status: "delivered", title: "Livrée", description: "Bon appétit !" },
];

const PAYMENT_LABEL: Record<string, string> = { moncash: "MonCash", natcash: "NatCash", cash: "Paiement à la livraison" };

export default function ConfirmationPage() {
  const { orderId } = useParams({ from: "/confirmation/$orderId" });
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (active) {
          setOrder((data as unknown as OrderRow) ?? null);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          if (active) setOrder(payload.new as OrderRow);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return <div className="px-5 py-16 text-center text-brand-sage">Chargement de votre commande…</div>;
  }

  if (!order) {
    return (
      <div className="px-5 py-16 text-center text-brand-sage">
        <p className="mb-4">Commande introuvable.</p>
        <Link to="/" className="text-brand-green font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === order.status);
  const firstName = order.customer_name.split(" ")[0];

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="bg-brand-green-dark text-white rounded-3xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-brand-gold text-brand-green-dark flex items-center justify-center text-2xl font-bold mx-auto mb-3">
          ✓
        </div>
        <h1 className="text-xl font-extrabold">Mèsi, {firstName} !</h1>
        <p className="text-sm opacity-90 mt-1">Votre commande est bien reçue. On s'occupe de tout.</p>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/10 rounded-2xl py-2.5">
            <p className="text-[11px] opacity-70">Commande</p>
            <p className="font-bold">{order.order_number}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl py-2.5">
            <p className="text-[11px] opacity-70">Arrivée estimée</p>
            <p className="font-bold text-brand-gold">35–45 min</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-cream-3 p-5 mt-5">
        <p className="font-bold mb-4">Suivi de commande</p>
        <ol className="flex flex-col gap-5">
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex;
            return (
              <li key={step.status} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      done ? "border-brand-green bg-brand-green" : "border-brand-cream-3"
                    }`}
                  >
                    {active && <span className="w-2 h-2 rounded-full bg-brand-gold" />}
                    {done && !active && <span className="text-white text-[10px]">✓</span>}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className={`w-0.5 flex-1 min-h-[24px] ${i < currentIndex ? "bg-brand-green" : "bg-brand-cream-3"}`} />
                  )}
                </span>
                <span>
                  <p className={`font-semibold text-sm ${done ? "text-brand-ink" : "text-brand-sage"}`}>{step.title}</p>
                  <p className="text-xs text-brand-sage">{step.description}</p>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="bg-white rounded-2xl border border-brand-cream-3 p-4 mt-4 flex items-start gap-2 text-sm">
        <span className="text-brand-green">📍</span>
        <div>
          <p className="font-medium">
            {order.address}, {order.quartier} — Les Cayes
          </p>
          <p className="text-brand-sage">
            {PAYMENT_LABEL[order.payment_method]} · {formatHTG(order.total_htg)}
          </p>
        </div>
      </div>

      <Link
        to="/"
        className="block text-center border border-brand-green text-brand-green rounded-full py-3.5 font-semibold mt-6"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
