import { useRef, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useQuartiers } from "@/features/catalog/queries";
import { useCheckoutDraft } from "@/hooks/useCheckoutDraft";
import { uploadHousePhoto } from "@/lib/housePhoto";

export default function DeliveryPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { data: quartiers = [] } = useQuartiers();
  const { draft, update } = useCheckoutDraft();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const url = await uploadHousePhoto(file);
      update({ housePhotoUrl: url });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Échec de l'envoi de la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const missing: string[] = [];
  if (!draft.customerName.trim()) missing.push("nom");
  if (!draft.phone.trim()) missing.push("téléphone");
  if (!draft.quartier) missing.push("quartier");
  if (!draft.address.trim()) missing.push("adresse");

  function useMyPosition() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("La localisation n'est pas disponible sur cet appareil. Saisissez votre adresse ci-dessous.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        update({ lat: pos.coords.latitude, lng: pos.coords.longitude, locationSource: "gps" });
      },
      () => {
        setLocating(false);
        setGeoError("Impossible d'obtenir votre position. Saisissez votre adresse ci-dessous.");
        update({ lat: null, lng: null, locationSource: "manual" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="pb-10">
      <header className="flex items-center gap-3 px-5 pt-5 pb-1">
        <button onClick={() => router.history.back()} className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center">
          ←
        </button>
        <h1 className="text-lg font-extrabold flex-1">Livraison</h1>
        <span className="text-xs text-brand-sage font-medium">Étape 1 sur 2</span>
      </header>
      <div className="px-5 mt-2 mb-4 h-1.5 rounded-full bg-brand-cream-3 overflow-hidden">
        <div className="h-full w-1/2 bg-brand-green rounded-full" />
      </div>

      <div className="px-5 rounded-2xl bg-brand-gold-light/60 border border-brand-gold text-brand-green-dark text-sm px-4 py-3 mb-5">
        Livraison uniquement aux Cayes pour l'instant. D'autres villes arrivent bientôt.
      </div>

      <div className="px-5 flex flex-col gap-4">
        <Field label="Nom complet">
          <input
            value={draft.customerName}
            onChange={(e) => update({ customerName: e.target.value })}
            placeholder="Ex. : Marie-Carmel Joseph"
            className="w-full bg-white border border-brand-cream-3 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-green"
          />
        </Field>

        <Field label="Téléphone">
          <div className="flex items-center gap-2 bg-white border border-brand-cream-3 rounded-2xl px-4 py-3">
            <span className="text-sm text-brand-sage font-medium">+509</span>
            <input
              value={draft.phone}
              onChange={(e) => update({ phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 8) })}
              placeholder="3X XX XXXX"
              inputMode="numeric"
              className="flex-1 text-sm outline-none"
            />
          </div>
        </Field>

        <Field label="Quartier aux Cayes">
          <div className="flex flex-wrap gap-2">
            {quartiers.map((q) => (
              <button
                key={q.id}
                onClick={() => update({ quartier: q.name })}
                className={`rounded-full px-4 py-2 text-sm font-medium border ${
                  draft.quartier === q.name
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-white text-brand-ink border-brand-cream-3"
                }`}
              >
                {q.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Adresse de livraison">
          <div className="flex bg-brand-cream-2 rounded-full p-1">
            <button
              onClick={() => update({ locationSource: "manual", lat: null, lng: null })}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                draft.locationSource === "manual" ? "bg-white shadow text-brand-ink" : "text-brand-sage"
              }`}
            >
              Saisir l'adresse
            </button>
            <button
              onClick={useMyPosition}
              disabled={locating}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                draft.locationSource === "gps" ? "bg-white shadow text-brand-ink" : "text-brand-sage"
              }`}
            >
              {locating ? "Localisation…" : "Position exacte"}
            </button>
          </div>
          {draft.locationSource === "gps" && draft.lat && draft.lng && (
            <p className="text-xs text-brand-green mt-2">
              Position enregistrée ({draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}). Précisez quand même la rue ci-dessous.
            </p>
          )}
          {geoError && <p className="text-xs text-red-600 mt-2">{geoError}</p>}
        </Field>

        <Field label="Adresse">
          <input
            value={draft.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Rue, numéro de maison"
            className="w-full bg-white border border-brand-cream-3 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-green"
          />
        </Field>

        <Field label="Point de repère (facultatif)">
          <input
            value={draft.landmark}
            onChange={(e) => update({ landmark: e.target.value })}
            placeholder="Ex. : près de la pharmacie"
            className="w-full bg-white border border-brand-cream-3 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-green"
          />
        </Field>

        <Field label="Photo de votre maison (facultatif)">
          <p className="text-xs text-brand-sage mb-2 -mt-1">Aide le livreur à repérer votre maison plus facilement.</p>
          {draft.housePhotoUrl ? (
            <div className="relative w-24 h-24">
              <img src={draft.housePhotoUrl} alt="Photo de la maison" className="w-24 h-24 rounded-2xl object-cover" />
              <button
                onClick={() => update({ housePhotoUrl: null })}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-brand-cream-3 text-brand-ink text-xs flex items-center justify-center"
                aria-label="Retirer la photo"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-brand-cream-3 bg-white flex items-center justify-center text-brand-sage disabled:opacity-60"
            >
              {uploadingPhoto ? (
                <span className="w-4 h-4 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
              ) : (
                <span className="text-xs">Ajouter</span>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
          {photoError && <p className="text-xs text-red-600 mt-2">{photoError}</p>}
        </Field>

        {missing.length > 0 && (
          <p className="text-xs text-brand-gold font-medium">
            À compléter : {missing.join(", ")}
          </p>
        )}

        <button
          disabled={missing.length > 0}
          onClick={() => navigate({ to: "/paiement" })}
          className="w-full bg-brand-green-mid disabled:bg-brand-sage text-white rounded-full py-3.5 font-semibold"
        >
          Continuer vers le paiement
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-brand-ink mb-1.5">{label}</span>
      {children}
    </label>
  );
}
