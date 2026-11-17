import { Store, Bike, Truck, MapPin, Clock, MessageCircle, TrainFront } from 'lucide-react';
import { HeroBannerCarousel } from '@/components/HeroBannerCarousel';
import { CategoryStorySlider } from '@/components/CategoryStorySlider';
import { BrandsTicker } from '@/components/MarqueeTicker';
import { BestSellers } from '@/components/HomeProducts';
import { PromoCallout } from '@/components/PromoCallout';
import type { Metadata } from 'next';
import { SHIPPING_RATES, STORE, formatPrice, whatsappUrl } from '@/lib/storeConfig';
import { serializeJsonLd, storeJsonLd } from '@/lib/structuredData';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

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
    a: 'Mercado Pago y transferencia bancaria. Si retirás en el local, también efectivo o tarjeta.',
  },
  {
    q: '¿Puedo comprar por WhatsApp?',
    a: `Sí. Armá el carrito y tocá “Pedir por WhatsApp”, o escribinos al ${STORE.whatsappDisplay}.`,
  },
];

const MAPS_URL = STORE.mapsUrl;

const LOCAL_POINTS = [
  'Perfumería, cosmética, bazar y mates en un mismo mostrador.',
  'Comprás online y retirás sin esperar: te avisamos por WhatsApp cuando está listo.',
  '¿Dudás entre dos modelos? Te mandamos fotos del que tenemos en el local.',
];

export default function HomePage() {
  return (
    <div className="flex flex-col bg-[var(--bg-page)] text-[var(--ink-primary)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(storeJsonLd()) }} />
      <HeroBannerCarousel />
      <CategoryStorySlider />
      <BestSellers />
      <PromoCallout />

      {/* El local */}
      <section id="el-local" aria-labelledby="local-title" className="bg-[var(--bg-page)] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12">
          <div className="lg:col-span-5">
            <div className="card-rest overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white">
              {/* toldo del local */}
              <div aria-hidden="true" className="awning h-14" />
              <div className="space-y-6 px-7 pb-8 pt-6 sm:px-9">
                <div>
                  <p className="font-display text-[28px] leading-tight text-[var(--brand-leather)]">Amancay</p>
                  <p className="mt-1 text-[15px] text-[var(--ink-muted)]">Local a la calle en Almagro</p>
                </div>
                <dl className="space-y-4 text-[15px]">
                  <div className="flex gap-3">
                    <dt>
                      <MapPin className="mt-0.5 h-5 w-5 text-[var(--brand-leather)]" aria-hidden="true" />
                      <span className="sr-only">Dirección</span>
                    </dt>
                    <dd>
                      <span className="block font-semibold">{STORE.address}</span>
                      <span className="text-[var(--ink-muted)]">{STORE.neighborhood}</span>
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt>
                      <TrainFront className="mt-0.5 h-5 w-5 text-[var(--brand-leather)]" aria-hidden="true" />
                      <span className="sr-only">Cómo llegar</span>
                    </dt>
                    <dd className="text-[var(--ink-muted)]">{STORE.transit}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt>
                      <Clock className="mt-0.5 h-5 w-5 text-[var(--brand-leather)]" aria-hidden="true" />
                      <span className="sr-only">Horarios</span>
                    </dt>
                    <dd>
                      <ul>
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
                <div className="flex flex-wrap gap-3 border-t border-[var(--amancay-border)] pt-6">
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-interactive inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand-leather)] px-6 text-sm font-semibold text-white hover:bg-[var(--brand-leather-hover)]"
                  >
                    Cómo llegar
                  </a>
                  <a
                    href={whatsappUrl('Hola Amancay, quiero hacer una consulta.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--brand-olive)] px-5 text-sm font-semibold text-[var(--brand-olive)] hover:bg-[var(--brand-olive-wash)]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Escribinos
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <h2 id="local-title" className="font-display text-[32px] leading-tight sm:text-[44px]">
              Un comercio de barrio sobre Avenida Corrientes.
            </h2>
            <p className="mt-5 max-w-[38rem] text-lg leading-[1.7] text-[var(--ink-muted)]">
              Amancay es un local de barrio en Almagro, a metros del subte B. La tienda online es el mismo mostrador: los mismos
              productos, los mismos precios y la misma atención, para que sepas si hay y cuánto sale antes de venir.
            </p>
            <ul className="mt-8 space-y-4">
              {LOCAL_POINTS.map((point) => (
                <li key={point} className="flex gap-4 text-[17px] leading-relaxed">
                  <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rotate-45 bg-[var(--brand-brass)]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="como-comprar"
        aria-labelledby="entrega-title"
        className="border-y border-[var(--amancay-border)] bg-[var(--bg-subtle)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <h2 id="entrega-title" className="mb-10 max-w-2xl font-display text-[32px] leading-tight sm:text-4xl">
            Retiralo en el local o te lo mandamos
          </h2>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {DELIVERY_OPTIONS.map(({ icon: Icon, title, body, price }, i) => (
              <li
                key={title}
                className={`card-rest flex flex-col gap-3 rounded-lg border bg-white p-7 ${
                  i === 0 ? 'border-[var(--brand-brass)]' : 'border-[var(--amancay-border)]'
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-brass)] bg-[var(--bg-page)]">
                  <Icon className="h-5 w-5 text-[var(--brand-leather)]" aria-hidden="true" />
                </span>
                <h3 className="font-display text-[22px]">{title}</h3>
                <p className="leading-relaxed text-[var(--ink-muted)]">{body}</p>
                <p className="mt-auto pt-2 text-[17px] font-semibold tabular-nums text-[var(--brand-olive)]">{price}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <BrandsTicker />

      <section aria-labelledby="faq-title" className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
          <div className="lg:col-span-4">
            <h2 id="faq-title" className="font-display text-[32px] leading-tight sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-[var(--ink-muted)]">
              ¿No está tu duda? Escribinos al{' '}
              <a href={whatsappUrl('Hola Amancay, tengo una consulta.')} className="link-brass" target="_blank" rel="noopener noreferrer">
                {STORE.whatsappDisplay}
              </a>
              .
            </p>
          </div>
          <div className="divide-y divide-[var(--amancay-border)] border-y border-[var(--amancay-border)] lg:col-span-8">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--amancay-border)] font-sans text-lg text-[var(--brand-leather)] transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-4 pr-12 leading-relaxed text-[var(--ink-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
