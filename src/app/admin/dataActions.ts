'use server';

import { randomBytes } from 'node:crypto';
import { updateTag } from 'next/cache';
import type { OrderStatus, Product, ProductCategory } from '@/lib/types';
import { MAX_PRICE } from '@/lib/csv';
import { applyPercentage, matchesMassFilter, type CsvProductRow, type MassFilter } from '@/lib/productUtils';
import { safeImageUrl, slugify } from '@/lib/storeConfig';
import { fail, guard, ok, type ActionResult } from '@/lib/server/adminGuard';
import { CATALOG_TAG, toProduct } from '@/lib/server/catalog';
import { db } from '@/lib/server/supabase';
import { mpConfigured, refundMpOrder } from '@/lib/server/mercadopago';
import { applyMpState, orderEvent } from '@/lib/server/orders';

/*
 * Acciones del panel del local. Cada una:
 * 1. vuelve a verificar la sesión (una Server Action se puede llamar sin pasar por la página);
 * 2. valida los datos como si vinieran de cualquier lado;
 * 3. escribe en la base y refresca el catálogo en caché.
 */

const validPrice = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= MAX_PRICE;
const validStock = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 100_000;
async function categoryExists(id: string): Promise<boolean> {
  const { data } = await db().from('categories').select('id').eq('id', String(id ?? '')).maybeSingle();
  return !!data;
}

/** Catálogo leído directo de la base (sin caché): las acciones calculan sobre datos frescos. */
async function freshCatalog(): Promise<Product[]> {
  const { data, error } = await db().from('products').select('*, product_variants(*)');
  if (error) throw error;
  return data.map(toProduct);
}

// ---------- Productos ----------

export async function saveProductAction(
  id: string,
  patch: { price: number; stock?: number; variantStocks?: Record<string, number> }
): Promise<ActionResult> {
  return guard(async () => {
    if (!validPrice(patch.price)) return fail('Precio no válido.');
    const { data: product } = await db().from('products').select('id, price').eq('id', id).maybeSingle();
    if (!product) return fail('El producto ya no existe.');

    const { data: variants } = await db().from('product_variants').select('id, price').eq('product_id', id);
    if (variants?.length) {
      // Con variantes: el precio base se mueve y cada variante conserva su diferencia con la base.
      const delta = patch.price - Number(product.price);
      for (const v of variants) {
        const stock = patch.variantStocks?.[v.id];
        if (stock !== undefined && !validStock(stock)) return fail('Stock no válido.');
        const { error } = await db()
          .from('product_variants')
          .update({ price: Math.max(1, Number(v.price) + delta), ...(stock !== undefined ? { stock } : {}) })
          .eq('id', v.id);
        if (error) throw error;
      }
      const { error } = await db().from('products').update({ price: patch.price }).eq('id', id);
      if (error) throw error;
    } else {
      if (patch.stock !== undefined && !validStock(patch.stock)) return fail('Stock no válido.');
      const { error } = await db()
        .from('products')
        .update({ price: patch.price, ...(patch.stock !== undefined ? { stock: patch.stock } : {}) })
        .eq('id', id);
      if (error) throw error;
    }
    updateTag(CATALOG_TAG);
    return ok(undefined);
  });
}

export async function toggleProductActiveAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    const { data: product } = await db().from('products').select('active').eq('id', id).maybeSingle();
    if (!product) return fail('El producto ya no existe.');
    const { error } = await db().from('products').update({ active: !product.active }).eq('id', id);
    if (error) throw error;
    updateTag(CATALOG_TAG);
    return ok(undefined);
  });
}

export type NewProductInput = {
  name: string;
  category: ProductCategory;
  brand: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  imageUrl: string;
};

export async function createProductAction(input: NewProductInput): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const name = String(input.name ?? '').trim().slice(0, 200);
    if (name.length < 3) return fail('Escribí el nombre del producto.');
    if (!(await categoryExists(input.category))) return fail('Rubro no válido.');
    if (!validPrice(input.price)) return fail('Precio no válido.');
    if (!validStock(input.stock)) return fail('Stock no válido.');
    const image = input.imageUrl ? safeImageUrl(String(input.imageUrl)) : null;
    if (input.imageUrl && !image) return fail('La foto tiene que ser un link que empiece con https://.');

    const id = `prod-${randomBytes(4).toString('hex')}`;
    // Slug único: si ya existe, se le suma un sufijo corto.
    let slug = slugify(name) || id;
    const { data: taken } = await db().from('products').select('id').eq('slug', slug).maybeSingle();
    if (taken) slug = `${slug}-${id.slice(-4)}`;

    const { error } = await db()
      .from('products')
      .insert({
        id,
        slug,
        name,
        category: input.category,
        brand: String(input.brand ?? '').trim().slice(0, 80) || 'Amancay',
        description: String(input.description ?? '').trim().slice(0, 2000),
        price: input.price,
        stock: input.stock,
        sku: String(input.sku ?? '').trim().slice(0, 40) || `SKU-${id.slice(-6).toUpperCase()}`,
        images: image ? [image] : [],
        active: true,
        is_new: true,
      });
    if (error) return fail(error.code === '23505' ? 'Ya hay un producto con ese SKU.' : 'No se pudo crear el producto.');
    updateTag(CATALOG_TAG);
    return ok({ id });
  });
}

export type PriceSnapshot = { id: string; price: number; originalPrice?: number; variants?: { id: string; price: number }[] };

const snapshot = (p: Product): PriceSnapshot => ({
  id: p.id,
  price: p.price,
  originalPrice: p.originalPrice,
  variants: p.variants?.map((v) => ({ id: v.id, price: v.price })),
});

async function writePrices(list: Product[] | PriceSnapshot[]) {
  for (const p of list) {
    const { error } = await db().from('products').update({ price: p.price, original_price: p.originalPrice ?? null }).eq('id', p.id);
    if (error) throw error;
    for (const v of p.variants ?? []) {
      const { error: vError } = await db().from('product_variants').update({ price: v.price }).eq('id', v.id).eq('product_id', p.id);
      if (vError) throw vError;
    }
  }
}

/** Aumento por rubro o marca. Devuelve los precios anteriores para poder deshacer. */
export async function massIncreaseAction(
  filterType: MassFilter,
  filterValue: string,
  percentage: number
): Promise<ActionResult<{ affectedCount: number; previous: PriceSnapshot[] }>> {
  return guard(async () => {
    if (!['all', 'category', 'brand'].includes(filterType)) return fail('Filtro no válido.');
    if (!(typeof percentage === 'number' && percentage !== 0 && percentage > -90 && percentage < 500)) return fail('Porcentaje no válido.');
    const catalog = await freshCatalog();
    const affected = catalog.filter((p) => matchesMassFilter(p, filterType, String(filterValue ?? '')));
    await writePrices(affected.map((p) => applyPercentage(p, percentage)));
    updateTag(CATALOG_TAG);
    return ok({ affectedCount: affected.length, previous: affected.map(snapshot) });
  });
}

export async function restorePricesAction(previous: PriceSnapshot[]): Promise<ActionResult> {
  return guard(async () => {
    if (!Array.isArray(previous) || previous.length > 2000) return fail('Datos no válidos.');
    const clean = previous.filter(
      (p) =>
        p && typeof p.id === 'string' && validPrice(p.price) && (p.originalPrice === undefined || validPrice(p.originalPrice)) &&
        (p.variants ?? []).every((v) => typeof v.id === 'string' && validPrice(v.price))
    );
    await writePrices(clean);
    updateTag(CATALOG_TAG);
    return ok(undefined);
  });
}

/** Planilla: actualiza por SKU (o ID) y crea los que no existen. Solo pisa los campos que vienen. */
export async function importCsvAction(rows: CsvProductRow[]): Promise<ActionResult<{ updated: number; created: number }>> {
  return guard(async () => {
    if (!Array.isArray(rows) || rows.length > 5000) return fail('La planilla es demasiado grande.');
    const catalog = await freshCatalog();
    let updated = 0;
    let created = 0;
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      if (row.price !== undefined && !validPrice(row.price)) continue;
      if (row.stock !== undefined && !validStock(row.stock)) continue;
      if (row.category !== undefined && !(await categoryExists(row.category))) continue;
      const current = catalog.find((p) => (row.sku && p.sku === row.sku) || (row.id && p.id === row.id));
      if (current) {
        const patch: { name?: string; brand?: string; category?: string; price?: number; stock?: number } = {};
        if (row.name) patch.name = String(row.name).slice(0, 200);
        if (row.brand) patch.brand = String(row.brand).slice(0, 80);
        if (row.category) patch.category = row.category;
        if (row.price !== undefined) patch.price = row.price;
        // Con variantes, el stock se maneja por variante y no se pisa desde la planilla.
        if (row.stock !== undefined && !current.variants?.length) patch.stock = row.stock;
        if (Object.keys(patch).length) {
          const { error } = await db().from('products').update(patch).eq('id', current.id);
          if (error) throw error;
          if (patch.price !== undefined && current.variants?.length) {
            const delta = patch.price - current.price;
            for (const v of current.variants) {
              await db().from('product_variants').update({ price: Math.max(1, v.price + delta) }).eq('id', v.id);
            }
          }
          updated++;
        }
      } else if (row.name && row.price !== undefined && row.category) {
        const result = await createProductAction({
          name: row.name,
          category: row.category,
          brand: row.brand ?? '',
          description: '',
          price: row.price,
          stock: row.stock ?? 0,
          sku: row.sku ?? '',
          imageUrl: '',
        });
        if (result.ok) created++;
      }
    }
    updateTag(CATALOG_TAG);
    return ok({ updated, created });
  });
}

// ---------- Pedidos ----------

const STATUSES: OrderStatus[] = ['pendiente', 'pagado', 'en_preparacion', 'listo_para_retirar', 'despachado', 'entregado', 'cancelado'];

export async function setOrderStatusAction(orderId: string, status: OrderStatus): Promise<ActionResult> {
  return guard(async () => {
    if (!STATUSES.includes(status)) return fail('Estado no válido.');
    const { data: order } = await db().from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return fail('El pedido no existe.');
    if (order.status === status) return ok(undefined);
    if (order.status === 'cancelado') return fail('El pedido está cancelado: el stock ya volvió al catálogo.');

    if (status === 'cancelado') {
      const { error } = await db().rpc('cancel_order', { p_order_id: orderId, p_source: 'panel', p_reason: 'cancelado desde el panel' });
      if (error) return fail(error.message === 'pedido_ya_enviado' ? 'Un pedido despachado o entregado no se puede cancelar.' : 'No se pudo cancelar.');
      updateTag(CATALOG_TAG);
      return ok(undefined);
    }

    // Si el local avanza el pedido, ya no vence. "Pagado" a mano = cobro confirmado (transferencia o mostrador).
    const confirmsPayment = status !== 'pendiente' && (order.payment_status === 'pendiente' || order.payment_status === 'rechazado');
    if (confirmsPayment && order.payment_method === 'mercadopago') {
      return fail('Este pedido es de Mercado Pago: se marca como pagado solo cuando Mercado Pago confirma el cobro.');
    }
    const { error } = await db()
      .from('orders')
      .update({
        status,
        ...(status !== 'pendiente' ? { expires_at: null } : {}),
        ...(confirmsPayment ? { payment_status: 'aprobado', paid_at: new Date().toISOString() } : {}),
      })
      .eq('id', orderId);
    if (error) throw error;
    await orderEvent(orderId, 'estado', 'panel', order.status, status, confirmsPayment ? { pago: 'confirmado a mano' } : {});
    return ok(undefined);
  });
}

/** Reembolso total. Con Mercado Pago se devuelve por la API; con transferencia se registra (la devolución la hace el local). */
export async function refundOrderAction(orderId: string): Promise<ActionResult<{ note: string }>> {
  return guard(async () => {
    const { data: order } = await db().from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return fail('El pedido no existe.');
    if (order.payment_status !== 'aprobado') return fail('Solo se reembolsa un pedido con el pago aprobado.');

    if (order.payment_method === 'mercadopago' && order.mp_order_id) {
      if (!mpConfigured()) return fail('Mercado Pago no está configurado.');
      const state = await refundMpOrder(order.mp_order_id);
      await applyMpState(state);
      return ok({ note: 'Reembolso enviado a Mercado Pago. Se acredita según el medio de pago del cliente.' });
    }

    const { error } = await db().from('orders').update({ payment_status: 'reembolsado' }).eq('id', orderId);
    if (error) throw error;
    await orderEvent(orderId, 'reembolso', 'panel', 'aprobado', 'reembolsado', { manual: true });
    return ok({ note: 'Quedó registrado como reembolsado. Acordate de hacer la transferencia de vuelta.' });
  });
}

// ---------- Arrepentimientos ----------

export type Withdrawal = {
  id: string;
  code: string;
  orderNumber: string;
  orderId: string | null;
  fullName: string;
  email: string;
  status: 'recibido' | 'en_proceso' | 'reembolsado' | 'rechazado';
  emailSentAt: string | null;
  createdAt: string;
};

const WITHDRAWAL_STATUSES: Withdrawal['status'][] = ['recibido', 'en_proceso', 'reembolsado', 'rechazado'];

export async function setWithdrawalStatusAction(id: string, status: Withdrawal['status']): Promise<ActionResult> {
  return guard(async () => {
    if (!WITHDRAWAL_STATUSES.includes(status)) return fail('Estado no válido.');
    const { error } = await db()
      .from('withdrawal_requests')
      .update({ status, resolved_at: status === 'reembolsado' || status === 'rechazado' ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) throw error;
    return ok(undefined);
  });
}
