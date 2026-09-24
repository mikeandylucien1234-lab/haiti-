import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCuissons, useCombos, useJus, useSettings, useViandes } from "./queries";
import { formatHTG } from "@/lib/format";
import { isStoreOpenNow } from "@/lib/hours";
import { useRecentOrderItems } from "@/features/orders/useRecentOrderItems";
import { useCart } from "@/hooks/useCart";
import type { CartComboItem, CartJusItem } from "@/types/cart";

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 mt-8 mb-3">
      <h2 className="text-xl font-bold text-brand-ink">{title}</h2>
      {subtitle && <p className="text-sm text-brand-sage">{subtitle}</p>}
    </div>
  );
}

export default function HomePage() {
  const { data: settings } = useSettings();
  const { data: cuissons = [] } = useCuissons();
  const { data: viandes = [] } = useViandes();
  const { data: jus = [] } = useJus();
  const { data: combos = [] } = useCombos();
  const { data: recentItems = [] } = useRecentOrderItems();
  const { addItem } = useCart();
  const [query, setQuery] = useState("");

  const minCuissonPrice = useMemo(
    () => (cuissons.length ? Math.min(...cuissons.map((c) => c.price_htg)) : null),
    [cuissons]
  );

  const open = settings ? isStoreOpenNow(settings) : true;

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

  function quickAddCombo(c: (typeof combos)[number]) {
    const item: CartComboItem = {
      id: crypto.randomUUID(),
      type: "combo",
      combo_slug: c.slug,
      name: c.name,
      description: c.description,
      quantity: 1,
      unit_price_htg: c.price_htg,
    };
    addItem(item);
  }

  return (
    <div>
      <header className="bg-brand-green text-white px-5 pt-6 pb-5 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <img src="/images/logo.webp" alt="Kreyòl Délis" className="w-12 h-12 rounded-full object-cover border-2 border-brand-gold" />
          <div className="flex-1">
            <h1 className="text-lg font-extrabold leading-tight">Kreyòl Délis</h1>
            <p className="text-brand-gold-light text-xs">Pâtés & jus naturels</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" strokeLinecap="round" />
          </svg>
          <div className="text-xs">
            <div className="opacity-80">Livraison aux Cayes</div>
            <div className="font-semibold">Les Cayes, Sud</div>
          </div>
          {!open && (
            <span className="ml-auto text-[11px] font-semibold bg-brand-gold text-brand-green-dark px-2 py-1 rounded-full">
              Fermé
            </span>
          )}
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
            className="w-full bg-white rounded-2xl py-2.5 pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-sage outline-none"
          />
        </div>
      </header>

      {!open && settings && (
        <div className="mx-5 mt-4 rounded-2xl bg-brand-gold-light/60 border border-brand-gold text-brand-green-dark text-sm px-4 py-3">
          Nous sommes fermés en ce moment. Prise de commandes tous les jours de {settings.opening_time.slice(0, 5)} à{" "}
          {settings.closing_time.slice(0, 5)}.
        </div>
      )}

      <div className="px-5 mt-5 grid grid-cols-3 gap-3">
        <Link
          to="/composer"
          className="rounded-2xl border-2 border-brand-gold bg-white flex flex-col items-center gap-2 py-4 px-2"
        >
          <img src="/images/pate-hero.webp" alt="Pâtés" className="w-14 h-10 object-contain" />
          <span className="text-sm font-semibold text-brand-ink">Pâtés</span>
        </Link>
        <a href="#jus" className="rounded-2xl border border-brand-cream-3 bg-white flex flex-col items-center gap-2 py-4 px-2">
          <img src="/images/jus-trio.webp" alt="Jus" className="w-14 h-10 object-contain" />
          <span className="text-sm font-semibold text-brand-ink">Jus</span>
        </a>
        <a href="#combos" className="rounded-2xl border border-brand-cream-3 bg-white flex flex-col items-center gap-2 py-4 px-2">
          <img src="/images/combo-hero.webp" alt="Combos" className="w-14 h-10 object-contain" />
          <span className="text-sm font-semibold text-brand-ink">Combos</span>
        </a>
      </div>

      <div className="px-5 mt-5">
        <div className="rounded-2xl overflow-hidden relative bg-brand-green text-white">
          <img src="/images/banner-1.webp" alt="" className="w-full h-36 object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-green-dark/90 via-brand-green-dark/40 to-transparent flex flex-col justify-center px-5">
            <img src="/images/logo.webp" alt="" className="w-9 h-9 rounded-full mb-2" />
            <p className="text-sm font-semibold">Gou se vrè</p>
            <p className="text-xl font-extrabold text-brand-gold">natirèl !</p>
            <p className="text-[11px] mt-1 max-w-[65%] opacity-90">
              Pâté ki fè w sonje lakay, ak jî natirèl ki plen gou.
            </p>
          </div>
        </div>
      </div>

      {recentItems.length > 0 && (
        <>
          <SectionTitle title="Commandés récemment" subtitle="Recommandez en un geste" />
          <div className="px-5 flex gap-3 overflow-x-auto pb-1">
            {recentItems.map((it) => (
              <div key={it.key} className="min-w-[220px] bg-white rounded-2xl border border-brand-cream-3 p-3 flex gap-3">
                <img
                  src={it.image}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-ink truncate">{it.label}</p>
                  <p className="text-xs text-brand-sage truncate">{it.detail}</p>
                  <button
                    onClick={it.reorder}
                    className="mt-1 text-xs font-semibold bg-brand-gold-light text-brand-green-dark rounded-full px-2.5 py-1"
                  >
                    Recommander · {formatHTG(it.unitPrice)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle title="Nos pâtés" subtitle="Frits ou au four, farce du jour" />
      <div className="px-5 grid grid-cols-2 gap-3">
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
        {viandes.map((v) => (
          <Link
            key={v.id}
            to="/composer"
            search={{ viande: v.slug } as never}
            className="bg-white rounded-2xl border border-brand-cream-3 p-3"
          >
            <img src="/images/pate-hero.webp" alt="" className="w-full h-20 object-contain mb-2" />
            <p className="font-semibold text-sm">Pâté {v.label.toLowerCase()}</p>
            <p className="text-xs text-brand-sage">{v.slug === "boeuf" ? "Frit · le classique" : v.slug === "poulet" ? "Frit · épicé" : "Frit · hareng saur"}</p>
            <p className="text-sm font-bold text-brand-green mt-1">
              dès {formatHTG((minCuissonPrice ?? 0) + v.price_htg)}
            </p>
          </Link>
        ))}
      </div>

      <div id="jus" />
      <SectionTitle title="Nos jus naturels" subtitle="Pressés chaque matin · 33 cl" />
      <div className="px-5 flex gap-3 overflow-x-auto pb-1">
        {jus.map((j) => (
          <div key={j.id} className="min-w-[150px] bg-white rounded-2xl border border-brand-cream-3 p-3">
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

      <div id="combos" />
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
    </div>
  );
}
