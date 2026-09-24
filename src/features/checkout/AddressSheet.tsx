import { useEffect, useRef, useState } from "react";
import { useQuartiers } from "@/features/catalog/queries";
import { useCheckoutDraft } from "@/hooks/useCheckoutDraft";
import { uploadHousePhoto } from "@/lib/housePhoto";

type GeoStatus = "idle" | "locating" | "success" | "denied" | "unsupported";

export default function AddressSheet({ onClose }: { onClose: () => void }) {
  const { data: quartiers = [] } = useQuartiers();
  const { draft, update } = useCheckoutDraft();
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [quartier, setQuartier] = useState(draft.quartier);
  const [address, setAddress] = useState(draft.address);
  const [landmark, setLandmark] = useState(draft.landmark);
  const [lat, setLat] = useState<number | null>(draft.lat);
  const [lng, setLng] = useState<number | null>(draft.lng);
  const [locationSource, setLocationSource] = useState<"gps" | "manual">(draft.locationSource);
  const [photoUrl, setPhotoUrl] = useState<string | null>(draft.housePhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triedAutoLocate = useRef(false);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationSource("gps");
        setGeoStatus("success");
      },
      () => {
        setGeoStatus("denied");
        setLocationSource("manual");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Avant tout : on demande la position exacte de la personne. Si on n'y arrive
  // pas (refus, indisponible, timeout), elle bascule automatiquement sur la
  // saisie manuelle ci-dessous — jamais de coordonnées inventées.
  useEffect(() => {
    if (triedAutoLocate.current) return;
    triedAutoLocate.current = true;
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploading(true);
    try {
      const url = await uploadHousePhoto(file);
      setPhotoUrl(url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Échec de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  }

  const canSave = quartier.trim().length > 0 && address.trim().length > 0;

  function handleSave() {
    update({
      quartier,
      address,
      landmark,
      lat: locationSource === "gps" ? lat : null,
      lng: locationSource === "gps" ? lng : null,
      locationSource,
      housePhotoUrl: photoUrl,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-[480px] max-h-[88vh] overflow-y-auto bg-brand-cream rounded-t-3xl p-5">
        <div className="mx-auto w-10 h-1.5 bg-brand-cream-3 rounded-full mb-4" />
        <h2 className="text-lg font-extrabold mb-1">Adresse de livraison</h2>
        <p className="text-sm text-brand-sage mb-4">Aux Cayes uniquement pour l'instant.</p>

        <div className="rounded-2xl bg-white border border-brand-cream-3 p-4 mb-4">
          {geoStatus === "locating" && (
            <p className="text-sm text-brand-sage flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
              Localisation en cours…
            </p>
          )}
          {geoStatus === "success" && lat != null && lng != null && (
            <p className="text-sm text-brand-green font-medium">
              Position exacte enregistrée ✓ ({lat.toFixed(5)}, {lng.toFixed(5)})
            </p>
          )}
          {(geoStatus === "denied" || geoStatus === "unsupported") && (
            <p className="text-sm text-brand-green-dark">
              Impossible d'obtenir votre position exacte. Indiquez votre adresse ci-dessous.
            </p>
          )}
          {geoStatus === "success" && (
            <button onClick={locate} className="text-xs text-brand-green font-semibold mt-2">
              Actualiser ma position
            </button>
          )}
          {(geoStatus === "denied" || geoStatus === "unsupported") && (
            <button onClick={locate} className="text-xs text-brand-green font-semibold mt-2">
              Réessayer la localisation
            </button>
          )}
        </div>

        <label className="block mb-4">
          <span className="block text-sm font-semibold text-brand-ink mb-1.5">Quartier aux Cayes</span>
          <div className="flex flex-wrap gap-2">
            {quartiers.map((q) => (
              <button
                key={q.id}
                onClick={() => setQuartier(q.name)}
                className={`rounded-full px-4 py-2 text-sm font-medium border ${
                  quartier === q.name
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-white text-brand-ink border-brand-cream-3"
                }`}
              >
                {q.name}
              </button>
            ))}
          </div>
        </label>

        <label className="block mb-4">
          <span className="block text-sm font-semibold text-brand-ink mb-1.5">Adresse</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rue, numéro de maison"
            className="w-full bg-white border border-brand-cream-3 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block mb-4">
          <span className="block text-sm font-semibold text-brand-ink mb-1.5">Point de repère (facultatif)</span>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Ex. : près de la pharmacie"
            className="w-full bg-white border border-brand-cream-3 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block mb-5">
          <span className="block text-sm font-semibold text-brand-ink mb-1.5">
            Photo de votre maison (facultatif)
          </span>
          <p className="text-xs text-brand-sage mb-2">Aide le livreur à repérer votre maison plus facilement.</p>
          {photoUrl ? (
            <div className="relative w-28 h-28">
              <img src={photoUrl} alt="Photo de la maison" className="w-28 h-28 rounded-2xl object-cover" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-brand-cream-3 text-brand-ink text-xs flex items-center justify-center"
                aria-label="Retirer la photo"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-28 h-28 rounded-2xl border-2 border-dashed border-brand-cream-3 bg-white flex flex-col items-center justify-center gap-1 text-brand-sage disabled:opacity-60"
            >
              {uploading ? (
                <span className="w-4 h-4 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="6" width="18" height="14" rx="2" />
                    <circle cx="12" cy="13" r="3" />
                    <path d="M8 6l1.5-2h5L16 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs">Ajouter</span>
                </>
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
        </label>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-brand-green text-brand-green rounded-full py-3 font-semibold">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-brand-green-dark disabled:opacity-50 text-white rounded-full py-3 font-semibold"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
