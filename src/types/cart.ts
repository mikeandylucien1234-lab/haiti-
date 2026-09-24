export interface CartPateItem {
  id: string;
  type: "pate";
  cuisson_slug: string;
  cuisson_label: string;
  viande_slug: string;
  viande_label: string;
  extra_viande_portions: number;
  extra_slugs: string[];
  extra_labels: string[];
  quantity: number;
  unit_price_htg: number;
}

export interface CartJusItem {
  id: string;
  type: "jus";
  jus_slug: string;
  name: string;
  description: string;
  quantity: number;
  unit_price_htg: number;
}

export interface CartComboItem {
  id: string;
  type: "combo";
  combo_slug: string;
  name: string;
  description: string;
  jus_slug: string;
  jus_label: string;
  quantity: number;
  unit_price_htg: number;
}

export type CartItem = CartPateItem | CartJusItem | CartComboItem;
