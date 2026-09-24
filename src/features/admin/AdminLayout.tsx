import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "./useAdminAuth";
import { playOrderChime, notifyNewOrder, requestNotificationPermission } from "./notify";
import { formatHTG } from "@/lib/format";
import type { OrderRow } from "@/types/database";

const TABS = [
  { to: "/admin", label: "Commandes" },
  { to: "/admin/catalogue", label: "Catalogue" },
  { to: "/admin/reglages", label: "Réglages" },
];

export default function AdminLayout() {
  const { loading, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [newOrderBanner, setNewOrderBanner] = useState<OrderRow | null>(null);
  const audioUnlocked = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) navigate({ to: "/admin/login" });
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    function unlock() {
      audioUnlocked.current = true;
    }
    window.addEventListener("click", unlock, { once: true });
    return () => window.removeEventListener("click", unlock);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-new-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as OrderRow;
        setNewOrderBanner(order);
        playOrderChime();
        notifyNewOrder(order.order_number, formatHTG(order.total_htg));
        window.setTimeout(() => setNewOrderBanner((cur) => (cur?.id === order.id ? null : cur)), 8000);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-brand-sage">Chargement…</div>;
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-dvh bg-brand-cream">
      {newOrderBanner && (
        <div className="fixed top-0 inset-x-0 z-50 bg-brand-gold text-brand-green-dark px-4 py-3 text-sm font-semibold flex items-center justify-between shadow-lg">
          <span>🔔 Nouvelle commande {newOrderBanner.order_number} · {formatHTG(newOrderBanner.total_htg)}</span>
          <button onClick={() => setNewOrderBanner(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}
      <header className="bg-brand-green text-white px-5 py-4 flex items-center gap-3">
        <img src="/images/logo.webp" alt="" className="w-9 h-9 rounded-full" />
        <div className="flex-1">
          <p className="font-bold leading-tight">Kreyòl Délis</p>
          <p className="text-xs text-brand-gold-light">Espace restaurant</p>
        </div>
        <button
          onClick={() => requestNotificationPermission()}
          className="text-xs bg-white/15 rounded-full px-3 py-1.5"
        >
          Activer les alertes
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/admin/login" });
          }}
          className="text-xs bg-white/15 rounded-full px-3 py-1.5"
        >
          Déconnexion
        </button>
      </header>

      <nav className="flex gap-2 px-5 py-3 bg-white border-b border-brand-cream-3 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              pathname === t.to ? "bg-brand-green text-white" : "bg-brand-cream-2 text-brand-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <main className="px-5 py-5 max-w-3xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
