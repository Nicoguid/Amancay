export type ProductCategory = 'mates' | 'bombillas' | 'perfumes';

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
  | 'entregado';

export type ShippingMethod = 'pickup' | 'moto_caba' | 'correo_argentino';
export type PaymentMethod = 'mercadopago' | 'transferencia' | 'whatsapp';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    dni: string;
    address?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  total: number;
  status: OrderStatus;
}
