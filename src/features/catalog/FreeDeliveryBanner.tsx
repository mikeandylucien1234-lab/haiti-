import { useState } from "react";
import { useFreeDeliveryPromoCode } from "./queries";

export default function FreeDeliveryBanner() {
  const { data: promo } = useFreeDeliveryPromoCode();
  const [copied, setCopied] = useState(false);

  if (!promo) return null;

  function copyCode() {
    if (!promo) return;
    navigator.clipboard?.writeText(promo.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="px-5 mt-6 flex flex-col gap-3">
      <div className="rounded-[1.75rem] overflow-hidden shadow-lg">
        <img src="/images/banner-free-delivery.webp" alt="Livraison gratuite" className="w-full h-auto block" />
      </div>

      <div className="rounded-[1.75rem] overflow-hidden shadow-lg bg-black flex items-center gap-3 px-4 py-3.5">
        <p className="flex-1 text-xs text-white/80 leading-snug">
          Utilisez ce code à votre prochaine commande pour la livraison gratuite.
        </p>
        <button
          onClick={copyCode}
          aria-label={`Copier le code ${promo.code}`}
          title="Copier le code"
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-gold text-brand-green-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
        >
          {copied ? (
            <span className="text-base font-bold">✓</span>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
          <span className="text-[8px] font-mono font-bold tracking-tight">{promo.code}</span>
        </button>
      </div>
    </div>
  );
}
