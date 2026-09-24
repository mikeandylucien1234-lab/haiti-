import { useCallback, useEffect, useState } from "react";

export interface CheckoutDraft {
  customerName: string;
  phone: string;
  quartier: string;
  address: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  locationSource: "gps" | "manual";
  housePhotoUrl: string | null;
}

const STORAGE_KEY = "kd_checkout_draft_v1";

const EMPTY: CheckoutDraft = {
  customerName: "",
  phone: "",
  quartier: "",
  address: "",
  landmark: "",
  lat: null,
  lng: null,
  locationSource: "manual",
  housePhotoUrl: null,
};

function load(): CheckoutDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function useCheckoutDraft() {
  const [draft, setDraft] = useState<CheckoutDraft>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  const update = useCallback((patch: Partial<CheckoutDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const clear = useCallback(() => setDraft(EMPTY), []);

  return { draft, update, clear };
}
