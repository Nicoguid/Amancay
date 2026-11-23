'use client';

import { useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import { ProductImage } from '@/components/ProductImage';
import type { Product } from '@/lib/types';
import type { CategoryInfo } from '@/lib/categories';
import { parseArNumber, parseArsPrice } from '@/lib/csv';
import { useAdmin } from './AdminDataContext';
import type { CategoryInput } from './catalogActions';

/*
 * Edición del catálogo pensada para la dueña: una sola ficha por producto, con fotos que se
 * suben desde el celular o la compu, y rubros que se crean, ordenan y borran desde el panel.
 */

const card = 'card-rest rounded-lg bg-white p-5 sm:p-6';
const field = 'field text-sm';
const primaryBtn = 'btn btn-primary text-sm';
const secondaryBtn = 'btn btn-quiet text-sm';
const dangerBtn = 'btn text-sm border border-[var(--amancay-wine)] bg-white text-[var(--amancay-wine)] hover:bg-[#f6d9d3]';

// ---------- Fotos ----------

/**
 * Achica la foto en el navegador antes de subirla (las del celular pesan 3 a 8 MB):
 * se sube rápido con poca señal y nunca pasa el límite. El servidor igual la vuelve a procesar.
 */
async function shrink(file: File, maxSide = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('sin blob'))), 'image/jpeg', 0.88)
    );
  } catch {
    return file; // si el navegador no puede, se sube tal cual y la achica el servidor
  }
}

function ImagePicker({
  images,
  onChange,
  onUploaded,
  max,
  label,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  /** Avisa cada foto nueva subida (para borrarla si al final no se guarda). */
  onUploaded: (url: string) => void;
  max: number;
  label: string;
}) {
  const { uploadImage } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = max - images.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`Se pueden cargar hasta ${max} fotos.`);
    setUploading(list.length);
    const added: string[] = [];
    for (const file of list) {
      const form = new FormData();
      form.append('file', await shrink(file), 'foto.jpg');
      const res = await uploadImage(form);
      if (res.ok) {
        added.push(res.data.url);
        onUploaded(res.data.url);
      }
      else setError(res.error);
      setUploading((n) => n - 1);
    }
    onChange([...images, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <p id={`${id}-label`} className="mb-1.5 text-sm font-semibold">
        {label} <span className="font-normal text-[var(--ink-muted)]">({images.length}/{max}{max > 1 ? ' · la primera es la principal' : ''})</span>
      </p>
      <ul className="flex flex-wrap gap-2" aria-labelledby={`${id}-label`}>
        {images.map((src, i) => (
          <li key={src} className="relative h-24 w-24 overflow-hidden rounded-md border border-[var(--amancay-border)] bg-[var(--bg-sunken)]">
            <ProductImage src={src} alt={`Foto ${i + 1}`} width={96} height={96} className="h-full w-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 p-1">
              {max > 1 && i > 0 ? (
                <button
                  type="button"
                  onClick={() => onChange([src, ...images.filter((u) => u !== src)])}
                  className="rounded p-1 text-white hover:bg-white/20"
                  title="Usar como principal"
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Usar la foto {i + 1} como principal</span>
                </button>
              ) : (
                <span className="px-1 text-[11px] font-semibold text-white">{max > 1 ? 'Principal' : ''}</span>
              )}
              <button type="button" onClick={() => onChange(images.filter((u) => u !== src))} className="rounded p-1 text-white hover:bg-white/20" title="Quitar">
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Quitar la foto {i + 1}</span>
              </button>
            </div>
          </li>
        ))}
        {images.length < max && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading > 0}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[var(--brand-brass)] text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--brand-leather-wash)]"
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              {uploading > 0 ? 'Subiendo…' : 'Agregar foto'}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void add(e.target.files)}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-[var(--amancay-wine)]">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------- Ficha de producto ----------

type VariantDraft = { key: string; id?: string; name: string; price: string; stock: string };
type Draft = {
  name: string;
  category: string;
  brand: string;
  shortDescription: string;
  description: string;
  price: string;
  originalPrice: string;
  stock: string;
  images: string[];
  active: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  hasVariants: boolean;
  variants: VariantDraft[];
};

const newKey = () => Math.random().toString(36).slice(2, 9);

function toDraft(p: Product | null, defaultCategory: string): Draft {
  if (!p) {
    return {
      name: '', category: defaultCategory, brand: '', shortDescription: '', description: '', price: '', originalPrice: '', stock: '1',
      images: [], active: true, isFeatured: false, isBestSeller: false, isNew: true, hasVariants: false,
      variants: [{ key: newKey(), name: '', price: '', stock: '' }],
    };
  }
  return {
    name: p.name,
    category: p.category,
    brand: p.brand,
    shortDescription: p.shortDescription ?? '',
    description: p.description,
    price: String(p.price),
    originalPrice: p.originalPrice ? String(p.originalPrice) : '',
    stock: String(p.stock),
    images: p.images,
    active: p.active,
    isFeatured: !!p.isFeatured,
    isBestSeller: !!p.isBestSeller,
    isNew: !!p.isNew,
    hasVariants: !!p.variants?.length,
    variants: p.variants?.length
      ? p.variants.map((v) => ({ key: v.id, id: v.id, name: v.name, price: String(v.price), stock: String(v.stock) }))
      : [{ key: newKey(), name: '', price: '', stock: '' }],
  };
}

export function ProductEditor({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  const { categories, saveProductFull, deleteProduct, discardImages } = useAdmin();
  // Fotos subidas en esta ficha: si se cancela, o se quitan antes de guardar, se borran del almacenamiento.
  const uploaded = useRef<string[]>([]);
  const close = () => {
    discardImages(uploaded.current);
    uploaded.current = [];
    onClose();
  };
  const ids = useId();
  const [draft, setDraft] = useState<Draft>(() => toDraft(product, categories[0]?.id ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const noun = categories.find((c) => c.id === draft.category)?.variantNoun ?? 'opción';
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const setVariant = (key: string, patch: Partial<VariantDraft>) =>
    set('variants', draft.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    const variants = draft.hasVariants
      ? draft.variants
          .filter((v) => v.name.trim() || v.price.trim() || v.stock.trim())
          .map((v) => ({ id: v.id, name: v.name.trim(), price: parseArsPrice(v.price) ?? NaN, stock: parseArNumber(v.stock || '0') ?? NaN }))
      : [];
    if (draft.hasVariants && variants.length === 0) return setError(`Agregá al menos un ${noun} con precio y stock.`);
    const price = draft.hasVariants ? Math.min(...variants.map((v) => v.price)) : parseArsPrice(draft.price);
    const stock = parseArNumber(draft.stock || '0');
    if (!draft.hasVariants && (price === null || Number.isNaN(price))) return setError('Escribí el precio (por ejemplo 25000).');
    if (!draft.hasVariants && (stock === null || stock < 0 || !Number.isInteger(stock))) return setError('El stock tiene que ser un número entero, 0 o más.');
    const original = draft.originalPrice.trim() ? parseArsPrice(draft.originalPrice) : undefined;
    if (original === null) return setError('El precio "antes" no es válido.');

    setSaving(true);
    const res = await saveProductFull(product?.id ?? null, {
      name: draft.name,
      category: draft.category,
      brand: draft.brand,
      shortDescription: draft.shortDescription,
      description: draft.description,
      price: price ?? 0,
      originalPrice: original,
      stock: stock ?? 0,
      images: draft.images,
      active: draft.active,
      isFeatured: draft.isFeatured,
      isBestSeller: draft.isBestSeller,
      isNew: draft.isNew,
      variants,
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    discardImages(uploaded.current.filter((u) => !draft.images.includes(u)));
    uploaded.current = [];
    onClose();
  };

  const remove = async () => {
    if (!product) return;
    if (!window.confirm(`¿Borrar "${product.name}"? Desaparece de la tienda. Los pedidos viejos lo siguen mostrando. No se puede deshacer.`)) return;
    setSaving(true);
    const res = await deleteProduct(product.id);
    setSaving(false);
    if (!res.ok) return setError(res.error);
    close();
  };

  const input = (key: 'name' | 'brand' | 'price' | 'originalPrice' | 'stock' | 'shortDescription', label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div>
      <label htmlFor={`${ids}-${key}`} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {hint && <p className="mb-1 text-xs text-[var(--ink-muted)]">{hint}</p>}
      <input id={`${ids}-${key}`} name={key} autoComplete="off" value={draft[key]} onChange={(e) => set(key, e.target.value)} className={field} {...props} />
    </div>
  );

  const check = (key: 'active' | 'isFeatured' | 'isBestSeller' | 'isNew', label: string) => (
    <label className="flex min-h-10 items-center gap-2 text-sm">
      <input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} className="h-5 w-5 accent-[var(--brand-espresso)]" />
      {label}
    </label>
  );

  return (
    <Dialog open={open} onClose={close} title={product ? 'Editar producto' : 'Nuevo producto'}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <ImagePicker
          images={draft.images}
          onChange={(images) => set('images', images)}
          onUploaded={(url) => uploaded.current.push(url)}
          max={6}
          label="Fotos"
        />

        {input('name', 'Nombre', { required: true, maxLength: 200, placeholder: 'Ej.: Mate imperial de calabaza' })}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${ids}-category`} className="mb-1 block text-sm font-semibold">
              Rubro
            </label>
            <select id={`${ids}-category`} value={draft.category} onChange={(e) => set('category', e.target.value)} className={field}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {c.active === false ? ' (oculto)' : ''}
                </option>
              ))}
            </select>
          </div>
          {input('brand', 'Marca', { maxLength: 80, placeholder: 'Ej.: Kevin' })}
        </div>

        <fieldset className="space-y-3 rounded-md border border-[var(--amancay-border)] p-4">
          <legend className="px-1 text-sm font-semibold">Precio y stock</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.hasVariants}
              onChange={(e) => set('hasVariants', e.target.checked)}
              className="h-5 w-5 accent-[var(--brand-espresso)]"
            />
            Tiene varios {noun === 'opción' ? 'opciones' : `${noun}s`} (por ejemplo 60 ml y 100 ml)
          </label>

          {draft.hasVariants ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_110px_80px_36px] gap-2 text-xs font-semibold text-[var(--ink-muted)]">
                <span>{noun[0].toUpperCase() + noun.slice(1)}</span>
                <span>Precio ($)</span>
                <span>Stock</span>
                <span />
              </div>
              {draft.variants.map((v, i) => (
                <div key={v.key} className="grid grid-cols-[1fr_110px_80px_36px] gap-2">
                  <input aria-label={`Nombre de la opción ${i + 1}`} value={v.name} onChange={(e) => setVariant(v.key, { name: e.target.value })} placeholder="100 ml" className={field} maxLength={120} />
                  <input aria-label={`Precio de la opción ${i + 1}`} value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value })} inputMode="numeric" className={field} />
                  <input aria-label={`Stock de la opción ${i + 1}`} value={v.stock} onChange={(e) => setVariant(v.key, { stock: e.target.value })} inputMode="numeric" className={field} />
                  <button
                    type="button"
                    onClick={() => set('variants', draft.variants.length > 1 ? draft.variants.filter((x) => x.key !== v.key) : draft.variants)}
                    className="flex items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]"
                    title="Quitar"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Quitar la opción {i + 1}</span>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set('variants', [...draft.variants, { key: newKey(), name: '', price: '', stock: '' }])} className={secondaryBtn}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar {noun}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {input('price', 'Precio ($)', { inputMode: 'numeric', placeholder: '25000' })}
              {input('stock', 'Stock', { inputMode: 'numeric' }, 'Cuántas unidades hay.')}
            </div>
          )}
          {input('originalPrice', 'Precio "antes" (opcional)', { inputMode: 'numeric' }, 'Si lo completás, se muestra tachado al lado del precio.')}
        </fieldset>

        {input('shortDescription', 'Frase corta', { maxLength: 200 }, 'Una línea que aparece debajo del nombre. Ej.: "Calabaza forrada en cuero y virola de alpaca".')}
        <div>
          <label htmlFor={`${ids}-description`} className="mb-1 block text-sm font-semibold">
            Descripción
          </label>
          <textarea
            id={`${ids}-description`}
            name="description"
            rows={4}
            maxLength={4000}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            className={field}
          />
        </div>

        <fieldset className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <legend className="mb-1 text-sm font-semibold">Mostrar</legend>
          {check('active', 'Publicado en la tienda')}
          {check('isNew', 'Marcar como "Nuevo"')}
          {check('isBestSeller', 'Marcar como "Más vendido"')}
          {check('isFeatured', 'Destacar en el inicio')}
        </fieldset>

        <p role="alert" className="text-sm text-[var(--amancay-wine)]">
          {error}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {product ? (
            <button type="button" onClick={remove} disabled={saving} className={dangerBtn}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Borrar producto
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={close} className={secondaryBtn}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} aria-busy={saving} className={primaryBtn}>
              {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Publicar'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

// ---------- Rubros ----------

function CategoryEditor({ category, open, onClose }: { category: CategoryInfo | null; open: boolean; onClose: () => void }) {
  const { saveCategory, discardImages } = useAdmin();
  const uploaded = useRef<string[]>([]);
  const close = () => {
    discardImages(uploaded.current);
    uploaded.current = [];
    onClose();
  };
  const ids = useId();
  const [draft, setDraft] = useState<CategoryInput>(() => ({
    label: category?.label ?? '',
    blurb: category?.blurb ?? '',
    image: category?.image ?? '',
    variantNoun: (category?.variantNoun as CategoryInput['variantNoun']) ?? 'opción',
    active: category?.active ?? true,
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveCategory(category?.id ?? null, draft);
    setSaving(false);
    if (!res.ok) return setError(res.error);
    discardImages(uploaded.current.filter((u) => u !== draft.image));
    uploaded.current = [];
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} title={category ? `Editar rubro: ${category.label}` : 'Nuevo rubro'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <ImagePicker
          images={draft.image ? [draft.image] : []}
          onChange={(list) => setDraft((d) => ({ ...d, image: list[0] ?? '' }))}
          onUploaded={(url) => uploaded.current.push(url)}
          max={1}
          label="Foto de portada"
        />
        <div>
          <label htmlFor={`${ids}-label`} className="mb-1 block text-sm font-semibold">
            Nombre
          </label>
          <input id={`${ids}-label`} value={draft.label} maxLength={40} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Ej.: Bazar" className={field} />
        </div>
        <div>
          <label htmlFor={`${ids}-blurb`} className="mb-1 block text-sm font-semibold">
            Frase para el inicio
          </label>
          <input id={`${ids}-blurb`} value={draft.blurb} maxLength={200} onChange={(e) => setDraft((d) => ({ ...d, blurb: e.target.value }))} className={field} />
        </div>
        <div>
          <label htmlFor={`${ids}-noun`} className="mb-1 block text-sm font-semibold">
            Cuando un producto tiene variantes, el cliente elige…
          </label>
          <select id={`${ids}-noun`} value={draft.variantNoun} onChange={(e) => setDraft((d) => ({ ...d, variantNoun: e.target.value as CategoryInput['variantNoun'] }))} className={field}>
            <option value="opción">una opción</option>
            <option value="tamaño">un tamaño</option>
            <option value="color">un color</option>
            <option value="modelo">un modelo</option>
          </select>
        </div>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))} className="h-5 w-5 accent-[var(--brand-espresso)]" />
          Visible en la tienda (si lo ocultás, se ocultan también sus productos)
        </label>
        <p role="alert" className="text-sm text-[var(--amancay-wine)]">
          {error}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={close} className={secondaryBtn}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} aria-busy={saving} className={primaryBtn}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteCategoryDialog({ category, open, onClose }: { category: CategoryInfo; open: boolean; onClose: () => void }) {
  const { categories, products, deleteCategory } = useAdmin();
  const count = products.filter((p) => p.category === category.id).length;
  const others = categories.filter((c) => c.id !== category.id);
  const [moveTo, setMoveTo] = useState(others[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    const res = await deleteCategory(category.id, count ? moveTo : undefined);
    setSaving(false);
    if (!res.ok) return setError(res.error);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Borrar el rubro ${category.label}`}>
      <div className="space-y-4 text-sm">
        {count === 0 ? (
          <p>Este rubro no tiene productos. Se borra del menú y del inicio.</p>
        ) : others.length === 0 ? (
          <p>Es el único rubro y tiene productos: creá otro rubro antes de borrarlo.</p>
        ) : (
          <>
            <p>
              Tiene <strong>{count}</strong> {count === 1 ? 'producto' : 'productos'}. ¿A qué rubro {count === 1 ? 'lo pasamos' : 'los pasamos'}?
            </p>
            <select aria-label="Rubro de destino" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={field}>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </>
        )}
        <p role="alert" className="text-[var(--amancay-wine)]">
          {error}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Cancelar
          </button>
          <button type="button" onClick={confirm} disabled={saving || (count > 0 && others.length === 0)} className={dangerBtn}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Borrando…' : 'Borrar rubro'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function CategoriesTab() {
  const { categories, products, moveCategory } = useAdmin();
  const [editing, setEditing] = useState<{ category: CategoryInfo | null } | null>(null);
  const [deleting, setDeleting] = useState<CategoryInfo | null>(null);

  return (
    <section aria-labelledby="rubros-title" className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="rubros-title" className="font-display text-2xl">
            Rubros
          </h2>
          <p className="text-[var(--ink-muted)]">Son las secciones del menú y del catálogo. El orden de esta lista es el del menú.</p>
        </div>
        <button type="button" onClick={() => setEditing({ category: null })} className={primaryBtn}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo rubro
        </button>
      </div>
      <ul className="divide-y divide-[var(--bg-subtle)]">
        {categories.map((c, i) => {
          const count = products.filter((p) => p.category === c.id).length;
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--bg-sunken)]">
                <ProductImage src={c.image || undefined} alt="" width={56} height={56} className="h-full w-full object-contain" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {c.label} {c.active === false && <span className="tag tag-quiet">oculto</span>}
                </p>
                <p className="truncate text-sm text-[var(--ink-muted)]">
                  {count} {count === 1 ? 'producto' : 'productos'} {c.blurb ? `· ${c.blurb}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => void moveCategory(c.id, 'up')} disabled={i === 0} className={secondaryBtn} title="Subir">
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Subir {c.label}</span>
                </button>
                <button type="button" onClick={() => void moveCategory(c.id, 'down')} disabled={i === categories.length - 1} className={secondaryBtn} title="Bajar">
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Bajar {c.label}</span>
                </button>
                <button type="button" onClick={() => setEditing({ category: c })} className={secondaryBtn}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar<span className="sr-only"> {c.label}</span>
                </button>
                <button type="button" onClick={() => setDeleting(c)} className={secondaryBtn} title="Borrar">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Borrar {c.label}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {editing && <CategoryEditor key={editing.category?.id ?? 'nuevo'} category={editing.category} open onClose={() => setEditing(null)} />}
      {deleting && <DeleteCategoryDialog key={deleting.id} category={deleting} open onClose={() => setDeleting(null)} />}
    </section>
  );
}

