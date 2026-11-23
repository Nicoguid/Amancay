'use client';

/**
 * Estado de la tienda en el navegador.
 *
 * - El CATÁLOGO viene del servidor (Supabase) por <CatalogProvider>: precios y stock son los reales.
 * - En este navegador quedan solo cosas de la persona, sin cuenta: carrito, guardados, perfil
 *   y las referencias (código + email) de los pedidos que hizo desde acá.
 * - Los pedidos en sí viven en la base: "Mis pedidos" los pide al servidor con código + email.
 *
 * Es un store externo leído con useSyncExternalStore:
 * - el servidor y el primer render del cliente usan el estado vacío (sin errores de hidratación);
 * - después React vuelve a renderizar con lo guardado en localStorage.
 *
 * El carrito guarda solo ids y cantidades: precio y stock se leen siempre del catálogo vigente.
 */

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Product, ProductVariant, ShippingMethod } from '@/lib/types';
import { availableStock } from '@/lib/productUtils';
import { track } from '@/lib/consent';

// Se re-exportan para no tocar los imports de los componentes que ya los usan.
export {
  availableStock,
  priceRange,
  applyPercentage,
  matchesMassFilter,
  normalizeProduct,
  type MassFilter,
  type CsvProductRow,
} from '@/lib/productUtils';

// ---------- Tipos ----------

interface StoredCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

/**
 * Datos que la persona elige guardar para no volver a escribirlos en el checkout.
 * Datos mínimos: sin DNI (solo lo pide Correo Argentino al confirmar un envío).
 */
export interface CustomerProfile {
  fullName: string;
  phone: string;
  email: string;
  shippingMethod: ShippingMethod;
  address: string;
  city: string;
  postalCode: string;
}

export const EMPTY_PROFILE: CustomerProfile = {
  fullName: '',
  phone: '',
  email: '',
  shippingMethod: 'pickup',
  address: '',
  city: '',
  postalCode: '',
};

/** Lo mínimo para volver a pedirle un pedido al servidor (el servidor exige los dos datos). */
export interface OrderRef {
  code: string;
  email: string;
  createdAt: string;
}

interface StoreState {
  cart: StoredCartItem[];
  /** Ids de productos guardados para después. */
  saved: string[];
  profile: CustomerProfile | null;
  /** Pedidos hechos desde este navegador. */
  myOrders: OrderRef[];
}

export interface CartItem {
  id: string;
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  /** Unidades disponibles para esta línea. */
  available: number;
}

const cartLineId = (productId: string, variantId?: string) => (variantId ? `${productId}-${variantId}` : productId);

// ---------- Catálogo (del servidor) ----------

const CatalogContext = createContext<Product[]>([]);

/** Último catálogo recibido, para las acciones que corren fuera de React (ej. cambiar cantidades). */
let catalogRef: Product[] = [];

export function CatalogProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  useEffect(() => {
    catalogRef = products;
  }, [products]);
  return <CatalogContext.Provider value={products}>{children}</CatalogContext.Provider>;
}

// ---------- Persistencia ----------

const KEYS = {
  // v6: los ids de variante pasaron a ser únicos en la base ("perf-01-v1"); los carritos viejos se descartan.
  cart: 'amancay_cart_v6',
  saved: 'amancay_saved_v1',
  profile: 'amancay_profile_v1',
  myOrders: 'amancay_my_orders_v2',
};

const SERVER_STATE: StoreState = { cart: [], saved: [], profile: null, myOrders: [] };

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

const SHIPPING_METHODS: ShippingMethod[] = ['pickup', 'moto_caba', 'correo_argentino'];

/** Lo guardado puede venir de una versión vieja o estar editado a mano: se recorta y se valida. */
function sanitizeProfile(raw: Partial<CustomerProfile>): CustomerProfile {
  const text = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');
  return {
    fullName: text(raw.fullName, 80),
    phone: text(raw.phone, 30),
    email: text(raw.email, 120),
    shippingMethod: SHIPPING_METHODS.includes(raw.shippingMethod as ShippingMethod) ? (raw.shippingMethod as ShippingMethod) : 'pickup',
    address: text(raw.address, 120),
    city: text(raw.city, 60),
    postalCode: text(raw.postalCode, 10),
  };
}

function sanitizeRefs(value: unknown): OrderRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (r): r is OrderRef =>
        !!r && typeof r === 'object' && typeof r.code === 'string' && typeof r.email === 'string' && typeof r.createdAt === 'string'
    )
    .map((r) => ({ code: r.code.slice(0, 20), email: r.email.slice(0, 120), createdAt: r.createdAt.slice(0, 40) }))
    .slice(0, 50);
}

function loadState(): StoreState {
  const cart = readJson<StoredCartItem[]>(KEYS.cart) ?? [];
  const saved = readJson<unknown>(KEYS.saved);
  const profile = readJson<Partial<CustomerProfile>>(KEYS.profile);
  return {
    saved: Array.isArray(saved) ? saved.filter((v): v is string => typeof v === 'string') : [],
    profile: profile && typeof profile === 'object' ? sanitizeProfile(profile) : null,
    myOrders: sanitizeRefs(readJson<unknown>(KEYS.myOrders)),
    cart: Array.isArray(cart)
      ? cart.filter((item) => item && typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0)
      : [],
  };
}

function persist(next: StoreState, prev: StoreState) {
  try {
    if (next.cart !== prev.cart) window.localStorage.setItem(KEYS.cart, JSON.stringify(next.cart));
    if (next.saved !== prev.saved) window.localStorage.setItem(KEYS.saved, JSON.stringify(next.saved));
    if (next.myOrders !== prev.myOrders) window.localStorage.setItem(KEYS.myOrders, JSON.stringify(next.myOrders));
    if (next.profile !== prev.profile) {
      if (next.profile) window.localStorage.setItem(KEYS.profile, JSON.stringify(next.profile));
      else window.localStorage.removeItem(KEYS.profile);
    }
  } catch {
    // Modo incógnito o cuota llena: la tienda sigue funcionando en memoria.
  }
}

// ---------- Store externo ----------

let clientState: StoreState | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): StoreState {
  if (clientState === null) clientState = loadState();
  return clientState;
}

function getServerSnapshot(): StoreState {
  return SERVER_STATE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key && Object.values(KEYS).includes(event.key)) {
      clientState = loadState();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function setState(updater: (state: StoreState) => StoreState) {
  const prev = getSnapshot();
  const next = updater(prev);
  if (next === prev) return;
  clientState = next;
  persist(next, prev);
  listeners.forEach((l) => l());
}

// ---------- Acciones ----------

function findLine(productId: string, variantId?: string) {
  const product = catalogRef.find((p) => p.id === productId);
  const variant = variantId ? product?.variants?.find((v) => v.id === variantId) : undefined;
  return { product, variant };
}

/** Devuelve cuántas unidades se agregaron (0 si no hay stock). */
function addToCart(product: Product, quantity = 1, variant?: ProductVariant): number {
  let added = 0;
  setState((state) => {
    // Se usa el producto del catálogo vigente si ya llegó; si no, el que pasó el componente (mismo origen).
    const found = findLine(product.id, variant?.id);
    const current = found.product ?? product;
    const currentVariant = found.variant ?? variant;
    if (!current.active) return state;
    const available = availableStock(current, currentVariant);
    const existing = state.cart.find((i) => i.productId === product.id && i.variantId === variant?.id);
    const inCart = existing?.quantity ?? 0;
    added = Math.max(0, Math.min(quantity, available - inCart));
    if (added === 0) return state;
    const cart = existing
      ? state.cart.map((i) => (i === existing ? { ...i, quantity: i.quantity + added } : i))
      : [...state.cart, { productId: product.id, variantId: variant?.id, quantity: added }];
    return { ...state, cart };
  });
  if (added > 0) track('add_to_cart', { item_id: product.sku, item_name: product.name, quantity: added, currency: 'ARS' });
  return added;
}

function removeFromCart(cartItemId: string) {
  setState((state) => ({
    ...state,
    cart: state.cart.filter((i) => cartLineId(i.productId, i.variantId) !== cartItemId),
  }));
}

function updateCartQuantity(cartItemId: string, delta: number) {
  setState((state) => {
    const cart = state.cart
      .map((item) => {
        if (cartLineId(item.productId, item.variantId) !== cartItemId) return item;
        const { product, variant } = findLine(item.productId, item.variantId);
        const max = product ? availableStock(product, variant) : 0;
        return { ...item, quantity: Math.min(max, item.quantity + delta) };
      })
      .filter((item) => item.quantity > 0);
    return { ...state, cart };
  });
}

function clearCart() {
  setState((state) => (state.cart.length ? { ...state, cart: [] } : state));
}

// ---------- Guardados, perfil y pedidos propios (sin cuenta, en este navegador) ----------

const MAX_SAVED = 60;

/** Guarda o quita un producto. Devuelve true si quedó guardado. */
function toggleSaved(productId: string): boolean {
  let nowSaved = false;
  setState((state) => {
    if (state.saved.includes(productId)) return { ...state, saved: state.saved.filter((id) => id !== productId) };
    nowSaved = true;
    return { ...state, saved: [productId, ...state.saved].slice(0, MAX_SAVED) };
  });
  return nowSaved;
}

function clearSaved() {
  setState((state) => (state.saved.length ? { ...state, saved: [] } : state));
}

function saveProfile(profile: CustomerProfile) {
  setState((state) => ({ ...state, profile: sanitizeProfile(profile) }));
}

/** Borra el perfil de este navegador. */
function clearProfile() {
  setState((state) => (state.profile ? { ...state, profile: null } : state));
}

/** Después de confirmar un pedido: se recuerda código + email para mostrarlo en "Mis pedidos". */
function rememberOrder(ref: OrderRef) {
  setState((state) => ({
    ...state,
    myOrders: [ref, ...state.myOrders.filter((r) => r.code !== ref.code)].slice(0, 50),
  }));
}

function forgetOrder(code: string) {
  setState((state) => ({ ...state, myOrders: state.myOrders.filter((r) => r.code !== code) }));
}

const actions = {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  toggleSaved,
  clearSaved,
  saveProfile,
  clearProfile,
  rememberOrder,
  forgetOrder,
};

// ---------- Hooks ----------

const noopSubscribe = () => () => {};

/** false en el servidor y en el primer render; true cuando ya se leyó localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** Solo el catálogo (para componentes que no necesitan carrito ni guardados). */
export function useCatalog(): Product[] {
  return useContext(CatalogContext);
}

export function useStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const products = useContext(CatalogContext);
  const isHydrated = useHydrated();

  const cart = useMemo<CartItem[]>(() => {
    const lines: CartItem[] = [];
    for (const item of state.cart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.active) continue;
      const variant = item.variantId ? product.variants?.find((v) => v.id === item.variantId) : undefined;
      if (item.variantId && !variant) continue;
      const available = availableStock(product, variant);
      lines.push({
        id: cartLineId(product.id, variant?.id),
        product,
        selectedVariant: variant,
        quantity: Math.min(item.quantity, available),
        unitPrice: variant ? variant.price : product.price,
        available,
      });
    }
    return lines.filter((l) => l.quantity > 0);
  }, [state.cart, products]);

  const cartCount = cart.reduce((n, item) => n + item.quantity, 0);
  const cartTotal = cart.reduce((n, item) => n + item.unitPrice * item.quantity, 0);

  /** Productos guardados que siguen publicados, en el orden en que se guardaron. */
  const saved = useMemo<Product[]>(
    () =>
      state.saved
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p && p.active),
    [state.saved, products]
  );

  return {
    products,
    saved,
    savedIds: state.saved,
    profile: state.profile,
    myOrders: state.myOrders,
    cart,
    cartCount,
    cartTotal,
    isHydrated,
    ...actions,
  };
}
