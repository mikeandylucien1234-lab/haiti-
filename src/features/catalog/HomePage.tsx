import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCuissons, useCombos, useJus, useSettings, useViandes } from "./queries";
import { formatHTG } from "@/lib/format";
import { isStoreOpenNow } from "@/lib/hours";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCheckoutDraft } from "@/hooks/useCheckoutDraft";
import AddressSheet from "@/features/checkout/AddressSheet";
import SocialFollowSection from "@/features/catalog/SocialFollowSection";
import type { CartComboItem, CartJusItem } from "@/types/cart";
import type { Combo } from "@/types/database";

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="px-5 mt-8 mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-brand-ink">{title}</h2>
        {subtitle && <p className="text-sm text-brand-sage">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="text-sm font-semibold text-brand-green whitespace-nowrap pt-1">
          {action.label}
        </button>
      )}
    </div>
  );
}

const HERO_SLIDES = [
  {
    image: "/images/banner-1.webp",
    kicker: "Gou se vrè",
    title: "natirèl !",
    text: "Pâté ki fè w sonje lakay, ak jî natirèl ki plen gou.",
  },
  {
    image: "/images/banner-2.webp",
    kicker: "Bon gou,",
    title: "natirèlman !",
    text: "Pâté ki fè w sonje lakay, ak jî natirèl ki plen gou.",
  },
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  return (
    <div className="px-5 mt-5">
      <div className="rounded-2xl overflow-hidden relative bg-brand-green text-white">
        {HERO_SLIDES.map((slide, i) => (
          <div key={slide.image} className={i === index ? "block" : "hidden"}>
            <img src={slide.image} alt="" className="w-full h-36 object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-green-dark/90 via-brand-green-dark/40 to-transparent flex flex-col justify-center px-5">
              <img src="/images/logo.webp" alt="" className="w-9 h-9 rounded-full mb-2" />
              <p className="text-sm font-semibold">{slide.kicker}</p>
              <p className="text-xl font-extrabold text-brand-gold">{slide.title}</p>
              <p className="text-[11px] mt-1 max-w-[65%] opacity-90">{slide.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            onClick={() => setIndex(i)}
            aria-label={`Aller à la diapositive ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-brand-green" : "w-1.5 bg-brand-cream-3"}`}
          />
        ))}
      </div>
    </div>
  );
}

function pateSubtitle(slug: string) {
  if (slug === "boeuf") return "Frit · le classique";
  if (slug === "poulet") return "Frit · épicé";
  return "Frit · hareng saur";
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const { data: cuissons = [] } = useCuissons();
  const { data: viandes = [] } = useViandes();
  const { data: jus = [] } = useJus();
  const { data: combos = [] } = useCombos();
  const { addItem } = useCart();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const { draft: checkoutDraft } = useCheckoutDraft();
  const [query, setQuery] = useState("");
  const [comboPicker, setComboPicker] = useState<Combo | null>(null);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "pates" | "jus" | "combos">("all");

  function toggleCategory(category: "pates" | "jus" | "combos") {
    setCategoryFilter((prev) => (prev === category ? "all" : category));
  }

  const minCuissonPrice = useMemo(
    () => (cuissons.length ? Math.min(...cuissons.map((c) => c.price_htg)) : null),
    [cuissons]
  );

  const open = settings ? isStoreOpenNow(settings) : true;

  // Suggestions honnêtes pour donner envie dès le lancement : de vrais articles du
  // catalogue avec leur vrai prix, jamais présentées comme des commandes passées par
  // d'autres clients (voir la discussion avec le patron : pas de fausse preuve sociale).
  const suggestions = useMemo(() => {
    const boeuf = viandes.find((v) => v.slug === "boeuf");
    const poulet = viandes.find((v) => v.slug === "poulet");
    const mangue = jus.find((j) => j.slug === "mangue");
    const ananas = jus.find((j) => j.slug === "ananas");
    const items: { key: string; image: string; label: string; detail: string; unitPrice: number; onClick: () => void }[] = [];
    if (boeuf && minCuissonPrice != null) {
      items.push({
        key: "sg-pate-boeuf",
        image: boeuf.image_path,
        label: "Pâté bœuf",
        detail: "Frit à l'huile · Bœuf · le classique",
        unitPrice: minCuissonPrice + boeuf.price_htg,
        onClick: () => navigate({ to: "/composer", search: { viande: "boeuf" } as never }),
      });
    }
    if (poulet && minCuissonPrice != null) {
      items.push({
        key: "sg-pate-poulet",
        image: poulet.image_path,
        label: "Pâté poulet",
        detail: "Frit à l'huile · Poulet · épicé",
        unitPrice: minCuissonPrice + poulet.price_htg,
        onClick: () => navigate({ to: "/composer", search: { viande: "poulet" } as never }),
      });
    }
    if (mangue) {
      items.push({
        key: "sg-jus-mangue",
        image: mangue.image_path,
        label: mangue.name,
        detail: mangue.description,
        unitPrice: mangue.price_htg,
        onClick: () => quickAddJus(mangue),
      });
    }
    if (ananas) {
      items.push({
        key: "sg-jus-ananas",
        image: ananas.image_path,
        label: ananas.name,
        detail: ananas.description,
        unitPrice: ananas.price_htg,
        onClick: () => quickAddJus(ananas),
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viandes, jus, minCuissonPrice]);

  const bestSellers = useMemo(() => {
    const boeuf = viandes.find((v) => v.slug === "boeuf");
    const poulet = viandes.find((v) => v.slug === "poulet");
    const delis = combos.find((c) => c.slug === "delis");
    const mangue = jus.find((j) => j.slug === "mangue");
    const fraise = jus.find((j) => j.slug === "fraise");
    const items: { key: string; image: string; title: string; subtitle: string; price: string; onClick: () => void }[] = [];
    if (boeuf && minCuissonPrice != null) {
      items.push({
        key: "bs-pate-boeuf",
        image: boeuf.image_path,
        title: "Pâté bœuf",
        subtitle: pateSubtitle("boeuf"),
        price: `dès ${formatHTG(minCuissonPrice + boeuf.price_htg)}`,
        onClick: () => navigate({ to: "/composer", search: { viande: "boeuf" } as never }),
      });
    }
    if (delis) {
      items.push({
        key: "bs-combo-delis",
        image: delis.image_path,
        title: delis.name,
        subtitle: delis.description,
        price: formatHTG(delis.price_htg),
        onClick: () => quickAddCombo(delis),
      });
    }
    if (mangue) {
      items.push({
        key: "bs-jus-mangue",
        image: mangue.image_path,
        title: mangue.name,
        subtitle: mangue.description,
        price: formatHTG(mangue.price_htg),
        onClick: () => quickAddJus(mangue),
      });
    }
    if (poulet && minCuissonPrice != null) {
      items.push({
        key: "bs-pate-poulet",
        image: poulet.image_path,
        title: "Pâté poulet",
        subtitle: pateSubtitle("poulet"),
        price: `dès ${formatHTG(minCuissonPrice + poulet.price_htg)}`,
        onClick: () => navigate({ to: "/composer", search: { viande: "poulet" } as never }),
      });
    }
    if (fraise) {
      items.push({
        key: "bs-jus-fraise",
        image: fraise.image_path,
        title: fraise.name,
        subtitle: fraise.description,
        price: formatHTG(fraise.price_htg),
        onClick: () => quickAddJus(fraise),
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viandes, jus, combos, minCuissonPrice]);

  function quickAddJus(j: (typeof jus)[number]) {
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

  function addComboWithJus(c: Combo, jusSlug: string) {
    const chosenJus = jus.find((j) => j.slug === jusSlug);
    const item: CartComboItem = {
      id: crypto.randomUUID(),
      type: "combo",
      combo_slug: c.slug,
      name: c.name,
      description: c.description,
      jus_slug: jusSlug,
      jus_label: chosenJus?.name ?? jusSlug,
      quantity: 1,
      unit_price_htg: c.price_htg,
    };
    addItem(item);
  }

  function quickAddCombo(c: Combo) {
    if (c.jus_choice_allowed) {
      setComboPicker(c);
      return;
    }
    addComboWithJus(c, c.jus_slug);
  }

  return (
    <div>
      <header className="px-5 pt-6 pb-3 bg-brand-cream">
        <h1 className="sr-only">Kreyòl Délis — Pâtés & jus naturels</h1>
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.webp"
            alt="Kreyòl Délis"
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
          />
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full shadow-sm pl-3 pr-2 py-2 min-w-0">
            <button onClick={() => setAddressSheetOpen(true)} className="flex-1 flex flex-col items-start min-w-0 text-left">
              <span className="flex items-center gap-1 text-[11px] text-brand-sage">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                Livraison
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-brand-ink truncate">
                {checkoutDraft.quartier || "Les Cayes, Sud"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <Link
              to="/mes-commandes"
              aria-label="Mes commandes"
              className="relative w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-brand-ink">
                <path
                  d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!open && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
            </Link>
          </div>
        </div>

        <div className="mt-3 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-sage"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pâté, jus de mangue…"
            className="w-full bg-white rounded-2xl py-2.5 pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-sage outline-none border border-brand-cream-3"
          />
        </div>
      </header>

      {!open && settings && (
        <div className="mx-5 mt-1 rounded-2xl bg-brand-gold-light/60 border border-brand-gold text-brand-green-dark text-sm px-4 py-3">
          Nous sommes fermés en ce moment. Prise de commandes tous les jours de {settings.opening_time.slice(0, 5)} à{" "}
          {settings.closing_time.slice(0, 5)}.
        </div>
      )}

      <div className="px-5 mt-5 grid grid-cols-3 gap-3">
        <button
          onClick={() => toggleCategory("pates")}
          className={`rounded-2xl border-2 bg-white flex flex-col items-center gap-2 py-4 px-2 ${
            categoryFilter === "pates" ? "border-brand-gold" : "border-brand-cream-3"
          }`}
        >
          <img src="/images/pate-hero.webp" alt="Pâtés" className="w-14 h-10 object-contain" />
          <span className="text-sm font-semibold text-brand-ink">Pâtés</span>
        </button>
        <button
          onClick={() => toggleCategory("jus")}
          className={`rounded-2xl border-2 bg-white flex flex-col items-center gap-2 py-4 px-2 ${
            categoryFilter === "jus" ? "border-brand-gold" : "border-brand-cream-3"
          }`}
        >
          <img src="/images/jus-trio.webp" alt="Jus" className="w-14 h-10 object-contain" />
          <span className="text-sm font-semibold text-brand-ink">Jus</span>
        </button>
        <button
          onClick={() => toggleCategory("combos")}
          className={`rounded-2xl border-2 bg-white flex flex-col items-center gap-2 py-4 px-2 ${
            categoryFilter === "combos" ? "border-brand-gold" : "border-brand-cream-3"
          }`}
        >
          <img src="/images/combo-hero.webp" alt="Combos" className="w-14 h-10 object-contain" />
          <span className="text-sm font-semibold text-brand-ink">Combos</span>
        </button>
      </div>

      {categoryFilter !== "all" && (
        <div className="px-5 mt-4">
          <button
            onClick={() => setCategoryFilter("all")}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-green"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tout voir
          </button>
        </div>
      )}

      {categoryFilter === "all" && <HeroCarousel />}

      {categoryFilter === "all" && suggestions.length > 0 && (
        <>
          <SectionTitle title="Envie d'essayer ?" subtitle="Nos suggestions pour commencer" />
          <div className="px-5 flex gap-3 overflow-x-auto pb-1">
            {suggestions.map((it) => (
              <div key={it.key} className="min-w-[150px] bg-white rounded-2xl border border-brand-cream-3 p-3">
                <img src={it.image} alt="" className="w-full h-20 object-contain mb-2" />
                <p className="font-semibold text-sm text-brand-ink truncate">{it.label}</p>
                <p className="text-xs text-brand-sage truncate">{it.detail}</p>
                <button
                  onClick={it.onClick}
                  className="mt-1.5 text-xs font-semibold bg-brand-gold-light text-brand-green-dark rounded-full px-2.5 py-1"
                >
                  Ajouter · {formatHTG(it.unitPrice)}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {categoryFilter === "all" && bestSellers.length > 0 && (
        <>
          <SectionTitle title="Nos best-sellers" subtitle="Les préférés des Cayes cette semaine" />
          <div className="px-5 flex gap-3 overflow-x-auto pb-1">
            {bestSellers.map((it) => (
              <button
                key={it.key}
                onClick={it.onClick}
                className="min-w-[130px] bg-white rounded-2xl border border-brand-cream-3 p-3 text-left"
              >
                <img src={it.image} alt="" className="w-full h-16 object-contain mb-2" />
                <p className="font-semibold text-sm">{it.title}</p>
                <p className="text-xs text-brand-sage truncate">{it.subtitle}</p>
                <p className="text-sm font-bold text-brand-green mt-1">{it.price}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {(categoryFilter === "all" || categoryFilter === "pates") && (
        <>
      <SectionTitle
        title="Nos pâtés"
        subtitle="Frits ou au four, farce du jour"
        action={{ label: "Composer", onClick: () => navigate({ to: "/composer" }) }}
      />
      <div className="px-5 grid grid-cols-2 gap-3">
        {viandes.map((v) => (
          <Link
            key={v.id}
            to="/composer"
            search={{ viande: v.slug } as never}
            className="bg-white rounded-2xl border border-brand-cream-3 p-3"
          >
            <img src={v.image_path} alt="" className="w-full h-20 object-contain mb-2" />
            <p className="font-semibold text-sm">Pâté {v.label.toLowerCase()}</p>
            <p className="text-xs text-brand-sage">{pateSubtitle(v.slug)}</p>
            <p className="text-sm font-bold text-brand-green mt-1">
              dès {formatHTG((minCuissonPrice ?? 0) + v.price_htg)}
            </p>
          </Link>
        ))}
        <Link
          to="/composer"
          className="col-span-2 bg-brand-green text-white rounded-2xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-bold">Composez le vôtre</p>
            <p className="text-xs opacity-80">Cuisson, viande, extras</p>
          </div>
          <span className="text-2xl">→</span>
        </Link>
      </div>
        </>
      )}

      {(categoryFilter === "all" || categoryFilter === "jus") && (
        <>
      <SectionTitle title="Nos jus naturels" subtitle="Pressés chaque matin · 33 cl" />
      <div className="px-5 flex gap-3 overflow-x-auto pb-1">
        {jus.map((j) => (
          <div key={j.id} className="min-w-[150px] bg-white rounded-2xl border border-brand-cream-3 p-3 relative">
            <button
              onClick={() => toggleFavorite(j.slug)}
              aria-label={isFavorite(j.slug) ? `Retirer ${j.name} des favoris` : `Ajouter ${j.name} aux favoris`}
              className="absolute top-2 right-2 text-brand-ink"
            >
              {isFavorite(j.slug) ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C15 15.65 12 20 12 20Z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path
                    d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C15 15.65 12 20 12 20Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <img src={j.image_path} alt={j.name} className="w-full h-20 object-contain mb-2" />
            <p className="font-semibold text-sm">{j.name}</p>
            <p className="text-xs text-brand-sage">{j.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-brand-green">{formatHTG(j.price_htg)}</span>
              <button
                onClick={() => quickAddJus(j)}
                className="w-7 h-7 rounded-full bg-brand-gold text-brand-green-dark font-bold flex items-center justify-center"
                aria-label={`Ajouter ${j.name}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {(categoryFilter === "all" || categoryFilter === "combos") && (
        <>
      <SectionTitle title="Nos combos" subtitle="Pâté + jus, prix réduit" />
      <div className="px-5 flex flex-col gap-3">
        {combos.map((c) => (
          <div key={c.id} className="bg-brand-green-dark text-white rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden">
            <img src={c.image_path} alt="" className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold">{c.name}</p>
              <p className="text-xs opacity-80">{c.description}</p>
              <span className="inline-block mt-1 text-[11px] font-semibold bg-brand-gold text-brand-green-dark rounded-full px-2 py-0.5">
                −{formatHTG(c.original_price_htg - c.price_htg)}
              </span>
              <div className="mt-1">
                <span className="text-xs line-through opacity-60 mr-2">{formatHTG(c.original_price_htg)}</span>
                <span className="text-lg font-extrabold text-brand-gold">{formatHTG(c.price_htg)}</span>
              </div>
            </div>
            <button
              onClick={() => quickAddCombo(c)}
              className="w-9 h-9 rounded-full bg-brand-cream text-brand-green-dark font-bold flex items-center justify-center flex-shrink-0"
              aria-label={`Ajouter ${c.name}`}
            >
              +
            </button>
          </div>
        ))}
      </div>
        </>
      )}

      {categoryFilter === "all" && <SocialFollowSection />}

      {comboPicker && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-[480px] bg-brand-cream rounded-t-3xl p-5">
            <div className="mx-auto w-10 h-1.5 bg-brand-cream-3 rounded-full mb-4" />
            <p className="font-bold mb-1">{comboPicker.name}</p>
            <p className="text-sm text-brand-sage mb-4">Choisissez votre jus</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {jus.map((j) => (
                <button
                  key={j.id}
                  onClick={() => {
                    addComboWithJus(comboPicker, j.slug);
                    setComboPicker(null);
                  }}
                  className="bg-white rounded-2xl border border-brand-cream-3 p-2 text-center"
                >
                  <img src={j.image_path} alt="" className="w-full h-14 object-contain mb-1" />
                  <p className="text-xs font-semibold">{j.name.replace("Jus de ", "").replace("Jus d'", "")}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setComboPicker(null)}
              className="w-full border border-brand-green text-brand-green rounded-full py-3 font-semibold"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {addressSheetOpen && <AddressSheet onClose={() => setAddressSheetOpen(false)} />}
    </div>
  );
}
