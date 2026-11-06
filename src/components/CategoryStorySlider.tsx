import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductImage } from './ProductImage';

const CATEGORIES = [
  {
    slug: 'mates',
    name: 'Mates',
    subtitle: 'Imperiales, camioneros y torpedos en calabaza y algarrobo.',
    image: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'bombillas',
    name: 'Bombillas',
    subtitle: 'Alpaca y acero inoxidable: pico de loro, chatas y desarmables.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'perfumes',
    name: 'Perfumes',
    subtitle: 'Fragancias de la casa y marcas nacionales.',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  },
];

export function CategoryStorySlider() {
  return (
    <section aria-labelledby="rubros-title" className="border-b border-[var(--amancay-border)] bg-[var(--bg-page)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="rubros-title" className="mb-8 font-display text-3xl tracking-tight text-[var(--ink-primary)] sm:text-4xl">
          Comprá por rubro
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/catalogo?rubro=${cat.slug}`}
                className="focus-on-dark group relative flex h-56 flex-col justify-end overflow-hidden rounded-xl bg-[var(--ink-primary)] p-6 sm:h-80"
              >
                <ProductImage
                  src={cat.image}
                  alt=""
                  width={800}
                  height={600}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-70 transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/60 to-transparent" aria-hidden="true" />
                <span className="relative space-y-1.5 text-white">
                  <span className="block font-display text-3xl">{cat.name}</span>
                  <span className="block text-sm text-white/85">{cat.subtitle}</span>
                  <span className="flex items-center gap-1.5 pt-2 text-sm font-semibold text-[var(--amancay-gold-light)]">
                    Ver {cat.name.toLowerCase()}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
