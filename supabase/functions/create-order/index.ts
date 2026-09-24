// supabase/functions/create-order/index.ts
// Calcule et enregistre une commande côté serveur.
// Le navigateur n'envoie que des identifiants (slugs/ids) et des quantités :
// tous les prix sont relus depuis la base au moment de la commande.
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

type PateItem = {
  type: "pate";
  cuisson_slug: string;
  viande_slug: string;
  extra_viande_portions?: number;
  extra_slugs?: string[];
  quantity: number;
};
type JusItem = { type: "jus"; jus_slug: string; quantity: number };
type ComboItem = { type: "combo"; combo_slug: string; quantity: number };
type IncomingItem = PateItem | JusItem | ComboItem;

interface OrderPayload {
  items: IncomingItem[];
  customer_name: string;
  phone: string;
  quartier: string;
  address: string;
  landmark?: string;
  lat?: number | null;
  lng?: number | null;
  location_source: "gps" | "manual";
  payment_method: "moncash" | "natcash" | "cash";
}

function isStoreOpenNow(
  settings: { store_open: boolean; opening_time: string; closing_time: string; timezone: string },
): boolean {
  if (!settings.store_open) return false;
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: settings.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  const nowMinutes = Number(hh) * 60 + Number(mm);
  const [oh, om] = settings.opening_time.split(":").map(Number);
  const [ch, cm] = settings.closing_time.split(":").map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Non authentifié" }, 401);

  // Client "identité" : vérifie qui est l'appelant (via son JWT).
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return json({ error: "Session invalide" }, 401);
  }
  const customerId = userData.user.id;

  // Client "service" : lit les prix vrais et écrit la commande (RLS ignorée volontairement ici).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let payload: OrderPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }

  if (!payload.items?.length) return json({ error: "Panier vide" }, 400);
  if (!payload.customer_name?.trim()) return json({ error: "Nom requis" }, 400);
  if (!payload.phone?.trim()) return json({ error: "Téléphone requis" }, 400);
  if (!payload.quartier?.trim()) return json({ error: "Quartier requis" }, 400);
  if (!payload.address?.trim()) return json({ error: "Adresse requise" }, 400);
  if (!["moncash", "natcash", "cash"].includes(payload.payment_method)) {
    return json({ error: "Mode de paiement invalide" }, 400);
  }

  const [{ data: settings }, { data: cuissons }, { data: viandes }, { data: extras }, { data: jusList }, {
    data: combos,
  }, { data: quartiers }] = await Promise.all([
    admin.from("settings").select("*").single(),
    admin.from("cuissons").select("*").eq("active", true),
    admin.from("viandes").select("*").eq("active", true),
    admin.from("extras").select("*").eq("active", true),
    admin.from("jus").select("*").eq("active", true),
    admin.from("combos").select("*").eq("active", true),
    admin.from("quartiers").select("*").eq("active", true),
  ]);

  if (!settings) return json({ error: "Réglages indisponibles" }, 500);
  if (!isStoreOpenNow(settings)) {
    return json({ error: "La prise de commandes est fermée pour le moment (9h–19h)." }, 409);
  }
  if (!quartiers?.some((q) => q.name === payload.quartier)) {
    return json({ error: "Quartier de livraison invalide" }, 400);
  }

  const cuissonBySlug = new Map((cuissons ?? []).map((c) => [c.slug, c]));
  const viandeBySlug = new Map((viandes ?? []).map((v) => [v.slug, v]));
  const extraBySlug = new Map((extras ?? []).map((e) => [e.slug, e]));
  const jusBySlug = new Map((jusList ?? []).map((j) => [j.slug, j]));
  const comboBySlug = new Map((combos ?? []).map((c) => [c.slug, c]));

  const orderItems: {
    item_type: string;
    label: string;
    detail: string;
    unit_price_htg: number;
    quantity: number;
    config: Record<string, unknown>;
  }[] = [];

  let subtotal = 0;

  for (const item of payload.items) {
    const quantity = Math.max(1, Math.min(20, Math.floor(item.quantity || 1)));

    if (item.type === "pate") {
      const cuisson = cuissonBySlug.get(item.cuisson_slug);
      const viande = viandeBySlug.get(item.viande_slug);
      if (!cuisson || !viande) return json({ error: "Composition de pâté invalide" }, 400);

      const extraPortions = Math.max(0, Math.min(5, Math.floor(item.extra_viande_portions || 0)));
      const extraSlugs = [...new Set(item.extra_slugs ?? [])];
      const chosenExtras = extraSlugs.map((s) => extraBySlug.get(s)).filter(Boolean) as {
        slug: string;
        label: string;
        price_htg: number;
      }[];
      if (chosenExtras.length !== extraSlugs.length) {
        return json({ error: "Extra invalide" }, 400);
      }

      const unitPrice = cuisson.price_htg + viande.price_htg +
        extraPortions * settings.extra_viande_portion_htg +
        chosenExtras.reduce((s, e) => s + e.price_htg, 0);

      const detailParts = [
        cuisson.label,
        viande.label,
        extraPortions > 0 ? `+${extraPortions} portion(s) de viande` : null,
        chosenExtras.length ? chosenExtras.map((e) => e.label).join(", ") : "Sans extra",
      ].filter(Boolean);

      orderItems.push({
        item_type: "pate",
        label: `Pâté ${viande.label.toLowerCase()}`,
        detail: detailParts.join(" · "),
        unit_price_htg: unitPrice,
        quantity,
        config: {
          cuisson_slug: cuisson.slug,
          viande_slug: viande.slug,
          extra_viande_portions: extraPortions,
          extra_slugs: chosenExtras.map((e) => e.slug),
        },
      });
      subtotal += unitPrice * quantity;
    } else if (item.type === "jus") {
      const jus = jusBySlug.get(item.jus_slug);
      if (!jus) return json({ error: "Jus invalide" }, 400);
      orderItems.push({
        item_type: "jus",
        label: jus.name,
        detail: jus.description,
        unit_price_htg: jus.price_htg,
        quantity,
        config: { jus_slug: jus.slug },
      });
      subtotal += jus.price_htg * quantity;
    } else if (item.type === "combo") {
      const combo = comboBySlug.get(item.combo_slug);
      if (!combo) return json({ error: "Combo invalide" }, 400);
      orderItems.push({
        item_type: "combo",
        label: combo.name,
        detail: combo.description,
        unit_price_htg: combo.price_htg,
        quantity,
        config: { combo_slug: combo.slug },
      });
      subtotal += combo.price_htg * quantity;
    } else {
      return json({ error: "Type d'article invalide" }, 400);
    }
  }

  const deliveryFee = settings.delivery_fee_htg;
  const total = subtotal + deliveryFee;

  const { data: orderNumberData, error: orderNumberError } = await admin.rpc("next_order_number");
  if (orderNumberError || !orderNumberData) {
    return json({ error: "Impossible de générer le numéro de commande" }, 500);
  }

  const { data: order, error: insertError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumberData,
      customer_id: customerId,
      customer_name: payload.customer_name.trim(),
      phone: payload.phone.trim(),
      quartier: payload.quartier,
      address: payload.address.trim(),
      landmark: (payload.landmark ?? "").trim(),
      lat: payload.location_source === "gps" ? payload.lat ?? null : null,
      lng: payload.location_source === "gps" ? payload.lng ?? null : null,
      location_source: payload.location_source,
      payment_method: payload.payment_method,
      status: "received",
      subtotal_htg: subtotal,
      delivery_fee_htg: deliveryFee,
      total_htg: total,
    })
    .select()
    .single();

  if (insertError || !order) {
    return json({ error: "Impossible d'enregistrer la commande", detail: insertError?.message }, 500);
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return json({ error: "Impossible d'enregistrer les articles", detail: itemsError.message }, 500);
  }

  return json({ order });
});
