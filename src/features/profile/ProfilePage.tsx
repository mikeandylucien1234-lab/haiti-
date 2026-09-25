import { Link } from "@tanstack/react-router";
import { useCheckoutDraft } from "@/hooks/useCheckoutDraft";
import { useFavorites } from "@/hooks/useFavorites";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useSettings } from "@/features/catalog/queries";
import { formatHTG } from "@/lib/format";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hhmm(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand-sage flex-shrink-0">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkRow({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-white rounded-2xl border border-brand-cream-3 px-4 py-3.5">
      <span className="w-9 h-9 rounded-full bg-brand-cream-2 flex items-center justify-center flex-shrink-0 text-brand-green-dark">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-brand-ink">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="text-xs font-bold bg-brand-green text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
          {badge}
        </span>
      )}
      <ChevronRight />
    </Link>
  );
}

export default function ProfilePage() {
  const { draft } = useCheckoutDraft();
  const { favorites } = useFavorites();
  const { orders, loading } = useMyOrders();
  const { data: settings } = useSettings();

  const hasAddress = !!draft.quartier || !!draft.address;

  return (
    <div className="pb-10">
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-lg font-extrabold">Profil</h1>
        <p className="text-sm text-brand-sage">Vos informations sur cet appareil</p>
      </header>

      <div className="px-5">
        <div className="bg-brand-green-dark text-white rounded-2xl p-4 flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center font-extrabold text-lg flex-shrink-0">
            {initials(draft.customerName)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{draft.customerName || "Ajoutez votre nom"}</p>
            <p className="text-sm text-white/70 truncate">{draft.phone ? `+509 ${draft.phone}` : "Aucun numéro enregistré"}</p>
          </div>
          <Link
            to="/livraison"
            className="flex-shrink-0 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-full px-3 py-2 transition-colors"
          >
            Modifier
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white rounded-2xl border border-brand-cream-3 p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-green-dark">{loading ? "…" : orders.length}</p>
            <p className="text-xs text-brand-sage mt-0.5">Commande{orders.length > 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-cream-3 p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-green-dark">{favorites.length}</p>
            <p className="text-xs text-brand-sage mt-0.5">Favori{favorites.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <p className="px-5 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-brand-sage">Adresse de livraison</p>
      <div className="px-5">
        {hasAddress ? (
          <div className="bg-white rounded-2xl border border-brand-cream-3 p-4 flex items-start gap-3">
            {draft.housePhotoUrl && (
              <img src={draft.housePhotoUrl} alt="Photo de la maison" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{draft.quartier || "Quartier non précisé"}</p>
              <p className="text-xs text-brand-sage mt-0.5">{draft.address}</p>
              {draft.landmark && <p className="text-xs text-brand-sage">{draft.landmark}</p>}
              {draft.locationSource === "gps" && draft.lat && draft.lng && (
                <p className="text-xs text-brand-green font-medium mt-1">Position exacte enregistrée ✓</p>
              )}
            </div>
            <Link to="/livraison" className="flex-shrink-0 text-xs font-semibold text-brand-green">
              Modifier
            </Link>
          </div>
        ) : (
          <Link
            to="/livraison"
            className="block bg-white rounded-2xl border-2 border-dashed border-brand-cream-3 p-4 text-center text-sm text-brand-sage"
          >
            Ajoutez votre adresse de livraison
          </Link>
        )}
      </div>

      <p className="px-5 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-brand-sage">Menu</p>
      <div className="px-5 flex flex-col gap-2.5">
        <LinkRow
          to="/notifications"
          label="Notifications"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <LinkRow
          to="/mes-commandes"
          label="Mes commandes"
          badge={orders.length}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 8h12l-1 12H7L6 8Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <LinkRow
          to="/favoris"
          label="Mes favoris"
          badge={favorites.length}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C15 15.65 12 20 12 20Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      {settings && (
        <>
          <p className="px-5 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-brand-sage">À propos</p>
          <div className="px-5">
            <div className="bg-white rounded-2xl border border-brand-cream-3 divide-y divide-brand-cream-3">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-brand-sage">Horaires</span>
                <span className="text-sm font-semibold text-brand-ink">
                  {hhmm(settings.opening_time)} – {hhmm(settings.closing_time)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-brand-sage">Zone de livraison</span>
                <span className="text-sm font-semibold text-brand-ink">Les Cayes, Sud</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-brand-sage">Frais de livraison</span>
                <span className="text-sm font-semibold text-brand-ink">{formatHTG(settings.delivery_fee_htg)}</span>
              </div>
              {(settings.tiktok_url || settings.instagram_url) && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-brand-sage">Réseaux sociaux</span>
                  <span className="flex items-center gap-2">
                    {settings.tiktok_url && (
                      <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-green">
                        TikTok
                      </a>
                    )}
                    {settings.instagram_url && (
                      <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-green">
                        Instagram
                      </a>
                    )}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-brand-sage mt-3 px-1 leading-relaxed">
              Pas de compte ni de mot de passe : vous êtes identifié·e de façon anonyme et sécurisée sur cet appareil. Votre
              nom, téléphone et adresse restent enregistrés localement pour préremplir vos prochaines commandes.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
