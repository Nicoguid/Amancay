import { Store, Bike, Truck, Clock, MessageCircle, TrainFront, Gift, Map as MapIcon, Images, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Vitrina } from '@/components/home/Vitrina';
import { HeroMate } from '@/components/home/HeroMate';
import { MatesShelf, FragranceShelf } from '@/components/home/HomeShelves';
import { StoreMapSketch } from '@/components/home/StoreMapSketch';
import { BrandsTicker } from '@/components/MarqueeTicker';
import { PromoCallout } from '@/components/PromoCallout';
import { Reveal } from '@/components/Reveal';
import { SHIPPING_RATES, STORE, formatPrice, whatsappUrl } from '@/lib/storeConfig';
import { serializeJsonLd, storeJsonLd } from '@/lib/structuredData';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/* Cinta de beneficios (Figma). Solo lo que el local hace hoy: sin plazos ni garantías que nadie confirmó. */
const BENEFITS = [
  { icon: Store, title: 'Retiro sin costo', body: `En ${STORE.address}, a metros del subte B.` },
  { icon: MessageCircle, title: 'Atención por WhatsApp', body: 'Te mandamos fotos del producto que tenemos en el local.' },
  { icon: Gift, title: 'Regalo resuelto', body: 'Combos de perfume y desodorante de la misma línea, en caja.' },
  { icon: Bike, title: 'Envíos', body: 'Moto en CABA y Correo Argentino a todo el país.' },
];

const DELIVERY_OPTIONS = [
  {
    icon: Store,
    title: 'Retiro en el local',
    body: `${STORE.address}, a metros del subte B (Medrano y Carlos Gardel). Te avisamos por WhatsApp cuando el pedido está listo.`,
    price: 'Sin costo',
  },
  {
    icon: Bike,
    title: 'Moto en CABA',
    body: 'Coordinamos día y franja horaria por WhatsApp.',
    price: formatPrice(SHIPPING_RATES.moto_caba),
  },
  {
    icon: Truck,
    title: 'Correo Argentino',
    body: 'A todo el país, con número de seguimiento.',
    price: `Desde ${formatPrice(SHIPPING_RATES.correo_gba)}`,
  },
];

const FAQ = [
  {
    q: '¿Puedo pagar en el local?',
    a: 'Sí. Si elegís retiro en el local, podés pagar en efectivo o con tarjeta al retirar.',
  },
  {
    q: '¿Cuánto sale el envío?',
    a: `Moto en CABA: ${formatPrice(SHIPPING_RATES.moto_caba)}. Correo Argentino: ${formatPrice(SHIPPING_RATES.correo_gba)} a GBA y ${formatPrice(SHIPPING_RATES.correo_interior)} al resto del país. Retirar en el local no tiene costo.`,
  },
  {
    q: '¿Qué medios de pago aceptan?',
    a: 'Mercado Pago y transferencia bancaria. Si retirás en el local, también efectivo o tarjeta. El precio es el mismo con cualquier medio de pago.',
  },
  {
    q: '¿Puedo comprar por WhatsApp?',
    a: `Sí. Armá el carrito y tocá “Pedir por WhatsApp”, o escribinos al ${STORE.whatsappDisplay}.`,
  },
];

const LOCAL_POINTS = [
  'Perfumería, cosmética, bazar y mates en un mismo mostrador.',
  'Comprás online y retirás sin esperar: te avisamos por WhatsApp cuando está listo.',
  '¿Dudás entre dos modelos? Te mandamos fotos del que tenemos en el local.',
];

export default function HomePage() {
  return (
    <div className="flex flex-col bg-[var(--bg-page)] text-[var(--ink-primary)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(storeJsonLd()) }} />

      <HeroMate />
      <Vitrina />

      {/* Cinta de beneficios */}
      <section aria-label="Por qué comprar en Amancay" className="border-b border-[var(--amancay-border)] bg-[var(--bg-subtle)]">
        <ul className="mx-auto grid max-w-[1320px] grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-2 sm:gap-3 sm:px-8 lg:grid-cols-4 lg:px-12">
          {BENEFITS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} index={i} rise={10} className="flex items-start gap-3 rounded-md bg-white/60 p-3">
              <span className="icon-tile">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold leading-snug text-[var(--ink-primary)]">{title}</h2>
                <p className="mt-0.5 text-sm leading-snug text-[var(--ink-muted)]">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <MatesShelf />

      {/* Ayuda del mostrador (Figma: "¿No sabés cuál elegir?") */}
      <section aria-labelledby="ayuda-title" className="bg-[var(--bg-page)] pb-4">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
          <Reveal rise={10} className="flex flex-col gap-4 rounded-lg bg-[var(--bg-sunken)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="icon-tile h-12 w-12">
                <Images className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="ayuda-title" className="font-display text-xl leading-snug sm:text-[22px]">
                  ¿No sabés cuál elegir para regalar o para vos?
                </h2>
                <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  Escribinos y te mandamos fotos de los mates que tenemos en {STORE.address} en este momento.
                </p>
              </div>
            </div>
            <a
              href={whatsappUrl('Hola Amancay, ¿me mandan fotos de los mates que tienen en el local?')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary shrink-0"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Pedir fotos por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </Reveal>
        </div>
      </section>

      <FragranceShelf />

      {/* Bazar: el local lo tiene, pero todavía no está cargado en la tienda online. */}
      <section id="bazar" aria-labelledby="bazar-title" className="bg-[var(--bg-page)] pb-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
          <Reveal rise={10} className="flex flex-col gap-4 rounded-lg border border-[var(--amancay-border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="icon-tile h-12 w-12">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">Bazar</p>
                <h2 id="bazar-title" className="mt-1 font-display text-xl leading-snug sm:text-[22px]">
                  En el local también hay bazar
                </h2>
                <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  Todavía no está en la tienda online. Escribinos y te contamos qué hay hoy en {STORE.address}.
                </p>
              </div>
            </div>
            <a
              href={whatsappUrl('Hola Amancay, ¿qué tienen de bazar en el local?')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary shrink-0"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Consultar por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </Reveal>
        </div>
      </section>

      <PromoCallout />

      {/* El local */}
      <section id="el-local" aria-labelledby="local-title" className="bg-[var(--bg-subtle)] py-14 sm:py-20">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-6 px-4 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:px-12">
          <Reveal rise={18} className="card-rest flex flex-col justify-center rounded-lg bg-white p-7 sm:p-10">
            <p className="eyebrow eyebrow-rule">El local</p>
            <h2 id="local-title" className="mt-3 font-display text-[30px] leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
              Un comercio de barrio sobre Avenida Corrientes.
            </h2>
            <p className="mt-5 max-w-[36rem] text-[17px] leading-[1.7] text-[var(--ink-muted)]">
              Amancay es un local a la calle en Almagro, a metros del subte B. La tienda online es el mismo mostrador: los mismos
              productos, los mismos precios y la misma atención, para que sepas si hay y cuánto sale antes de venir.
            </p>
            <ul className="mt-7 space-y-3.5">
              {LOCAL_POINTS.map((point) => (
                <li key={point} className="flex gap-3.5 text-base leading-relaxed">
                  <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rotate-45 bg-[var(--brand-gold)]" />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal rise={18} index={1} className="card-rest overflow-hidden rounded-lg bg-white">
            <StoreMapSketch />
            <div className="space-y-5 p-6 sm:p-8">
              <h3 className="font-display text-2xl">Cómo llegar</h3>
              <dl className="grid grid-cols-1 gap-4 text-[15px] sm:grid-cols-2">
                <div className="flex gap-3">
                  <dt>
                    <TrainFront className="mt-0.5 h-5 w-5 text-[var(--ink-gold)]" aria-hidden="true" />
                    <span className="sr-only">Transporte</span>
                  </dt>
                  <dd className="text-[var(--ink-muted)]">
                    <span className="block font-semibold text-[var(--ink-primary)]">
                      {STORE.address}, {STORE.neighborhood}
                    </span>
                    {STORE.transit}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt>
                    <Clock className="mt-0.5 h-5 w-5 text-[var(--ink-gold)]" aria-hidden="true" />
                    <span className="sr-only">Horarios</span>
                  </dt>
                  <dd>
                    <ul className="space-y-0.5">
                      {STORE.hours.map((h) => (
                        <li key={h.days}>
                          <span className="font-semibold">{h.days}</span>{' '}
                          <span className="tabular-nums text-[var(--ink-muted)]">{h.time}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-3 border-t border-[var(--amancay-border)] pt-5">
                <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
                  <MapIcon className="h-4 w-4" aria-hidden="true" />
                  Abrir en Google Maps
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
                <a
                  href={whatsappUrl('Hola Amancay, quiero pasar a retirar por el local.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Avisar que paso a retirar
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="como-comprar" aria-labelledby="entrega-title" className="bg-[var(--bg-page)] py-14 sm:py-20">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
          <Reveal>
            <p className="eyebrow eyebrow-rule">Retiro y envíos</p>
            <h2 id="entrega-title" className="mb-8 mt-2 max-w-2xl font-display text-[30px] leading-tight tracking-[-0.02em] sm:text-[36px]">
              Retiralo en el local o te lo mandamos
            </h2>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {DELIVERY_OPTIONS.map(({ icon: Icon, title, body, price }, i) => (
              <Reveal
                as="li"
                key={title}
                index={i}
                rise={16}
                className={`card-rest flex flex-col gap-3 rounded-lg bg-white p-6 sm:p-7 ${i === 0 ? 'ring-2 ring-[var(--brand-gold)]' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`icon-tile h-12 w-12 ${i === 0 ? '' : 'bg-[var(--chip)] text-[var(--ink-primary)]'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {i === 0 && <span className="tag tag-gold">La opción del barrio</span>}
                </div>
                <h3 className="font-display text-[22px]">{title}</h3>
                <p className="leading-relaxed text-[var(--ink-muted)]">{body}</p>
                <p className={`mt-auto pt-2 text-[17px] font-bold tabular-nums ${i === 0 ? 'text-[var(--brand-olive)]' : 'text-[var(--ink-primary)]'}`}>
                  {price}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <BrandsTicker />

      <section aria-labelledby="faq-title" className="bg-white py-14 sm:py-20">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-4 sm:px-8 lg:grid-cols-12 lg:px-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow eyebrow-rule">Atención del local</p>
            <h2 id="faq-title" className="mt-2 font-display text-[30px] leading-tight tracking-[-0.02em] sm:text-[36px]">
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-[var(--ink-muted)]">
              ¿No está tu duda? Escribinos al{' '}
              <a href={whatsappUrl('Hola Amancay, tengo una consulta.')} className="link-brass whitespace-nowrap" target="_blank" rel="noopener noreferrer">
                {STORE.whatsappDisplay}
              </a>
              .
            </p>
          </Reveal>
          <Reveal index={1} className="space-y-2.5 lg:col-span-8">
            {FAQ.map((item) => (
              <details key={item.q} className="accordion group rounded-lg bg-[var(--bg-subtle)] px-5 open:bg-[var(--bg-sunken)]">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-display text-lg sm:text-xl [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--ink-primary)] transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-45"
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 pr-10 leading-relaxed text-[var(--ink-muted)]">{item.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
