// supabase/functions/submit-payment-proof/index.ts
// Enregistre la preuve de paiement MonCash/NatCash d'un client sur SA commande.
// Le montant à payer ne vient jamais du navigateur : il est déjà figé sur la
// commande (total_htg), calculé côté serveur à la création de la commande. Cette
// fonction ne fait qu'attacher une preuve à vérifier — jamais une confirmation.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

interface ProofPayload {
  order_id: string;
  transaction_number: string;
  payment_proof_path: string;
}

// N'accepte qu'un chemin de stockage à l'intérieur du dossier du client lui-même
// (jamais un chemin arbitraire fourni par le navigateur).
function isOwnProofPath(path: string | null | undefined, customerId: string): boolean {
  if (!path) return false;
  return path.startsWith(`${customerId}/`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Non authentifié" }, 401);

  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return json({ error: "Session invalide" }, 401);
  }
  const customerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let payload: ProofPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }

  const transactionNumber = payload.transaction_number?.trim() ?? "";
  if (!transactionNumber) {
    return json({ error: "Le numéro de transaction est requis." }, 400);
  }
  if (transactionNumber.length > 100) {
    return json({ error: "Numéro de transaction trop long." }, 400);
  }
  if (!isOwnProofPath(payload.payment_proof_path, customerId)) {
    return json({ error: "Preuve de paiement invalide." }, 400);
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, customer_id, payment_method, payment_status")
    .eq("id", payload.order_id)
    .maybeSingle();

  if (orderError || !order) {
    return json({ error: "Commande introuvable" }, 404);
  }
  if (order.customer_id !== customerId) {
    return json({ error: "Cette commande ne vous appartient pas." }, 403);
  }
  if (order.payment_method !== "moncash" && order.payment_method !== "natcash") {
    return json({ error: "Cette commande n'attend pas de preuve de paiement." }, 400);
  }
  if (order.payment_status !== "pending_proof" && order.payment_status !== "rejected") {
    return json({ error: "Une preuve a déjà été envoyée pour cette commande." }, 409);
  }

  // Un même numéro de transaction ne doit pas pouvoir servir deux fois.
  const { count: duplicate } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_method", order.payment_method)
    .eq("transaction_number", transactionNumber)
    .neq("id", order.id);

  if ((duplicate ?? 0) > 0) {
    return json({ error: "Ce numéro de transaction a déjà été utilisé pour une autre commande." }, 409);
  }

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      transaction_number: transactionNumber,
      payment_proof_path: payload.payment_proof_path,
      payment_status: "pending_verification",
      payment_submitted_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .select()
    .single();

  if (updateError || !updated) {
    return json({ error: "Impossible d'enregistrer la preuve de paiement", detail: updateError?.message }, 500);
  }

  return json({ order: updated });
});
