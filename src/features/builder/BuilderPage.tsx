import { useMemo, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCuissons, useExtras, useJus, useSettings, useViandes } from "@/features/catalog/queries";
import { formatHTG } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import type { CartJusItem, CartPateItem } from "@/types/cart";

export default function BuilderPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { data: cuissons = [] } = useCuissons();
  const { data: viandes = [] } = useViandes();
  const { data: extras = [] } = useExtras();
  const { data: jusList = [] } = useJus();
  const { data: settings } = useSettings();
  const { addItem } = useCart();

  const initialViande = (router.state.location.search as { viande?: string } | undefined)?.viande;

  const [cuissonSlug, setCuissonSlug] = useState<string | null>(null);
  const [viandeSlug, setViandeSlug] = useState<string | null>(initialViande ?? null);
  const [extraPortions, setExtraPortions] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [showCrossSell, setShowCrossSell] = useState(false);
  const [lastAddedLabel, setLastAddedLabel] = useState("");

  // valeurs par défaut dès que les données arrivent
  if (!cuissonSlug && cuissons.length) setCuissonSlug(cuissons[0].slug);
  if (!viandeSlug && viandes.length) setViandeSlug(initialViande ?? viandes[0].slug);

  const cuisson = cuissons.find((c) => c.slug === cuissonSlug);
  const viande = viandes.find((v) => v.slug === viandeSlug);
  const extraViandePrice = settings?.extra_viande_portion_htg ?? 40;

  const unitPrice = useMemo(() => {
    if (!cuisson || !viande) return 0;
    const extrasTotal = [...selectedExtras].reduce((sum, slug) => {
      const e = extras.find((x) => x.slug === slug);
      return sum + (e?.price_htg ?? 0);
    }, 0);
    return cuisson.price_htg + viande.price_htg + extraPortions * extraViandePrice + extrasTotal;
  }, [cuisson, viande, selectedExtras, extraPortions, extras, extraViandePrice]);

  function toggleExtra(slug: string) {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleAdd() {
    if (!cuisson || !viande) return;
    const chosenExtras = extras.filter((e) => selectedExtras.has(e.slug));
    const item: CartPateItem = {
      id: crypto.randomUUID(),
      type: "pate",
      cuisson_slug: cuisson.slug,
      cuisson_label: cuisson.label,
      viande_slug: viande.slug,
      viande_label: viande.label,
      extra_viande_portions: extraPortions,
      extra_slugs: [...selectedExtras],
      extra_labels: chosenExtras.map((e) => e.label),
      quantity,
      unit_price_htg: unitPrice,
    };
    addItem(item);
    setLastAddedLabel(`Pâté ${viande.label.toLowerCase()}`);
    setShowCrossSell(true);
  }

  function addJusAndContinue(j: (typeof jusList)[number]) {
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
    navigate({ to: "/panier" });
  }

  return (
    <div className="pb-28">
      <header className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={() => router.history.back()} className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center">
          ←
        </button>
        <h1 className="text-lg font-extrabold">Composez votre pâté</h1>
      </header>
      <p className="px-5 text-sm text-brand-sage -mt-2">
        Pâte maison, farce mijotée le matin même. Trois choix et c'est prêt.
      </p>

      <Section number={1} title="Cuisson">
        <div className="grid grid-cols-2 gap-3">
          {cuissons.map((c) => (
            <OptionCard
              key={c.id}
              selected={c.slug === cuissonSlug}
              onClick={() => setCuissonSlug(c.slug)}
              title={c.label}
              subtitle={c.description}
              price={`${formatHTG(c.price_htg)}`}
            />
          ))}
        </div>
      </Section>

      <Section number={2} title="Viande">
        <div className="grid grid-cols-3 gap-3">
          {viandes.map((v) => (
            <button
              key={v.id}
              onClick={() => setViandeSlug(v.slug)}
              className={`relative rounded-2xl border-2 p-2 text-center bg-white ${
                v.slug === viandeSlug ? "border-brand-green" : "border-brand-cream-3"
              }`}
            >
              {v.slug === viandeSlug && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-green text-white text-xs flex items-center justify-center">
                  ✓
                </span>
              )}
              <img src="/images/pate-hero.webp" alt="" className="w-full h-14 object-contain mb-1" />
              <p className="text-sm font-semibold">{v.label}</p>
              <p className="text-xs text-brand-green font-medium">+{formatHTG(v.price_htg)}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-brand-cream-3 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Quantité de viande</p>
            <p className="text-xs text-brand-sage">Incluse · +{formatHTG(extraViandePrice)} par portion en plus</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExtraPortions((n) => Math.max(0, n - 1))}
              className="w-8 h-8 rounded-full bg-brand-cream-2 font-bold"
            >
              −
            </button>
            <span className="font-semibold text-sm w-16 text-center">{extraPortions === 0 ? "Normale" : `+${extraPortions}`}</span>
            <button
              onClick={() => setExtraPortions((n) => Math.min(5, n + 1))}
              className="w-8 h-8 rounded-full bg-brand-green text-white font-bold"
            >
              +
            </button>
          </div>
        </div>
      </Section>

      <Section number={3} title="Extras" badge="Facultatif">
        <div className="bg-white rounded-2xl border border-brand-cream-3 divide-y divide-brand-cream-3">
          {extras.map((e) => (
            <label key={e.id} className="flex items-center justify-between px-4 py-3 cursor-pointer">
              <span className="text-sm font-medium">{e.label}</span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold text-brand-green">+{formatHTG(e.price_htg)}</span>
                <input
                  type="checkbox"
                  checked={selectedExtras.has(e.slug)}
                  onChange={() => toggleExtra(e.slug)}
                  className="w-5 h-5 accent-brand-green rounded"
                />
              </span>
            </label>
          ))}
        </div>
      </Section>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-white border-t border-brand-cream-3 px-5 py-3 flex items-center gap-3 z-20">
        <div className="flex items-center gap-2 bg-brand-cream-2 rounded-full px-2 py-1.5">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-7 h-7 font-bold">
            −
          </button>
          <span className="w-6 text-center font-semibold">{quantity}</span>
          <button onClick={() => setQuantity((q) => Math.min(20, q + 1))} className="w-7 h-7 font-bold">
            +
          </button>
        </div>
        <button
          onClick={handleAdd}
          disabled={!cuisson || !viande}
          className="flex-1 bg-brand-green-dark text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Ajouter au panier
          <span className="bg-brand-gold text-brand-green-dark rounded-full px-2.5 py-0.5 text-sm font-bold">
            {formatHTG(unitPrice * quantity)}
          </span>
        </button>
      </div>

      {showCrossSell && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-[480px] bg-brand-cream rounded-t-3xl p-5 animate-[slideUp_.2s_ease-out]">
            <div className="mx-auto w-10 h-1.5 bg-brand-cream-3 rounded-full mb-4" />
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center">✓</span>
              <div>
                <p className="font-bold">{lastAddedLabel} ajouté au panier</p>
                <p className="text-sm text-brand-sage">Un jus frais avec ça ?</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {jusList.map((j) => (
                <button
                  key={j.id}
                  onClick={() => addJusAndContinue(j)}
                  className="bg-white rounded-2xl border border-brand-cream-3 p-2 text-center"
                >
                  <img src={j.image_path} alt="" className="w-full h-14 object-contain mb-1" />
                  <p className="text-xs font-semibold">{j.name.replace("Jus de ", "").replace("Jus d'", "")}</p>
                  <p className="text-[11px] text-brand-green font-semibold">+ {formatHTG(j.price_htg)}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate({ to: "/" })}
                className="flex-1 border border-brand-green text-brand-green rounded-full py-3 font-semibold"
              >
                Continuer
              </button>
              <button
                onClick={() => navigate({ to: "/panier" })}
                className="flex-1 bg-brand-green-dark text-white rounded-full py-3 font-semibold"
              >
                Voir le panier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  number,
  title,
  badge,
  children,
}: {
  number: number;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">
          {number}
        </span>
        <h2 className="font-bold text-brand-ink">{title}</h2>
        {badge && <span className="ml-auto text-xs text-brand-sage">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  price: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-3 bg-white ${selected ? "border-brand-green" : "border-brand-cream-3"}`}
    >
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-brand-sage mt-0.5">{subtitle}</p>
      <p className="text-sm font-bold text-brand-green mt-2">{price}</p>
    </button>
  );
}
