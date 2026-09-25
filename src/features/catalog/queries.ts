import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Combo, Cuisson, Extra, Jus, Quartier, Settings, Viande } from "@/types/database";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings> => {
      const { data, error } = await supabase.from("settings").select("*").single();
      if (error) throw error;
      return data as Settings;
    },
    staleTime: 30_000,
  });
}

export function useCuissons() {
  return useQuery({
    queryKey: ["cuissons"],
    queryFn: async (): Promise<Cuisson[]> => {
      const { data, error } = await supabase
        .from("cuissons")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Cuisson[];
    },
  });
}

export function useViandes() {
  return useQuery({
    queryKey: ["viandes"],
    queryFn: async (): Promise<Viande[]> => {
      const { data, error } = await supabase
        .from("viandes")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Viande[];
    },
  });
}

export function useExtras() {
  return useQuery({
    queryKey: ["extras"],
    queryFn: async (): Promise<Extra[]> => {
      const { data, error } = await supabase
        .from("extras")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Extra[];
    },
  });
}

export function useJus() {
  return useQuery({
    queryKey: ["jus"],
    queryFn: async (): Promise<Jus[]> => {
      const { data, error } = await supabase.from("jus").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []) as Jus[];
    },
  });
}

export function useCombos() {
  return useQuery({
    queryKey: ["combos"],
    queryFn: async (): Promise<Combo[]> => {
      const { data, error } = await supabase
        .from("combos")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Combo[];
    },
  });
}

export function useQuartiers() {
  return useQuery({
    queryKey: ["quartiers"],
    queryFn: async (): Promise<Quartier[]> => {
      const { data, error } = await supabase
        .from("quartiers")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Quartier[];
    },
  });
}

export interface PromoCode {
  code: string;
  discount_htg: number;
  description: string;
  active: boolean;
  free_delivery: boolean;
}

function usePromoCodeByCode(code: string) {
  return useQuery({
    queryKey: ["promo-code", code],
    queryFn: async (): Promise<PromoCode | null> => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as PromoCode) ?? null;
    },
  });
}

export function useSocialPromoCode() {
  return usePromoCodeByCode("SOCIAL25");
}

export function useFreeDeliveryPromoCode() {
  return usePromoCodeByCode("BIENVENUE");
}
