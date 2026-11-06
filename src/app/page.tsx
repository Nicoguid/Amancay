import { Store, Bike, Truck } from 'lucide-react';
import { HeroBannerCarousel } from '@/components/HeroBannerCarousel';
import { CategoryStorySlider } from '@/components/CategoryStorySlider';
import { BrandsTicker } from '@/components/MarqueeTicker';
import { BestSellers, CategoryCarousel } from '@/components/HomeProducts';
import { PromoCallout } from '@/components/PromoCallout';
import { SHIPPING_RATES, STORE, formatPrice } from '@/lib/storeConfig';

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
    q: '¿Hay descuento por transferencia?',
    a: `Sí, ${STORE.transferDiscountPct} % sobre el total de productos.`,
  },
  {
    q: '¿Puedo comprar por WhatsApp?',
    a: `Sí. Armá el carrito y tocá “Pedir por WhatsApp”, o escribinos al ${STORE.whatsappDisplay}.`,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col bg-[var(--bg-page)] text-[var(--ink-primary)]">
      <h1 className="sr-only">Perfumería Amancay: mates, bombillas y perfumes en Almagro</h1>

      <HeroBannerCarousel />
      <BestSellers />
      <CategoryStorySlider />
      <CategoryCarousel rubro="mates" />
      <CategoryCarousel rubro="bombillas" />
      <BrandsTicker />
      <CategoryCarousel rubro="perfumes" />
      <PromoCallout />

      <section id="como-comprar" aria-labelledby="entrega-title" className="border-b border-[var(--amancay-border)] bg-[var(--bg-subtle)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="entrega-title" className="mb-8 font-display text-3xl tracking-tight sm:text-4xl">
            Retiro y envíos
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {DELIVERY_OPTIONS.map(({ icon: Icon, title, body, price }) => (
              <li key={title} className="space-y-3 rounded-xl border border-[var(--amancay-border)] bg-white p-6">
                <Icon className="h-6 w-6 text-[var(--ink-accent)]" aria-hidden="true" />
                <h3 className="font-display text-xl">{title}</h3>
                <p className="leading-relaxed text-[var(--ink-muted)]">{body}</p>
                <p className="font-semibold tabular-nums text-[var(--amancay-emerald)]">{price}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 id="faq-title" className="mb-8 font-display text-3xl tracking-tight sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <div className="divide-y divide-[var(--amancay-border)] border-y border-[var(--amancay-border)]">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-2">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span aria-hidden="true" className="text-xl text-[var(--ink-accent)] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 leading-relaxed text-[var(--ink-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
