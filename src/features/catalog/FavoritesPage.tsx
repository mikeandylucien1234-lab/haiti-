import { Link } from "@tanstack/react-router";
import { useJus } from "./queries";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { formatHTG } from "@/lib/format";
import type { CartJusItem } from "@/types/cart";

export default function FavoritesPage() {
  const { data: jus = [] } = useJus();
  const { favorites, toggle } = useFavorites();
  const { addItem } = useCart();

  const favoriteJus = jus.filter((j) => favorites.includes(j.slug));

  function addToCart(j: (typeof jus)[number]) {
    const item: CartJusItem = {
      id: crypto.randomUUID(),
      type: "jus",
      jus_slug: j.slug,
      name: j.name,
      description: j.description,
      quantity: 1,
      unit_price_htg: j.price_htg,
    };
    addItem(item);
  }

  return (
    <div className="pb-10">
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-lg font-extrabold">Mes favoris</h1>
        <p className="text-sm text-brand-sage">Vos jus préférés, enregistrés sur cet appareil.</p>
      </header>

      {favoriteJus.length === 0 ? (
        <div className="px-5 py-12 text-center text-brand-sage">
          <p className="mb-4">Aucun favori pour l'instant. Touchez le cœur sur un jus pour l'ajouter ici.</p>
          <Link to="/" className="text-brand-green font-semibold">
            Découvrir le menu
          </Link>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {favoriteJus.map((j) => (
            <div key={j.id} className="bg-white rounded-2xl border border-brand-cream-3 p-3 flex gap-3 items-center">
              <img src={j.image_path} alt={j.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{j.name}</p>
                <p className="text-xs text-brand-sage">{j.description}</p>
                <p className="text-sm font-bold text-brand-green mt-1">{formatHTG(j.price_htg)}</p>
              </div>
              <button
                onClick={() => addToCart(j)}
                className="w-9 h-9 rounded-full bg-brand-gold text-brand-green-dark font-bold flex items-center justify-center"
                aria-label={`Ajouter ${j.name} au panier`}
              >
                +
              </button>
              <button
                onClick={() => toggle(j.slug)}
                className="text-brand-sage"
                aria-label={`Retirer ${j.name} des favoris`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C15 15.65 12 20 12 20Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
