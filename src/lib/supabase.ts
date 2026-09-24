import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Variables Supabase manquantes : copiez .env.example vers .env.local et renseignez VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Garantit qu'un visiteur a une identité (auth.uid()) avant toute action
 * qui nécessite d'être "le client" : passer commande, voir ses commandes.
 * Aucun mot de passe : identité anonyme persistée dans le navigateur.
 */
export async function ensureCustomerSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signInData.session;
}
