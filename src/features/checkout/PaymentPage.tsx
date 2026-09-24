import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { useCheckoutDraft } from "@/hooks/useCheckoutDraft";
import { useSettings } from "@/features/catalog/queries";
import { formatHTG } from "@/lib/format";
import { supabase, ensureCustomerSession } from "@/lib/supabase";
import type { PaymentMethod } from "@/types/database";

const METHODS: { id: PaymentMethod; label: string; description: string; badge: string }[] = [
  { id: "moncash", label: "MonCash", description: "Paiement mobile Digicel", badge: "MC" },
  { id: "natcash", label: "NatCash", description: "Paiement mobile Natcom", badge: "NC" },
  { id: "cash", label: "Paiement à la livraison", description: "En espèces, au livreur", badge: "HTG" },
];

export default function PaymentPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { draft, clear: clearDraft } = useCheckoutDraft();
  const { data: settings } = useSettings();
  const [method, setMethod] = useState<PaymentMethod>("moncash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = settings?.delivery_fee_htg ?? 0;
  const total = subtotal + deliveryFee;

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      await ensureCustomerSession();

      const payloadItems = items.map((item) => {
        if (item.type === "pate") {
          return {
            type: "pate",
            cuisson_slug: item.cuisson_slug,
            viande_slug: item.viande_slug,
            extra_viande_portions: item.extra_viande_portions,
            extra_slugs: item.extra_slugs,
            quantity: item.quantity,
          };
        }
        if (item.type === "jus") {
          return { type: "jus", jus_slug: item.jus_slug, quantity: item.quantity };
        }
        return { type: "combo", combo_slug: item.combo_slug, quantity: item.quantity };
      });

      const { data, error: fnError } = await supabase.functions.invoke("create-order", {
        body: {
          items: payloadItems,
          customer_name: draft.customerName,
          phone: `+509${draft.phone}`,
          quartier: draft.quartier,
          address: draft.address,
          landmark: draft.landmark,
          lat: draft.lat,
          lng: draft.lng,
          location_source: draft.locationSource,
          payment_method: method,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      clear();
      clearDraft();
      navigate({ to: "/confirmation/$orderId", params: { orderId: data.order.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-10">
      <header className="flex items-center gap-3 px-5 pt-5 pb-1">
        <button onClick={() => router.history.back()} className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center">
          ←
        </button>
        <h1 className="text-lg font-extrabold flex-1">Paiement</h1>
        <span className="text-xs text-brand-sage font-medium">Étape 2 sur 2</span>
      </header>
      <div className="px-5 mt-2 mb-5 h-1.5 rounded-full bg-brand-cream-3 overflow-hidden">
        <div className="h-full w-full bg-brand-green rounded-full" />
      </div>

      <div className="px-5 flex flex-col gap-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left ${
              method === m.id ? "border-brand-green" : "border-brand-cream-3"
            }`}
          >
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                m.id === "cash" ? "bg-brand-green text-white" : "bg-brand-gold-light text-brand-green-dark"
              }`}
            >
              {m.badge}
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-sm">{m.label}</span>
              <span className="block text-xs text-brand-sage">{m.description}</span>
            </span>
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                method === m.id ? "border-brand-green" : "border-brand-cream-3"
              }`}
            >
              {method === m.id && <span className="w-2.5 h-2.5 rounded-full bg-brand-green" />}
            </span>
          </button>
        ))}

        {method !== "cash" && (
          <p className="text-xs text-brand-sage px-1">
            Une demande de paiement {method === "moncash" ? "MonCash" : "NatCash"} sera envoyée au +509{draft.phone}.
          </p>
        )}

        <div className="bg-white rounded-2xl border border-brand-cream-3 p-4 mt-2">
          <p className="font-semibold text-sm mb-2">Récapitulatif</p>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-brand-sage mb-1">
              <span>
                {item.quantity} × {item.type === "pate" ? `Pâté ${item.viande_label?.toLowerCase()}` : item.name}
              </span>
              <span>{formatHTG(item.unit_price_htg * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm text-brand-sage mb-2">
            <span>Livraison · {draft.quartier}</span>
            <span>{formatHTG(deliveryFee)}</span>
          </div>
          <div className="border-t border-brand-cream-3 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-brand-green">{formatHTG(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 px-1">{error}</p>}

        <button
          onClick={handlePay}
          disabled={submitting || items.length === 0}
          className="w-full bg-brand-green-dark disabled:opacity-60 text-white rounded-full py-3.5 font-semibold"
        >
          {submitting ? "Envoi de la commande…" : `Payer · ${formatHTG(total)}`}
        </button>
      </div>
    </div>
  );
}
