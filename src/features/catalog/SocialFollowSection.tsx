import { useState } from "react";
import { useSettings, useSocialPromoCode } from "./queries";

function TikTokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82c-.9-.86-1.42-2.03-1.42-3.32h-3.14v13.4a2.72 2.72 0 1 1-2.72-2.72c.23 0 .45.02.66.07V9.9a5.86 5.86 0 0 0-.66-.04A5.86 5.86 0 1 0 15.2 15.7V9.03a7.3 7.3 0 0 0 4.3 1.38V7.28a4.3 4.3 0 0 1-2.9-1.46Z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SocialFollowSection() {
  const { data: settings } = useSettings();
  const { data: promo } = useSocialPromoCode();
  const [copied, setCopied] = useState(false);

  const hasTikTok = !!settings?.tiktok_url;
  const hasInstagram = !!settings?.instagram_url;

  if (!promo || (!hasTikTok && !hasInstagram)) return null;

  function copyCode() {
    if (!promo) return;
    navigator.clipboard?.writeText(promo.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="px-5 mt-8">
      <div className="rounded-2xl bg-brand-green-dark text-white p-5">
        <h2 className="text-lg font-extrabold">Suivez-nous, gagnez {promo.discount_htg} HTG</h2>
        <p className="text-sm opacity-80 mt-1">
          Abonnez-vous à Kreyòl Délis sur TikTok ou Instagram, puis utilisez ce code à votre prochaine
          commande.
        </p>

        <div className="flex gap-3 mt-4">
          {hasTikTok && (
            <a
              href={settings!.tiktok_url!}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-brand-ink rounded-full py-2.5 font-semibold text-sm"
            >
              <TikTokIcon />
              TikTok
            </a>
          )}
          {hasInstagram && (
            <a
              href={settings!.instagram_url!}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-brand-ink rounded-full py-2.5 font-semibold text-sm"
            >
              <InstagramIcon />
              Instagram
            </a>
          )}
        </div>

        <button
          onClick={copyCode}
          className="w-full flex items-center justify-between mt-4 bg-white/10 rounded-2xl px-4 py-3"
        >
          <span className="text-left">
            <span className="block text-[11px] opacity-70">Votre code</span>
            <span className="block font-mono font-bold tracking-wider">{promo.code}</span>
          </span>
          <span className="text-xs font-semibold bg-brand-gold text-brand-green-dark rounded-full px-3 py-1.5">
            {copied ? "Copié ✓" : "Copier"}
          </span>
        </button>
      </div>
    </div>
  );
}
