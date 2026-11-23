'use server';

import { randomBytes } from 'node:crypto';
import { updateTag } from 'next/cache';
import sharp from 'sharp';
import { MAX_PRICE } from '@/lib/csv';
import { safeImageUrl, slugify } from '@/lib/storeConfig';
import { CATALOG_TAG } from '@/lib/server/catalog';
import { db } from '@/lib/server/supabase';
import { fail, guard, ok, type ActionResult } from '@/lib/server/adminGuard';

/*
 * Catálogo desde el panel: fotos, productos completos y rubros.
 * Pensado para que la dueña no tenga que saber nada técnico: el panel le pide lo mínimo
 * y acá se completa el resto (ids, slugs, SKU, formato de las fotos).
 */

const BUCKET = 'productos';
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

const validPrice = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= MAX_PRICE;
const validStock = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 100_000;
const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const shortId = () => randomBytes(3).toString('hex');

// ---------- Fotos ----------

/**
 * Sube una foto. Se vuelve a codificar SIEMPRE con sharp: queda en WebP de hasta 1200 px,
 * pesa poco y pierde los metadatos (EXIF), que en una foto de celular incluyen la ubicación GPS.
 * Si el archivo no es una imagen de verdad, sharp falla y no se sube nada.
 */
export async function uploadImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  return guard(async () => {
    const file = formData.get('file');
    if (!(file instanceof File)) return fail('No llegó ninguna foto.');
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return fail('La foto tiene que pesar menos de 6 MB.');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type)) {
      return fail('Subí una foto en JPG, PNG o WebP.');
    }

    let webp: Buffer;
    try {
      webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
        .rotate() // respeta la orientación del celular antes de borrar los metadatos
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return fail('No pudimos leer esa foto. Probá con otra o sacala de nuevo.');
    }

    const path = `${new Date().getFullYear()}/${randomBytes(8).toString('hex')}.webp`;
    const { error } = await db().storage.from(BUCKET).upload(path, webp, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (error) throw error;
    return ok({ url: db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  });
}

/** Borra del bucket las fotos que ya no usa ningún producto ni rubro (solo las nuestras). */
async function removeUnusedImages(urls: string[]) {
  const prefix = db().storage.from(BUCKET).getPublicUrl('').data.publicUrl;
  const ours = urls.filter((u) => u.startsWith(prefix));
  if (!ours.length) return;
  const [{ data: products }, { data: categories }] = await Promise.all([
    db().from('products').select('images'),
    db().from('categories').select('image'),
  ]);
  const inUse = new Set([...(products ?? []).flatMap((p) => p.images), ...(categories ?? []).map((c) => c.image ?? '')]);
  const paths = ours.filter((u) => !inUse.has(u)).map((u) => u.slice(prefix.length));
  if (paths.length) await db().storage.from(BUCKET).remove(paths);
}

/** Fotos subidas en una ficha que se canceló (o que se quitaron antes de guardar). Solo borra las que nadie usa. */
export async function discardImagesAction(urls: string[]): Promise<ActionResult> {
  return guard(async () => {
    if (!Array.isArray(urls) || urls.length > 20) return ok(undefined);
    await removeUnusedImages(urls.filter((u) => typeof u === 'string'));
    return ok(undefined);
  });
}

// ---------- Productos ----------

export type ProductInput = {
  name: string;
  category: string;
  brand: string;
  shortDescription: string;
  description: string;
  price: number;
  /** Precio "antes" tachado (opcional). */
  originalPrice?: number;
  stock: number;
  images: string[];
  active: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  /** Tamaños u opciones. Vacío = producto simple (vale `price` y `stock`). */
  variants: { id?: string; name: string; price: number; stock: number }[];
};

function validateProduct(input: ProductInput): string | null {
  if (text(input.name, 200).length < 3) return 'Escribí el nombre del producto.';
  if (!validPrice(input.price)) return 'El precio tiene que ser mayor a 0.';
  if (input.originalPrice !== undefined && !(validPrice(input.originalPrice) && input.originalPrice >= input.price)) {
    return 'El precio "antes" tiene que ser mayor que el precio actual.';
  }
  if (!input.variants?.length && !validStock(input.stock)) return 'El stock tiene que ser un número entero, 0 o más.';
  if (!Array.isArray(input.images) || input.images.length > 6) return 'Hasta 6 fotos por producto.';
  if (input.images.some((u) => !safeImageUrl(String(u)))) return 'Hay una foto con un link que no es válido.';
  if ((input.variants ?? []).length > 20) return 'Hasta 20 opciones por producto.';
  for (const v of input.variants ?? []) {
    if (text(v.name, 120).length < 1) return 'Cada opción necesita un nombre (por ejemplo "100 ml").';
    if (!validPrice(v.price)) return `El precio de "${v.name}" tiene que ser mayor a 0.`;
    if (!validStock(v.stock)) return `El stock de "${v.name}" tiene que ser un número entero, 0 o más.`;
  }
  const names = (input.variants ?? []).map((v) => text(v.name, 120).toLowerCase());
  if (new Set(names).size !== names.length) return 'Hay dos opciones con el mismo nombre.';
  return null;
}

/** Crea (sin id) o actualiza un producto completo, con sus variantes. */
export async function saveProductFullAction(id: string | null, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const problem = validateProduct(input);
    if (problem) return fail(problem);
    const { data: category } = await db().from('categories').select('id').eq('id', text(input.category, 40)).maybeSingle();
    if (!category) return fail('Elegí un rubro.');

    const variants = input.variants ?? [];
    // Con variantes, el precio "base" del producto es el más barato (para "Desde $X").
    const basePrice = variants.length ? Math.min(...variants.map((v) => v.price)) : input.price;
    const row = {
      name: text(input.name, 200),
      category: category.id,
      brand: text(input.brand, 80) || 'Amancay',
      short_description: text(input.shortDescription, 200) || null,
      description: text(input.description, 4000),
      price: basePrice,
      original_price: input.originalPrice ?? null,
      stock: variants.length ? 0 : input.stock,
      images: input.images.map((u) => safeImageUrl(String(u))!).filter(Boolean),
      active: !!input.active,
      is_featured: !!input.isFeatured,
      is_best_seller: !!input.isBestSeller,
      is_new: !!input.isNew,
    };

    let productId = id;
    let previousImages: string[] = [];
    if (productId) {
      const { data: current } = await db().from('products').select('id, images').eq('id', productId).maybeSingle();
      if (!current) return fail('El producto ya no existe.');
      previousImages = current.images;
      const { error } = await db().from('products').update(row).eq('id', productId);
      if (error) throw error;
    } else {
      productId = `prod-${shortId()}${shortId()}`;
      let slug = slugify(row.name) || productId;
      const { data: taken } = await db().from('products').select('id').eq('slug', slug).maybeSingle();
      if (taken) slug = `${slug}-${shortId()}`;
      const { error } = await db().from('products').insert({ ...row, id: productId, slug, sku: `AMC-${shortId().toUpperCase()}` });
      if (error) throw error;
    }

    // Variantes: se actualizan las que siguen, se crean las nuevas y se borran las que se sacaron.
    const { data: existing } = await db().from('product_variants').select('id, sku').eq('product_id', productId);
    const keep = new Set<string>();
    for (const [position, v] of variants.entries()) {
      const known = v.id && existing?.some((e) => e.id === v.id);
      if (known) {
        keep.add(v.id!);
        const { error } = await db()
          .from('product_variants')
          .update({ name: text(v.name, 120), price: v.price, stock: v.stock, position })
          .eq('id', v.id!)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const vid = `${productId}-${shortId()}`;
        keep.add(vid);
        const { error } = await db()
          .from('product_variants')
          .insert({ id: vid, product_id: productId, name: text(v.name, 120), price: v.price, stock: v.stock, position, sku: `${vid.toUpperCase()}` });
        if (error) throw error;
      }
    }
    const removed = (existing ?? []).filter((e) => !keep.has(e.id)).map((e) => e.id);
    if (removed.length) await db().from('product_variants').delete().in('id', removed);

    await removeUnusedImages(previousImages.filter((u) => !row.images.includes(u)));
    updateTag(CATALOG_TAG);
    return ok({ id: productId });
  });
}

/**
 * Borra un producto. Los pedidos viejos no se rompen: guardan nombre, foto y precio
 * del momento de la compra (order_items es una "foto" del producto).
 */
export async function deleteProductAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    const { data: product } = await db().from('products').select('id, images').eq('id', id).maybeSingle();
    if (!product) return ok(undefined);
    const { error } = await db().from('products').delete().eq('id', id);
    if (error) throw error;
    await removeUnusedImages(product.images);
    updateTag(CATALOG_TAG);
    return ok(undefined);
  });
}

// ---------- Rubros ----------

export type CategoryInput = { label: string; blurb: string; image: string; variantNoun: 'opción' | 'tamaño' | 'color' | 'modelo'; active: boolean };
const NOUNS = ['opción', 'tamaño', 'color', 'modelo'];

function validateCategory(input: CategoryInput): string | null {
  if (text(input.label, 40).length < 2) return 'Escribí el nombre del rubro.';
  if (!NOUNS.includes(input.variantNoun)) return 'Elegí qué elige el cliente (opción, tamaño, color o modelo).';
  if (input.image && !safeImageUrl(input.image)) return 'La foto no es válida.';
  return null;
}

export async function saveCategoryAction(id: string | null, input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const problem = validateCategory(input);
    if (problem) return fail(problem);
    const row = {
      label: text(input.label, 40),
      blurb: text(input.blurb, 200),
      image: input.image ? safeImageUrl(input.image) : null,
      variant_noun: input.variantNoun,
      active: !!input.active,
    };
    if (id) {
      const { data: current } = await db().from('categories').select('image').eq('id', id).maybeSingle();
      if (!current) return fail('El rubro ya no existe.');
      const { error } = await db().from('categories').update(row).eq('id', id);
      if (error) throw error;
      if (current.image && current.image !== row.image) await removeUnusedImages([current.image]);
      updateTag(CATALOG_TAG);
      return ok({ id });
    }
    // El id va en la URL (/catalogo?rubro=bazar): sale del nombre y no cambia después.
    let newId = slugify(row.label).slice(0, 30) || `rubro-${shortId()}`;
    const { data: taken } = await db().from('categories').select('id').eq('id', newId).maybeSingle();
    if (taken) newId = `${newId}-${shortId()}`;
    const { data: last } = await db().from('categories').select('position').order('position', { ascending: false }).limit(1).maybeSingle();
    const { error } = await db().from('categories').insert({ ...row, id: newId, position: (last?.position ?? 0) + 1 });
    if (error) throw error;
    updateTag(CATALOG_TAG);
    return ok({ id: newId });
  });
}

/** Sube o baja un rubro en el orden del menú. */
export async function moveCategoryAction(id: string, direction: 'up' | 'down'): Promise<ActionResult> {
  return guard(async () => {
    const { data: list } = await db().from('categories').select('id, position').order('position').order('label');
    if (!list) return fail('No se pudo leer el orden.');
    const i = list.findIndex((c) => c.id === id);
    const j = direction === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return ok(undefined);
    [list[i], list[j]] = [list[j], list[i]];
    for (const [position, c] of list.entries()) {
      const { error } = await db().from('categories').update({ position: position + 1 }).eq('id', c.id);
      if (error) throw error;
    }
    updateTag(CATALOG_TAG);
    return ok(undefined);
  });
}

/**
 * Borra un rubro. Si tiene productos, hay que decir a qué rubro pasan (moveTo);
 * si no se elige, no se borra nada.
 */
export async function deleteCategoryAction(id: string, moveTo?: string): Promise<ActionResult<{ moved: number }>> {
  return guard(async () => {
    const { data: category } = await db().from('categories').select('id, image').eq('id', id).maybeSingle();
    if (!category) return ok({ moved: 0 });
    const { count } = await db().from('products').select('id', { count: 'exact', head: true }).eq('category', id);
    let moved = 0;
    if (count) {
      if (!moveTo || moveTo === id) return fail(`Este rubro tiene ${count} productos: elegí a qué rubro pasarlos antes de borrarlo.`);
      const { data: target } = await db().from('categories').select('id').eq('id', moveTo).maybeSingle();
      if (!target) return fail('El rubro de destino no existe.');
      const { error } = await db().from('products').update({ category: moveTo }).eq('category', id);
      if (error) throw error;
      moved = count;
    }
    const { error } = await db().from('categories').delete().eq('id', id);
    if (error) throw error;
    if (category.image) await removeUnusedImages([category.image]);
    updateTag(CATALOG_TAG);
    return ok({ moved });
  });
}
