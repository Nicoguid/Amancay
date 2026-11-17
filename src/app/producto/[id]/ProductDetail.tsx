'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag, Check, CreditCard, Truck, Store, MessageCircle, ArrowLeft, Minus, Plus } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useStore, availableStock } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { Dialog } from '@/components/Dialog';
import { usePromoActive } from '@/lib/usePromo';
import {
  PROMO,
  PROMO_UNTIL_LABEL,
  SHIPPING_RATES,
  STORE,
  formatPrice,
  parsePostalCode,
  postalZone,
  TAX,
  netPrice,
  PROMO_CFTEA,
  whatsappUrl,
} from '@/lib/storeConfig';
import { categoryInfo, categoryLabel } from '@/lib/categories';


export function ProductDetail({ id }: { id: string }) {
  const { products, isHydrated } = useStore();
  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    // Un producto cargado desde el panel solo existe en el navegador: esperamos a leerlo.
    if (!isHydrated) return <p className="p-16 text-center text-[var(--ink-muted)]">Cargando producto…</p>;
    notFound();
  }

  return <ProductView key={product.id} product={product} products={products} />;
}

function ProductView({ product, products }: { product: Product; products: Product[] }) {
  const { addToCart } = useStore();
  const promoActive = usePromoActive();

  const variants = product.variants ?? [];
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable?.id);
  const variant = variants.find((v) => v.id === variantId);

  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [addStatus, setAddStatus] = useState<'idle' | 'added' | 'no-stock'>('idle');
  const [postalCode, setPostalCode] = useState('');
  const [shippingResult, setShippingResult] = useState<{ title: string; price?: string; note: string } | null>(null);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const price = variant ? variant.price : product.price;
  const stock = availableStock(product, variant);
  const qty = Math.max(1, Math.min(quantity, stock));
  const images = product.images.length ? product.images : [''];

  if (!product.active) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-3 font-display text-3xl">{product.name}</h1>
        <p className="mb-6 text-[var(--ink-muted)]">Este producto no está disponible en este momento.</p>
        <Link href={`/catalogo?rubro=${product.category}`} className="font-semibold text-[var(--ink-accent)] underline">
          Ver otros {categoryLabel(product.category).toLowerCase()}
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    const added = addToCart(product, qty, variant);
    setAddStatus(added > 0 ? 'added' : 'no-stock');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAddStatus('idle'), 2500);
  };

  const handleCalculateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const cp = parsePostalCode(postalCode);
    if (cp === null) {
      setShippingResult({ title: 'Código postal no válido', note: 'Escribí los 4 números del código postal, por ejemplo 1176.' });
      return;
    }
    const zone = postalZone(cp);
    if (zone === 'caba') {
      setShippingResult({
        title: 'Moto en CABA',
        price: formatPrice(SHIPPING_RATES.moto_caba),
        note: `También podés retirar sin costo en ${STORE.address}.`,
      });
    } else {
      setShippingResult({
        title: zone === 'gba' ? 'Correo Argentino a GBA' : 'Correo Argentino al interior',
        price: formatPrice(zone === 'gba' ? SHIPPING_RATES.correo_gba : SHIPPING_RATES.correo_interior),
        note: 'Con número de seguimiento.',
      });
    }
  };

  const related = products.filter((p) => p.id !== product.id && p.active && p.category === product.category).slice(0, 4);
  const stockMessage =
    stock <= 0 ? 'Sin stock por ahora' : stock <= 5 ? `Quedan ${stock} ${stock === 1 ? 'unidad' : 'unidades'}` : 'Hay stock';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] py-8 pb-24 text-[var(--ink-primary)] sm:py-10">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-[var(--ink-muted)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-[var(--brand-leather)] hover:underline">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/catalogo?rubro=${product.category}`} className="inline-flex min-h-11 items-center hover:text-[var(--brand-leather)] hover:underline">
                {categoryLabel(product.category)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="max-w-xs truncate font-semibold text-[var(--ink-primary)]">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mb-16">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
            {/* Galería */}
            <div className="space-y-4 lg:sticky lg:top-40 lg:col-span-7">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-subtle)]">
                <ProductImage
                  src={images[imageIndex]}
                  alt={images.length > 1 ? `${product.name}, foto ${imageIndex + 1} de ${images.length}` : product.name}
                  width={800}
                  height={800}
                  priority
                  className="photo-on-linen h-full w-full object-contain p-10 sm:p-16"
                />
                {product.specifications?.['Terminación'] === 'Curado en horno' && (
                  <p className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-brass)] bg-[var(--bg-page)] px-3.5 py-1.5 text-[13px] font-semibold">
                    <Check className="h-3.5 w-3.5 text-[var(--brand-olive)]" aria-hidden="true" />
                    Ya curado: listo para usar
                  </p>
                )}
              </div>
              {images.length > 1 && (
                <ul className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => setImageIndex(idx)}
                        aria-label={`Ver foto ${idx + 1} de ${images.length}`}
                        aria-pressed={imageIndex === idx}
                        className={`tap-interactive block h-20 w-20 shrink-0 overflow-hidden rounded border-2 bg-[var(--bg-subtle)] ${
                          imageIndex === idx ? 'border-[var(--brand-leather)]' : 'border-[var(--amancay-border)] hover:border-[var(--brand-brass)]'
                        }`}
                      >
                        <ProductImage src={img} alt="" width={80} height={80} className="photo-on-linen h-full w-full object-contain p-2" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Datos y compra */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <p className="mb-3 text-sm font-semibold text-[var(--brand-leather)]">{product.brand}</p>
                <h1 className="font-display text-[32px] leading-[1.15] sm:text-[40px]">{product.name}</h1>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">SKU {variant ? variant.sku : product.sku}</p>
              </div>

              <div className="space-y-2 border-y border-[var(--amancay-border)] py-5">
                <p className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-[44px] leading-none tabular-nums">{formatPrice(price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && !variant?.priceModifier && (
                    <span className="tabular-nums text-[var(--ink-muted)] line-through">
                      <span className="sr-only">Antes </span>
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </p>
                {TAX.showNetPrice && (
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    Precio sin impuestos nacionales: <span className="tabular-nums">{formatPrice(netPrice(price))}</span>
                  </p>
                )}
                {promoActive && (
                  <p className="flex flex-wrap items-center gap-x-2 text-[var(--ink-muted)]">
                    <CreditCard className="h-4 w-4 text-[var(--ink-accent)]" aria-hidden="true" />
                    <span>
                      {PROMO.installments} cuotas de {formatPrice(price / PROMO.installments)} con Galicia · CFTEA {PROMO_CFTEA}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFinancingOpen(true)}
                      aria-haspopup="dialog"
                      className="font-semibold text-[var(--ink-accent)] underline"
                    >
                      Ver medios de pago
                    </button>
                  </p>
                )}
              </div>

              <p className="leading-relaxed text-[var(--ink-muted)]">{product.description}</p>

              {variants.length > 1 && (
                <fieldset className="space-y-2">
                  <legend className="mb-2 font-semibold">Elegí {categoryInfo(product.category).variantNoun === 'tamaño' ? 'el tamaño' : 'una opción'}</legend>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const selected = v.id === variantId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVariantId(v.id)}
                          aria-pressed={selected}
                          disabled={v.stock <= 0}
                          className={`tap-interactive min-h-11 rounded-full border px-4 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                            selected
                              ? 'border-[var(--brand-leather)] bg-[var(--brand-leather-wash)] text-[var(--brand-leather)] ring-1 ring-[var(--brand-leather)]'
                              : 'border-[var(--amancay-border)] bg-white text-[var(--ink-primary)] hover:border-[var(--brand-brass)]'
                          }`}
                        >
                          {selected && <Check className="mr-1 inline h-4 w-4" aria-hidden="true" />}
                          {v.name}
                          <span className="ml-2 tabular-nums opacity-80">{formatPrice(v.price)}</span>
                          {v.stock <= 0 && <span className="ml-2">(sin stock)</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="space-y-3">
                <p className={`text-sm font-semibold ${stock <= 0 ? 'text-[var(--amancay-wine)]' : 'text-[var(--amancay-emerald)]'}`}>
                  {stockMessage}
                </p>
                {stock > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-[var(--amancay-border)] bg-white" role="group" aria-label="Cantidad">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, qty - 1))}
                        disabled={qty <= 1}
                        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] disabled:opacity-40"
                        aria-label="Restar una unidad"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(stock, qty + 1))}
                        disabled={qty >= stock}
                        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] disabled:opacity-40"
                        aria-label="Sumar una unidad"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`tap-interactive flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 font-semibold text-white shadow-md ${
                        addStatus === 'added' ? 'bg-[var(--brand-olive)]' : 'bg-[var(--brand-leather)] hover:bg-[var(--brand-leather-hover)]'
                      }`}
                    >
                      {addStatus === 'added' ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>
                        {addStatus === 'added' ? 'Agregado al carrito' : 'Agregar al carrito'}
                        {addStatus !== 'added' && <span className="hidden tabular-nums sm:inline"> · {formatPrice(price * qty)}</span>}
                      </span>
                    </button>
                  </div>
                )}
                <p role="status" className="text-sm text-[var(--amancay-wine)]">
                  {addStatus === 'no-stock' ? 'Ya tenés en el carrito todas las unidades disponibles.' : ''}
                  <span className="sr-only">{addStatus === 'added' ? `${product.name} agregado al carrito.` : ''}</span>
                </p>

                <a
                  href={whatsappUrl(
                    `Hola Amancay, quiero consultar por ${product.name}${variant ? ` (${variant.name})` : ''}, ${formatPrice(price)}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-interactive flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--brand-olive)] px-4 font-semibold text-[var(--brand-olive)] hover:bg-[var(--brand-olive-wash)]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>

              <form onSubmit={handleCalculateShipping} className="space-y-2.5 border-t border-[var(--amancay-border)] pt-5">
                <label htmlFor="shipping-cp" className="flex items-center gap-2 font-semibold">
                  <Truck className="h-4 w-4 text-[var(--ink-accent)]" aria-hidden="true" />
                  Calculá el envío
                </label>
                <div className="flex gap-2">
                  <input
                    id="shipping-cp"
                    name="postal-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Código postal, ej.: 1176"
                    className="min-w-0 flex-1 rounded border border-[var(--amancay-border)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--brand-leather)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-leather)]"
                  />
                  <button
                    type="submit"
                    className="tap-interactive min-h-11 rounded-full border-[1.5px] border-[var(--brand-leather)] px-5 text-sm font-semibold text-[var(--brand-leather)] hover:bg-[var(--brand-leather)] hover:text-white"
                  >
                    Calcular
                  </button>
                </div>
                <div aria-live="polite">
                  {shippingResult && (
                    <div className="space-y-1 rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] p-3 text-sm">
                      <p className="flex items-center justify-between font-semibold">
                        <span>{shippingResult.title}</span>
                        {shippingResult.price && <span className="tabular-nums text-[var(--amancay-emerald)]">{shippingResult.price}</span>}
                      </p>
                      <p className="text-[var(--ink-muted)]">{shippingResult.note}</p>
                    </div>
                  )}
                </div>
              </form>

              <p className="flex items-start gap-2 rounded-lg border border-[var(--brand-brass)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--ink-secondary)]">
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-accent)]" aria-hidden="true" />
                Retiro sin costo en {STORE.address}. Te avisamos por WhatsApp cuando está listo.
              </p>
            </div>
          </div>
        </div>

        {/* Información: secciones abiertas en lugar de pestañas */}
        <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section aria-labelledby="ficha-title" className="card-rest rounded-lg border border-[var(--amancay-border)] bg-white p-6 sm:p-8">
            <h2 id="ficha-title" className="mb-4 font-display text-2xl">
              Ficha técnica
            </h2>
            {product.specifications ? (
              <dl className="divide-y divide-[var(--bg-subtle)]">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-4 py-2.5 text-sm">
                    <dt className="font-semibold text-[var(--ink-muted)]">{key}</dt>
                    <dd className="text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-[var(--ink-muted)]">Para medidas o detalles, escribinos por WhatsApp.</p>
            )}
          </section>
          {product.curadoOGuia && (
            <section aria-labelledby="guia-title" className="frame-double rounded-lg bg-white p-7 sm:p-9">
              <h2 id="guia-title" className="mb-4 font-display text-2xl">
                {product.category === 'mates' ? 'Cómo curarlo' : 'Cuidados'}
              </h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">{product.curadoOGuia}</p>
            </section>
          )}
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-title">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="related-title" className="font-display text-[32px]">
                Más {categoryLabel(product.category).toLowerCase()}
              </h2>
              <Link href={`/catalogo?rubro=${product.category}`} className="link-brass">
                Ver todos
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {related.map((rel) => (
                <li key={rel.id}>
                  <ProductCard product={rel} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10">
          <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--ink-accent)] hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al catálogo
          </Link>
        </div>
      </div>

      <Dialog open={isFinancingOpen} onClose={() => setIsFinancingOpen(false)} title="Medios de pago">
        <ul className="space-y-3">
          {promoActive && (
            <li className="rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4">
              <p className="font-semibold">{PROMO.title}</p>
              <p className="tabular-nums text-[var(--amancay-emerald)]">
                {PROMO.installments} cuotas de {formatPrice(price / PROMO.installments)}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {PROMO.detail} Hasta el {PROMO_UNTIL_LABEL}. Precio contado {formatPrice(price)}. Costo financiero total efectivo anual
                (CFTEA): {PROMO_CFTEA}.
              </p>
            </li>
          )}
          <li className="rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4">
            <p className="font-semibold">Transferencia</p>
            <p className="text-sm text-[var(--ink-muted)]">
              Al confirmar el pedido te mostramos el alias y el CBU.
            </p>
          </li>
          <li className="rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4">
            <p className="font-semibold">Mercado Pago</p>
            <p className="text-sm text-[var(--ink-muted)]">Tarjetas en 1 pago o con las cuotas que ofrezca tu banco.</p>
          </li>
          <li className="rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4">
            <p className="font-semibold">En el local</p>
            <p className="text-sm text-[var(--ink-muted)]">Efectivo o tarjeta al retirar en {STORE.address}.</p>
          </li>
        </ul>
      </Dialog>
    </div>
  );
}
