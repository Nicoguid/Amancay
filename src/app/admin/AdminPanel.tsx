'use client';

import { useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Upload, Plus, Undo2 } from 'lucide-react';
import { useStore, applyPercentage, matchesMassFilter, type MassFilter, type CsvProductRow } from '@/context/StoreContext';
import { Dialog } from '@/components/Dialog';
import type { OrderStatus, Product, ProductCategory } from '@/lib/types';
import { PAYMENT_LABELS, SHIPPING_LABELS, formatPrice, normalizeText, slugify } from '@/lib/storeConfig';
import { headerIndex, parseArNumber, parseCsv, toCsv } from '@/lib/csv';

type Tab = 'prices' | 'products' | 'orders' | 'metrics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'prices', label: 'Precios' },
  { id: 'products', label: 'Productos y stock' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'metrics', label: 'Resumen' },
];

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'mates', label: 'Mates' },
  { id: 'bombillas', label: 'Bombillas' },
  { id: 'perfumes', label: 'Perfumes' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  listo_para_retirar: 'Listo para retirar',
  despachado: 'Despachado',
  entregado: 'Entregado',
};

/** Umbral de "stock bajo" por línea (variante o producto simple). */
const LOW_STOCK = 5;

const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });

const card = 'rounded-xl border border-[var(--amancay-border)] bg-white p-5 sm:p-6';
const field = 'w-full rounded-md border border-[var(--amancay-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--ink-accent)]';
const primaryBtn =
  'tap-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--ink-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--ink-secondary)] disabled:opacity-50';
const secondaryBtn =
  'tap-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--amancay-border)] bg-white px-5 text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]';

function lowStockLines(products: Product[]) {
  const lines: { key: string; sku: string; name: string; stock: number }[] = [];
  for (const p of products) {
    if (!p.active) continue;
    if (p.variants?.length) {
      for (const v of p.variants) {
        if (v.stock <= LOW_STOCK) lines.push({ key: `${p.id}-${v.id}`, sku: v.sku, name: `${p.name} — ${v.name}`, stock: v.stock });
      }
    } else if (p.stock <= LOW_STOCK) {
      lines.push({ key: p.id, sku: p.sku, name: p.name, stock: p.stock });
    }
  }
  return lines.sort((a, b) => a.stock - b.stock);
}

export function AdminPanel() {
  const { products, orders, isHydrated } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('prices');
  const pendingOrders = orders.filter((o) => o.status === 'pendiente' || o.status === 'en_preparacion').length;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-16 text-[var(--ink-primary)]">
      <div className="focus-on-dark border-b border-[var(--ink-secondary)] bg-[#14110e] py-6 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[var(--amancay-gold-light)]">Panel del local</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">Precios, stock y pedidos</h1>
            <p className="mt-1 text-sm text-white/80">Demo: los cambios se guardan solo en este navegador.</p>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-4 text-sm font-semibold hover:bg-white/10">
            Ver la tienda
          </Link>
        </div>
      </div>

      <nav aria-label="Secciones del panel" className="sticky top-16 z-30 border-b border-[var(--amancay-border)] bg-white sm:top-20">
        <ul className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`tap-interactive flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold ${
                  activeTab === tab.id ? 'bg-[var(--ink-primary)] text-white' : 'text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {tab.label}
                {tab.id === 'orders' && pendingOrders > 0 && (
                  <span className="rounded-full bg-[var(--amancay-gold-light)] px-2 text-xs tabular-nums text-[var(--ink-primary)]">
                    {pendingOrders}
                    <span className="sr-only"> pendientes</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {!isHydrated ? (
          <p className="text-[var(--ink-muted)]">Cargando datos…</p>
        ) : activeTab === 'prices' ? (
          <PricesTab products={products} />
        ) : activeTab === 'products' ? (
          <ProductsTab products={products} />
        ) : activeTab === 'orders' ? (
          <OrdersTab />
        ) : (
          <MetricsTab />
        )}
      </div>
    </div>
  );
}

// ---------------- Precios ----------------

function PricesTab({ products }: { products: Product[] }) {
  const { applyMassPercentageIncrease, restoreProducts, importProductsFromCsvData } = useStore();
  const [filterType, setFilterType] = useState<MassFilter>('category');
  const [filterValue, setFilterValue] = useState<string>('mates');
  const [percentage, setPercentage] = useState('10');
  const [result, setResult] = useState<{ message: string; previous?: Product[] } | null>(null);
  const [csvReport, setCsvReport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).filter(Boolean).sort(), [products]);
  const pct = parseArNumber(percentage);
  const validPct = pct !== null && pct !== 0 && pct > -90 && pct < 500;
  const preview = useMemo(
    () => products.filter((p) => matchesMassFilter(p, filterType, filterValue)),
    [products, filterType, filterValue]
  );

  const apply = () => {
    if (!validPct || pct === null) return;
    const { affectedCount, previous } = applyMassPercentageIncrease(filterType, filterValue, pct);
    setResult({
      message: `Listo: ${affectedCount} ${affectedCount === 1 ? 'producto actualizado' : 'productos actualizados'} (${pct > 0 ? '+' : ''}${pct} %).`,
      previous,
    });
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [['ID', 'SKU', 'Nombre', 'Marca', 'Rubro', 'Precio', 'Stock']];
    for (const p of products) rows.push([p.id, p.sku, p.name, p.brand, p.category, p.price, p.stock]);
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amancay_catalogo_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ''));
      if (rows.length < 2) {
        setCsvReport('La planilla está vacía o no tiene encabezados.');
        return;
      }
      const [headers, ...data] = rows;
      const col = {
        id: headerIndex(headers, 'id'),
        sku: headerIndex(headers, 'sku', 'codigo'),
        name: headerIndex(headers, 'nombre', 'producto', 'articulo'),
        brand: headerIndex(headers, 'marca'),
        category: headerIndex(headers, 'rubro', 'categoria'),
        price: headerIndex(headers, 'precio'),
        stock: headerIndex(headers, 'stock'),
      };
      if (col.sku < 0 && col.id < 0) {
        setCsvReport('Falta la columna SKU o ID para saber qué producto actualizar.');
        return;
      }
      const parsed: CsvProductRow[] = [];
      const problems: string[] = [];
      data.forEach((row, i) => {
        const line = i + 2;
        const get = (index: number) => (index >= 0 ? row[index] ?? '' : '');
        const priceRaw = get(col.price);
        const stockRaw = get(col.stock);
        const price = priceRaw ? parseArNumber(priceRaw) : undefined;
        const stock = stockRaw ? parseArNumber(stockRaw) : undefined;
        const categoryRaw = normalizeText(get(col.category));
        const category = CATEGORIES.find((c) => c.id === categoryRaw)?.id;
        if (price === null || (price !== undefined && price <= 0)) {
          problems.push(`fila ${line}: precio "${priceRaw}" no válido`);
          return;
        }
        if (stock === null || (stock !== undefined && (stock < 0 || !Number.isInteger(stock)))) {
          problems.push(`fila ${line}: stock "${stockRaw}" no válido`);
          return;
        }
        if (categoryRaw && !category) {
          problems.push(`fila ${line}: rubro "${get(col.category)}" no existe`);
          return;
        }
        parsed.push({
          id: get(col.id) || undefined,
          sku: get(col.sku) || undefined,
          name: get(col.name) || undefined,
          brand: get(col.brand) || undefined,
          category,
          price: price ?? undefined,
          stock: stock ?? undefined,
        });
      });
      const { updated, created } = importProductsFromCsvData(parsed);
      const parts = [`${updated} actualizados`, `${created} nuevos`];
      if (problems.length) parts.push(`${problems.length} filas salteadas (${problems.slice(0, 3).join('; ')}${problems.length > 3 ? '…' : ''})`);
      setCsvReport(`Planilla importada: ${parts.join(', ')}.`);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <>
      <section aria-labelledby="ajuste-title" className={`${card} space-y-5`}>
        <div>
          <h2 id="ajuste-title" className="font-display text-2xl">
            Aumento por rubro o marca
          </h2>
          <p className="text-[var(--ink-muted)]">Cuando el proveedor manda lista nueva. Los precios se redondean a $50.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="mass-type" className="mb-1.5 block text-sm font-semibold">
              Aplicar a
            </label>
            <select
              id="mass-type"
              value={filterType}
              onChange={(e) => {
                const value = e.target.value as MassFilter;
                setFilterType(value);
                if (value === 'category') setFilterValue('mates');
                if (value === 'brand') setFilterValue(brands[0] ?? '');
              }}
              className={field}
            >
              <option value="category">Un rubro</option>
              <option value="brand">Una marca</option>
              <option value="all">Todo el catálogo</option>
            </select>
          </div>
          {filterType !== 'all' && (
            <div>
              <label htmlFor="mass-value" className="mb-1.5 block text-sm font-semibold">
                {filterType === 'category' ? 'Rubro' : 'Marca'}
              </label>
              <select id="mass-value" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className={field}>
                {(filterType === 'category' ? CATEGORIES.map((c) => ({ v: c.id, l: c.label })) : brands.map((b) => ({ v: b, l: b }))).map(
                  (o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  )
                )}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="mass-pct" className="mb-1.5 block text-sm font-semibold">
              Porcentaje
            </label>
            <div className="flex gap-2">
              <input
                id="mass-pct"
                type="text"
                inputMode="decimal"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                aria-invalid={!validPct || undefined}
                aria-describedby="mass-pct-hint"
                className={`${field} tabular-nums`}
              />
              <button type="button" onClick={apply} disabled={!validPct || preview.length === 0} className={primaryBtn}>
                Aplicar
              </button>
            </div>
            <p id="mass-pct-hint" className="mt-1 text-sm text-[var(--ink-muted)]">
              Ej.: 12 para subir, −5 para bajar.
            </p>
          </div>
        </div>

        <div role="status">
          {result && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--amancay-emerald)] bg-[var(--bg-page)] p-3">
              <p className="font-semibold text-[var(--amancay-emerald)]">{result.message}</p>
              {result.previous && (
                <button
                  type="button"
                  onClick={() => {
                    restoreProducts(result.previous!);
                    setResult({ message: 'Se deshizo el último aumento.' });
                  }}
                  className={secondaryBtn}
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Deshacer
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Vista previa: {preview.length} {preview.length === 1 ? 'producto' : 'productos'}
          </h3>
          <div className="max-h-96 overflow-auto rounded-md border border-[var(--amancay-border)]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[var(--bg-subtle)]">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Producto</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Precio actual</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Precio nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bg-subtle)]">
                {preview.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5">
                      {p.name}
                      <span className="block text-xs text-[var(--ink-muted)]">{p.sku}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(p.price)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[var(--amancay-emerald)]">
                      {validPct && pct !== null ? formatPrice(applyPercentage(p, pct).price) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="csv-title" className={`${card} space-y-4`}>
        <div>
          <h2 id="csv-title" className="font-display text-2xl">
            Planilla de precios
          </h2>
          <p className="text-[var(--ink-muted)]">
            Descargá el catálogo, cambiá precios o stock en Excel y volvé a subirlo. Se actualiza por SKU; las celdas vacías no se
            tocan.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={exportCsv} className={secondaryBtn}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar planilla
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={primaryBtn}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Subir planilla
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="sr-only" tabIndex={-1} aria-hidden="true" />
        </div>
        <p role="status" className="text-sm">
          {csvReport}
        </p>
      </section>
    </>
  );
}

// ---------------- Productos ----------------

function ProductsTab({ products }: { products: Product[] }) {
  const { updateProduct, toggleProductActive } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const list = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    const q = normalizeText(search);
    return !q || normalizeText(`${p.name} ${p.brand} ${p.sku}`).includes(q);
  });

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditError(null);
    setEditPrice(String(p.price));
    setEditStock(
      p.variants?.length ? Object.fromEntries(p.variants.map((v) => [v.id, String(v.stock)])) : { _: String(p.stock) }
    );
  };

  const saveEdit = (p: Product) => {
    const price = parseArNumber(editPrice);
    if (price === null || price <= 0) {
      setEditError('El precio tiene que ser un número mayor a 0.');
      return;
    }
    const stocks = Object.fromEntries(Object.entries(editStock).map(([k, v]) => [k, parseArNumber(v)]));
    if (Object.values(stocks).some((s) => s === null || s < 0 || !Number.isInteger(s))) {
      setEditError('El stock tiene que ser un número entero, 0 o más.');
      return;
    }
    if (p.variants?.length) {
      updateProduct(p.id, { price, variants: p.variants.map((v) => ({ ...v, stock: stocks[v.id] ?? v.stock })) });
    } else {
      updateProduct(p.id, { price, stock: stocks._ ?? p.stock });
    }
    setEditingId(null);
  };

  return (
    <>
      <div className={`${card} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="prod-search" className="mb-1.5 block text-sm font-semibold">
              Buscar
            </label>
            <input
              id="prod-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, marca o SKU…"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="prod-cat" className="mb-1.5 block text-sm font-semibold">
              Rubro
            </label>
            <select id="prod-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              <option value="all">Todos</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={() => setIsNewOpen(true)} aria-haspopup="dialog" className={primaryBtn}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo producto
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--amancay-border)] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Productos: {list.length}</caption>
          <thead className="bg-[var(--bg-subtle)]">
            <tr>
              <th scope="col" className="px-4 py-3">Producto</th>
              <th scope="col" className="px-4 py-3 text-right">Precio base</th>
              <th scope="col" className="px-4 py-3">Stock</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bg-subtle)]">
            {list.map((p) => {
              const editing = editingId === p.id;
              return (
                <tr key={p.id} className={p.active ? '' : 'bg-[var(--bg-page)] text-[var(--ink-muted)]'}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-xs text-[var(--ink-muted)]">
                      {p.sku} · {p.brand}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {editing ? (
                      <>
                        <label htmlFor={`price-${p.id}`} className="sr-only">
                          Precio de {p.name}
                        </label>
                        <input
                          id={`price-${p.id}`}
                          type="text"
                          inputMode="numeric"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-28 rounded-md border border-[var(--amancay-border)] px-2 py-1.5 text-right"
                        />
                        {p.variants?.some((v) => v.priceModifier) && (
                          <span className="mt-1 block text-xs text-[var(--ink-muted)]">Las variantes mantienen su diferencia.</span>
                        )}
                      </>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.variants?.length ? (
                      <ul className="space-y-1">
                        {p.variants.map((v) => (
                          <li key={v.id} className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs">{v.name}</span>
                            {editing ? (
                              <>
                                <label htmlFor={`stock-${p.id}-${v.id}`} className="sr-only">
                                  Stock de {v.name}
                                </label>
                                <input
                                  id={`stock-${p.id}-${v.id}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={editStock[v.id] ?? ''}
                                  onChange={(e) => setEditStock((s) => ({ ...s, [v.id]: e.target.value }))}
                                  className="w-16 rounded-md border border-[var(--amancay-border)] px-2 py-1 text-right"
                                />
                              </>
                            ) : (
                              <span className={`tabular-nums ${v.stock <= LOW_STOCK ? 'font-semibold text-[var(--amancay-wine)]' : ''}`}>
                                {v.stock}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : editing ? (
                      <>
                        <label htmlFor={`stock-${p.id}`} className="sr-only">
                          Stock de {p.name}
                        </label>
                        <input
                          id={`stock-${p.id}`}
                          type="text"
                          inputMode="numeric"
                          value={editStock._ ?? ''}
                          onChange={(e) => setEditStock({ _: e.target.value })}
                          className="w-16 rounded-md border border-[var(--amancay-border)] px-2 py-1 text-right"
                        />
                      </>
                    ) : (
                      <span className={`tabular-nums ${p.stock <= LOW_STOCK ? 'font-semibold text-[var(--amancay-wine)]' : ''}`}>{p.stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleProductActive(p.id)}
                      aria-pressed={p.active}
                      className={`min-h-9 rounded-full px-3 text-xs font-semibold ${
                        p.active ? 'bg-[var(--amancay-emerald)] text-white' : 'border border-[var(--amancay-border)] bg-white text-[var(--ink-muted)]'
                      }`}
                    >
                      {p.active ? 'Publicado' : 'Oculto'}
                      <span className="sr-only">: {p.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing ? (
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditingId(null)} className={secondaryBtn}>
                            Cancelar
                          </button>
                          <button type="button" onClick={() => saveEdit(p)} className={primaryBtn}>
                            Guardar
                          </button>
                        </div>
                        {editError && (
                          <p role="alert" className="text-xs text-[var(--amancay-wine)]">
                            {editError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={() => startEdit(p)} className={secondaryBtn}>
                        Editar<span className="sr-only"> {p.name}</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewProductDialog open={isNewOpen} onClose={() => setIsNewOpen(false)} />
    </>
  );
}

function NewProductDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProduct } = useStore();
  const ids = useId();
  const [data, setData] = useState({ name: '', category: 'mates' as ProductCategory, brand: '', description: '', price: '', stock: '', sku: '', imageUrl: '' });
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseArNumber(data.price);
    const stock = parseArNumber(data.stock || '0');
    if (data.name.trim().length < 3) return setError('Escribí el nombre del producto.');
    if (price === null || price <= 0) return setError('El precio tiene que ser un número mayor a 0.');
    if (stock === null || stock < 0 || !Number.isInteger(stock)) return setError('El stock tiene que ser un número entero, 0 o más.');
    addProduct({
      name: data.name.trim(),
      slug: slugify(data.name),
      category: data.category,
      brand: data.brand.trim() || 'Amancay',
      description: data.description.trim(),
      price,
      stock,
      sku: data.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      images: data.imageUrl.trim() ? [data.imageUrl.trim()] : [],
      active: true,
      isNew: true,
    });
    setData({ name: '', category: 'mates', brand: '', description: '', price: '', stock: '', sku: '', imageUrl: '' });
    setError(null);
    onClose();
  };

  const input = (key: keyof typeof data, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${ids}-${key}`} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={`${ids}-${key}`}
        value={data[key]}
        onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
        className={field}
        {...props}
      />
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo producto">
      <form onSubmit={submit} noValidate className="space-y-4">
        {input('name', 'Nombre', { required: true })}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${ids}-category`} className="mb-1 block text-sm font-semibold">
              Rubro
            </label>
            <select
              id={`${ids}-category`}
              value={data.category}
              onChange={(e) => setData((d) => ({ ...d, category: e.target.value as ProductCategory }))}
              className={field}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {input('brand', 'Marca')}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {input('price', 'Precio ($)', { inputMode: 'numeric' })}
          {input('stock', 'Stock', { inputMode: 'numeric' })}
          {input('sku', 'SKU', { spellCheck: false })}
        </div>
        {input('imageUrl', 'URL de la foto', { type: 'url', inputMode: 'url', spellCheck: false, placeholder: 'https://…' })}
        <div>
          <label htmlFor={`${ids}-description`} className="mb-1 block text-sm font-semibold">
            Descripción
          </label>
          <textarea
            id={`${ids}-description`}
            rows={3}
            value={data.description}
            onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
            className={field}
          />
        </div>
        <p role="alert" className="text-sm text-[var(--amancay-wine)]">
          {error}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Cancelar
          </button>
          <button type="submit" className={primaryBtn}>
            Publicar
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// ---------------- Pedidos ----------------

function OrdersTab() {
  const { orders, updateOrderStatus } = useStore();
  if (orders.length === 0) return <p className={card}>Todavía no hay pedidos.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--amancay-border)] bg-white">
      <table className="w-full min-w-[860px] text-left text-sm">
        <caption className="sr-only">Pedidos</caption>
        <thead className="bg-[var(--bg-subtle)]">
          <tr>
            <th scope="col" className="px-4 py-3">Pedido</th>
            <th scope="col" className="px-4 py-3">Fecha</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Entrega</th>
            <th scope="col" className="px-4 py-3">Pago</th>
            <th scope="col" className="px-4 py-3 text-right">Total</th>
            <th scope="col" className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--bg-subtle)]">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3 font-semibold">#{o.orderNumber}</td>
              <td className="px-4 py-3 tabular-nums">{dateFormat.format(new Date(o.createdAt))}</td>
              <td className="px-4 py-3">
                {o.customer.fullName}
                <span className="block text-xs text-[var(--ink-muted)]">{o.customer.phone}</span>
              </td>
              <td className="px-4 py-3">{SHIPPING_LABELS[o.shippingMethod]}</td>
              <td className="px-4 py-3">{PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(o.total)}</td>
              <td className="px-4 py-3">
                <label htmlFor={`status-${o.id}`} className="sr-only">
                  Estado del pedido {o.orderNumber}
                </label>
                <select
                  id={`status-${o.id}`}
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                  className="rounded-md border border-[var(--amancay-border)] bg-white px-2 py-2 text-sm"
                >
                  {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Resumen ----------------

function MetricsTab() {
  const { orders, products } = useStore();
  const paidTotal = orders.filter((o) => o.status !== 'pendiente').reduce((sum, o) => sum + o.total, 0);
  const active = products.filter((p) => p.active);
  const low = lowStockLines(products);

  const kpis = [
    { label: 'Ventas cobradas', value: formatPrice(paidTotal), note: `${orders.length} pedidos en total` },
    { label: 'Productos publicados', value: String(active.length), note: `En ${CATEGORIES.length} rubros` },
    { label: 'Stock bajo', value: String(low.length), note: `Variantes o productos con ${LOW_STOCK} unidades o menos` },
  ];

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <li key={k.label} className={card}>
            <p className="text-sm font-semibold text-[var(--ink-muted)]">{k.label}</p>
            <p className="mt-1 font-display text-4xl tabular-nums">{k.value}</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{k.note}</p>
          </li>
        ))}
      </ul>
      {low.length > 0 && (
        <section aria-labelledby="low-title" className={`${card} space-y-3`}>
          <h2 id="low-title" className="font-display text-2xl">
            Para reponer
          </h2>
          <ul className="divide-y divide-[var(--bg-subtle)]">
            {low.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span>
                  {l.name}
                  <span className="block text-xs text-[var(--ink-muted)]">{l.sku}</span>
                </span>
                <span className="font-semibold tabular-nums text-[var(--amancay-wine)]">{l.stock} u.</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
