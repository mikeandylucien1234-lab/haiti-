import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { formatHTG } from "@/lib/format";
import { useSettings } from "@/features/catalog/queries";
import type { CartItem } from "@/types/cart";

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

function itemImage(item: CartItem) {
  if (item.type === "pate") return PATE_IMAGE_BY_VIANDE[item.viande_slug] ?? "/images/pate-hero.webp";
  if (item.type === "jus") return JUS_IMAGE_BY_SLUG[item.jus_slug] ?? "/images/jus-trio.webp";
  return "/images/combo-hero.webp";
}

function itemTitle(item: CartItem) {
  if (item.type === "pate") return `Pâté ${item.viande_label.toLowerCase() || ""}`.trim();
  if (item.type === "jus") return item.name;
  return item.name;
}

function itemDetail(item: CartItem) {
  if (item.type === "pate") {
    const parts = [item.cuisson_label, item.viande_label];
    if (item.extra_viande_portions > 0) parts.push(`+${item.extra_viande_portions} portion(s) de viande`);
    parts.push(item.extra_labels.length ? item.extra_labels.join(", ") : "Sans extra");
    return parts.filter(Boolean).join(" · ");
  }
  if (item.type === "combo") return `${item.description} · ${item.jus_label}`;
  return item.description;
}

export default function CartPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { items, setQuantity, subtotal } = useCart();
  const { data: settings } = useSettings();
  const deliveryFee = settings?.delivery_fee_htg ?? 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="pb-28">
      <header className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={() => router.history.back()} className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center">
          ←
        </button>
        <h1 className="text-lg font-extrabold flex-1">Mon panier</h1>
        <span className="text-sm text-brand-sage">{items.length} article{items.length > 1 ? "s" : ""}</span>
      </header>

      {items.length === 0 ? (
        <div className="px-5 py-16 text-center text-brand-sage">
          <p className="mb-4">Votre panier est vide.</p>
          <Link to="/" className="text-brand-green font-semibold">
            Retour à l'accueil
          </Link>
        </div>
      ) : (
        <>
          <div className="px-5 flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-brand-cream-3 p-3 flex gap-3">
                <img src={itemImage(item)} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm capitalize">{itemTitle(item)}</p>
                  <p className="text-xs text-brand-sage">{itemDetail(item)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-brand-green">{formatHTG(item.unit_price_htg)}</span>
                    <div className="flex items-center gap-2 bg-brand-cream-2 rounded-full px-1">
                      <button
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 font-bold"
                        aria-label="Réduire la quantité"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 font-bold text-brand-green"
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              to="/"
              className="rounded-2xl border-2 border-dashed border-brand-gold text-brand-green font-semibold text-center py-3 text-sm"
            >
              + Ajouter autre chose
            </Link>

            <div className="bg-white rounded-2xl border border-brand-cream-3 p-4">
              <div className="flex justify-between text-sm text-brand-sage mb-1">
                <span>Sous-total</span>
                <span>{formatHTG(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-sage mb-2">
                <span>Livraison aux Cayes</span>
                <span>{formatHTG(deliveryFee)}</span>
              </div>
              <div className="border-t border-brand-cream-3 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-brand-green">{formatHTG(total)}</span>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] px-5 py-3 z-20">
            <button
              onClick={() => navigate({ to: "/livraison" })}
              className="w-full bg-brand-green-dark text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2"
            >
              Passer la commande · {formatHTG(total)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
