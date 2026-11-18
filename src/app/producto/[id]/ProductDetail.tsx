'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShoppingBag, Check, CreditCard, Truck, Store, MessageCircle, Minus, Plus, Bike, Map as MapIcon, MapPin } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useStore, availableStock } from '@/context/StoreContext';
import { ProductCard, fragranceNotes } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { SaveButton } from '@/components/SaveButton';
import { Reveal } from '@/components/Reveal';
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
  waText,
} from '@/lib/storeConfig';
import { categoryInfo, categoryLabel } from '@/lib/categories';
import { legalPath } from '@/lib/legal';

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

/** Notas de la ficha que ya se muestran en la pirámide olfativa. */
const NOTE_KEYS = ['Notas de salida', 'Notas de corazón', 'Notas de fondo'];

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
  // En celular, cuando el botón de agregar sale de la pantalla aparece una barra fija con precio y botón.
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
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
        <Link href={`/catalogo?rubro=${product.category}`} className="link-brass">
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
  const notes = fragranceNotes(product);
  const specs = Object.entries(product.specifications ?? {}).filter(([key]) => notes.length === 0 || !NOTE_KEYS.includes(key));
  const preCured = product.specifications?.['Terminación'] === 'Curado en horno';
  const whatsappHref = whatsappUrl(
    `Hola Amancay, quiero consultar por ${waText(product.name)}${variant ? ` (${waText(variant.name)})` : ''}, ${formatPrice(price)}.`
  );


  /*
   * Lo que va al lado de la foto (pedido de la dueña, 17/11/2026):
   * fragancias -> pirámide olfativa (sin "Sobre este producto" ni ficha);
   * mates y bombillas -> ficha del producto.
   * Se dibuja dos veces (escritorio y celular), por eso los id llevan sufijo.
   */
  const isFragrance = ['perfumes', 'desodorantes', 'combos'].includes(product.category);
  const besidePhoto = (where: 'lg' | 'sm') => {
    if (isFragrance) {
      if (notes.length === 0) return null;
      return (
        <section aria-labelledby={`notas-title-${where}`} className="card-rest rounded-lg bg-white p-5 sm:p-6">
          <p className="eyebrow">Cómo huele</p>
          <h2 id={`notas-title-${where}`} className="mt-1.5 font-display text-2xl leading-tight sm:text-[26px]">
            Pirámide olfativa
          </h2>
          <p className="mt-1.5 text-[15px] text-[var(--ink-muted)]">
            La salida es lo primero que se siente, el corazón aparece a los minutos y el fondo es lo que queda en la piel.
          </p>
          <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {notes.map((note, i) => (
              <li key={note.label} className={`flex flex-col gap-3 rounded-md p-4 ${i === 1 ? 'bg-[var(--bg-sand)]' : 'bg-[var(--bg-subtle)]'}`}>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-gold)]">{note.label}</p>
                <p className="-mt-1 font-display text-xl leading-snug">{note.value}</p>
                <p className="mt-auto border-t border-[var(--amancay-border)] pt-3 text-sm text-[var(--ink-muted)]">
                  {i === 0 ? 'Lo que se siente al aplicarlo.' : i === 1 ? 'El carácter de la fragancia.' : 'Lo que queda al final del día.'}
                </p>
              </li>
            ))}
          </ol>
        </section>
      );
    }
    return (
      <section aria-labelledby={`ficha-title-${where}`} className="card-rest rounded-lg bg-white p-5 sm:p-6">
        <p className="eyebrow">Ficha del producto</p>
        <h2 id={`ficha-title-${where}`} className="mb-4 mt-1.5 font-display text-2xl sm:text-[26px]">
          {product.category === 'mates' || product.category === 'bombillas' ? 'Materiales y medidas' : 'Detalles'}
        </h2>
        {specs.length > 0 ? (
          <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {specs.map(([key, val]) => (
              <div key={key} className="rounded-btn bg-[var(--bg-subtle)] px-4 py-3">
                <dt className="text-[13px] font-semibold text-[var(--ink-muted)]">{key}</dt>
                <dd className="mt-0.5 font-semibold">{val}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-[var(--ink-muted)]">Para medidas o detalles, escribinos por WhatsApp.</p>
        )}
      </section>
    );
  };

  const faq = [
    {
      q: '¿Puedo verlo antes de comprar?',
      a: `Sí. Podés pasar por ${STORE.address} en el horario del local, o escribirnos por WhatsApp y te mandamos fotos del que tenemos.`,
    },
    {
      q: '¿Cómo lo retiro?',
      a: `Elegí “Retiro en el local” al finalizar la compra. Te avisamos por WhatsApp cuando el pedido está listo para pasar a buscarlo. No tiene costo.`,
    },
    ...(product.category === 'mates'
      ? [
          {
            q: '¿Viene curado?',
            a: preCured
              ? 'Sí: este modelo viene curado en horno y está listo para usar.'
              : 'No: hay que curarlo antes del primer mate. Más arriba, en “Cómo curarlo”, está el paso a paso.',
          },
        ]
      : []),
    {
      q: '¿Puedo cambiarlo?',
      a: 'Las condiciones de cambio y devolución están en la política de cambios. Si compraste online, además tenés el botón de arrepentimiento.',
      link: { href: legalPath('cambios-y-devoluciones'), label: 'Ver cambios y devoluciones' },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-20 pt-4 text-[var(--ink-primary)] sm:pt-6">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        <nav aria-label="Ruta de navegación" className="enter mb-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)] sm:mb-5" style={{ '--i': 0, '--rise': '0px' } as CSSProperties}>
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-[var(--ink-primary)] hover:underline">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/catalogo?rubro=${product.category}`} className="inline-flex min-h-11 items-center hover:text-[var(--ink-primary)] hover:underline">
                {categoryLabel(product.category)}
              </Link>
            </li>
            <li aria-hidden="true" className="hidden sm:block">
              /
            </li>
            <li aria-current="page" className="hidden max-w-xs truncate text-[var(--ink-primary)] sm:block">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Galería */}
          <div className="enter space-y-3 lg:sticky lg:top-36 lg:col-span-7" style={{ '--i': 1, '--rise': '18px' } as CSSProperties}>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--bg-sunken)] sm:aspect-[5/4]">
              <ProductImage
                key={imageIndex}
                src={images[imageIndex]}
                alt={images.length > 1 ? `${product.name}, foto ${imageIndex + 1} de ${images.length}` : product.name}
                width={800}
                height={800}
                priority
                className={`photo-on-linen h-full w-full object-contain p-8 sm:p-14 ${imageIndex > 0 ? 'swap-in' : ''}`}
              />
              {preCured && (
                <p className="tag tag-gold absolute left-3 top-3 sm:left-4 sm:top-4">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Ya curado: listo para usar
                </p>
              )}
              <SaveButton productId={product.id} productName={product.name} className="absolute right-2 top-2 sm:right-3 sm:top-3" />
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
                      className={`tap-interactive block h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-[var(--bg-sunken)] ${
                        imageIndex === idx ? 'border-[var(--ink-gold)]' : 'border-transparent hover:border-[var(--brand-brass)]'
                      }`}
                    >
                      <ProductImage src={img} alt="" width={80} height={80} className="photo-on-linen h-full w-full object-contain p-2" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* En escritorio, el espacio debajo de la foto lo ocupa la ficha (mates y bombillas) o la pirámide (fragancias). */}
            <div className="hidden lg:block">{besidePhoto('lg')}</div>
                    </div>

          {/* Datos y compra */}
          <div className="enter rounded-lg bg-white p-5 shadow-[var(--shadow-rest)] sm:p-7 lg:col-span-5" style={{ '--i': 2 } as CSSProperties}>
            <p
              className={`flex items-start gap-2 rounded-btn px-3 py-2 text-sm font-semibold ${
                stock > 0 ? 'bg-[var(--brand-gold)] text-[var(--ink-on-gold)]' : 'bg-[var(--chip)] text-[var(--ink-muted)]'
              }`}
            >
              <Store className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {stock > 0 ? `${stockMessage}: retiralo sin costo en ${STORE.address}.` : 'Sin stock por ahora. Escribinos y te avisamos cuando vuelva a entrar.'}
              </span>
            </p>

            <p translate="no" className="eyebrow mt-5">
              {product.brand}
            </p>
            <h1 className="mt-1.5 font-display text-[28px] leading-[1.15] tracking-[-0.02em] sm:text-[34px]">{product.name}</h1>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">SKU {variant ? variant.sku : product.sku}</p>

            <div className="mt-5 space-y-2">
              <p className="flex flex-wrap items-baseline gap-3">
                <span key={price} className="swap-in font-display text-[44px] leading-none tabular-nums tracking-[-0.02em]">
                  {formatPrice(price)}
                </span>
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
                <p className="flex flex-wrap items-center gap-x-2 text-[15px] text-[var(--ink-muted)]">
                  <CreditCard className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                  <span>
                    {PROMO.installments} cuotas de {formatPrice(price / PROMO.installments)} con Galicia · CFTEA {PROMO_CFTEA}
                  </span>
                  <button type="button" onClick={() => setIsFinancingOpen(true)} aria-haspopup="dialog" className="link-brass min-h-9">
                    Ver medios de pago
                  </button>
                </p>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-[var(--ink-muted)]">{product.description}</p>

            {variants.length > 1 && (
              <fieldset className="mt-6">
                <legend className="mb-2.5 flex w-full items-center justify-between font-semibold">
                  <span>Elegí {categoryInfo(product.category).variantNoun === 'tamaño' ? 'el tamaño' : 'una opción'}</span>
                  <span className="text-[13px] font-semibold text-[var(--ink-gold)]">{variants.length} opciones</span>
                </legend>
                <div className="space-y-2">
                  {variants.map((v) => {
                    const selected = v.id === variantId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        aria-pressed={selected}
                        disabled={v.stock <= 0}
                        className={`tap-interactive flex min-h-14 w-full items-center gap-3 rounded-btn px-3.5 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                          selected ? 'bg-[var(--brand-espresso)] text-white' : 'bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:bg-[var(--bg-sunken)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                            selected ? 'bg-[var(--brand-gold)] text-[var(--ink-on-gold)]' : 'bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                        <span className="flex-1 font-semibold">
                          {v.name}
                          {v.stock <= 0 && <span className="ml-2 font-normal">(sin stock)</span>}
                        </span>
                        <span className="font-bold tabular-nums">{formatPrice(v.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div ref={buyRef} className="mt-6 space-y-2.5">
              {stock > 0 && (
                <div className="flex items-stretch gap-2.5">
                  <div className="flex items-center rounded-btn bg-[var(--bg-subtle)]" role="group" aria-label="Cantidad">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                      className="tap-interactive flex h-13 w-11 items-center justify-center rounded-btn hover:bg-[var(--bg-sunken)] disabled:opacity-40"
                      aria-label="Restar una unidad"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="w-7 text-center font-bold tabular-nums" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(stock, qty + 1))}
                      disabled={qty >= stock}
                      className="tap-interactive flex h-13 w-11 items-center justify-center rounded-btn hover:bg-[var(--bg-sunken)] disabled:opacity-40"
                      aria-label="Sumar una unidad"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`btn btn-lg flex-1 px-3 sm:px-6 ${addStatus === 'added' ? 'bg-[var(--brand-olive)] text-white' : 'btn-primary'}`}
                  >
                    {addStatus === 'added' ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                    <span>
                      {addStatus === 'added' ? 'Agregado al carrito' : 'Agregar al carrito'}
                      {addStatus !== 'added' && <span className="hidden tabular-nums sm:inline"> · {formatPrice(price * qty)}</span>}
                    </span>
                  </button>
                </div>
              )}
              <p role="status" className="text-sm text-[var(--amancay-wine)] empty:hidden">
                {addStatus === 'no-stock' ? 'Ya tenés en el carrito todas las unidades disponibles.' : ''}
                <span className="sr-only">{addStatus === 'added' ? `${product.name} agregado al carrito.` : ''}</span>
              </p>
              {addStatus === 'added' && (
                <Link href="/carrito" className="pop-in flex min-h-11 items-center justify-center gap-2 rounded-btn bg-[var(--brand-olive-wash)] text-sm font-semibold text-[var(--brand-olive)]">
                  Ver el carrito y elegir la entrega
                </Link>
              )}

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-whatsapp">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Consultar por WhatsApp</span>
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
                <SaveButton productId={product.id} productName={product.name} variant="text" className="btn-lg" />
              </div>
              <p className="text-center text-sm text-[var(--ink-muted)]">¿Querés verlo antes? Te mandamos fotos del que tenemos en el local.</p>
            </div>

            {/* Retiro y envíos */}
            <section aria-labelledby="entrega-ficha" className="mt-7 border-t border-[var(--amancay-border)] pt-6">
              <h2 id="entrega-ficha" className="eyebrow">
                Retiro y envíos
              </h2>
              <ul className="mt-3 space-y-2">
                {[
                  { icon: Store, title: 'Retiro en el local', detail: `${STORE.address}. Te avisamos por WhatsApp cuando está listo.`, price: 'Sin costo', free: true },
                  { icon: Bike, title: 'Moto en CABA', detail: 'Coordinamos día y franja horaria por WhatsApp.', price: formatPrice(SHIPPING_RATES.moto_caba), free: false },
                  { icon: Truck, title: 'Correo Argentino', detail: 'A todo el país, con número de seguimiento.', price: `Desde ${formatPrice(SHIPPING_RATES.correo_gba)}`, free: false },
                ].map(({ icon: Icon, title, detail, price: cost, free }) => (
                  <li key={title} className="flex items-start gap-3 rounded-btn bg-[var(--bg-subtle)] p-3.5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center justify-between gap-x-3 font-semibold">
                        {title}
                        <span className={free ? 'tag tag-gold' : 'text-sm tabular-nums text-[var(--ink-secondary)]'}>{cost}</span>
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-[var(--ink-muted)]">{detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleCalculateShipping} className="mt-4 space-y-2.5">
                <label htmlFor="shipping-cp" className="block text-sm font-semibold">
                  Calculá el envío a tu código postal
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
                    placeholder="Ej.: 1176…"
                    className="field min-w-0 flex-1"
                  />
                  <button type="submit" className="btn btn-outline">
                    Calcular
                  </button>
                </div>
                <div aria-live="polite">
                  {shippingResult && (
                    <div className="pop-in space-y-1 rounded-btn border border-[var(--amancay-border)] bg-[var(--bg-page)] p-3 text-sm">
                      <p className="flex items-center justify-between font-semibold">
                        <span>{shippingResult.title}</span>
                        {shippingResult.price && <span className="tabular-nums">{shippingResult.price}</span>}
                      </p>
                      <p className="text-[var(--ink-muted)]">{shippingResult.note}</p>
                    </div>
                  )}
                </div>
              </form>
            </section>
          </div>
        </div>

        {/* En celular, la ficha o la pirámide van después de la compra. */}
        <div className="mt-8 lg:hidden">{besidePhoto('sm')}</div>

        {/* Cuidados y preguntas */}
        <div className={`mt-14 grid grid-cols-1 gap-5 sm:mt-20 ${product.curadoOGuia ? 'lg:grid-cols-2' : ''}`}>
          {product.curadoOGuia && (
            <Reveal as="section" aria-labelledby="guia-title" rise={16} className="rounded-lg bg-[var(--bg-sunken)] p-6 sm:p-8">
              <p className="eyebrow">Antes del primer uso</p>
              <h2 id="guia-title" className="mb-4 mt-2 font-display text-2xl sm:text-[28px]">
                {product.category === 'mates' ? 'Cómo curarlo' : 'Cuidados'}
              </h2>
              <p className="max-w-prose text-[17px] leading-[1.7] text-[var(--ink-secondary)]">{product.curadoOGuia}</p>
            </Reveal>
          )}
          <Reveal as="section" aria-labelledby="faq-ficha" rise={16} index={1} className="rounded-lg bg-[var(--bg-subtle)] p-6 sm:p-8">
            <ProductFaq faq={faq} />
          </Reveal>
        </div>

        {/* Cómo llegar */}
        <Reveal rise={10} className="mt-5 flex flex-col gap-4 rounded-lg bg-[var(--bg-sand)] p-5 text-[var(--ink-primary)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="icon-tile h-12 w-12">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl">¿Estás cerca de Corrientes y Medrano?</h2>
              <p className="mt-1 text-[15px] text-[var(--ink-muted)]">
                Pasá por el local a verlo: {STORE.address}, a metros del subte B (estaciones Medrano y Carlos Gardel).
              </p>
            </div>
          </div>
          <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            Abrir en Google Maps
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </Reveal>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-14 sm:mt-20">
            <Reveal className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-rule">Del mismo rubro</p>
                <h2 id="related-title" className="mt-2 font-display text-[28px] tracking-[-0.02em] sm:text-[34px]">
                  Más {categoryLabel(product.category).toLowerCase()}
                </h2>
              </div>
              <Link href={`/catalogo?rubro=${product.category}`} className="link-brass inline-flex min-h-11 items-center">
                Ver todos
              </Link>
            </Reveal>
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {related.map((rel, i) => (
                <Reveal as="li" key={rel.id} index={i} rise={16}>
                  <ProductCard product={rel} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Barra de compra fija (celular): aparece cuando el botón principal quedó arriba de la pantalla. */}
      {stock > 0 && (
        <div
          // inert la saca del foco y del lector de pantalla mientras está escondida (no hace falta aria-hidden).
          inert={!showStickyBar}
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-[var(--amancay-border)] bg-white/95 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_-14px_rgba(29,15,9,0.4)] backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out)] lg:hidden ${
            showStickyBar ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-[var(--ink-muted)]">
                {product.name}
                {variant ? ` · ${variant.name}` : ''}
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">{formatPrice(price * qty)}</p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={`btn btn-lg shrink-0 ${addStatus === 'added' ? 'bg-[var(--brand-olive)] text-white' : 'btn-primary'}`}
            >
              {addStatus === 'added' ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
              {addStatus === 'added' ? 'Agregado' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      <Dialog open={isFinancingOpen} onClose={() => setIsFinancingOpen(false)} title="Medios de pago">
        <ul className="space-y-3">
          {promoActive && (
            <li className="rounded-btn bg-[var(--bg-subtle)] p-4">
              <p className="font-semibold">{PROMO.title}</p>
              <p className="font-semibold tabular-nums text-[var(--brand-olive)]">
                {PROMO.installments} cuotas de {formatPrice(price / PROMO.installments)}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {PROMO.detail} Hasta el {PROMO_UNTIL_LABEL}. Precio contado {formatPrice(price)}. Costo financiero total efectivo anual
                (CFTEA): {PROMO_CFTEA}.
              </p>
            </li>
          )}
          <li className="rounded-btn bg-[var(--bg-subtle)] p-4">
            <p className="font-semibold">Transferencia</p>
            <p className="text-sm text-[var(--ink-muted)]">Al confirmar el pedido te mostramos el alias y el CBU.</p>
          </li>
          <li className="rounded-btn bg-[var(--bg-subtle)] p-4">
            <p className="font-semibold">Mercado Pago</p>
            <p className="text-sm text-[var(--ink-muted)]">Tarjetas en 1 pago o con las cuotas que ofrezca tu banco.</p>
          </li>
          <li className="rounded-btn bg-[var(--bg-subtle)] p-4">
            <p className="font-semibold">En el local</p>
            <p className="text-sm text-[var(--ink-muted)]">Efectivo o tarjeta al retirar en {STORE.address}.</p>
          </li>
        </ul>
      </Dialog>
    </div>
  );
}

function ProductFaq({ faq }: { faq: { q: string; a: string; link?: { href: string; label: string } }[] }) {
  return (
    <>
      <p className="eyebrow">Atención del local</p>
      <h2 id="faq-ficha" className="mb-4 mt-2 font-display text-2xl sm:text-[28px]">
        Preguntas frecuentes
      </h2>
      <div className="space-y-2">
        {faq.map((item) => (
          <details key={item.q} className="accordion group rounded-btn bg-white px-4">
            <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-45"
              >
                <Plus className="h-4 w-4" />
              </span>
            </summary>
            <p className="pb-4 pr-8 leading-relaxed text-[var(--ink-muted)]">
              {item.a}
              {item.link && (
                <>
                  {' '}
                  <Link href={item.link.href} className="link-brass">
                    {item.link.label}
                  </Link>
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </>
  );
}
