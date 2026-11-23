export type ProductCategory = 'mates' | 'bombillas' | 'perfumes' | 'desodorantes' | 'combos';

export interface ProductVariant {
  id: string;
  name: string; // ej: "Virola Cincelada", "Algarrobo Negro", "50 ml", "100 ml", "Pico de Loro"
  priceModifier: number;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  brand: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  variants?: ProductVariant[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  sku: string;
  active: boolean;
  specifications?: Record<string, string>;
  curadoOGuia?: string;
}

export type OrderStatus = 
  | 'pendiente'
  | 'pagado'
  | 'en_preparacion'
  | 'listo_para_retirar'
  | 'despachado'
  | 'entregado'
  | 'cancelado';

/** Estado del cobro, separado del estado del pedido (un pedido pagado puede reembolsarse). */
export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado' | 'reembolso_parcial' | 'cancelado' | 'vencido';

export type ShippingMethod = 'pickup' | 'moto_caba' | 'correo_argentino';
export type PaymentMethod = 'mercadopago' | 'transferencia' | 'mostrador';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Rubro al momento de la compra (para las métricas del panel). */
  category?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    /** Solo para envíos por Correo Argentino. */
    dni?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Hasta cuándo se reserva el stock si no se paga. */
  expiresAt?: string;
  /** Id de la Order de Mercado Pago (solo panel). */
  mpOrderId?: string;
  /** Pedido inventado para la demo del panel. */
  isSample?: boolean;
  /** Qué documentos aceptó, qué versión, cuándo y cómo. */
  consent?: import('./consent').ConsentRecord[];
}
