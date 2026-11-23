'use client';

import { useMemo, useState } from 'react';
import { useAdmin } from './AdminDataContext';
import type { Order, Product } from '@/lib/types';
import { PAYMENT_LABELS, SHIPPING_LABELS, formatPrice } from '@/lib/storeConfig';
import { CATEGORIES, categoryLabel } from '@/lib/categories';

/*
 * Resumen del panel. Todo se calcula en el navegador con los pedidos guardados.
 * "Ventas" = pedidos cobrados (cualquier estado menos "pendiente"); "por cobrar" = pendientes.
 * Cada número se compara con el período anterior del mismo largo.
 */

type PeriodId = 'hoy' | '7d' | '30d' | 'mes' | 'mes-anterior' | '90d' | 'todo';
type GroupId = 'dia' | 'semana' | 'mes';

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: 'Últimos 7 días' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'mes-anterior', label: 'Mes anterior' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: 'todo', label: 'Todo' },
];
const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'dia', label: 'Por día' },
  { id: 'semana', label: 'Por semana' },
  { id: 'mes', label: 'Por mes' },
];

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  const dow = (s.getDay() + 6) % 7; // semana de lunes a domingo
  return new Date(s.getTime() - dow * DAY);
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

function rangeFor(period: PeriodId, now: Date, firstOrder: Date): { from: Date; to: Date; prevFrom: Date | null } {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY);
  const back = (days: number) => {
    const from = new Date(tomorrow.getTime() - days * DAY);
    return { from, to: tomorrow, prevFrom: new Date(from.getTime() - days * DAY) };
  };
  switch (period) {
    case 'hoy':
      return back(1);
    case '7d':
      return back(7);
    case '30d':
      return back(30);
    case '90d':
      return back(90);
    case 'mes': {
      const from = startOfMonth(now);
      return { from, to: tomorrow, prevFrom: new Date(from.getFullYear(), from.getMonth() - 1, 1) };
    }
    case 'mes-anterior': {
      const to = startOfMonth(now);
      const from = new Date(to.getFullYear(), to.getMonth() - 1, 1);
      return { from, to, prevFrom: new Date(from.getFullYear(), from.getMonth() - 1, 1) };
    }
    default:
      return { from: startOfDay(firstOrder), to: tomorrow, prevFrom: null };
  }
}

type Totals = { sales: number; orders: number; paidOrders: number; units: number; pending: number; pendingCount: number; shipping: number };

/** Cancelados y reembolsados no son ventas. */
const isVoid = (o: Order) => o.status === 'cancelado' || o.paymentStatus === 'reembolsado';
/** Venta cobrada: ni pendiente ni anulada. */
const isSale = (o: Order) => o.status !== 'pendiente' && !isVoid(o);

function totals(all: Order[]): Totals {
  const orders = all.filter((o) => !isVoid(o));
  const t: Totals = { sales: 0, orders: orders.length, paidOrders: 0, units: 0, pending: 0, pendingCount: 0, shipping: 0 };
  for (const o of orders) {
    if (o.status === 'pendiente') {
      t.pending += o.total;
      t.pendingCount += 1;
      continue;
    }
    t.sales += o.total;
    t.paidOrders += 1;
    t.shipping += o.shippingCost;
    t.units += o.items.reduce((n, i) => n + i.quantity, 0);
  }
  return t;
}

const pctFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0, signDisplay: 'always' });
const numFormat = new Intl.NumberFormat('es-AR');
const dayLabel = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const monthLabel = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

function delta(current: number, previous: number | null) {
  if (previous === null) return null;
  if (previous === 0) return current === 0 ? { text: 'igual que antes', tone: 'flat' as const } : { text: 'sin datos antes', tone: 'flat' as const };
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  return {
    text: rounded === 0 ? 'igual que antes' : `${pctFormat.format(rounded)} % vs. período anterior`,
    tone: rounded > 0 ? ('up' as const) : rounded < 0 ? ('down' as const) : ('flat' as const),
  };
}

const card = 'rounded-xl border border-[var(--amancay-border)] bg-white p-5 sm:p-6';

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`tap-interactive min-h-10 rounded-btn border px-4 text-sm font-semibold ${
            value === o.id
              ? 'border-[var(--brand-olive)] bg-[var(--brand-olive)] text-white'
              : 'border-[var(--amancay-border)] bg-white text-[var(--ink-secondary)] hover:border-[var(--brand-brass)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Barras horizontales de una sola tinta: comparan magnitudes, no identidades. */
function BarList({ title, rows, format }: { title: string; rows: { label: string; value: number; note?: string }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((n, r) => n + r.value, 0);
  return (
    <section className={card} aria-label={title}>
      <h2 className="font-display text-xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">Sin ventas en este período.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold">{r.label}</span>
                <span className="tabular text-[var(--ink-secondary)]">
                  {format(r.value)}
                  <span className="ml-2 text-[var(--ink-muted)]">{total ? Math.round((r.value / total) * 100) : 0} %</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-[var(--bg-subtle)]">
                <div className="h-2 rounded-full bg-[var(--brand-leather)]" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
              {r.note && <p className="mt-1 text-xs text-[var(--ink-muted)]">{r.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SalesChart({ buckets, groupLabel }: { buckets: { label: string; sales: number; orders: number }[]; groupLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.map((b) => b.sales));
  const height = 180;
  const active = hover !== null ? buckets[hover] : null;
  // Etiquetas del eje: como mucho 8, repartidas.
  const step = Math.max(1, Math.ceil(buckets.length / 8));
  return (
    <section className={card} aria-labelledby="chart-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="chart-title" className="font-display text-xl">
          Ventas cobradas {groupLabel.toLowerCase()}
        </h2>
        <p className="min-h-5 text-sm text-[var(--ink-secondary)]" aria-live="polite">
          {active ? (
            <>
              <span className="font-semibold">{active.label}:</span> <span className="tabular">{formatPrice(active.sales)}</span> ·{' '}
              {active.orders} {active.orders === 1 ? 'pedido' : 'pedidos'}
            </>
          ) : (
            <span className="text-[var(--ink-muted)]">Pasá el mouse o el dedo por una barra</span>
          )}
        </p>
      </div>
      {buckets.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-muted)]">Sin pedidos en este período.</p>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-[2px] border-b border-[var(--amancay-border)]" style={{ height }} onMouseLeave={() => setHover(null)}>
            {buckets.map((b, i) => (
              <button
                key={b.label}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
                aria-label={`${b.label}: ${formatPrice(b.sales)}, ${b.orders} pedidos`}
                className="group relative flex h-full min-w-0 flex-1 items-end"
              >
                <span
                  className={`block w-full rounded-t-[4px] ${hover === i ? 'bg-[var(--brand-leather-hover)]' : 'bg-[var(--brand-leather)]'}`}
                  style={{ height: `${Math.max(b.sales > 0 ? 2 : 0, (b.sales / max) * (height - 8))}px` }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex gap-[2px] text-[11px] text-[var(--ink-muted)]" aria-hidden="true">
            {buckets.map((b, i) => (
              <span key={b.label} className="min-w-0 flex-1 truncate text-center">
                {i % step === 0 ? b.label : ''}
              </span>
            ))}
          </div>
          <details className="mt-4 text-sm">
            <summary className="inline-flex min-h-10 cursor-pointer items-center font-semibold text-[var(--brand-leather)]">Ver como tabla</summary>
            <table className="mt-2 w-full text-left">
              <thead className="text-[var(--ink-muted)]">
                <tr>
                  <th scope="col" className="py-1.5 font-semibold">Período</th>
                  <th scope="col" className="py-1.5 text-right font-semibold">Pedidos</th>
                  <th scope="col" className="py-1.5 text-right font-semibold">Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bg-subtle)]">
                {buckets.map((b) => (
                  <tr key={b.label}>
                    <td className="py-1.5">{b.label}</td>
                    <td className="py-1.5 text-right">{b.orders}</td>
                    <td className="py-1.5 text-right">{formatPrice(b.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}

export function MetricsTab({ lowStock, lowStockThreshold }: { lowStock: { key: string; name: string; sku: string; stock: number }[]; lowStockThreshold: number }) {
  const { orders, products, isHydrated } = useAdmin();
  const [period, setPeriod] = useState<PeriodId>('30d');
  const [group, setGroup] = useState<GroupId>('dia');

  const data = useMemo(() => {
    if (!isHydrated) return null;
    const now = new Date();
    const firstOrder = orders.reduce((min, o) => (new Date(o.createdAt) < min ? new Date(o.createdAt) : min), now);
    const { from, to, prevFrom } = rangeFor(period, now, firstOrder);
    const inRange = (o: Order, a: Date, b: Date) => {
      const t = new Date(o.createdAt).getTime();
      return t >= a.getTime() && t < b.getTime();
    };
    const current = orders.filter((o) => inRange(o, from, to));
    const previous = prevFrom ? orders.filter((o) => inRange(o, prevFrom, from)) : null;
    const cur = totals(current);
    const prev = previous ? totals(previous) : null;

    // Serie temporal agrupada
    const keyOf = (d: Date) => (group === 'dia' ? startOfDay(d) : group === 'semana' ? startOfWeek(d) : startOfMonth(d)).getTime();
    const buckets = new Map<number, { sales: number; orders: number }>();
    for (let t = keyOf(from); t < to.getTime(); ) {
      buckets.set(t, { sales: 0, orders: 0 });
      const d = new Date(t);
      t = group === 'dia' ? startOfDay(new Date(t + DAY + 3_600_000)).getTime() : group === 'semana' ? t + 7 * DAY : new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    }
    for (const o of current) {
      if (!isSale(o)) continue;
      const b = buckets.get(keyOf(new Date(o.createdAt)));
      if (b) {
        b.sales += o.total;
        b.orders += 1;
      }
    }
    const series = [...buckets.entries()].map(([t, v]) => {
      const d = new Date(t);
      const label = group === 'mes' ? monthLabel.format(d) : group === 'semana' ? `Sem. ${dayLabel.format(d)}` : dayLabel.format(d);
      return { label, ...v };
    });

    // Desgloses (solo pedidos cobrados)
    const paid = current.filter(isSale);
    const byProduct = new Map<string, Product | undefined>(products.map((p) => [p.id, p]));
    const sumBy = (key: (o: Order) => string) => {
      const m = new Map<string, { value: number; count: number }>();
      for (const o of paid) {
        const k = key(o);
        const e = m.get(k) ?? { value: 0, count: 0 };
        e.value += o.total;
        e.count += 1;
        m.set(k, e);
      }
      return [...m.entries()].sort((a, b) => b[1].value - a[1].value);
    };
    const byPayment = sumBy((o) => PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod).map(([label, e]) => ({
      label,
      value: e.value,
      note: `${e.count} ${e.count === 1 ? 'pedido' : 'pedidos'}`,
    }));
    const byShipping = sumBy((o) => SHIPPING_LABELS[o.shippingMethod]).map(([label, e]) => ({
      label,
      value: e.count,
      note: formatPrice(e.value),
    }));
    const rubro = new Map<string, number>();
    const top = new Map<string, { name: string; units: number; sales: number }>();
    for (const o of paid)
      for (const i of o.items) {
        const p = byProduct.get(i.productId);
        const cat = p ? categoryLabel(p.category) : 'Otros';
        rubro.set(cat, (rubro.get(cat) ?? 0) + i.totalPrice);
        const t = top.get(i.productId) ?? { name: i.productName, units: 0, sales: 0 };
        t.units += i.quantity;
        t.sales += i.totalPrice;
        top.set(i.productId, t);
      }
    const byRubro = CATEGORIES.map((c) => ({ label: c.label, value: rubro.get(c.label) ?? 0 }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const topProducts = [...top.values()].sort((a, b) => b.units - a.units || b.sales - a.sales).slice(0, 5);

    // Día de la semana con más ventas
    const weekday = new Array(7).fill(0) as number[];
    for (const o of paid) weekday[(new Date(o.createdAt).getDay() + 6) % 7] += o.total;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const byWeekday = weekday.map((v, i) => ({ label: dayNames[i], value: v })).filter((r) => r.value > 0);

    const hasSample = current.some((o) => o.isSample);
    return { cur, prev, series, byPayment, byShipping, byRubro, topProducts, byWeekday, hasSample, from, to };
  }, [isHydrated, orders, products, period, group]);

  if (!data) return <p className="text-[var(--ink-muted)]">Cargando el resumen…</p>;
  const { cur, prev } = data;
  const avg = cur.paidOrders ? cur.sales / cur.paidOrders : 0;
  const prevAvg = prev ? (prev.paidOrders ? prev.sales / prev.paidOrders : 0) : null;
  const active = products.filter((p) => p.active);

  const kpis = [
    { label: 'Ventas cobradas', value: formatPrice(cur.sales), change: delta(cur.sales, prev?.sales ?? null) },
    { label: 'Pedidos cobrados', value: numFormat.format(cur.paidOrders), change: delta(cur.paidOrders, prev?.paidOrders ?? null) },
    { label: 'Ticket promedio', value: formatPrice(avg), change: delta(avg, prevAvg) },
    { label: 'Unidades vendidas', value: numFormat.format(cur.units), change: delta(cur.units, prev?.units ?? null) },
    {
      label: 'Por cobrar',
      value: formatPrice(cur.pending),
      change: { text: `${cur.pendingCount} ${cur.pendingCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'}`, tone: 'flat' as const },
    },
    {
      label: 'Envíos cobrados',
      value: formatPrice(cur.shipping),
      change: { text: 'Incluido en las ventas', tone: 'flat' as const },
    },
  ];
  const rangeText =
    period === 'hoy'
      ? 'Hoy'
      : `Del ${dayLabel.format(data.from)} al ${dayLabel.format(new Date(data.to.getTime() - DAY))}`;

  return (
    <div className="space-y-6">
      <div className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Chips label="Período" options={PERIODS} value={period} onChange={setPeriod} />
          <Chips label="Agrupar el gráfico" options={GROUPS} value={group} onChange={setGroup} />
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          {rangeText}.{' '}
          {data.hasSample && 'Incluye pedidos de ejemplo de la demo (EJ-…); desaparecen cuando haya pedidos reales.'}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <li key={k.label} className={card}>
            <p className="text-sm font-semibold text-[var(--ink-muted)]">{k.label}</p>
            <p className="tabular mt-1 font-display text-4xl">{k.value}</p>
            {k.change && (
              <p
                className={`mt-1 text-sm ${
                  k.change.tone === 'up' ? 'text-[var(--brand-olive)]' : k.change.tone === 'down' ? 'text-[var(--amancay-wine)]' : 'text-[var(--ink-muted)]'
                }`}
              >
                {k.change.tone === 'up' ? '▲ ' : k.change.tone === 'down' ? '▼ ' : ''}
                {k.change.text}
              </p>
            )}
          </li>
        ))}
      </ul>

      <SalesChart buckets={data.series} groupLabel={GROUPS.find((g) => g.id === group)!.label} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title="Ventas por rubro" rows={data.byRubro} format={formatPrice} />
        <BarList title="Ventas por medio de pago" rows={data.byPayment} format={formatPrice} />
        <BarList title="Pedidos por forma de entrega" rows={data.byShipping} format={(n) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`} />
        <BarList title="Ventas por día de la semana" rows={data.byWeekday} format={formatPrice} />
      </div>

      <section className={card} aria-labelledby="top-title">
        <h2 id="top-title" className="font-display text-xl">
          Lo más vendido del período
        </h2>
        {data.topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">Sin ventas en este período.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-[var(--ink-muted)]">
              <tr>
                <th scope="col" className="py-2 font-semibold">Producto</th>
                <th scope="col" className="py-2 text-right font-semibold">Unidades</th>
                <th scope="col" className="py-2 text-right font-semibold">Ventas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-subtle)]">
              {data.topProducts.map((t) => (
                <tr key={t.name}>
                  <td className="py-2 pr-3">{t.name}</td>
                  <td className="py-2 text-right">{t.units}</td>
                  <td className="py-2 text-right">{formatPrice(t.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <li className={card}>
          <p className="text-sm font-semibold text-[var(--ink-muted)]">Productos publicados</p>
          <p className="tabular mt-1 font-display text-4xl">{active.length}</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">En {CATEGORIES.length} rubros</p>
        </li>
        <li className={card}>
          <p className="text-sm font-semibold text-[var(--ink-muted)]">Stock bajo</p>
          <p className="tabular mt-1 font-display text-4xl">{lowStock.length}</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Variantes o productos con {lowStockThreshold} unidades o menos</p>
        </li>
      </ul>

      {lowStock.length > 0 && (
        <section aria-labelledby="low-title" className={`${card} space-y-3`}>
          <h2 id="low-title" className="font-display text-xl">
            Para reponer
          </h2>
          <ul className="divide-y divide-[var(--bg-subtle)]">
            {lowStock.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span>
                  {l.name}
                  <span className="block text-xs text-[var(--ink-muted)]">{l.sku}</span>
                </span>
                <span className="tabular font-semibold text-[var(--amancay-wine)]">{l.stock} u.</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
