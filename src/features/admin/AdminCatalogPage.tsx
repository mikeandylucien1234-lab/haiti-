import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type Table = "cuissons" | "viandes" | "extras" | "jus" | "combos";

function useAdminList<T extends { id: string; active: boolean }>(table: Table) {
  const [rows, setRows] = useState<T[] | null>(null);
  const qc = useQueryClient();

  async function load() {
    const { data } = await supabase.from(table).select("*").order("sort_order");
    setRows((data as T[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  // Le nom de table est dynamique ici : supabase-js ne peut pas résoudre le type
  // précis de la ligne à ce site d'appel générique, d'où ce cast ciblé sur `.update`.
  const untypedFrom = (t: Table) => supabase.from(t) as unknown as { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } };

  async function updatePrice(id: string, field: string, value: number) {
    await untypedFrom(table).update({ [field]: value }).eq("id", id);
    await load();
    qc.invalidateQueries({ queryKey: [table] });
  }

  async function toggleActive(id: string, active: boolean) {
    await untypedFrom(table).update({ active: !active }).eq("id", id);
    await load();
    qc.invalidateQueries({ queryKey: [table] });
  }

  return { rows, load, updatePrice, toggleActive };
}

function PriceInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [local, setLocal] = useState(String(value));
  return (
    <input
      type="number"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Number(local);
        if (!Number.isNaN(n) && n !== value) onSave(n);
      }}
      className="w-20 border border-brand-cream-3 rounded-lg px-2 py-1 text-sm text-right"
    />
  );
}

export default function AdminCatalogPage() {
  const cuissons = useAdminList<{ id: string; label: string; price_htg: number; active: boolean }>("cuissons");
  const viandes = useAdminList<{ id: string; label: string; price_htg: number; active: boolean }>("viandes");
  const extras = useAdminList<{ id: string; label: string; price_htg: number; active: boolean }>("extras");
  const jusList = useAdminList<{ id: string; name: string; price_htg: number; active: boolean }>("jus");
  const combos = useAdminList<{ id: string; name: string; price_htg: number; original_price_htg: number; active: boolean }>(
    "combos"
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-sage">
        Modifiez les prix ou désactivez un article (il disparaît du site sans être supprimé). Les changements sont
        immédiats.
      </p>

      <CatalogSection title="Cuissons" list={cuissons} nameKey="label" />
      <CatalogSection title="Viandes" list={viandes} nameKey="label" />
      <CatalogSection title="Extras" list={extras} nameKey="label" />
      <CatalogSection title="Jus" list={jusList} nameKey="name" />
      <CatalogSection title="Combos" list={combos} nameKey="name" />
    </div>
  );
}

function CatalogSection<T extends { id: string; price_htg: number; active: boolean }>({
  title,
  list,
  nameKey,
}: {
  title: string;
  list: ReturnType<typeof useAdminList<T>>;
  nameKey: keyof T;
}) {
  return (
    <section>
      <h2 className="font-bold mb-2">{title}</h2>
      <div className="bg-white rounded-2xl border border-brand-cream-3 divide-y divide-brand-cream-3">
        {(list.rows ?? []).map((row) => (
          <div key={row.id} className="flex items-center gap-3 px-4 py-3">
            <span className={`flex-1 text-sm font-medium ${row.active ? "" : "text-brand-sage line-through"}`}>
              {String(row[nameKey])}
            </span>
            <span className="text-xs text-brand-sage">HTG</span>
            <PriceInput value={row.price_htg} onSave={(v) => list.updatePrice(row.id, "price_htg", v)} />
            <button
              onClick={() => list.toggleActive(row.id, row.active)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 ${
                row.active ? "bg-brand-cream-2 text-brand-ink" : "bg-brand-green text-white"
              }`}
            >
              {row.active ? "Désactiver" : "Activer"}
            </button>
          </div>
        ))}
        {!list.rows && <p className="px-4 py-3 text-sm text-brand-sage">Chargement…</p>}
      </div>
    </section>
  );
}
