import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useFreeDeliveryPromoCode, useSocialPromoCode } from "@/features/catalog/queries";
import type { OrderRow, OrderStatus } from "@/types/database";

const STATUS_META: Record<OrderStatus, { title: string; message: (n: string) => string; icon: ReactNode; color: string }> = {
  received: {
    title: "Commande reçue",
    message: (n) => `Votre commande ${n} a bien été reçue et sera bientôt préparée.`,
    color: "bg-brand-gold-light text-brand-green-dark",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  preparing: {
    title: "En préparation",
    message: (n) => `Votre commande ${n} est en cours de préparation en cuisine.`,
    color: "bg-brand-cream-2 text-brand-green-dark",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  delivering: {
    title: "En livraison",
    message: (n) => `Votre commande ${n} est en route vers vous !`,
    color: "bg-brand-green text-white",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 16V6a1 1 0 0 1 1-1h9v11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 9h4l3 3v4h-7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
  },
  delivered: {
    title: "Livrée",
    message: (n) => `Votre commande ${n} a été livrée. Bon appétit !`,
    color: "bg-brand-green-dark text-white",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function OrderNotification({ order }: { order: OrderRow }) {
  const meta = STATUS_META[order.status];
  return (
    <div className="flex items-start gap-3 bg-white rounded-2xl border border-brand-cream-3 p-4">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{meta.title}</p>
        <p className="text-xs text-brand-sage mt-0.5 leading-relaxed">{meta.message(order.order_number)}</p>
      </div>
      <span className="text-[11px] text-brand-sage flex-shrink-0 whitespace-nowrap">{timeAgo(order.updated_at)}</span>
    </div>
  );
}

function OfferNotification({ title, message, code }: { title: string; message: string; code: string }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-2xl border border-brand-cream-3 p-4">
      <span className="w-9 h-9 rounded-full bg-brand-gold text-brand-green-dark flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-brand-sage mt-0.5 leading-relaxed">
          {message} Code : <span className="font-mono font-semibold text-brand-ink">{code}</span>
        </p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { orders, loading } = useMyOrders();
  const { data: freeDelivery } = useFreeDeliveryPromoCode();
  const { data: social } = useSocialPromoCode();

  const hasContent = orders.length > 0 || freeDelivery || social;

  return (
    <div className="pb-10">
      <header className="flex items-center gap-3 px-5 pt-5 pb-1">
        <button onClick={() => router.history.back()} className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center">
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold">Notifications</h1>
          <p className="text-xs text-brand-sage">Suivi de vos commandes et offres en cours</p>
        </div>
      </header>

      {loading ? (
        <p className="px-5 mt-4 text-brand-sage text-sm">Chargement…</p>
      ) : !hasContent ? (
        <div className="px-5 py-12 text-center text-brand-sage">
          <p>Aucune notification pour l'instant.</p>
          <p className="text-sm mt-1">Vos mises à jour de commande apparaîtront ici.</p>
        </div>
      ) : (
        <div className="px-5 mt-4 flex flex-col gap-3">
          {orders.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-sage px-1">Vos commandes</p>
              {orders.map((o) => (
                <OrderNotification key={o.id} order={o} />
              ))}
            </>
          )}

          {(freeDelivery || social) && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-sage px-1 mt-2">Offres en cours</p>
              {freeDelivery && (
                <OfferNotification
                  title="Livraison gratuite"
                  message="Utilisez ce code à votre prochaine commande pour ne pas payer les frais de livraison."
                  code={freeDelivery.code}
                />
              )}
              {social && (
                <OfferNotification
                  title="Suivez-nous & économisez"
                  message={`Abonnez-vous à Kreyòl Délis sur TikTok ou Instagram pour ${social.discount_htg} HTG de réduction.`}
                  code={social.code}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
