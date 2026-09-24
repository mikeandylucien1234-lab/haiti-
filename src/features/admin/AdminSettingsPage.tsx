import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Settings } from "@/types/database";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .single()
      .then(({ data }) => setSettings(data as unknown as Settings));
  }, []);

  async function save(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    await supabase.from("settings").update(patch as never).eq("id", true);
    qc.invalidateQueries({ queryKey: ["settings"] });
    setSaving(false);
    setSavedAt(Date.now());
  }

  if (!settings) return <p className="text-brand-sage text-sm">Chargement…</p>;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <section className="bg-white rounded-2xl border border-brand-cream-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Prise de commandes</p>
            <p className="text-xs text-brand-sage">Fermez temporairement le site (rupture, fin de service…)</p>
          </div>
          <button
            onClick={() => save({ store_open: !settings.store_open })}
            className={`w-14 h-8 rounded-full relative transition-colors ${
              settings.store_open ? "bg-brand-green" : "bg-brand-sage"
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.store_open ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className={`text-sm font-semibold mt-2 ${settings.store_open ? "text-brand-green" : "text-red-600"}`}>
          {settings.store_open ? "Ouvert" : "Fermé manuellement"}
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-brand-cream-3 p-4">
        <p className="font-semibold mb-3">Horaires de prise de commandes</p>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <span className="block text-xs text-brand-sage mb-1">Ouverture</span>
            <input
              type="time"
              value={settings.opening_time.slice(0, 5)}
              onChange={(e) => save({ opening_time: e.target.value })}
              className="w-full border border-brand-cream-3 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex-1">
            <span className="block text-xs text-brand-sage mb-1">Fermeture</span>
            <input
              type="time"
              value={settings.closing_time.slice(0, 5)}
              onChange={(e) => save({ closing_time: e.target.value })}
              className="w-full border border-brand-cream-3 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-brand-sage mt-2">Tous les jours, heure de Les Cayes (Amérique/Port-au-Prince).</p>
      </section>

      <section className="bg-white rounded-2xl border border-brand-cream-3 p-4">
        <p className="font-semibold mb-3">Frais de livraison</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            defaultValue={settings.delivery_fee_htg}
            onBlur={(e) => save({ delivery_fee_htg: Number(e.target.value) })}
            className="w-28 border border-brand-cream-3 rounded-lg px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-brand-sage">HTG, appliqué à toutes les commandes aux Cayes</span>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-brand-cream-3 p-4">
        <p className="font-semibold mb-3">Portion de viande supplémentaire</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            defaultValue={settings.extra_viande_portion_htg}
            onBlur={(e) => save({ extra_viande_portion_htg: Number(e.target.value) })}
            className="w-28 border border-brand-cream-3 rounded-lg px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-brand-sage">HTG par portion en plus dans le composeur de pâté</span>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-brand-cream-3 p-4">
        <p className="font-semibold mb-1">Réseaux sociaux</p>
        <p className="text-xs text-brand-sage mb-3">
          Utilisés par la section « Suivez-nous » de l'accueil. Elle reste cachée tant que les deux champs sont vides.
        </p>
        <label className="block mb-3">
          <span className="block text-xs text-brand-sage mb-1">Lien TikTok</span>
          <input
            type="url"
            defaultValue={settings.tiktok_url ?? ""}
            onBlur={(e) => save({ tiktok_url: e.target.value.trim() || null })}
            placeholder="https://www.tiktok.com/@votrecompte"
            className="w-full border border-brand-cream-3 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-brand-sage mb-1">Lien Instagram</span>
          <input
            type="url"
            defaultValue={settings.instagram_url ?? ""}
            onBlur={(e) => save({ instagram_url: e.target.value.trim() || null })}
            placeholder="https://www.instagram.com/votrecompte"
            className="w-full border border-brand-cream-3 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
      </section>

      <p className="text-xs text-brand-sage">
        {saving ? "Enregistrement…" : savedAt ? "Enregistré ✓" : ""}
      </p>
    </div>
  );
}
