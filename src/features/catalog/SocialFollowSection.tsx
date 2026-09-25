import { useState } from "react";
import { useSettings, useSocialPromoCode } from "./queries";

function TikTokBadge() {
  return (
    <span className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center flex-shrink-0 shadow-sm">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
        <path d="M16.6 5.82c-.9-.86-1.42-2.03-1.42-3.32h-3.14v13.4a2.72 2.72 0 1 1-2.72-2.72c.23 0 .45.02.66.07V9.9a5.86 5.86 0 0 0-.66-.04A5.86 5.86 0 1 0 15.2 15.7V9.03a7.3 7.3 0 0 0 4.3 1.38V7.28a4.3 4.3 0 0 1-2.9-1.46Z" />
      </svg>
    </span>
  );
}

function InstagramBadge() {
  return (
    <span
      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ background: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="#fff" stroke="none" />
      </svg>
    </span>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z" />
    </svg>
  );
}

export default function SocialFollowSection() {
  const { data: settings } = useSettings();
  const { data: promo } = useSocialPromoCode();
  const [copied, setCopied] = useState(false);

  const hasTikTok = !!settings?.tiktok_url;
  const hasInstagram = !!settings?.instagram_url;
  const hasAnyLink = hasTikTok || hasInstagram;

  if (!promo) return null;

  function copyCode() {
    if (!promo) return;
    navigator.clipboard?.writeText(promo.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="px-5">
      <div
        className="relative overflow-hidden rounded-[1.75rem] text-white shadow-lg"
        style={{ background: "linear-gradient(155deg,#1E4D2B 0%,#143820 65%,#0f2c18 100%)" }}
      >
        {/* décor : halos flous, purement visuel */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-brand-green-mid/40 blur-3xl" />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
              <SparkleIcon />
              Offre spéciale
            </div>
            <span className="flex-shrink-0 -rotate-3 bg-brand-gold text-brand-green-dark text-xs font-extrabold rounded-full px-3 py-1 shadow-sm">
              −{promo.discount_htg} HTG
            </span>
          </div>

          <h2 className="text-xl font-extrabold mt-2 leading-snug">Suivez-nous & économisez</h2>
          <p className="text-sm text-white/75 mt-1 leading-relaxed">
            {hasAnyLink
              ? "Abonnez-vous à Kreyòl Délis sur TikTok ou Instagram, puis entrez ce code à votre prochaine commande."
              : "Nos comptes TikTok et Instagram arrivent bientôt. En attendant, ce code est déjà valable."}
          </p>

          <div className="flex gap-3 mt-5">
            {hasAnyLink ? (
              <>
                {hasTikTok && (
                  <a
                    href={settings!.tiktok_url!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-2.5 transition-colors"
                  >
                    <TikTokBadge />
                    <span className="text-sm font-semibold">TikTok</span>
                  </a>
                )}
                {hasInstagram && (
                  <a
                    href={settings!.instagram_url!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-2.5 transition-colors"
                  >
                    <InstagramBadge />
                    <span className="text-sm font-semibold">Instagram</span>
                  </a>
                )}
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2.5 opacity-60">
                  <TikTokBadge />
                  <span className="text-xs font-medium leading-tight">Bientôt
                    <br />disponible</span>
                </div>
                <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2.5 opacity-60">
                  <InstagramBadge />
                  <span className="text-xs font-medium leading-tight">Bientôt
                    <br />disponible</span>
                </div>
              </>
            )}
          </div>

          <div className="relative mt-5 pt-4">
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.35) 50%, transparent 50%)",
                backgroundSize: "10px 1px",
              }}
            />
            <div className="absolute -top-2.5 -left-7 w-5 h-5 rounded-full bg-brand-cream" />
            <div className="absolute -top-2.5 -right-7 w-5 h-5 rounded-full bg-brand-cream" />

            <div className="flex items-center justify-between">
              <span className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-white/50">Votre code</span>
                <span className="block font-mono font-bold text-lg tracking-[0.2em]">{promo.code}</span>
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs font-bold bg-brand-gold text-brand-green-dark rounded-full px-4 py-2 active:scale-95 transition-transform"
              >
                {copied ? (
                  "Copié ✓"
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <rect x="9" y="9" width="12" height="12" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
