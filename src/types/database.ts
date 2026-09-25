export type PaymentMethod = "moncash" | "natcash" | "cash";
export type OrderStatus = "received" | "preparing" | "delivering" | "delivered";
export type PaymentStatus = "not_required" | "pending_proof" | "pending_verification" | "confirmed" | "rejected";

export interface Settings {
  id: true;
  store_open: boolean;
  opening_time: string;
  closing_time: string;
  timezone: string;
  delivery_fee_htg: number;
  extra_viande_portion_htg: number;
  tiktok_url: string | null;
  instagram_url: string | null;
  moncash_name: string;
  moncash_number: string;
  natcash_name: string;
  natcash_number: string;
  updated_at: string;
}

export interface Cuisson {
  id: string;
  slug: string;
  label: string;
  description: string;
  price_htg: number;
  sort_order: number;
  active: boolean;
}

export interface Viande {
  id: string;
  slug: string;
  label: string;
  price_htg: number;
  image_path: string;
  sort_order: number;
  active: boolean;
}

export interface Extra {
  id: string;
  slug: string;
  label: string;
  price_htg: number;
  sort_order: number;
  active: boolean;
}

export interface Jus {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_htg: number;
  image_path: string;
  sort_order: number;
  active: boolean;
}

export interface Combo {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_htg: number;
  original_price_htg: number;
  image_path: string;
  pate_viande_slug: string;
  pate_cuisson_slug: string;
  pate_count: number;
  jus_slug: string;
  jus_count: number;
  jus_choice_allowed: boolean;
  sort_order: number;
  active: boolean;
}

export interface Quartier {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

export interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  quartier: string;
  address: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  location_source: "gps" | "manual";
  house_photo_url: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_number: string | null;
  payment_proof_path: string | null;
  payment_submitted_at: string | null;
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  status: OrderStatus;
  subtotal_htg: number;
  delivery_fee_htg: number;
  discount_htg: number;
  promo_code: string | null;
  total_htg: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  item_type: "pate" | "jus" | "combo";
  label: string;
  detail: string;
  unit_price_htg: number;
  quantity: number;
  config: Record<string, unknown>;
}

// Minimal typed surface for supabase-js generics (hand-written, not generated).
export interface Database {
  public: {
    Tables: {
      settings: { Row: Settings; Insert: Partial<Settings>; Update: Partial<Settings> };
      cuissons: { Row: Cuisson; Insert: Partial<Cuisson>; Update: Partial<Cuisson> };
      viandes: { Row: Viande; Insert: Partial<Viande>; Update: Partial<Viande> };
      extras: { Row: Extra; Insert: Partial<Extra>; Update: Partial<Extra> };
      jus: { Row: Jus; Insert: Partial<Jus>; Update: Partial<Jus> };
      combos: { Row: Combo; Insert: Partial<Combo>; Update: Partial<Combo> };
      quartiers: { Row: Quartier; Insert: Partial<Quartier>; Update: Partial<Quartier> };
      orders: { Row: OrderRow; Insert: Partial<OrderRow>; Update: Partial<OrderRow> };
      order_items: { Row: OrderItemRow; Insert: Partial<OrderItemRow>; Update: Partial<OrderItemRow> };
      admins: {
        Row: { user_id: string; full_name: string; created_at: string };
        Insert: { user_id: string; full_name?: string };
        Update: { full_name?: string };
      };
      promo_codes: {
        Row: {
          code: string;
          discount_htg: number;
          description: string;
          active: boolean;
          free_delivery: boolean;
          created_at: string;
        };
        Insert: Partial<{
          code: string;
          discount_htg: number;
          description: string;
          active: boolean;
          free_delivery: boolean;
        }>;
        Update: Partial<{
          code: string;
          discount_htg: number;
          description: string;
          active: boolean;
          free_delivery: boolean;
        }>;
      };
    };
  };
}
