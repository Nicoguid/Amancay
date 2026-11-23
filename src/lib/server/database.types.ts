/**
 * Tipos de la base de Supabase (proyecto "amancay").
 * Generados con el generador de tipos de Supabase el 23/11/2026; se dejaron solo las tablas y funciones.
 * Si cambia el esquema, volvé a generarlos (Supabase > API Docs > Generate types, o `supabase gen types`).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type OrderRow = {
  address: string | null;
  city: string | null;
  created_at: string;
  customer_dni: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  expires_at: string | null;
  id: string;
  is_sample: boolean;
  mp_order_id: string | null;
  mp_payment_id: string | null;
  notes: string | null;
  order_number: string;
  paid_at: string | null;
  payment_method: string;
  payment_status: string;
  postal_code: string | null;
  shipping_cost: number;
  shipping_method: string;
  status: string;
  subtotal: number;
  total: number;
  updated_at: string;
  shipping_service: string | null;
  pickup_reminder_sent_at: string | null;
};

type ProductRow = {
  active: boolean;
  brand: string;
  category: string;
  created_at: string;
  curado_o_guia: string | null;
  description: string;
  id: string;
  images: string[];
  is_best_seller: boolean;
  is_featured: boolean;
  is_new: boolean;
  name: string;
  original_price: number | null;
  price: number;
  short_description: string | null;
  sku: string;
  slug: string;
  specifications: Json;
  stock: number;
  updated_at: string;
  weight_g: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
};

type VariantRow = {
  created_at: string;
  id: string;
  name: string;
  position: number;
  price: number;
  product_id: string;
  sku: string;
  stock: number;
  updated_at: string;
};

type OrderItemRow = {
  category: string;
  id: number;
  order_id: string;
  product_id: string | null;
  product_image: string | null;
  product_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  variant_id: string | null;
  variant_name: string | null;
};

type ConsentRow = {
  created_at: string;
  decision: string;
  doc: string;
  id: number;
  method: string;
  order_id: string | null;
  page: string;
  reference: string | null;
  version: string;
};

type OrderEventRow = {
  created_at: string;
  detail: Json;
  from_value: string | null;
  id: number;
  order_id: string;
  source: string;
  to_value: string | null;
  type: string;
};

type WithdrawalRow = {
  code: string;
  created_at: string;
  email: string;
  email_sent_at: string | null;
  full_name: string;
  id: string;
  order_id: string | null;
  order_number: string;
  resolved_at: string | null;
  status: string;
  updated_at: string;
};

type PaymentEventRow = {
  error: string | null;
  id: number;
  order_id: string | null;
  payload: Json;
  processed_at: string | null;
  provider: string;
  received_at: string;
  request_id: string;
  resource_id: string;
  topic: string;
};

type CategoryRow = {
  id: string;
  label: string;
  blurb: string;
  image: string | null;
  variant_noun: string;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type LoginAttemptRow = {
  failures: number;
  key: string;
  last_attempt: string;
  locked_until: string | null;
  lockouts: number;
};

/** Insert/Update: lo que tiene valor por defecto en la base es opcional. */
type Table<Row, Required extends keyof Row, Rels extends Relationship[] = []> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: Rels;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Fk<Name extends string, Col extends string, To extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: To;
  referencedColumns: ['id'];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' };
  public: {
    Tables: {
      admin_login_attempts: Table<LoginAttemptRow, 'key'>;
      categories: Table<CategoryRow, 'id' | 'label'>;
      consents: Table<ConsentRow, 'decision' | 'doc' | 'method' | 'page' | 'version', [Fk<'consents_order_id_fkey', 'order_id', 'orders'>]>;
      order_events: Table<OrderEventRow, 'order_id' | 'type', [Fk<'order_events_order_id_fkey', 'order_id', 'orders'>]>;
      order_items: Table<
        OrderItemRow,
        'category' | 'order_id' | 'product_name' | 'quantity' | 'total_price' | 'unit_price',
        [
          Fk<'order_items_order_id_fkey', 'order_id', 'orders'>,
          Fk<'order_items_product_id_fkey', 'product_id', 'products'>,
          Fk<'order_items_variant_id_fkey', 'variant_id', 'product_variants'>,
        ]
      >;
      orders: Table<OrderRow, 'customer_email' | 'customer_name' | 'customer_phone' | 'payment_method' | 'shipping_method' | 'subtotal' | 'total'>;
      payment_events: Table<PaymentEventRow, 'payload' | 'request_id' | 'resource_id' | 'topic', [Fk<'payment_events_order_id_fkey', 'order_id', 'orders'>]>;
      product_variants: Table<VariantRow, 'id' | 'name' | 'price' | 'product_id' | 'sku', [Fk<'product_variants_product_id_fkey', 'product_id', 'products'>]>;
      products: Table<ProductRow, 'category' | 'id' | 'name' | 'price' | 'sku' | 'slug', [Fk<'products_category_fkey', 'category', 'categories'>]>;
      withdrawal_requests: Table<WithdrawalRow, 'email' | 'full_name' | 'order_number', [Fk<'withdrawal_requests_order_id_fkey', 'order_id', 'orders'>]>;
    };
    Views: { [_ in never]: never };
    Functions: {
      cancel_order: {
        Args: { p_order_id: string; p_payment_status?: string; p_reason?: string; p_source?: string };
        Returns: OrderRow;
      };
      create_order: {
        Args: {
          p_consents?: Json;
          p_customer: Json;
          p_expires_in?: string;
          p_items: Json;
          p_payment_method: string;
          p_shipping_cost: number;
          p_shipping_method: string;
        };
        Returns: OrderRow;
      };
      expire_pending_orders: { Args: never; Returns: number };
      find_order_public: { Args: { p_code: string; p_email: string }; Returns: Json };
      login_register_failure: {
        Args: { p_key: string; p_max: number; p_window: string; p_base_lock: string; p_max_lock: string };
        Returns: { remaining: number; locked_seconds: number }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type DbOrder = OrderRow;
export type DbOrderItem = OrderItemRow;
export type DbProduct = ProductRow;
export type DbVariant = VariantRow;
export type DbConsent = ConsentRow;
export type DbWithdrawal = WithdrawalRow;
export type DbCategory = CategoryRow;
