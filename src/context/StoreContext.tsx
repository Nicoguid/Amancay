'use client';

/**
 * Store de la demo: catálogo, pedidos y carrito en localStorage.
 *
 * Es un store externo leído con useSyncExternalStore:
 * - el servidor y el primer render del cliente usan los datos iniciales (sin errores de hidratación);
 * - después React vuelve a renderizar con lo guardado en localStorage;
 * - las acciones son funciones de módulo, estables, que devuelven su resultado al instante.
 *
 * El carrito guarda solo ids y cantidades: precio y stock se leen siempre del catálogo vigente.
 *
 * Sin cuenta de usuario: los guardados, el perfil y "mis pedidos" también viven en este navegador.
 */

import { useMemo, useSyncExternalStore } from 'react';
import type { Order, OrderStatus, Product, ProductCategory, ProductVariant, ShippingMethod } from '@/lib/types';
import { INITIAL_ORDERS, INITIAL_PRODUCTS } from '@/lib/mockData';
import { slugify } from '@/lib/storeConfig';
import { track } from '@/lib/consent';

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

interface StoreState {
  products: Product[];
  orders: Order[];
  cart: StoredCartItem[];
  /** Ids de productos guardados para después. */
  saved: string[];
  profile: CustomerProfile | null;
  /** Ids de los pedidos hechos desde este navegador (los del panel de ejemplo no cuentan). */
  myOrders: string[];
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

export type MassFilter = 'all' | 'category' | 'brand';

// ---------- Helpers puros ----------

const roundTo50 = (value: number) => Math.round(value / 50) * 50;

/** Las variantes valen precio base + modificador; el stock del producto es la suma de sus variantes. */
export function normalizeProduct(product: Product): Product {
  if (!product.variants || product.variants.length === 0) return product;
  const variants = product.variants.map((v) => ({
    ...v,
    price: Math.max(0, product.price + (v.priceModifier ?? 0)),
    stock: Math.max(0, Math.floor(v.stock)),
  }));
  return { ...product, variants, stock: variants.reduce((sum, v) => sum + v.stock, 0) };
}

export function availableStock(product: Product, variant?: ProductVariant): number {
  return variant ? variant.stock : product.stock;
}

/** Precio mínimo (para mostrar "Desde $X" cuando las variantes tienen precios distintos). */
export function priceRange(product: Product): { min: number; max: number } {
  const prices = product.variants?.length ? product.variants.map((v) => v.price) : [product.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function matchesMassFilter(product: Product, filterType: MassFilter, filterValue: string) {
  if (filterType === 'all') return true;
  if (filterType === 'category') return product.category === filterValue;
  return product.brand.toLowerCase() === filterValue.toLowerCase();
}

/** Mismo cálculo para la vista previa y para el aumento real. */
export function applyPercentage(product: Product, percentage: number): Product {
  const factor = 1 + percentage / 100;
  return normalizeProduct({
    ...product,
    price: roundTo50(product.price * factor),
    originalPrice: product.originalPrice ? roundTo50(product.originalPrice * factor) : undefined,
    variants: product.variants?.map((v) => ({ ...v, priceModifier: roundTo50((v.priceModifier ?? 0) * factor) })),
  });
}

const cartLineId = (productId: string, variantId?: string) => (variantId ? `${productId}-${variantId}` : productId);

// ---------- Persistencia ----------

const STORAGE_VERSION = 'v5';
const KEYS = {
  products: `amancay_products_${STORAGE_VERSION}`,
  orders: `amancay_orders_${STORAGE_VERSION}`,
  cart: `amancay_cart_${STORAGE_VERSION}`,
  saved: 'amancay_saved_v1',
  profile: 'amancay_profile_v1',
  myOrders: 'amancay_my_orders_v1',
};
const LEGACY_KEYS = { products: 'amancay_products_v3__unused', orders: 'amancay_orders_v3__unused' };

const SERVER_STATE: StoreState = {
  products: INITIAL_PRODUCTS.map(normalizeProduct),
  orders: INITIAL_ORDERS,
  cart: [],
  saved: [],
  profile: null,
  myOrders: [],
};

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function migrateOrder(order: Order): Order {
  // v2 usaba "whatsapp" para "pagar en el local".
  const paymentMethod = (order.paymentMethod as string) === 'whatsapp' ? 'mostrador' : order.paymentMethod;
  return { ...order, paymentMethod, orderNumber: order.orderNumber.replace(/^#/, '') };
}

function loadState(): StoreState {
  const products =
    readJson<Product[]>(KEYS.products) ?? readJson<Product[]>(LEGACY_KEYS.products) ?? SERVER_STATE.products;
  const orders = readJson<Order[]>(KEYS.orders) ?? readJson<Order[]>(LEGACY_KEYS.orders) ?? SERVER_STATE.orders;
  const cart = readJson<StoredCartItem[]>(KEYS.cart) ?? [];
  const saved = readJson<unknown>(KEYS.saved);
  const profile = readJson<Partial<CustomerProfile>>(KEYS.profile);
  const myOrders = readJson<unknown>(KEYS.myOrders);
  const stringList = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);
  return {
    saved: stringList(saved),
    profile: profile && typeof profile === 'object' ? sanitizeProfile(profile) : null,
    myOrders: stringList(myOrders),
    products: products.map(normalizeProduct),
    orders: orders.map(migrateOrder),
    cart: cart.filter((item) => item && typeof item.productId === 'string' && item.quantity > 0),
  };
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

function persist(next: StoreState, prev: StoreState) {
  try {
    if (next.products !== prev.products) window.localStorage.setItem(KEYS.products, JSON.stringify(next.products));
    if (next.orders !== prev.orders) window.localStorage.setItem(KEYS.orders, JSON.stringify(next.orders));
    if (next.cart !== prev.cart) window.localStorage.setItem(KEYS.cart, JSON.stringify(next.cart));
    if (next.saved !== prev.saved) window.localStorage.setItem(KEYS.saved, JSON.stringify(next.saved));
    if (next.myOrders !== prev.myOrders) window.localStorage.setItem(KEYS.myOrders, JSON.stringify(next.myOrders));
    if (next.profile !== prev.profile) {
      if (next.profile) window.localStorage.setItem(KEYS.profile, JSON.stringify(next.profile));
      else window.localStorage.removeItem(KEYS.profile);
    }
  } catch {
    // Modo incógnito o cuota llena: la demo sigue funcionando en memoria.
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

function findLine(state: StoreState, productId: string, variantId?: string) {
  const product = state.products.find((p) => p.id === productId);
  const variant = variantId ? product?.variants?.find((v) => v.id === variantId) : undefined;
  return { product, variant };
}

/** Devuelve cuántas unidades se agregaron (0 si no hay stock). */
function addToCart(product: Product, quantity = 1, variant?: ProductVariant): number {
  let added = 0;
  setState((state) => {
    const { product: current, variant: currentVariant } = findLine(state, product.id, variant?.id);
    if (!current || !current.active) return state;
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
        const { product, variant } = findLine(state, item.productId, item.variantId);
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

// ---------- Guardados y perfil (sin cuenta, en este navegador) ----------

const MAX_SAVED = 60;
const MAX_ORDERS = 300;

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

function updateProduct(id: string, updated: Partial<Product>) {
  setState((state) => ({
    ...state,
    products: state.products.map((p) => (p.id === id ? normalizeProduct({ ...p, ...updated }) : p)),
  }));
}

function addProduct(newProduct: Omit<Product, 'id'>): Product {
  const product = normalizeProduct({ ...newProduct, id: `prod-${Date.now()}` });
  setState((state) => ({ ...state, products: [product, ...state.products] }));
  return product;
}

function toggleProductActive(id: string) {
  setState((state) => ({
    ...state,
    products: state.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
  }));
}

/** Aplica el aumento y devuelve los productos previos para poder deshacer. */
function applyMassPercentageIncrease(filterType: MassFilter, filterValue: string, percentage: number) {
  const previous = getSnapshot().products;
  let affectedCount = 0;
  setState((state) => ({
    ...state,
    products: state.products.map((p) => {
      if (!matchesMassFilter(p, filterType, filterValue)) return p;
      affectedCount++;
      return applyPercentage(p, percentage);
    }),
  }));
  return { affectedCount, previous };
}

function restoreProducts(products: Product[]) {
  setState((state) => ({ ...state, products }));
}

export interface CsvProductRow {
  sku?: string;
  id?: string;
  name?: string;
  brand?: string;
  category?: ProductCategory;
  price?: number;
  stock?: number;
}

/** Actualiza por SKU (o ID). Solo pisa los campos que vienen con valor. */
function importProductsFromCsvData(rows: CsvProductRow[]) {
  let updated = 0;
  let created = 0;
  setState((state) => {
    const products = [...state.products];
    for (const row of rows) {
      const index = products.findIndex((p) => (row.sku && p.sku === row.sku) || (row.id && p.id === row.id));
      if (index >= 0) {
        const current = products[index];
        const patch: Partial<Product> = {};
        if (row.name) patch.name = row.name;
        if (row.brand) patch.brand = row.brand;
        if (row.category) patch.category = row.category;
        if (row.price !== undefined) patch.price = row.price;
        // Con variantes, el stock se maneja por variante y no se pisa desde la planilla.
        if (row.stock !== undefined && !current.variants?.length) patch.stock = row.stock;
        products[index] = normalizeProduct({ ...current, ...patch });
        updated++;
      } else if (row.name && row.price !== undefined && row.category) {
        products.unshift({
          id: `prod-${Date.now()}-${created}`,
          name: row.name,
          slug: slugify(row.name),
          category: row.category,
          brand: row.brand || 'Amancay',
          description: '',
          price: row.price,
          stock: row.stock ?? 0,
          images: [],
          sku: row.sku || `SKU-${Date.now()}-${created}`,
          active: true,
        });
        created++;
      }
    }
    return { ...state, products };
  });
  return { updated, created };
}

export type CreateOrderResult = { ok: true; order: Order } | { ok: false; error: string };

/** Crea el pedido con los precios vigentes, valida y descuenta stock, y vacía el carrito. */
function createOrder(input: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): CreateOrderResult {
  const state = getSnapshot();
  for (const item of input.items) {
    const product = state.products.find((p) => p.id === item.productId);
    const variant = product?.variants?.find((v) => v.id === item.variantId);
    if (!product || availableStock(product, variant) < item.quantity) {
      return { ok: false, error: `No hay stock suficiente de ${item.productName}. Revisá el carrito.` };
    }
  }

  const order: Order = {
    ...input,
    id: `ord-${Date.now()}`,
    orderNumber: `AMC-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toISOString(),
  };

  setState((s) => ({
    ...s,
    myOrders: [order.id, ...s.myOrders].slice(0, 50),
    products: s.products.map((product) => {
      const lines = input.items.filter((i) => i.productId === product.id);
      if (!lines.length) return product;
      if (product.variants?.length) {
        return normalizeProduct({
          ...product,
          variants: product.variants.map((v) => {
            const sold = lines.filter((l) => l.variantId === v.id).reduce((n, l) => n + l.quantity, 0);
            return sold ? { ...v, stock: v.stock - sold } : v;
          }),
        });
      }
      return { ...product, stock: product.stock - lines.reduce((n, l) => n + l.quantity, 0) };
    }),
    // Tope de pedidos guardados: el localStorage tiene ~5 MB y llenarlo rompe el carrito (QuotaExceededError).
    orders: [order, ...s.orders].slice(0, MAX_ORDERS),
    cart: [],
  }));
  return { ok: true, order };
}

function updateOrderStatus(orderId: string, status: OrderStatus) {
  setState((state) => ({
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
  }));
}

const actions = {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  updateProduct,
  addProduct,
  toggleProductActive,
  applyMassPercentageIncrease,
  restoreProducts,
  importProductsFromCsvData,
  createOrder,
  updateOrderStatus,
  toggleSaved,
  clearSaved,
  saveProfile,
  clearProfile,
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

export function useStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isHydrated = useHydrated();

  const cart = useMemo<CartItem[]>(() => {
    const lines: CartItem[] = [];
    for (const item of state.cart) {
      const product = state.products.find((p) => p.id === item.productId);
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
  }, [state.cart, state.products]);

  const cartCount = cart.reduce((n, item) => n + item.quantity, 0);
  const cartTotal = cart.reduce((n, item) => n + item.unitPrice * item.quantity, 0);

  /** Productos guardados que siguen publicados, en el orden en que se guardaron. */
  const saved = useMemo<Product[]>(
    () =>
      state.saved
        .map((id) => state.products.find((p) => p.id === id))
        .filter((p): p is Product => !!p && p.active),
    [state.saved, state.products]
  );

  /** Pedidos hechos desde este navegador, del más nuevo al más viejo. */
  const myOrders = useMemo<Order[]>(
    () =>
      state.myOrders
        .map((id) => state.orders.find((o) => o.id === id))
        .filter((o): o is Order => !!o && !o.isSample),
    [state.myOrders, state.orders]
  );

  return {
    products: state.products,
    orders: state.orders,
    saved,
    savedIds: state.saved,
    profile: state.profile,
    myOrders,
    cart,
    cartCount,
    cartTotal,
    isHydrated,
    ...actions,
  };
}
